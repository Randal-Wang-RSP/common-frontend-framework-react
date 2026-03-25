# Documentation Guide

**Purpose:** Repository documentation for FSD React template — architecture, conventions, installation, and AI configuration.

## Structure

```
docs/
├── architecture.md          # FSD overview, layers, import rules
├── conventions.md           # Naming, imports, commits, formatting
├── installation.md          # Human setup guide
├── installation-ai-config.md # AI agent configuration
├── layers/                  # Per-layer deep dives
│   ├── app.md
│   ├── pages.md
│   ├── widgets.md
│   ├── features.md
│   ├── entities.md
│   └── shared.md
└── superpowers/             # AI customization system
    ├── ai-customization.md  # 4-tier AI instruction system
    ├── specs/               # Design specifications
    └── plans/               # Implementation plans
```

## Where to Look

| Task                        | File                                                            | Notes                                                |
| --------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Understand FSD architecture | `architecture.md`                                               | Start here — layer diagram, import rules, @x pattern |
| Add code to specific layer  | `layers/{layer}.md`                                             | What belongs, what doesn't, conventions              |
| Setup new project           | `installation.md`                                               | Package scripts, toolchain config, Husky setup       |
| Configure AI agents         | `installation-ai-config.md` + `superpowers/ai-customization.md` | AGENTS.md, prompts, skills, Copilot tiers            |
| Naming/commits/style        | `conventions.md`                                                | File naming, import order, Conventional Commits      |

## Conventions (Docs-Specific)

- **Markdown:** Standard GitHub Flavored Markdown
- **Code blocks:** Use `ts` for TypeScript, `bash` for commands
- **File paths:** Absolute from repo root (`docs/architecture.md`)
- **Cross-references:** Relative links (`./layers/app.md`)

## Anti-Patterns

- **Don't** duplicate content between docs — link instead
- **Don't** put implementation details in architecture docs
- **Don't** use absolute URLs for internal references
- **Don't** document standard tooling (React/Vite basics) — focus on FSD-specific patterns

## Key Commands (from installation.md)

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server
npm run build            # Type check + build
npm run test             # Vitest watch mode
npm run lint             # ESLint check
npm run format           # Prettier format
```
