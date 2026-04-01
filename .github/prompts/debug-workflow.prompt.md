---
description: "Debug and validate the dev/fix agent workflow pipeline. Use when testing a specific phase of agent orchestration, verifying subagent delegation, checking context passing, or diagnosing why an agent isn't behaving as expected."
argument-hint: "Phase number to test (1–5), or 'full' for complete pipeline, or 'fix' for fix workflow"
agent: agent
---

# Agent Workflow Debug & Validation

You are running a standardized diagnostic against the current state of the agent workflow implementation.
Your job is to simulate the workflow, identify what works, what fails, and report findings clearly.

## Standard Test Scenario

Use this fixed minimal scenario for all phase tests — never vary it:

> **Scenario:** "Add a `counter` entity to the `entities` layer. It should have a `count` state (number, default 0) and an `increment` action."

This scenario is intentionally minimal: single layer (entities), single slice, no cross-dependencies, no page needed. It isolates each phase without noise.

---

## Phase 1 — Orchestrator + Planner

**What exists:** `dev.agent.md`, `planner.agent.md`

**Simulate:**  
Invoke `dev.agent.md` with the standard scenario. The orchestrator should delegate to `planner.agent.md`.

**Validation checklist:**

- [ ] Did `dev.agent.md` check `docs/agent-tasks/active/` before starting? (session resume logic)
- [ ] Did the orchestrator delegate to `planner` — not try to plan itself?
- [ ] Did the planner output a structured task list with: layer, slice name, segments to create, file list?
- [ ] Did the planner make a chunking decision? (Expected: "small" — single layer, 1 task, ≤ 5 files → single PR)
- [ ] Did the planner produce a task state file draft? (Even if not written yet, was the content proposed?)
- [ ] Did Gate ① fire? (Did the orchestrator present the plan and ask for user confirmation via `vscode_askQuestions`?)
- [ ] Did Gate ① offer confirm / edit / cancel options?

**Known failure modes to check:**

- Orchestrator plans directly instead of delegating → `planner.agent.md` description not keyword-rich enough
- Gate ① uses plain text instead of `vscode_askQuestions` → orchestrator body missing the ask tool call
- Planner output is unstructured prose → planner body needs stricter output format instructions

---

## Phase 2 — + Implementer

**What exists:** Phase 1 agents + `implementer.agent.md`

**Simulate:**  
Resume from end of Phase 1 (assume Gate ① confirmed). Orchestrator should now delegate to `implementer.agent.md`.

**Validation checklist:**

- [ ] Did the orchestrator inject the planner's task list into the `implementer` invocation prompt? (context passing)
- [ ] Did the implementer receive the correct task scope (entities layer, counter slice)?
- [ ] Did the implementer create the correct FSD scaffold?
  - [ ] `src/entities/counter/model/` — store or state definition
  - [ ] `src/entities/counter/index.ts` — barrel export
- [ ] Does the generated code use `@/shared/store` instead of importing `zustand` directly?
- [ ] Does the generated code avoid `export default`?
- [ ] Does the generated code avoid `any` type?
- [ ] Are all exported functions annotated with explicit return types?

**Known failure modes to check:**

- Implementer creates files in wrong layer → context passing missing FSD layer assignment
- Implementer uses `import { create } from 'zustand'` → `zustand-patterns` skill not triggered or not written yet

---

## Phase 3 — + Tester + Validators

**What exists:** Phase 2 agents + `tester.agent.md` + `fsd-reviewer.agent.md` + `code-reviewer.agent.md`

**Simulate:**  
After implementer finishes, orchestrator delegates to tester, then to both reviewers.

**Validation checklist:**

**Tester:**

- [ ] Did the orchestrator inject the list of files created by the implementer into the tester invocation?
- [ ] Did the tester create `src/entities/counter/model/counterStore.test.ts` (or equivalent)?
- [ ] Does the test file use Vitest globals (`describe`, `it`, `expect`) without explicit imports?
- [ ] Does the test cover the `increment` action?

**fsd-reviewer:**

- [ ] Did the orchestrator inject the list of changed files into the fsd-reviewer invocation?
- [ ] Did the fsd-reviewer check import direction? (entities layer should not import from features/pages)
- [ ] Did the fsd-reviewer check for `@/` alias usage?

**code-reviewer:**

