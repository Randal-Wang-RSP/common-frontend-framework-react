# React FSD Framework — AI Installation Guide

> This guide is intended to be read and executed by an AI coding assistant.
> Follow every step in order. Create every file with the exact content shown.
> When a project name is needed, ask the user or infer it from context.

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- Git

---

## Overview

You will build a React project template based on **Feature-Sliced Design (FSD)** with:

- React 18 + Vite + TypeScript (strict mode)
- Ant Design + CSS Modules
- Zustand (client state) + TanStack Query (server state)
- React Router v7
- Vitest + jsdom (testing)
- ESLint with `eslint-plugin-boundaries` (FSD import enforcement)
- Prettier, Husky, lint-staged, commitlint
- GitHub Copilot configuration files (`.github/`)

---

## Step 1 — Scaffold the project

```bash
npm create vite@latest <project-name> -- --template react-ts
cd <project-name>
```

---

## Step 2 — Install dependencies

```bash
npm install react-router @tanstack/react-query zustand antd axios
```

```bash
npm install -D \
  @commitlint/cli \
  @commitlint/config-conventional \
  @testing-library/jest-dom \
  @testing-library/react \
  @testing-library/user-event \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  @vitest/coverage-v8 \
  eslint-config-prettier \
  eslint-import-resolver-typescript \
  eslint-plugin-boundaries \
  eslint-plugin-import \
  husky \
  jsdom \
  lint-staged \
  prettier \
  vitest
```

---

## Step 3 — Update `package.json` scripts

Replace the `scripts` section in `package.json` with:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "lint:fix": "eslint src --ext ts,tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\" \"docs/**/*.md\" \"*.md\"",
  "prepare": "husky"
}
```

---

## Step 4 — Configure TypeScript

Replace the contents of `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Replace the contents of `tsconfig.node.json` with:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

---

## Step 5 — Configure Vite

Replace the contents of `vite.config.ts` with:

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
```

---

## Step 6 — Configure Vitest

Create `vitest.config.ts`:

```ts
import { mergeConfig } from "vite"
import { defineConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["src/app/test-setup.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        exclude: ["src/app/test-setup.ts", "src/main.tsx"],
      },
    },
  })
)
```

---

## Step 7 — Configure ESLint

Create `.eslintrc.cjs`:

```js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "boundaries", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
    },
    "boundaries/elements": [
      { type: "app",      pattern: "src/app/**",      mode: "folder" },
      { type: "pages",    pattern: "src/pages/*",     mode: "folder", capture: ["slice"] },
      { type: "widgets",  pattern: "src/widgets/*",   mode: "folder", capture: ["slice"] },
      { type: "features", pattern: "src/features/*",  mode: "folder", capture: ["slice"] },
      { type: "entities", pattern: "src/entities/*",  mode: "folder", capture: ["slice"] },
      { type: "shared",   pattern: "src/shared/**",   mode: "folder" },
    ],
    "boundaries/ignore": ["src/main.tsx"],
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          { from: ["app"], allow: ["pages", "widgets", "features", "entities", "shared"] },
          {
            from: [["pages", { slice: "*" }]],
            allow: [
              ["pages", { slice: "${from.slice}" }],
              "widgets", "features", "entities", "shared",
            ],
          },
          {
            from: [["widgets", { slice: "*" }]],
            allow: [
              ["widgets", { slice: "${from.slice}" }],
              "features", "entities", "shared",
            ],
          },
          {
            from: [["features", { slice: "*" }]],
            allow: [
              ["features", { slice: "${from.slice}" }],
              "entities", "shared",
            ],
          },
          {
            from: [["entities", { slice: "*" }]],
            allow: [
              ["entities", { slice: "${from.slice}" }],
              "shared",
            ],
          },
          { from: ["shared"], allow: [] },
        ],
      },
    ],
    "boundaries/no-unknown": ["error"],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["../../*"],
            message: "Cross-layer relative imports are forbidden. Use @/ alias instead.",
          },
        ],
      },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
  },
}
```

---

## Step 8 — Configure Prettier

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

Create `.prettierignore`:

```
node_modules/
dist/
coverage/
docs/superpowers/
*.lock
```

---

## Step 9 — Configure lint-staged

Create `.lintstagedrc.cjs`:

```js
/** @type {import('lint-staged').Config} */
module.exports = {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"],
}
```

---

## Step 10 — Configure commitlint

Create `commitlint.config.cjs`:

```js
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "revert"],
    ],
  },
}
```

---

## Step 11 — Set up Husky

```bash
npm run prepare
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg "npx --no -- commitlint --edit \"\$1\""
```

If the `husky add` command fails (Husky v9+), create the files manually:

Create `.husky/pre-commit`:

```sh
npx lint-staged
```

Create `.husky/commit-msg`:

```sh
npx --no -- commitlint --edit "$1"
```

---

## Step 12 — Create the FSD directory structure

```bash
mkdir -p src/app/providers src/app/router src/app/styles
mkdir -p src/pages src/widgets src/features src/entities
mkdir -p src/shared/api src/shared/config src/shared/lib src/shared/store src/shared/ui
```

---

## Step 13 — Create source files

### `index.html`

Replace the contents of `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `src/main.tsx`

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "@/app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

