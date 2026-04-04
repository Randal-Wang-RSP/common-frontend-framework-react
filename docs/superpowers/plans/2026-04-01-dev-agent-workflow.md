# Dev Agent Workflow — Implementation Plan

> **For agentic workers:** When implementing, start from orchestrators (`dev.agent.md`), then specialist subagents, then skills, then instructions, and finally `copilot-instructions.md`. Each file has its own task block with a checkbox list.

**Goal:** Build a complete feature-development pipeline using VS Code custom agents and subagents. The `dev.agent.md` orchestrator delegates every stage to specialist subagents — it never writes code or reads files itself.

**Trigger:** User selects `dev` agent in VS Code Copilot Chat and describes a feature requirement in natural language.

**Git Flow target:** Feature branches → `development` (Squash Merge). Release branches / hotfixes → `main` (Merge Commit). No direct push to `main` or `development`.

**Session resume:** On every invocation, `dev.agent.md` first checks `docs/agent-tasks/active/` for an existing task file. If found, it reads the current state and resumes from the recorded `Next action` — skipping to the appropriate stage without re-running completed work. If no task file exists, it starts fresh from Stage 1.

---

## Agent Architecture

```
dev.agent.md  (Orchestrator — user-invocable)
 ├── planner.agent.md          Stage 1 — requirement → task plan
 ├── git.agent.md              Stage 2 — create feature branch
 ├── implementer.agent.md      Stage 3 — code generation (FSD-compliant)
 ├── tester.agent.md           Stage 4 — co-located unit tests
 ├── fsd-reviewer.agent.md     Stage 5a — FSD boundary validation (read-only)
 ├── code-reviewer.agent.md    Stage 5b — TS strict / naming / style (read-only)
 ├── git.agent.md              Stage 6 — atomic commits
 ├── git.agent.md              Stage 7 — PR creation → development
 ├── pr-reviewer.agent.md      Stage 7.5 — holistic PR review (read-only)
 └── git.agent.md              Stage 9 — merge & release
```

User confirmation gates: ①Plan+Chunking ②Branch ③Violations ④Commit messages ⑤PR body ⑥Human approve ⑦Release (optional)

Multi-chunk loop: Stages 3–8 repeat for each chunk. Stage 9 executes only when all chunks are merged.

---

## Context Passing Protocol

Copilot subagents have no shared memory. Each subagent invocation starts with a fresh context window. The `dev.agent.md` orchestrator is responsible for explicitly injecting the outputs of prior stages into each subsequent subagent call.

| When invoking... | Must include in the prompt... |
|---|---|
| `implementer` | Full task plan output from planner (task list, files to create, layer assignments) |
| `tester` | List of files just created by implementer in this chunk |
| `fsd-reviewer` | List of files changed in this chunk |
| `code-reviewer` | List of files changed in this chunk |
| `git` (commit) | Stage 5 validation result (clean or warnings accepted), list of changed files per commit group |
| `git` (PR) | PR title, target branch, PR body sections (from orchestrator memory of this session) |
| `pr-reviewer` | Git diff content (obtained from git agent) + original task plan for completeness check |
| `implementer` (fix loop) | Specific violations from fsd-reviewer or code-reviewer to address |

**How to pass diff to pr-reviewer:**
Git agent generates the diff (`git diff development...HEAD`) and outputs the text. Orchestrator includes that text in the pr-reviewer invocation prompt. The pr-reviewer does not call git itself.

---

## Abandon Protocol

At any Gate, the user may choose to abandon the current task. When triggered, `dev.agent.md` executes the following sequence:

1. Ask the user: preserve work in progress or discard?
   - **Preserve (stash):** git agent runs `git stash push -m "abandoned: <task-name>"` to save uncommitted changes
   - **Discard:** git agent runs `git checkout -- .` to revert all uncommitted changes
2. If a task state file exists, orchestrator updates it: set Status to `abandoned`, add an `Abandoned at:` line recording the stage and gate where abandonment occurred
3. Move the task state file from `docs/agent-tasks/active/` to `docs/agent-tasks/completed/` (abandoned tasks are archived, not deleted, for traceability)
4. Inform the user of the branch name so they can manually delete it on Bitbucket if desired

> The orchestrator does not delete branches. Branch deletion is always performed manually by the user.

---

## File Map