- [ ] Did the orchestrator inject the list of changed files?
- [ ] Did the code-reviewer check for `any` type?
- [ ] Did the code-reviewer check for `export default`?
- [ ] Did Gate ③ fire correctly? (group violations by severity, ask user to fix or skip)

**Violation injection test:**  
Temporarily introduce a deliberate violation (e.g., add `export default` to the counter store) and re-run validation. Verify Gate ③ catches and reports it before proceeding.

---

## Phase 4 — + Git Agent

**What exists:** Phase 3 agents + `git.agent.md`

**Simulate:**  
After validation passes, orchestrator delegates branch creation (Stage 2) and later commit (Stage 6).

**Validation checklist:**

**Branch creation (Stage 2):**

- [ ] Did `git.agent.md` create branch `feat/counter-entity` (or similar)?
- [ ] Is the base branch `development`?  
      `git log --oneline feat/counter-entity..development` should return nothing if branched correctly
- [ ] Did Gate ② fire? (show proposed branch name, ask confirm/edit)

**Commit (Stage 6):**

- [ ] Did the orchestrator inject the changed file list + validation status into the git agent?
- [ ] Did git agent stage source files and test files as separate commits?
- [ ] Is the commit message format `feat(entities): add counter entity`?
- [ ] Did Gate ④ fire? (show commit message(s), ask confirm/edit/cancel)

**Abort safety check:**  
Verify git agent ONLY runs git commands. If it attempts to run `npm`, `rm`, or any non-git command, that is a critical defect in the agent body.

---

## Phase 5 — Full Pipeline (+ PR Reviewer)

**What exists:** All agents from Phases 1–4 + `pr-reviewer.agent.md` (placeholder)

**Simulate:**  
Full pipeline from start to Stage 8. Gate ⑥ (human approve) stops the simulation.

**Validation checklist:**

**PR creation (Stage 7):**

- [ ] Did git agent generate a PR body with sections: Summary, Changes, Test Coverage, FSD Compliance Notes?
- [ ] Is the PR target set to `development`?
- [ ] Did Gate ⑤ fire? (show PR body, ask confirm/edit)

**PR reviewer (Stage 7.5 — placeholder):**

- [ ] Did the orchestrator obtain the git diff via git agent before invoking pr-reviewer?
      (Command: `git diff development...HEAD`)
- [ ] Was the diff text passed to pr-reviewer in the invocation prompt?
- [ ] Did pr-reviewer produce output in the four-section format (✅ / ❌ / 💡 / ❓)?

**Stage 8 gate:**

- [ ] Did the orchestrator correctly pause and inform the user about human approval requirement?
- [ ] Did it NOT attempt to auto-merge or proceed without user Gate ⑥ confirmation?

**Task state file:**

- [ ] Does `docs/agent-tasks/active/` contain a task file for this run?
- [ ] Does the task file accurately reflect the current chunk status?

---

## Fix Workflow Test

**Scenario:**

> "The counter entity's `increment` action allows the count to go below 0. Fix it so count never drops below 0 when decrement is called."

Note: This scenario assumes a `decrement` action exists. If it doesn't, fix-analyzer should note that and propose adding both the guard and the test.

**Validation checklist:**

- [ ] Did `fix.agent.md` check `docs/agent-tasks/active/` on startup?
- [ ] Did the orchestrator delegate to `fix-analyzer`, not try to locate the bug itself?
- [ ] Did fix-analyzer correctly identify the file and the missing guard?
- [ ] Did Gate ① present: root cause, fix plan, AND severity classification (standard/hotfix)?
- [ ] Was severity classified as "standard fix" (not hotfix)?
- [ ] Did fix-analyzer correctly decide: small fix (≤ 3 files, single layer) → no task state file needed?
- [ ] Did the implementer make ONLY the minimal change (add guard) and nothing else?
- [ ] Did the pr-reviewer (diff-based) confirm no scope creep?

---

## How to Use This Prompt

1. Open VS Code Copilot Chat in Agent mode
2. Type `/debug-workflow` and specify the phase: e.g., `/debug-workflow Phase 2`
3. The agent will run the standard scenario against the specified phase
4. Review the checklist output and fix any failing items before moving to the next phase

**After each phase passes all checklist items**, mark it as validated in the implementation plan and proceed to the next phase.
