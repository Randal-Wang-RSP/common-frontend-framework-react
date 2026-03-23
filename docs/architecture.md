# Architecture

## Overview

This project uses [Feature-Sliced Design (FSD)](https://feature-sliced.design/) — a methodology for organizing frontend code into **layers**, **slices**, and **segments** with strict unidirectional import rules. The goal is to make the codebase scale predictably: every piece of code has exactly one place it belongs, and the allowed dependency directions are enforced by tooling.

---

## Layer Diagram

```
app
 └── pages
      └── widgets
           └── features
                └── entities
                     └── shared
```

**Import rule:** a module may only import from layers that are strictly _below_ it in the hierarchy. `pages` can import from `widgets`, `features`, `entities`, and `shared` — but never from `app`. `shared` cannot import from any other layer.

---

## The Six Layers

### `app/`

Application bootstrapping. Contains providers (React Query, router, theme), global styles, and the top-level entry point. This layer has **no slices** — everything here is global by definition.

### `pages/`

Route-level components. One slice per route or page (e.g., `pages/home/`, `pages/user-profile/`). Pages compose widgets and features; they contain minimal logic of their own.

### `widgets/`

Self-contained UI blocks that are larger than a single feature — for example, a page header, sidebar, or dashboard panel. Widgets compose features and entities and own their own layout.

### `features/`

User interactions and business actions: login, search, applying filters, adding to cart. Each feature slice typically has a `model/` (state, hooks), `ui/` (forms, buttons), and `api/` (mutation/query hooks).

### `entities/`

Business domain objects: `user`, `order`, `product`. Entities are purely data and model focused — they expose types, stores, and display components but do not own user interactions. See [Cross-Reference Pattern](#the-x-cross-reference-pattern) for how entities reference each other.

### `shared/`

Reusable infrastructure with **zero business domain knowledge**: UI primitives (Button, Input), the HTTP client instance, generic utilities, and constants. Nothing in `shared` knows about users, orders, or any other domain concept.

```
shared/
  api/      # Axios instance and interceptors
  config/   # Typed environment variable accessors
  lib/      # Generic utility functions
  store/    # Zustand re-exports
  ui/       # Reusable UI primitives (wrapping Ant Design)
```

---

## Slice Structure

Inside every layer except `app` and `shared`, code is organized into **slices** by business domain. Each slice is a directory containing one or more **segments**:

```
features/
  auth/
    ui/        # React components (LoginForm.tsx, etc.)
    model/     # Zustand stores, hooks, TypeScript types
    api/       # React Query hooks and raw API calls
    lib/       # Slice-specific utilities
    config/    # Slice-specific constants
    index.ts   # Public API barrel
```

### Public API

Each segment exposes an `index.ts` barrel file. Code outside the slice **must** import from the barrel — never from internal files directly.

```ts
// Correct
import { LoginForm } from "@/features/auth"

// Wrong — imports an internal file
import { LoginForm } from "@/features/auth/ui/LoginForm"
```

This makes it safe to refactor internals without breaking consumers.

---

## The @x Cross-Reference Pattern

Entities live on the same layer, so they cannot import each other directly (that would be a same-layer import, which FSD forbids). When entity `A` needs to reference a type or component from entity `B`, the pattern is:

1. Create `src/entities/b/@x/a.ts`
2. In that file, re-export only what `A` needs from `B`
3. Entity `A` imports from `@/entities/b/@x/a`

```ts
// src/entities/user/@x/order.ts
// Re-exports only what the `order` entity is allowed to use from `user`
export type { UserId } from "../model/types"
```

This makes cross-entity dependencies **explicit, minimal, and auditable**. See `docs/layers/entities.md` for a full walkthrough.

---

## Why FSD

FSD scales well because the layer/slice/segment structure keeps related code co-located while the unidirectional import rule prevents circular dependencies from ever forming. Separation of concerns is enforced at the tooling level (ESLint `boundaries` plugin), not just by convention. Most importantly, it eliminates the "where does this code go?" question — there is always a single correct answer.
