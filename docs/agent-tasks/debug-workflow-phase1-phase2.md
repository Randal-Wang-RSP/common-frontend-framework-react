# Agent Workflow Debug Report — Phase 1 & Phase 2

**Date:** 2026-04-02  
**Scenario:** Add a `counter` entity to the `entities` layer with `count` state (number, default 0) and an `increment` action.

---

## Phase 1 — Orchestrator + Planner

### Checklist

| #   | Check                                                                    | Result  | Evidence                                                                                      |
| --- | ------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| 1   | `dev.agent.md` checks `docs/agent-tasks/active/` before starting         | ✅ PASS | Startup block explicitly calls `#tool:read docs/agent-tasks/active/` with resume/branch logic |
| 2   | Orchestrator delegates to `planner` — does not plan itself               | ✅ PASS | Stage 1 opens with "Delegate to `planner` subagent." No self-planning logic                   |
| 3   | Planner outputs structured task list (layer, slice, segments, file list) | ✅ PASS | Strict output format enforced in "Output Format" section with concrete example                |
| 4   | Planner makes a chunking decision (expected: "small")                    | ✅ PASS | Chunking table present; 1 task + 1 layer + 3 files → small → Single PR                        |
| 5   | Planner produces task state file draft                                   | ✅ PASS | Step 5 with full draft template + example content included                                    |
| 6   | Gate ① fires via `vscode_askQuestions`                                   | ✅ PASS | Stage 1 body includes the `vscode_askQuestions` call with Options array                       |
| 7   | Gate ① offers confirm / edit / cancel                                    | ✅ PASS | Options: `["Confirm, proceed to branching", "Edit plan", "Cancel"]`                           |

### Known Failure Mode Scan

| Failure Mode                           | Result     | Notes                                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| Orchestrator hijacks planning          | ✅ No risk | `planner` listed in `agents:` frontmatter; Stage 1 is a delegation step             |
| Gate ① uses plain text instead of tool | ✅ No risk | `vscode/askQuestions` in `tools:` frontmatter; tool call block present in body      |
| Planner output is unstructured prose   | ✅ No risk | "Always output the plan in this exact structure, with no additional prose" enforced |

### Phase 1 Verdict: ✅ PASS

---

## Phase 2 — Implementer

### Checklist

| #   | Check                                                             | Result     | Evidence                                                                                 |
| --- | ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1   | Orchestrator injects planner task list into implementer prompt    | ✅ PASS    | Stage 3: "specific task entry from the planner's output (layer, slice, segments, files)" |
| 2   | Implementer receives correct task scope (entities / counter)      | ✅ PASS    | Orchestrator passes layer + slice from planner task entry                                |
| 3   | FSD scaffold created (`src/entities/counter/model/` + `index.ts`) | ⚠️ AT RISK | See defect below — planner example produces wrong filename                               |
| 4   | Code uses `@/shared/store` not `zustand` directly                 | ✅ PASS    | Implementer constraint + `zustand-patterns` skill both enforce this                      |
| 5   | Code avoids `export default`                                      | ✅ PASS    | Explicit constraint in `implementer.agent.md` body                                       |
| 6   | Code avoids `any` type                                            | ✅ PASS    | Explicit constraint in `implementer.agent.md` body                                       |
| 7   | All exported functions have explicit return types                 | ✅ PASS    | TypeScript rules in Step 5 and skill example both demonstrate this                       |

### Known Failure Mode Scan

| Failure Mode                                        | Result     | Notes                                                                           |
| --------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| Implementer creates files in wrong layer            | ✅ No risk | Context passing includes FSD layer assignment from planner                      |
| Implementer uses `import { create } from 'zustand'` | ✅ No risk | `zustand-patterns` skill is triggered by `model/` + store file signal in Step 2 |

---

## 🔴 Defect — Planner Example Inconsistent with Naming Table

**File:** `.github/agents/planner.agent.md`  
**Severity:** High — LLMs weight concrete examples more heavily than abstract rules

### Root Cause

Step 3 was recently updated to add a naming rules table (correct fix). However, the example output block immediately following still uses the old filename:

**Naming table (correct):**

```
| model/ | Zustand store | use<SliceName>Store.ts | useCounterStore.ts |
```

**Example output block (wrong):**

```
Files to create: - model/counterStore.ts # Zustand store with count state and increment action
```

### Impact

The implementer's constraint is "Create ONLY the files listed in the task entry." If the planner outputs `counterStore.ts`, the implementer creates `counterStore.ts` — the correct name `useCounterStore.ts` never reaches the file system.

### Fix Required

Update the example output in `planner.agent.md` Step 3 from:

```
Files to create: - model/counterStore.ts # Zustand store with count state and increment action
```

to:

```
Files to create:
    - model/useCounterStore.ts  # Zustand store with count state and increment action
    - model/types.ts            # CounterState interface
    - index.ts                  # barrel: re-export store and types
```

Note the example should also include `model/types.ts` and `index.ts` to match the full "Example Output" section shown later in the planner.

---

## Summary

| Phase                            | Overall Status                                       |
| -------------------------------- | ---------------------------------------------------- |
| Phase 1 — Orchestrator + Planner | ✅ PASS                                              |
| Phase 2 — Implementer            | ⚠️ 1 defect (planner example filename inconsistency) |

**Action required:** Fix the `planner.agent.md` example output filename before Phase 3 testing.
