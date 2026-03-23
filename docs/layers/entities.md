# Layer: `entities`

## Purpose

The `entities` layer contains business domain objects — the nouns of
the application. Entities model what things _are_; features model what
users _do_ with them.

## Examples

- `user`
- `order`
- `product`
- `invoice`

## Structure

```
src/entities/user/
├── model/
│   ├── types.ts          # User interface/type definitions
│   └── index.ts
├── ui/
│   ├── UserAvatar.tsx
│   └── index.ts
└── index.ts
```

### Segments

| Segment  | Contents                                                           |
| -------- | ------------------------------------------------------------------ |
| `model/` | TypeScript interfaces and types; pure helper/selector functions    |
| `ui/`    | Display components that render the entity (avatars, cards, badges) |

## Key conventions

### Entities are descriptive, not imperative

Entities contain data types and display components. They do **not**
contain side effects or business actions. If something triggers a
state change or an API call, it belongs in `features/`, not `entities/`.

### Import rule

An entity may import from:

- `shared/`

An entity must **never** import from `features/`, `widgets/`, `pages/`,
or `app/`.

---

## The `@x` cross-reference pattern

### Problem

Entities live on the same FSD layer. The standard rule forbids same-layer
imports, so `entities/order` cannot import directly from
`entities/user` — even if the order display needs a user avatar.

### Solution

Use an explicit cross-reference file:

```
src/entities/user/
└── @x/
    └── order.ts          # Re-exports only what the order entity needs
```

`order.ts` re-exports the specific types or components from `user`
that `order` depends on:

```ts
// src/entities/user/@x/order.ts
export type { User } from "../model"
export { UserAvatar } from "../ui"
```

The `order` entity then imports from the cross-reference path, not
from the entity's main public API:

```ts
// src/entities/order/ui/OrderCard.tsx
import { UserAvatar } from "@/entities/user/@x/order"
```

### Rules for `@x` files

- **One file per consumer entity.** `@x/order.ts` serves only the
  `order` entity. Do not create a generic `@x/all.ts` or `@x/index.ts`.
- **Export only what the consumer needs.** Keep the surface minimal.
- **Name the file after the consumer,** not the provider. The file at
  `entities/user/@x/order.ts` lists what `order` is allowed to use
  from `user`.
- This is a **convention**, not ESLint-enforced. Discipline is required.

### Why this matters

Cross-reference files make inter-entity dependencies explicit and
auditable. When reviewing a PR you can open `@x/order.ts` and see the
exact contract between `user` and `order`. Without this pattern,
same-layer dependencies become invisible and hard to untangle.
