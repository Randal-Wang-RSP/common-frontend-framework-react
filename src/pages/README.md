# pages

Route-level components. Each slice corresponds to one URL route.

**Allowed imports:** `@/widgets`, `@/features`, `@/entities`, `@/shared`
**Forbidden:** `@/app`, other `@/pages/*` slices

## Structure

```
pages/
└── <page-name>/
    ├── ui/        Page component
    ├── model/     Page-local state (use sparingly)
    └── index.ts   Public API
```

## Registering a page

```ts
// src/app/router/index.tsx
import { HomePage } from "@/pages/home"
<Route path="/" element={<HomePage />} />
```
