# React FSD Framework — AI Configuration Guide

> This guide is a companion to [`installation.md`](installation.md).
> It covers all AI agent and GitHub Copilot configuration files.
> Follow every step in order. Create every file with the exact content shown.
>
> **Prerequisite:** Complete Steps 1–17 from `installation.md` first.

---

## Overview

This guide creates the following AI configuration layers:

1. **Root-level agent files** — `AGENTS.md`, `CLAUDE.md`
2. **GitHub Copilot workspace instructions** — `.github/copilot-instructions.md`
3. **Commit message instructions** — `.github/.copilot-commit-message-instructions.md`
4. **Layer-specific instructions** — `.github/instructions/*.instructions.md`
5. **Prompt templates** — `.github/prompts/*.prompt.md`
6. **Skills** — `.github/skills/` (zustand-patterns, git-workflow, requesting-code-review)

---

## Step 1 — Create root-level agent files

These files provide coding guidelines for different AI tools.

### `AGENTS.md`

````md
# AGENTS.md — Coding Guidelines for AI Agents

**Generated:** 2026-03-25
**Mode:** init-deep --max-depth=2 (update)

## Quick Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # Type check + production build

# Testing (Vitest + jsdom)
npm run test             # Watch mode
npm run test:run         # Run once (CI)
npm run test:coverage    # With coverage report
npx vitest run src/path/to/file.test.ts   # Run single test file

# Linting & Formatting
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all
```

## Architecture (Feature-Sliced Design)

> Full reference: [`docs/architecture.md`](docs/architecture.md)

Layer imports flow downward only:

```
app → pages → widgets → features → entities → shared
```

**Import Rules:**

- Use `@/` alias for all cross-slice imports (enforced by ESLint)
- Relative imports (`./`, `../`) only within the same slice
- Same-layer slices cannot import each other
- Cross-entity references use `@x` pattern: `entities/user/@x/order.ts`

## Code Style

**TypeScript:**

- Strict mode enabled
- Explicit return types on exported functions
- Prefix unused parameters with `_`
- Avoid `any` (warned by ESLint)

**Formatting (Prettier):**

- No semicolons
- Double quotes
- 100 character print width
- 2-space tabs
- Trailing commas (ES5)

**Naming:**

- `PascalCase` for components, types, interfaces
- `camelCase` for functions, variables, hooks
- `kebab-case` for file names
- React hooks: `useXxxStore`, `useXxxQuery`

**Testing:**

- Co-locate tests: `file.ts` → `file.test.ts`
- Use Vitest globals (no imports needed for `describe`, `it`, `expect`)
- Test utilities from `@testing-library/react`

## Project Structure

> Full reference: [`docs/architecture.md`](docs/architecture.md)

```
src/
├── app/              # Entry, providers, router, styles
├── pages/            # Route-level page components
├── widgets/          # Complex composite components
├── features/         # User interactions, business logic
├── entities/         # Domain models, business entities
└── shared/           # Reusable UI, API, utilities, config
    ├── api/          # Axios instance
    ├── ui/           # Generic UI components
    ├── lib/          # Helper utilities
    ├── store/        # Zustand utilities
    └── config/       # Env vars, constants
```

Each slice contains: `ui/`, `model/`, `api/`, `lib/`, `config/` segments + `index.ts` barrel.

## Git Workflow

> Full reference: [`.github/skills/git-workflow/SKILL.md`](.github/skills/git-workflow/SKILL.md)

**Conventional Commits:**

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, revert
```

Examples:

- `feat(auth): add JWT refresh logic`
- `fix(cart): prevent duplicate items`
- `chore(deps): upgrade react-router to v7`

**Pre-commit hooks run automatically via Husky.**

**Atomic commits:** split changes by type — code, tests, docs, config in separate commits. Stage selectively (`git add <files>`), not `git add -A`.

**Branching:** Git Flow — `main` (production) + `development` (integration) + short-lived `feat/`, `fix/`, `hotfix/`, `release/` branches. Branch naming: `<type>/<scope>-<short-description>`.

**Merge strategy:** Squash Merge for features → `development`; Merge Commit for releases/hotfixes → `main`.

**Protected branches:** `main` and `development` — no direct push, PR + 1 approval required.

**Repository:** Bitbucket · CI/CD: Jenkins · Code quality: SonarQube

## Key Dependencies

- React 18 + Vite + TypeScript (strict)
- React Router v7
- TanStack Query (React Query) for server state
- Zustand for client state
- Ant Design for UI components
- CSS Modules for styling
- Vitest + jsdom for testing

## Agent Rules

- **Language:** Thinking and response text follow the user's language. Code, comments, documentation, commit messages, and PR content are **always in English**.
- **Branch-first:** Always create a feature branch before writing any code — never commit directly to `main` or `development`.
- **Commit/PR review:** Before executing `git commit` or creating a PR, display the proposed message in the response text, then ask the user for confirmation using the environment's question/ask tool (e.g., `vscode_askQuestions` in VS Code, `question` in opencode) with confirm/edit/cancel options. Never execute without tool-based confirmation. Use single-select when the user must choose exactly one option (e.g., confirm/edit/cancel or yes/no); use multi-select (`multiple: true` where supported) when the user needs to choose multiple items (e.g., files to stage, issues to fix).
- **Iterative workflow:** If new changes arise after a commit, re-enter the workflow from the appropriate step — assess, stage, show message, commit. Never skip steps.
- **Session end gate:** After completing any task or yielding control, **always** ask the user about the next action via the environment's question/ask tool. Include context-appropriate options and a "pause/stop" choice. This applies after every commit, push, PR creation, or code change — not only at session end.

## Important Constraints

- Client env vars must be prefixed with `VITE_`
- FSD boundaries are enforced by `eslint-plugin-boundaries` — violations block commits
- Do not import across same-layer slice boundaries
- Keep shared layer free of business domain logic
- Named exports only — no `export default` anywhere
- No `any` type — use proper typing
- Do not import `zustand` or `axios` directly — use `@/shared/store` and `@/shared/api` wrappers
- **MCP tool string params:** When calling MCP tools that accept markdown text (e.g., PR body, issue comment), use actual multi-line strings with real newlines — never `\n` escape sequences. Escaped newlines are stored literally and break markdown rendering.
````

---

### `CLAUDE.md`

````md
# CLAUDE.md — Coding Rules for AI Coding Tools

This file gives AI assistants the rules needed to write correct code in this project.
For deep architectural explanations see [`docs/architecture.md`](docs/architecture.md).

## Project Type

React project template based on **Feature-Sliced Design (FSD)**.

## Tech Stack

- **React 18 + Vite + TypeScript** (strict mode enabled)
- **CSS Modules + Ant Design** — styling and UI components
- **Zustand** — client-side state management
- **TanStack Query (React Query)** — server-state / async data fetching
- **React Router v7** — client-side routing
- **Vitest + jsdom** — unit and component testing

## Path Alias

`@/` maps to `src/`.

- All cross-layer and cross-slice imports **MUST** use `@/`.
- Relative imports (`./`, `../`) are only allowed **within the same slice/segment**.

```ts
// correct — cross-layer import
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth/model"

// wrong — relative import crossing slice boundary
import { Button } from "../../shared/ui"
```

## FSD Layers and Import Rules

> Full reference: [`docs/architecture.md`](docs/architecture.md)

Layers (top → bottom). Each layer may only import from layers **below** it.

```
app         ← can import: pages, widgets, features, entities, shared
pages       ← can import: widgets, features, entities, shared
widgets     ← can import: features, entities, shared
features    ← can import: entities, shared
entities    ← can import: shared
shared      ← cannot import any other layer
```

## Same-Layer Isolation

A slice **MUST NOT** import from a _different_ slice on the same layer. Imports between segments within the same slice are allowed.

```ts
// FORBIDDEN — feature importing another feature
import { getProfile } from "@/features/profile" // inside features/auth
```

## Cross-Entity References (`@x` Pattern)

When one entity must reference a type or value from another entity on the same layer, use the `@x` pattern instead of a direct slice import.

```ts
// src/entities/user/@x/order.ts — re-exports only what the order entity is allowed to use from user
export type { UserId } from "../model"
```

## Slice Structure

Each slice contains segments (only create what is needed):

```
sliceName/
  ui/         # React components
  model/      # state, stores, hooks, types
  api/        # API calls and query hooks
  lib/        # utilities local to this slice
  config/     # constants and configuration
  index.ts    # public API barrel — only export what consumers need
```

Code outside the slice **must** import from the `index.ts` barrel, never from internal files directly.

```ts
// Correct
import { LoginForm } from "@/features/auth"

// Wrong — imports an internal file directly
import { LoginForm } from "@/features/auth/ui/LoginForm"
```

## Shared Layer Segments

```
shared/
  api/        # base HTTP client, interceptors
  config/     # app-wide constants and env vars
  lib/        # generic utilities and helpers
  store/      # shared Zustand store utilities
  ui/         # generic, reusable UI components
```

`shared` has **zero business domain knowledge** — no user, order, or other domain concepts.

## Never Do

```ts
// ❌ Default export
export default function UserCard() { ... }

// ❌ any type
const data: any = response.data

// ❌ Import Zustand or Axios directly — use shared wrappers
import { create } from "zustand"     // use @/shared/store
import axios from "axios"            // use @/shared/api
```

## Test Co-location

Tests live next to the source file they test, named `*.test.ts` or `*.test.tsx`.

```
model/
  authStore.ts
  authStore.test.ts
```

## Commit Format

Conventional Commits: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `revert`

```
feat(auth): add JWT refresh logic
fix(cart): prevent duplicate item entries
chore(deps): upgrade react-router to v7
```

## Atomic Commits

Split changes into **logically separate commits** — do not mix code, tests, and docs in one commit.

- Stage selectively: `git add <specific-files>`, not `git add -A`
- Commit order: code → tests → docs → config

```
# ✅ separate commits
git add src/features/auth/ && git commit -m "feat(auth): add login form"
git add src/features/auth/model/useAuthStore.test.ts && git commit -m "test(auth): add store tests"

# ❌ everything in one commit
git add -A && git commit -m "feat(auth): add login form, tests, and docs"
```

## Git Workflow

> Full reference: [`.github/skills/git-workflow/SKILL.md`](.github/skills/git-workflow/SKILL.md)

**Branching:** Git Flow — `main` (production) + `development` (integration) + short-lived `feat/`, `fix/`, `hotfix/`, `release/` branches.

**Branch naming:** `<type>/<scope>-<short-description>` (e.g., `feat/auth-jwt-refresh`)

**Merge strategy:** Squash Merge for features → `development`; Merge Commit for releases/hotfixes → `main`.

**Protected branches:** `main` and `development` — no direct push, PR + 1 approval required.

**Versioning:** `v<MAJOR>.<MINOR>.<PATCH>` (Semantic Versioning)

**Repository:** Bitbucket · CI/CD: Jenkins · Code quality: SonarQube

## Agent Rules

**Language:** Thinking and response text follow the user's language. Code, comments, documentation, commit messages, and PR content are **always in English**.

**Branch-first:** Always create a feature branch before writing any code — never commit directly to `main` or `development`.

**Commit/PR review:** Before executing `git commit` or creating a PR, display the proposed message in the response text, then ask the user for confirmation using the environment's question/ask tool (e.g., `vscode_askQuestions` in VS Code, `question` in opencode) with confirm/edit/cancel options. Never execute without tool-based confirmation. Use single-select when the user must choose exactly one option (e.g., confirm/edit/cancel or yes/no); use multi-select when the user needs to choose multiple items (e.g., files to stage, issues to fix).

**Iterative workflow:** If new changes arise after a commit, re-enter the workflow from the appropriate step — assess, stage, show message, commit. Never skip steps.

**Session end gate:** After completing any task or yielding control, **always** ask the user about the next action via the environment's question/ask tool. Include context-appropriate options and a "pause/stop" choice. This applies after every commit, push, PR creation, or code change — not only at session end.

## ESLint Enforcement

FSD import rules are enforced by `eslint-plugin-boundaries`. Violations block commits via pre-commit hooks — fix them before committing.
````

---

## Step 2 — Create GitHub Copilot workspace instructions

### `.github/copilot-instructions.md`

````md
# GitHub Copilot — Workspace Instructions

## Context

React template using **Feature-Sliced Design (FSD)** architecture, TypeScript strict mode.

**Tech stack:** React 18 · Vite · TypeScript · CSS Modules · Ant Design · Zustand · TanStack Query · React Router v7 · Vitest

**Repository:**

- **Hosting:** Bitbucket
- **CI/CD:** Jenkins
- **Code quality:** SonarQube

Layers import **downward only** — never upward, never sideways across the same layer:

```
app → pages → widgets → features → entities → shared
```

Each layer's responsibility:

- **`app/`** — providers, router, global styles. No slices.
- **`pages/`** — one slice per route. Compose widgets/features.
- **`widgets/`** — large self-contained UI blocks.
- **`features/`** — user interactions and business actions.
- **`entities/`** — domain models, data types, display components. No user interactions.
- **`shared/`** — UI primitives, HTTP client, utilities. Zero business domain knowledge.

Each slice structure:

```
sliceName/
  ui/        # React components
  model/     # Zustand stores, hooks, types
  api/       # React Query hooks, raw API calls
  lib/       # slice-local utilities
  config/    # slice-local constants
  index.ts   # public barrel — only export what consumers need
```

**Git Workflow:** Git Flow — `main` (production) + `development` (integration) + short-lived feature/fix/release/hotfix branches.
**Branch naming:** `<type>/<scope>-<short-description>` (e.g., `feat/auth-jwt-refresh`, `fix/cart-duplicate-items`)
**Merge strategy:** Squash Merge for features → `development`; Merge Commit for releases/hotfixes → `main`.
**Protected branches:** `main` and `development` — no direct push, PR + 1 approval required.
**Versioning:** Semantic Versioning `v<MAJOR>.<MINOR>.<PATCH>` — tags prefixed with `v`.

> Architecture deep-dive: [`docs/architecture.md`](../docs/architecture.md)
> Naming & import conventions: [`docs/conventions.md`](../docs/conventions.md)
> Layer-specific guides: [`docs/layers/`](../docs/layers/)
> Git workflow details: [`.github/skills/git-workflow/SKILL.md`](skills/git-workflow/SKILL.md)
> Common tasks (add feature/entity/page): use `.github/prompts/` prompt files.
> Deep library patterns (Zustand, React Query): see `.github/skills/`.

---

## Never Do

```ts
// ❌ Import across same-layer slice boundary
import { getProfile } from "@/features/profile"     // inside features/auth

// ❌ Bypass the barrel — import from internal files directly
import { LoginForm } from "@/features/auth/ui/LoginForm"

// ❌ Cross-layer import using relative path
import { Button } from "../../shared/ui"

// ❌ Default export
export default function UserCard() { ... }

// ❌ any type
const data: any = response.data

// ❌ Business domain concepts in shared/
// shared/lib/getUserFullName.ts  ← domain logic does not belong here

// ❌ Import Zustand or Axios directly — use shared wrappers
import { create } from "zustand"     // use @/shared/store
import axios from "axios"            // use @/shared/api
```

---

## Patterns

**Cross-layer import — always use `@/` alias:**

```ts
// ✅
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"

// ✅ Within the same slice — relative is fine
import { loginSchema } from "../lib/validation"
```

**Cross-entity reference — use `@x` pattern:**

```ts
// src/entities/user/@x/order.ts — re-export only what order needs
export type { UserId } from "../model"

// inside entities/order:
import type { UserId } from "@/entities/user/@x/order"
```

**Named exports only** — no `export default` anywhere in the project.

**Explicit return types** on all exported functions.

**Import order:** external packages → `@/` imports → relative imports.

```ts
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/shared/ui"

import { loginSchema } from "../lib/validation"
import styles from "./LoginForm.module.css"
```

**Naming:** Components/types → `PascalCase` · functions/variables/hooks → `camelCase` · files/folders → `kebab-case` · hooks → `useXxxStore`, `useXxxQuery`

**Formatting:** Prettier auto-applied on commit — no semicolons · double quotes · 100-char width · 2-space indent · ES5 trailing commas

**Testing:** co-locate `authStore.ts` → `authStore.test.ts` · Vitest globals need no imports

**Commits:** `feat(auth): add JWT refresh logic` · `fix(cart): prevent duplicate items`
Types: `feat | fix | docs | style | refactor | test | chore | perf | revert`

**Atomic commits:** split changes by type — code, tests, docs, config in separate commits. Stage selectively (`git add <files>`), not `git add -A`.

