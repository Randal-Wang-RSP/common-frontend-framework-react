#!/usr/bin/env node
/**
 * @fileoverview Create a pull request on Bitbucket.
 *
 * Reads the Bitbucket remote URL from `git remote get-url origin`, calls the
 * Bitbucket REST API using configured credentials, and falls back to a
 * browser URL when credentials are unavailable.
 *
 * @example
 * // Create PR targeting Development branch:
 * node create-pr.js --target Development
 *
 * // Create PR with custom title:
 * node create-pr.js --target main --title "feat: my feature"
 *
 * // Dry run (show what would be sent):
 * node create-pr.js --target Development --dry-run
 *
 * @example Output (JSON):
 * {
 *   "success": true,
 *   "source": "feature/setup",
 *   "target": "Development",
 *   "url": "https://bitbucket.org/rspcode/repo/pull-requests/42",
 *   "title": "feat: add login"
 * }
 */

import { readFileSync } from 'fs';
import { execGit, outputResult, detectBitbucketRemote, buildAuthHeader, httpsPost, httpsPut } from './utils.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} RemoteInfo
 * @property {string}  owner   - Bitbucket workspace
 * @property {string}  repo    - Repository slug
 * @property {string}  rawUrl  - Original remote URL
 * @property {boolean} valid   - Whether the URL is a recognised Bitbucket remote
 */

/**
 * @typedef {Object} PrArgs
 * @property {string}  target    - Target branch (e.g. "Development", "main")
 * @property {string}  [title]       - PR title override (auto-generated when omitted)
 * @property {string}  [summary]     - Natural-language overview paragraph inserted at the top of
 *                                     the Summary section (AI-generated; grouped changelog follows)
 * @property {string}  [description] - Full PR description override (template-filled when omitted)
 * @property {number}  [prId]        - Existing PR id; when set, updates rather than creates
 * @property {boolean} dryRun    - Print payload without calling the API
 */

/**
 * @typedef {Object} PrResult
 * @property {boolean}  success
 * @property {string}   source
 * @property {string}   target
 * @property {string}   [url]         - PR URL (when created or fallback link)
 * @property {string}   [fallbackUrl] - Browser URL when credentials are absent
 * @property {string}   title
 * @property {string}   [error]
 */

// ─── CLI Parsing ─────────────────────────────────────────────────────

/**
 * Parse process.argv into a PrArgs object.
 *
 * @param   {string[]} args
 * @returns {PrArgs}
 */
function parseArgs(args) {
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : undefined;
  };

  const target = get('--target');
  if (!target) {
    outputResult({ success: false, error: 'Missing required --target argument (e.g. --target Development)' });
    process.exit(1);
  }

  // Normalize CLI escape sequences (e.g. literal \n → newline) so that
  // multi-line descriptions passed via --description on Windows shells work
  // correctly when the terminal doesn't expand escape sequences.
  const rawDescription = get('--description') ?? '';
  const description = rawDescription.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

  return {
    target,
    title:       get('--title'),
    summary:     get('--summary'),
    description,
    prId:        (() => {
      const raw = get('--pr-id');
      if (raw === undefined) return undefined;
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        outputResult({ success: false, error: 'Invalid --pr-id value. It must be a positive integer (e.g. --pr-id 42).' });
        process.exit(1);
      }
      return parsed;
    })(),
    dryRun:      args.includes('--dry-run'),
  };
}

// ─── Git Helpers ─────────────────────────────────────────────────────

/**
 * Get the current branch name.
 *
 * @returns {Promise<string>}
 */
async function currentBranch() {
  const result = await execGit('git rev-parse --abbrev-ref HEAD');
  return result.success ? result.stdout : 'HEAD';
}

/**
 * Get the latest commit subject line.
 *
 * @returns {Promise<string>}
 */
async function latestCommitSubject() {
  const result = await execGit('git log -1 --format=%s');
  return result.success ? result.stdout : '';
}

/**
 * Get all commit subject lines on the current branch that are not yet
 * in the target branch, ordered oldest → newest.
 *
 * Tries `git merge-base` first; falls back to `origin/<target>..HEAD`.
 *
 * @param   {string} target  - e.g. "Development"
 * @returns {Promise<string[]>}
 */
async function commitsSinceMergeBase(target) {
  const mbResult = await execGit(`git merge-base HEAD origin/${target}`);
  if (mbResult.success && mbResult.stdout.trim()) {
    const base = mbResult.stdout.trim();
    const log  = await execGit(`git log ${base}..HEAD --format=%s --reverse`);
    if (log.success && log.stdout.trim()) {
      return log.stdout.trim().split('\n').filter(Boolean);
    }
  }
  // Fallback: compare directly against remote tracking branch
  const log = await execGit(`git log origin/${target}..HEAD --format=%s --reverse`);
  if (log.success && log.stdout.trim()) {
    return log.stdout.trim().split('\n').filter(Boolean);
  }
  // Last resort: just the latest commit
  const latest = await latestCommitSubject();
  return latest ? [latest] : [];
}

// ─── PR Content Generation ───────────────────────────────────────────