### `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />
```

### `src/app/index.tsx`

```tsx
import { AppRouter } from "./router"
import { Providers } from "./providers"
import "./styles/index.css"

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
```

### `src/app/index.test.tsx`

```tsx
import { render } from "@testing-library/react"
import { App } from "./index"

describe("App", () => {
  it("renders without crashing", () => {
    expect(() => render(<App />)).not.toThrow()
  })
})
```

### `src/app/test-setup.ts`

```ts
/// <reference types="vitest/globals" />
import "@testing-library/jest-dom"
```

### `src/app/providers/index.tsx`

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConfigProvider } from "antd"
import type { ReactNode } from "react"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>{children}</ConfigProvider>
    </QueryClientProvider>
  )
}
```

### `src/app/router/index.tsx`

```tsx
import { BrowserRouter, Routes } from "react-router"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Register page routes here. Example:
            import { HomePage } from "@/pages/home"
            <Route path="/" element={<HomePage />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}
```

### `src/app/styles/index.css`

```css
:root {
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}
```

---

## Step 14 — Create `shared` layer files

### `src/shared/api/instance.ts`

```ts
import axios from "axios"

export const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor — add auth token injection here (e.g., in features/auth)
apiInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)
```

### `src/shared/api/instance.test.ts`

```ts
import { apiInstance } from "./instance"

describe("apiInstance", () => {
  it("uses /api as the default baseURL", () => {
    expect(apiInstance.defaults.baseURL).toBe("/api")
  })

  it("has a 10-second timeout", () => {
    expect(apiInstance.defaults.timeout).toBe(10_000)
  })

  it("has a Content-Type: application/json header by default", () => {
    expect(apiInstance.defaults.headers["Content-Type"]).toBe("application/json")
  })
})
```

### `src/shared/api/index.ts`

```ts
export { apiInstance } from "./instance"
```

### `src/shared/config/env.ts`

```ts
/**
 * Typed environment variable accessors.
 * All client-exposed variables must be prefixed VITE_.
 * Add new variables here and document them in .env.example.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const
```

### `src/shared/config/env.test.ts`

```ts
import { env } from "./env"

describe("env", () => {
  it("exposes apiBaseUrl with /api fallback", () => {
    expect(env.apiBaseUrl).toBe("/api")
  })

  it("exposes isDev as boolean", () => {
    expect(typeof env.isDev).toBe("boolean")
  })

  it("exposes mode as string", () => {
    expect(typeof env.mode).toBe("string")
  })

  it("exposes isProd as boolean", () => {
    expect(typeof env.isProd).toBe("boolean")
  })
})
```

### `src/shared/config/index.ts`

```ts
export { env } from "./env"
```

### `src/shared/lib/index.ts`

```ts
// Generic utility functions with no side effects, no React, no domain references.
// Add and export utility functions here as the project grows.
```

### `src/shared/store/index.ts`

```ts
// Re-export Zustand primitives for use in feature model files.
// Feature stores: create in features/<name>/model/use<Name>Store.ts
export { create } from "zustand"
export type { StateCreator, StoreApi, UseBoundStore } from "zustand"
export { devtools } from "zustand/middleware"
```

### `src/shared/ui/index.ts`

```ts
// Re-export shared UI components built on top of Ant Design.
// Components here have zero business domain knowledge.
// Example: export { PageLayout } from "./PageLayout"
```

---

## Step 15 — Create layer README files

### `src/entities/README.md`

```md
# entities

Business domain objects — types, interfaces, and display components.

See `docs/layers/entities.md` for conventions.
```

### `src/features/README.md`

```md
# features

User interactions and business actions.

See `docs/layers/features.md` for conventions.
```

### `src/pages/README.md`

```md
# pages

Route-level assembly components.

See `docs/layers/pages.md` for conventions.
```

### `src/widgets/README.md`

```md
# widgets

Self-contained UI blocks shared across multiple pages.

See `docs/layers/widgets.md` for conventions.
```

### `src/shared/README.md`

```md
# shared

Reusable infrastructure with zero business domain knowledge.

See `docs/layers/shared.md` for conventions.
```

---

## Step 16 — Create `.env.example`

```
# API base URL — override to point at your backend
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Step 17 — Create `docs/` directory structure

```bash
mkdir -p docs/layers docs/superpowers/plans docs/superpowers/specs
```

### `docs/architecture.md`

````md
# Architecture

## Overview

This project uses [Feature-Sliced Design (FSD)](https://feature-sliced.design/)
— a methodology for organizing frontend code into **layers**, **slices**, and **segments** with strict unidirectional import rules. The goal is to make the codebase scale predictably: every piece of code has exactly one place it belongs, and the allowed dependency directions are enforced by tooling.

---

## Layer Diagram

```
app
 └── pages
      └── widgets
           └── features
                └── entities
                     └── shared