**Env vars:** prefix client-side vars with `VITE_`

---

## Agent Rules

**Language:** Thinking and response text follow the user's language. Code, comments, documentation, commit messages, and PR content are **always in English**.

**Branch-first:** Always create a feature branch before writing any code — never commit directly to `main` or `development`.

**Commit/PR review:** Before executing `git commit` or creating a PR, display the proposed message in the response text, then call `vscode_askQuestions` with confirm/edit/cancel options. Never execute without tool-based confirmation. Use single-select when the user must choose exactly one option (e.g., confirm/edit/cancel or yes/no); use multi-select when the user needs to choose multiple items (e.g., files to stage, issues to fix).

**Iterative workflow:** If new changes arise after a commit, re-enter the workflow from the appropriate step — assess, stage, show message, commit. Never skip steps.

**Session end gate:** After completing any task or yielding control, **always** call `vscode_askQuestions` to ask the user about the next action. Include context-appropriate options and a "pause/stop" choice. This applies after every commit, push, PR creation, or code change — not only at session end.
````

---

## Step 3 — Create commit message instructions

This file guides AI-generated commit messages to follow the project's Conventional Commits standard.

### `.github/.copilot-commit-message-instructions.md`

````md
# Git Commit Message Generator Instructions

> **WORKFLOW**: Generate message content → Scripts handle formatting/validation  
> **YOUR FOCUS**: Meaningful descriptions, appropriate type selection, clear metrics

## 🎭 Role

You are a **Professional Git Commit Message Generator** specializing in creating high-quality, conventional commit messages by analyzing git diff output.

**Your Expertise:**

- Deep understanding of Conventional Commit specification
- Knowledge of Git community best practices (50/72 rule)
- Ability to identify primary change types from complex diffs
- Skill in crafting concise yet descriptive commit messages

---

## 📚 Content

### Conventional Commit Standard

The Conventional Commit format is a specification for adding human and machine-readable meaning to commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Git Community Best Practices

**The 50/72 Rule:**

- **Title**: Ideally ≤ 50 characters (max 72 in traditional Git)
- **Body**: Each line ≤ 72 characters
- **Why 72 chars?** Ensures optimal display in 80-column terminals and all Git tools (GitHub, GitLab, terminal `git log`, etc.)

**Modern Adaptation:**

- We allow **100 characters** for title (enforced by commitlint)
- This accommodates modern workflows and longer scopes
- Body lines remain **72 characters** (Git standard)

### Commit Type Categories

| Type         | Purpose                  | Example                             |
| ------------ | ------------------------ | ----------------------------------- |
| **feat**     | New feature              | `feat(auth): add OAuth2 login`      |
| **fix**      | Bug fix                  | `fix(api): handle null response`    |
| **docs**     | Documentation only       | `docs(readme): update setup guide`  |
| **style**    | Code style/formatting    | `style: fix indentation`            |
| **refactor** | Code restructure         | `refactor(utils): simplify helpers` |
| **test**     | Tests only               | `test(auth): add login tests`       |
| **chore**    | Maintenance tasks        | `chore: update dependencies`        |
| **perf**     | Performance improvements | `perf(db): optimize queries`        |
| **ci**       | CI/CD changes            | `ci: add GitHub Actions workflow`   |
| **build**    | Build system changes     | `build: upgrade webpack to v5`      |

---

## 🎯 Tasks

Your workflow consists of **5 sequential steps** (Step 4 is CRITICAL for avoiding commitlint failures):

### Step 1: Analyze Git Diff

- Read and understand the provided git diff output
- Identify all changed files and their modifications
- Note the scope of changes (which modules/features affected)

### Step 2: Identify Primary Change Type

