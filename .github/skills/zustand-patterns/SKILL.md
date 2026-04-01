---
name: zustand-patterns
description: >
  Use when writing or reviewing Zustand stores in this project.
  Covers store structure, devtools setup, slice patterns, and how to
  import from @/shared/store instead of zustand directly. Load when
  implementer is creating model/ segments for features or entities.
---

# Zustand Patterns

## Critical Rule

**Never import from `zustand` directly.** Always use the re-exports from `@/shared/store`:

```ts
// ❌ Forbidden
import { create } from "zustand"
import { devtools } from "zustand/middleware"

// ✅ Correct
import { create, devtools } from "@/shared/store"
import type { StateCreator } from "@/shared/store"
```

---

## Store File Location and Naming

| Layer      | File path                                 | Export name      |
| ---------- | ----------------------------------------- | ---------------- |
| `features` | `features/<name>/model/use<Name>Store.ts` | `use<Name>Store` |
| `entities` | `entities/<name>/model/use<Name>Store.ts` | `use<Name>Store` |

Naming convention: hook name matches `use` + PascalCase slice name + `Store`.

---

## Entity Store Pattern

Entity stores are **read-only** from the outside — they expose state and
selectors, not mutation actions. Actions that trigger side effects belong
in `features`, not `entities`.

```ts
// src/entities/counter/model/useCounterStore.ts
import { create, devtools } from "@/shared/store"

interface CounterState {
  count: number
  increment: () => void
  reset: () => void
}

export const useCounterStore = create<CounterState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, "counter/increment"),
      reset: () => set({ count: 0 }, false, "counter/reset"),
    }),
    { name: "counter" }
  )
)
```

**Rules for entity stores:**

- State shape defined by a TypeScript `interface` (not `type`) in the same file or `types.ts`
- `devtools` middleware always wraps the store creator for DevTools support
- Action names follow `"<sliceName>/<actionName>"` pattern (third arg to `set`)
- `false` as second arg to `set` = replace, not merge (use for actions that replace state)

---

## Feature Store Pattern

Feature stores own **user interactions and business mutations**. They may
call API functions or coordinate multiple state changes.

```ts
// src/features/auth/model/useAuthStore.ts
import { create, devtools } from "@/shared/store"

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      token: null,
      isAuthenticated: false,
      setToken: (token) => set({ token, isAuthenticated: true }, false, "auth/setToken"),
      clearAuth: () => set({ token: null, isAuthenticated: false }, false, "auth/clearAuth"),
    }),
    { name: "auth" }
  )
)
```

---

## Types File Pattern

When the state interface is non-trivial (3+ fields or shared across segments),
extract it to a separate `types.ts` file:

```ts
// src/features/auth/model/types.ts
export interface AuthState {
  token: string | null
  isAuthenticated: boolean
  userId: string | null
}
```

```ts
// src/features/auth/model/useAuthStore.ts
import { create, devtools } from "@/shared/store"
import type { AuthState } from "./types"

interface AuthStore extends AuthState {
  setToken: (token: string, userId: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      token: null,
      isAuthenticated: false,
      userId: null,
      setToken: (token, userId) =>
        set({ token, isAuthenticated: true, userId }, false, "auth/setToken"),
      clearAuth: () =>
        set({ token: null, isAuthenticated: false, userId: null }, false, "auth/clearAuth"),
    }),
    { name: "auth" }
  )
)
```

---

## Barrel Export

Always re-export the store (and types if in a separate file) from the slice's `index.ts`:

```ts
// src/entities/counter/index.ts
export { useCounterStore } from "./model/useCounterStore"
export type { CounterState } from "./model/types"
```

---

## Selector Pattern

For derived values, define selectors as simple functions — not inside the store:

```ts
// src/entities/counter/model/useCounterStore.ts (bottom of file)
export const selectCount = (state: CounterState): number => state.count
export const selectIsMax =
  (maxVal: number) =>
  (state: CounterState): boolean =>
    state.count >= maxVal
```

Use in components:

```ts
const count = useCounterStore(selectCount)
const isMax = useCounterStore(selectIsMax(100))
```

---

## Anti-Patterns

```ts
// ❌ Selector logic inline in component
const count = useCounterStore((s) => s.count + s.extra * 2) // → extract to selector

// ❌ Calling store action inside another store action without set
increment: () => { useOtherStore.getState().doSomething() } // → use features layer instead

// ❌ Storing derived state (things that can be computed from existing state)
doubleCount: 0, // ← never store derived values; use selectors

// ❌ any type in state
interface BadState { data: any } // ← use proper types
```
