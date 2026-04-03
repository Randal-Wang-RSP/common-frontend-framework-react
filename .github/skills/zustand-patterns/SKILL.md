---
name: zustand-patterns
description: "Zustand store creation patterns using @/shared/store wrapper: store structure, devtools, persist middleware, selectors, naming conventions."
---

# Zustand Patterns

## Mandatory Import

```ts
// ✅ Always import from shared wrapper
import { create, devtools } from "@/shared/store"

// ❌ FORBIDDEN — direct zustand import
import { create } from "zustand"
import { devtools } from "zustand/middleware"
```

The `@/shared/store` wrapper re-exports: `create`, `devtools`, `StateCreator`, `StoreApi`, `UseBoundStore`.

## Store File Structure

Store files live in `<slice>/model/use<SliceName>Store.ts`:

```ts
// src/features/auth/model/useAuthStore.ts
import { create, devtools } from "@/shared/store"
import type { AuthState } from "./types"

interface AuthActions {
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
}

const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      // State
      token: null,
      user: null,
      isAuthenticated: false,

      // Actions
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }, false, "setAuth"),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }, false, "clearAuth"),
    }),
    { name: "AuthStore" }
  )
)

export { useAuthStore }
```

## Naming Rules

| Item          | Pattern                  | Example                    |
| ------------- | ------------------------ | -------------------------- |
| Store hook    | `use<SliceName>Store`    | `useAuthStore`             |
| Store file    | `use<SliceName>Store.ts` | `useAuthStore.ts`          |
| Types file    | `types.ts`               | `types.ts`                 |
| devtools name | `<SliceName>Store`       | `"AuthStore"`              |
| Action labels | camelCase verb           | `"setAuth"`, `"clearAuth"` |

## State vs Actions Separation

Separate state shape from actions in type definitions:

```ts
// types.ts
interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}
```

Actions are defined alongside the store, not exported as a separate type (keeps the store as single source of truth).

## devtools

**Always wrap with `devtools`** for Redux DevTools visibility:

```ts
create<State & Actions>()(
  devtools(
    (set, get) => ({ ... }),
    { name: "StoreName" }
  )
)
```

- Pass action name as 3rd arg to `set()`: `set(newState, false, "actionName")`
- The `false` is the `replace` flag (default: merge)

## localStorage Persistence (Manual)

For simple token/user persistence, use manual localStorage (not zustand/persist middleware):

```ts
const AUTH_TOKEN_KEY = "auth_token"
const AUTH_USER_KEY = "auth_user"

const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      // Initialize from localStorage
      token: localStorage.getItem(AUTH_TOKEN_KEY),
      user: JSON.parse(localStorage.getItem(AUTH_USER_KEY) ?? "null"),
      isAuthenticated: !!localStorage.getItem(AUTH_TOKEN_KEY),

      setAuth: (token, user) => {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
        set({ token, user, isAuthenticated: true }, false, "setAuth")
      },

      clearAuth: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        set({ token: null, user: null, isAuthenticated: false }, false, "clearAuth")
      },
    }),
    { name: "AuthStore" }
  )
)
```

## Selectors

Use inline selectors for simple reads, extracted selectors for computed values:

```ts
// ✅ Inline — simple property access
const token = useAuthStore((s) => s.token)
const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

// ✅ Extracted — computed / multi-property
const selectUserDisplayName = (s: AuthState) => s.user?.name ?? "Guest"
const displayName = useAuthStore(selectUserDisplayName)

// ❌ Avoid — selecting entire store (causes unnecessary re-renders)
const store = useAuthStore()
```

## Accessing Store Outside React

```ts
// ✅ Use getState() for non-React contexts (interceptors, utility functions)
const token = useAuthStore.getState().token
useAuthStore.getState().clearAuth()
```

## Rules

- One store per slice (don't create multiple stores in the same slice)
- Keep stores focused — a store manages one domain concept
- Initialize all state properties (no `undefined` initial values)
- Named exports only: `export { useMyStore }` (no default export)
- Test stores without React: use `getState()` / `setState()` directly
