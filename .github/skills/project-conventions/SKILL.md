---
name: project-conventions
description: "FSD architecture rules, coding conventions, and tech stack constraints. Used by planner for file placement decisions and by implementer for code style."
---

# Project Conventions

## Tech Stack

- **React 18 + Vite + TypeScript** (strict mode)
- **CSS Modules + Ant Design** — styling and UI primitives
- **Zustand** — client-side state (`@/shared/store` wrapper)
- **TanStack Query (React Query)** — server-state / async data fetching
- **React Router v7** — client-side routing
- **Vitest + jsdom + React Testing Library** — testing
- **pnpm** — package manager
- **ESLint + Prettier** — linting and formatting

## FSD Architecture

This project uses [Feature-Sliced Design (FSD)](https://fsd.how/).

### Layer Hierarchy (top → bottom)

Each layer may only import from layers **below** it:

```
app         → pages, widgets, features, entities, shared
pages       → widgets, features, entities, shared
widgets     → features, entities, shared
features    → entities, shared
entities    → shared
shared      → (nothing)
```

### Same-Layer Isolation

A slice **MUST NOT** import from a different slice on the same layer.

```ts
// FORBIDDEN — feature importing another feature
import { getProfile } from "@/features/profile" // inside features/auth
```

### Cross-Entity References (`@x` Pattern)

When entities need to reference each other, use explicit cross-reference files:

```
src/entities/user/@x/order.ts   → re-exports what order entity needs from user
```

Rules: one file per consumer, named after the consumer, minimal exports.

## Project Structure

```
src/
├── app/              # Providers, router, global styles (no slices)
├── pages/            # One slice per route (home, user-profile, ...)
├── widgets/          # Shared composite UI blocks (header, sidebar, ...)
├── features/         # User interactions (auth, search, create-order, ...)
├── entities/         # Domain models (user, order, product, ...)
└── shared/           # Zero-domain infrastructure
    ├── api/          # Axios instance (import from here, NOT from axios)
    ├── config/       # Typed env vars (import from here, NOT from import.meta.env)
    ├── lib/          # Generic utility functions
    ├── store/        # Zustand re-exports (import from here, NOT from zustand)
    └── ui/           # UI primitives wrapping Ant Design
```

### Slice Internal Structure

```
sliceName/
  ui/         # React components
  model/      # Zustand stores, hooks, TypeScript types
  api/        # React Query hooks and raw API calls
  lib/        # Slice-local utilities
  config/     # Slice-local constants
  index.ts    # Public API barrel — only export what consumers need
```

Only create segments that are needed. Not every slice needs all segments.

## Import Rules

### Path Alias

`@/` maps to `src/`. **All cross-layer/cross-slice imports MUST use `@/`**.

```ts
// ✅ Correct
import { Button } from "@/shared/ui"
import { LoginForm } from "@/features/auth"

// ❌ Wrong — relative path crossing slice boundary
import { Button } from "../../shared/ui"

// ❌ Wrong — importing internal file directly
import { LoginForm } from "@/features/auth/ui/LoginForm"
```

### Mandatory Wrappers

| Instead of                         | Use                                          |
| ---------------------------------- | -------------------------------------------- |
| `import axios from "axios"`        | `import { apiInstance } from "@/shared/api"` |
| `import { create } from "zustand"` | `import { create } from "@/shared/store"`    |
| `import { Button } from "antd"`    | `import { Button } from "@/shared/ui"`       |
| `import.meta.env.VITE_*`           | `import { env } from "@/shared/config"`      |

### Import Order

```ts
// 1. External libraries
import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"

// 2. Internal modules (@/)
import { apiInstance } from "@/shared/api"
import { useAuth } from "@/features/auth"

// 3. Relative imports (same slice only)
import { UserAvatar } from "./UserAvatar"
import type { UserAvatarProps } from "./types"

// 4. Styles (last)
import styles from "./UserProfile.module.css"
```

## TypeScript Rules

- `strict: true` — no exceptions
- Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- All function parameters must have explicit types
- Exported functions must have explicit return types
- Prefer `interface` for object shapes, `type` for unions/utilities
- Prefix unused parameters with `_`

## JSDoc Conventions

Add JSDoc to the following — no need for obvious getters or internal helpers:

| Target                                                          | Required fields                                                                                      |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Exported utility / API functions (`lib/`, `api/`)               | One-line summary + `@param` for each actual parameter + `@returns` when non-`void` / non-`undefined` |
| Exported hooks (`useXxxQuery`, `useXxxMutation`, `useXxxStore`) | One-line summary + `@param` for each actual parameter + `@returns` when non-`void` / non-`undefined` |
| Exported React components (public UI)                           | One-line summary + `@param` for each actual parameter + `@returns` when non-`void` / non-`undefined` |
| Module-level barrel (`index.ts`) with non-obvious exports       | Module-level `/** ... */` block                                                                      |

**Style:**

```ts
// ✅ Exported API function
/**
 * Authenticates a user and returns a token with user info.
 * @param data - Login credentials (email + password)
 * @returns Auth response containing token and user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> { ... }

// ✅ Exported hook
/**
 * Mutation hook for user login. On success, persists token via auth store.
 * @returns TanStack Query mutation object
 */
export function useLoginMutation() { ... }

// ❌ Skip — internal helper, obvious purpose
function buildHeaders(token: string) { ... }
```

| Type             | Convention               | Example                               |
| ---------------- | ------------------------ | ------------------------------------- |
| Component files  | kebab-case               | `user-avatar.tsx` or `UserAvatar.tsx` |
| Components       | PascalCase               | `UserAvatar`                          |
| Hooks            | camelCase, `use` prefix  | `useUserProfile`                      |
| Stores           | camelCase, `useXxxStore` | `useAuthStore`                        |
| Query hooks      | camelCase, `useXxxQuery` | `useUserQuery`                        |
| Constants        | UPPER_SNAKE_CASE         | `MAX_FILE_SIZE`                       |
| Types/Interfaces | PascalCase               | `UserProfile`, `ApiResponse`          |
| CSS classes      | kebab-case               | `user-avatar`, `avatar-image--large`  |

## Formatting (Prettier)

- No semicolons
- Double quotes
- 100 character print width
- 2-space indentation
- Trailing commas (ES5)

## Forbidden

- `export default` — use named exports only
- `any` type in any form
- `console.log` in production code (use logger)
- Inline styles (use CSS Modules)
- Barrel files re-exporting entire directories
- Empty `catch {}` blocks
- Direct imports of `zustand`, `axios`, or `antd` (use `@/shared/*` wrappers)

## Testing

- Co-locate tests: `authStore.ts` → `authStore.test.ts`
- Use Vitest globals (`describe`, `it`, `expect` — no imports needed)
- Use `@testing-library/react` for component tests
- Handle all component states: loading → error → empty → success

## Error Handling

```ts
// ✅ Correct pattern
try {
  const result = await apiInstance.get("/users")
  return result
} catch (error) {
  if (error instanceof ApiError) {
    // Business error — user-friendly message
    toast.error(error.message)
  } else {
    // Unexpected error — log and generic message
    logger.error("Failed to fetch users", { error })
    toast.error("操作失败，请稍后重试")
  }
  throw error // Always propagate
}
```
