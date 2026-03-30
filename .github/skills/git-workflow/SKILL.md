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

This skill supports multiple hosting platforms with **subagent-delegated workflows**. The agent determines which platform to use by reading the **Hosting** field in `copilot-instructions.md` → Context section.

```
Hosting = GitHub    → Read platforms/github.md    (gh CLI / MCP tools)
Hosting = Bitbucket → Read platforms/bitbucket.md (project scripts)
```

**Instructions for the agent:**

1. Check `copilot-instructions.md` for the `Hosting:` value
2. Load **only** the corresponding platform file using `read_file`
3. Follow the platform-specific subagent delegation workflow for commit and PR operations

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

### Subagent Orchestration Model

In orchestrator-capable environments (e.g., opencode with Sisyphus), the commit/PR workflow is **delegated to specialized subagents** to keep the main agent's context minimal. The main agent only handles user interactions and orchestration decisions.

**Architecture:**

```
Prep Subagent (background) → Main Agent: Interaction 1 → Execute Subagent (sync) → Main Agent: Interaction 2
                                                                                 └→ PR Subagent (optional, sync)
```

| Subagent    | Category | Skills       | Run Mode   | Purpose                                    |
| ----------- | -------- | ------------ | ---------- | ------------------------------------------ |
| **Prep**    | `quick`  | `git-master` | background | Analyze changes, draft message, prepare PR |
| **Execute** | —        | `git-master` | sync       | Stage, commit, push, handle hooks          |
| **PR**      | `quick`  | `git-master` | sync       | Create PR, post review comments            |

**Key patterns:**

- **Session chaining:** Execute reuses Prep's `session_id` — full context preserved, zero re-reading
- **Background prep:** Prep runs as `run_in_background=true` — main agent can do non-overlapping work
- **Structured output:** Each subagent returns labeled fields (STATUS, COMMIT_SHA, PR_URL, etc.) — main agent never processes raw git output
- **Internal failure recovery:** Subagents auto-fix validation/lint failures internally — main agent only sees final results

**Fallback:** In environments without `task()` support (e.g., VS Code Copilot), the main agent runs all operations directly following the same phase structure. The workflow is identical — only the execution boundary changes.

### Environment Adaptation

This workflow supports both **opencode (Sisyphus)** and **VS Code Copilot**. The phase structure and logic are identical — only the tool calls differ.

#### Tool Mapping

| Operation         | opencode (Sisyphus)                                                   | VS Code Copilot                       |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------- |
| Phase 0 (Prep)    | `task(category="quick", load_skills=["git-master"], background=true)` | Agent runs operations directly inline |
| Phase 2 (Execute) | `task(session_id=..., load_skills=["git-master"])`                    | Agent runs operations directly inline |
| PR creation       | `task(category="quick", load_skills=["git-master"])`                  | Agent runs operations directly inline |
| User interaction  | `question()`                                                          | `vscode_askQuestions()`               |
| File write        | `write()`                                                             | `create_file()`                       |
| Todo tracking     | `todowrite()`                                                         | `manage_todo_list()`                  |
| Background tasks  | `run_in_background=true`                                              | N/A — all operations are sequential   |
| Session chaining  | `session_id` preserves context across subagents                       | N/A — context stays in main agent     |

#### How to Read the Platform Docs

The `task()` prompt templates in `platforms/bitbucket.md` and `platforms/github.md` serve **dual purposes**:

- **opencode**: Main agent copies the template into a `task()` call → subagent executes it
- **VS Code Copilot**: Main agent reads the `[INSTRUCTIONS]` section and executes those steps directly — ignore the `task()` wrapper, `[OUTPUT FORMAT]`, and `[MUST NOT DO]` sections

The `[INSTRUCTIONS]` inside each prompt template are the **canonical steps** for that phase, regardless of environment.

> **Platform-specific details:** See `platforms/bitbucket.md` or `platforms/github.md` for the exact `task()` prompt templates and tool-specific patterns.

### Commit/PR Message Review (Compressed Interaction Model)

The agent MUST show commit message AND PR details to the user before executing — but combines them into a **single confirmation** instead of separate gates.

**Principle:** User reviews everything upfront in ONE interaction, then the pipeline executes automatically.

1. **Prep Subagent prepares everything** — generate commit message, validate it, prepare PR title/summary
2. **Main agent shows combined preview** — commit message + PR description in one view (from Prep output)
3. **Single confirmation** — user approves/edits/cancels in one interaction
4. **Execute Subagent runs pipeline** — commit → push → PR creation runs automatically after approval

```
# ✅ Prep Subagent returns structured summary → Main agent shows preview → single confirmation
"Preview:
  Commit: feat(auth): add login form with validation
  PR: feat/auth-login → development
  PR Title: feat(auth): add login form with validation
Confirm all? / Edit / Cancel"

# ❌ Main agent runs git diff, processes output, asks 4 separate questions
```

> **Platform-specific details:** See `platforms/bitbucket.md` or `platforms/github.md` for the exact interaction flow with preview files and tool-specific confirmation patterns.

### Iterative Workflow

If new changes arise after a commit (e.g., fixing a review comment, addressing lint errors, or adding missed files), the agent MUST re-enter the workflow from the appropriate phase:

1. **Assess** — what changed and why
2. **Stage selectively** — only the new/modified files
3. **Fire a new Prep Subagent** — fresh session, analyze only the new changes
4. **Continue through Interaction 1 → Execute Subagent → Interaction 2** as normal

Do not skip phases or batch leftover changes silently. Each round of changes gets its own Prep → Execute cycle. Do NOT reuse a previous session_id from a completed workflow — start fresh.

### Session End Gate

**MANDATORY:** After completing the commit/PR workflow (or any task), the agent MUST ask the user about the next action using the environment's question/ask tool. Derive context-appropriate options from the current state and always include a "pause/stop" option.

This is handled by **Interaction 2** in the subagent-delegated workflow — which combines result reporting with next-step options. No separate "session end" prompt is needed if Interaction 2 already covers it.

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
