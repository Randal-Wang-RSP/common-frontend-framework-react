# AGENTS.md — Coding Guidelines for AI Agents

**Generated:** 2026-03-25
**Mode:** init-deep --max-depth=2 (update)

## Quick Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # Type check + production build

# Testing (Vitest + jsdom)
npm run test             # Watch mode
npm run test:run         # Run once (CI)
npm run test:coverage    # With coverage report
npx vitest run src/path/to/file.test.ts   # Run single test file

# Linting & Formatting
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all
```

## Architecture (Feature-Sliced Design)

> Full reference: [`docs/architecture.md`](docs/architecture.md)

Layer imports flow downward only:

```
app → pages → widgets → features → entities → shared
```

**Import Rules:**

- Use `@/` alias for all cross-slice imports (enforced by ESLint)
- Relative imports (`./`, `../`) only within the same slice
- Same-layer slices cannot import each other
- Cross-entity references use `@x` pattern: `entities/user/@x/order.ts`

## Code Style

**TypeScript:**

- Strict mode enabled
- Explicit return types on exported functions
- Prefix unused parameters with `_`
- Avoid `any` (warned by ESLint)

**Formatting (Prettier):**

- No semicolons
- Double quotes
- 100 character print width
- 2-space tabs
- Trailing commas (ES5)

**Naming:**

- `PascalCase` for components, types, interfaces
- `camelCase` for functions, variables, hooks
- `kebab-case` for file names
- React hooks: `useXxxStore`, `useXxxQuery`

**Testing:**

- Co-locate tests: `file.ts` → `file.test.ts`
- Use Vitest globals (no imports needed for `describe`, `it`, `expect`)
- Test utilities from `@testing-library/react`

## Project Structure

> Full reference: [`docs/architecture.md`](docs/architecture.md)

```
src/
├── app/              # Entry, providers, router, styles
├── pages/            # Route-level page components
├── widgets/          # Complex composite components
├── features/         # User interactions, business logic
├── entities/         # Domain models, business entities
└── shared/           # Reusable UI, API, utilities, config
    ├── api/          # Axios instance
    ├── ui/           # Generic UI components
    ├── lib/          # Helper utilities
    ├── store/        # Zustand utilities
    └── config/       # Env vars, constants
```

Each slice contains: `ui/`, `model/`, `api/`, `lib/`, `config/` segments + `index.ts` barrel.

## Git Workflow

> Full reference: [`.github/skills/git-workflow/SKILL.md`](.github/skills/git-workflow/SKILL.md)

**Conventional Commits:**

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, revert
```

Examples:

- `feat(auth): add JWT refresh logic`
- `fix(cart): prevent duplicate items`
- `chore(deps): upgrade react-router to v7`

**Pre-commit hooks run automatically via Husky.**

**Atomic commits:** split changes by type — code, tests, docs, config in separate commits. Stage selectively (`git add <files>`), not `git add -A`.

**Branching:** Git Flow — `main` (production) + `development` (integration) + short-lived `feat/`, `fix/`, `hotfix/`, `release/` branches. Branch naming: `<type>/<scope>-<short-description>`.

**Merge strategy:** Squash Merge for features → `development`; Merge Commit for releases/hotfixes → `main`.

**Protected branches:** `main` and `development` — no direct push, PR + 1 approval required.

**Repository:** Bitbucket · CI/CD: Jenkins · Code quality: SonarQube

## Key Dependencies

- React 18 + Vite + TypeScript (strict)
- React Router v7
- TanStack Query (React Query) for server state
- Zustand for client state
- Ant Design for UI components
- CSS Modules for styling
- Vitest + jsdom for testing

## Agent Rules

- **Language:** Thinking and response text follow the user's language. Code, comments, documentation, commit messages, and PR content are **always in English**.
- **Branch-first:** Always create a feature branch before writing any code — never commit directly to `main` or `development`.
- **Commit/PR review:** Before executing `git commit` or creating a PR, display the proposed message in the response text, then call `vscode_askQuestions` with confirm/edit/cancel options. Never execute without tool-based confirmation.
- **Iterative workflow:** If new changes arise after a commit, re-enter the workflow from the appropriate step — assess, stage, show message, commit. Never skip steps.
- **Session end gate:** After completing any task or yielding control, **always** call `vscode_askQuestions` to ask the user about the next action. Include context-appropriate options and a "pause/stop" choice. This applies after every commit, push, PR creation, or code change — not only at session end.

## Important Constraints

- Client env vars must be prefixed with `VITE_`
- FSD boundaries are enforced by `eslint-plugin-boundaries` — violations block commits
- Do not import across same-layer slice boundaries
- Keep shared layer free of business domain logic
- Named exports only — no `export default` anywhere
- No `any` type — use proper typing
- Do not import `zustand` or `axios` directly — use `@/shared/store` and `@/shared/api` wrappers