- Determine the **most significant** change type
- Apply analysis priority rules:
  1. Focus on the primary impact (what's the main goal?)
  2. If multiple types exist, choose the dominant one
  3. Group related changes under a single logical type
- Select appropriate scope if applicable

### Step 3: Craft Commit Message

- **Title**: Create concise, imperative mood description
  - Format: `<type>[scope]: <description>`
  - Must not exceed 100 characters
  - Aim for ~50 characters when possible
- **Body** (if needed): Explain complex changes
  - **CRITICAL**: Each line ≤ 72 characters (count carefully!)
  - Use bullet points for multiple changes
  - Explain **what** and **why**, not how
  - If a line exceeds 72 chars, split it into multiple lines
- **Metrics** (for refactor/perf/optimization commits):
  - Include quantifiable improvements when available
  - Format: "- Lines: -X% (before → after, -delta)"
  - Sections: Changes / Results / Benefits (optional)
  - Keep each metric line ≤ 72 characters

### Step 4: Structure Message for Scripts

- Structure message as JSON for `format-commit.js` script:
  ```json
  {
    "title": "<type>[scope]: <description>",
    "paragraphs": [
      "First paragraph describing what and why",
      "Changes:\n- Item 1\n- Item 2",
      "Results:\n- Metric"
    ]
  }
  ```
- **Focus on CONTENT QUALITY** - scripts handle character counting
- Keep lines naturally concise (aim for ~60 chars)
- Scripts will validate and report errors if any line exceeds limits

### Step 5: Delegate to Scripts

- Pass JSON to `format-commit.js` for validation and formatting
- Scripts handle:
  - Character limit verification (title ≤100, body ≤72)
  - Conventional commit format validation
  - Imperative mood checking
  - Temporary file creation for `git commit -F`
- If script returns errors, adjust content and retry

---

## ⚠️ Constraints

### Character Limits (CRITICAL - STRICTLY ENFORCED!)

- ✅ **Title**: ≤ 100 characters (including type + scope + description)
- ✅ **Body lines**: ≤ 72 characters per line (Git standard) - **ZERO TOLERANCE**
  - **COUNT EVERY CHARACTER** including spaces, punctuation, backticks
  - **VERIFY BEFORE OUTPUT**: Manually count chars in long lines
  - **When in doubt**: Split into two shorter lines
  - **IF YOU OUTPUT A LINE > 72 CHARS**: commitlint will reject the commit
- ❌ Violating these limits will cause commitlint failure or display issues

**⚠️ WARNING**: The 72-character limit is NOT a guideline - it's a HARD LIMIT enforced by automated tools. Every line MUST be ≤ 72 characters or the commit will be rejected.

### Language & Format

- ✅ **Language**: English only
- ✅ **Mood**: Imperative ("add", "fix", "update" - not "adds", "added", "updating")
- ✅ **Title ending**: No period (.)
- ✅ **Output format**: Raw JSON object ONLY
  - Output a single JSON object with "title" and "paragraphs" fields
  - Do NOT wrap the JSON in markdown code fences or add extra text

### Output Structure

✅ CORRECT (output this JSON as raw text with no surrounding markdown or commentary):

```json
{
  "title": "feat(auth): add login validation",
  "paragraphs": [
    "Add validation middleware for authentication endpoints",
    "Changes:\n- Add validator function\n- Update route handlers"
  ]
}
```

❌ WRONG (plain text without structure):

```
feat(auth): add login validation

Add validation middleware
```

### Script Workflow

**Scripts handle all git command construction:**

1. `format-commit.js` - Creates properly formatted commit message file
2. `git-workflow.js` - Executes `git commit -F <file>` (no shell escaping needed)

**No need to manually construct** `git commit -m $'...'` commands - scripts handle it!

### Content Rules

- **Title**: Be concise but descriptive
- **Body**: Add only when changes need explanation
- **Body content**:
  - Explain what and why, not how
  - Use bullet points for clarity
  - Reference issue numbers if applicable (e.g., "Fixes #123")
  - Wrap code elements in backticks: `functionName`, `variableName`
- **Metrics** (when applicable):
  - Include for: refactor, perf, optimization, architectural changes
  - Provide quantifiable data: lines/words/tokens/file size changes
  - Format in sections: Changes / Results / Benefits
  - Always maintain 72-char line limit for metrics too

### Analysis Priority

When multiple change types exist:

1. ✅ Identify the primary change type (main goal of the commit)
2. ✅ Focus on the most significant impact
3. ✅ Group related changes under one commit type
4. ❌ Do NOT create multi-type commits (choose the dominant one)

---

## 💡 Examples

### ✅ Example 1: Simple Change (No Body Needed)

feat(auth): add login validation

### ✅ Example 2: Complex Change (With Body)

refactor(hooks): extract timer persistence logic from component

- Create `use-timer-persistence` hook for cleaner separation
- Move state management logic out of UI component
- Improve testability by isolating side effects
- Maintain backward compatibility with existing behavior

### ✅ Example 3: Bug Fix With Context

fix(api): handle null response in user endpoint

- Add null check before accessing user.profile
- Return default empty object when data is missing
- Prevents runtime error in profile display component

Fixes #456

### ✅ Example 4: Documentation Update

docs(readme): update installation instructions

- Add Node.js version requirement (v18+)
- Include troubleshooting section for Windows users
- Fix broken links to API documentation

### ✅ Example 5: Optimization With Metrics

refactor(skill): apply RCTE framework to separation-of-concerns

Restructure skill using 5-element framework to reduce
verbosity while maintaining all essential patterns

Changes:

- Add explicit Role: Code Separation Enforcement Specialist
- Consolidate scattered sections into 5 RCTE sections
- Remove Real-World Pattern Library (merged with Examples)

Results:

- Lines: -44% (561 → 316, -245 lines)
- Words: -36% (2383 → 1533, -850 words)
- Est. Tokens: -38% (~3200 → ~2000, -1200 tokens)

Benefits:

- Improved scanability (12 sections → 5)
- Consistent with main copilot-instructions structure

### ❌ Common Mistakes to Avoid

**Mistake 1: Title Too Long**

```
❌ feat(authentication): implement comprehensive user authentication system with JWT tokens and refresh token mechanism
✅ feat(auth): add JWT authentication with token refresh
```

**Mistake 2: Body Lines Too Long**

```
❌ - Implement comprehensive validation logic that checks user credentials against database and returns authentication tokens
✅ - Implement validation logic for user credentials
✅ - Check against database and return auth tokens
```

**Mistake 3: Wrong Mood**

```
❌ feat(auth): added login validation
✅ feat(auth): add login validation
```

**Mistake 4: Adding Extra Text**

```
❌ Here's your commit message:
feat(auth): add login validation

❌ I generated this commit for you:
feat(auth): add login validation

❌ feat(auth): add login validation

Character count verification:
- Line 1: "feat(auth): add login validation" = 32 chars ✓

✅ feat(auth): add login validation
```

**Mistake 5: Period at End of Title**

```
❌ fix(api): handle null response.
✅ fix(api): handle null response
```

**Mistake 6: Not Breaking Long Lines**

```
❌ - Update authentication middleware to support both JWT and OAuth2 authentication methods (89 chars)
✅ - Update authentication middleware to support JWT (56 chars)
✅ - Add OAuth2 authentication method support (45 chars)
```

**Mistake 7: Body Line Over 72 Characters (REAL EXAMPLE)**

```
❌ - Include Git community best practices (50/72 rule) with modern adaptations (78 chars)
✅ - Include Git best practices (50/72 rule) with adaptations (61 chars)

❌ Also update commitlint config to enforce 100-char title limit and 72-char body lines (88 chars)
✅ Update commitlint config to enforce character limits (54 chars)
```

---

## 📋 Quick Reference Checklist

**Before passing to scripts:**

- [ ] Type matches primary change (feat/fix/refactor/docs/etc.)
- [ ] Title uses imperative mood ("add" not "added")
- [ ] Title has no period at end
- [ ] Lines are naturally concise (avoid unnecessarily long descriptions)
- [ ] JSON structure is valid: `{title: string, paragraphs: string[]}`
- [ ] Code elements wrapped in backticks when referenced

**Scripts will verify:**

- Title ≤ 100 characters
- Body lines ≤ 72 characters
- Conventional commit format
- No trailing period on title
````

---

## Step 4 — Create layer-specific Copilot instructions

These files auto-load when editing files in specific directories.

### `.github/instructions/entities.instructions.md`

````md
---
applyTo: "src/entities/**"
---

# Layer: `entities`

Business domain objects — the **nouns** of the application. Entities model what things _are_; features model what users _do_ with them.

Full reference: [`docs/layers/entities.md`](../../docs/layers/entities.md)

## Slice Structure

```
src/entities/<name>/
  model/     # TypeScript interfaces, types, pure selector/helper functions
  ui/        # Display components (avatars, cards, badges)
  @x/        # Cross-entity re-export files (see below)
  index.ts   # public API barrel
```

## Import Rules

```ts
// ✅ Entities may only import from shared
import { apiInstance } from "@/shared/api"

// ❌ Never import from features, widgets, pages, or app
import { useAuthStore } from "@/features/auth"

// ❌ Never import directly from another entity
import { User } from "@/entities/user" // inside entities/order — use @x instead
```

## Cross-Entity Reference — `@x` Pattern

When one entity needs a type or component from another entity, use an explicit re-export file instead of a direct import:

```ts
// 1. Create src/entities/user/@x/order.ts
export type { User, UserId } from "../model"
export { UserAvatar } from "../ui"

// 2. Inside entities/order — import from the @x file
import type { UserId } from "@/entities/user/@x/order"
```

This makes cross-entity dependencies explicit and auditable.

## Never Do

```ts
// ❌ Side effects or API calls in an entity
export function useUserStore() {
  return useQuery({ queryFn: () => apiInstance.get("/users") })  // belongs in features/
}

// ❌ User interaction logic in an entity
export function UserCard() {
  const [editing, setEditing] = useState(false)  // interaction → move to features/
  return <button onClick={() => setEditing(true)}>Edit</button>
}

// ❌ Direct same-layer import
import { Order } from "@/entities/order"  // inside entities/user — use @x
```
````

---

### `.github/instructions/features.instructions.md`

````md
---
applyTo: "src/features/**"
---

# Layer: `features`

User interactions and business actions. Each slice = one cohesive capability.

Full reference: [`docs/layers/features.md`](../../docs/layers/features.md)

## Slice Structure

```
src/features/<name>/
  api/       # React Query mutations/queries + raw API calls
  model/     # Zustand store, derived state, TypeScript types
  ui/        # React components specific to this feature
  index.ts   # public API barrel
```

Only create segments you need. A simple feature may only need `ui/` and `model/`.

## Import Rules

```ts
// ✅ Features may import from
import { User } from "@/entities/user"
import { apiInstance } from "@/shared/api"

// ❌ Never import from another feature
import { getProfile } from "@/features/profile" // inside features/auth

// ❌ Never import from upper layers
import { HomePage } from "@/pages/home"
```

## State

Use Zustand for feature-local state. Import from `@/shared/store`, not directly from `zustand`:

```ts
// ✅
import { create, devtools } from "@/shared/store"

// ❌
import { create } from "zustand"
```

## Public API Barrel

Export only what consumers need. Internal helpers stay private:

```ts
// src/features/auth/index.ts
export { LoginForm } from "./ui"
export { useAuthStore } from "./model"
export type { AuthUser } from "./model"
```

## Never Do

```ts
// ❌ Export implementation internals
export { validatePasswordStrength } from "./lib/validation" // keep private

// ❌ Put API calls directly in a component
export function LoginForm() {
  const res = await axios.post("/auth/login", data) // use useQuery/useMutation
}

// ❌ Import React Query or Zustand from packages directly
import { useQuery } from "@tanstack/react-query" // fine here, but store → @/shared/store
```
````

---

### `.github/instructions/pages.instructions.md`

````md
---
applyTo: "src/pages/**"
---

# Layer: `pages`

Route-level assembly points. Pages compose widgets, features, and entities — they contain minimal logic of their own.

Full reference: [`docs/layers/pages.md`](../../docs/layers/pages.md)

## Slice Structure

```
src/pages/<route-name>/
  ui/
    <PageName>.tsx   # route component
    index.ts
  index.ts           # public API barrel (re-exports page component)
```

One slice per route. Slice name reflects the route: `home`, `user-profile`, `order-detail`.

## Import Rules

```ts
// ✅ Pages may import from
import { DashboardWidget } from "@/widgets/dashboard"
import { LoginForm } from "@/features/auth"
import { UserAvatar } from "@/entities/user"
import { Button } from "@/shared/ui"

// ❌ Never import from another page
import { HomePage } from "@/pages/home" // inside pages/dashboard

// ❌ Never import from app
import { router } from "@/app/router"
```

## Route Registration

The page file is **only** a React component. Register it at a URL path in `src/app/router/` — not inside the page file:

```tsx
// ✅ src/app/router/index.tsx
import { UserProfilePage } from "@/pages/user-profile"
;<Route path="/profile" element={<UserProfilePage />} />

// ❌ Do not define routes inside page files
```

## Never Do

```ts
// ❌ Business logic or state in a page
export function HomePage() {
  const [items, setItems] = useState([])
  useEffect(() => {
    fetchItems().then(setItems)
  }, []) // → move to features/
}

// ❌ Direct API calls in a page
export function HomePage() {
  const { data } = useQuery({ queryFn: () => apiInstance.get("/items") }) // → features/api/
}
```
````

---

### `.github/instructions/shared.instructions.md`

````md
---
applyTo: "src/shared/**"
---

# Layer: `shared`

Reusable infrastructure with **zero business domain knowledge**. The foundation every other layer builds on.

Full reference: [`docs/layers/shared.md`](../../docs/layers/shared.md)

## Structure

`shared/` has no slices — only segments:

```
src/shared/
  api/       # Axios instance + interceptors
  config/    # Typed env var accessors
  lib/       # Generic utility functions
  store/     # Zustand re-exports
  ui/        # Reusable UI primitives (wrapping Ant Design)
```

## Segment Usage

```ts
// HTTP client — always use the shared instance
import { apiInstance } from "@/shared/api"

// Env vars — never read import.meta.env directly in feature/entity code
import { env } from "@/shared/config"
const url = env.apiBaseUrl

// Zustand — import from here, not from "zustand" directly
import { create, devtools } from "@/shared/store"

// UI primitives — use project wrappers, not antd directly
import { Button } from "@/shared/ui"
```

## Import Rules

```ts
// ❌ shared cannot import from any other layer
import { User } from "@/entities/user" // FORBIDDEN
import { useAuthStore } from "@/features/auth" // FORBIDDEN
```

## The Domain Knowledge Test

Before adding anything to `shared/`, ask: _"Does this concept know about users, orders, or any other business entity?"_

```ts
// ✅ Belongs in shared — pure utility, no domain knowledge
export function formatCurrency(amount: number, currency: string): string { ... }

// ❌ Does NOT belong in shared — knows about the User domain
export function getUserFullName(user: User): string { ... }
// → move to entities/user/model/ or features/<name>/lib/
```

## Never Do

```ts
// ❌ Import business domain types
import type { User } from "@/entities/user"

// ❌ Import from axios directly in feature code (use @/shared/api)
import axios from "axios"

// ❌ Import from zustand directly (use @/shared/store)
import { create } from "zustand"

// ❌ Import from antd directly (use @/shared/ui wrappers)
import { Button } from "antd"
```
````

---

### `.github/instructions/test.instructions.md`

````md
---
applyTo: "**/*.test.{ts,tsx}"
---

# Testing Conventions

## Co-location

Tests live next to the source file they test:

```
model/
  authStore.ts
  authStore.test.ts
ui/
  LoginForm.tsx
  LoginForm.test.tsx
```

## Vitest Globals

`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` are available globally — no imports needed:

```ts
// ✅
describe("useAuthStore", () => {
  it("sets user on login", () => {
    expect(store.user).toBeNull()
  })
})

// ❌ Do not import vitest globals
import { describe, it, expect } from "vitest"
```

## Component Tests

Use `@testing-library/react` for component tests:

```tsx
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { LoginForm } from "./LoginForm"

it("shows error on empty submit", async () => {
  render(<LoginForm />)
  await userEvent.click(screen.getByRole("button", { name: /login/i }))
  expect(screen.getByText(/required/i)).toBeInTheDocument()
})
```

## Store Tests

Test Zustand stores by importing the hook and calling actions directly — no need to render a component:

```ts
import { useAuthStore } from "./useAuthStore"

beforeEach(() => {
  useAuthStore.setState({ user: null })
})

it("stores user after login", () => {
  const { login } = useAuthStore.getState()
  login({ id: "1", name: "Alice" })
  expect(useAuthStore.getState().user?.name).toBe("Alice")
})
```

## Mock HTTP

Use `vi.mock` or `msw` for API mocking — never call real endpoints in tests:

```ts
vi.mock("@/shared/api", () => ({
  apiInstance: { post: vi.fn().mockResolvedValue({ data: { token: "abc" } }) },
}))
```
````

---

### `.github/instructions/widgets.instructions.md`

````md
---
applyTo: "src/widgets/**"
---

# Layer: `widgets`

Self-contained UI blocks shared across multiple pages. Larger than a single feature, smaller than a page.

Full reference: [`docs/layers/widgets.md`](../../docs/layers/widgets.md)

## Slice Structure

```
src/widgets/<name>/
  ui/
    <WidgetName>.tsx
    index.ts
  index.ts           # public API barrel
```

## When to Create a Widget

Extract to a widget when the same UI block appears on **two or more pages**. If it's only used by one page, keep it inside that page's `ui/` segment.

## Import Rules

```ts
// ✅ Widgets may import from
import { LoginForm } from "@/features/auth"
import { UserAvatar } from "@/entities/user"
import { Button } from "@/shared/ui"

// ❌ Never import from pages or app
import { HomePage } from "@/pages/home"

// ❌ Never import from another widget
import { Sidebar } from "@/widgets/sidebar" // inside widgets/header
// → shared dependency belongs in features/, entities/, or shared/
```

## Never Do

```ts
// ❌ Own business logic — widgets only compose and arrange
export function Header() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetchUser().then(setUser)
  }, []) // → move to features/
}

// ❌ Define routes or navigation logic
// → belongs in app/router/
```
````

---

## Step 5 — Create prompt templates

Prompt templates for common slice creation tasks.

### `.github/prompts/new-feature.prompt.md`

````md
---
description: Create a complete FSD feature slice following project conventions.
---

# New Feature Slice

Create a complete FSD feature slice following project conventions.

## Steps

1. **Determine the slice name** — use kebab-case, e.g. `user-search`, `create-order`

2. **Read the layer guide** before generating any code:
   - `.github/instructions/features.instructions.md`

3. **Create only the segments needed.** A typical feature:

   ```
   src/features/<name>/
     model/
       use<Name>Store.ts    # Zustand store (if stateful)
       types.ts             # TypeScript interfaces
       index.ts
     api/
       <name>Api.ts         # React Query hooks + raw API calls
       index.ts
     ui/
       <ComponentName>.tsx  # main UI component
       index.ts
     index.ts               # public barrel
   ```

4. **Build in order:** `model/` → `api/` → `ui/`

5. **Write the `index.ts` barrel last** — export only what consumers need:

   ```ts
   export { ComponentName } from "./ui"
   export { use<Name>Store } from "./model"
   export type { <Name>Item } from "./model"
   ```

6. **Check before finishing:**
   - [ ] No imports from other features (`@/features/*`)
   - [ ] No imports from upper layers (`@/pages/*`, `@/widgets/*`)
   - [ ] Zustand imported from `@/shared/store`, not `zustand`
   - [ ] All exported functions have explicit return types
   - [ ] Named exports only — no default exports
````

---

### `.github/prompts/new-entity.prompt.md`

````md
---
description: Create a complete FSD entity slice following project conventions.
---

# New Entity Slice

Create a complete FSD entity slice following project conventions.

## Steps

1. **Determine the entity name** — use kebab-case singular, e.g. `user`, `order`, `product`

2. **Read the layer guide** before generating any code:
   - `.github/instructions/entities.instructions.md`

3. **Create only the segments needed:**

   ```
   src/entities/<name>/
     model/
       types.ts             # TypeScript interfaces/types
       index.ts
     ui/
       <EntityCard>.tsx     # display component(s), if needed
       index.ts
     index.ts               # public barrel
   ```

4. **Write the `index.ts` barrel** — expose types and display components:

   ```ts
   export type { User, UserId } from "./model"
   export { UserAvatar, UserCard } from "./ui"
   ```

5. **If another entity needs types from this one**, create an `@x` file:

   ```
   src/entities/<name>/@x/<consumer>.ts
   ```

   ```ts
   // Re-export only what the consumer entity needs
   export type { UserId } from "../model"
   ```

6. **Check before finishing:**
   - [ ] No API calls or `useQuery`/`useMutation` in entities
   - [ ] No user interaction state (`useState` for editing, etc.) — interactions belong in `features/`
   - [ ] No imports from other entities directly — use `@x` pattern
   - [ ] No imports from `features/`, `widgets/`, `pages/`, `app/`
   - [ ] All exported functions have explicit return types
   - [ ] Named exports only — no default exports
````

---

### `.github/prompts/new-page.prompt.md`

````md
---
description: Create a new route-level page following project conventions.
---

# New Page

Create a new route-level page following project conventions.

## Steps

1. **Determine the route name** — use kebab-case matching the URL path, e.g. `user-profile`, `order-detail`

2. **Read the layer guide** before generating any code:
   - `.github/instructions/pages.instructions.md`

3. **Create the page component:**

   ```
   src/pages/<route-name>/
     ui/
       <PageName>.tsx       # route component — compose only, no logic
       index.ts
     index.ts               # public barrel
   ```

4. **Page component structure** — import and arrange, do not implement:

   ```tsx
   import { SomeWidget } from "@/widgets/some-widget"
   import { SomeFeatureForm } from "@/features/some-feature"

   export function <PageName>Page(): JSX.Element {
     return (
       <div>
         <SomeWidget />
         <SomeFeatureForm />
       </div>
     )
   }
   ```

5. **Register the route** in `src/app/router/index.tsx` — not in the page file:

   ```tsx
   import { <PageName>Page } from "@/pages/<route-name>"
   // add: <Route path="/<route>" element={<<PageName>Page />} />
   ```

6. **Check before finishing:**
   - [ ] No `useState`, `useEffect`, `useQuery` directly in the page component
   - [ ] No direct API calls — all data fetching lives in `features/`
   - [ ] Route registered in `src/app/router/`, not inside the page file
   - [ ] No imports from other pages
   - [ ] Named exports only — no default exports
````

---

## Step 6 — Create skills

Skills are on-demand deep knowledge that Copilot loads when the user's request matches.

### Skills directory structure

```bash
mkdir -p .github/skills/zustand-patterns
mkdir -p .github/skills/git-workflow/platforms
mkdir -p .github/skills/git-workflow/scripts
mkdir -p .github/skills/requesting-code-review
```

### `.github/skills/README.md`

```md
# Skills

On-demand deep knowledge for GitHub Copilot (Tier 4 of the AI customization system).

> System overview: [`docs/superpowers/ai-customization.md`](../../docs/superpowers/ai-customization.md)

## How Skills Work

Copilot reads each skill's `description` frontmatter and loads the full content only when the user's request matches. Skills are **not** auto-injected — they are invoked on demand.

## Available Skills

| Skill                                                         | Triggers when…                                                                                                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`zustand-patterns`](./zustand-patterns/SKILL.md)             | Writing or reviewing Zustand stores                                                                                                                  |
| [`git-workflow`](./git-workflow/SKILL.md)                     | Performing Git operations: branching, committing, PRs, merging, releasing, hotfixing. Supports GitHub and Bitbucket with platform-specific workflows |
| [`requesting-code-review`](./requesting-code-review/SKILL.md) | Completing tasks, implementing major features, or before merging to verify work meets requirements                                                   |

## Adding a New Skill

1. Create `.github/skills/<name>/SKILL.md`
2. Write a `description` frontmatter that starts with "Use when…"
3. Add the skill to the table above
4. Keep content detailed — skills are loaded situationally, token cost is not a concern here

## Candidates for Future Skills

- `react-query-patterns` — `useQuery`, `useMutation`, cache invalidation, optimistic updates
- `fsd-refactor` — migrating non-compliant code to the correct FSD layer
```

---

### Zustand Patterns Skill

### `.github/skills/zustand-patterns/SKILL.md`

````md
---
description: >
  Use when writing, reviewing, or debugging Zustand stores in this project.
  Covers store file structure, devtools setup, typed state/actions pattern,
  slice composition, testing stores, and how to import from @/shared/store
  instead of zustand directly.
---

# Zustand Patterns

This skill covers the project-specific conventions for writing Zustand stores inside `features/<name>/model/`.

Full Zustand docs: https://zustand.docs.pmnd.rs

---

## Import from `@/shared/store`

Never import from `zustand` directly. The project re-exports Zustand from `@/shared/store` to centralise middleware defaults:

```ts
// ✅
import { create } from "@/shared/store"

// ❌
import { create } from "zustand"
```

---

## Store File Structure

One store per feature. File name: `use<FeatureName>Store.ts`. Place in `features/<name>/model/`.

```ts
// src/features/auth/model/useAuthStore.ts
import { create } from "@/shared/store"
import type { AuthUser } from "./types"

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isLoading: false,
}

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}))
```

**Conventions:**

- Split the type into `State` + `Actions` interfaces, compose them as `Store`
- Extract `initialState` as a const — needed for `reset()` and tests
- Actions are plain functions using `set`, not async — async logic belongs in `api/`

---

## Devtools (optional but recommended)

Wrap with `devtools` for Redux DevTools support in development:

```ts
import { create, devtools } from "@/shared/store"

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user }, false, "auth/setUser"),
      reset: () => set(initialState, false, "auth/reset"),
    }),
    { name: "AuthStore" }
  )
)
```

The third argument to `set` is the action name shown in DevTools — use `"sliceName/actionName"` convention.

---

## Accessing State Outside React

Use `getState()` for imperative access (e.g., in API callbacks):

```ts
const { setUser } = useAuthStore.getState()
setUser(responseData.user)
```

---

## Derived / Computed Values

Prefer selectors over storing derived values:

```ts
// ✅ derive in a selector
const isAuthenticated = useAuthStore((state) => state.user !== null)

// ❌ don't store derived values
const isAuthenticated = useAuthStore((state) => state.isAuthenticated) // redundant field
```

For expensive derivations, use `useShallow` to prevent unnecessary re-renders:

```ts
import { useShallow } from "@/shared/store"

const { user, isLoading } = useAuthStore(
  useShallow((state) => ({ user: state.user, isLoading: state.isLoading }))
)
```

---

## Async Actions

Async logic (API calls) does **not** belong in the store. Keep stores synchronous. Use React Query mutations that call store actions on success:

```ts
// ✅ — store is synchronous, React Query handles async
const { mutate: login } = useMutation({
  mutationFn: (credentials: LoginCredentials) =>
    apiInstance.post<AuthUser>("/auth/login", credentials),
  onSuccess: (user) => useAuthStore.getState().setUser(user),
  onError: () => useAuthStore.getState().setUser(null),
})

// ❌ — async inside the store
const useAuthStore = create<AuthStore>()((set) => ({
  login: async (credentials) => {
    const user = await apiInstance.post("/auth/login", credentials)
    set({ user })
  },
}))
```

---

## Testing Stores

Reset state before each test using `setState` on the initial state:

```ts
// src/features/auth/model/useAuthStore.test.ts
import { useAuthStore } from "./useAuthStore"
import { initialState } from "./useAuthStore" // export initialState if needed in tests

beforeEach(() => {
  useAuthStore.setState(initialState)
})

it("setUser updates user state", () => {
  const user = { id: "1", name: "Alice" }
  useAuthStore.getState().setUser(user)
  expect(useAuthStore.getState().user).toEqual(user)
})

it("reset clears user", () => {
  useAuthStore.setState({ user: { id: "1", name: "Alice" } })
  useAuthStore.getState().reset()
  expect(useAuthStore.getState().user).toBeNull()
})
```

Export `initialState` from the store file so tests can reset cleanly without re-declaring it.

---

## Public API Export

Export the store hook from the slice barrel. Do not export internal types unless consumers need them:

```ts
// src/features/auth/model/index.ts
export { useAuthStore } from "./useAuthStore"
export type { AuthUser } from "./types"
// do NOT export initialState, AuthStore type — these are internals
```
````

---

### Git Workflow Skill

### `.github/skills/git-workflow/SKILL.md`

````md
---
description: >
  Use when performing any Git operations: creating branches, committing code,
  pushing changes, creating Pull Requests, merging, resolving conflicts,
  releasing versions, or hotfixing production issues. Covers the full Git Flow
  branching model, Bitbucket PR conventions, protected branch rules, semantic
  versioning, and AI agent safety guardrails. Repository is hosted on Bitbucket
  with Jenkins CI/CD and SonarQube code quality scanning.
---

# Git Workflow

This skill defines the Git branching model, commit conventions, PR workflow, release process, and AI agent behavior rules for this project.

- **Repository hosting:** Bitbucket
- **CI/CD:** Jenkins (not yet configured)
- **Code quality:** SonarQube (not yet deployed)

---

## Branch Model (Git Flow)

```
main ─────────●─────────────●──────────── (production-ready)
              ↑             ↑
         release/1.0   hotfix/1.0.1
              ↑             ↑
development ──┴──●──●──●────┴──●──●───── (integration)
                 ↑  ↑  ↑       ↑  ↑
              feat/ feat/    feat/ fix/
```

### Long-lived Branches

| Branch        | Purpose                                                 | Direct push allowed |
| ------------- | ------------------------------------------------------- | ------------------- |
| `main`        | Production-ready code. Every commit is a release.       | **No** — protected  |
| `development` | Integration branch. All feature work merges here first. | **No** — protected  |

### Short-lived Branches

| Branch pattern            | Created from  | Merges back to         | Purpose                    |
| ------------------------- | ------------- | ---------------------- | -------------------------- |
| `feat/<scope>-<desc>`     | `development` | `development`          | New features               |
| `fix/<scope>-<desc>`      | `development` | `development`          | Bug fixes (non-production) |
| `hotfix/<version>-<desc>` | `main`        | `main` + `development` | Critical production fixes  |
| `release/<version>`       | `development` | `main` + `development` | Release preparation        |

---

## Branch Naming Convention

Branch names always start with a `<type>/` prefix, but the full pattern depends on the type.

- **type**:
  - `feat`, `fix`, `refactor`, `chore`, `test`, `docs` → `<type>/<scope>-<short-description>`
  - `hotfix` → `hotfix/<version>-<short-description>`
  - `release` → `release/<version>`
- **scope** (for non-release/hotfix branches): FSD layer or domain area (e.g., `auth`, `cart`, `shared`, `app`)
- **version** (for `release`/`hotfix`): semantic version (e.g., `1.2.3`)
- **short-description**: kebab-case, 2–5 words describing the change

```bash
# ✅ Good
feat/auth-jwt-refresh
fix/cart-duplicate-items
hotfix/1.2.1-payment-crash
release/1.3.0
refactor/shared-api-interceptors
chore/deps-upgrade-react-router
test/user-store-coverage
docs/architecture-update

# ❌ Bad
feature/add_login           # wrong prefix, underscore
my-branch                   # no type prefix
feat/auth                   # too vague, no description
FEAT/AUTH-LOGIN              # uppercase not allowed
```

---

## Development Workflow

### 1. Start a Feature

```bash
# Always branch from development
git checkout development
git pull origin development
git checkout -b feat/<scope>-<desc>
```

### 2. Commit Changes

Follow the project's Conventional Commits format (see [conventions.md](../../docs/conventions.md)):

```
<type>(<scope>): <description>
```

- Description: **lowercase**, **no period**, **imperative mood**
- Scope is optional but encouraged

```bash
# ✅ Good commits
git commit -m "feat(auth): add login form with validation"
git commit -m "fix(cart): prevent duplicate item entries"
git commit -m "test(user): add coverage for avatar fallback"

# ❌ Bad commits
git commit -m "Fixed the login bug"         # not conventional format
git commit -m "feat(auth): Add Login Form." # uppercase, period
git commit -m "WIP"                         # not descriptive
```

### Atomic Commits

Split changes into **logically cohesive commits** — each commit should represent a single type of change. Do not mix unrelated changes in one commit.

```bash
# ✅ Good — separate commits by change type
git add src/features/auth/
git commit -m "feat(auth): add login form component"

git add src/features/auth/model/useAuthStore.test.ts
git commit -m "test(auth): add unit tests for auth store"

git add docs/layers/features.md
git commit -m "docs(features): update layer guide with auth example"

# ❌ Bad — mixing code, tests, and docs in one commit
git add -A
git commit -m "feat(auth): add login form, tests, and docs"
```

**Splitting guidelines:**

| Change type            | Commit separately | Example scope                                  |
| ---------------------- | ----------------- | ---------------------------------------------- |
| Feature code           | Yes               | `feat(auth): add login form`                   |
| Tests for that feature | Yes               | `test(auth): add login form tests`             |
| Documentation updates  | Yes               | `docs(auth): document login flow`              |
| Style/formatting fixes | Yes               | `style(auth): fix import order`                |
| Refactoring            | Yes               | `refactor(shared): extract http error handler` |
| Dependency updates     | Yes               | `chore(deps): upgrade react-router to v7`      |

**When to combine:** Only combine changes that are inseparable — e.g., a type definition and the code that uses it in the same slice can share one commit if they are part of the same logical change.

### 3. Push and Create PR

```bash
git push origin feat/<scope>-<desc>
```

Then create a Pull Request on Bitbucket targeting `development`.

### 4. Merge

After approval, use **Squash Merge** into `development`. Delete the feature branch after merge.

---

## Pull Request Convention

### PR Title

Use Conventional Commits format — same as the commit message:

```
feat(auth): add JWT refresh token logic
fix(cart): prevent duplicate items on rapid click
```

### PR Description Template

Every PR description should include these sections:

```markdown
## What

Brief description of what this PR does and why.

## Changes

- List specific changes made
- One bullet per logical change

## Testing

- How the changes were tested
- Automated test coverage (new/updated tests)

## Screenshots (if applicable)

Include before/after screenshots for UI changes.

## Checklist

- [ ] Code follows project conventions (FSD, naming, imports)
- [ ] Tests added/updated and passing
- [ ] No lint or type errors
- [ ] Branch is up-to-date with target branch
```

### Review Rules

- **Minimum 1 approval** required before merge
- Reviewers should check: FSD compliance, TypeScript strictness, test coverage, naming conventions
- Address all review comments before merging — do not dismiss without discussion

---

## Merge Strategy

| Scenario                    | Merge method     | Reason                                     |
| --------------------------- | ---------------- | ------------------------------------------ |
| Feature/fix → `development` | **Squash Merge** | Clean linear history on integration branch |
| `release/*` → `main`        | **Merge Commit** | Preserve release context in history        |
| `release/*` → `development` | **Merge Commit** | Sync release fixes back                    |
| `hotfix/*` → `main`         | **Merge Commit** | Preserve hotfix context                    |
| `hotfix/*` → `development`  | **Merge Commit** | Sync hotfix to development                 |

---

## Protected Branch Rules

### `main` branch

- No direct pushes — all changes via PR only
- Requires at least 1 approval
- No force pushes allowed
- No branch deletion

### `development` branch

- No direct pushes — all changes via PR only
- Requires at least 1 approval
- No force pushes allowed
- No branch deletion

Configure these rules in **Bitbucket → Repository Settings → Branch Permissions**.

---

## Release Process

### 1. Create Release Branch

```bash
git checkout development
git pull origin development
git checkout -b release/1.3.0
```

### 2. Prepare Release

- Bump version using `npm version`:
  ```bash
  npm version <version> --no-git-tag-version  # e.g., npm version 1.3.0 --no-git-tag-version
  git add package.json package-lock.json
  git commit -m "chore(release): bump version to 1.3.0"
  ```
  **CRITICAL:** Always use `npm version` instead of manually editing `package.json` — it automatically syncs `package-lock.json`. The `--no-git-tag-version` flag prevents auto-commit and auto-tag (we control those separately per Git Flow).
- Final bug fixes and documentation updates only — no new features
- Run full test suite: `npm run test:run`
- Run lint: `npm run lint`
- Build check: `npm run build`

### 3. Merge to `main`

```bash
# Create PR: release/1.3.0 → main
# After approval, use Merge Commit
```

### 4. Tag the Release

```bash
git checkout main
git pull origin main
git tag -a v1.3.0 -m "release: v1.3.0"
git push origin v1.3.0
```

### 5. Back-merge to `development`

```bash
# Create PR: release/1.3.0 → development (or merge main → development)
# Use Merge Commit to sync
```

### 6. Cleanup

Delete the `release/1.3.0` branch after both merges are complete.

---

## Hotfix Process

For critical production bugs that cannot wait for the next release cycle.

### 1. Create Hotfix Branch

```bash
git checkout main
git pull origin main
git checkout -b hotfix/1.2.1-payment-crash
```

### 2. Fix and Test

- Apply the minimal fix
- Add regression test
- Bump patch version using `npm version <version> --no-git-tag-version`

### 3. Merge to `main`

```bash
# Create PR: hotfix/1.2.1-payment-crash → main
# After approval, use Merge Commit
```

### 4. Tag

```bash
git checkout main
git pull origin main
git tag -a v1.2.1 -m "hotfix: v1.2.1 — fix payment crash"
git push origin v1.2.1
```

### 5. Back-merge to `development`

```bash
# Create PR: hotfix/1.2.1-payment-crash → development
# Use Merge Commit to sync the fix
```

### 6. Cleanup

Delete the hotfix branch after both merges are complete.

---

## Semantic Versioning

Format: `v<MAJOR>.<MINOR>.<PATCH>`

| Segment | Increment when…                            | Example  |
| ------- | ------------------------------------------ | -------- |
| MAJOR   | Breaking changes to public API or behavior | `v2.0.0` |
| MINOR   | New features, backward-compatible          | `v1.3.0` |
| PATCH   | Bug fixes, backward-compatible             | `v1.2.1` |

**Tag format:** Always prefix with `v` — `v1.0.0`, `v1.2.1`, etc.

**Pre-release tags** (optional): `v1.3.0-beta.1`, `v1.3.0-rc.1`

---

## Platform-Specific PR Workflow

This skill supports multiple hosting platforms. The agent determines which platform to use by reading the **Hosting** field in `copilot-instructions.md` → Context section.

```
Hosting = GitHub    → Read platforms/github.md    (MCP tools)
Hosting = Bitbucket → Read platforms/bitbucket.md (project scripts)
```

**Instructions for the agent:**

1. Check `copilot-instructions.md` for the `Hosting:` value
2. Load **only** the corresponding platform file using `read_file`
3. Follow the platform-specific workflow for PR creation and management

| Platform  | PR Creation                      | PR Comments                    | Authentication                        |
| --------- | -------------------------------- | ------------------------------ | ------------------------------------- |
| GitHub    | `mcp_github_create_pull_request` | `mcp_github_add_issue_comment` | MCP OAuth                             |
| Bitbucket | `scripts/create-pr.js`           | `scripts/add-pr-comment.js`    | `BITBUCKET_EMAIL` + `BITBUCKET_TOKEN` |

### Commit Message Content Rules

Before generating any commit message, **always** read `.github/.copilot-commit-message-instructions.md` for content formatting rules.

### Script Reference (Bitbucket only)

Scripts are located at `.github/skills/git-workflow/scripts/`:

| Script                | Purpose            | Input                                                     | Output                        |
| --------------------- | ------------------ | --------------------------------------------------------- | ----------------------------- |
| `parse-diff.js`       | Analyze changes    | `--staged` or `--files`                                   | JSON: files, stats, summary   |
| `validate-message.js` | Validate format    | stdin: plain text                                         | JSON: valid, errors           |
| `format-commit.js`    | Format & write     | stdin: `{title, paragraphs}`                              | JSON: messageFilePath, valid  |
| `git-workflow.js`     | Execute workflow   | `--all --message-file <path> --push`                      | JSON: add/commit/push results |
| `create-pr.js`        | Create / update PR | `--target <branch> [--title] [--summary] [--description]` | JSON: success, url            |
| `add-pr-comment.js`   | Add PR comments    | `--pr-id <n> --comment <text>`                            | JSON: success, results        |

> Prefer using `--summary` with `create-pr.js` so the script can auto-generate the full description. You may also pass `--description` manually; the script will normalize literal `\n` / `\r` sequences to real newlines for cross-shell compatibility.

---

## AI Agent Behavior Rules

### Language Rules

- Thinking chain and response text: use the **same language as the user** (Chinese or English)
- Code, comments, documentation, commit messages, and PR content: **always in English**

### Branch-First Workflow

**CRITICAL:** When implementing any code changes, the agent MUST:

1. Analyze requirements first
2. Plan the implementation
3. **Create a feature branch BEFORE writing any code** — never code on `main` or `development` directly
4. Implement the changes
5. Commit with proper Conventional Commits format
6. Push and describe PR steps

```bash
# ✅ Agent workflow
git checkout development && git pull
git checkout -b feat/auth-login-form
# ... implement login form UI ...
git add src/features/auth/ui/LoginForm.tsx
git commit -m "feat(auth): add login form UI"

# ... implement login form tests ...
git add src/features/auth/ui/LoginForm.test.tsx
git commit -m "test(auth): add login form validation tests"

# ❌ Agent mistake — coding on protected branch
git checkout main
# ... making changes directly ... ← FORBIDDEN
```

### Atomic Commit Discipline

When committing changes, the agent MUST split commits by change type:

1. **Analyze** the staged changes — identify distinct categories (code, tests, docs, config, style)
2. **Stage selectively** — use `git add <specific-files>` instead of `git add -A`
3. **Commit separately** — one commit per logical change type
4. **Order logically** — code first, then tests, then docs

```bash
# ✅ Agent commit workflow
git add src/features/auth/ui/ src/features/auth/model/
git commit -m "feat(auth): add login form with store"

git add src/features/auth/model/useAuthStore.test.ts
git commit -m "test(auth): add auth store unit tests"

git add docs/layers/features.md
git commit -m "docs(features): add auth feature example"
```

### Safe Operations (agent may perform freely)

- Creating branches from `development`
- Making commits on feature/fix branches
- Running tests, lint, build commands
- Reading files, searching code

### Dangerous Operations (agent MUST ask user first)

- `git push --force` or `git push -f` — **NEVER** on `main`/`development`, ask before using on any branch
- `git reset --hard` — destructive, always confirm
- Deleting branches (`git branch -D`)
- Merging into `main` or `development`
- Amending published commits (`git commit --amend` after push)
- Tagging releases

### Commit/PR Message Review

Before executing `git commit` or creating a Pull Request, the agent MUST display the proposed message to the user for review:

1. **Show the message** in the response text — commit message or PR title/description
2. **Wait for confirmation** — use `vscode_askQuestions` with options like "confirm", "edit message", "cancel"
3. **Only execute** after user approval

```
# ✅ Agent shows message first
"I will commit with the following message:
  feat(auth): add login form with validation
Confirm?"

# ❌ Agent commits without showing message
git commit -m "feat(auth): add login form with validation"  ← user never saw this
```

### Iterative Workflow

If new changes arise after a commit (e.g., fixing a review comment, addressing lint errors, or adding missed files), the agent MUST re-enter the workflow from the appropriate step:

1. **Assess** — what changed and why
2. **Stage selectively** — only the new/modified files
3. **Show commit message** — for user review (per the rule above)
4. **Commit** — after approval
5. **Push** — if previous commits were already pushed

Do not skip steps or batch leftover changes silently. Each round of changes follows the same discipline.

### Session End Gate

**MANDATORY:** After completing any task or yielding control, the agent MUST call the `vscode_askQuestions` tool to ask the user about the next action. Derive context-appropriate options from the current state and always include a "pause/stop" option. This applies after every commit, push, PR creation, or code change — not only at session end.

### MCP Tool Pitfalls

**PR body formatting:** When calling any MCP tool that creates or updates a Pull Request (e.g., `mcp_github_create_pull_request`, `mcp_bitbucket_*`, or similar), the `body` / `description` parameter MUST use actual multi-line strings (real newlines), NOT `\n` escape sequences. Escaped newlines are stored literally and break markdown rendering on the hosting platform.

```
# ❌ Escape sequences — renders as one long line
body: "## Summary\n\nSome text\n\n## Changes\n- item"

# ✅ Real newlines — renders correctly as markdown
body: "## Summary

Some text

## Changes
- item"
```

If a PR description is found to be malformatted, use the corresponding update tool (e.g., `mcp_github_update_pull_request`) to overwrite it with properly formatted text.

---

## Quick Reference

```bash
# Start feature
git checkout development && git pull && git checkout -b feat/<scope>-<desc>

# Commit (stage selectively; avoid `git add -A` for mixed changes)
git add <file-or-path>... && git commit -m "<type>(<scope>): <description>"

# Push
git push origin feat/<scope>-<desc>

# Start release
git checkout development && git pull && git checkout -b release/<version>

# Tag release
git tag -a v<version> -m "release: v<version>" && git push origin v<version>

# Start hotfix
git checkout main && git pull && git checkout -b hotfix/<version>-<desc>

# Tag hotfix
git tag -a v<version> -m "hotfix: v<version> — <desc>" && git push origin v<version>
```
````

---

#### Platform: Bitbucket

### `.github/skills/git-workflow/platforms/bitbucket.md`

````md
# Bitbucket PR Workflow

Platform-specific scripted commit and PR workflow for Bitbucket-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = Bitbucket.
>
> **Prerequisite:** Read the main [SKILL.md](../SKILL.md) first for generic Git Flow rules,
> branch naming, merge strategy, and AI agent behavior rules. This file covers only the
> **Bitbucket-specific scripted workflow** — the 9-step commit/PR automation.

---

## ✅ [TASKS] Script-Powered Workflow

> ### 🚨 HARD STOP — READ BEFORE EXECUTING ANY GIT COMMAND
>
> **RULE 1:** You MUST call `vscode_askQuestions` and receive explicit user confirmation **before every push to remote**. No exceptions.
>
> **RULE 2:** The user selecting `✅ 提交变更` in a prior turn is NOT sufficient. Each commit workflow requires its own confirmation at **Step 4.5** (see below).
>
> **Violation = unauthorised remote push. Never skip the confirmation gate.**

### Step 0: Initialize Todo List (ALWAYS FIRST)

Before doing anything else, call `manage_todo_list` to create the full workflow plan:

```typescript
manage_todo_list([
  { id: 1, title: "Request commit permission", status: "not-started" },
  { id: 2, title: "Parse staged changes", status: "not-started" },
  { id: 3, title: "Generate commit message", status: "not-started" },
  { id: 4, title: "Validate & format message", status: "not-started" },
  { id: 5, title: "Confirm push", status: "not-started" },
  { id: 6, title: "Execute git workflow", status: "not-started" },
  { id: 7, title: "Create PR (if needed)", status: "not-started" },
  { id: 8, title: "Code review (optional)", status: "not-started" },
  { id: 9, title: "Post-merge cleanup", status: "not-started" },
])
```

This gives the user a live view of workflow progress in VS Code.

> **Todo → Step mapping**: id:1 = Step 1 (permission), id:2 = Step 2 (parse), id:3 = Step 3 (generate), id:4 = Step 4 (validate), id:5 = Step 4.5 (confirm gate), id:6 = Step 5 (git push), id:7 = Step 6 (PR), id:8 = Step 8 (code review), id:9 = Step 9 (post-merge cleanup)

> **Note**: If Step 1 is skipped (user JUST approved in same turn), mark todo id:1 as `completed` immediately and proceed.

---

### Step 1: Request User Permission (MANDATORY)

**Mark todo id:1 as `in-progress` before calling `vscode_askQuestions`.**

Use `vscode_askQuestions` with this structure:

```typescript
{
  questions: [
    {
      header: "提交变更",
      question: "代码变更已完成并验证。是否提交本次变更到 Git？（本次变更：<brief summary>）",
      options: [
        { label: "✅ 允许提交（git add + commit + push）", recommended: true },
        { label: "❌ 暂不提交（我需要再检查）" },
      ],
    },
  ]
}
```

**NEVER** proceed without explicit "Allow" selection.

> **Skip condition**: Step 1 MAY be skipped only when the user JUST selected `✅ 提交变更` in the post-implementation `vscode_askQuestions` **in the same response turn**. In that case, treat that selection as the Step 1 approval and proceed directly to Step 2. All other invocations require a fresh `vscode_askQuestions`.

When user selects "Allow": **mark todo id:1 as `completed`**.
When user selects "Cancel": mark id:1 as `completed`, stop workflow.

### Step 2: Parse Changes

**Mark todo id:2 as `in-progress`**, then run:

IF user selects "Allow":

```bash
node .github/skills/git-workflow/scripts/parse-diff.js --staged
```

**Output**: JSON with `{ files, stats, summary }` for context.

**Mark todo id:2 as `completed`** after parsing.

### Step 3: Generate Commit Message Content

**Mark todo id:3 as `in-progress`**.

1. **READ** `.copilot-commit-message-instructions.md` (entire file)
2. Apply content rules (type selection, imperative mood, English, meaningful description)
3. Structure message as JSON:
   ```json
   {
     "title": "<type>[scope]: <description>",
     "paragraphs": ["Description paragraph", "Changes:\n- Item 1\n- Item 2", "Results:\n- Metric"]
   }
   ```
4. **Focus on CONTENT ONLY** - scripts handle formatting/validation

**Mark todo id:3 as `completed`** once the JSON message is constructed.

### Step 4: Validate & Format Message

**Mark todo id:4 as `in-progress`**.

```bash
echo '<json>' | node .github/skills/git-workflow/scripts/format-commit.js
```

**Result**:

- ✅ Valid: Returns `{ valid: true, messageFilePath: "/tmp/...", ... }` → **mark todo id:4 as `completed`**
- ❌ Invalid: Returns `{ valid: false, errors: [...] }` → fix and retry (keep id:4 as `in-progress`)

### Step 4.5: Confirm Before Push (MANDATORY — NO EXCEPTIONS)

**Mark todo id:5 as `in-progress`**.

The formatted commit message is already written to `messageFilePath` by `format-commit.js`.
Create a human-readable preview file **in the workspace root** and include the path as a link in the confirmation prompt:

> ⚠️ **CRITICAL — Preview file location**: ALWAYS use the **`.tmp/` directory** in workspace root (e.g. `<workspace-root>/.tmp/commit-preview.md`).  
> **NEVER** use `/tmp`, system temp folders, or paths outside the project.  
> Only workspace-rooted files are visible/clickable in VS Code's Copilot Chat.

```bash
# 0. Ensure .tmp directory exists
mkdir -p .tmp
```

```typescript
// 1. Write a Markdown preview of the commit message
//    ✅ CORRECT: .tmp directory in workspace root
const previewPath = `<absoluteWorkspaceRoot>/.tmp/commit-preview.md`
//    ❌ WRONG:   /tmp/commit-preview-xxx.md  (not visible in VS Code)
create_file(
  previewPath,
  [
    `# Commit Preview`,
    ``,
    `**Branch**: ${source} → origin/${source}`,
    ``,
    `\`\`\``,
    commitMessageText, // full formatted message read from messageFilePath
    `\`\`\``,
  ].join("\n")
)

