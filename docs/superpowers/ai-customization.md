# AI Customization System

This document explains the four-tier system used to guide AI coding assistants (GitHub Copilot, Claude Code, opencode) in this project.

---

## Four-Tier Architecture

```
Tier 1  copilot-instructions.md     Always injected. Must stay concise.
Tier 2  .instructions.md            Auto-injected by file path (applyTo).
Tier 3  .prompt.md                  Manually triggered workflows.
Tier 4  .github/skills/             On-demand deep knowledge.
```

Each tier trades **injection frequency** for **content depth**:

| Tier | Injection | Content | Token Cost |
|------|-----------|---------|------------|
| 1 — `copilot-instructions.md` | Every request | Context + hard constraints + core patterns | Always |
| 2 — `.instructions.md` | When editing matching files | Layer-specific rules, ❌ examples | Only when relevant |
| 3 — `.prompt.md` | Manual invocation | Step-by-step agent workflows with checklists | Only when triggered |
| 4 — `SKILL.md` | On-demand by capability match | Deep domain knowledge, detailed examples | Only when needed |

---

## Tier 1 — `copilot-instructions.md`

**Location:** `.github/copilot-instructions.md`

Loaded into every Copilot request regardless of mode (Ask / Plan / Agent). Because of this it must stay focused — aim for under 200 lines.

**What belongs here:**
- Project type and tech stack (Context)
- FSD layer hierarchy and import direction
- The most critical `❌` violations (Never Do)
- Core code patterns with `✅/❌` examples
- Brief workflow pointers (Workflow section)

**What does NOT belong here:**
- Detailed per-layer rules → Tier 2
- Step-by-step task workflows → Tier 3
- Deep library-specific patterns → Tier 4

---

## Tier 2 — `.instructions.md`

**Location:** `.github/instructions/*.instructions.md`

Automatically appended to the Copilot context when the user is editing a file matching the `applyTo` glob.

```
.github/instructions/
  features.instructions.md    # applyTo: src/features/**
  entities.instructions.md    # applyTo: src/entities/**
  shared.instructions.md      # applyTo: src/shared/**
  pages.instructions.md       # applyTo: src/pages/**
  widgets.instructions.md     # applyTo: src/widgets/**
  test.instructions.md        # applyTo: **/*.test.{ts,tsx}
```

**What belongs here:**
- Layer-specific import constraints
- Segment structure details
- Layer-specific `❌` examples not worth repeating globally
- Conventions that only apply within that layer

**Rule of thumb:** if the content only matters when working in a specific directory, it belongs here, not in Tier 1.

---

## Tier 3 — `.prompt.md`

**Location:** `.github/prompts/*.prompt.md`

Manually invoked in Copilot Chat (type `/` or `#` to reference the prompt file). Designed for Agent and Plan modes — provides a complete ordered workflow with a verification checklist.

```
.github/prompts/
  new-feature.prompt.md
  new-entity.prompt.md
  new-page.prompt.md
```

**What belongs here:**
- Multi-step creation workflows ("do X then Y then Z")
- Before/after checklists for FSD compliance
- Guidance on which Tier 2 instruction files to consult first

**Rule of thumb:** if a task requires creating or modifying more than two files in a coordinated way, it deserves a prompt file.

---

## Tier 4 — `SKILL.md`

**Location:** `.github/skills/<name>/SKILL.md`

```
.github/skills/
  zustand-patterns/
    SKILL.md
  react-query-patterns/
    SKILL.md    (future)
  fsd-refactor/
    SKILL.md    (future)
```

Skills are **not** automatically injected. Copilot reads the `description` frontmatter of each skill and decides whether to load the full content based on the user's request.

**What belongs here:**
- Deep, detailed knowledge about a specific library or pattern
- Content that would bloat `.instructions.md` if included there
- Knowledge that is only needed for specific task types, not all the time

**What makes a good skill description:**
The `description` field is what Copilot uses to decide whether to invoke the skill. Write it as "use this when…" rather than "this contains…":