```

**Import rule:** a module may only import from layers that are strictly _below_ it in the hierarchy. `pages` can import from `widgets`, `features`, `entities`, and `shared` — but never from `app`. `shared` cannot import from any other layer.

---

## The Six Layers

### `app/`

Application bootstrapping. Contains providers (React Query, router, theme), global styles, and the top-level entry point. This layer has **no slices** — everything here is global by definition.

### `pages/`

Route-level components. One slice per route or page (e.g., `pages/home/`, `pages/user-profile/`). Pages compose widgets and features; they contain minimal logic of their own.

### `widgets/`

Self-contained UI blocks that are larger than a single feature — for example, a page header, sidebar, or dashboard panel. Widgets compose features and entities and own their own layout.

### `features/`

User interactions and business actions: login, search, applying filters, adding to cart. Each feature slice typically has a `model/` (state, hooks), `ui/` (forms, buttons), and `api/` (mutation/query hooks).

### `entities/`

Business domain objects: `user`, `order`, `product`. Entities are purely data and model focused — they expose types, stores, and display components but do not own user interactions. See [Cross-Reference Pattern](#the-x-cross-reference-pattern) for how entities reference each other.

### `shared/`

Reusable infrastructure with **zero business domain knowledge**: UI primitives (Button, Input), the HTTP client instance, generic utilities, and constants. Nothing in `shared` knows about users, orders, or any other domain concept.

```
shared/
  api/      # Axios instance and interceptors
  config/   # Typed environment variable accessors
  lib/      # Generic utility functions
  store/    # Zustand re-exports
  ui/       # Reusable UI primitives (wrapping Ant Design)
```

---

## Slice Structure

Inside every layer except `app` and `shared`, code is organized into **slices** by business domain. Each slice is a directory containing one or more **segments**:

```
features/
  auth/
    ui/        # React components (LoginForm.tsx, etc.)
    model/     # Zustand stores, hooks, TypeScript types
    api/       # React Query hooks and raw API calls
    lib/       # Slice-specific utilities
    config/    # Slice-specific constants
    index.ts   # Public API barrel
```

### Public API

Each segment exposes an `index.ts` barrel file. Code outside the slice **must** import from the barrel — never from internal files directly.

```ts
// Correct
import { LoginForm } from "@/features/auth"

