# FSD Frontend Framework Template — Design Spec

**Date:** 2026-03-23
**Status:** Approved

## Overview

Initialize `common-frontend-framework-react` as a project template based on Feature-Sliced Design (FSD) architecture. Teams clone this repository as the starting point for new React projects. The template provides a minimal skeleton with directory structure, toolchain configuration, and comprehensive architecture documentation.

## Goals

- Provide a ready-to-clone FSD project template for React applications
- Enforce FSD architectural constraints via ESLint tooling (not just documentation)
- Supply rich architecture documentation for both human developers and AI coding tools
- Zero business logic — pure infrastructure and conventions

## Non-Goals

- No demo application or sample feature implementations
- No backend or API mock setup
- No CI/CD pipeline configuration

---

## Tech Stack

| Concern | Choice |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite |
| Language | TypeScript (strict mode) |
| Component Library | Ant Design |
| Styling | CSS Modules |
| State Management | Zustand |
| Server State | React Query (TanStack Query) |
| Routing | React Router v7 |
| Testing | Vitest + jsdom |
| Linting | ESLint + eslint-plugin-boundaries + @typescript-eslint |
| Formatting | Prettier |
| Git Hooks | Husky + lint-staged |
| Commit Convention | Conventional Commits + commitlint |

---

## Architecture: Feature-Sliced Design

FSD organizes code into 6 active layers. The **import rule** is strict: a module may only import from layers strictly below it. Same-layer cross-slice imports are forbidden.

```
app         ← can import: pages, widgets, features, entities, shared
pages       ← can import: widgets, features, entities, shared
widgets     ← can import: features, entities, shared
features    ← can import: entities, shared
entities    ← can import: shared
shared      ← cannot import any other layer
```

Each layer (except `app` and `shared`) is subdivided into **slices** by business domain. Each slice contains **segments**: `ui/`, `model/`, `api/`, `lib/`, `config/`.

**Cross-entity references:** When one entity must reference another entity on the same layer, use the `@x` (public cross-reference) convention rather than a direct import. This makes the dependency explicit and avoids violating same-layer isolation. Details in `docs/layers/entities.md`.

---

## Directory Structure

