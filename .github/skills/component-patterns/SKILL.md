---
name: component-patterns
description: "React component patterns: container/presentation split, ref forwarding, state handling, CSS Modules, Ant Design integration, accessibility basics."
---

# Component Patterns

## File Organization

Component files live in `<slice>/ui/`:

```
features/auth/
  ui/
    LoginForm.tsx              # Component
    LoginForm.module.css       # Styles
    LoginForm.test.tsx         # Tests
    index.ts                   # Segment barrel
```

## Container / Presentation Split

**Container components** (data + logic):

```tsx
// features/auth/ui/LoginForm.tsx
import { Form, Input, Button, Alert } from "@/shared/ui"
import { useLoginMutation } from "../api"
import { validateEmail, validatePassword } from "../lib"
import styles from "./LoginForm.module.css"

function LoginForm(): React.ReactElement {
  const loginMutation = useLoginMutation()

  const handleFinish = (values: { email: string; password: string }) => {
    loginMutation.mutate(values)
  }

  return (
    <div className={styles["login-form"]}>
      {loginMutation.isError && <Alert type="error" message={loginMutation.error?.message} />}
      <Form onFinish={handleFinish}>{/* form fields */}</Form>
    </div>
  )
}

export { LoginForm }
```

**Presentation components** (pure UI, no data fetching):

```tsx
// shared/ui/FormCard.tsx
import styles from "./FormCard.module.css"

interface FormCardProps {
  title: string
  children: React.ReactNode
}

function FormCard({ title, children }: FormCardProps): React.ReactElement {
  return (
    <div className={styles["form-card"]}>
      <h2 className={styles["form-card__title"]}>{title}</h2>
      {children}
    </div>
  )
}

export { FormCard }
```

## State Handling Pattern

Handle all possible states: loading → error → empty → success:

```tsx
function UserList(): React.ReactElement {
  const { data, isLoading, isError, error } = useUsersQuery()

  if (isLoading) return <Spin />
  if (isError) return <Alert type="error" message={error.message} />
  if (!data?.length) return <Empty description="暂无用户" />

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## CSS Modules

### Naming

- File: `<ComponentName>.module.css`
- Classes: kebab-case
- BEM-style for modifiers: `block__element--modifier`

```css
/* LoginForm.module.css */
.login-form {
  max-width: 400px;
  margin: 0 auto;
}

.login-form__footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.login-form__link--secondary {
  color: var(--color-text-secondary);
}
```

### Usage

```tsx
import styles from "./LoginForm.module.css"
;<div className={styles["login-form"]}>
  <div className={styles["login-form__footer"]}>
    <a className={styles["login-form__link--secondary"]}>忘记密码</a>
  </div>
</div>
```

### Rules

- Never use inline styles
- Use bracket notation for kebab-case classes: `styles["my-class"]`
- Keep styles scoped — avoid global class names
- Use CSS variables for theme values (colors, spacing)

## Ant Design Integration

Import Ant Design components through `@/shared/ui` wrapper:

```tsx
// ✅ Correct
import { Button, Form, Input, Alert } from "@/shared/ui"

// ❌ Wrong — direct antd import
import { Button } from "antd"
```

### Form Validation with Ant Design

Use Ant Design Form's `rules` with custom `validator` for integration with validation functions:

```tsx
<Form.Item
  name="email"
  rules={[
    {
      validator: (_rule, value) => {
        const error = validateEmail(value)
        return error ? Promise.reject(error) : Promise.resolve()
      },
    },
  ]}
>
  <Input placeholder="邮箱" />
</Form.Item>
```

## Named Exports

```ts
// ✅ Correct
export { LoginForm }

// ❌ Forbidden
export default LoginForm
```

## Props Interface

Define props as an interface, co-located with the component:

```tsx
interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

function LoginForm({ onSuccess, redirectTo = "/" }: LoginFormProps): React.ReactElement {
  // ...
}
```

For reusable shared UI components that need to expose a DOM node, pass `ref` as a regular prop:

```tsx
// React 19+ — ref is a regular prop (no forwardRef needed)
interface CustomInputProps {
  label: string
  error?: string
  ref?: React.Ref<HTMLInputElement>
}

function CustomInput({ label, error, ref, ...rest }: CustomInputProps): React.ReactElement {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...rest} />
      {error && <span>{error}</span>}
    </div>
  )
}

export { CustomInput }
```

> **React 18 fallback:** If the project is still on React 18, use `forwardRef`:
>
> ```tsx
> import { forwardRef } from "react"
>
> const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(function CustomInput(
>   { label, error, ...rest },
>   ref
> ) {
>   return (
>     <div>
>       <label>{label}</label>
>       <input ref={ref} {...rest} />
>       {error && <span>{error}</span>}
>     </div>
>   )
> })
> ```
>
> Check the React version in `package.json` to decide which pattern to use.

## Page Components

Page components are thin shells — layout + feature composition:

```tsx
// pages/login/ui/LoginPage.tsx
import { LoginForm } from "@/features/auth"
import styles from "./LoginPage.module.css"

function LoginPage(): React.ReactElement {
  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-page__card"]}>
        <h1 className={styles["login-page__title"]}>登录</h1>
        <LoginForm />
      </div>
    </div>
  )
}

export { LoginPage }
```

## Rules

- Components return `React.ReactElement` (explicit return type on exported functions)
- One component per file
- Clean up side effects (listeners, timers, subscriptions) in `useEffect` cleanup
- Avoid prop drilling deeper than 2 levels — use Zustand store or context
- Keep components under 150 lines — split if larger