// Wrong — imports an internal file
import { LoginForm } from "@/features/auth/ui/LoginForm"
```

---

## The @x Cross-Reference Pattern

Entities live on the same layer, so they cannot import each other directly. When entity `A` needs to reference a type or component from entity `B`, the pattern is:

1. Create `src/entities/b/@x/a.ts`
2. In that file, re-export only what `A` needs from `B`
3. Entity `A` imports from `@/entities/b/@x/a`

```ts
// src/entities/user/@x/order.ts
export type { UserId } from "../model/types"
```

---

## Why FSD

FSD scales well because the layer/slice/segment structure keeps related code co-located while the unidirectional import rule prevents circular dependencies from ever forming. Separation of concerns is enforced at the tooling level (ESLint `boundaries` plugin), not just by convention.
````

### `docs/conventions.md`

````md
# Conventions

## File and Folder Naming

| Thing | Convention | Example |
| ----- | ---------- | ------- |
| Folders | kebab-case | `user-profile/`, `order-list/` |
| React component files | PascalCase | `UserCard.tsx`, `LoginForm.tsx` |
| Non-component TypeScript files | camelCase | `useAuthStore.ts`, `apiInstance.ts` |
| Test files | Same name as source + `.test.ts(x)` | `UserCard.test.tsx` |
| CSS Modules | Same name as component | `UserCard.module.css` |

---

## Import Conventions

**`@/` alias** — use for all cross-layer and cross-slice imports.

```ts
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"
```

**Relative imports (`./`, `../`)** — only within the same slice or segment.

**Import order:**

1. External packages (`react`, `react-query`, etc.)
2. Internal `@/` imports
3. Relative imports

---

## Conventional Commits

Format: `<type>(<optional scope>): <description>`

| Type | Use for |
| ---- | ------- |
| `feat` | New feature or user-visible behavior |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or fixing tests |
| `chore` | Build, deps, tooling, config |
| `perf` | Performance improvements |
| `revert` | Reverting a previous commit |

---

## Component Conventions

- **One component per file**
- **Named exports only** — no default exports
- **Explicit return types** on exported functions
- **CSS Modules** — co-locate styles with the component
````

### `docs/layers/app.md`

````md
# Layer: `app`

## Purpose

The `app` layer is the application bootstrap — nothing more. It owns:

- **Providers** — all global React context providers
- **Router** — route definitions and top-level routing setup
- **Global styles** — base CSS, resets
- **Test setup** — Vitest global configuration

## Structure

```
src/app/
├── providers/        # Global React context provider composition
├── router/           # Route definitions
├── styles/
│   └── index.css     # Global resets and base styles
└── test-setup.ts     # Vitest global setup
```

## Key conventions

- `app/` is flat — no slice subdirectories
- All global providers are composed in `src/app/providers/`
- Route registration lives in `src/app/router/` — not inside page files
- `test-setup.ts` is referenced by `vitest.config.ts` via `setupFiles`

## What does NOT belong here

| What | Where it belongs instead |
| ---- | ------------------------ |
| Business logic | `features/` |
| Feature-specific state | `features/<name>/model/` |
| Entity models | `entities/<name>/model/` |
| Shared utilities | `shared/lib/` |
| Page components | `pages/` |
````

### `docs/layers/entities.md`

````md
# Layer: `entities`

## Purpose

The `entities` layer contains business domain objects — the nouns of the application. Entities model what things _are_; features model what users _do_ with them.

## Structure

```
src/entities/user/
├── model/
│   ├── types.ts
│   └── index.ts
├── ui/
│   ├── UserAvatar.tsx
│   └── index.ts
└── index.ts
```

## Key conventions

- Entities contain data types and display components only
- No API calls, no `useQuery`/`useMutation`, no user interaction state
- May only import from `shared/`
- Cross-entity references use the `@x` pattern (see below)

## The `@x` cross-reference pattern

When `entities/order` needs a type from `entities/user`:

1. Create `src/entities/user/@x/order.ts`
2. Re-export only what `order` needs from `user`
3. Inside `entities/order`, import from `@/entities/user/@x/order`

```ts
// src/entities/user/@x/order.ts
export type { UserId } from "../model"
export { UserAvatar } from "../ui"
```
````

### `docs/layers/features.md`

````md
# Layer: `features`

## Purpose

The `features` layer contains user interactions and business actions — the things the user _does_. Each slice represents one cohesive capability.

## Structure

```
src/features/auth/
├── api/
│   ├── authApi.ts
│   └── index.ts
├── model/
│   ├── useAuthStore.ts
│   ├── types.ts
│   └── index.ts
├── ui/
│   ├── LoginForm.tsx
│   └── index.ts
└── index.ts
```

## Key conventions

- `index.ts` at the slice root is the only public import point
- May import from `entities/` and `shared/` only
- Never import from another feature or upper layers
- Use Zustand from `@/shared/store`, not `zustand` directly
- Use React Query for server state; keep Zustand stores synchronous
````

### `docs/layers/pages.md`

````md
# Layer: `pages`

## Purpose

Route-level assembly components. Each slice maps to exactly one URL route. Pages compose widgets, features, and entities — they contain minimal logic of their own.

## Structure

```
src/pages/home/
├── ui/
│   ├── HomePage.tsx
│   └── index.ts
└── index.ts
```

## Key conventions

- One slice per route
- Pages only assemble — no business logic, no API calls, no state
- Route registration is in `src/app/router/`, not inside the page file
- May import from `widgets/`, `features/`, `entities/`, `shared/`
- Never import from another page
````

### `docs/layers/shared.md`

````md
# Layer: `shared`

## Purpose

Reusable infrastructure with zero business domain knowledge. The foundation every other layer builds on.

## Structure

```
src/shared/
├── api/      # Axios instance
├── config/   # Typed environment variables
├── lib/      # Generic utility functions
├── store/    # Zustand re-exports
└── ui/       # Reusable UI primitives
```

## Key conventions

- `shared/` has no slices — only segments
- Cannot import from any other layer
- Zero domain knowledge — no user, order, or other business concepts
- Always use `apiInstance` from `@/shared/api`, never raw axios
- Always use `env` from `@/shared/config`, never `import.meta.env` directly
- Always import Zustand from `@/shared/store`, never from `zustand` directly

## The domain knowledge test

Before adding to `shared/`, ask: _"Does this concept know about users, orders, or any other business entity?"_ If yes → it belongs in `entities/` or `features/`.
````

### `docs/layers/widgets.md`

````md
# Layer: `widgets`

## Purpose

Self-contained UI blocks shared across multiple pages. Larger than a single feature, smaller than a page.

## Structure

```
src/widgets/header/
├── ui/
│   ├── Header.tsx
│   └── index.ts
└── index.ts
```

## Key conventions

- Create a widget when the same UI block appears on two or more pages
- Widgets compose — they do not own business logic
- May import from `features/`, `entities/`, `shared/`
- Never import from `pages/`, `app/`, or another widget
````

---

## Step 18 — Create GitHub Copilot configuration

### `.github/copilot-instructions.md`

````md
# GitHub Copilot — Workspace Instructions

## Context

React template using **Feature-Sliced Design (FSD)** architecture, TypeScript strict mode.

**Tech stack:** React 18 · Vite · TypeScript · CSS Modules · Ant Design · Zustand · TanStack Query · React Router v7 · Vitest

> Architecture deep-dive: [`docs/architecture.md`](../docs/architecture.md)
> Naming & import conventions: [`docs/conventions.md`](../docs/conventions.md)
> Layer-specific guides: [`docs/layers/`](../docs/layers/)

---

## Architecture

Layers import **downward only** — never upward, never sideways across the same layer:

```
app → pages → widgets → features → entities → shared
```

Each layer's responsibility:
- **`app/`** — providers, router, global styles. No slices.
- **`pages/`** — one slice per route. Compose widgets/features.
- **`widgets/`** — large self-contained UI blocks.
- **`features/`** — user interactions and business actions.
- **`entities/`** — domain models, data types, display components. No user interactions.
- **`shared/`** — UI primitives, HTTP client, utilities. Zero business domain knowledge.

Each slice structure:

```
sliceName/
  ui/        # React components
  model/     # Zustand stores, hooks, types
  api/       # React Query hooks, raw API calls
  lib/       # slice-local utilities
  config/    # slice-local constants
  index.ts   # public barrel — only export what consumers need
