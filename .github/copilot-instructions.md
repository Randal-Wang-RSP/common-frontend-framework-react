# Project: common-frontend-framework-react

React project template based on **Feature-Sliced Design (FSD)**.

---

## Tech Stack

React 18 · Vite · TypeScript (strict) · CSS Modules · Ant Design · Zustand · TanStack Query · React Router v7 · Vitest + jsdom

---

## FSD Layer Hierarchy

```
app → pages → widgets → features → entities → shared
```

Import rule: a layer may only import from layers **strictly below** it. `shared` cannot import from any other layer.

### What belongs where

| Layer      | Purpose                                                          |
| ---------- | ---------------------------------------------------------------- |
| `app`      | Providers, router, global styles — no slices                     |
| `pages`    | Route-level page components — minimal logic                      |
| `widgets`  | Self-contained UI blocks composing features and entities         |
| `features` | User interactions and business actions (login, cart, search)     |
| `entities` | Business domain objects — types, stores, display components only |
| `shared`   | Reusable infrastructure — zero business domain knowledge         |

---

## Slice Structure

```
sliceName/
  ui/       # React components
  model/    # Zustand stores, hooks, TypeScript types
  api/      # TanStack Query hooks and raw API calls
  lib/      # Slice-local utilities
  config/   # Slice-local constants
  index.ts  # Public API barrel — only import via this file from outside the slice
```

---

## Critical Rules

### ❌ Never Do

```ts
// ❌ default export
export default function UserCard() {}

// ❌ any type
const data: any = response.data

// ❌ direct zustand import — use @/shared/store
import { create } from "zustand"

// ❌ direct axios import — use @/shared/api
import axios from "axios"

// ❌ relative import across slice boundary
import { Button } from "../../shared/ui" // use @/shared/ui

// ❌ same-layer cross-slice import
import { getProfile } from "@/features/profile" // inside features/auth

// ❌ import from internal file directly (bypass barrel)
import { LoginForm } from "@/features/auth/ui/LoginForm"
```

### ✅ Always Do

```ts
// ✅ named export
export function UserCard() {}

// ✅ @/ alias for cross-slice imports
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"

// ✅ relative import within same slice only
import { useLoginMutation } from "../api"

// ✅ cross-entity reference via @x pattern
import type { UserId } from "@/entities/user/@x/order"
```

---

## Code Style

- No semicolons · Double quotes · 100-char line width · 2-space tabs · Trailing commas (ES5)
- `PascalCase` — components, types, interfaces
- `camelCase` — functions, variables, hooks
- `kebab-case` — file and folder names
- Explicit return types on all exported functions
- Unused parameters prefixed with `_`

---

## Testing

- Co-locate tests: `file.ts` → `file.test.ts` in the same directory
- Vitest globals (`describe`, `it`, `expect`) — no explicit imports needed
- Use `@testing-library/react` for component tests
- Test `model/` and `api/` segments — not purely presentational components

---

## Git Conventions

Conventional Commits: `<type>(<scope>): <description>`  
Types: `feat` · `fix` · `docs` · `style` · `refactor` · `test` · `chore` · `perf` · `revert`

Branches: `feat/<scope>-<desc>` · `fix/<scope>-<desc>` · `hotfix/<scope>-<desc>` · `release/vX.Y.Z`  
Protected: `main` and `development` — PR + 1 approval required, no direct push.

---

## Agent Rules

- **Language:** Response text follows the user's language. Code, comments, docs, and commits are always in English.
- **Branch-first:** Always create a feature branch before writing code. Never commit to `main` or `development` directly.
- **Gate protocol:** At every Gate checkpoint, ask the user for confirmation using `vscode_askQuestions` before executing any irreversible action (branch creation, commits, PR creation, merge). Never proceed without tool-based confirmation.
  - Set `allowFreeformInput: true` when the user may need to provide custom input alongside options (e.g., plan confirmation, commit message edit, branch naming).
  - Set `allowFreeformInput: false` for purely binary gates where choosing an option is sufficient (e.g., confirm/cancel, continue/stop).
- **Session end gate:** After any commit, PR creation, or code change, ask the user about next action. Always include a pause/stop option.
- **Context passing:** When delegating to a subagent, explicitly include the prior stage's output in the invocation prompt. Subagents have no shared memory.