// 2. In the CHAT RESPONSE TEXT (not inside ask_questions), output a
//    Markdown link so the user can click to open the file:
//      请审阅提交消息：[.tmp/commit-preview.md](.tmp/commit-preview.md)
//    This renders as a clickable link in Copilot Chat.

// 3. Then show a minimal prompt — NO path or content in the question
ask_questions([
  {
    header: "确认推送",
    question: "已弹出预览，审阅后确认执行 git add → commit → push？",
    options: [
      { label: "✅ 确认推送", recommended: true },
      { label: "✏️ 修改后重新生成", description: "返回 Step 3 重新生成消息" },
      { label: "❌ 取消" },
    ],
  },
])
```

- If `✅ 确认推送`:
  1. **Mark todo id:5 as `completed`**
  2. `run_in_terminal`: `rm "${previewPath}"`
  3. Proceed to Step 5
- If `✏️ 修改后重新生成`:
  1. `run_in_terminal`: `rm "${previewPath}"`
  2. Mark id:5 as `not-started`, return to Step 3
- If `❌ 取消`:
  1. `run_in_terminal`: `rm "${previewPath}"`
  2. **STOP. Do NOT run git-workflow.js.**

> ⚠️ **This is the only gate that prevents an unauthorised remote push. Never skip it.**

### Step 5: Execute Git Workflow

**Mark todo id:6 as `in-progress`**.

```bash
node .github/skills/git-workflow/scripts/git-workflow.js \
  --all \
  --message-file <path-from-step-4> \
  --push
