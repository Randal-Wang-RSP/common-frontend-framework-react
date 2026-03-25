#!/usr/bin/env node
/**
 * @fileoverview Execute the full git workflow: add → commit → push.
 *
 * Uses `git commit -F <file>` to completely bypass shell escaping issues.
 * Returns structured JSON with each step's result for easy error handling.
 *
 * @example
 * // Full workflow with message file:
 * node git-workflow.js --all --message-file /tmp/msg.txt --push
 *
 * // Specific files, inline message, dry run:
 * node git-workflow.js --files "src/a.ts,src/b.ts" --message "feat: quick fix" --dry-run
 *
 * @example Output (JSON):
 * {
 *   "dryRun": false,
 *   "add":    { "success": true, "files": ["."] },
 *   "commit": { "success": true, "hash": "abc1234" },
 *   "push":   { "success": true }
 * }
 */

import { execGit, cleanupTempFile, outputResult } from './utils.js';

/**
 * @typedef {Object} WorkflowArgs
 * @property {string[]} [files]       - File paths to stage
 * @property {boolean}  all           - Stage all changes (`git add .`)
 * @property {string}   [messageFile] - Path to commit message file
 * @property {string}   [message]     - Inline commit message
 * @property {boolean}  push          - Whether to push after commit
 * @property {boolean}  dryRun        - Show plan without executing
 */

/**
 * Parse CLI arguments into a structured config.
 *
 * @param   {string[]} args - `process.argv.slice(2)`
 * @returns {WorkflowArgs}
 */
function parseArgs(args) {
  const idx = (flag) => args.indexOf(flag);

  /** @type {WorkflowArgs} */
  const result = {
    all: args.includes('--all'),
    push: args.includes('--push'),
    dryRun: args.includes('--dry-run'),
  };

  const filesIdx = idx('--files');
  if (filesIdx >= 0 && args[filesIdx + 1]) {
    result.files = args[filesIdx + 1].split(',').map((f) => f.trim());
  }

  const msgFileIdx = idx('--message-file');
  if (msgFileIdx >= 0 && args[msgFileIdx + 1]) {
    result.messageFile = args[msgFileIdx + 1];
  }

  const msgIdx = idx('--message');
  if (msgIdx >= 0 && args[msgIdx + 1]) {
    result.message = args[msgIdx + 1];
  }

  return result;
}

/**
 * Execute the add → commit → push workflow.
 *
 * @param   {WorkflowArgs} args
 * @returns {Promise<import('./utils.js').WorkflowResult>}
 */
async function executeWorkflow(args) {
  /** @type {import('./utils.js').WorkflowResult} */
  const result = {
    dryRun: args.dryRun,
    add: { success: false, files: [] },
    commit: { success: false },
  };

  // ── Determine files to stage ───────────────────────────────────
  const filesToAdd = args.all ? ['.'] : (args.files || []);
  if (filesToAdd.length === 0) {
    result.add.error = 'No files specified (use --files or --all)';
    return result;
  }

  // ── Dry run: return immediately ────────────────────────────────
  if (args.dryRun) {
    result.add = { success: true, files: filesToAdd };
    result.commit = {
      success: true,
      message: 'DRY RUN — no actual commit',
    };
    if (args.push) result.push = { success: true };
    return result;
  }

  // ── git add ────────────────────────────────────────────────────
  const addResult = await execGit(`git add ${filesToAdd.join(' ')}`);
  if (!addResult.success) {
    result.add.error = addResult.error || addResult.stderr;
    return result;
  }
  result.add = { success: true, files: filesToAdd };

  // ── git commit ─────────────────────────────────────────────────
  if (!args.messageFile && !args.message) {
    result.commit.error =
      'No commit message (use --message-file or --message)';
    return result;
  }

  // Always use -F <file> to avoid shell escaping issues
  let messageFile = args.messageFile;
  let tempMessageFile = null;
  if (!messageFile && args.message) {
    tempMessageFile = writeTempFile(args.message);
    messageFile = tempMessageFile;
  }

  const commitCmd = `git commit -F "${messageFile}"`;
  const commitResult = await execGit(commitCmd);

  // Clean up temp file regardless of success
  if (args.messageFile) cleanupTempFile(args.messageFile);
  if (tempMessageFile) cleanupTempFile(tempMessageFile);

  if (!commitResult.success) {
    const err =
      commitResult.stderr || commitResult.error || 'Commit failed';

    // Translate well-known commitlint errors
    if (err.includes('subject may not be longer than')) {
      result.commit.error = 'Commitlint: Title exceeds 100 characters';
    } else if (
      err.includes("body's lines must not be longer than")
    ) {
      result.commit.error =
        'Commitlint: Body line exceeds 72 characters';
    } else {
      result.commit.error = err;
    }
    return result;
  }

  // Extract short hash from output like "[main abc1234] feat: ..."
  const hashMatch = commitResult.stdout.match(
    /\[[\w/-]+\s+([a-f0-9]+)\]/,
  );
  result.commit = {
    success: true,
    hash: hashMatch ? hashMatch[1] : undefined,
    message: commitResult.stdout,
  };

  // ── git push (optional) ────────────────────────────────────────
  if (args.push) {
    result.push = { success: false };

    const pushResult = await execGit('git push');
    if (!pushResult.success) {
      const err =
        pushResult.stderr || pushResult.error || 'Push failed';

      if (
        err.includes('rejected') ||
        err.includes('non-fast-forward')
      ) {
        result.push.suggestion =
          'Remote has new commits. Try: git pull --rebase';
      } else if (err.includes('no upstream branch')) {
        result.push.suggestion =
          'No upstream. Try: git push -u origin <branch>';
      } else if (
        err.includes('Permission denied') ||
        err.includes('authentication')
      ) {
        result.push.suggestion =
          'Auth failed. Check credentials or SSH keys';
      }

      result.push.error = err;
      return result;
    }

    result.push.success = true;
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await executeWorkflow(args);
    outputResult(result);

    const ok =
      result.add.success &&
      result.commit.success &&
      (!result.push || result.push.success);
    process.exit(ok ? 0 : 1);
  } catch (error) {
    outputResult({
      dryRun: false,
      add: { success: false, files: [], error: error.message },
      commit: { success: false, error: error.message },
    });
    process.exit(1);
  }
}

main();
