# CLAUDE.md — Coding Rules for AI Coding Tools

This file gives AI assistants the rules needed to write correct code in this project.
For deep architectural explanations see [`docs/architecture.md`](docs/architecture.md).

## Project Type

React project template based on **Feature-Sliced Design (FSD)**.

## Tech Stack

- **React 18 + Vite + TypeScript** (strict mode enabled)
- **CSS Modules + Ant Design** — styling and UI components
- **Zustand** — client-side state management
- **TanStack Query (React Query)** — server-state / async data fetching
- **React Router v7** — client-side routing
- **Vitest + jsdom** — unit and component testing

## Path Alias

`@/` maps to `src/`.

- All cross-layer and cross-slice imports **MUST** use `@/`.
- Relative imports (`./`, `../`) are only allowed **within the same slice/segment**.

```ts
// correct — cross-layer import
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth/model"

// wrong — relative import crossing slice boundary
import { Button } from "../../shared/ui"
```

## FSD Layers and Import Rules

> Full reference: [`docs/architecture.md`](docs/architecture.md)

Layers (top → bottom). Each layer may only import from layers **below** it.

```
app         ← can import: pages, widgets, features, entities, shared
pages       ← can import: widgets, features, entities, shared
widgets     ← can import: features, entities, shared
features    ← can import: entities, shared
entities    ← can import: shared
shared      ← cannot import any other layer
```

## Same-Layer Isolation

A slice **MUST NOT** import from a _different_ slice on the same layer. Imports between segments within the same slice are allowed.

```ts
// FORBIDDEN — feature importing another feature
import { getProfile } from "@/features/profile" // inside features/auth
```

## Cross-Entity References (`@x` Pattern)

When one entity must reference a type or value from another entity on the same layer, use the `@x` pattern instead of a direct slice import.

```ts
// src/entities/user/@x/order.ts — re-exports only what the order entity is allowed to use from user
export type { UserId } from "../model"
```

## Slice Structure

Each slice contains segments (only create what is needed):

```
sliceName/
  ui/         # React components
  model/      # state, stores, hooks, types
  api/        # API calls and query hooks
  lib/        # utilities local to this slice
  config/     # constants and configuration
  index.ts    # public API barrel — only export what consumers need
```

Code outside the slice **must** import from the `index.ts` barrel, never from internal files directly.

```ts
// Correct
import { LoginForm } from "@/features/auth"

// Wrong — imports an internal file directly
import { LoginForm } from "@/features/auth/ui/LoginForm"
```

## Shared Layer Segments

```
shared/
  api/        # base HTTP client, interceptors
  config/     # app-wide constants and env vars
  lib/        # generic utilities and helpers
  store/      # shared Zustand store utilities
  ui/         # generic, reusable UI components
```

`shared` has **zero business domain knowledge** — no user, order, or other domain concepts.

## Test Co-location

Tests live next to the source file they test, named `*.test.ts` or `*.test.tsx`.

```
model/
  authStore.ts
  authStore.test.ts
```

## Commit Format

Conventional Commits: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `revert`

```
feat(auth): add JWT refresh logic
fix(cart): prevent duplicate item entries
chore(deps): upgrade react-router to v7
```

## ESLint Enforcement

FSD import rules are enforced by `eslint-plugin-boundaries`. Violations block commits via pre-commit hooks — fix them before committing.