```

---

## Never Do

```ts
// ❌ Import across same-layer slice boundary
import { getProfile } from "@/features/profile"     // inside features/auth

// ❌ Bypass the barrel — import from internal files directly
import { LoginForm } from "@/features/auth/ui/LoginForm"

// ❌ Cross-layer import using relative path
import { Button } from "../../shared/ui"

// ❌ Default export
export default function UserCard() { ... }

// ❌ any type
const data: any = response.data

// ❌ Business domain concepts in shared/
// shared/lib/getUserFullName.ts  ← domain logic does not belong here
```

---

## Patterns

**Cross-layer import — always use `@/` alias:**

```ts
// ✅
import { Button } from "@/shared/ui"
import { useAuthStore } from "@/features/auth"

// ✅ Within the same slice — relative is fine
import { loginSchema } from "../lib/validation"
```

**Cross-entity reference — use `@x` pattern:**

```ts
// src/entities/user/@x/order.ts — re-export only what order needs
export type { UserId } from "../model"

// inside entities/order:
import type { UserId } from "@/entities/user/@x/order"
```

**Named exports only:**

```ts
// ✅
export function UserCard({ user }: UserCardProps): JSX.Element { ... }

// ❌
export default function UserCard() { ... }
```

**Explicit return types on exported functions:**

```ts
// ✅
export function formatDate(date: Date): string { ... }
```

**Import order:**

```ts
// 1. External packages
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

// 2. Internal @/ imports
import { Button } from "@/shared/ui"

// 3. Relative imports
import { loginSchema } from "../lib/validation"
import styles from "./LoginForm.module.css"
```

**Naming:**
- Components / types / interfaces → `PascalCase`
- Functions / variables / hooks → `camelCase`
- Files and folders → `kebab-case`
- React hooks → `useXxxStore`, `useXxxQuery`

**Prettier (auto-applied on commit):** no semicolons · double quotes · 100-char width · 2-space indent · ES5 trailing commas

**Testing:** co-locate `authStore.ts` → `authStore.test.ts` · Vitest globals (`describe`, `it`, `expect`) need no imports

**Commits:** `feat(auth): add JWT refresh logic` · `fix(cart): prevent duplicate items`
Types: `feat | fix | docs | style | refactor | test | chore | perf | revert`

**Env vars:** prefix client-side vars with `VITE_`

---

## Workflow

> Detailed layer conventions auto-load via `.github/instructions/` when editing files in that layer.
> Complex multi-step tasks: use `.github/prompts/` prompt files.
> Deep library patterns (Zustand, React Query, FSD refactoring): see `.github/skills/`.

**Adding a new feature slice:**
1. Create `src/features/<name>/` with only the segments you need
2. Build in order: `model/` → `api/` → `ui/`
3. Export public API via `index.ts` only — never expose internals
4. If two features need to share something, move it to `entities/` or `shared/`

**Adding a new entity:**
1. Create `src/entities/<name>/` with `model/` (types) and `ui/` (display components)
2. No side effects, no API calls, no user interactions in entities
3. For cross-entity type sharing, create `src/entities/<name>/@x/<consumer>.ts`

**Adding a new page:**
1. Create `src/pages/<route-name>/ui/<PageName>.tsx`
2. Register the route in `src/app/router/` — not inside the page file
3. Pages only compose — no business logic, no direct API calls

**Touching `shared/`:**
- Verify the concept has zero domain knowledge before adding
- If it involves any business entity (user, order, etc.) → belongs in `entities/` or `features/`
- Import from `@/shared/store` (not `zustand`), `@/shared/api` (not `axios`) directly
````

### `.github/instructions/entities.instructions.md`

````md
---
applyTo: "src/entities/**"
---

# Layer: `entities`

Business domain objects — the **nouns** of the application. Entities model what things *are*; features model what users *do* with them.

Full reference: [`docs/layers/entities.md`](../../docs/layers/entities.md)

## Slice Structure

```
src/entities/<name>/
  model/     # TypeScript interfaces, types, pure selector/helper functions
  ui/        # Display components (avatars, cards, badges)
  @x/        # Cross-entity re-export files (see below)
  index.ts   # public API barrel
```

## Import Rules

```ts
// ✅ Entities may only import from shared
import { apiInstance } from "@/shared/api"

// ❌ Never import from features, widgets, pages, or app
import { useAuthStore } from "@/features/auth"

// ❌ Never import directly from another entity
import { User } from "@/entities/user"  // inside entities/order — use @x instead
```

## Cross-Entity Reference — `@x` Pattern

When one entity needs a type or component from another entity, use an explicit re-export file instead of a direct import:

```ts
// 1. Create src/entities/user/@x/order.ts
export type { User, UserId } from "../model"
export { UserAvatar } from "../ui"

// 2. Inside entities/order — import from the @x file
import type { UserId } from "@/entities/user/@x/order"
```

## Never Do

- API calls or `useQuery`/`useMutation` in entities
- User interaction state (`useState` for editing) — that belongs in `features/`
- Direct imports from other entities — always use `@x`
- Default exports
- Missing return types on exported functions
````

### `.github/instructions/features.instructions.md`

````md
---
applyTo: "src/features/**"
---

# Layer: `features`

User interactions and business actions. Each slice = one cohesive capability.

Full reference: [`docs/layers/features.md`](../../docs/layers/features.md)

## Slice Structure

```
src/features/<name>/
  api/       # React Query mutations/queries + raw API calls
  model/     # Zustand store, derived state, TypeScript types
  ui/        # React components specific to this feature
  index.ts   # public API barrel
