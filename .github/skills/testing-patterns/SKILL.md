---
name: testing-patterns
description: "Vitest + React Testing Library testing conventions: test structure, mock strategies, assertion patterns, coverage requirements."
---

# Testing Patterns

## Stack

- **Vitest** with `globals: true` (no need to import `describe`, `it`, `expect`)
- **jsdom** environment
- **@testing-library/react** for component rendering
- **@testing-library/user-event** for user interactions
- **@testing-library/jest-dom** for DOM matchers (extended via setup file)
- Setup file: `src/app/test-setup.ts`

## File Conventions

- Co-locate tests next to source: `useAuthStore.ts` → `useAuthStore.test.ts`
- Component tests: `LoginForm.tsx` → `LoginForm.test.tsx`
- Name pattern: `*.test.ts` or `*.test.tsx`

## Test Structure

```ts
describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset state between tests
    localStorage.clear()
  })

  it("should set auth token and user", () => {
    // Arrange
    const token = "jwt-token"
    const user = { id: "1", email: "test@example.com", name: "Test" }

    // Act
    useAuthStore.getState().setAuth(token, user)

    // Assert
    const state = useAuthStore.getState()
    expect(state.token).toBe(token)
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
  })
})
```

## Zustand Store Testing

Test stores by directly calling `getState()` and `setState()` — no React rendering needed:

```ts
import { useMyStore } from "./useMyStore"

describe("useMyStore", () => {
  beforeEach(() => {
    // Reset to initial state
    useMyStore.setState(useMyStore.getInitialState())
  })

  it("should update state via action", () => {
    useMyStore.getState().someAction()
    expect(useMyStore.getState().someValue).toBe(expected)
  })
})
```

**localStorage testing:** When store uses `persist` or manual localStorage:

```ts
beforeEach(() => {
  localStorage.clear()
})

it("should persist token to localStorage", () => {
  useAuthStore.getState().setAuth("token", user)
  expect(localStorage.getItem("auth_token")).toBe("token")
})
```

## API / TanStack Query Testing

For raw API functions, mock `apiInstance`:

```ts
import { apiInstance } from "@/shared/api"
import { login } from "./authApi"

vi.mock("@/shared/api", () => ({
  apiInstance: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe("authApi", () => {
  it("should call POST /api/auth/login", async () => {
    const mockResponse = { data: { token: "jwt", user: { id: "1" } } }
    vi.mocked(apiInstance.post).mockResolvedValue(mockResponse)

    const result = await login({ email: "test@example.com", password: "pass" })

    expect(apiInstance.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "pass",
    })
    expect(result).toEqual(mockResponse.data)
  })
})
```

For TanStack Query hooks, prefer testing the underlying API function directly.
Only test hooks when hook-level logic (onSuccess callbacks, transforms) needs verification.

## Component Testing

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

describe("LoginForm", () => {
  it("should show validation error for empty email", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole("button", { name: /login/i }))

    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })
})
```

**Wrap with providers when needed:**

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}
```

## Pure Function Testing

Validation functions, formatters, and utilities — straightforward input/output:

```ts
describe("validateEmail", () => {
  it("should return undefined for valid email", () => {
    expect(validateEmail("user@example.com")).toBeUndefined()
  })

  it("should return error for invalid email", () => {
    expect(validateEmail("not-an-email")).toBe("请输入有效的邮箱地址")
  })

  it("should return error for empty string", () => {
    expect(validateEmail("")).toBe("邮箱不能为空")
  })
})
```

## Mock Rules

- Use `vi.mock()` for module mocking (hoisted automatically)
- Use `vi.fn()` for function mocks
- Use `vi.mocked()` for type-safe mock access
- Use `vi.spyOn()` when you need to observe calls without replacing
- Always clean up: `vi.restoreAllMocks()` in `afterEach` or use `beforeEach` resets

## What to Test

| Priority | What                           | How                               |
| -------- | ------------------------------ | --------------------------------- |
| High     | Zustand store actions          | Direct state assertions           |
| High     | Validation / utility functions | Input → output                    |
| High     | API function calls             | Mock apiInstance                  |
| Medium   | Component user interactions    | RTL + userEvent                   |
| Medium   | Error / loading states         | Mock error responses              |
| Low      | Static render output           | Snapshot (avoid unless justified) |

## What NOT to Test

- Implementation details (internal state, private methods)
- Third-party library behavior (Ant Design renders correctly)
- CSS / styling (use visual regression tools instead)
- Simple pass-through wrappers with no logic
