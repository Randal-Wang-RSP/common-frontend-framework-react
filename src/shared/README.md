# shared

Foundation layer. Zero business domain knowledge.

**Allowed imports:** none
**Forbidden:** any import from `@/app`, `@/pages`, `@/widgets`, `@/features`, `@/entities`

## Subdirectories

| Directory | Contents                                     |
| --------- | -------------------------------------------- |
| `api/`    | Axios instance and base HTTP config          |
| `config/` | Typed env variable accessors                 |
| `lib/`    | Pure utility functions (no React, no domain) |
| `store/`  | Zustand `create` re-export                   |
| `ui/`     | Generic UI components wrapping Ant Design    |

## The rule

If a function references a business concept (user, product...), it does NOT belong in shared.
