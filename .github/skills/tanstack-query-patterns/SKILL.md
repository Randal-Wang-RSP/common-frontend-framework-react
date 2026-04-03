---
name: tanstack-query-patterns
description: "TanStack Query (React Query) patterns: query key factories, mutation hooks, cache strategies, error handling, integration with Zustand stores."
---

# TanStack Query Patterns

## File Organization

Query-related files live in `<slice>/api/`:

```
features/auth/
  api/
    authApi.ts         # Raw API functions (no React hooks)
    authQueries.ts     # TanStack Query hooks (useQuery, useMutation)
    index.ts           # Barrel exports
  config/
    query-keys.ts      # Query key factory (optional, for complex slices)
```

## Raw API Functions

Keep API calls as plain async functions — separate from React Query hooks:

```ts
// features/auth/api/authApi.ts
import { apiInstance } from "@/shared/api"
import type { LoginRequest, AuthResponse } from "../model/types"
import type { User } from "@/entities/user"

function login(data: LoginRequest): Promise<AuthResponse> {
  return apiInstance.post("/auth/login", data).then((res) => res.data)
}

function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiInstance.post("/auth/register", data).then((res) => res.data)
}

function getMe(): Promise<User> {
  return apiInstance.get("/auth/me").then((res) => res.data)
}

export { login, register, getMe }
```

**Why separate?** Raw functions are testable without React, reusable in non-hook contexts (interceptors, SSR), and keep hooks thin.

## Query Key Factory

For slices with multiple queries, use a key factory:

```ts
// features/auth/config/query-keys.ts
const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
}

export { authKeys }
```

For simple slices with 1-2 queries, inline keys are fine.

## Query Hooks

```ts
// features/auth/api/authQueries.ts
import { useQuery, useMutation } from "@tanstack/react-query"
import { login, register, getMe } from "./authApi"
import { useAuthStore } from "../model/useAuthStore"

function useLoginMutation() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.token, data.user)
    },
  })
}

function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.token, data.user)
    },
  })
}

function useAuthMeQuery() {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: !!token,
  })
}

export { useLoginMutation, useRegisterMutation, useAuthMeQuery }
```

## Naming Conventions

| Hook type      | Pattern                      | Example                                      |
| -------------- | ---------------------------- | -------------------------------------------- |
| Query          | `use<Resource>Query`         | `useUserQuery`, `useAuthMeQuery`             |
| Mutation       | `use<Action>Mutation`        | `useLoginMutation`, `useCreateOrderMutation` |
| Infinite query | `use<Resource>InfiniteQuery` | `useProductsInfiniteQuery`                   |

## Mutations + Zustand Integration

Access Zustand store from mutation callbacks via `getState()` (not hooks):

```ts
// ✅ Correct — getState() in callback
onSuccess: (data) => {
  useAuthStore.getState().setAuth(data.token, data.user)
}

// ❌ Wrong — using hook selector in callback
const setAuth = useAuthStore((s) => s.setAuth) // this is a React hook
```

## Error Handling

Let mutations propagate errors. Handle display in the component:

```tsx
function LoginForm() {
  const loginMutation = useLoginMutation()

  const handleSubmit = (values: LoginRequest) => {
    loginMutation.mutate(values)
  }

  return (
    <Form onFinish={handleSubmit}>
      {loginMutation.isError && (
        <Alert type="error" message={loginMutation.error?.message ?? "登录失败，请稍后重试"} />
      )}
      {/* ... form fields ... */}
      <Button loading={loginMutation.isPending} htmlType="submit">
        登录
      </Button>
    </Form>
  )
}
```

## Cache Invalidation

After mutations that change server state, invalidate related queries:

```ts
import { useQueryClient } from "@tanstack/react-query"

function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })
}
```

## Rules

- Raw API functions return `Promise<T>` (unwrap `res.data` inside the function)
- Query hooks are the ONLY place that imports from `@tanstack/react-query`
- Never call `useQuery` / `useMutation` inside non-React code
- Use `enabled` option to conditionally skip queries (e.g., only fetch if token exists)
- Named exports only: `export { useLoginMutation }` (no default export)
- Keep `onSuccess` / `onError` callbacks thin — delegate to store actions or utility functions