```

Only create segments you need. A simple feature may only need `ui/` and `model/`.

## Import Rules

```ts
// ✅ Features may import from
import { User } from "@/entities/user"
import { apiInstance } from "@/shared/api"

// ❌ Never import from another feature
import { getProfile } from "@/features/profile"  // inside features/auth

// ❌ Never import from upper layers
import { HomePage } from "@/pages/home"
```

## State

Use Zustand for feature-local state. Import from `@/shared/store`, not directly from `zustand`:

```ts
// ✅
import { create, devtools } from "@/shared/store"

// ❌
import { create } from "zustand"
```

## Public API Barrel

Export only what consumers need. Internal helpers stay private:

```ts
// src/features/auth/index.ts
export { LoginForm } from "./ui"
export { useAuthStore } from "./model"
export type { AuthUser } from "./model"
```

## Never Do

- Import from another feature or upper layers
- Import `create` directly from `zustand` — use `@/shared/store`
- Async logic inside Zustand stores — use React Query mutations instead
- Default exports
- Missing return types on exported functions
````

### `.github/instructions/pages.instructions.md`

````md
---
applyTo: "src/pages/**"
---

# Layer: `pages`

Route-level assembly points. Pages compose widgets, features, and entities — they contain minimal logic of their own.

Full reference: [`docs/layers/pages.md`](../../docs/layers/pages.md)

## Slice Structure

```
src/pages/<route-name>/
  ui/
    <PageName>.tsx   # route component
    index.ts
  index.ts           # public API barrel (re-exports page component)
```

One slice per route. Slice name reflects the route: `home`, `user-profile`, `order-detail`.

## Import Rules

```ts
// ✅ Pages may import from
import { DashboardWidget } from "@/widgets/dashboard"
import { LoginForm } from "@/features/auth"
import { UserAvatar } from "@/entities/user"
import { Button } from "@/shared/ui"

// ❌ Never import from another page
import { HomePage } from "@/pages/home"  // inside pages/dashboard

// ❌ Never import from app
import { router } from "@/app/router"
```

## Route Registration

The page file is **only** a React component. Register it at a URL path in `src/app/router/` — not inside the page file:

```tsx
// ✅ src/app/router/index.tsx
import { UserProfilePage } from "@/pages/user-profile"
<Route path="/profile" element={<UserProfilePage />} />

// ❌ Do not define routes inside page files
```

## Never Do

- Business logic or `useState`/`useEffect` in a page — move to `features/`
- Direct API calls in a page — move to `features/api/`
- Import from another page
- Default exports
````

### `.github/instructions/shared.instructions.md`

````md
---
applyTo: "src/shared/**"
---

# Layer: `shared`

Reusable infrastructure with **zero business domain knowledge**. The foundation every other layer builds on.

Full reference: [`docs/layers/shared.md`](../../docs/layers/shared.md)

## Structure

`shared/` has no slices — only segments:

```
src/shared/
  api/       # Axios instance + interceptors
  config/    # Typed env var accessors
  lib/       # Generic utility functions
  store/     # Zustand re-exports
  ui/        # Reusable UI primitives (wrapping Ant Design)
```

## Segment Usage

```ts
// HTTP client — always use the shared instance
import { apiInstance } from "@/shared/api"

// Env vars — never read import.meta.env directly in feature/entity code
import { env } from "@/shared/config"
const url = env.apiBaseUrl

// Zustand — import from here, not from "zustand" directly
import { create, devtools } from "@/shared/store"

// UI primitives — use project wrappers, not antd directly
import { Button } from "@/shared/ui"
```

## Import Rules

```ts
// ❌ shared cannot import from any other layer
import { User } from "@/entities/user"   // FORBIDDEN
import { useAuthStore } from "@/features/auth"  // FORBIDDEN
```

## The Domain Knowledge Test

Before adding anything to `shared/`, ask: *"Does this concept know about users, orders, or any other business entity?"*

```ts
// ✅ Belongs in shared — pure utility, no domain knowledge
export function formatCurrency(amount: number, currency: string): string { ... }

// ❌ Does NOT belong in shared — knows about the User domain
export function getUserFullName(user: User): string { ... }
// → move to entities/user/model/ or features/<name>/lib/
```
````

### `.github/instructions/test.instructions.md`

````md
---
applyTo: "**/*.test.{ts,tsx}"
---

# Testing Conventions

## Co-location

Tests live next to the source file they test:

```
model/
  authStore.ts
  authStore.test.ts
ui/
  LoginForm.tsx
  LoginForm.test.tsx
```

## Vitest Globals

`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` are available globally — no imports needed:

```ts
// ✅
describe("useAuthStore", () => {
  it("sets user on login", () => {
    expect(store.user).toBeNull()
  })
})

// ❌ Do not import vitest globals
import { describe, it, expect } from "vitest"
```

## Component Tests

Use `@testing-library/react` for component tests:

```tsx
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { LoginForm } from "./LoginForm"

