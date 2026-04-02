# Agent Workflow Test — Evaluation Checklist

Use this checklist to evaluate each test prompt execution.
Score each item: ✅ Pass | ⚠️ Partial | ❌ Fail | ⬜ N/A

---

## Test Prompts

| #   | Prompt                       | Expected Behavior                                     | Tests               |
| --- | ---------------------------- | ----------------------------------------------------- | ------------------- |
| 1   | `test-workflow-auth`         | Multi-chunk split (UI + Logic + API), Gate ① triggers | Chunking, FSD, Gate |
| 2   | `test-workflow-notification` | Single chunk, no split                                | Single-flow, FSD    |
| 3   | `test-workflow-profile-ui`   | Figma URL detected, asks questions about Frame/Node   | Figma mode, UI      |

---

## A. Dev Agent — Input Parsing & Orchestration

| #   | Check                                                          | Score |
| --- | -------------------------------------------------------------- | ----- |
| A1  | Dev correctly identifies no Jira Key (description-driven mode) |       |
| A2  | Dev delegates to @planner with all parsed info                 |       |
| A3  | Dev does NOT write code before planner returns                 |       |
| A4  | Dev does NOT create branch before Gate ① confirmation          |       |

## B. Planner — Need Analysis

| #   | Check                                                            | Score |
| --- | ---------------------------------------------------------------- | ----- |
| B1  | Planner structures the requirement (goal, AC, constraints)       |       |
| B2  | Planner scans existing codebase (shared/api, shared/store, etc.) |       |
| B3  | Planner identifies reusable modules (apiInstance, create store)  |       |
| B4  | Planner asks clarification if requirements are ambiguous         |       |

## C. Planner — Chunk Splitting (multi-chunk scenarios)

| #   | Check                                                              | Score |
| --- | ------------------------------------------------------------------ | ----- |
| C1  | Correctly decides to split (hits 2+ trigger conditions)            |       |
| C2  | Each chunk is independently mergeable                              |       |
| C3  | Chunks follow recommended order: shared → UI Shell → Logic → Tests |       |
| C4  | Each chunk has mode tag (🎨/⚙️/🔀)                                 |       |
| C5  | Dependencies between chunks are explicit                           |       |
| C6  | Chunk Manifest file created in `.dev/chunks/`                      |       |

## D. Planner — FSD File Placement

| #   | Check                                                            | Score |
| --- | ---------------------------------------------------------------- | ----- |
| D1  | New files are placed in correct FSD layers                       |       |
| D2  | Auth store → `features/auth/model/` (not entities, not shared)   |       |
| D3  | API hooks → `features/auth/api/`                                 |       |
| D4  | Login/Register pages → `pages/login/`, `pages/register/`         |       |
| D5  | Route guard → `features/auth/` or `app/router/`                  |       |
| D6  | No files placed in wrong layers (e.g., business logic in shared) |       |
| D7  | Uses `@/` path alias in planned imports                          |       |

## E. Planner — Import Rules

| #   | Check                                         | Score |
| --- | --------------------------------------------- | ----- |
| E1  | Plan uses `@/shared/api` not direct axios     |       |
| E2  | Plan uses `@/shared/store` not direct zustand |       |
| E3  | Plan uses `@/shared/ui` not direct antd       |       |
| E4  | No same-layer cross-slice imports in plan     |       |
| E5  | Pages only import from lower layers           |       |

## F. Planner — Output Format

| #   | Check                                                      | Score |
| --- | ---------------------------------------------------------- | ----- |
| F1  | Output matches template format (tables, sections)          |       |
| F2  | Change file list is specific (exact file paths, not vague) |       |
| F3  | Implementation steps are actionable                        |       |
| F4  | Test points cover key scenarios                            |       |

## G. Gate ① — Plan Confirmation

| #   | Check                                                            | Score |
| --- | ---------------------------------------------------------------- | ----- |
| G1  | Dev shows plan summary to user after planner returns             |       |
| G2  | Dev calls `vscode/askQuestions` with confirm/edit/cancel options |       |
| G3  | Dev waits for user response (does NOT auto-proceed)              |       |
| G4  | Selecting "edit" re-invokes planner                              |       |
| G5  | Selecting "cancel" stops the workflow                            |       |

## H. Stage 2 — Branch Creation (after Gate ①)

| #   | Check                                                  | Score |
| --- | ------------------------------------------------------ | ----- |
| H1  | Branch created AFTER user confirms, BEFORE implementer |       |
| H2  | Branch name follows convention: `feat/{task-slug}`     |       |
| H3  | Branch based on `development`                          |       |
| H4  | Uses `execute/runInTerminal` to run git command        |       |

## I. Figma Mode (test-workflow-profile-ui only)

| #   | Check                                         | Score |
| --- | --------------------------------------------- | ----- |
| I1  | Planner detects `--figma` URL in input        |       |
| I2  | Chunk tagged as 🎨 UI mode                    |       |
| I3  | Figma reference section filled in output plan |       |

## J. Single-Chunk Flow (test-workflow-notification only)

| #   | Check                                                                    | Score |
| --- | ------------------------------------------------------------------------ | ----- |
| J1  | Planner correctly decides NOT to split                                   |       |
| J2  | No Manifest file created in `.dev/chunks/`                               |       |
| J3  | Output uses single-chunk template format                                 |       |
| J4  | Widget placed in `widgets/notification-bar/` or `features/notification/` |       |

---

## How to Run

1. Open VS Code Chat, switch to **Agent** mode
2. Type `/test-workflow-auth` (or other test prompt)
3. Observe the full flow: dev → planner → Gate ①
4. Score each checklist item
5. At Gate ①, test all 3 options (confirm / edit / cancel)

## Current Scope

Only `dev` and `planner` agents are implemented. The workflow will stop at:

- **Gate ①** if you select "cancel"
- **Stage 2** (branch creation) if you select "confirm"
- **Stage 3** will fail gracefully because `implementer` agent doesn't exist yet

## Tips

- Run each test 2-3 times to check consistency
- Compare outputs across runs for the same prompt
- If planner fails to split auth into chunks, check if skill context loaded
- Use `/troubleshoot` after a run to inspect tool calls and context loading
