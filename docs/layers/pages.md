# Layer: `pages`

## Purpose

The `pages` layer contains route-level components. Each slice maps to
exactly one URL route. Pages are assembly points — they compose widgets,
features, and entities together, but contain minimal logic of their own.

## Structure

Each page is a slice with the following layout:

```
src/pages/home/
├── ui/
│   ├── HomePage.tsx
│   └── index.ts
└── index.ts
```

- `ui/` — the page component(s)
- `ui/index.ts` — re-exports from `ui/`
- `index.ts` — the slice's public API; re-exports the page component

## Key conventions

### One slice per route

Every URL route has its own subdirectory under `src/pages/`. The slice
name should reflect the route: `home`, `user-profile`, `order-detail`,
etc.

### Pages only assemble; they do not implement

A page component imports from `widgets`, `features`, `entities`, and
`shared`. It lays them out and passes data between them. Business logic,
API calls, and state management live in the layers below — not in the
page itself.

### Import rule

A page may import from:

- `widgets/`
- `features/`
- `entities/`
- `shared/`

A page must **never** import from another page. Cross-page dependencies
are a sign that something belongs in `widgets/` or `features/`.

### Route registration is separate from the component

The page file is only a React component. Registering it at a URL path
(e.g., `<Route path="/home" element={<HomePage />} />`) happens in
`src/app/router/`. This keeps routing concerns out of the `pages/`
layer and makes the page component independently testable.

### `index.ts` — public API

The `index.ts` at the slice root is the only file that consumers
(i.e., `src/app/router/`) should import from. Internal implementation
files should not be imported directly from outside the slice.
