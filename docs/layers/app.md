# Layer: `app`

## Purpose

The `app` layer is the application bootstrap — nothing more. It owns:

- **Providers** — all global React context providers
- **Router** — route definitions and top-level routing setup
- **Global styles** — base CSS, Ant Design token imports, resets
- **Test setup** — Vitest global configuration

## Structure

```
src/app/
├── providers/        # Global React context provider composition
├── router/           # Route definitions
├── styles/
│   └── index.css     # Ant Design tokens + resets
└── test-setup.ts     # Vitest global setup
```

## Key conventions

### No slices

`app/` is flat. It is not divided by business domain. There are no
slice subdirectories here the way there are in `pages/`, `features/`,
or `entities/`.

### Provider composition (`src/app/providers/`)

All global React context providers are composed in one place. The
pattern is a single `AppProviders` (or similarly named) component that
wraps the application tree. Keeping providers here means they are easy
to find, easy to reorder, and isolated from business logic.

### Router setup (`src/app/router/`)

Route definitions live here. A page file is just a component — the
act of registering it at a URL path happens in this directory. This
keeps routing concerns out of the `pages/` layer.

### Global styles (`src/app/styles/index.css`)

This file is the single entry point for global CSS. It imports Ant
Design design tokens and any global resets. Component-scoped styles
belong with their component, not here.

### `test-setup.ts`

Vitest globals (e.g., `@testing-library/jest-dom` matchers) are
configured here. This file is referenced by `vitest.config.ts` via
the `setupFiles` option.

## What does NOT belong here

| What                       | Where it belongs instead |
| -------------------------- | ------------------------ |
| Business logic             | `features/`              |
| Feature-specific state     | `features/<name>/model/` |
| Entity models / interfaces | `entities/<name>/model/` |
| Shared utilities           | `shared/lib/`            |
| Page components            | `pages/`                 |

The `app` layer is allowed to import from every other layer, but it
should only use those imports to wire things together, not to implement
business behaviour.
