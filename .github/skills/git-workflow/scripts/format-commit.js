#!/usr/bin/env node
/**
 * @fileoverview Format a structured commit message and write to a temp file.
 *
 * Accepts JSON `{ title, paragraphs }`, validates all limits, and on success
 * writes the formatted message to a temporary file for use with
 * `git commit -F <file>`.
 *
 * @example
 * // Via --data argument:
 * node format-commit.js --data '{"title":"feat: add","paragraphs":["Changes:\\n- Item"]}'
 *
 * // Via stdin:
 * echo '{"title":"feat: add","paragraphs":[]}' | node format-commit.js
 *
 * @example Output (JSON):
 * {
 *   "valid": true,
 *   "messageFilePath": "/tmp/git-commit-xxxxx/message.txt",
 *   "formattedMessage": "feat: add\n\nChanges:\n- Item",
 *   "errors": []
 * }
 */

import {
  LIMITS,
  parseCommitMessage,
  isImperativeMood,
  hasPeriod,
  writeTempFile,
  readInput,
  outputResult,
} from './utils.js';

/**
 * Validate structured input and format into a complete commit message.
 *
 * @param   {import('./utils.js').FormatInput} input
 * @returns {import('./utils.js').FormatResult}
 */
function validateAndFormat(input) {
  /** @type {string[]} */
  const errors = [];
  const { title, paragraphs } = input;

  // ── Title validation ───────────────────────────────────────────
  if (!title) {
    errors.push('Title is required');
  } else {
    if (title.length > LIMITS.TITLE_MAX) {
      errors.push(
        `Title exceeds ${LIMITS.TITLE_MAX} characters ` +
        `(${title.length} chars)`,
      );
    }
    if (hasPeriod(title)) {
      errors.push('Title should not end with a period');
    }
    if (!isImperativeMood(title)) {
      errors.push(
        'Title should use imperative mood ' +
        '(e.g., "add" not "added")',
      );
    }

    const conventionalPattern =
      /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([a-z0-9-]+\))?:\s.+/;
    if (!conventionalPattern.test(title)) {
      errors.push('Title must follow format: <type>[scope]: <description>');
    }
  }

  // ── Build formatted message ────────────────────────────────────
  const parts = [title];

  if (paragraphs && paragraphs.length > 0) {
    parts.push(''); // blank line after title

    const formatted = paragraphs
      .filter((p) => p.trim())
      .join('\n\n');

    parts.push(formatted);
  }

  const formattedMessage = parts.join('\n');

  // ── Body line validation ───────────────────────────────────────
  const { bodyLines } = parseCommitMessage(formattedMessage);
  bodyLines.forEach((line, index) => {
    if (line.length > LIMITS.BODY_LINE_MAX) {
      errors.push(
        `Body line ${index + 2} exceeds ` +
        `${LIMITS.BODY_LINE_MAX} characters ` +
        `(${line.length} chars): "${line.substring(0, 40)}..."`,
      );
    }
  });

  const valid = errors.length === 0;

  // ── Write temp file (only if valid) ────────────────────────────
  /** @type {string | undefined} */
  let messageFilePath;
  if (valid) {
    try {
      messageFilePath = writeTempFile(formattedMessage);
    } catch (error) {
      errors.push(`Failed to write temp file: ${error.message}`);
      return { valid: false, formattedMessage, errors };
    }
  }

  return { valid, messageFilePath, formattedMessage, errors };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = process.argv.slice(2);
    const input = await readInput(args);

    if (!input || typeof input !== 'object') {
      outputResult({
        valid: false,
        formattedMessage: '',
        errors: [
          'Invalid input: expected JSON ' +
          '{ title: string, paragraphs: string[] }',
        ],
      });
      process.exit(1);
    }

    if (!input.title || typeof input.title !== 'string') {
      outputResult({
        valid: false,
        formattedMessage: '',
        errors: ['Missing or invalid "title" field (must be a string)'],
      });
      process.exit(1);
    }

    if (input.paragraphs && !Array.isArray(input.paragraphs)) {
      outputResult({
        valid: false,
        formattedMessage: '',
        errors: ['"paragraphs" must be an array of strings'],
      });
      process.exit(1);
    }

    const result = validateAndFormat(input);
    outputResult(result);
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    outputResult({
      valid: false,
      formattedMessage: '',
      errors: [error.message],
    });
    process.exit(1);
  }
}

main();
