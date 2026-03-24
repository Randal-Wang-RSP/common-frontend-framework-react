# GitHub Copilot — Workspace Instructions

## Context

React template using **Feature-Sliced Design (FSD)** architecture, TypeScript strict mode.

**Tech stack:** React 18 · Vite · TypeScript · CSS Modules · Ant Design · Zustand · TanStack Query · React Router v7 · Vitest

> Architecture deep-dive: [`docs/architecture.md`](../docs/architecture.md)
> Naming & import conventions: [`docs/conventions.md`](../docs/conventions.md)
> Layer-specific guides: [`docs/layers/`](../docs/layers/)

---

## Architecture

Layers import **downward only** — never upward, never sideways across the same layer:

```
app → pages → widgets → features → entities → shared
```

Each layer's responsibility:
- **`app/`** — providers, router, global styles. No slices.
- **`pages/`** — one slice per route. Compose widgets/features.
- **`widgets/`** — large self-contained UI blocks.
- **`features/`** — user interactions and business actions.
- **`entities/`** — domain models, data types, display components. No user interactions.
- **`shared/`** — UI primitives, HTTP client, utilities. Zero business domain knowledge.

Each slice structure:

```
sliceName/
  ui/        # React components
  model/     # Zustand stores, hooks, types
  api/       # React Query hooks, raw API calls
  lib/       # slice-local utilities
  config/    # slice-local constants
  index.ts   # public barrel — only export what consumers need
```

---

## Never Do

```ts
// ❌ Import across same-layer slice boundary
import { getProfile } from "@/features/profile"     // inside features/auth

// ❌ Bypass the barrel — import from internal files directly
import { LoginForm } from "@/features/auth/ui/LoginForm"

// ❌ Cross-layer import using relative path
import { Button } from "../../shared/ui"

// ❌ Default export
export default function UserCard() { ... }

// ❌ any type
const data: any = response.data

// ❌ Business domain concepts in shared/
// shared/lib/getUserFullName.ts  ← domain logic does not belong here
```

---

## Patterns

**Cross-layer import — always use `@/` alias:**

```ts
// ✅
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"

// ✅ Within the same slice — relative is fine
import { loginSchema } from "../lib/validation"
```

**Cross-entity reference — use `@x` pattern:**

```ts
// src/entities/user/@x/order.ts — re-export only what order needs
export type { UserId } from "../model"

// inside entities/order:
import type { UserId } from "@/entities/user/@x/order"
```

**Named exports only:**

```ts
// ✅
export function UserCard({ user }: UserCardProps): JSX.Element { ... }

// ❌
export default function UserCard() { ... }
```

**Explicit return types on exported functions:**

```ts
// ✅
export function formatDate(date: Date): string { ... }

// ❌
export function formatDate(date: Date) { ... }
```

**Import order:**

```ts
// 1. External packages
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

// 2. Internal @/ imports
import { Button } from "@/shared/ui"

// 3. Relative imports
import { loginSchema } from "../lib/validation"
import styles from "./LoginForm.module.css"
```

**Naming:**
- Components / types / interfaces → `PascalCase`
- Functions / variables / hooks → `camelCase`
- Files and folders → `kebab-case`
- React hooks → `useXxxStore`, `useXxxQuery`

**Prettier (auto-applied on commit):** no semicolons · double quotes · 100-char width · 2-space indent · ES5 trailing commas

**Testing:** co-locate `authStore.ts` → `authStore.test.ts` · Vitest globals (`describe`, `it`, `expect`) need no imports

**Commits:** `feat(auth): add JWT refresh logic` · `fix(cart): prevent duplicate items`  
Types: `feat | fix | docs | style | refactor | test | chore | perf | revert`

**Env vars:** prefix client-side vars with `VITE_`

---

## Workflow

> Detailed layer conventions auto-load via `.github/instructions/` when editing files in that layer.
> Complex multi-step tasks: use `.github/prompts/` prompt files.

**Adding a new feature slice:**
1. Create `src/features/<name>/` with only the segments you need
2. Build in order: `model/` → `api/` → `ui/`
3. Export public API via `index.ts` only — never expose internals
4. If two features need to share something, move it to `entities/` or `shared/`

**Adding a new entity:**
1. Create `src/entities/<name>/` with `model/` (types) and `ui/` (display components)
2. No side effects, no API calls, no user interactions in entities
3. For cross-entity type sharing, create `src/entities/<name>/@x/<consumer>.ts`

**Adding a new page:**
1. Create `src/pages/<route-name>/ui/<PageName>.tsx`
2. Register the route in `src/app/router/` — not inside the page file
3. Pages only compose — no business logic, no direct API calls

**Touching `shared/`:**
- Verify the concept has zero domain knowledge before adding
- If it involves any business entity (user, order, etc.) → belongs in `entities/` or `features/`
- Import from `@/shared/store` (not `zustand`), `@/shared/api` (not `axios`) directly
