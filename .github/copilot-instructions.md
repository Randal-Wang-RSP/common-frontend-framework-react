# GitHub Copilot — Workspace Instructions

## Context

React template using **Feature-Sliced Design (FSD)** architecture, TypeScript strict mode.

**Tech stack:** React 18 · Vite · TypeScript · CSS Modules · Ant Design · Zustand · TanStack Query · React Router v7 · Vitest

**Repository:**
- **Hosting:** Bitbucket
- **CI/CD:** Jenkins
- **Code quality:** SonarQube

Layers import **downward only** — never upward, never sideways across the same layer:

```
app → pages → widgets → features → entities → shared
```

Each layer's responsibility:
- **`app/`** — providers, router, global styles. No slices.
- **`pages/`** — one slice per route. Compose widgets/features.
- **`widgets/`** — large self-contained UI blocks.
- **`features/`** — user interactions and business actions.
- **`entities/`** — domain models, data types, display components. No user interactions.
- **`shared/`** — UI primitives, HTTP client, utilities. Zero business domain knowledge.

Each slice structure:

```
sliceName/
  ui/        # React components
  model/     # Zustand stores, hooks, types
  api/       # React Query hooks, raw API calls
  lib/       # slice-local utilities
  config/    # slice-local constants
  index.ts   # public barrel — only export what consumers need
```

**Git Workflow:** Git Flow — `main` (production) + `development` (integration) + short-lived feature/fix/release/hotfix branches.
**Branch naming:** `<type>/<scope>-<short-description>` (e.g., `feat/auth-jwt-refresh`, `fix/cart-duplicate-items`)
**Merge strategy:** Squash Merge for features → `development`; Merge Commit for releases/hotfixes → `main`.
**Protected branches:** `main` and `development` — no direct push, PR + 1 approval required.
**Versioning:** Semantic Versioning `v<MAJOR>.<MINOR>.<PATCH>` — tags prefixed with `v`.

> Architecture deep-dive: [`docs/architecture.md`](../docs/architecture.md)
> Naming & import conventions: [`docs/conventions.md`](../docs/conventions.md)
> Layer-specific guides: [`docs/layers/`](../docs/layers/)
> Git workflow details: [`.github/skills/git-workflow/SKILL.md`](skills/git-workflow/SKILL.md)
> Common tasks (add feature/entity/page): use `.github/prompts/` prompt files.
> Deep library patterns (Zustand, React Query): see `.github/skills/`.

---

## Never Do

```ts
// ❌ Import across same-layer slice boundary
import { getProfile } from "@/features/profile"     // inside features/auth

// ❌ Bypass the barrel — import from internal files directly
import { LoginForm } from "@/features/auth/ui/LoginForm"

// ❌ Cross-layer import using relative path
import { Button } from "../../shared/ui"

// ❌ Default export
export default function UserCard() { ... }

// ❌ any type
const data: any = response.data

// ❌ Business domain concepts in shared/
// shared/lib/getUserFullName.ts  ← domain logic does not belong here

// ❌ Import Zustand or Axios directly — use shared wrappers
import { create } from "zustand"     // use @/shared/store
import axios from "axios"            // use @/shared/api
```

---

## Patterns

**Cross-layer import — always use `@/` alias:**

```ts
// ✅
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"

// ✅ Within the same slice — relative is fine
import { loginSchema } from "../lib/validation"
```

**Cross-entity reference — use `@x` pattern:**

```ts
// src/entities/user/@x/order.ts — re-export only what order needs
export type { UserId } from "../model"

// inside entities/order:
import type { UserId } from "@/entities/user/@x/order"
```

**Named exports only** — no `export default` anywhere in the project.

**Explicit return types** on all exported functions.

**Import order:** external packages → `@/` imports → relative imports.

```ts
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/shared/ui"

import { loginSchema } from "../lib/validation"
import styles from "./LoginForm.module.css"
```

**Naming:** Components/types → `PascalCase` · functions/variables/hooks → `camelCase` · files/folders → `kebab-case` · hooks → `useXxxStore`, `useXxxQuery`

**Formatting:** Prettier auto-applied on commit — no semicolons · double quotes · 100-char width · 2-space indent · ES5 trailing commas

**Testing:** co-locate `authStore.ts` → `authStore.test.ts` · Vitest globals need no imports

**Commits:** `feat(auth): add JWT refresh logic` · `fix(cart): prevent duplicate items`
Types: `feat | fix | docs | style | refactor | test | chore | perf | revert`

**Atomic commits:** split changes by type — code, tests, docs, config in separate commits. Stage selectively (`git add <files>`), not `git add -A`.

**Env vars:** prefix client-side vars with `VITE_`

---

## Agent Rules

**Language:** Thinking and response text follow the user's language. Code, comments, documentation, commit messages, and PR content are **always in English**.

**Branch-first:** Always create a feature branch before writing any code — never commit directly to `main` or `development`.

**Commit/PR review:** Before executing `git commit` or creating a PR, display the proposed message in the response text, then call `vscode_askQuestions` with confirm/edit/cancel options. Never execute without tool-based confirmation. Use single-select for yes/no confirmations; use multi-select when the user needs to choose multiple items (e.g., files to stage, issues to fix).

**Iterative workflow:** If new changes arise after a commit, re-enter the workflow from the appropriate step — assess, stage, show message, commit. Never skip steps.

**Session end gate:** After completing any task or yielding control, **always** call `vscode_askQuestions` to ask the user about the next action. Include context-appropriate options and a "pause/stop" choice. This applies after every commit, push, PR creation, or code change — not only at session end.
