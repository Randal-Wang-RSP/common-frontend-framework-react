#!/usr/bin/env node
/**
 * @fileoverview Add inline or general comments to a Bitbucket Pull Request.
 *
 * Supports both single-comment CLI mode and batch mode via --data JSON.
 * Reuses the same Bitbucket auth mechanism as create-pr.js
 * (BITBUCKET_EMAIL + BITBUCKET_TOKEN, Basic auth).
 *
 * @example Single inline comment:
 * node add-pr-comment.js --pr-id 52 --file src/foo.ts --line 10 --comment "Consider..."
 *
 * @example General PR comment (no file/line):
 * node add-pr-comment.js --pr-id 52 --comment "Overall: looks good"
 *
 * @example Reply to an existing comment (threaded):
 * node add-pr-comment.js --pr-id 52 --parent-id 12345 --comment "Fixed in af4e9ab"
 *
 * @example With AI signature:
 * node add-pr-comment.js --pr-id 52 --comment "Looks good" --signature "🤖 *AI Review — GitHub Copilot*"
 *
 * @example Batch mode (multiple comments):
 * node add-pr-comment.js --pr-id 52 --data '[
 *   { "file": "src/foo.ts", "line": 10, "comment": "Suggestion..." },
 *   { "comment": "General note about the PR" }
 * ]'
 *
 * @example Output (JSON):
 * {
 *   "success": true,
 *   "prId": 52,
 *   "results": [
 *     { "success": true, "id": 12345, "file": "src/foo.ts", "line": 10 },
 *     { "success": true, "id": 12346, "file": null, "line": null }
 *   ],
 *   "summary": { "total": 2, "succeeded": 2, "failed": 0 }
 * }
 */

import { outputResult, detectBitbucketRemote, buildAuthHeader, httpsPost } from './utils.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} CommentInput
 * @property {string}  comment  - Markdown content of the comment
 * @property {string}  [file]   - File path relative to repo root (for inline comments)
 * @property {number}  [line]   - Line number in the new file version (for inline comments)
 * @property {number}  [parentId] - Parent comment ID (for threaded replies)
 */

/**
 * @typedef {Object} CommentResult
 * @property {boolean}     success
 * @property {number}      [id]      - Bitbucket comment ID (when created)
 * @property {string|null} file
 * @property {number|null} line
 * @property {string}      [error]
 */

/**
 * @typedef {Object} BatchResult
 * @property {boolean}         success  - true if ALL comments succeeded
 * @property {number}          prId
 * @property {CommentResult[]} results
 * @property {{ total: number, succeeded: number, failed: number }} summary
 */

// ─── CLI Parsing ─────────────────────────────────────────────────────

/**
 * Parse CLI args into prId + array of CommentInput + optional signature.
 *
 * @param   {string[]} args
 * @returns {{ prId: number, comments: CommentInput[], signature: string|null }}
 */
function parseArgs(args) {
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
  };

  const prIdStr = get('--pr-id');
  if (!prIdStr) {
    outputResult({ success: false, error: 'Missing required --pr-id argument' });
    process.exit(1);
  }
  const prId = Number(prIdStr);
  if (isNaN(prId) || prId <= 0 || !Number.isInteger(prId)) {
    outputResult({ success: false, error: `Invalid --pr-id: "${prIdStr}" is not a positive integer` });
    process.exit(1);
  }

  // Batch mode: --data '<json array>'
  const dataStr = get('--data');
  const signature = get('--signature') || null;

  if (dataStr) {
    try {
      const parsed = JSON.parse(dataStr);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const invalid = items.filter((item, i) => !item.comment);
      if (invalid.length > 0) {
        outputResult({ success: false, error: `${invalid.length} item(s) in --data missing required "comment" field` });
        process.exit(1);
      }
      return { prId, comments: items, signature };
    } catch (e) {
      outputResult({ success: false, error: `Invalid JSON in --data: ${e.message}` });
      process.exit(1);
    }
  }

  // Single comment mode
  const rawComment = get('--comment');
  if (!rawComment) {
    outputResult({ success: false, error: 'Missing --comment or --data argument' });
    process.exit(1);
  }
  // Convert literal \n sequences to real newlines (shell doesn't interpret them)
  const comment = rawComment.replace(/\\n/g, '\n');

  const file = get('--file') || null;
  const lineStr = get('--line');
  const line = lineStr ? Number(lineStr) : null;
  const parentIdStr = get('--parent-id');
  const parentId = parentIdStr ? Number(parentIdStr) : null;

  return { prId, comments: [{ comment, file, line, parentId }], signature };
}

// ─── Core Logic ──────────────────────────────────────────────────────

/**
 * Post a single comment to a Bitbucket PR.
 *
 * @param   {string} owner    - Bitbucket workspace
 * @param   {string} repo     - Repository slug
 * @param   {number} prId     - PR number
 * @param   {CommentInput} input
 * @param   {Record<string, string>} authHeader
 * @returns {Promise<CommentResult>}
 */
async function postComment(owner, repo, prId, input, authHeader) {
  const url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/pullrequests/${prId}/comments`;

  const payload = {
    content: { raw: input.comment },
  };

  // Add inline positioning if file is specified
  if (input.file) {
    payload.inline = {
      path: input.file,
      ...(input.line != null ? { to: input.line } : {}),
    };
  }

  // Add parent reference for threaded replies
  if (input.parentId) {
    payload.parent = { id: input.parentId };
  }

  try {
    const { statusCode, body } = await httpsPost(url, payload, authHeader);

    if (statusCode === 201 && body?.id) {
      return {
        success: true,
        id: body.id,
        file: input.file || null,
        line: input.line || null,
      };
    }

    return {
      success: false,
      file: input.file || null,
      line: input.line || null,
      error: `API returned ${statusCode}: ${body?.error?.message ?? JSON.stringify(body)}`,
    };
  } catch (e) {
    return {
      success: false,
      file: input.file || null,
      line: input.line || null,
      error: e.message,
    };
  }
}

// ─── Main ────────────────────────────────────────────────────────────

const { prId, comments, signature } = parseArgs(process.argv.slice(2));

const remote = await detectBitbucketRemote();
if (!remote.valid) {
  outputResult({
    success: false,
    error: 'Cannot detect a Bitbucket remote from origin URL',
  });
  process.exit(1);
}

const authHeader = buildAuthHeader();
if (!authHeader) {
  const missing = [];
  if (!process.env.BITBUCKET_EMAIL) missing.push('BITBUCKET_EMAIL');
  if (!process.env.BITBUCKET_TOKEN) missing.push('BITBUCKET_TOKEN');
  outputResult({
    success: false,
    prId,
    error:
      `Missing env var(s): ${missing.join(', ')}\n` +
      'Set BITBUCKET_EMAIL and BITBUCKET_TOKEN.\n' +
      'See create-pr.js documentation for setup instructions.',
  });
  process.exit(1);
}

/** @type {CommentResult[]} */
const results = [];
for (const comment of comments) {
  // Build final content with optional AI signature footer
  const input = signature
    ? { ...comment, comment: `${comment.comment}\n\n---\n${signature}` }
    : comment;
  const result = await postComment(remote.owner, remote.repo, prId, input, authHeader);
  results.push(result);
}

const succeeded = results.filter((r) => r.success).length;
const failed = results.length - succeeded;

outputResult({
  success: failed === 0,
  prId,
  results,
  summary: { total: results.length, succeeded, failed },
});

process.exit(failed === 0 ? 0 : 1);
