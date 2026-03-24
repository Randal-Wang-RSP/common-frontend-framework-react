---
applyTo: "src/features/**"
---

# Layer: `features`

User interactions and business actions. Each slice = one cohesive capability.

Full reference: [`docs/layers/features.md`](../../docs/layers/features.md)

## Slice Structure

```
src/features/<name>/
  api/       # React Query mutations/queries + raw API calls
  model/     # Zustand store, derived state, TypeScript types
  ui/        # React components specific to this feature
  index.ts   # public API barrel
```

Only create segments you need. A simple feature may only need `ui/` and `model/`.

## Import Rules

```ts
// ✅ Features may import from
import { User } from "@/entities/user"
import { apiInstance } from "@/shared/api"

// ❌ Never import from another feature
import { getProfile } from "@/features/profile"  // inside features/auth

// ❌ Never import from upper layers
import { HomePage } from "@/pages/home"
```

## State

Use Zustand for feature-local state. Import from `@/shared/store`, not directly from `zustand`:

```ts
// ✅
import { create, devtools } from "@/shared/store"

// ❌
import { create } from "zustand"
```

## Public API Barrel

Export only what consumers need. Internal helpers stay private:

```ts
// src/features/auth/index.ts
export { LoginForm } from "./ui"
export { useAuthStore } from "./model"
export type { AuthUser } from "./model"
```

## Never Do

```ts
// ❌ Export implementation internals
export { validatePasswordStrength } from "./lib/validation"  // keep private

// ❌ Put API calls directly in a component
export function LoginForm() {
  const res = await axios.post("/auth/login", data)  // use useQuery/useMutation
}

// ❌ Import React Query or Zustand from packages directly
import { useQuery } from "@tanstack/react-query"  // fine here, but store → @/shared/store
```
