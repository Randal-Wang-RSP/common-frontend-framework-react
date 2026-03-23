# features

User interactions and business operations (login, add-to-cart, submit-form...).

**Allowed imports:** `@/entities`, `@/shared`
**Forbidden:** `@/app`, `@/pages`, `@/widgets`, other `@/features/*` slices

## Structure

```
features/
└── <feature-name>/
    ├── ui/        UI components for this feature
    ├── model/     Zustand store slice
    ├── api/       API calls via @/shared/api/instance
    └── index.ts   Public API
```

## Feature store pattern

```ts
// features/auth/model/useAuthStore.ts
import { create } from "@/shared/store"

export const useAuthStore = create<{ token: string | null }>()(() => ({
  token: null,
}))
```
