/**
 * @fileoverview Shared utilities for git-commit-workflow scripts.
 * Provides constants, type definitions (via JSDoc), and helper functions
 * used across all git workflow scripts.
 *
 * @module utils
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import https from 'https';

const execAsync = promisify(exec);

// ─── Constants ───────────────────────────────────────────────────────

/**
 * Character limits enforced by commitlint and Git conventions.
 * @readonly
 * @type {{ TITLE_MAX: number, BODY_LINE_MAX: number }}
 */
export const LIMITS = Object.freeze({
  /** Maximum characters for commit title (enforced by commitlint) */
  TITLE_MAX: 100,
  /** Maximum characters per body line (Git standard) */
  BODY_LINE_MAX: 72,
});

// ─── Type Definitions (JSDoc) ────────────────────────────────────────

/**
 * @typedef {Object} ValidationResult
 * @property {boolean}  valid  - Whether the commit message passes all checks
 * @property {{ content: string, length: number, valid: boolean }} [title]
 *   Title validation details
 * @property {Array<{ line: number, content: string, length: number, valid: boolean }>} [bodyLines]
 *   Per-line validation for commit body
 * @property {string[]} errors - List of validation error messages
 */

/**
 * @typedef {Object} GitResult
 * @property {boolean} success - Whether the git command succeeded
 * @property {string}  stdout  - Standard output (trimmed)
 * @property {string}  stderr  - Standard error (trimmed)
 * @property {string}  [error] - Error message if command failed
 */

/**
 * @typedef {Object} FormatInput
 * @property {string}   title      - Commit title (e.g. "feat(auth): add login")
 * @property {string[]} paragraphs - Body paragraphs (joined with blank lines)
 */

/**
 * @typedef {Object} FormatResult
 * @property {boolean}  valid             - Whether message passes validation
 * @property {string}   [messageFilePath] - Path to temp file (only when valid)
 * @property {string}   formattedMessage  - The full formatted commit message
 * @property {string[]} errors            - Validation error messages
 */

/**
 * @typedef {Object} FileChange
 * @property {string} path        - File path relative to repo root
 * @property {string} status      - Git status letter (A/M/D/R)
 * @property {number} [additions] - Lines added
 * @property {number} [deletions] - Lines deleted
 */

/**
 * @typedef {Object} DiffResult
 * @property {boolean}      success - Whether diff parsing succeeded
 * @property {FileChange[]} files   - Changed files
 * @property {{ totalFiles: number, totalAdditions: number, totalDeletions: number }} stats
 * @property {string}       summary - Human-readable one-line summary
 * @property {string}       [error] - Error message if failed
 */

/**
 * @typedef {Object} WorkflowResult
 * @property {boolean} dryRun - Whether this was a dry run
 * @property {{ success: boolean, files: string[], error?: string }} add
 * @property {{ success: boolean, hash?: string, message?: string, error?: string }} commit
 * @property {{ success: boolean, error?: string, suggestion?: string }} [push]
 */

// ─── Git Helpers ─────────────────────────────────────────────────────

/**
 * Execute a shell command and return a structured result.
 *
 * @param   {string} command - Shell command to execute
 * @returns {Promise<GitResult>}
 *
 * @example
 * const result = await execGit('git status --porcelain');
 * if (result.success) console.log(result.stdout);
 */
export async function execGit(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || '',
      error: error.message,
    };
  }
}

// ─── Temp File Helpers ───────────────────────────────────────────────

/**
 * Write content to a temporary file and return its absolute path.
 * Creates a unique temp directory to avoid collisions.
 *
 * @param   {string} content              - File content to write
 * @param   {string} [prefix='git-commit-'] - Temp directory name prefix
 * @returns {string} Absolute path to the created temp file
 */