/** Conventional commit type regex (captures type and optional scope). */
const COMMIT_TYPE_RE = /^(feat|fix|refactor|chore|docs|test|ci|build|style|perf)(\([^)]+\))?[!]?:\s*/;

/** Conventional commit type priority order (highest → lowest). */
const COMMIT_TYPE_PRIORITY = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'ci', 'build', 'style', 'chore'];

/**
 * Derive a PR title that summarises all changes by grouping commits into
 * their affected scopes, giving a broad overview rather than spotlighting
 * one representative commit.
 *
 * Rules:
 *  - 1 commit             → use the commit subject as-is
 *  - 2–3 commits, ≤72ch   → join stripped descriptions with "; "
 *  - Otherwise            → dominant-type(branch-scope): area1(N), area2(M), and area3
 *                           where each "area" is a commit scope (top 3 by frequency)
 *
 * @param   {string[]} commits  - Commit subjects oldest → newest
 * @param   {string}   branch   - Source branch name
 * @param   {string}   target   - Target branch name
 * @returns {string}
 */
function generatePrTitle(commits, branch, target) {
  if (commits.length === 0) return `PR: ${branch} → ${target}`;
  if (commits.length === 1) return commits[0];

  const parsed = commits.map((c) => ({
    type:  c.match(COMMIT_TYPE_RE)?.[1] ?? 'chore',
    scope: c.match(COMMIT_TYPE_RE)?.[2]?.replace(/[()]/g, '') ?? null,
    desc:  c.replace(COMMIT_TYPE_RE, '').trim(),
  }));

  // Dominant type by conventional-commit priority
  const types    = [...new Set(parsed.map((p) => p.type))];
  const dominant = COMMIT_TYPE_PRIORITY.find((t) => types.includes(t)) ?? 'chore';

  // Branch-level scope (strip prefix like "feature/")
  const branchScope = branch.replace(/^(?:feature|feat|fix|bugfix|hotfix)\//, '');

  if (commits.length <= 3) {
    const joined    = parsed.map((p) => p.desc).join('; ');
    const candidate = `${dominant}(${branchScope}): ${joined}`;
    if (candidate.length <= 72) return candidate;
  }

  // Group commits by their conventional-commit scope, count occurrences
  // Ignore commits without a scope (they spread across areas)
  const scopeCount = new Map();
  for (const { scope } of parsed) {
    if (!scope) continue;
    scopeCount.set(scope, (scopeCount.get(scope) ?? 0) + 1);
  }

  // Top 3 named scopes by commit count; annotate with count when >1
  const topScopes = [...scopeCount.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([scope, n]) => (n > 1 ? `${scope}(${n})` : scope));

  // If no scoped commits at all, fall back to type-level summary
  if (topScopes.length === 0) {
    const typeList = [...new Set(parsed.map((p) => p.type))].slice(0, 3).join(', ');
    return `${dominant}(${branchScope}): ${typeList} changes`;
  }

  const areaSummary = topScopes.length >= 3
    ? `${topScopes.slice(0, -1).join(', ')}, and ${topScopes.at(-1)}`
    : topScopes.join(' and ');

  const candidate = `${dominant}(${branchScope}): ${areaSummary} changes`;
  if (candidate.length <= 72) return candidate;

  // Safety fallback if still too long
  return `${dominant}(${branchScope}): ${topScopes[0]}, ${topScopes[1] ?? '...'} (+more)`;
}

/**
 * Build a PR description by filling in `.bitbucket/pull_request_template.md`.
 *
 * Summary strategy:
 *  - When `summary` is supplied, it becomes the opening paragraph of the Summary section
 *  - Commits are grouped by their conventional-commit scope as a changelog below the summary
 *  - Each group gets a heading + bullet list of stripped descriptions
 *  - Commits without a scope are collected under a "General" group
 *  - **Type** is filled with the single dominant type (not a slash list)
 *  - The placeholder blockquote and type hint in the template are replaced
 *
 * Falls back to a grouped plain-text block when the template is not found.
 *
 * @param   {string[]}        commits - Commit subjects oldest → newest
 * @param   {string|undefined} summary - AI-generated natural-language overview (optional)
 * @returns {Promise<string>}
 */
async function buildPrDescription(commits, summary) {
  const rootResult = await execGit('git rev-parse --show-toplevel');
  const repoRoot   = rootResult.success ? rootResult.stdout.trim() : process.cwd();

  let template = '';
  for (const p of [`${repoRoot}/.bitbucket/pull_request_template.md`, `${repoRoot}/.github/pull_request_template.md`]) {
    try { template = readFileSync(p, 'utf-8'); break; } catch { /* not found */ }
  }

  // ── Parse commits ────────────────────────────────────────────────
  const parsed = commits.map((c) => ({
    type:  c.match(COMMIT_TYPE_RE)?.[1] ?? 'chore',
    scope: c.match(COMMIT_TYPE_RE)?.[2]?.replace(/[()]/g, '') ?? null,
    desc:  c.replace(COMMIT_TYPE_RE, '').trim(),
    raw:   c,
  }));

  // ── Dominant type (single value) ─────────────────────────────────
  const allTypes   = [...new Set(parsed.map((p) => p.type))];
  const dominant   = COMMIT_TYPE_PRIORITY.find((t) => allTypes.includes(t)) ?? 'chore';

  // ── Group commits by scope ───────────────────────────────────────
  /** @type {Map<string, string[]>} */
  const groups = new Map();
  for (const { scope, desc } of parsed) {
    const key = scope ?? 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(desc);
  }

  // Sort groups: named scopes (alpha) first, "General" always last
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === 'General') return 1;
    if (b === 'General') return -1;
    return a.localeCompare(b);
  });

  // Build grouped markdown
  const groupedBody = sortedKeys.map((key) => {
    const items = groups.get(key).map((d) => `- ${d}`).join('\n');
    return `**${key}**\n${items}`;
  }).join('\n\n');

  // Compose the summary block: AI overview (if provided) above the grouped changelog
  const summaryBlock = summary
    ? `${summary.trim()}\n\n${groupedBody}`
    : groupedBody;

  if (!template) {
    return summaryBlock;
  }

  return template
    // Replace the blockquote placeholder line with summary block (overview + grouped changelog)
    .replace(
      /^> Please briefly.*$/m,
      summaryBlock,
    )
    // Remove the second blockquote line (bug reproduction steps hint)
    .replace(/\r?\n> .*reproduction steps\.\r?\n/g, '\n')
    // Fill **Type**: with dominant type only; drop the hint line below it
    .replace(
      /\*\*Type\*\*:\s*\r?\n\r?\n_\(feat.*?\)_/s,
      `**Type**: ${dominant}`,
    );
}

