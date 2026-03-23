# Layer: `shared`

## Purpose

The `shared` layer provides reusable infrastructure with zero business
domain knowledge. It is the foundation that every other layer builds on.

## Structure

`shared/` has **no slices**. It uses segments directly:

```
src/shared/
├── api/          # Axios instance
├── config/       # Typed environment variables
├── lib/          # Generic utility functions
├── store/        # Zustand re-exports
└── ui/           # Reusable UI primitives
```

## Segments

### `shared/api/`

Exports `apiInstance` — a configured Axios instance used for all HTTP
requests. Features call this instead of importing Axios directly, so
base URL, headers, and interceptors are configured in one place.

```ts
import { apiInstance } from "@/shared/api"
```

### `shared/config/`

Exports an `env` object that provides typed access to
`import.meta.env` variables. Use this instead of reading
`import.meta.env` directly in feature or entity code.

```ts
import { env } from "@/shared/config"

const baseUrl = env.VITE_API_BASE_URL
```

### `shared/lib/`

Generic utility functions with no domain knowledge — date formatting,
string helpers, number formatting, etc. If a utility needs to know
about `User` or `Order`, it does not belong here.

### `shared/store/`

Re-exports `create`, `devtools`, and related types from Zustand. All
feature stores should import from here instead of importing from
`zustand` directly. This gives a single place to configure Zustand
middleware defaults and to update the import path if the library
changes.

```ts
import { create, devtools } from "@/shared/store"
```

### `shared/ui/`

Reusable UI primitives that wrap Ant Design components. Examples:
`Button`, `Input`, `Modal` wrappers with project-specific defaults
applied. Pages, widgets, and features use these instead of importing
from `antd` directly.

## Key conventions

### The shared layer cannot import from any other layer

`shared/` sits at the bottom of the dependency graph. It must not
import from `entities/`, `features/`, `widgets/`, `pages/`, or `app/`.
If you find yourself needing a domain concept inside `shared/`, that
is a sign the code belongs in a higher layer.

### No business domain knowledge

The "no domain knowledge" rule is the practical test: can this code be
copied into a completely different project without modification? If
yes, it belongs in `shared/`. If it references concepts specific to
this application (users, orders, products), it does not.

### Prefer shared layer imports over direct library imports

| Instead of                         | Use                                          |
| ---------------------------------- | -------------------------------------------- |
| `import axios from "axios"`        | `import { apiInstance } from "@/shared/api"` |
| `import { create } from "zustand"` | `import { create } from "@/shared/store"`    |
| `import { Button } from "antd"`    | `import { Button } from "@/shared/ui"`       |
| `import.meta.env.VITE_*`           | `import { env } from "@/shared/config"`      |

This indirection keeps library upgrade changes local to `shared/`.
