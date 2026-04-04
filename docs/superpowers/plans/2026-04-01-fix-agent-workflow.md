# Fix Agent Workflow — Implementation Plan

> **For agentic workers:** When implementing, start from `fix.agent.md` (orchestrator), then specialist subagents shared with `dev.agent.md`, adding only `fix-analyzer.agent.md` as a fix-specific subagent. Subagents `fsd-reviewer`, `code-reviewer`, `tester`, `implementer`, and `git` are shared with the dev workflow — do not duplicate them.

**Goal:** Build a focused bug-fix and hotfix pipeline using VS Code custom agents and subagents. The `fix.agent.md` orchestrator handles both standard fixes (targeting `development`) and hotfixes (targeting `main`). It delegates analysis, implementation, validation, and git operations to specialist subagents.

**Trigger:** User selects `fix` agent in VS Code Copilot Chat and describes a bug, error message, or issue reference.

**Git Flow targets:**
- Standard fix: `fix/<scope>-<desc>` → `development` (Squash Merge)
- Hotfix (production bug): `hotfix/<scope>-<desc>` → `main` (Merge Commit) + back-merge to `development`

**Session resume:** On every invocation, `fix.agent.md` first checks `docs/agent-tasks/active/` for a task file matching the current fix. If found, it resumes from the recorded `Next action`. For small single-PR fixes a task file may not be created; the orchestrator creates one only when the fix spans multiple files across layers (see Stage 1 — ANALYZE).

---

## Agent Architecture

```
fix.agent.md  (Orchestrator — user-invocable)
 ├── fix-analyzer.agent.md        Stage 1 — root cause analysis + fix plan
 ├── git.agent.md                 Stage 2 — create fix/hotfix branch
 ├── implementer.agent.md         Stage 3 — targeted code fix
 ├── tester.agent.md              Stage 4 — regression tests
 ├── fsd-reviewer.agent.md        Stage 5a — FSD compliance validation (read-only)
 ├── code-reviewer.agent.md       Stage 5b — TS strict / naming validation (read-only)
 ├── git.agent.md                 Stage 6 — atomic commit(s)
 ├── git.agent.md                 Stage 7 — PR creation
 └── pr-reviewer.agent.md         Stage 7.5 — holistic PR review (read-only)
```

Subagents shared with `dev.agent.md`: `implementer`, `tester`, `fsd-reviewer`, `code-reviewer`, `pr-reviewer`, `git`
Fix-specific subagent: `fix-analyzer` (replaces `planner` — analysis focus rather than planning focus)

User confirmation gates: ①Fix plan ②Branch type (fix vs hotfix) ③Violations ④Commit messages ⑤PR body ⑥Human approve ⑦Back-merge (hotfix only)

---

## File Map

| File | Role | Notes |
|------|------|-------|
| `.github/agents/fix.agent.md` | Orchestrator | New file |
| `.github/agents/fix-analyzer.agent.md` | Sub — root cause analysis | New file, fix-specific |
| `.github/agents/implementer.agent.md` | Sub — targeted fix implementation | Shared with dev workflow |
| `.github/agents/tester.agent.md` | Sub — regression test generation | Shared with dev workflow |
| `.github/agents/fsd-reviewer.agent.md` | Sub — FSD compliance (read-only) | Shared with dev workflow |
| `.github/agents/code-reviewer.agent.md` | Sub — TS/naming/style (read-only) | Shared with dev workflow |
| `.github/agents/pr-reviewer.agent.md` | Sub — holistic PR review (read-only) | Shared with dev workflow |
| `.github/agents/git.agent.md` | Sub — git operations | Shared with dev workflow |
| `docs/agent-tasks/active/<date>-fix-<scope>.md` | Task state file (large fixes only) | Created by fix orchestrator |
| `.github/skills/fsd-architecture/SKILL.md` | Deep FSD rules (fix-analyzer + fsd-reviewer) | Shared with dev workflow |
| `.github/skills/git-workflow/SKILL.md` | Fix/hotfix branch strategy + PR templates | Shared with dev workflow |