export function writeTempFile(content, prefix = 'git-commit-') {
  const tempDir = mkdtempSync(join(tmpdir(), prefix));
  const filePath = join(tempDir, 'message.txt');
  writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Remove a temporary file. Silently ignores errors.
 *
 * @param {string} filePath - Absolute path to delete
 */
export function cleanupTempFile(filePath) {
  try {
    unlinkSync(filePath);
    // Also remove the parent temp directory created by mkdtempSync
    const dir = dirname(filePath);
    rmSync(dir, { recursive: true, force: true });
  } catch (_) {
    // Ignore cleanup errors
  }
}

// ─── I/O Helpers ─────────────────────────────────────────────────────

/**
 * Read JSON input from `--data` CLI argument or stdin.
 *
 * Priority: `--data` argument > stdin.
 *
 * @param   {string[]} args - Process arguments (`process.argv.slice(2)`)
 * @returns {Promise<any>}  Parsed JSON object, or `null` if stdin is empty
 * @throws  {Error}         If JSON parsing fails
 *
 * @example
 * // Via --data argument (recommended, works on all platforms including Windows):
 * //   node script.js --data '{"title":"feat: add"}'
 * // Via stdin pipe (Linux/macOS only):
 * //   echo '{"title":"feat: add"}' | node script.js
 */
export async function readInput(args) {
  const dataIndex = args.indexOf('--data');
  if (dataIndex >= 0 && args[dataIndex + 1]) {
    try {
      return JSON.parse(args[dataIndex + 1]);
    } catch (error) {
      throw new Error(`Invalid JSON in --data: ${error.message}`);
    }
  }

  // When stdin is an interactive TTY (not piped), waiting for data would
  // block forever. Fail fast with a clear message so the caller knows to
  // use the --data argument instead. This avoids the misleading
  // "stdin is not a tty" error observed in Windows terminal environments.
  if (process.stdin.isTTY) {
    throw new Error(
      'No input provided and stdin is a TTY (interactive terminal).\n' +
      'Pass commit message JSON via --data:\n' +
      '  node format-commit.js --data \'{"title":"feat: add","paragraphs":[]}\''
    );
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => {
      try {
        const input = Buffer.concat(chunks).toString('utf8').trim();
        if (!input) { resolve(null); return; }
        resolve(JSON.parse(input));
      } catch (error) {
        reject(new Error(`Invalid JSON from stdin: ${error.message}`));
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * Print a JSON result to stdout (pretty-printed, 2-space indent).
 *
 * @param {any} result - Data to serialize
 */
export function outputResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

// ─── Message Parsing ─────────────────────────────────────────────────

/**
 * Split a raw commit message into title and body lines.
 *
 * The blank line between title and body is skipped automatically.
 * Leading/trailing blank lines in the body are trimmed.
 *
 * @param   {string} message - Full commit message text
 * @returns {{ title: string, bodyLines: string[] }}
 */
export function parseCommitMessage(message) {
  const lines = message.split('\n');
  const title = lines[0] || '';

  const bodyLines = lines.slice(1).filter((line, index, arr) => {
    if (line.trim()) return true;
    if (index === 0 || index === arr.length - 1) return false;
    return true;
  });

  return { title, bodyLines };
}

// ─── Validation Helpers ──────────────────────────────────────────────

/**
 * Basic heuristic for imperative mood detection.
 * Strips the type/scope prefix, then checks if the first word
 * ends with `-ed`, `-ing`, or `-s` (common non-imperative patterns).
 *
 * @param   {string} description - Full commit title
 * @returns {boolean} `true` if likely imperative mood
 *
 * @example
 * isImperativeMood('feat(auth): add login')    // true
 * isImperativeMood('feat(auth): added login')   // false
 * isImperativeMood('feat(auth): adding login')  // false
 */
export function isImperativeMood(description) {
  const desc = description
    .replace(/^[a-z]+(\([^)]+\))?:\s*/, '')
    .toLowerCase();
  const firstWord = desc.split(/\s+/)[0];
  const wrongPatterns = [/ed$/, /ing$/, /s$/];
  return !wrongPatterns.some((p) => p.test(firstWord));
}

/**
 * Check whether a title ends with a period.
 *
 * @param   {string} title
 * @returns {boolean}
 */
export function hasPeriod(title) {
  return title.trim().endsWith('.');
}

// ─── Bitbucket Helpers ───────────────────────────────────────────────

/**
 * @typedef {Object} RemoteInfo
 * @property {string}  owner  - Bitbucket workspace slug
 * @property {string}  repo   - Repository slug
 * @property {string}  rawUrl - Raw remote URL
 * @property {boolean} valid  - Whether parsing succeeded
 */

/**
 * Read a git remote URL and parse out the Bitbucket workspace + repo.
 *
 * Handles these formats:
 *   https://user@bitbucket.org/workspace/repo.git
 *   git@bitbucket.org:workspace/repo.git
 *
 * @param   {string} [remoteName="origin"]
 * @returns {Promise<RemoteInfo>}
 */
export async function detectBitbucketRemote(remoteName = 'origin') {
  const result = await execGit(`git remote get-url ${remoteName}`);
  if (!result.success) {
    return { owner: '', repo: '', rawUrl: '', valid: false };
  }

  const rawUrl = result.stdout.trim();
  const match  = rawUrl.match(/bitbucket\.org[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);

  if (!match) {
    return { owner: '', repo: '', rawUrl, valid: false };
  }

  const [, owner, repo] = match;
  return { owner, repo, rawUrl, valid: true };
}

/**
 * Build the Authorization header for the Bitbucket API.
 *
 * Bitbucket Cloud API tokens use HTTP Basic auth (RFC-2617):
 *   username = Atlassian account email (BITBUCKET_EMAIL)
 *   password = API token from bitbucket.org/account/settings/api-tokens/ (BITBUCKET_TOKEN)
 *
 * @returns {{ Authorization: string } | null}
 */
export function buildAuthHeader() {
  const email = process.env.BITBUCKET_EMAIL;
  const token = process.env.BITBUCKET_TOKEN;
  if (!email || !token) return null;
  const encoded = Buffer.from(`${email}:${token}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

/**
 * Make an HTTPS request and return the parsed JSON response.
 *
 * @param   {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param   {string} url
 * @param   {object} payload
 * @param   {Record<string, string>} headers
 * @returns {Promise<{ statusCode: number, body: any }>}
 */
export function httpsRequest(method, url, payload, headers) {
  return new Promise((resolve, reject) => {
    const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
    const body = hasBody ? JSON.stringify(payload) : '';
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method,
      headers:  {
        'Content-Type': 'application/json',
        ...(hasBody ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) });
        } catch {
          resolve({ statusCode: res.statusCode, body: null });
        }
      });
    });

    req.setTimeout(30_000, () => {
      req.destroy(new Error('Request timed out after 30s'));
    });
    req.on('error', reject);
    if (hasBody) req.write(body);
    req.end();
  });
}

/** @type {(url: string, payload: object, headers: Record<string,string>) => Promise<{statusCode:number,body:any}>} */
export const httpsPost = (url, payload, headers) => httpsRequest('POST', url, payload, headers);

/** @type {(url: string, payload: object, headers: Record<string,string>) => Promise<{statusCode:number,body:any}>} */
export const httpsPut = (url, payload, headers) => httpsRequest('PUT', url, payload, headers);
