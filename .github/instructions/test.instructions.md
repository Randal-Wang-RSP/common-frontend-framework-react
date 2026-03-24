---
applyTo: "**/*.test.{ts,tsx}"
---

# Testing Conventions

## Co-location

Tests live next to the source file they test:

```
model/
  authStore.ts
  authStore.test.ts
ui/
  LoginForm.tsx
  LoginForm.test.tsx
```

## Vitest Globals

`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` are available globally — no imports needed:

```ts
// ✅
describe("useAuthStore", () => {
  it("sets user on login", () => {
    expect(store.user).toBeNull()
  })
})

// ❌ Do not import vitest globals
import { describe, it, expect } from "vitest"
```

## Component Tests

Use `@testing-library/react` for component tests:

```tsx
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { LoginForm } from "./LoginForm"

it("shows error on empty submit", async () => {
  render(<LoginForm />)
  await userEvent.click(screen.getByRole("button", { name: /login/i }))
  expect(screen.getByText(/required/i)).toBeInTheDocument()
})
```

## Store Tests

Test Zustand stores by importing the hook and calling actions directly — no need to render a component:

```ts
import { useAuthStore } from "./useAuthStore"

beforeEach(() => {
  useAuthStore.setState({ user: null })
})

it("stores user after login", () => {
  const { login } = useAuthStore.getState()
  login({ id: "1", name: "Alice" })
  expect(useAuthStore.getState().user?.name).toBe("Alice")
})
```

## Mock HTTP

Use `vi.mock` or `msw` for API mocking — never call real endpoints in tests:

```ts
vi.mock("@/shared/api", () => ({
  apiInstance: { post: vi.fn().mockResolvedValue({ data: { token: "abc" } }) },
}))
```