| File | Role | Tools |
|------|------|-------|
| `.github/agents/dev.agent.md` | Orchestrator | `agent`, `todo` |
| `.github/agents/planner.agent.md` | Sub — task planning | `read`, `search`, `todo` |
| `.github/agents/implementer.agent.md` | Sub — code generation | `read`, `edit`, `search` |
| `.github/agents/tester.agent.md` | Sub — unit test generation | `read`, `edit`, `search` |
| `.github/agents/fsd-reviewer.agent.md` | Sub — FSD compliance (read-only) | `read`, `search` |
| `.github/agents/code-reviewer.agent.md` | Sub — TS/naming/style (read-only) | `read`, `search` |
| `.github/agents/pr-reviewer.agent.md` | Sub — holistic PR review (read-only) | `read`, `search` |
| `.github/agents/git.agent.md` | Sub — git operations | `execute`, `read` |
| `docs/agent-tasks/active/<date>-<scope>.md` | Task state file (created per task) | — |
| `docs/agent-tasks/completed/` | Archived task files (post-merge) | — |
| `.github/skills/fsd-architecture/SKILL.md` | Deep FSD rules (planner + fsd-reviewer) | — |
| `.github/skills/zustand-patterns/SKILL.md` | Zustand store patterns (implementer) | — |
| `.github/skills/react-query-patterns/SKILL.md` | TanStack Query patterns (implementer) | — |
| `.github/skills/testing-patterns/SKILL.md` | Vitest + RTL patterns (tester) | — |
| `.github/skills/git-workflow/SKILL.md` | Branch strategy + PR templates (git) | — |
| `.github/instructions/features.instructions.md` | Auto-injected for `src/features/**` | — |
| `.github/instructions/entities.instructions.md` | Auto-injected for `src/entities/**` | — |
| `.github/instructions/shared.instructions.md` | Auto-injected for `src/shared/**` | — |
| `.github/instructions/pages.instructions.md` | Auto-injected for `src/pages/**` | — |
| `.github/instructions/test.instructions.md` | Auto-injected for `**/*.test.{ts,tsx}` | — |
| `.github/copilot-instructions.md` | Global always-on Tier 1 context | — |

---

## Pipeline Stages

### Stage 1 — PLAN

**Delegates to:** `planner.agent.md`

The planner receives the user's natural language requirement and produces a structured implementation plan. It must:

- Identify which FSD layers are needed (`features`, `entities`, `pages`, `widgets`)
- Determine if new entities or pages are required before the feature
- Output a task list ordered by FSD dependency (entities before features, features before pages)
- For each task, specify: layer, slice name, segments to create, files to create, and any cross-dependencies

#### Chunking Decision (part of Stage 1)

After producing the task list, the planner evaluates the total scope and decides whether to split into multiple PRs:

| Size | Criteria | Strategy |
|------|----------|----------|
| Small | ≤ 3 tasks, single FSD layer, ≤ 10 files estimated | Single PR |
| Medium | 4–8 tasks, 2 FSD layers | Split by layer (vertical chunking) |
| Large | > 8 tasks, 3+ FSD layers | Split by layer, present options to user |

**Chunking principle — vertical by FSD layer:**
```
Chunk 1: entity slices  → PR 1 → development
Chunk 2: feature slices → PR 2 (after Chunk 1 is merged)
Chunk 3: page/widget    → PR 3 (after Chunk 2 is merged)
```
Each chunk must be independently reviewable and mergeable. A chunk must never contain files from multiple FSD layers if those layers have a dependency relationship (upper layer code cannot merge before lower layer code exists in `development`).

#### Task State File (created at end of Stage 1)

After the chunking decision, the planner creates a task state file at `docs/agent-tasks/active/<YYYY-MM-DD>-<scope>.md`. This file is the single source of truth for the overall task and persists across sessions.

**Task state file format:**

```markdown
# Task: <scope> — <description>
Created: <date> | Status: in-progress

## Original Requirement
<verbatim user input>

## Chunking Plan
| Chunk | Scope | FSD Layer(s) | Target PR | Status |
|-------|-------|--------------|-----------|--------|
| 1 | entity/user | entities | PR #— | ⏳ not started |
| 2 | feature/auth | features | PR #— | ⏳ not started |
| 3 | pages/login | pages | PR #— | ⏳ not started |

## Current Session State
Active chunk: 1
Last completed gate: Gate ② (branch confirmed)
Next action: Stage 3 — IMPLEMENT chunk 1

## Notes
- Chunk 2 depends on Chunk 1 UserId type via @x pattern
```