```yaml
---
description: >
  Use when writing or reviewing Zustand stores in this project.
  Covers store structure, devtools setup, slice patterns, and
  how to import from @/shared/store instead of zustand directly.
---
```

---

## Prompt Frameworks and Copilot — What Actually Works

### The Five-Element Framework (Role / Context / Tasks / Constraints / Examples)

This framework is popular for general-purpose prompting. Its applicability to Copilot varies significantly by element:

| Element | Copilot effectiveness | Reason |
|---------|----------------------|--------|
| **Role** | Weak | Copilot does not "adopt a persona". Role declarations have minimal effect on code completion behaviour. |
| **Context** | **Strong** | The most important element. Telling Copilot the project type, architecture, and tech stack directly improves generation quality. |
| **Tasks** | Not applicable | Tasks come from the user at request time. Putting tasks in a system prompt is the wrong layer — use `.prompt.md` for task workflows instead. |
| **Constraints** | **Strong** | Centralised `❌` prohibitions are the single highest-impact content in `copilot-instructions.md`. Scattered constraints are partially ignored. |
| **Examples** | **Strong** | `✅/❌` code pairs outperform prose rules by a significant margin. Copilot is pattern-matching driven, not instruction-driven. |

**Effective subset for Copilot:** Context → Constraints → Examples. Role is low-value; Tasks belong elsewhere.

### Why Copilot Responds Differently from Agent Tools

Copilot (inline completion + Chat) is fundamentally **pattern-matching driven**, not instruction-following driven. This has practical consequences:

| Behaviour | Implication |
|-----------|-------------|
| Does not actively read linked docs | Links in system prompts are for human reference, not for Copilot to follow |
| Front of file has higher weight | Most critical constraints should appear early in `copilot-instructions.md` |
| Code examples > prose rules | A `// ❌ wrong` + `// ✅ right` pair is more effective than a sentence describing the rule |
| Token budget is consumed every request | Every extra line of prose dilutes signal density |

### Copilot Modes and System Prompt Priorities

`copilot-instructions.md` is shared across all three modes. The content most valuable to each mode differs:

| Mode | Primary benefit from system prompt | Secondary |
|------|------------------------------------|-----------|
| **Agent** | Never Do constraints (prevent wrong file writes) | Workflow pointers |
| **Plan** | Workflow section (shapes planning quality) | Context / Architecture |
| **Ask** | Context and Architecture (answers questions correctly) | Constraints |

Since Copilot processes the file top-to-bottom, the recommended section order is:

```
Context + Architecture   ← Ask needs this; foundation for all modes
Never Do                 ← Agent priority; high weight when violations block commits  
Patterns (✅/❌)         ← Agent code generation quality
Workflow                 ← Agent + Plan; comes last, not needed on every request
```

---

## Skills vs. Instructions — Key Distinction

> **Instructions constrain. Skills inform.**

Use `.instructions.md` when: you want to **prevent a mistake** — a rule that must always be enforced whenever working in that context.

Use `SKILL.md` when: you want to **enable correct behaviour** for a specific, non-trivial task — knowledge that is detailed enough to be wrong if omitted, but not needed on every request.

| Scenario | Use |
|----------|-----|
| "Never import across feature boundaries" | `.instructions.md` (always enforce) |
| "Here's how to write a Zustand store correctly" | `SKILL.md` (deep, situational) |
| "Always export named, never default" | `copilot-instructions.md` (global constraint) |
| "Here's how to set up React Query optimistic updates" | `SKILL.md` (deep, situational) |

---

## When to Promote Content Between Tiers

A common evolution path:

1. Start by putting everything in `copilot-instructions.md`
2. When a section grows too large, **demote** it to a `.instructions.md` file with the right `applyTo`
3. When an `.instructions.md` file starts containing "how to" rather than "never do", **extract** a `SKILL.md`
4. When a task pattern repeats across multiple sessions, **create** a `.prompt.md`

**Signal to demote from Tier 1 → Tier 2:** a section only matters when editing a specific layer.  
**Signal to extract Tier 2 → Tier 4:** content describes correct usage rather than forbidden usage.  
**Signal to create Tier 3:** the same multi-step task keeps being requested manually.