// ─── Provider Implementations ────────────────────────────────────────

async function createPr(remote, source, args, title, description) {
  const fallbackUrl =
    `https://bitbucket.org/${remote.owner}/${remote.repo}/pull-requests/new` +
    `?source=${encodeURIComponent(source)}&dest=${encodeURIComponent(args.target)}&t=1`;

  const payload = {
    title,
    description,
    source:      { branch: { name: source } },
    destination: { branch: { name: args.target } },
    close_source_branch: false,
  };

  if (args.dryRun) {
    return {
      success: true,
      source,
      target: args.target,
      title,
      url: fallbackUrl,
      dryRun: true,
      payload,
    };
  }

  const authHeader = buildAuthHeader();

  if (!authHeader) {
    const missing = [];
    if (!process.env.BITBUCKET_EMAIL) missing.push('BITBUCKET_EMAIL');
    if (!process.env.BITBUCKET_TOKEN) missing.push('BITBUCKET_TOKEN');
    return {
      success: false,
      source,
      target: args.target,
      title,
      fallbackUrl,
      error:
        `Missing env var(s): ${missing.join(', ')}\n` +
        '\n' +
        '⚠️  Use a Bitbucket Cloud API Token (NOT an Atlassian Account token from id.atlassian.com).\n' +
        '   Tokens starting with ATATT3x… will NOT work with api.bitbucket.org.\n' +
        '\n' +
        'Create a token at: https://bitbucket.org/account/settings/api-tokens/\n' +
        '  Required scopes: Repositories (Read+Write), Pull requests (Read+Write)\n' +
        '\n' +
        'Then add to ~/.bashrc (or ~/.bash_profile):\n' +
        '    export BITBUCKET_EMAIL="your-atlassian-email@example.com"\n' +
        '    export BITBUCKET_TOKEN="your-bitbucket-api-token"\n' +
        'Run: source ~/.bashrc\n' +
        '\n' +
        'Or set both vars in Windows User Environment Variables.\n' +
        `\nOr open the PR manually: ${fallbackUrl}`,
    };
  }

  const isUpdate = typeof args.prId === 'number';
  const url = isUpdate
    ? `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests/${args.prId}`
    : `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests`;

  const { statusCode, body } = isUpdate
    ? await httpsPut(url, payload, authHeader)
    : await httpsPost(url, payload, authHeader);

  const successCode = isUpdate ? 200 : 201;
  if (statusCode === successCode && body?.links?.html?.href) {
    return { success: true, source, target: args.target, title, url: body.links.html.href };
  }

  return {
    success: false,
    source,
    target: args.target,
    title,
    fallbackUrl,
    error: `Bitbucket API returned ${statusCode}: ${body?.error?.message ?? JSON.stringify(body)}`,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────

const args   = parseArgs(process.argv.slice(2));
const remote = await detectBitbucketRemote('origin');
const source = await currentBranch();

if (!remote.valid) {
  outputResult({
    success: false,
    error: `Cannot detect a Bitbucket remote from origin URL: ${remote.rawUrl || '(empty)'}`,
  });
  process.exit(1);
}

const commits     = await commitsSinceMergeBase(args.target);
const title       = args.title       ?? generatePrTitle(commits, source, args.target);
const description = args.description || await buildPrDescription(commits, args.summary);

const result = await createPr(remote, source, args, title, description);

outputResult(result);
process.exit(result.success ? 0 : 1);
