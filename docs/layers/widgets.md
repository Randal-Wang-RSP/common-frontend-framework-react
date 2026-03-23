# Layer: `widgets`

## Purpose

The `widgets` layer contains self-contained UI blocks that are larger
than a single feature and are shared between multiple pages. A widget
has no route of its own — it is a reusable composition unit.

## Examples

- `Sidebar`
- `Header`
- `DashboardStats`
- `NotificationFeed`

## Structure

Same layout as `pages/`:

```
src/widgets/sidebar/
├── ui/
│   ├── Sidebar.tsx
│   └── index.ts
└── index.ts
```

## Key conventions

### Widgets are shared UI blocks, not pages

If a UI block appears on only one page and has no prospect of reuse,
keep it inside that page's `ui/` segment. Extract it to a widget when
the same block appears on two or more pages.

### Widgets compose; they do not own business logic

A widget can import from `features/` and `entities/` to wire together
their UI components. The business logic itself — state, API calls,
side effects — remains in `features/` and `entities/`. The widget only
arranges and connects.

### Import rule

A widget may import from:

- `features/`
- `entities/`
- `shared/`

A widget must **never** import from `pages/` or from another widget.
If two widgets need to share something, that something belongs in
`features/`, `entities/`, or `shared/`.

### `index.ts` — public API

Expose only what pages need. Internal sub-components and helpers should
not be part of the public API.