```

**Error handling**: Script returns structured errors with suggestions (e.g., commitlint failures, push conflicts).

On success: **mark todo id:6 as `completed`**.
On failure: keep id:6 as `in-progress`, report the error.

### Step 6: Offer PR Creation (MANDATORY after successful commit)

**Mark todo id:7 as `in-progress`**.

After `git-workflow.js` reports a successful push, **always** ask the user:

```typescript
{
  questions: [
    {
      header: "创建 PR",
      question: "提交已推送。是否需要创建 Pull Request？",
      options: [
        { label: "✅ 创建 PR → development", recommended: true },
        { label: "✅ 创建 PR → main" },
        { label: "❌ 不需要，结束流程" },
      ],
    },
  ]
}
```

IF user selects "❌ 不需要": **mark todo id:7 as `completed`**, workflow ends.

IF user selects a branch target, follow this sequence:

#### 6a. Collect ALL commits since merge base (MANDATORY — must execute)

```bash
git log origin/<target>..HEAD --format="%s" --reverse
```

> ⚠️ **CRITICAL**: You MUST execute this command and capture the FULL output.
> Do NOT skip this step. Do NOT assume you know the commits.
> The PR title and summary MUST be based on ALL commits, not just the latest one.

#### 6b. AI generates PR title AND summary (MANDATORY — do NOT skip)

**INPUT**: The COMPLETE commit list from Step 6a (all commits, oldest → newest)

**REQUIREMENT**: Analyze **EVERY commit** in the list and produce **two outputs**:

**① Title** — concise headline for the PR:

- Follows **conventional commit** format: `type(scope): description`
- Uses the **dominant type** by priority: `feat > fix > perf > refactor > chore`
- Sets `(scope)` to the branch name stripped of its prefix (e.g. `feature/setup` → `setup`)
- The **description** must **semantically summarize what this ENTIRE PR achieves** as a whole
  — ⚠️ **CRITICAL**: Do NOT copy-paste ONE commit message
  — ⚠️ **CRITICAL**: Do NOT ignore commits — analyze ALL of them
  — ⚠️ **CRITICAL**: If there are 5 commits, your summary must reflect all 5
  — think: "What would a reviewer need to know at a glance about this entire branch?"
- Must be ≤ 72 characters
- Good examples:
  - `feat(setup): initial project scaffolding and CI automation`
  - `fix(auth): resolve token refresh race condition`
  - `refactor(time-runner): extract PiP logic and improve UI layout`

**② Summary paragraph** — 2-3 sentence natural-language overview for the PR description body:

- Describe _what changed and why_ **across ALL commits**, not just one commit
- ⚠️ **CRITICAL**: Must cover the FULL scope of changes in the commit list from 6a
- Audience: a code reviewer who needs context at a glance
- Do NOT exceed 3 sentences; avoid repeating the title
- Good examples:
  - `Refactors the PiP window feature into a dedicated hook and component, improving layout consistency and making the UI resize-aware. Also automates Bitbucket PR creation with commit-driven title and description generation.`
  - `Adds support for theme tokens in PiP forms, fixes UTF-8 encoding issues in skill documentation, and standardizes the five-element framework across all prompt files.`

#### 6c. Preview in VS Code, then confirm

```bash
# 1. Dry-run to build the full payload without calling the API
node .github/skills/git-workflow/scripts/create-pr.js \
  --target <development|main> \
  --title "<AI-generated title from 6b ①>" \
  --summary "<AI-generated summary paragraph from 6b ②>" \
  [--pr-id <n>] \
  --dry-run
```

```bash
# 2. Ensure .tmp directory exists
mkdir -p .tmp
```

```typescript
// 3. Write a human-readable Markdown preview in the .tmp directory.
//    ⚠️ MUST use .tmp/ in workspace root so the file is visible and git-ignored.
//    ⚠️ ALWAYS delete existing file first, then create fresh.
//       Temp files may have been modified by external tools between sessions.
//       NEVER use replace_string_in_file on temp/preview files — always rm + create_file.
const previewPath = `<absoluteWorkspaceRoot>/.tmp/pr-preview.md`

// Step 3a: Delete any existing preview file
run_in_terminal(`rm -f "${previewPath}"`)

// Step 3b: Create fresh preview file
create_file(
  previewPath,
  [
    `# PR Preview`,
    ``,
    `**Title**: ${payload.title}`,
    `**${isUpdate ? "Updating" : "Creating"}**: ${source} → ${target}`,
    `**Commits included**: ${commits.length} (from Step 6a)`,
    ``,
    `---`,
    ``,
    payload.description,
  ].join("\n")
)

// Step 3c: Read-back verification (MANDATORY)
//    Immediately read the file after writing to confirm content matches.
//    If title or commit count mismatch → delete and recreate.
read_file(previewPath) // verify title + commits count

// 4. In the CHAT RESPONSE TEXT, output a Markdown link:
//      请审阅 PR 预览：[.tmp/pr-preview.md](.tmp/pr-preview.md)
//    Clickable in Copilot Chat. Do NOT put the path inside ask_questions.
//    ⚠️ VERIFICATION: Check that "Commits included" matches the count from 6a.

// 5. Show a minimal prompt — NO path or content in the question
ask_questions([
  {
    header: "确认 PR",
    question: `已弹出预览，审阅后确认${isUpdate ? "更新" : "创建"} PR？`,
    options: [
      { label: "✅ 确认", recommended: true },
      { label: "✏️ 修改标题或概述", description: "返回 6b 重新生成" },
      { label: "❌ 取消" },
    ],
  },
])
```

```bash
# On confirm ✅ — delete preview then call the API
rm "${previewPath}"
node .github/skills/git-workflow/scripts/create-pr.js \
  --target <development|main> \
  --title "<title>" \
  --summary "<summary>" \
  [--pr-id <n>]

# On cancel/retry ✏️ or ❌ — always delete the preview file first
rm "${previewPath}"
```

> **Note on `--pr-id`**: omit when creating a new PR; add `--pr-id <number>` to update an existing one (uses HTTP PUT, expects HTTP 200).

**Handling `create-pr.js` output**:

| `success` | field         | Action                                                                                                 |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `true`    | `url`         | **Mark todo id:7 as `completed`**. Report PR URL to user — workflow complete ✅                        |
| `false`   | `fallbackUrl` | Mark todo id:7 as `completed`. Credentials not configured → tell user to open `fallbackUrl` in browser |
| `false`   | `error` only  | Mark todo id:7 as `completed`. Report error message — workflow complete with warning ⚠️                |

> ### 🚨 MANDATORY WORKFLOW END RULE
>
> After marking id:7 as `completed`, if you have **any follow-up question** for the user
> (e.g. "是否还需要更新 PR 描述？", "需要我做 code review 吗？"), you MUST ask it via
> `vscode_askQuestions`. **Never use plain chat text as a question.** Plain text questions are
> invisible to the workflow and cannot be tracked or enforced.

---

### Step 8: Optional Code Review (AFTER PR success)

**Mark todo id:8 as `in-progress`**.

After PR creation succeeds (Step 6 marked as `completed`), **always** offer code review:

```typescript
{
  questions: [
    {
      header: "代码审查",
      question: "PR 已创建成功。是否需要立即执行代码审查？",
      options: [
        { label: "🔍 立即执行代码审查", description: "读取 requesting-code-review skill 并执行" },
        { label: "⏸️ 稍后手动审查", description: "结束工作流", recommended: true },
        { label: "📝 继续其他工作", description: "结束工作流" },
      ],
    },
  ]
}
```

**IF user selects "🔍 立即执行代码审查"**:

1. **Read the skill file**:

   ```typescript
   read_file({
     filePath: "d:\\source\\rsp\\ctw\\.github\\skills\\requesting-code-review\\SKILL.md",
     startLine: 1,
     endLine: 999, // Read entire file
   })
   ```

2. **Follow the skill instructions** to execute the code review workflow

3. **Post review findings to PR (MANDATORY when PR exists)**:

   After the code review produces findings, use `add-pr-comment.js` to post them
   as comments on the PR page so reviewers can see them in context.

   **AI Signature**: Always include `--signature` to attribute AI-generated comments:

   ```
   --signature "🤖 *AI Review — GitHub Copilot*"
   ```

   **Inline comments** (for file-specific findings):

   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --data '[
       { "file": "src/path/to/file.ts", "line": 10, "comment": "**[Critical]** Issue description..." },
       { "file": "src/path/to/other.ts", "line": 25, "comment": "**[Important]** Suggestion..." }
     ]'
   ```

   **General summary comment** (for overall review):

   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --comment "## 🔍 Code Review Summary\n\n<markdown summary of all findings>"
   ```

   **Comment formatting rules**:
   - Prefix severity: `**[Critical]**`, `**[Important]**`, `**[Suggestion]**`
   - Use Markdown formatting in comment content
   - Include file path and line number in the comment body as fallback
   - Post inline comments first, then a general summary comment last

   > **Note**: If `add-pr-comment.js` fails (missing credentials), report findings in chat instead.
   > The code review results are still valuable even without PR comments.

4. **Fix issues and reply to review comments (MANDATORY after fixes)**:

   After fixing review findings, reply to each original comment with the fix result.
   Use `--parent-id` to create threaded replies:

   **Single reply** (CLI mode):

   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --parent-id <comment-id> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --comment "Fixed in <commit-hash>: <brief description of fix>"
   ```

   **Batch replies** (multiple comments at once):

   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --data '[
       { "parentId": 12345, "comment": "Fixed in abc1234: Added NaN validation" },
       { "parentId": 12346, "comment": "Fixed in abc1234: Extracted to utils.js" }
     ]'
   ```

   **Reply content guidelines**:
   - Start with commit hash: `"Fixed in <hash>: ..."`
   - Briefly describe what was changed
   - Include test/verification result if applicable

5. **After code review completes**: mark todo id:8 as `completed`, workflow ends ✅

**IF user selects "⏸️ 稍后手动审查" or "📝 继续其他工作"**:

- Mark todo id:8 as `completed`
- Workflow ends ✅

> **Note**: This step is OPTIONAL. Users may prefer to review code later or have already reviewed during implementation. The choice respects different workflow preferences.

---

### Step 9: Post-Merge Cleanup (AFTER PR is merged)

**Mark todo id:9 as `in-progress`**.

This step activates when the user confirms that the PR has been merged (or when the agent detects a merged PR). It cleans up the local workspace by switching back to development and pulling the latest changes.

**1. Switch to development and pull latest**:

```bash
git checkout development && git pull origin development
```

**2. Optionally delete the feature branch**:

```typescript
ask_questions([
  {
    header: "清理分支",
    question: `PR 已合并。是否删除本地分支 \`${featureBranch}\`？`,
    options: [{ label: `✅ 删除 ${featureBranch}`, recommended: true }, { label: "❌ 保留分支" }],
  },
])
```

If user confirms deletion:

```bash
git branch -d <feature-branch>
```

**3. Report cleanup result**:

Report: `✅ 已切换到 development 并更新到最新 (${shortHash})。本地分支 \`${featureBranch}\` 已删除。`