The orchestrator updates `Current Session State` and `Chunking Plan` statuses after each gate passes and after each PR is merged. When all chunks reach ✅ merged status, the orchestrator moves the file to `docs/agent-tasks/completed/`.

**Gate ①:** Dev orchestrator presents the full plan (task list + chunking decision + proposed task file path) and asks the user to confirm, edit, or cancel before proceeding. User can override the chunk split if desired.

---

### Stage 2 — BRANCH

**Delegates to:** `git.agent.md`

For **single-PR tasks**: create one branch for the entire feature.

For **multi-chunk tasks**: create one branch per chunk, named to reflect the chunk scope:
- `feat/auth-entity-user` (Chunk 1)
- `feat/auth-feature-login` (Chunk 2)
- `feat/auth-page-login` (Chunk 3)

All branches base from `development`. Must never branch from `main`.

**Branch freshness check (multi-chunk only):** Before creating a branch for Chunk 2 or later, git agent runs `git fetch origin development` and checks whether `development` has new commits since the previous chunk's branch was cut. If yes, dev orchestrator informs the user and asks whether to:
- Rebase the new chunk branch on the latest `development` (recommended)
- Proceed without rebase (user accepts potential merge conflict risk)

After creating the branch, the git agent records the branch name in the task state file under the current chunk's `Target PR` column (as a branch reference until the PR number is known).

**Gate ②:** Dev orchestrator shows the proposed branch name and asks the user to confirm or edit.

---

### Stage 3 — IMPLEMENT

**Delegates to:** `implementer.agent.md` (one invocation per task from the plan)

For each task in the plan, the implementer:

- Scaffolds the FSD slice directory structure (`ui/`, `model/`, `api/`, `lib/`, `config/`, `index.ts`)
- Writes business logic following all project conventions
- Uses `@/` alias for all cross-slice imports
- Never uses `export default`
- Never uses `any` type
- Does not import `zustand` or `axios` directly — uses `@/shared/store` and `@/shared/api`
- Never imports from a sibling slice on the same layer
- Registers new pages in the router if a page slice is created
- Loads the relevant skill (`zustand-patterns` or `react-query-patterns`) when writing state or API code

Processing order: entities → features → widgets → pages

---

### Stage 4 — TEST

**Delegates to:** `tester.agent.md`

For each implemented slice, the tester:

- Writes co-located tests (`file.ts` → `file.test.ts`, same directory)
- Covers: `model/` stores and hooks, `api/` query and mutation hooks
- Uses Vitest globals — no explicit `import { describe, it, expect }`
- Uses `@testing-library/react` for component tests
- Does NOT test presentational-only components (no business logic to assert)
- Loads `testing-patterns/SKILL.md` for test structure patterns

---

### Stage 5 — VALIDATE

**Delegates to:** `fsd-reviewer.agent.md` AND `code-reviewer.agent.md` (both invoked, results aggregated)

**fsd-reviewer checks:**
- Import direction: upper layers must not import from lower (e.g., `shared` must not import from `features`)
- All cross-slice imports use `@/` prefix, not relative paths
- No same-layer cross-slice imports (e.g., `features/auth` must not import `features/profile`)
- `@x` pattern used correctly for cross-entity references
- `shared` layer contains zero business domain knowledge

**code-reviewer checks:**
- TypeScript: no `any`, explicit return types on all exported functions, unused params prefixed with `_`
- No `export default` anywhere
- Naming: `PascalCase` components/types, `camelCase` functions/hooks, `kebab-case` files
- No direct `import { create } from 'zustand'` or `import axios from 'axios'`

**Gate ③:** If violations exist, dev orchestrator presents them grouped by severity:
- ❌ Blocking (FSD boundary violations) — must fix before proceeding
- ⚠️ Warnings (style/naming) — user decides fix or skip

If blocking issues exist, dev orchestrator delegates back to `implementer.agent.md` for targeted fixes, then re-runs validation.

---

### Stage 6 — COMMIT

**Delegates to:** `git.agent.md`

The git agent performs atomic commits in this order:

1. Source code changes (`src/` files, excluding tests and config)
2. Test files (`*.test.ts`, `*.test.tsx`)
3. Configuration changes (if any)

Each commit message follows Conventional Commits: `<type>(<scope>): <description>`

