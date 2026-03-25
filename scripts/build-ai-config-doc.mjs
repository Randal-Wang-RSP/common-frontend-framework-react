#!/usr/bin/env node
/**
 * Build docs/installation-ai-config.md from source files.
 *
 * Run: node scripts/build-ai-config-doc.mjs
 *
 * Reads the actual AI configuration files from the repo and assembles
 * them into a single markdown installation guide for AI agents.
 */

import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

function read(relPath) {
  return readFileSync(resolve(ROOT, relPath), "utf8").trimEnd()
}

/**
 * Wrap file content in a markdown code fence.
 * Uses 4-backtick fences for files that contain 3-backtick code blocks.
 */
function embed(relPath, lang) {
  const content = read(relPath)
  const has3tick = content.includes("```")
  const fence = has3tick ? "````" : "```"
  return `${fence}${lang}\n${content}\n${fence}`
}

function fileSection(relPath, lang) {
  return `### \`${relPath}\`\n\n${embed(relPath, lang)}`
}

// ─── Build the document ──────────────────────────────────────────────

const sections = []

sections.push(`\
# React FSD Framework — AI Configuration Guide

> This guide is a companion to [\`installation.md\`](installation.md).
> It covers all AI agent and GitHub Copilot configuration files.
> Follow every step in order. Create every file with the exact content shown.
>
> **Prerequisite:** Complete Steps 1–17 from \`installation.md\` first.

---

## Overview

This guide creates the following AI configuration layers:

1. **Root-level agent files** — \`AGENTS.md\`, \`CLAUDE.md\`
2. **GitHub Copilot workspace instructions** — \`.github/copilot-instructions.md\`
3. **Commit message instructions** — \`.github/.copilot-commit-message-instructions.md\`
4. **Layer-specific instructions** — \`.github/instructions/*.instructions.md\`
5. **Prompt templates** — \`.github/prompts/*.prompt.md\`
6. **Skills** — \`.github/skills/\` (zustand-patterns, git-workflow, requesting-code-review)

---`)

// ─── Step 1: Root-level agent files ──────────────────────────────────

sections.push(`\
## Step 1 — Create root-level agent files

These files provide coding guidelines for different AI tools.

${fileSection("AGENTS.md", "md")}

---

${fileSection("CLAUDE.md", "md")}

---`)

// ─── Step 2: Copilot workspace instructions ──────────────────────────

sections.push(`\
## Step 2 — Create GitHub Copilot workspace instructions

${fileSection(".github/copilot-instructions.md", "md")}

---`)

// ─── Step 3: Commit message instructions ─────────────────────────────

sections.push(`\
## Step 3 — Create commit message instructions

This file guides AI-generated commit messages to follow the project's Conventional Commits standard.

${fileSection(".github/.copilot-commit-message-instructions.md", "md")}

---`)

// ─── Step 4: Layer-specific instructions ─────────────────────────────

const instructionFiles = [
  ".github/instructions/entities.instructions.md",
  ".github/instructions/features.instructions.md",
  ".github/instructions/pages.instructions.md",
  ".github/instructions/shared.instructions.md",
  ".github/instructions/test.instructions.md",
  ".github/instructions/widgets.instructions.md",
]

sections.push(`\
## Step 4 — Create layer-specific Copilot instructions

These files auto-load when editing files in specific directories.

${instructionFiles.map((f) => fileSection(f, "md")).join("\n\n---\n\n")}

---`)

// ─── Step 5: Prompt templates ────────────────────────────────────────

const promptFiles = [
  ".github/prompts/new-feature.prompt.md",
  ".github/prompts/new-entity.prompt.md",
  ".github/prompts/new-page.prompt.md",
]

sections.push(`\
## Step 5 — Create prompt templates

Prompt templates for common slice creation tasks.

${promptFiles.map((f) => fileSection(f, "md")).join("\n\n---\n\n")}

---`)

// ─── Step 6: Skills ──────────────────────────────────────────────────

sections.push(`\
## Step 6 — Create skills

Skills are on-demand deep knowledge that Copilot loads when the user's request matches.

### Skills directory structure

\`\`\`bash
mkdir -p .github/skills/zustand-patterns
mkdir -p .github/skills/git-workflow/platforms
mkdir -p .github/skills/git-workflow/scripts
mkdir -p .github/skills/requesting-code-review
\`\`\`

${fileSection(".github/skills/README.md", "md")}

---

### Zustand Patterns Skill

${fileSection(".github/skills/zustand-patterns/SKILL.md", "md")}

---

### Git Workflow Skill

${fileSection(".github/skills/git-workflow/SKILL.md", "md")}

---

#### Platform: Bitbucket

${fileSection(".github/skills/git-workflow/platforms/bitbucket.md", "md")}

---

#### Platform: GitHub

${fileSection(".github/skills/git-workflow/platforms/github.md", "md")}

---

#### Script: \`utils.js\`

${fileSection(".github/skills/git-workflow/scripts/utils.js", "js")}

---

#### Script: \`parse-diff.js\`

${fileSection(".github/skills/git-workflow/scripts/parse-diff.js", "js")}

---

#### Script: \`validate-message.js\`

${fileSection(".github/skills/git-workflow/scripts/validate-message.js", "js")}

---

#### Script: \`format-commit.js\`

${fileSection(".github/skills/git-workflow/scripts/format-commit.js", "js")}

---

#### Script: \`git-workflow.js\`

${fileSection(".github/skills/git-workflow/scripts/git-workflow.js", "js")}

---

#### Script: \`create-pr.js\`

${fileSection(".github/skills/git-workflow/scripts/create-pr.js", "js")}

---

#### Script: \`add-pr-comment.js\`

${fileSection(".github/skills/git-workflow/scripts/add-pr-comment.js", "js")}

---

### Requesting Code Review Skill

${fileSection(".github/skills/requesting-code-review/SKILL.md", "md")}

---

${fileSection(".github/skills/requesting-code-review/code-reviewer.md", "md")}

---`)

// ─── Done ────────────────────────────────────────────────────────────

sections.push(`\
## Done

All AI configuration files are in place. Key facts:

- \`AGENTS.md\` and \`CLAUDE.md\` provide coding rules for AI agents at the repo root
- \`.github/copilot-instructions.md\` is the primary GitHub Copilot workspace instruction file
- Layer-specific instructions auto-load from \`.github/instructions/\` when editing files in that layer
- Prompt templates for new slices are in \`.github/prompts/\`
- Skills in \`.github/skills/\` provide deep knowledge loaded on demand
- Git workflow scripts in \`.github/skills/git-workflow/scripts/\` automate commit and PR creation

Return to [\`installation.md\`](installation.md) to finalize the project setup (git init, verify, initial commit).`)

// ─── Write output ────────────────────────────────────────────────────

const output = sections.join("\n\n") + "\n"
const outPath = resolve(ROOT, "docs/installation-ai-config.md")
writeFileSync(outPath, output, "utf8")

const lineCount = output.split("\n").length
console.log(`✅ Generated ${outPath}`)
console.log(`   ${lineCount} lines`)
