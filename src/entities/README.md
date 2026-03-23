# entities

Core business domain objects (User, Product, Order...).

**Allowed imports:** `@/shared`
**Forbidden:** `@/app`, `@/pages`, `@/widgets`, `@/features`, other `@/entities/*` slices

## Cross-entity references (@x)

When entity A needs to reference entity B, use `@x` — not a direct import:

```
entities/user/@x/post.ts   ← defines what post can know about user
```

Entity post then imports: `import { ... } from "@/entities/user/@x/post"`

## Structure

```
entities/
└── <entity-name>/
    ├── ui/
    ├── model/    Type definitions + base store
    ├── api/      CRUD operations
    ├── @x/       Cross-entity contracts (only if needed)
    └── index.ts
```
