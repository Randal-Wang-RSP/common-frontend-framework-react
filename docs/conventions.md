# Conventions

## File and Folder Naming

| Thing                          | Convention                          | Example                                     |
| ------------------------------ | ----------------------------------- | ------------------------------------------- |
| Folders                        | kebab-case                          | `user-profile/`, `order-list/`              |
| React component files          | PascalCase                          | `UserCard.tsx`, `LoginForm.tsx`             |
| Non-component TypeScript files | camelCase                           | `useAuthStore.ts`, `apiInstance.ts`         |
| Test files                     | Same name as source + `.test.ts(x)` | `UserCard.test.tsx`, `useAuthStore.test.ts` |
| CSS Modules                    | Same name as component              | `UserCard.module.css`                       |

---

## Import Conventions

**`@/` alias** — use for all cross-layer and cross-slice imports.

```ts
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"
```

**Relative imports (`./`, `../`)** — only within the same slice or segment.

```ts
// Inside features/auth/ui/LoginForm.tsx
import { useLoginMutation } from "../api"
import { authSchema } from "../lib/validation"
```

**Import order** (ESLint-enforced):

1. External packages (`react`, `react-query`, etc.)
2. Internal `@/` imports
3. Relative imports

```ts
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/shared/ui"
import { userSchema } from "@/entities/user"

import { loginFormSchema } from "../lib/validation"
import styles from "./LoginForm.module.css"
```

---

## Conventional Commits

Format: `<type>(<optional scope>): <description>`

- Description: **lowercase**, **no period** at end, **imperative mood** ("add", not "adds" or "added")
- Scope is optional but encouraged for clarity

### Allowed Types

| Type       | Use for                                    |
| ---------- | ------------------------------------------ |
| `feat`     | New feature or user-visible behavior       |
| `fix`      | Bug fix                                    |
| `docs`     | Documentation only                         |
| `style`    | Formatting, whitespace (no logic change)   |
| `refactor` | Code restructuring without behavior change |
| `test`     | Adding or fixing tests                     |
| `chore`    | Build, deps, tooling, config               |
| `perf`     | Performance improvements                   |
| `revert`   | Reverting a previous commit                |

### Examples

```
feat(auth): add login form with validation
fix(user): handle null avatar gracefully
docs: update layer guide for widgets
chore: upgrade vite to 5.2
test(env): add coverage for isProd flag
refactor(order): extract price calculation to shared util
perf(product-list): virtualize long lists with react-window
```

---

## Component Conventions

- **One component per file** — do not export multiple components from a single file.
- **Named exports only** — do not use default exports for components.

```ts
// Correct
export function UserCard({ user }: UserCardProps) { ... }

// Wrong
export default function UserCard({ user }: UserCardProps) { ... }
```

- **CSS Modules** — co-locate styles with the component using the same base name.

```
UserCard.tsx
UserCard.module.css
UserCard.test.tsx
```
