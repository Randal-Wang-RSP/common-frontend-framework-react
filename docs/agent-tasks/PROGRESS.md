# Agent Workflow Implementation Progress

Tracks the phased build-out of the GitHub Copilot custom agent workflows
defined in `docs/superpowers/plans/`.

**Plans:**

- Dev workflow: [`2026-04-01-dev-agent-workflow.md`](../superpowers/plans/2026-04-01-dev-agent-workflow.md)
- Fix workflow: [`2026-04-01-fix-agent-workflow.md`](../superpowers/plans/2026-04-01-fix-agent-workflow.md)
- Debug prompt: [`.github/prompts/debug-workflow.prompt.md`](../../.github/prompts/debug-workflow.prompt.md)

---

## Phase Overview

| Phase | Scope                                                                                      | Status         | Validated                   |
| ----- | ------------------------------------------------------------------------------------------ | -------------- | --------------------------- |
| 1     | `dev.agent.md` + `planner.agent.md` + `fsd-architecture` SKILL + `copilot-instructions.md` | ✅ done        | ✅ Phase 1 checklist passed |
| 2     | `implementer.agent.md` + `zustand-patterns` SKILL + `react-query-patterns` SKILL           | ✅ done        | ✅ Phase 2 checklist passed |
| 3     | `tester.agent.md` + `fsd-reviewer.agent.md` + `code-reviewer.agent.md`                     | ⏳ not started | —                           |
| 4     | `git.agent.md`                                                                             | ⏳ not started | —                           |
| 5     | `pr-reviewer.agent.md` (placeholder) + `fix.agent.md` + `fix-analyzer.agent.md`            | ⏳ not started | —                           |
| 6     | File instructions (Tier 2): 5 × `.instructions.md`                                         | ⏳ not started | —                           |

---

## Phase 1 — Orchestrator + Planner ✅

**Commit:** `feat(agent-workflow): implement Phase 1 — dev orchestrator + planner subagent`

**Files created:**

- `.github/copilot-instructions.md` — Tier 1 global context
- `.github/skills/fsd-architecture/SKILL.md` — deep FSD rules
- `.github/agents/planner.agent.md` — task planning subagent
- `.github/agents/dev.agent.md` — dev orchestrator

**Validation result:** All Phase 1 checklist items passed.

---

## Phase 2 — Implementer ✅

**Files created:**

- [x] `.github/skills/zustand-patterns/SKILL.md`
- [x] `.github/skills/react-query-patterns/SKILL.md`
- [x] `.github/agents/implementer.agent.md`

**Debug test:** Run `/debug-workflow Phase 2` after implementation.

**Validation checklist** (from `debug-workflow.prompt.md` Phase 2):

- [x] Orchestrator injects planner task list into implementer prompt (context passing)
- [x] Implementer creates correct FSD scaffold (entities/counter/model/ + index.ts)
- [x] Uses `@/shared/store` instead of direct `zustand` import
- [x] No `export default`
- [x] No `any` type
- [x] Explicit return types on exported functions

---

## Phase 3 — Tester + Validators ⏳

**Files to create:**

- [ ] `.github/agents/tester.agent.md`
- [ ] `.github/skills/testing-patterns/SKILL.md`
- [ ] `.github/agents/fsd-reviewer.agent.md`
- [ ] `.github/agents/code-reviewer.agent.md`

---

## Phase 4 — Git Agent ⏳

**Files to create:**

- [ ] `.github/agents/git.agent.md`
- [ ] `.github/skills/git-workflow/SKILL.md`

---

## Phase 5 — PR Reviewer + Fix Workflow ⏳

**Files to create:**

- [ ] `.github/agents/pr-reviewer.agent.md` _(placeholder — Bitbucket API pending)_
- [ ] `.github/agents/fix.agent.md`
- [ ] `.github/agents/fix-analyzer.agent.md`

---

## Phase 6 — File Instructions (Tier 2) ⏳

**Files to create:**

- [ ] `.github/instructions/features.instructions.md`
- [ ] `.github/instructions/entities.instructions.md`
- [ ] `.github/instructions/shared.instructions.md`
- [ ] `.github/instructions/pages.instructions.md`
- [ ] `.github/instructions/test.instructions.md`
