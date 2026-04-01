---
name: fsd-architecture
description: >
  Use when planning FSD-compliant feature implementation, reviewing FSD
  boundary violations, deciding which layer a new slice belongs to,
  understanding the @x cross-reference pattern between entities, or
  checking import direction rules. Load this skill when the task involves
  creating new slices, reviewing imports across layers, or diagnosing
  FSD boundary violations.
---

# FSD Architecture — Deep Reference

## Layer Hierarchy and Import Direction

```
app         ← can import: pages, widgets, features, entities, shared
pages       ← can import: widgets, features, entities, shared
widgets     ← can import: features, entities, shared
features    ← can import: entities, shared
entities    ← can import: shared
shared      ← cannot import any other layer
```

**The rule in one sentence:** Code may only reach downward, never upward or sideways.

### Same-Layer Isolation

A slice on layer X **must not** import from another slice on layer X.

```ts
// FORBIDDEN inside features/auth — imports a sibling feature
import { cartStore } from "@/features/cart"

// FORBIDDEN inside entities/order — imports a sibling entity
import { UserAvatar } from "@/entities/user"

// ALLOWED via @x pattern (see below)
import { UserAvatar } from "@/entities/user/@x/order"
```

---

## Layer Decision Guide

When deciding which layer a new piece of code belongs to, use this decision tree:

```
Is it framework-level infrastructure with zero business logic?
  → shared

Is it a business domain object (noun: user, product, order)?
  → entities

Is it a user-triggered action or interaction (verb: login, search, add-to-cart)?
  → features

Is it a composed UI block with its own layout (header, sidebar, dashboard panel)?
  → widgets

Is it a full page rendered at a route?
  → pages

Is it global setup (providers, router, root component)?
  → app
```

### Entities vs Features — The Critical Distinction

|              | entities                                     | features                                     |
| ------------ | -------------------------------------------- | -------------------------------------------- |
| Represents   | What things ARE                              | What users DO                                |
| Contains     | Types, display components, read-only stores  | Mutations, actions, forms, API calls         |
| Side effects | None                                         | Yes (API mutations, state transitions)       |
| Example      | `UserAvatar`, `UserType`, `userStore (read)` | `LoginForm`, `useLoginMutation`, `addToCart` |

**Test:** If removing the code would break how data is _displayed_, it's an entity. If removing it would break how users _interact_, it's a feature.

---

## Slice Structure

Every slice (except `app` and `shared`) follows this directory structure. Only create segments that are needed:

```
sliceName/
  ui/         # React components — named exports only, no logic beyond rendering
  model/      # TypeScript types, Zustand stores, hooks
  api/        # TanStack Query hooks and raw API calls
  lib/        # Utilities local to this slice (not exported outside)
  config/     # Constants local to this slice
  index.ts    # Public API barrel — only this file is imported by outsiders
```

### The `index.ts` Barrel Rule

- **Everything exported from `index.ts`** is part of the public API of the slice
- **Nothing inside the slice directories** (e.g., `ui/LoginForm.tsx`) is ever imported directly from outside
- **Within the same slice**, relative imports are fine (`../api`, `./useStore`)

```ts
// ✅ Correct — cross-slice import through barrel
import { LoginForm, useAuthStore } from "@/features/auth"

// ❌ Forbidden — bypasses barrel, couples to internals
import { LoginForm } from "@/features/auth/ui/LoginForm"
```

---

## The `@x` Cross-Reference Pattern

### Problem

FSD prohibits same-layer imports. But sometimes `entities/order` needs to display a `UserAvatar` from `entities/user`. How?

### Solution: Explicit Cross-Reference Files

The entity being depended upon creates a dedicated cross-reference file that re-exports only what the depending entity needs:

```
src/entities/user/
  @x/
    order.ts    ← what the order entity is allowed to use from user
```

```ts
// src/entities/user/@x/order.ts
export type { UserId, UserName } from "../model/types"
export { UserAvatar } from "../ui/UserAvatar"
```

Then `entities/order` imports from the cross-reference file:

```ts
// src/entities/order/ui/OrderCard.tsx
import { UserAvatar } from "@/entities/user/@x/order"
```

### When to Use `@x`

- When entity A needs to **display** content from entity B (e.g., an order card showing a user avatar)
- When entity A needs to **type-check** against a type from entity B (e.g., `order.userId: UserId`)

### When NOT to Use `@x`

- When the dependency is behavioral (state management, mutations) → move to `features`
- When entity A needs to **import from** entity B extensively → consider whether A and B should be merged

### `@x` File Naming Convention

The file name inside `@x/` is the **name of the consuming slice**:

```
entities/user/@x/order.ts      ← for order entity
entities/user/@x/product.ts    ← for product entity
```

This makes it immediately clear which slices have authorized access to what.

---

## `shared` Layer Constraints

`shared` has **zero business domain knowledge**. It must not contain:

- References to `User`, `Order`, `Product` or any domain concept
- Feature-specific configurations
- Business-rule logic

What `shared` CAN contain:

- `api/` — Axios instance, interceptors, base request helpers
- `config/` — Typed environment variable accessors (`VITE_API_URL`, etc.)
- `lib/` — Generic utility functions (date formatting, string helpers, array utilities)
- `store/` — Zustand `create` re-export (`export { create } from "zustand"`)
- `ui/` — Generic UI primitives wrapping Ant Design (Button, Input, Modal — unstyled for domain)

---

## Import Alias Rules

| Context                                | Pattern             | Example                                                  |
| -------------------------------------- | ------------------- | -------------------------------------------------------- |
| Cross-slice (different slice or layer) | `@/` alias required | `import { Button } from "@/shared/ui"`                   |
| Within same slice, same segment        | Relative `./`       | `import { schema } from "./validation"`                  |
| Within same slice, different segment   | Relative `../`      | `import { useStore } from "../model"`                    |
| Cross-entity reference                 | `@x` file           | `import type { UserId } from "@/entities/user/@x/order"` |

**Never** use relative paths to reach outside the current slice.

---

## FSD Violation Checklist

When reviewing code for FSD compliance, check each of these:

1. **Import direction:** Does any import go from a lower layer to a higher layer?
   - e.g., `shared` importing from `features` ← VIOLATION
   - e.g., `entities` importing from `pages` ← VIOLATION

2. **Same-layer isolation:** Does any slice import from a sibling slice on the same layer?
   - e.g., `features/auth` importing from `features/cart` ← VIOLATION
   - e.g., `entities/user` importing from `entities/order` directly ← VIOLATION

3. **Barrel bypass:** Does any code import from an internal path of another slice?
   - e.g., `import from "@/features/auth/ui/LoginForm"` ← VIOLATION

4. **Alias vs relative:** Does any import use relative paths to reach outside its own slice?
   - e.g., `import from "../../../shared/ui"` ← VIOLATION

5. **`shared` domain contamination:** Does `shared` contain any domain-specific type, concept, or logic?
   - e.g., `shared/lib/userHelpers.ts` ← VIOLATION (user is a domain concept)

6. **`@x` usage:** When one entity references another, is the `@x` pattern used correctly?
   - Is the `@x` file in the **exporting** entity's directory? ✅
   - Is the import path `@/entities/<name>/@x/<consumer>`? ✅

---

## Planning: FSD Task Order

When planning an implementation, always sequence tasks in this order to respect layer dependencies:

```
1. shared (if new utilities or config needed)
2. entities (domain models and display components)
3. features (user interactions that depend on entities)
4. widgets (composed blocks that depend on features and entities)
5. pages (route components that depend on widgets and features)
6. app (router registration, provider updates)
```

Never implement a higher layer before the lower layers it depends on exist.
