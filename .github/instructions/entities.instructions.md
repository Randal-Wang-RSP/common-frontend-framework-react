---
applyTo: "src/entities/**"
---

# Layer: `entities`

Business domain objects — the **nouns** of the application. Entities model what things *are*; features model what users *do* with them.

Full reference: [`docs/layers/entities.md`](../../docs/layers/entities.md)

## Slice Structure

```
src/entities/<name>/
  model/     # TypeScript interfaces, types, pure selector/helper functions
  ui/        # Display components (avatars, cards, badges)
  @x/        # Cross-entity re-export files (see below)
  index.ts   # public API barrel
```

## Import Rules

```ts
// ✅ Entities may only import from shared
import { apiInstance } from "@/shared/api"

// ❌ Never import from features, widgets, pages, or app
import { useAuthStore } from "@/features/auth"

// ❌ Never import directly from another entity
import { User } from "@/entities/user"  // inside entities/order — use @x instead
```

## Cross-Entity Reference — `@x` Pattern

When one entity needs a type or component from another entity, use an explicit re-export file instead of a direct import:

```ts
// 1. Create src/entities/user/@x/order.ts
export type { User, UserId } from "../model"
export { UserAvatar } from "../ui"

// 2. Inside entities/order — import from the @x file
import type { UserId } from "@/entities/user/@x/order"
```

This makes cross-entity dependencies explicit and auditable.

## Never Do

```ts
// ❌ Side effects or API calls in an entity
export function useUserStore() {
  return useQuery({ queryFn: () => apiInstance.get("/users") })  // belongs in features/
}

// ❌ User interaction logic in an entity
export function UserCard() {
  const [editing, setEditing] = useState(false)  // interaction → move to features/
  return <button onClick={() => setEditing(true)}>Edit</button>
}

// ❌ Direct same-layer import
import { Order } from "@/entities/order"  // inside entities/user — use @x
```
