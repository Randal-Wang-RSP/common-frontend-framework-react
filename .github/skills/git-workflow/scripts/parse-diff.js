#!/usr/bin/env node
/**
 * @fileoverview Parse git diff and generate a structured change summary.
 *
 * Runs `git diff --name-status` and `git diff --numstat` to produce a
 * machine-readable JSON report of all changed files with line counts.
 *
 * @example
 * // Staged changes:
 * node parse-diff.js --staged
 *
 * // Specific files:
 * node parse-diff.js --files "src/app.ts,src/utils.ts"
 *
 * @example Output (JSON):
 * {
 *   "success": true,
 *   "files": [
 *     { "path": "src/app.ts", "status": "M", "additions": 10, "deletions": 3 }
 *   ],
 *   "stats": { "totalFiles": 1, "totalAdditions": 10, "totalDeletions": 3 },
 *   "summary": "1 files changed: 1 modified (+10 -3 lines)"
 * }
 */

import { execGit, outputResult } from './utils.js';

/**
 * Build a human-readable summary from file changes.
 *
 * @param   {import('./utils.js').FileChange[]} files
 * @param   {number} additions
 * @param   {number} deletions
 * @returns {string}
 */
function generateSummary(files, additions, deletions) {
  if (files.length === 0) return 'No changes detected';

  const counts = files.reduce(
    (acc, f) => {
      const key = f.status[0].toLowerCase();
      if (key === 'a') acc.added++;
      else if (key === 'd') acc.deleted++;
      else if (key === 'm') acc.modified++;
      else if (key === 'r') acc.renamed++;
      return acc;
    },
    { added: 0, modified: 0, deleted: 0, renamed: 0 },
  );

  const parts = [];
  if (counts.modified > 0) parts.push(`${counts.modified} modified`);
  if (counts.added > 0) parts.push(`${counts.added} added`);
  if (counts.deleted > 0) parts.push(`${counts.deleted} deleted`);
  if (counts.renamed > 0) parts.push(`${counts.renamed} renamed`);

  return (
    `${files.length} files changed: ` +
    `${parts.join(', ')} (+${additions} -${deletions} lines)`
  );
}

/**
 * Parse git diff output into structured data.
 *
 * @param   {string[]} args - CLI arguments
 * @returns {Promise<import('./utils.js').DiffResult>}
 */
async function parseDiff(args) {
  const isStaged = args.includes('--staged');
  const filesIndex = args.indexOf('--files');
  const filesArg = filesIndex >= 0 ? args[filesIndex + 1] : null;

  let diffBase = 'git diff';
  if (isStaged) diffBase += ' --staged';
  if (filesArg) {
    const files = filesArg.split(',').map((f) => f.trim());
    diffBase += ' ' + files.join(' ');
  }

  // ── File status ────────────────────────────────────────────────
  const statusResult = await execGit(`${diffBase} --name-status`);
  if (!statusResult.success) {
    return {
      success: false,
      files: [],
      stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
      summary: '',
      error: statusResult.error || 'Failed to get file status',
    };
  }

  /** @type {Map<string, string>} */
  const statusMap = new Map();
  statusResult.stdout
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      const [status, ...pathParts] = line.split(/\s+/);
      statusMap.set(pathParts.join(' '), status);
    });

  // ── Numeric stats ──────────────────────────────────────────────
  const statResult = await execGit(`${diffBase} --numstat`);
  if (!statResult.success) {
    return {
      success: false,
      files: [],
      stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
      summary: '',
      error: statResult.error || 'Failed to get file stats',
    };
  }

  /** @type {import('./utils.js').FileChange[]} */
  const files = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  statResult.stdout
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      const [additions, deletions, ...pathParts] = line.split(/\s+/);
      const path = pathParts.join(' ');
      const addNum = additions === '-' ? 0 : parseInt(additions, 10) || 0;
      const delNum = deletions === '-' ? 0 : parseInt(deletions, 10) || 0;

      totalAdditions += addNum;
      totalDeletions += delNum;

      files.push({
        path,
        status: statusMap.get(path) || 'M',
        additions: addNum,
        deletions: delNum,
      });
    });

  return {
    success: true,
    files,
    stats: { totalFiles: files.length, totalAdditions, totalDeletions },
    summary: generateSummary(files, totalAdditions, totalDeletions),
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = process.argv.slice(2);

    // Quick check: anything tracked?
    const isStaged = args.includes('--staged');
    const diffCmd = isStaged
      ? 'git diff --staged --name-only'
      : 'git diff --name-only';

    const check = await execGit(diffCmd);
    if (!check.success) {
      outputResult({
        success: false,
        files: [],
        stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
        summary: '',
        error: 'Failed to check git diff',
      });
      process.exit(1);
    }

    if (!check.stdout.trim()) {
      outputResult({
        success: true,
        files: [],
        stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
        summary: isStaged
          ? 'No staged tracked changes to parse'
          : 'No tracked changes to parse',
      });
      process.exit(0);
    }

    const result = await parseDiff(args);
    outputResult(result);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    outputResult({
      success: false,
      files: [],
      stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
      summary: '',
      error: error.message,
    });
    process.exit(1);
  }
}

main();
