---
applyTo: "src/shared/**"
---

# Layer: `shared`

Reusable infrastructure with **zero business domain knowledge**. The foundation every other layer builds on.

Full reference: [`docs/layers/shared.md`](../../docs/layers/shared.md)

## Structure

`shared/` has no slices — only segments:

```
src/shared/
  api/       # Axios instance + interceptors
  config/    # Typed env var accessors
  lib/       # Generic utility functions
  store/     # Zustand re-exports
  ui/        # Reusable UI primitives (wrapping Ant Design)
```

## Segment Usage

```ts
// HTTP client — always use the shared instance
import { apiInstance } from "@/shared/api"

// Env vars — never read import.meta.env directly in feature/entity code
import { env } from "@/shared/config"
const url = env.apiBaseUrl

// Zustand — import from here, not from "zustand" directly
import { create, devtools } from "@/shared/store"

// UI primitives — use project wrappers, not antd directly
import { Button } from "@/shared/ui"
```

## Import Rules

```ts
// ❌ shared cannot import from any other layer
import { User } from "@/entities/user"   // FORBIDDEN
import { useAuthStore } from "@/features/auth"  // FORBIDDEN
```

## The Domain Knowledge Test

Before adding anything to `shared/`, ask: *"Does this concept know about users, orders, or any other business entity?"*

```ts
// ✅ Belongs in shared — pure utility, no domain knowledge
export function formatCurrency(amount: number, currency: string): string { ... }

// ❌ Does NOT belong in shared — knows about the User domain
export function getUserFullName(user: User): string { ... }
// → move to entities/user/model/ or features/<name>/lib/
```

## Never Do

```ts
// ❌ Import business domain types
import type { User } from "@/entities/user"

// ❌ Import from axios directly in feature code (use @/shared/api)
import axios from "axios"

// ❌ Import from zustand directly (use @/shared/store)
import { create } from "zustand"

// ❌ Import from antd directly (use @/shared/ui wrappers)
import { Button } from "antd"
```
