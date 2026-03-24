# AGENTS.md — Coding Guidelines for AI Agents

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

## Key Dependencies

- React 18 + Vite + TypeScript (strict)
- React Router v7
- TanStack Query (React Query) for server state
- Zustand for client state
- Ant Design for UI components
- CSS Modules for styling
- Vitest + jsdom for testing

## Important Constraints

- Client env vars must be prefixed with `VITE_`
- FSD boundaries are enforced by `eslint-plugin-boundaries` — violations block commits
- Do not import across same-layer slice boundaries
- Keep shared layer free of business domain logic