No new skills needed — fix workflow reuses the complete skill library from the dev workflow.

---

## Context Passing Protocol

Fix workflow follows the same context passing rules as the dev workflow. Key additions specific to fix:

| When invoking... | Must include in the prompt... |
|---|---|
| `implementer` | Root cause analysis output from fix-analyzer (files to change, what to change, why) |
| `pr-reviewer` | Git diff content (from git agent) + original fix plan + fix classification (standard/hotfix) |
| `fsd-reviewer` | List of files changed by implementer in this chunk |
| `git` (PR) | Fix classification (standard/hotfix), target branch, PR body sections |

---

## Abandon Protocol

Identical to the dev workflow abandon protocol. At any Gate, user may choose to abandon. Fix orchestrator:
1. Asks: preserve (stash) or discard uncommitted changes?
2. Updates task state file status to `abandoned` (if file exists)
3. Moves task file to `docs/agent-tasks/completed/`
4. Informs user of branch name for manual deletion on Bitbucket

---

## Pipeline Stages

### Stage 1 — ANALYZE

**Delegates to:** `fix-analyzer.agent.md`

The fix-analyzer receives the bug description and investigates the codebase to produce a targeted fix plan. It must:

- Locate the source of the bug (specific files, functions, or state logic)
- Determine the root cause (logic error, FSD boundary violation, type error, React anti-pattern, etc.)
- Assess impact scope: is this a local fix or does it affect multiple slices/layers?
- Classify severity:
  - **Standard fix** — bug exists in non-production branch, or is low-risk
  - **Hotfix** — production-blocking bug requiring direct patch to `main`
- Produce a minimal fix plan: only the files that need to change, and what needs to change in each

#### Scope Assessment and Task State File

After producing the fix plan, the fix-analyzer evaluates whether a task state file is needed:

- **Small fix** (≤ 3 files, single FSD layer): no task state file needed — the fix is fully contained in one PR
- **Large fix** (> 3 files or spans multiple FSD layers): create a task state file at `docs/agent-tasks/active/<YYYY-MM-DD>-fix-<scope>.md`

For large fixes, the fix-analyzer also determines whether to split into multiple PRs using the same vertical-by-layer chunking principle as the dev workflow. Each chunk must be independently reviewable.

Task state file format for fixes follows the same structure as the dev workflow, with an additional field:
```markdown
## Fix Classification
Type: standard-fix | hotfix
Root cause: <one-line summary>
``` Fix orchestrator presents the root cause analysis, proposed fix plan, severity classification, and (for large fixes) the chunking decision and task file path. User confirms, edits, or cancels. User also confirms severity classification (standard fix vs. hotfix).

---

### Stage 2 — BRANCH

**Delegates to:** `git.agent.md`

Branch naming depends on severity confirmed in Gate ①:

- **Standard fix:** `fix/<scope>-<short-description>` (e.g., `fix/cart-duplicate-items`)
  - Base: `development`
- **Hotfix:** `hotfix/<scope>-<short-description>` (e.g., `hotfix/auth-token-expiry`)
  - Base: `main` (hotfix branches cut from `main`, not `development`)

**Branch freshness check (multi-chunk fixes only):** Before creating a branch for Chunk 2 or later, git agent runs `git fetch` and checks whether the base branch (`development` or `main`) has new commits since the previous chunk's branch was cut. If yes, fix orchestrator informs the user and asks whether to rebase or proceed.

**Gate ②:** Fix orchestrator shows the proposed branch name and type, asks user to confirm or edit.

---

### Stage 3 — IMPLEMENT

**Delegates to:** `implementer.agent.md`

The implementer applies the fix plan produced in Stage 1. Key constraints:

- Make **only** the changes identified in the fix plan — no scope creep
- If the fix requires removing code, remove it completely rather than commenting it out
- If the fix touches a slice that has an `index.ts` barrel, ensure exports remain consistent
- Do not refactor unrelated code, even obvious improvements — fixes must be minimal and reviewable
- Do not add new features as part of a fix

---

### Stage 4 — TEST

**Delegates to:** `tester.agent.md`

For a fix, the tester focuses on regression coverage:

- Write a test that **would have caught** the bug (the failing case)
- Ensure the test passes after the fix is applied
- Do not rewrite existing passing tests
- If an existing test was wrong (masking the bug), update it with a comment explaining the correction
- Co-locate the test with the fixed file

---

### Stage 5 — VALIDATE

**Delegates to:** `fsd-reviewer.agent.md` AND `code-reviewer.agent.md`

Same validation rules as the dev workflow. For a fix, pay special attention to:

- **fsd-reviewer:** Verify the fix didn't introduce any new import direction violations. Quick fixes sometimes import from the wrong layer.
- **code-reviewer:** Verify no `any` type was introduced as a shortcut. Type-safe fixes only.

**Gate ③:** If violations exist, fix orchestrator presents them grouped by severity:
- ❌ Blocking violations — must fix before proceeding
- ⚠️ Non-blocking warnings — user decides

For blocking violations, fix orchestrator delegates back to `implementer.agent.md` for targeted correction, then re-runs validation.

---

### Stage 6 — COMMIT

**Delegates to:** `git.agent.md`

Fix commits should be minimal and focused:

- For small fixes (1–3 files): single commit is acceptable
- For larger fixes touching code + tests + config: atomic split (code → test → config)
- Commit type: `fix(<scope>): <description>` for standard fixes, same format for hotfixes

**Gate ④:** Fix orchestrator shows all proposed commit messages. User confirms, edits, or cancels before execution.

---

### Stage 7 — PR

**Delegates to:** `git.agent.md`

PR targets differ by type:

- **Standard fix:** PR → `development`
- **Hotfix:** PR → `main`

PR body sections:
- **Summary:** One-line description of the bug and the fix
- **Root Cause:** Brief explanation of why the bug occurred (from fix-analyzer output)
- **Changes:** Minimal bulleted list of modified files and what changed
- **Regression Test:** Name of the new test that covers the fixed case
- **Impact:** Affected layers/slices, any downstream effects

**Gate ⑤:** Fix orchestrator shows the full PR body and asks user to confirm or edit.

---

### Stage 7.5 — AI PR REVIEW

**Delegates to:** `pr-reviewer.agent.md`

> **⚠️ Implementation status: Placeholder — Bitbucket API integration pending.**
> Current scope: pr-reviewer works from the git diff text passed by the orchestrator (via `git diff <base>...HEAD`). Full Bitbucket PR API integration is deferred to a later iteration.

For a fix, the orchestrator first retrieves the diff via git agent, then passes it to the pr-reviewer. The pr-reviewer performs a targeted holistic review focusing on correctness and minimal scope:

- **Regression coverage check:** Verify the diff includes a test that would have caught this bug
- **Scope check:** Confirm the diff contains *only* what the fix plan describes — flag any unrelated changes as scope creep
- **Root cause traceability:** Verify the fix actually addresses the root cause identified in Stage 1, not just the symptom
- **Hotfix-specific checks** (when applicable):
  - Confirm no new feature code has crept into the hotfix
  - Verify the change is safe to apply directly to `main` (no half-implemented changes)
- **Output format:** Structured Bitbucket review comment:
  - ✅ Looks Good
  - ❌ Must Fix (blocking)
  - 💡 Suggestions (non-blocking)
  - ❓ Questions

If blocking issues are found, fix orchestrator presents them and asks the user whether to re-enter the fix cycle (back to Stage 3) or proceed.

---

### Stage 8 — HUMAN REVIEW (mandatory gate)

