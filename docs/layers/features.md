# Layer: `features`

## Purpose

The `features` layer contains user interactions and business actions —
the things the user _does_. Each slice represents one cohesive
capability.

## Examples

- `auth` — login, logout, session management
- `search` — search input, results display
- `create-order` — order creation flow
- `upload-avatar` — file upload + preview

## Structure

A feature encapsulates everything needed for that action: UI, state,
and API calls.

```
src/features/auth/
├── api/
│   ├── authApi.ts        # React Query mutations/queries
│   └── index.ts
├── model/
│   ├── useAuthStore.ts   # Zustand store
│   ├── types.ts
│   └── index.ts
├── ui/
│   ├── LoginForm.tsx
│   └── index.ts
└── index.ts              # public API barrel
```

### Segments

| Segment  | Contents                                                         |
| -------- | ---------------------------------------------------------------- |
| `api/`   | React Query queries and mutations; raw API call functions        |
| `model/` | Zustand stores, derived state, TypeScript types for this feature |
| `ui/`    | React components specific to this feature                        |

Not every feature needs all three segments. Add only what is relevant.

## Key conventions

### `index.ts` is the public API

The `index.ts` at the slice root is the only file that other layers
should import from. Export only what consumers need. Internal
implementation details (helper functions, sub-components) should not
be re-exported.

```ts
// src/features/auth/index.ts
export { LoginForm } from "./ui"
export { useAuthStore } from "./model"
export type { AuthUser } from "./model"
```

### Import rule

A feature may import from:

- `entities/`
- `shared/`

A feature must **never** import from:

- Another feature (same layer — horizontal imports are forbidden)
- `widgets/`, `pages/`, or `app/` (upper layers)

If two features need to share something, move that something to
`entities/` or `shared/`.

### State lives in `model/`

Use Zustand for feature-local state. Import `create` and `devtools`
from `@/shared/store` rather than directly from `zustand`.

```ts
import { create, devtools } from "@/shared/store"
```

### API calls live in `api/`

Use React Query (`useQuery`, `useMutation`) for server state. The
query/mutation functions call `apiInstance` from `@/shared/api`.
