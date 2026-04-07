# Project Instructions

## Tech Stack

- **Framework**: React 18+ with TypeScript 5+ (strict mode)
- **Build**: Vite
- **Package Manager**: pnpm
- **Styling**: CSS Modules
- **State**: Zustand
- **HTTP**: Axios
- **Testing**: Vitest + React Testing Library

## TypeScript Rules

- `strict: true` — no exceptions
- Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- All function parameters must have explicit types
- Prefer `interface` for object shapes, `type` for unions/utilities

## Code Style

- Components: PascalCase (`UserAvatar.tsx`)
- Hooks: `use` prefix, camelCase (`useUserProfile.ts`)
- Constants: UPPER_SNAKE_CASE
- CSS classes: kebab-case
- Imports: external libs → internal modules (`@/`) → relative → styles

## Component Patterns

- Separate container (data fetching) from presentation (UI rendering)
- Handle all states: loading → error → empty → success
- Use `forwardRef` for reusable UI components
- Clean up side effects (listeners, timers, subscriptions)

## Error Handling

- Never swallow errors: no empty `catch {}` blocks
- Distinguish business errors from unexpected errors
- Always propagate errors to callers after handling

## Git Conventions

- Commit format: `<type>(<scope>): <subject>`
- Types: feat | fix | refactor | style | test | chore | docs | perf
- Branch format: `feat/{ticket}-{desc}`, `fix/{ticket}-{desc}`

## Forbidden

- `console.log` in production code (use logger)
- Inline styles (use CSS Modules)
- Default exports (use named exports)
- Barrel files re-exporting entire directories
- `any` type in any form
- Committing `.env` files or secrets

## AI Workflow

This project uses custom agents (`@dev`, `@ship`) for the development workflow.
See `.github/agents/` for agent definitions and `.github/skills/` for detailed conventions.