Fix orchestrator informs the user:

> "PR has been created. This step requires at least 1 human approval on Bitbucket before merging. When approved, return here to proceed."

For **hotfixes**, fix orchestrator adds:

> "This is a hotfix targeting `main`. After merge, a back-merge to `development` is required to keep branches in sync. Return here after the hotfix PR is approved and merged."

**Gate ⑥:** User manually confirms that the PR has received the required approval(s) and has been merged.

Upon confirmation, fix orchestrator:
1. If a task state file exists: marks the current chunk as `✅ merged` and checks if more chunks remain
   - If more chunks remain: updates `Current Session State`, loops back to Stage 2 for next chunk
   - If all chunks merged: proceeds to Stage 9
2. If no task state file (small fix): proceeds directly to Stage 9
3. For hotfixes: reminds user about the mandatory back-merge to `development` in Stage 9

---

### Stage 9 — MERGE

**Semi-automated.** Fix orchestrator prepares merge materials; user executes in Bitbucket.

**Standard fix merge:**
- Strategy: Squash Merge → `development`
- Fix orchestrator provides the squash commit message for user to copy into Bitbucket

**Hotfix merge (two-step):**

Step 1 — Merge to `main`:
- Strategy: Merge Commit (preserves hotfix history on `main`)
- Fix orchestrator provides the merge commit message
- After merge: create tag `vX.Y.Z` (patch version bump)

**Gate ⑦ (hotfix only):** Fix orchestrator presents the version bump (patch) and tag name for user confirmation.

Step 2 — Back-merge to `development`:
- After `main` is tagged, merge `main` → `development` using Merge Commit
- This prevents `development` from diverging after a production hotfix
- Fix orchestrator provides the back-merge commit message

> All merge operations are manually executed by the user in Bitbucket. The agent prepares commit messages, tag values, and step-by-step instructions — it does not push or merge directly.

---

## Task Checklist

> **Prerequisite:** Dev workflow tasks must be completed first (shared subagents and skills). Only fix-specific files are listed here.

### Task 1: Fix-specific Subagent

- [ ] Create `.github/agents/fix-analyzer.agent.md` (`user-invocable: false`, tools: `read, search`)

### Task 2: Fix Orchestrator

- [ ] Create `.github/agents/fix.agent.md` with frontmatter:
  ```yaml
  user-invocable: true
  tools: [agent, todo, read, edit]
  agents: [fix-analyzer, implementer, tester, fsd-reviewer, code-reviewer, pr-reviewer, git]
  argument-hint: "Describe the bug, paste the error, or reference an issue"
  ```

> Note: `agents:` must list exact agent file names (without `.agent.md` extension). `fix.agent.md` needs `read` to check for existing task files on startup and `edit` to create/update task state files for large fixes.

---

## Implementation Notes

- `fix-analyzer.agent.md` is the only subagent unique to this workflow. All other subagents (including `pr-reviewer`) are shared with `dev.agent.md` — implement them once in the dev workflow plan.
- **Context passing is mandatory:** Fix orchestrator must explicitly inject prior-stage outputs into each subagent prompt. See the Context Passing Protocol section above.
- The `fix-analyzer` description must include trigger phrases like "root cause", "bug", "error", "regression", "not working" so the parent orchestrator can delegate correctly.
- Hotfix detection: fix orchestrator must ask the user to explicitly confirm the `hotfix` classification. Never auto-classify as hotfix based on keywords alone.
- The back-merge step (Stage 9 Step 2) is critical for Git Flow integrity. Fix orchestrator must always remind the user about this step after a hotfix, even if the user tries to close the conversation.
- Gate ⑦ (hotfix version tag) must show the current version from `package.json` and propose a patch bump. Never bump minor or major for a hotfix without explicit user override.
- If `docs/agent-tasks/active/` contains multiple task files on startup, fix orchestrator must list them and ask the user which task to resume, or whether to start a new fix.
