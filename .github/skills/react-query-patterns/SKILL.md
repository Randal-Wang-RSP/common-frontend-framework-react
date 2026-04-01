---
name: react-query-patterns
description: >
  Use when writing or reviewing TanStack Query hooks in this project.
  Covers query hook structure, mutation hook structure, query key
  conventions, and how to use the shared Axios instance from @/shared/api.
  Load when implementer is creating api/ segments for features or entities.
---

# React Query (TanStack Query) Patterns

## Critical Rule

**Never import `axios` directly.** Always use the shared instance from `@/shared/api`:

```ts
// ❌ Forbidden
import axios from "axios"
const res = await axios.get("/users")

// ✅ Correct
import { apiInstance } from "@/shared/api"
const res = await apiInstance.get("/users")
```

---

## Query Key Convention

Query keys must be **centralized** in a `config/query-keys.ts` file within the slice.
This prevents key collisions and makes invalidation predictable.

```ts
// src/features/auth/config/query-keys.ts
export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  profileById: (id: string) => [...authKeys.profile(), id] as const,
}
```

Use in hooks:

```ts
queryKey: authKeys.profile()
queryKey: authKeys.profileById(userId)
```

**Naming pattern:** `<sliceName>Keys` (camelCase slice name + `Keys`)

---

## Query Hook Pattern

Query hooks fetch **read** data. They belong in `api/` segment of the slice.

```ts
// src/entities/user/api/useUserQuery.ts
import { useQuery } from "@tanstack/react-query"
import { apiInstance } from "@/shared/api"
import type { User } from "../model/types"
import { userKeys } from "../config/query-keys"

export function useUserQuery(userId: string): ReturnType<typeof useQuery<User>> {
  return useQuery({
    queryKey: userKeys.byId(userId),
    queryFn: async () => {
      const { data } = await apiInstance.get<User>(`/users/${userId}`)
      return data
    },
    enabled: Boolean(userId),
  })
}
```

**Rules:**

- Hook name: `use<Resource>Query` (singular resource) or `use<Resource>ListQuery` (collection)
- Always provide explicit `queryFn` return type via the generic on `useQuery<T>`
- `enabled` guard for optional/async params — never pass `undefined` to the API
- Explicit return type annotation on the exported function

---

## Mutation Hook Pattern

Mutation hooks trigger **write** operations. They belong in `api/` of a `features` slice
(never in `entities` — entities are read-only).

```ts
// src/features/auth/api/useLoginMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiInstance } from "@/shared/api"
import { authKeys } from "../config/query-keys"
import type { LoginPayload, AuthResponse } from "../model/types"

export function useLoginMutation(): ReturnType<
  typeof useMutation<AuthResponse, Error, LoginPayload>
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await apiInstance.post<AuthResponse>("/auth/login", payload)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}
```

**Rules:**

- Hook name: `use<Action>Mutation` (imperative action verb)
- Type params on `useMutation<TData, TError, TVariables>` — always explicit
- Use `queryClient.invalidateQueries` in `onSuccess` to keep server state fresh
- Mutation hooks live in `features` only — never in `entities`

---

## Raw API Function Pattern

For complex API calls or reusable request functions, extract to a plain function
alongside the hook (same `api/` segment):

```ts
// src/features/auth/api/auth-api.ts
import { apiInstance } from "@/shared/api"
import type { LoginPayload, AuthResponse, RefreshResponse } from "../model/types"

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiInstance.post<AuthResponse>("/auth/login", payload)
  return data
}

export async function refreshTokenRequest(token: string): Promise<RefreshResponse> {
  const { data } = await apiInstance.post<RefreshResponse>("/auth/refresh", { token })
  return data
}
```

Then use in the mutation hook:

```ts
import { loginRequest } from "./auth-api"

mutationFn: (payload) => loginRequest(payload),
```

---

## Barrel Export

Export query/mutation hooks from the slice's `index.ts`:

```ts
// src/features/auth/index.ts
export { useLoginMutation } from "./api/useLoginMutation"
export { useUserQuery } from "./api/useUserQuery"
```

Export query keys only if other slices need them (rare):

```ts
export { authKeys } from "./config/query-keys"
```

---

## File Structure in `api/` Segment

```
features/auth/api/
  auth-api.ts           # raw request functions (optional, for complex APIs)
  useLoginMutation.ts   # mutation hook
  useLogoutMutation.ts  # mutation hook
  index.ts              # re-exports for the api/ segment's internal barrel
```

The `api/` segment has its own `index.ts` for segment-level imports within the slice:

```ts
// src/features/auth/api/index.ts — used only by other segments within auth
export { useLoginMutation } from "./useLoginMutation"
export { useLogoutMutation } from "./useLogoutMutation"
```

---

## Anti-Patterns

```ts
// ❌ mutation hook in entities layer
// entities/user/api/useUpdateUserMutation.ts  ← mutations belong in features

// ❌ inline query key string
queryKey: ["users", userId]  // ← use centralized key factory

// ❌ missing enabled guard
queryKey: userKeys.byId(userId),
queryFn: () => fetchUser(userId),
// userId could be undefined → always add: enabled: Boolean(userId)

// ❌ any in generic
useQuery<any>({ ... })  // ← always specify the response type

// ❌ direct axios import
import axios from "axios"  // ← use import { apiInstance } from "@/shared/api"
```