The git agent loads `git-workflow/SKILL.md` for commit message patterns and staging strategy.

**Gate ④:** Dev orchestrator shows all proposed commit messages and asks the user to confirm, edit, or cancel each one before executing.

---

### Stage 7 — PR

**Delegates to:** `git.agent.md`

The git agent generates a PR targeting `development`:

- Title: mirrors the primary commit message
- Body sections: Summary, Changes (bulleted), Test Coverage, FSD Compliance Notes
- Default state: ready for review (not draft unless user specifies)

**Gate ⑤:** Dev orchestrator shows the full PR body and asks the user to confirm or edit before creating the PR.

---

### Stage 7.5 — AI PR REVIEW

**Delegates to:** `pr-reviewer.agent.md`

> **⚠️ Implementation status: Placeholder — Bitbucket API integration pending.**
> Current scope: pr-reviewer works from the git diff text passed by the orchestrator (via `git diff development...HEAD`). Full Bitbucket PR API integration (reading PR comments, reviewer threads, CI status) is deferred and will be added in a later iteration when MCP or REST API tooling is available.

After the PR is created, the orchestrator obtains the diff via git agent (`git diff development...HEAD`) and passes it to the pr-reviewer. The pr-reviewer performs a holistic review of the entire changeset as a unit — complementing the per-file validation done in Stage 5. It must:

- **Completeness check:** Cross-reference the diff against the Stage 1 task plan — verify every planned task is present in the changes
- **Consistency check:** Look for mismatches across the full diff (e.g., a new API hook with no UI consumer, a new type not exported from `index.ts`, a store action with no corresponding test)
- **Test coverage check:** Verify that every new `model/` or `api/` file introduced in the diff has a corresponding `*.test.ts` file in the diff
- **FSD holistic check:** From a bird's-eye view, confirm the overall change set doesn't cross layer boundaries when viewed as a whole (catches multi-file violations that per-file checks miss)
- **Output format:** Produce a structured review comment ready to paste into Bitbucket, organized as:
  - ✅ Looks Good: items that are well-implemented
  - ❌ Must Fix: blocking issues
  - 💡 Suggestions: non-blocking improvements
  - ❓ Questions: items requiring clarification from the implementer

The pr-reviewer is **read-only** — it never suggests code edits directly. If blocking issues are found, dev orchestrator presents them to the user and asks whether to re-enter the fix cycle (back to Stage 3) or proceed anyway.

---

### Stage 8 — HUMAN REVIEW (mandatory gate)

Dev orchestrator informs the user:

> "PR has been created. This step requires at least 1 human approval on Bitbucket before merging. When the PR is approved, return here to proceed."

Dev orchestrator also updates the task state file: sets the active chunk's `Target PR` to the actual PR number (if git agent can provide it) and sets status to `🔄 open`.

**Gate ⑥:** User manually confirms that the PR has received the required approval(s) and has been merged.

Upon confirmation, dev orchestrator:
1. Updates the task state file: marks the current chunk as `✅ merged`
2. Checks if more chunks remain in the chunking plan
   - If yes: updates `Current Session State → Active chunk` and `Next action`, then loops back to Stage 2 for the next chunk
   - If no: proceeds to Stage 9
3. Saves the updated task state file

Dev orchestrator does not proceed to Stage 9 until Gate ⑥ is confirmed and all chunks are marked merged.

---

### Stage 9 — MERGE & RELEASE (semi-automated)

**Triggered only when:** User explicitly confirms they want to proceed with merge/release.

**Delegates to:** `git.agent.md`

For a standard feature merge to `development`:
- Strategy: Squash Merge
- Dev orchestrator provides the squash merge commit message for the user to copy into Bitbucket

For a release (when `development` → `main`):
- Strategy: Merge Commit (no squash, preserves history)
- Create a `release/vX.Y.Z` branch first
- Proposed SemVer bump type: major / minor / patch (planner determines based on change scope)
- Update `CHANGELOG.md` with release notes
- Create git tag `vX.Y.Z` on `main` after merge

**Gate ⑦:** Dev orchestrator presents the version number, tag name, and release notes for user confirmation before any tag or merge operation.

> Release automation is intentionally semi-automated. The agent prepares all materials (merge commit message, tag, changelog entry) and presents them for user execution. No automated push to `main` without explicit user action.

---

## Task Checklist

### Task 1: Global Instructions