it("shows error on empty submit", async () => {
  render(<LoginForm />)
  await userEvent.click(screen.getByRole("button", { name: /login/i }))
  expect(screen.getByText(/required/i)).toBeInTheDocument()
})
```

## Store Tests

Test Zustand stores by importing the hook and calling actions directly:

```ts
import { useAuthStore } from "./useAuthStore"

beforeEach(() => {
  useAuthStore.setState({ user: null })
})

it("sets user", () => {
  useAuthStore.getState().setUser({ id: "1", name: "Alice" })
  expect(useAuthStore.getState().user).toEqual({ id: "1", name: "Alice" })
})
```
````

### `.github/instructions/widgets.instructions.md`

````md
---
applyTo: "src/widgets/**"
---

# Layer: `widgets`

Self-contained UI blocks shared across multiple pages. Larger than a single feature, smaller than a page.

Full reference: [`docs/layers/widgets.md`](../../docs/layers/widgets.md)

## Slice Structure

```
src/widgets/<name>/
  ui/
    <WidgetName>.tsx
    index.ts
  index.ts           # public API barrel
```

## When to Create a Widget

Extract to a widget when the same UI block appears on **two or more pages**. If it's only used by one page, keep it inside that page's `ui/` segment.

## Import Rules

```ts
// ✅ Widgets may import from
import { LoginForm } from "@/features/auth"
import { UserAvatar } from "@/entities/user"
import { Button } from "@/shared/ui"

// ❌ Never import from pages or app
import { HomePage } from "@/pages/home"

