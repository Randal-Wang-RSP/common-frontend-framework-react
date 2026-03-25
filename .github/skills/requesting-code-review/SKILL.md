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