```
common-frontend-framework-react/
├── index.html                  # Vite HTML entry point
├── src/
│   ├── main.tsx                # Vite entry: ReactDOM.createRoot().render(<App />)
│   ├── app/
│   │   ├── providers/          # Global React providers composition
│   │   ├── router/             # React Router v7 route definitions
│   │   ├── styles/             # Global styles, Ant Design theme tokens
│   │   ├── test-setup.ts       # Vitest global setup
│   │   └── index.tsx           # App root component (exported, mounted by main.tsx)
│   ├── pages/
│   │   └── README.md
│   ├── widgets/
│   │   └── README.md
│   ├── features/
│   │   └── README.md
│   ├── entities/
│   │   └── README.md
│   └── shared/
│       ├── api/                # Axios instance, base request config
│       ├── config/             # Environment variables, constants
│       ├── lib/                # Generic utility functions
│       ├── store/              # Zustand store base infrastructure
│       ├── ui/                 # Reusable UI components (wrapping Ant Design)
│       └── README.md
├── docs/
│   ├── architecture.md         # FSD overview, layer diagram, rationale
│   ├── conventions.md          # Naming rules, Conventional Commits reference
│   └── layers/
│       ├── app.md
│       ├── pages.md
│       ├── widgets.md
│       ├── features.md
│       ├── entities.md
│       └── shared.md
├── CLAUDE.md                   # AI tool context (architecture background)
├── .husky/
│   ├── commit-msg              # commitlint hook
│   └── pre-commit              # lint-staged hook
├── .eslintrc.cjs
├── .prettierrc
├── commitlint.config.cjs
├── .lintstagedrc.cjs
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## ESLint Boundary Enforcement

Uses `eslint-plugin-boundaries` to enforce FSD import rules at lint time. Violations cause ESLint errors, blocking commits via lint-staged.

Two enforcement concerns require separate configuration:

**1. Layer-to-layer direction** — upper layers may not import from layers above them.

**2. Same-layer slice isolation** — slices within the same layer may not import each other. This requires defining elements at the **slice level** (not just layer level) so the plugin can distinguish `features/auth` from `features/profile`.

```js
// .eslintrc.cjs (key section)
settings: {
  // Import resolver required for @/ alias resolution
  "import/resolver": {
    typescript: { alwaysTryTypes: true }
  },
  "boundaries/elements": [
    // Layer-level elements (for cross-layer direction rules)
    { type: "app",      pattern: "src/app/**",      mode: "folder" },
    { type: "pages",    pattern: "src/pages/*",     mode: "folder", capture: ["slice"] },
    { type: "widgets",  pattern: "src/widgets/*",   mode: "folder", capture: ["slice"] },
    { type: "features", pattern: "src/features/*",  mode: "folder", capture: ["slice"] },
    { type: "entities", pattern: "src/entities/*",  mode: "folder", capture: ["slice"] },
    { type: "shared",   pattern: "src/shared/**",   mode: "folder" },
  ]
},
rules: {
  // Cross-layer direction enforcement
  "boundaries/element-types": ["error", {
    default: "disallow",
    rules: [
      { from: "app",      allow: ["pages", "widgets", "features", "entities", "shared"] },
      { from: "pages",    allow: ["widgets", "features", "entities", "shared"] },
      { from: "widgets",  allow: ["features", "entities", "shared"] },
      { from: "features", allow: ["entities", "shared"] },
      { from: "entities", allow: ["shared"] },
      { from: "shared",   allow: [] },
    ]
  }],
  // Same-layer slice isolation: forbid same-type imports where slice differs
  "boundaries/no-unknown": ["error"],
  "boundaries/element-types": ["error", {
    default: "disallow",
    rules: [
      // same-layer same-slice is allowed (internal imports within a slice)
      { from: ["pages", { slice: "${slice}" }],    allow: [["pages",    { slice: "${slice}" }]] },
      { from: ["widgets", { slice: "${slice}" }],  allow: [["widgets",  { slice: "${slice}" }]] },
      { from: ["features", { slice: "${slice}" }], allow: [["features", { slice: "${slice}" }]] },
      { from: ["entities", { slice: "${slice}" }], allow: [["entities", { slice: "${slice}" }]] },
      // cross-layer rules (same as above)
      { from: "app",      allow: ["pages", "widgets", "features", "entities", "shared"] },
      { from: "pages",    allow: ["widgets", "features", "entities", "shared"] },
      { from: "widgets",  allow: ["features", "entities", "shared"] },
      { from: "features", allow: ["entities", "shared"] },
      { from: "entities", allow: ["shared"] },
      { from: "shared",   allow: [] },
    ]
  }]
}
```

Required additional package: `eslint-import-resolver-typescript` (enables `@/` alias resolution so boundary checks apply to aliased imports).

Base ESLint rules: `eslint:recommended` + `@typescript-eslint/recommended` + `eslint-config-prettier`.

---

## Toolchain Configuration

### Path Alias

Single alias `@/` mapping to `src/`, configured in both `vite.config.ts` and `tsconfig.json`.

```ts
// All imports use:
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth/model/useAuthStore"
```

### Vitest

Vitest is configured in a standalone `vitest.config.ts` that imports and merges `vite.config.ts` via `mergeConfig` from `vite`, inheriting all alias and plugin settings without duplication.

```ts
// vitest.config.ts
import { mergeConfig } from "vite"
import { defineConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/app/test-setup.ts"],
    coverage: { provider: "v8" },
  },
}))
```

- Test files: co-located with source, named `*.test.ts(x)`

### Prettier

Formatting-only responsibility. ESLint formatting rules disabled via `eslint-config-prettier` to prevent conflicts.

### Husky + lint-staged

```
git commit
  pre-commit hook
    lint-staged
      *.{ts,tsx}         → eslint --fix → prettier --write
      *.{json,md,css}    → prettier --write
  commit-msg hook
    commitlint (Conventional Commits validation)
```

### Conventional Commits

Enforced commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `revert`. (`ci` type is intentionally omitted — this template includes no CI pipeline; downstream consumers may add it when needed.)

---

## Documentation System

### CLAUDE.md (AI Tool Context)

Root-level file providing concise, structured architecture context for AI coding tools. Covers: stack, FSD layer rules, import conventions, path alias, test co-location, and commit format.

### docs/ (Human Developer Guides)

| File | Content |
|---|---|
| `docs/architecture.md` | FSD overview, layer diagram, decision rationale |
| `docs/conventions.md` | Naming rules, Conventional Commits type reference |
| `docs/layers/shared.md` | What belongs in shared, what does not |
| `docs/layers/entities.md` | Entity slice structure, `@x` cross-entity reference pattern |
| `docs/layers/features.md` | Feature slice template, segment conventions |
| `docs/layers/widgets.md` | When to create a widget vs keep in page |
| `docs/layers/pages.md` | Page-to-route mapping conventions |
| `docs/layers/app.md` | Provider composition pattern, router setup |

### src layer README.md files

Each `src/<layer>/README.md` is a concise in-editor reference for developers: layer purpose, allowed imports, segment structure, and a quick example.

---

## Key Constraints

1. `shared/` has no knowledge of any business domain
2. No slice imports another slice on the same layer
3. Cross-layer and cross-slice imports must use the `@/` alias. Relative imports (`./`, `../`) are permitted only within the same slice/segment
4. Every commit message must pass Conventional Commits validation
5. No file is committed without passing ESLint + Prettier checks