// ❌ Never import from another widget
import { Sidebar } from "@/widgets/sidebar"  // inside widgets/header
```

## Never Do

- Own business logic — widgets only compose
- Define routes or navigation logic
- Default exports
````

### `.github/prompts/new-feature.prompt.md`

````md
---
description: Create a complete FSD feature slice following project conventions.
---

# New Feature Slice

Create a complete FSD feature slice following project conventions.

## Steps

1. **Determine the slice name** — use kebab-case, e.g. `user-search`, `create-order`

2. **Read the layer guide** before generating any code:
   - `.github/instructions/features.instructions.md`

3. **Create only the segments needed.** A typical feature:
   ```
   src/features/<name>/
     model/
       use<Name>Store.ts    # Zustand store (if stateful)
       types.ts             # TypeScript interfaces
       index.ts
     api/
       <name>Api.ts         # React Query hooks + raw API calls
       index.ts
     ui/
       <ComponentName>.tsx  # main UI component
       index.ts
     index.ts               # public barrel
   ```

4. **Build in order:** `model/` → `api/` → `ui/`

5. **Write the `index.ts` barrel last** — export only what consumers need:
   ```ts
   export { ComponentName } from "./ui"
   export { use<Name>Store } from "./model"
   export type { <Name>Item } from "./model"
   ```

6. **Check before finishing:**
   - [ ] No imports from other features (`@/features/*`)
   - [ ] No imports from upper layers (`@/pages/*`, `@/widgets/*`)
   - [ ] Zustand imported from `@/shared/store`, not `zustand`
   - [ ] All exported functions have explicit return types
   - [ ] Named exports only — no default exports
````

### `.github/prompts/new-entity.prompt.md`

````md
---
description: Create a complete FSD entity slice following project conventions.
---

# New Entity Slice

Create a complete FSD entity slice following project conventions.

## Steps

1. **Determine the entity name** — use kebab-case singular, e.g. `user`, `order`, `product`

2. **Read the layer guide** before generating any code:
   - `.github/instructions/entities.instructions.md`

3. **Create only the segments needed:**
   ```
   src/entities/<name>/
     model/
       types.ts             # TypeScript interfaces/types
       index.ts
     ui/
       <EntityCard>.tsx     # display component(s), if needed
       index.ts
     index.ts               # public barrel
   ```

4. **Write the `index.ts` barrel** — expose types and display components:
   ```ts
   export type { User, UserId } from "./model"
   export { UserAvatar, UserCard } from "./ui"
   ```

5. **If another entity needs types from this one**, create an `@x` file:
   ```
   src/entities/<name>/@x/<consumer>.ts
   ```
   ```ts
   // Re-export only what the consumer entity needs
   export type { UserId } from "../model"
   ```

6. **Check before finishing:**
   - [ ] No API calls or `useQuery`/`useMutation` in entities
   - [ ] No user interaction state — interactions belong in `features/`
   - [ ] No imports from other entities directly — use `@x` pattern
   - [ ] No imports from `features/`, `widgets/`, `pages/`, `app/`
   - [ ] All exported functions have explicit return types
   - [ ] Named exports only — no default exports
````

### `.github/prompts/new-page.prompt.md`

````md
---
description: Create a new route-level page following project conventions.
---

# New Page

Create a new route-level page following project conventions.

## Steps

1. **Determine the route name** — use kebab-case matching the URL path, e.g. `user-profile`, `order-detail`

2. **Read the layer guide** before generating any code:
   - `.github/instructions/pages.instructions.md`

3. **Create the page component:**
   ```
   src/pages/<route-name>/
     ui/
       <PageName>.tsx       # route component — compose only, no logic
       index.ts
     index.ts               # public barrel
   ```

4. **Page component structure** — import and arrange, do not implement:
   ```tsx
   import { SomeWidget } from "@/widgets/some-widget"
   import { SomeFeatureForm } from "@/features/some-feature"

   export function <PageName>Page(): JSX.Element {
     return (
       <div>
         <SomeWidget />
         <SomeFeatureForm />
       </div>
     )
   }
   ```

5. **Register the route** in `src/app/router/index.tsx` — not in the page file

6. **Check before finishing:**
   - [ ] No `useState`, `useEffect`, `useQuery` directly in the page component
   - [ ] No direct API calls
   - [ ] Route registered in `src/app/router/`, not inside the page file
   - [ ] No imports from other pages
   - [ ] Named exports only — no default exports
````

### `.github/skills/README.md`

```md
# Skills

On-demand deep knowledge for GitHub Copilot.

## How Skills Work

Copilot reads each skill's `description` frontmatter and loads the full content only when the user's request matches. Skills are **not** auto-injected — they are invoked on demand.

## Available Skills

| Skill | Triggers when… |
|-------|---------------|
| [`zustand-patterns`](./zustand-patterns/SKILL.md) | Writing or reviewing Zustand stores |

## Adding a New Skill

1. Create `.github/skills/<name>/SKILL.md`
2. Write a `description` frontmatter that starts with "Use when…"
3. Add the skill to the table above
```

### `.github/skills/zustand-patterns/SKILL.md`

````md
---
description: >
  Use when writing, reviewing, or debugging Zustand stores in this project.
  Covers store file structure, devtools setup, typed state/actions pattern,
  slice composition, testing stores, and how to import from @/shared/store
  instead of zustand directly.
---

# Zustand Patterns

This skill covers the project-specific conventions for writing Zustand stores inside `features/<name>/model/`.

Full Zustand docs: https://zustand.docs.pmnd.rs

---

## Import from `@/shared/store`

Never import from `zustand` directly. The project re-exports Zustand from `@/shared/store`:

```ts
// ✅
import { create } from "@/shared/store"

// ❌
import { create } from "zustand"
```

---

## Store File Structure

One store per feature. File name: `use<FeatureName>Store.ts`. Place in `features/<name>/model/`.

```ts
// src/features/auth/model/useAuthStore.ts
import { create } from "@/shared/store"
import type { AuthUser } from "./types"

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isLoading: false,
}

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}))
```

**Conventions:**

- Split the type into `State` + `Actions` interfaces
- Extract `initialState` as a const — needed for `reset()` and tests
- Actions are plain functions using `set`, not async — async logic belongs in `api/`

---

## Devtools (optional but recommended)

```ts
import { create, devtools } from "@/shared/store"

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user }, false, "auth/setUser"),
      reset: () => set(initialState, false, "auth/reset"),
    }),
    { name: "AuthStore" }
  )
)
```

---

## Accessing State Outside React

```ts
const { setUser } = useAuthStore.getState()
setUser(responseData.user)
```

---

## Derived / Computed Values

Prefer selectors over storing derived values:

```ts
// ✅ derive in a selector
const isAuthenticated = useAuthStore((state) => state.user !== null)

// ❌ don't store derived values
const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
```

---

## Async Actions

Async logic does **not** belong in the store. Use React Query mutations:

```ts
// ✅
const { mutate: login } = useMutation({
  mutationFn: (credentials: LoginCredentials) =>
    apiInstance.post<AuthUser>("/auth/login", credentials),
  onSuccess: (user) => useAuthStore.getState().setUser(user),
  onError: () => useAuthStore.getState().setUser(null),
})
```

---

## Testing Stores

```ts
import { useAuthStore } from "./useAuthStore"

beforeEach(() => {
  useAuthStore.setState({ user: null, isLoading: false })
})

it("setUser updates the user", () => {
  const user = { id: "1", name: "Alice" }
  useAuthStore.getState().setUser(user)
  expect(useAuthStore.getState().user).toEqual(user)
})

it("reset clears user", () => {
  useAuthStore.setState({ user: { id: "1", name: "Alice" } })
  useAuthStore.getState().reset()
  expect(useAuthStore.getState().user).toBeNull()
})
```
````

---

## Step 19 — Initialize git and run setup

```bash
git init
git add .
npm run prepare
```

---

## Step 20 — Verify the setup

```bash
# Type check
npx tsc --noEmit

# Run tests
npm run test:run

# Lint check
npm run lint
```

All three commands should pass without errors.

---

## Step 21 — Make initial commit

```bash
git add .
git commit -m "chore: initialize React FSD project template"
```

---

## Done

The project is ready. Key facts:

- `@/` alias maps to `src/`
- FSD layer boundaries are enforced by ESLint (`eslint-plugin-boundaries`) — violations block commits via Husky
- Prettier runs automatically on commit via lint-staged
- Commit messages are validated by commitlint
- GitHub Copilot workspace instructions are in `.github/copilot-instructions.md`
- Layer-specific Copilot instructions auto-load from `.github/instructions/`
- Prompt templates for new slices are in `.github/prompts/`
- Deep-dive skills for libraries are in `.github/skills/`