**Mark todo id:9 as `completed`**.

> **Trigger**: This step is offered after the user says "已合并" / "merged" / "PR 已合并",
> or when the agent detects the PR has been merged via API.
> It can also be included as an option in the post-workflow `vscode_askQuestions`.

---

### Workflow Complete — Hand Back to Session

After the git-commit-workflow ends (regardless of which step):

1. **Clear the todo list** (`manage_todo_list` with empty array)
2. **Trigger the universal ask_questions rule** from `copilot-instructions.md` Section 5A
   - Derive options from current session context
   - This is MANDATORY — the commit workflow does NOT own the session end

> ⚠️ The git-commit-workflow is a **sub-workflow**. When it completes,
> control returns to the main session. Section 5A always applies.

---

**Credentials setup** (guide user through this when `fallbackUrl` is returned):

> ⚠️ **Important**: Must use a **Bitbucket Cloud API Token** — NOT an Atlassian Account API Token.
> The `ATATT3x...` tokens from `id.atlassian.com` are for Jira/Confluence and will **not** work with `api.bitbucket.org`.
> Bitbucket API tokens use **Basic auth** (email + token), not Bearer.

1. Create a token at: **`https://bitbucket.org/account/settings/api-tokens/`** → "Create API token"
   - Required scopes: **Repositories** (Read + Write), **Pull requests** (Read + Write)
2. Add **both** vars to `~/.bashrc` (or `~/.bash_profile`):
   ```bash
   export BITBUCKET_EMAIL="your-atlassian-email@example.com"
   export BITBUCKET_TOKEN="your-bitbucket-api-token"
   ```
   Then run: `source ~/.bashrc`
3. Or set both `BITBUCKET_EMAIL` and `BITBUCKET_TOKEN` in **Windows User Environment Variables** and restart VS Code.

---

---

### 3. Script Delegation

**Let scripts handle**:

- Character limit validation (title ≤100, body ≤72)
- Message file writing and `git commit -F <file>` execution
- Conventional commit format verification
- Git command sequencing and error handling

**Your responsibility**:

- Generating meaningful commit content
- Selecting appropriate type/scope
- Crafting clear descriptions and metrics

---

---

## 💡 [EXAMPLES] Usage Patterns

### Example 1: Standard Feature Commit (with PR)

```
1. ask_questions → User: "✅ 允许"
2. parse-diff.js → "3 files: 2 modified, 1 added (+45 -12 lines)"
3. Read guidelines → Generate JSON:
   { "title": "feat(auth): add OAuth2 login",
     "paragraphs": ["Implement OAuth2 with Google provider", "Changes:\n- Add strategy config\n- Integrate library"] }
4. format-commit.js → { valid: true, messageFilePath: "/tmp/msg.txt" }
5. git-workflow.js --all --message-file /tmp/msg.txt --push
   → { commit: { success: true, hash: "abc123" }, push: { success: true } }
6. ask_questions → User: "✅ 创建 PR → development"
   create-pr.js --target development
   → { success: true, url: "https://bitbucket.org/.../pull-requests/42" }
   Report: "PR created: https://..."
```

### Example 2: Validation Failure Recovery

```
1-3. [Normal flow]
4. format-commit.js → { valid: false, errors: ["Body line 2 exceeds 72 chars (78 chars): '- Implement comprehensive validation logic...'"] }
5. Shorten line: "- Implement comprehensive validation\n- Add credential checks"
6. Retry format-commit.js → { valid: true }
7. Proceed with git-workflow.js
```

---

---

## 🔗 Related Files

- **Content Rules**: `.github/.copilot-commit-message-instructions.md` (MANDATORY)
- **Scripts**: `.github/skills/git-workflow/scripts/*.js`
- **Validation Config**: `commitlint.config.ts`

---
````

---

#### Platform: GitHub

### `.github/skills/git-workflow/platforms/github.md`

````md
# GitHub PR Workflow

Platform-specific PR operations for GitHub-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = GitHub.

---

## Creating a Pull Request

Use the `mcp_github_create_pull_request` MCP tool:

```typescript
mcp_github_create_pull_request({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  title: "<type>(<scope>): <description>",
  body: "<PR description in markdown>",
  head: "<source-branch>",
  base: "<target-branch>", // "development" for features, "main" for releases/hotfixes
})
```

### Body Formatting Rule

**CRITICAL:** The `body` parameter MUST use actual multi-line strings (real newlines), NOT `\n` escape sequences. Escaped newlines are stored literally and break markdown rendering.

```
# ❌ Escape sequences — renders as one long line
body: "## Summary\n\nSome text\n\n## Changes\n- item"

# ✅ Real newlines — renders correctly as markdown
body: `## Summary

Some text

## Changes
- item`
```

---

## Updating a Pull Request

If the PR body is malformatted or needs changes:

```typescript
mcp_github_update_pull_request({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  pullNumber: <pr-number>,
  body: "<corrected body with real newlines>"
})
```

---

## Adding PR Comments

Use `mcp_github_add_issue_comment` for general comments:

```typescript
mcp_github_add_issue_comment({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  issueNumber: <pr-number>,
  body: "<comment in markdown>"
})
```

---

## Workflow Summary

```
1. Implement changes on feature branch
2. Commit with conventional commit format
3. Push to remote
4. Create PR via mcp_github_create_pull_request
5. (Optional) Request code review
6. Merge via GitHub UI or mcp_github_merge_pull_request
```
````

---

#### Script: `utils.js`

### `.github/skills/git-workflow/scripts/utils.js`

```js
/**
 * @fileoverview Shared utilities for git-commit-workflow scripts.
 * Provides constants, type definitions (via JSDoc), and helper functions
 * used across all git workflow scripts.
 *
 * @module utils
 */

import { exec } from "child_process"
import { promisify } from "util"
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, dirname } from "path"
import https from "https"

const execAsync = promisify(exec)

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
})

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
    const { stdout, stderr } = await execAsync(command)
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() }
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout?.trim() || "",
      stderr: error.stderr?.trim() || "",
      error: error.message,
    }
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
export function writeTempFile(content, prefix = "git-commit-") {
  const tempDir = mkdtempSync(join(tmpdir(), prefix))
  const filePath = join(tempDir, "message.txt")
  writeFileSync(filePath, content, "utf8")
  return filePath
}

/**
 * Remove a temporary file. Silently ignores errors.
 *
 * @param {string} filePath - Absolute path to delete
 */
export function cleanupTempFile(filePath) {
  try {
    unlinkSync(filePath)
    // Also remove the parent temp directory created by mkdtempSync
    const dir = dirname(filePath)
    rmSync(dir, { recursive: true, force: true })
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
  const dataIndex = args.indexOf("--data")
  if (dataIndex >= 0 && args[dataIndex + 1]) {
    try {
      return JSON.parse(args[dataIndex + 1])
    } catch (error) {
      throw new Error(`Invalid JSON in --data: ${error.message}`)
    }
  }

  // When stdin is an interactive TTY (not piped), waiting for data would
  // block forever. Fail fast with a clear message so the caller knows to
  // use the --data argument instead. This avoids the misleading
  // "stdin is not a tty" error observed in Windows terminal environments.
  if (process.stdin.isTTY) {
    throw new Error(
      "No input provided and stdin is a TTY (interactive terminal).\n" +
        "Pass commit message JSON via --data:\n" +
        '  node format-commit.js --data \'{"title":"feat: add","paragraphs":[]}\''
    )
  }

  return new Promise((resolve, reject) => {
    const chunks = []
    process.stdin.on("data", (chunk) => chunks.push(chunk))
    process.stdin.on("end", () => {
      try {
        const input = Buffer.concat(chunks).toString("utf8").trim()
        if (!input) {
          resolve(null)
          return
        }
        resolve(JSON.parse(input))
      } catch (error) {
        reject(new Error(`Invalid JSON from stdin: ${error.message}`))
      }
    })
    process.stdin.on("error", reject)
  })
}

/**
 * Print a JSON result to stdout (pretty-printed, 2-space indent).
 *
 * @param {any} result - Data to serialize
 */
export function outputResult(result) {
  console.log(JSON.stringify(result, null, 2))
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
  const lines = message.split("\n")
  const title = lines[0] || ""

  const bodyLines = lines.slice(1).filter((line, index, arr) => {
    if (line.trim()) return true
    if (index === 0 || index === arr.length - 1) return false
    return true
  })

  return { title, bodyLines }
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
  const desc = description.replace(/^[a-z]+(\([^)]+\))?:\s*/, "").toLowerCase()
  const firstWord = desc.split(/\s+/)[0]
  const wrongPatterns = [/ed$/, /ing$/, /s$/]
  return !wrongPatterns.some((p) => p.test(firstWord))
}

/**
 * Check whether a title ends with a period.
 *
 * @param   {string} title
 * @returns {boolean}
 */
export function hasPeriod(title) {
  return title.trim().endsWith(".")
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
export async function detectBitbucketRemote(remoteName = "origin") {
  const result = await execGit(`git remote get-url ${remoteName}`)
  if (!result.success) {
    return { owner: "", repo: "", rawUrl: "", valid: false }
  }

  const rawUrl = result.stdout.trim()
  const match = rawUrl.match(/bitbucket\.org[/:]([^/]+)\/([^/]+?)(?:\.git)?$/)

  if (!match) {
    return { owner: "", repo: "", rawUrl, valid: false }
  }

  const [, owner, repo] = match
  return { owner, repo, rawUrl, valid: true }
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
  const email = process.env.BITBUCKET_EMAIL
  const token = process.env.BITBUCKET_TOKEN
  if (!email || !token) return null
  const encoded = Buffer.from(`${email}:${token}`).toString("base64")
  return { Authorization: `Basic ${encoded}` }
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
    const hasBody = method === "POST" || method === "PUT" || method === "PATCH"
    const body = hasBody ? JSON.stringify(payload) : ""
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(hasBody ? { "Content-Length": Buffer.byteLength(body) } : {}),
        ...headers,
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on("data", (chunk) => chunks.push(chunk))
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(Buffer.concat(chunks).toString()),
          })
        } catch {
          resolve({ statusCode: res.statusCode, body: null })
        }
      })
    })

    req.setTimeout(30_000, () => {
      req.destroy(new Error("Request timed out after 30s"))
    })
    req.on("error", reject)
    if (hasBody) req.write(body)
    req.end()
  })
}

/** @type {(url: string, payload: object, headers: Record<string,string>) => Promise<{statusCode:number,body:any}>} */
export const httpsPost = (url, payload, headers) => httpsRequest("POST", url, payload, headers)

/** @type {(url: string, payload: object, headers: Record<string,string>) => Promise<{statusCode:number,body:any}>} */
export const httpsPut = (url, payload, headers) => httpsRequest("PUT", url, payload, headers)
```

---

#### Script: `parse-diff.js`

### `.github/skills/git-workflow/scripts/parse-diff.js`

```js
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

import { execGit, outputResult } from "./utils.js"

/**
 * Build a human-readable summary from file changes.
 *
 * @param   {import('./utils.js').FileChange[]} files
 * @param   {number} additions
 * @param   {number} deletions
 * @returns {string}
 */
function generateSummary(files, additions, deletions) {
  if (files.length === 0) return "No changes detected"

  const counts = files.reduce(
    (acc, f) => {
      const key = f.status[0].toLowerCase()
      if (key === "a") acc.added++
      else if (key === "d") acc.deleted++
      else if (key === "m") acc.modified++
      else if (key === "r") acc.renamed++
      return acc
    },
    { added: 0, modified: 0, deleted: 0, renamed: 0 }
  )

  const parts = []
  if (counts.modified > 0) parts.push(`${counts.modified} modified`)
  if (counts.added > 0) parts.push(`${counts.added} added`)
  if (counts.deleted > 0) parts.push(`${counts.deleted} deleted`)
  if (counts.renamed > 0) parts.push(`${counts.renamed} renamed`)

  return (
    `${files.length} files changed: ` + `${parts.join(", ")} (+${additions} -${deletions} lines)`
  )
}

/**
 * Parse git diff output into structured data.
 *
 * @param   {string[]} args - CLI arguments
 * @returns {Promise<import('./utils.js').DiffResult>}
 */
async function parseDiff(args) {
  const isStaged = args.includes("--staged")
  const filesIndex = args.indexOf("--files")
  const filesArg = filesIndex >= 0 ? args[filesIndex + 1] : null

  let diffBase = "git diff"
  if (isStaged) diffBase += " --staged"
  if (filesArg) {
    const files = filesArg.split(",").map((f) => f.trim())
    diffBase += " " + files.join(" ")
  }

  // ── File status ────────────────────────────────────────────────
  const statusResult = await execGit(`${diffBase} --name-status`)
  if (!statusResult.success) {
    return {
      success: false,
      files: [],
      stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
      summary: "",
      error: statusResult.error || "Failed to get file status",
    }
  }

  /** @type {Map<string, string>} */
  const statusMap = new Map()
  statusResult.stdout
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      const [status, ...pathParts] = line.split(/\s+/)
      statusMap.set(pathParts.join(" "), status)
    })

  // ── Numeric stats ──────────────────────────────────────────────
  const statResult = await execGit(`${diffBase} --numstat`)
  if (!statResult.success) {
    return {
      success: false,
      files: [],
      stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
      summary: "",
      error: statResult.error || "Failed to get file stats",
    }
  }

  /** @type {import('./utils.js').FileChange[]} */
  const files = []
  let totalAdditions = 0
  let totalDeletions = 0

  statResult.stdout
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      const [additions, deletions, ...pathParts] = line.split(/\s+/)
      const path = pathParts.join(" ")
      const addNum = additions === "-" ? 0 : parseInt(additions, 10) || 0
      const delNum = deletions === "-" ? 0 : parseInt(deletions, 10) || 0

      totalAdditions += addNum
      totalDeletions += delNum

      files.push({
        path,
        status: statusMap.get(path) || "M",
        additions: addNum,
        deletions: delNum,
      })
    })

  return {
    success: true,
    files,
    stats: { totalFiles: files.length, totalAdditions, totalDeletions },
    summary: generateSummary(files, totalAdditions, totalDeletions),
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = process.argv.slice(2)

    // Quick check: anything tracked?
    const isStaged = args.includes("--staged")
    const diffCmd = isStaged ? "git diff --staged --name-only" : "git diff --name-only"

    const check = await execGit(diffCmd)
    if (!check.success) {
      outputResult({
        success: false,
        files: [],
        stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
        summary: "",
        error: "Failed to check git diff",
      })
      process.exit(1)
    }

    if (!check.stdout.trim()) {
      outputResult({
        success: true,
        files: [],
        stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
        summary: isStaged ? "No staged tracked changes to parse" : "No tracked changes to parse",
      })
      process.exit(0)
    }

    const result = await parseDiff(args)
    outputResult(result)
    process.exit(result.success ? 0 : 1)
  } catch (error) {
    outputResult({
      success: false,
      files: [],
      stats: { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 },
      summary: "",
      error: error.message,
    })
    process.exit(1)
  }
}

main()
```

