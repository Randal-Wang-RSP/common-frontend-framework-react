---
description: >
  Use when writing, reviewing, or debugging Zustand stores in this project.
  Covers store file structure, devtools setup, typed state/actions pattern,
  slice composition, testing stores, and how to import from @/shared/store
  instead of zustand directly.
---

# Zustand Patterns

This skill covers the project-specific conventions for writing Zustand stores inside `features/<name>/model/`.

Full Zustand docs: https://zustand.docs.pmnd.rs

---

## Import from `@/shared/store`

Never import from `zustand` directly. The project re-exports Zustand from `@/shared/store` to centralise middleware defaults:

```ts
// ✅
import { create } from "@/shared/store"

// ❌
import { create } from "zustand"
```

---

## Store File Structure

One store per feature. File name: `use<FeatureName>Store.ts`. Place in `features/<name>/model/`.

```ts
// src/features/auth/model/useAuthStore.ts
import { create } from "@/shared/store"
import type { AuthUser } from "./types"

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isLoading: false,
}

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}))
```

**Conventions:**
- Split the type into `State` + `Actions` interfaces, compose them as `Store`
- Extract `initialState` as a const — needed for `reset()` and tests
- Actions are plain functions using `set`, not async — async logic belongs in `api/`

---

## Devtools (optional but recommended)

Wrap with `devtools` for Redux DevTools support in development:

```ts
import { create, devtools } from "@/shared/store"

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user }, false, "auth/setUser"),
      reset: () => set(initialState, false, "auth/reset"),
    }),
    { name: "AuthStore" }
  )
)
```

The third argument to `set` is the action name shown in DevTools — use `"sliceName/actionName"` convention.

---

## Accessing State Outside React

Use `getState()` for imperative access (e.g., in API callbacks):

```ts
const { setUser } = useAuthStore.getState()
setUser(responseData.user)
```

---

## Derived / Computed Values

Prefer selectors over storing derived values:

```ts
// ✅ derive in a selector
const isAuthenticated = useAuthStore((state) => state.user !== null)

// ❌ don't store derived values
const isAuthenticated = useAuthStore((state) => state.isAuthenticated) // redundant field
```

For expensive derivations, use `useShallow` to prevent unnecessary re-renders:

```ts
import { useShallow } from "@/shared/store"

const { user, isLoading } = useAuthStore(
  useShallow((state) => ({ user: state.user, isLoading: state.isLoading }))
)
```

---

## Async Actions

Async logic (API calls) does **not** belong in the store. Keep stores synchronous. Use React Query mutations that call store actions on success:

```ts
// ✅ — store is synchronous, React Query handles async
const { mutate: login } = useMutation({
  mutationFn: (credentials: LoginCredentials) =>
    apiInstance.post<AuthUser>("/auth/login", credentials),
  onSuccess: (user) => useAuthStore.getState().setUser(user),
  onError: () => useAuthStore.getState().setUser(null),
})

// ❌ — async inside the store
const useAuthStore = create<AuthStore>()((set) => ({
  login: async (credentials) => {
    const user = await apiInstance.post("/auth/login", credentials)
    set({ user })
  },
}))
```

---

## Testing Stores

Reset state before each test using `setState` on the initial state:

```ts
// src/features/auth/model/useAuthStore.test.ts
import { useAuthStore } from "./useAuthStore"
import { initialState } from "./useAuthStore"  // export initialState if needed in tests

beforeEach(() => {
  useAuthStore.setState(initialState)
})

it("setUser updates user state", () => {
  const user = { id: "1", name: "Alice" }
  useAuthStore.getState().setUser(user)
  expect(useAuthStore.getState().user).toEqual(user)
})

it("reset clears user", () => {
  useAuthStore.setState({ user: { id: "1", name: "Alice" } })
  useAuthStore.getState().reset()
  expect(useAuthStore.getState().user).toBeNull()
})
```

Export `initialState` from the store file so tests can reset cleanly without re-declaring it.

---

## Public API Export

Export the store hook from the slice barrel. Do not export internal types unless consumers need them:

```ts
// src/features/auth/model/index.ts
export { useAuthStore } from "./useAuthStore"
export type { AuthUser } from "./types"
// do NOT export initialState, AuthStore type — these are internals
```
