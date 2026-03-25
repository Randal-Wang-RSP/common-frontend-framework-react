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

| Branch | Purpose | Direct push allowed |
|--------|---------|---------------------|
| `main` | Production-ready code. Every commit is a release. | **No** — protected |
| `development` | Integration branch. All feature work merges here first. | **No** — protected |

### Short-lived Branches

| Branch pattern | Created from | Merges back to | Purpose |
|----------------|-------------|----------------|---------|
| `feat/<scope>-<desc>` | `development` | `development` | New features |
| `fix/<scope>-<desc>` | `development` | `development` | Bug fixes (non-production) |
| `hotfix/<version>-<desc>` | `main` | `main` + `development` | Critical production fixes |
| `release/<version>` | `development` | `main` + `development` | Release preparation |

---

## Branch Naming Convention

Format: `<type>/<scope>-<short-description>`

- **type**: `feat`, `fix`, `hotfix`, `release`, `refactor`, `chore`, `test`, `docs`
- **scope**: FSD layer or domain area (e.g., `auth`, `cart`, `shared`, `app`)
- **short-description**: kebab-case, 2–5 words

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

| Change type | Commit separately | Example scope |
|-------------|------------------|---------------|
| Feature code | Yes | `feat(auth): add login form` |
| Tests for that feature | Yes | `test(auth): add login form tests` |
| Documentation updates | Yes | `docs(auth): document login flow` |
| Style/formatting fixes | Yes | `style(auth): fix import order` |
| Refactoring | Yes | `refactor(shared): extract http error handler` |
| Dependency updates | Yes | `chore(deps): upgrade react-router to v7` |

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

| Scenario | Merge method | Reason |
|----------|-------------|--------|
| Feature/fix → `development` | **Squash Merge** | Clean linear history on integration branch |
| `release/*` → `main` | **Merge Commit** | Preserve release context in history |
| `release/*` → `development` | **Merge Commit** | Sync release fixes back |
| `hotfix/*` → `main` | **Merge Commit** | Preserve hotfix context |
| `hotfix/*` → `development` | **Merge Commit** | Sync hotfix to development |

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

- Bump version numbers (package.json, etc.)
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
- Bump patch version

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

| Segment | Increment when… | Example |
|---------|-----------------|---------|
| MAJOR | Breaking changes to public API or behavior | `v2.0.0` |
| MINOR | New features, backward-compatible | `v1.3.0` |
| PATCH | Bug fixes, backward-compatible | `v1.2.1` |

**Tag format:** Always prefix with `v` — `v1.0.0`, `v1.2.1`, etc.

**Pre-release tags** (optional): `v1.3.0-beta.1`, `v1.3.0-rc.1`

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
# ... implement ...
git add -A && git commit -m "feat(auth): add login form with validation"

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

### Session End Gate

**MANDATORY:** Before ending a session or yielding control, the agent MUST call the `vscode_askQuestions` tool to ask the user about the next action. Derive context-appropriate options from the current state and always include a "pause/stop" option.

---

## Quick Reference

```bash
# Start feature
git checkout development && git pull && git checkout -b feat/<scope>-<desc>

# Commit
git add -A && git commit -m "<type>(<scope>): <description>"

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