---

#### Script: `validate-message.js`

### `.github/skills/git-workflow/scripts/validate-message.js`

```js
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

import { LIMITS, parseCommitMessage, isImperativeMood, hasPeriod, outputResult } from "./utils.js"

/**
 * Read plain-text commit message from `--message` arg or stdin.
 *
 * @param   {string[]} args - CLI arguments
 * @returns {Promise<string>}
 */
async function readMessage(args) {
  const idx = args.indexOf("--message")
  if (idx >= 0 && args[idx + 1]) {
    return args[idx + 1]
  }

  if (process.stdin.isTTY) {
    return null
  }

  return new Promise((resolve, reject) => {
    const chunks = []
    process.stdin.on("data", (chunk) => chunks.push(chunk))
    process.stdin.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8").trim())
    })
    process.stdin.on("error", reject)
  })
}

/**
 * Validate a commit message and return a structured result.
 *
 * @param   {string} message - Full commit message text
 * @returns {import('./utils.js').ValidationResult}
 */
function validateMessage(message) {
  /** @type {string[]} */
  const errors = []
  const { title, bodyLines } = parseCommitMessage(message)

  // ── Title checks ───────────────────────────────────────────────
  const titleLength = title.length
  const titleValidLength = titleLength > 0 && titleLength <= LIMITS.TITLE_MAX

  if (titleLength === 0) {
    errors.push("Title is empty")
  } else if (titleLength > LIMITS.TITLE_MAX) {
    errors.push(`Title exceeds ${LIMITS.TITLE_MAX} characters (${titleLength} chars)`)
  }

  if (hasPeriod(title)) {
    errors.push("Title should not end with a period")
  }

  if (!isImperativeMood(title)) {
    errors.push("Title should use imperative mood " + '(e.g., "add" not "added" or "adds")')
  }

  const conventionalPattern =
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([a-z0-9-]+\))?:\s.+/
  if (!conventionalPattern.test(title)) {
    errors.push(
      "Title does not follow conventional commit format: " + "<type>[scope]: <description>"
    )
  }

  // ── Body line checks ──────────────────────────────────────────
  const bodyLinesData = bodyLines.map((line, index) => {
    const length = line.length
    const valid = length <= LIMITS.BODY_LINE_MAX

    if (!valid) {
      errors.push(
        `Body line ${index + 2} exceeds ` +
          `${LIMITS.BODY_LINE_MAX} characters ` +
          `(${length} chars): "${line.substring(0, 30)}..."`
      )
    }

    return { line: index + 2, content: line, length, valid }
  })

  return {
    valid: errors.length === 0,
    title: {
      content: title,
      length: titleLength,
      valid: titleValidLength && !hasPeriod(title),
    },
    bodyLines: bodyLinesData,
    errors,
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = process.argv.slice(2)
    const message = await readMessage(args)

    if (!message) {
      outputResult({ valid: false, errors: ["No commit message provided"] })
      process.exit(1)
    }

    const result = validateMessage(message)
    outputResult(result)
    process.exit(result.valid ? 0 : 1)
  } catch (error) {
    outputResult({ valid: false, errors: [error.message] })
    process.exit(1)
  }
}

main()
```

---

#### Script: `format-commit.js`

### `.github/skills/git-workflow/scripts/format-commit.js`

```js
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
} from "./utils.js"

/**
 * Validate structured input and format into a complete commit message.
 *
 * @param   {import('./utils.js').FormatInput} input
 * @returns {import('./utils.js').FormatResult}
 */
function validateAndFormat(input) {
  /** @type {string[]} */
  const errors = []
  const { title, paragraphs } = input

  // ── Title validation ───────────────────────────────────────────
  if (!title) {
    errors.push("Title is required")
  } else {
    if (title.length > LIMITS.TITLE_MAX) {
      errors.push(`Title exceeds ${LIMITS.TITLE_MAX} characters ` + `(${title.length} chars)`)
    }
    if (hasPeriod(title)) {
      errors.push("Title should not end with a period")
    }
    if (!isImperativeMood(title)) {
      errors.push("Title should use imperative mood " + '(e.g., "add" not "added")')
    }

    const conventionalPattern =
      /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([a-z0-9-]+\))?:\s.+/
    if (!conventionalPattern.test(title)) {
      errors.push("Title must follow format: <type>[scope]: <description>")
    }
  }

  // ── Build formatted message ────────────────────────────────────
  const parts = [title]

  if (paragraphs && paragraphs.length > 0) {
    parts.push("") // blank line after title

    const formatted = paragraphs.filter((p) => p.trim()).join("\n\n")

    parts.push(formatted)
  }

  const formattedMessage = parts.join("\n")

  // ── Body line validation ───────────────────────────────────────
  const { bodyLines } = parseCommitMessage(formattedMessage)
  bodyLines.forEach((line, index) => {
    if (line.length > LIMITS.BODY_LINE_MAX) {
      errors.push(
        `Body line ${index + 2} exceeds ` +
          `${LIMITS.BODY_LINE_MAX} characters ` +
          `(${line.length} chars): "${line.substring(0, 40)}..."`
      )
    }
  })

  const valid = errors.length === 0

  // ── Write temp file (only if valid) ────────────────────────────
  /** @type {string | undefined} */
  let messageFilePath
  if (valid) {
    try {
      messageFilePath = writeTempFile(formattedMessage)
    } catch (error) {
      errors.push(`Failed to write temp file: ${error.message}`)
      return { valid: false, formattedMessage, errors }
    }
  }

  return { valid, messageFilePath, formattedMessage, errors }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = process.argv.slice(2)
    const input = await readInput(args)

    if (!input || typeof input !== "object") {
      outputResult({
        valid: false,
        formattedMessage: "",
        errors: ["Invalid input: expected JSON " + "{ title: string, paragraphs: string[] }"],
      })
      process.exit(1)
    }

    if (!input.title || typeof input.title !== "string") {
      outputResult({
        valid: false,
        formattedMessage: "",
        errors: ['Missing or invalid "title" field (must be a string)'],
      })
      process.exit(1)
    }

    if (input.paragraphs && !Array.isArray(input.paragraphs)) {
      outputResult({
        valid: false,
        formattedMessage: "",
        errors: ['"paragraphs" must be an array of strings'],
      })
      process.exit(1)
    }

    const result = validateAndFormat(input)
    outputResult(result)
    process.exit(result.valid ? 0 : 1)
  } catch (error) {
    outputResult({
      valid: false,
      formattedMessage: "",
      errors: [error.message],
    })
    process.exit(1)
  }
}

main()
```

---

#### Script: `git-workflow.js`

### `.github/skills/git-workflow/scripts/git-workflow.js`

```js
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

import { execGit, cleanupTempFile, outputResult } from "./utils.js"

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
  const idx = (flag) => args.indexOf(flag)

  /** @type {WorkflowArgs} */
  const result = {
    all: args.includes("--all"),
    push: args.includes("--push"),
    dryRun: args.includes("--dry-run"),
  }

  const filesIdx = idx("--files")
  if (filesIdx >= 0 && args[filesIdx + 1]) {
    result.files = args[filesIdx + 1].split(",").map((f) => f.trim())
  }

  const msgFileIdx = idx("--message-file")
  if (msgFileIdx >= 0 && args[msgFileIdx + 1]) {
    result.messageFile = args[msgFileIdx + 1]
  }

  const msgIdx = idx("--message")
  if (msgIdx >= 0 && args[msgIdx + 1]) {
    result.message = args[msgIdx + 1]
  }

  return result
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
  }

  // ── Determine files to stage ───────────────────────────────────
  const filesToAdd = args.all ? ["."] : args.files || []
  if (filesToAdd.length === 0) {
    result.add.error = "No files specified (use --files or --all)"
    return result
  }

  // ── Dry run: return immediately ────────────────────────────────
  if (args.dryRun) {
    result.add = { success: true, files: filesToAdd }
    result.commit = {
      success: true,
      message: "DRY RUN — no actual commit",
    }
    if (args.push) result.push = { success: true }
    return result
  }

  // ── git add ────────────────────────────────────────────────────
  const addResult = await execGit(`git add ${filesToAdd.join(" ")}`)
  if (!addResult.success) {
    result.add.error = addResult.error || addResult.stderr
    return result
  }
  result.add = { success: true, files: filesToAdd }

  // ── git commit ─────────────────────────────────────────────────
  if (!args.messageFile && !args.message) {
    result.commit.error = "No commit message (use --message-file or --message)"
    return result
  }

  // Always use -F <file> to avoid shell escaping issues
  let messageFile = args.messageFile
  let tempMessageFile = null
  if (!messageFile && args.message) {
    tempMessageFile = writeTempFile(args.message)
    messageFile = tempMessageFile
  }

  const commitCmd = `git commit -F "${messageFile}"`
  const commitResult = await execGit(commitCmd)

  // Clean up temp file regardless of success
  if (args.messageFile) cleanupTempFile(args.messageFile)
  if (tempMessageFile) cleanupTempFile(tempMessageFile)

  if (!commitResult.success) {
    const err = commitResult.stderr || commitResult.error || "Commit failed"

    // Translate well-known commitlint errors
    if (err.includes("subject may not be longer than")) {
      result.commit.error = "Commitlint: Title exceeds 100 characters"
    } else if (err.includes("body's lines must not be longer than")) {
      result.commit.error = "Commitlint: Body line exceeds 72 characters"
    } else {
      result.commit.error = err
    }
    return result
  }

  // Extract short hash from output like "[main abc1234] feat: ..."
  const hashMatch = commitResult.stdout.match(/\[[\w/-]+\s+([a-f0-9]+)\]/)
  result.commit = {
    success: true,
    hash: hashMatch ? hashMatch[1] : undefined,
    message: commitResult.stdout,
  }

  // ── git push (optional) ────────────────────────────────────────
  if (args.push) {
    result.push = { success: false }

    const pushResult = await execGit("git push")
    if (!pushResult.success) {
      const err = pushResult.stderr || pushResult.error || "Push failed"

      if (err.includes("rejected") || err.includes("non-fast-forward")) {
        result.push.suggestion = "Remote has new commits. Try: git pull --rebase"
      } else if (err.includes("no upstream branch")) {
        result.push.suggestion = "No upstream. Try: git push -u origin <branch>"
      } else if (err.includes("Permission denied") || err.includes("authentication")) {
        result.push.suggestion = "Auth failed. Check credentials or SSH keys"
      }

      result.push.error = err
      return result
    }

    result.push.success = true
  }

  return result
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2))
    const result = await executeWorkflow(args)
    outputResult(result)

    const ok = result.add.success && result.commit.success && (!result.push || result.push.success)
    process.exit(ok ? 0 : 1)
  } catch (error) {
    outputResult({
      dryRun: false,
      add: { success: false, files: [], error: error.message },
      commit: { success: false, error: error.message },
    })
    process.exit(1)
  }
}

main()
```

---

#### Script: `create-pr.js`

### `.github/skills/git-workflow/scripts/create-pr.js`

```js
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

import { readFileSync } from "fs"
import {
  execGit,
  outputResult,
  detectBitbucketRemote,
  buildAuthHeader,
  httpsPost,
  httpsPut,
} from "./utils.js"

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
    const i = args.indexOf(flag)
    return i >= 0 && args[i + 1] ? args[i + 1] : undefined
  }

  const target = get("--target")
  if (!target) {
    outputResult({
      success: false,
      error: "Missing required --target argument (e.g. --target Development)",
    })
    process.exit(1)
  }

  // Normalize CLI escape sequences (e.g. literal \n → newline) so that
  // multi-line descriptions passed via --description on Windows shells work
  // correctly when the terminal doesn't expand escape sequences.
  const rawDescription = get("--description") ?? ""
  const description = rawDescription.replace(/\\n/g, "\n").replace(/\\r/g, "\r")

  return {
    target,
    title: get("--title"),
    summary: get("--summary"),
    description,
    prId: (() => {
      const raw = get("--pr-id")
      if (raw === undefined) return undefined
      const parsed = Number(raw)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        outputResult({
          success: false,
          error: "Invalid --pr-id value. It must be a positive integer (e.g. --pr-id 42).",
        })
        process.exit(1)
      }
      return parsed
    })(),
    dryRun: args.includes("--dry-run"),
  }
}

// ─── Git Helpers ─────────────────────────────────────────────────────

/**
 * Get the current branch name.
 *
 * @returns {Promise<string>}
 */
async function currentBranch() {
  const result = await execGit("git rev-parse --abbrev-ref HEAD")
  return result.success ? result.stdout : "HEAD"
}

/**
 * Get the latest commit subject line.
 *
 * @returns {Promise<string>}
 */
async function latestCommitSubject() {
  const result = await execGit("git log -1 --format=%s")
  return result.success ? result.stdout : ""
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
  const mbResult = await execGit(`git merge-base HEAD origin/${target}`)
  if (mbResult.success && mbResult.stdout.trim()) {
    const base = mbResult.stdout.trim()
    const log = await execGit(`git log ${base}..HEAD --format=%s --reverse`)
    if (log.success && log.stdout.trim()) {
      return log.stdout.trim().split("\n").filter(Boolean)
    }
  }
  // Fallback: compare directly against remote tracking branch
  const log = await execGit(`git log origin/${target}..HEAD --format=%s --reverse`)
  if (log.success && log.stdout.trim()) {
    return log.stdout.trim().split("\n").filter(Boolean)
  }
  // Last resort: just the latest commit
  const latest = await latestCommitSubject()
  return latest ? [latest] : []
}

// ─── PR Content Generation ───────────────────────────────────────────

/** Conventional commit type regex (captures type and optional scope). */
const COMMIT_TYPE_RE =
  /^(feat|fix|refactor|chore|docs|test|ci|build|style|perf)(\([^)]+\))?[!]?:\s*/

/** Conventional commit type priority order (highest → lowest). */
const COMMIT_TYPE_PRIORITY = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "docs",
  "test",
  "ci",
  "build",
  "style",
  "chore",
]

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
  if (commits.length === 0) return `PR: ${branch} → ${target}`
  if (commits.length === 1) return commits[0]

  const parsed = commits.map((c) => ({
    type: c.match(COMMIT_TYPE_RE)?.[1] ?? "chore",
    scope: c.match(COMMIT_TYPE_RE)?.[2]?.replace(/[()]/g, "") ?? null,
    desc: c.replace(COMMIT_TYPE_RE, "").trim(),
  }))

  // Dominant type by conventional-commit priority
  const types = [...new Set(parsed.map((p) => p.type))]
  const dominant = COMMIT_TYPE_PRIORITY.find((t) => types.includes(t)) ?? "chore"

  // Branch-level scope (strip prefix like "feature/")
  const branchScope = branch.replace(/^(?:feature|feat|fix|bugfix|hotfix)\//, "")

  if (commits.length <= 3) {
    const joined = parsed.map((p) => p.desc).join("; ")
    const candidate = `${dominant}(${branchScope}): ${joined}`
    if (candidate.length <= 72) return candidate
  }

  // Group commits by their conventional-commit scope, count occurrences
  // Ignore commits without a scope (they spread across areas)
  const scopeCount = new Map()
  for (const { scope } of parsed) {
    if (!scope) continue
    scopeCount.set(scope, (scopeCount.get(scope) ?? 0) + 1)
  }

  // Top 3 named scopes by commit count; annotate with count when >1
  const topScopes = [...scopeCount.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([scope, n]) => (n > 1 ? `${scope}(${n})` : scope))

  // If no scoped commits at all, fall back to type-level summary
  if (topScopes.length === 0) {
    const typeList = [...new Set(parsed.map((p) => p.type))].slice(0, 3).join(", ")
    return `${dominant}(${branchScope}): ${typeList} changes`
  }

  const areaSummary =
    topScopes.length >= 3
      ? `${topScopes.slice(0, -1).join(", ")}, and ${topScopes.at(-1)}`
      : topScopes.join(" and ")

  const candidate = `${dominant}(${branchScope}): ${areaSummary} changes`
  if (candidate.length <= 72) return candidate

  // Safety fallback if still too long
  return `${dominant}(${branchScope}): ${topScopes[0]}, ${topScopes[1] ?? "..."} (+more)`
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
  const rootResult = await execGit("git rev-parse --show-toplevel")
  const repoRoot = rootResult.success ? rootResult.stdout.trim() : process.cwd()

  let template = ""
  for (const p of [
    `${repoRoot}/.bitbucket/pull_request_template.md`,
    `${repoRoot}/.github/pull_request_template.md`,
  ]) {
    try {
      template = readFileSync(p, "utf-8")
      break
    } catch {
      /* not found */
    }
  }

  // ── Parse commits ────────────────────────────────────────────────
  const parsed = commits.map((c) => ({
    type: c.match(COMMIT_TYPE_RE)?.[1] ?? "chore",
    scope: c.match(COMMIT_TYPE_RE)?.[2]?.replace(/[()]/g, "") ?? null,
    desc: c.replace(COMMIT_TYPE_RE, "").trim(),
    raw: c,
  }))

  // ── Dominant type (single value) ─────────────────────────────────
  const allTypes = [...new Set(parsed.map((p) => p.type))]
  const dominant = COMMIT_TYPE_PRIORITY.find((t) => allTypes.includes(t)) ?? "chore"

  // ── Group commits by scope ───────────────────────────────────────
  /** @type {Map<string, string[]>} */
  const groups = new Map()
  for (const { scope, desc } of parsed) {
    const key = scope ?? "General"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(desc)
  }

  // Sort groups: named scopes (alpha) first, "General" always last
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "General") return 1
    if (b === "General") return -1
    return a.localeCompare(b)
  })

  // Build grouped markdown
  const groupedBody = sortedKeys
    .map((key) => {
      const items = groups
        .get(key)
        .map((d) => `- ${d}`)
        .join("\n")
      return `**${key}**\n${items}`
    })
    .join("\n\n")

  // Compose the summary block: AI overview (if provided) above the grouped changelog
  const summaryBlock = summary ? `${summary.trim()}\n\n${groupedBody}` : groupedBody

  if (!template) {
    return summaryBlock
  }

  return (
    template
      // Replace the blockquote placeholder line with summary block (overview + grouped changelog)
      .replace(/^> Please briefly.*$/m, summaryBlock)
      // Remove the second blockquote line (bug reproduction steps hint)
      .replace(/\r?\n> .*reproduction steps\.\r?\n/g, "\n")
      // Fill **Type**: with dominant type only; drop the hint line below it
      .replace(/\*\*Type\*\*:\s*\r?\n\r?\n_\(feat.*?\)_/s, `**Type**: ${dominant}`)
  )
}

// ─── Provider Implementations ────────────────────────────────────────

async function createPr(remote, source, args, title, description) {
  const fallbackUrl =
    `https://bitbucket.org/${remote.owner}/${remote.repo}/pull-requests/new` +
    `?source=${encodeURIComponent(source)}&dest=${encodeURIComponent(args.target)}&t=1`

  const payload = {
    title,
    description,
    source: { branch: { name: source } },
    destination: { branch: { name: args.target } },
    close_source_branch: false,
  }

  if (args.dryRun) {
    return {
      success: true,
      source,
      target: args.target,
      title,
      url: fallbackUrl,
      dryRun: true,
      payload,
    }
  }

  const authHeader = buildAuthHeader()

  if (!authHeader) {
    const missing = []
    if (!process.env.BITBUCKET_EMAIL) missing.push("BITBUCKET_EMAIL")
    if (!process.env.BITBUCKET_TOKEN) missing.push("BITBUCKET_TOKEN")
    return {
      success: false,
      source,
      target: args.target,
      title,
      fallbackUrl,
      error:
        `Missing env var(s): ${missing.join(", ")}\n` +
        "\n" +
        "⚠️  Use a Bitbucket Cloud API Token (NOT an Atlassian Account token from id.atlassian.com).\n" +
        "   Tokens starting with ATATT3x… will NOT work with api.bitbucket.org.\n" +
        "\n" +
        "Create a token at: https://bitbucket.org/account/settings/api-tokens/\n" +
        "  Required scopes: Repositories (Read+Write), Pull requests (Read+Write)\n" +
        "\n" +
        "Then add to ~/.bashrc (or ~/.bash_profile):\n" +
        '    export BITBUCKET_EMAIL="your-atlassian-email@example.com"\n' +
        '    export BITBUCKET_TOKEN="your-bitbucket-api-token"\n' +
        "Run: source ~/.bashrc\n" +
        "\n" +
        "Or set both vars in Windows User Environment Variables.\n" +
        `\nOr open the PR manually: ${fallbackUrl}`,
    }
  }

  const isUpdate = typeof args.prId === "number"
  const url = isUpdate
    ? `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests/${args.prId}`
    : `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests`

  const { statusCode, body } = isUpdate
    ? await httpsPut(url, payload, authHeader)
    : await httpsPost(url, payload, authHeader)

  const successCode = isUpdate ? 200 : 201
  if (statusCode === successCode && body?.links?.html?.href) {
    return { success: true, source, target: args.target, title, url: body.links.html.href }
  }

  return {
    success: false,
    source,
    target: args.target,
    title,
    fallbackUrl,
    error: `Bitbucket API returned ${statusCode}: ${body?.error?.message ?? JSON.stringify(body)}`,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2))
