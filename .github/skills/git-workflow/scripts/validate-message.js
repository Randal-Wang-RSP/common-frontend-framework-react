#!/usr/bin/env node
/**
 * @fileoverview Validate a commit message against conventional commit rules.
 *
 * Checks: title length (≤100), body line length (≤72), conventional format,
 * imperative mood, no trailing period.
 *
 * @example
 * // Via --message flag:
 * node validate-message.js --message "feat(auth): add login"
 *
 * // Via stdin:
 * echo "feat(auth): add login" | node validate-message.js
 *
 * @example Output (JSON):
 * {
 *   "valid": true,
 *   "title": { "content": "feat(auth): add login", "length": 21, "valid": true },
 *   "bodyLines": [],
 *   "errors": []
 * }
 */

import {
  LIMITS,
  parseCommitMessage,
  isImperativeMood,
  hasPeriod,
  outputResult,
} from './utils.js';

/**
 * Read plain-text commit message from `--message` arg or stdin.
 *
 * @param   {string[]} args - CLI arguments
 * @returns {Promise<string>}
 */
async function readMessage(args) {
  const idx = args.indexOf('--message');
  if (idx >= 0 && args[idx + 1]) {
    return args[idx + 1];
  }

  if (process.stdin.isTTY) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8').trim());
    });
    process.stdin.on('error', reject);
  });
}

/**
 * Validate a commit message and return a structured result.
 *
 * @param   {string} message - Full commit message text
 * @returns {import('./utils.js').ValidationResult}
 */
function validateMessage(message) {
  /** @type {string[]} */
  const errors = [];
  const { title, bodyLines } = parseCommitMessage(message);

  // ── Title checks ───────────────────────────────────────────────
  const titleLength = title.length;
  const titleValidLength = titleLength > 0 && titleLength <= LIMITS.TITLE_MAX;

  if (titleLength === 0) {
    errors.push('Title is empty');
  } else if (titleLength > LIMITS.TITLE_MAX) {
    errors.push(
      `Title exceeds ${LIMITS.TITLE_MAX} characters (${titleLength} chars)`,
    );
  }

  if (hasPeriod(title)) {
    errors.push('Title should not end with a period');
  }

  if (!isImperativeMood(title)) {
    errors.push(
      'Title should use imperative mood ' +
      '(e.g., "add" not "added" or "adds")',
    );
  }

  const conventionalPattern =
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([a-z0-9-]+\))?:\s.+/;
  if (!conventionalPattern.test(title)) {
    errors.push(
      'Title does not follow conventional commit format: ' +
      '<type>[scope]: <description>',
    );
  }

  // ── Body line checks ──────────────────────────────────────────
  const bodyLinesData = bodyLines.map((line, index) => {
    const length = line.length;
    const valid = length <= LIMITS.BODY_LINE_MAX;

    if (!valid) {
      errors.push(
        `Body line ${index + 2} exceeds ` +
        `${LIMITS.BODY_LINE_MAX} characters ` +
        `(${length} chars): "${line.substring(0, 30)}..."`,
      );
    }

    return { line: index + 2, content: line, length, valid };
  });

  return {
    valid: errors.length === 0,
    title: {
      content: title,
      length: titleLength,
      valid: titleValidLength && !hasPeriod(title),
    },
    bodyLines: bodyLinesData,
    errors,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = process.argv.slice(2);
    const message = await readMessage(args);

    if (!message) {
      outputResult({ valid: false, errors: ['No commit message provided'] });
      process.exit(1);
    }

    const result = validateMessage(message);
    outputResult(result);
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    outputResult({ valid: false, errors: [error.message] });
    process.exit(1);
  }
}

main();