- [ ] Create `.github/copilot-instructions.md` — tech stack, FSD hierarchy, critical constraints, agent rules

### Task 2: File Instructions

- [ ] Create `.github/instructions/features.instructions.md` (`applyTo: src/features/**`)
- [ ] Create `.github/instructions/entities.instructions.md` (`applyTo: src/entities/**`)
- [ ] Create `.github/instructions/shared.instructions.md` (`applyTo: src/shared/**`)
- [ ] Create `.github/instructions/pages.instructions.md` (`applyTo: src/pages/**`)
- [ ] Create `.github/instructions/test.instructions.md` (`applyTo: **/*.test.{ts,tsx}`)

### Task 3: Skills

- [ ] Create `.github/skills/fsd-architecture/SKILL.md`
- [ ] Create `.github/skills/zustand-patterns/SKILL.md`
- [ ] Create `.github/skills/react-query-patterns/SKILL.md`
- [ ] Create `.github/skills/testing-patterns/SKILL.md`
- [ ] Create `.github/skills/git-workflow/SKILL.md`

### Task 4: Specialist Subagents

- [ ] Create `.github/agents/planner.agent.md` (`user-invocable: false`, tools: `read, search, todo`)
- [ ] Create `.github/agents/implementer.agent.md` (`user-invocable: false`, tools: `read, edit, search`)
- [ ] Create `.github/agents/tester.agent.md` (`user-invocable: false`, tools: `read, edit, search`)
- [ ] Create `.github/agents/fsd-reviewer.agent.md` (`user-invocable: false`, tools: `read, search`)
- [ ] Create `.github/agents/code-reviewer.agent.md` (`user-invocable: false`, tools: `read, search`)
- [ ] Create `.github/agents/pr-reviewer.agent.md` (`user-invocable: false`, tools: `read, search`)
- [ ] Create `.github/agents/git.agent.md` (`user-invocable: false`, tools: `execute, read`)

### Task 5: Orchestrator

- [ ] Create `.github/agents/dev.agent.md` with frontmatter:
  ```yaml
  user-invocable: true
  tools: [agent, todo, read, edit]
  agents: [planner, implementer, tester, fsd-reviewer, code-reviewer, pr-reviewer, git]
  argument-hint: "Describe the feature to implement"
  ```

> Note: `agents:` must list exact agent file names (without `.agent.md` extension). `dev.agent.md` needs `read` to check `docs/agent-tasks/active/` on startup and `edit` to write/update the task state file.

---

## Implementation Notes

- Start implementation from Task 5 (orchestrator) to define the workflow contract first, then work backwards to subagents and skills.
- Each `*.agent.md` description field must contain trigger keywords specific enough for parent agents to delegate correctly.
- `git.agent.md` receives the `execute` tool — limit its scope strictly to git commands. It must never run `npm`, `rm`, or any non-git commands.
- `fsd-reviewer.agent.md`, `code-reviewer.agent.md`, and `pr-reviewer.agent.md` are all read-only by design. They must never receive `edit` in their tools list.
- `pr-reviewer.agent.md` differs from `fsd-reviewer` and `code-reviewer` in scope: the two Stage 5 reviewers check individual files against rules; the pr-reviewer reads the entire diff holistically and focuses on completeness, consistency, and cross-cutting concerns.
- Gate confirmations must use `vscode_askQuestions` (the VS Code ask tool) — never plain text prompts.
- **Context passing is mandatory:** Every subagent invocation must include the relevant prior-stage output in its prompt. Subagents have no shared memory. See the Context Passing Protocol section above.
- Task state files live in `docs/agent-tasks/active/` while in progress. After all chunks are merged (Stage 9 complete), the orchestrator moves the file to `docs/agent-tasks/completed/` by renaming it. Abandoned tasks are also moved to `completed/` with status `abandoned`. The directory serves as a human-readable audit trail.
- The task state file format must remain stable — subagents should not modify it. Only the `dev.agent.md` orchestrator writes to the task state file (delegating the initial creation to planner, but owning all subsequent updates).
- For multi-chunk tasks, Stages 3–8 form a loop. The loop terminates when all chunks in the Chunking Plan table have status `✅ merged`. The orchestrator tracks loop state in the task file, not in memory.
- If `docs/agent-tasks/active/` contains multiple task files on startup, the orchestrator must list them and ask the user which task to resume, or whether to start a new task.