const remote = await detectBitbucketRemote("origin")
const source = await currentBranch()

if (!remote.valid) {
  outputResult({
    success: false,
    error: `Cannot detect a Bitbucket remote from origin URL: ${remote.rawUrl || "(empty)"}`,
  })
  process.exit(1)
}

const commits = await commitsSinceMergeBase(args.target)
const title = args.title ?? generatePrTitle(commits, source, args.target)
const description = args.description || (await buildPrDescription(commits, args.summary))

const result = await createPr(remote, source, args, title, description)

outputResult(result)
process.exit(result.success ? 0 : 1)
```

---

#### Script: `add-pr-comment.js`

### `.github/skills/git-workflow/scripts/add-pr-comment.js`

```js
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

import { outputResult, detectBitbucketRemote, buildAuthHeader, httpsPost } from "./utils.js"

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
    const i = args.indexOf(flag)
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined
  }

  const prIdStr = get("--pr-id")
  if (!prIdStr) {
    outputResult({ success: false, error: "Missing required --pr-id argument" })
    process.exit(1)
  }
  const prId = Number(prIdStr)
  if (isNaN(prId) || prId <= 0 || !Number.isInteger(prId)) {
    outputResult({
      success: false,
      error: `Invalid --pr-id: "${prIdStr}" is not a positive integer`,
    })
    process.exit(1)
  }

  // Batch mode: --data '<json array>'
  const dataStr = get("--data")
  const signature = get("--signature") || null

  if (dataStr) {
    try {
      const parsed = JSON.parse(dataStr)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      const invalid = items.filter((item, i) => !item.comment)
      if (invalid.length > 0) {
        outputResult({
          success: false,
          error: `${invalid.length} item(s) in --data missing required "comment" field`,
        })
        process.exit(1)
      }
      return { prId, comments: items, signature }
    } catch (e) {
      outputResult({ success: false, error: `Invalid JSON in --data: ${e.message}` })
      process.exit(1)
    }
  }

  // Single comment mode
  const rawComment = get("--comment")
  if (!rawComment) {
    outputResult({ success: false, error: "Missing --comment or --data argument" })
    process.exit(1)
  }
  // Convert literal \n sequences to real newlines (shell doesn't interpret them)
  const comment = rawComment.replace(/\\n/g, "\n")

  const file = get("--file") || null
  const lineStr = get("--line")
  const line = lineStr ? Number(lineStr) : null
  const parentIdStr = get("--parent-id")
  const parentId = parentIdStr ? Number(parentIdStr) : null

  return { prId, comments: [{ comment, file, line, parentId }], signature }
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
  const url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/pullrequests/${prId}/comments`

  const payload = {
    content: { raw: input.comment },
  }

  // Add inline positioning if file is specified
  if (input.file) {
    payload.inline = {
      path: input.file,
      ...(input.line != null ? { to: input.line } : {}),
    }
  }

  // Add parent reference for threaded replies
  if (input.parentId) {
    payload.parent = { id: input.parentId }
  }

  try {
    const { statusCode, body } = await httpsPost(url, payload, authHeader)

    if (statusCode === 201 && body?.id) {
      return {
        success: true,
        id: body.id,
        file: input.file || null,
        line: input.line || null,
      }
    }

    return {
      success: false,
      file: input.file || null,
      line: input.line || null,
      error: `API returned ${statusCode}: ${body?.error?.message ?? JSON.stringify(body)}`,
    }
  } catch (e) {
    return {
      success: false,
      file: input.file || null,
      line: input.line || null,
      error: e.message,
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────

const { prId, comments, signature } = parseArgs(process.argv.slice(2))

const remote = await detectBitbucketRemote()
if (!remote.valid) {
  outputResult({
    success: false,
    error: "Cannot detect a Bitbucket remote from origin URL",
  })
  process.exit(1)
}

const authHeader = buildAuthHeader()
if (!authHeader) {
  const missing = []
  if (!process.env.BITBUCKET_EMAIL) missing.push("BITBUCKET_EMAIL")
  if (!process.env.BITBUCKET_TOKEN) missing.push("BITBUCKET_TOKEN")
  outputResult({
    success: false,
    prId,
    error:
      `Missing env var(s): ${missing.join(", ")}\n` +
      "Set BITBUCKET_EMAIL and BITBUCKET_TOKEN.\n" +
      "See create-pr.js documentation for setup instructions.",
  })
  process.exit(1)
}

/** @type {CommentResult[]} */
const results = []
for (const comment of comments) {
  // Build final content with optional AI signature footer
  const input = signature
    ? { ...comment, comment: `${comment.comment}\n\n---\n${signature}` }
    : comment
  const result = await postComment(remote.owner, remote.repo, prId, input, authHeader)
  results.push(result)
}

const succeeded = results.filter((r) => r.success).length
const failed = results.length - succeeded

outputResult({
  success: failed === 0,
  prId,
  results,
  summary: { total: results.length, succeeded, failed },
})

process.exit(failed === 0 ? 0 : 1)
```

---

### Requesting Code Review Skill

### `.github/skills/requesting-code-review/SKILL.md`

````md
---
description: >
  Use when completing tasks, implementing major features, or before merging
  to verify work meets requirements. Covers code review workflow, severity
  categorization, review template, FSD architecture compliance, and
  project-specific coding standards.
---

# Requesting Code Review

Dispatch a code review to catch issues before they cascade.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**

- After each task in agent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**

- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code review:**

Fill the template at `code-reviewer.md` (located in this skill's directory)

**Placeholders:**

- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**3. Act on feedback:**

- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code review using template]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Review returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## FSD-Specific Checks

In addition to general code quality, reviews **must** verify FSD compliance:

- **Layer direction:** imports flow downward only (`app → pages → widgets → features → entities → shared`)
- **Slice isolation:** no same-layer cross-slice imports
- **Barrel imports:** external access through `index.ts` only — no deep imports
- **`@/` alias:** all cross-layer imports use `@/`, never relative `../../`
- **`@x` pattern:** cross-entity references use `@x` re-exports
- **Shared purity:** `shared` layer has zero business domain logic
- **No `export default`**, no `any`, no direct `zustand`/`axios` imports
- **ESLint boundaries:** `eslint-plugin-boundaries` passes with no violations

## Integration with Workflows

**Agent-Driven Development:**

- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**

- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**

- Review before merge
- Review when stuck

## Red Flags

**Never:**

- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**

- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: `.github/skills/requesting-code-review/code-reviewer.md`
````

---

### `.github/skills/requesting-code-review/code-reviewer.md`

````md
# Code Review Agent

You are reviewing code changes for production readiness.

**Your task:**

1. Review {WHAT_WAS_IMPLEMENTED}
2. Compare against {PLAN_OR_REQUIREMENTS}
3. Check code quality, architecture, testing
4. Categorize issues by severity
5. Assess production readiness

## What Was Implemented

{DESCRIPTION}

## Requirements/Plan

{PLAN_OR_REQUIREMENTS}

## Git Range to Review

**Base:** {BASE_SHA}
**Head:** {HEAD_SHA}

```bash
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}
```

## Review Checklist

**Code Quality:**

- Clean separation of concerns?
- Proper error handling?
- Type safety — no `any`, explicit return types on exported functions?
- DRY principle followed?
- Edge cases handled?
- Named exports only — no `export default`?
- No direct imports of `zustand` or `axios` — use `@/shared/store` and `@/shared/api`?
- Naming conventions: `PascalCase` components/types, `camelCase` functions/hooks, `kebab-case` files?
- Import order: external packages → `@/` imports → relative imports?

**Architecture (FSD):**

- Layer imports flow downward only (`app → pages → widgets → features → entities → shared`)?
- No same-layer cross-slice imports?
- Cross-layer imports use `@/` alias (no relative `../../` across slices)?
- Cross-entity references use `@x` pattern?
- All external access goes through `index.ts` barrel — no deep imports?
- `shared` layer has zero business domain logic?
- Slice structure follows convention (`ui/`, `model/`, `api/`, `lib/`, `config/`, `index.ts`)?
- `eslint-plugin-boundaries` passes with no violations?
- Sound design decisions?
- Performance implications?
- Security concerns?

**Testing:**

- Tests actually test logic (not mocks)?
- Edge cases covered?
- Tests co-located with source (`file.ts` → `file.test.ts`)?
- All tests passing (`npm run test:run`)?

**Requirements:**

- All plan requirements met?
- Implementation matches spec?
- No scope creep?
- Breaking changes documented?

**Commits:**

- Conventional Commits format (`<type>(<scope>): <description>`)?
- Atomic commits — code, tests, docs in separate commits?
- Selective staging (`git add <files>`), not `git add -A`?

**Production Readiness:**

- ESLint passes (`npm run lint`)?
- TypeScript compiles (`npm run build`)?
- Backward compatibility considered?
- Documentation complete?
- No obvious bugs?

## Output Format

### Strengths

[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)

[Bugs, security issues, data loss risks, broken functionality]

#### Important (Should Fix)

[Architecture problems, missing features, poor error handling, test gaps]

#### Minor (Nice to Have)

[Code style, optimization opportunities, documentation improvements]

**For each issue:**

- File:line reference
- What's wrong
- Why it matters
- How to fix (if not obvious)

### Recommendations

[Improvements for code quality, architecture, or process]

### Assessment

**Ready to merge?** [Yes/No/With fixes]

**Reasoning:** [Technical assessment in 1-2 sentences]

## Critical Rules

**DO:**

- Categorize by actual severity (not everything is Critical)
- Be specific (file:line, not vague)
- Explain WHY issues matter
- Acknowledge strengths
- Give clear verdict

**DON'T:**

- Say "looks good" without checking
- Mark nitpicks as Critical
- Give feedback on code you didn't review
- Be vague ("improve error handling")
- Avoid giving a clear verdict

## Example Output

```
### Strengths
- Clean database schema with proper migrations (db.ts:15-42)
- Comprehensive test coverage (18 tests, all edge cases)
- Good error handling with fallbacks (summarizer.ts:85-92)

### Issues

#### Important
1. **Missing help text in CLI wrapper**
   - File: index-conversations:1-31
   - Issue: No --help flag, users won't discover --concurrency
   - Fix: Add --help case with usage examples

2. **Date validation missing**
   - File: search.ts:25-27
   - Issue: Invalid dates silently return no results
   - Fix: Validate ISO format, throw error with example

#### Minor
1. **Progress indicators**
   - File: indexer.ts:130
   - Issue: No "X of Y" counter for long operations
   - Impact: Users don't know how long to wait

### Recommendations
- Add progress reporting for user experience
- Consider config file for excluded projects (portability)

### Assessment

**Ready to merge: With fixes**

**Reasoning:** Core implementation is solid with good architecture and tests. Important issues (help text, date validation) are easily fixed and don't affect core functionality.
```
````

---

## Done

All AI configuration files are in place. Key facts:

- `AGENTS.md` and `CLAUDE.md` provide coding rules for AI agents at the repo root
- `.github/copilot-instructions.md` is the primary GitHub Copilot workspace instruction file
- Layer-specific instructions auto-load from `.github/instructions/` when editing files in that layer
- Prompt templates for new slices are in `.github/prompts/`
- Skills in `.github/skills/` provide deep knowledge loaded on demand
- Git workflow scripts in `.github/skills/git-workflow/scripts/` automate commit and PR creation

Return to [`installation.md`](installation.md) to finalize the project setup (git init, verify, initial commit).
