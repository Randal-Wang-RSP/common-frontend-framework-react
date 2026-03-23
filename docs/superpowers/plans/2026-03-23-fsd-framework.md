# FSD Frontend Framework Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-ready React + FSD project template with full toolchain, ESLint boundary enforcement, and comprehensive architecture documentation.

**Architecture:** Feature-Sliced Design (FSD) with 6 layers (app → shared), single `@/` path alias, ESLint boundary rules enforcing cross-layer direction and same-layer slice isolation.

**Tech Stack:** React 18 · Vite 5 · TypeScript 5 (strict) · Ant Design 5 · CSS Modules · Zustand 5 · TanStack Query 5 · React Router 7 · Vitest 2 · ESLint 8 + eslint-plugin-boundaries · Prettier 3 · Husky 9 · lint-staged · commitlint

**Spec:** `docs/superpowers/specs/2026-03-23-fsd-framework-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | All dependencies and npm scripts |
| `index.html` | Vite HTML entry point |
| `tsconfig.json` | TypeScript strict config + `@/` path alias |
| `tsconfig.node.json` | TypeScript config for Vite/Vitest config files |
| `vite.config.ts` | Vite build config + React plugin + `@/` alias |
| `vitest.config.ts` | Vitest config (merges vite.config.ts via mergeConfig) |
| `.eslintrc.cjs` | ESLint + FSD boundary enforcement |
| `.prettierrc` | Prettier formatting rules |
| `.prettierignore` | Files excluded from formatting |
| `commitlint.config.cjs` | Conventional Commits validation |
| `.lintstagedrc.cjs` | lint-staged file→tool mapping |
| `.husky/pre-commit` | Runs lint-staged before commit |
| `.husky/commit-msg` | Runs commitlint on commit message |
| `.gitignore` | Git ignore patterns |
| `.env.example` | Environment variable documentation |
| `src/main.tsx` | Vite entry: mounts `<App />` |
| `src/app/index.tsx` | App root component |
| `src/app/providers/index.tsx` | QueryClientProvider + Ant Design ConfigProvider |
| `src/app/router/index.tsx` | React Router v7 BrowserRouter + Routes |
| `src/app/styles/index.css` | Global styles + CSS custom properties |
| `src/app/test-setup.ts` | Vitest setup: imports jest-dom matchers |
| `src/app/index.test.tsx` | Smoke test: App renders without error |
| `src/pages/README.md` | pages layer in-editor guide |
| `src/widgets/README.md` | widgets layer in-editor guide |
| `src/features/README.md` | features layer in-editor guide |
| `src/entities/README.md` | entities layer in-editor guide |
| `src/shared/README.md` | shared layer in-editor guide |
| `src/shared/api/instance.ts` | Axios instance with interceptors |
| `src/shared/api/instance.test.ts` | Tests: axios base URL + headers |
| `src/shared/config/env.ts` | Typed environment variable accessors |
| `src/shared/config/env.test.ts` | Tests: env defaults |
| `src/shared/lib/index.ts` | Utility functions re-export placeholder |
| `src/shared/store/index.ts` | Zustand create re-export |
| `src/shared/ui/index.ts` | Shared UI components re-export placeholder |
| `CLAUDE.md` | AI tool architecture context |
| `docs/architecture.md` | FSD overview and layer diagram |
| `docs/conventions.md` | Naming + Conventional Commits reference |
| `docs/layers/app.md` | app layer guide |
| `docs/layers/pages.md` | pages layer guide |
| `docs/layers/widgets.md` | widgets layer guide |
| `docs/layers/features.md` | features layer guide |
| `docs/layers/entities.md` | entities layer + @x pattern |
| `docs/layers/shared.md` | shared layer guide |

---

## Task 1: Initialize Git and package.json

**Files:** Create `package.json`

- [ ] **Step 1: Initialize git repository**

```bash
cd D:/source/rsp/common-frontend-framework-react
git init
git branch -m main
```

- [ ] **Step 2: Create `.gitignore`** (must exist before any `git add` to avoid staging generated files)

```
node_modules/
dist/
coverage/
.env.local
.env.*.local
*.log
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "common-frontend-framework-react",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\" \"docs/**/*.md\" \"*.md\""
  },
  "dependencies": {
    "@tanstack/react-query": "^5.62.0",
    "antd": "^5.22.0",
    "axios": "^1.7.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/coverage-v8": "^2.1.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-import-resolver-typescript": "^3.6.0",
    "eslint-plugin-boundaries": "^4.2.0",
    "eslint-plugin-import": "^2.31.0",
    "husky": "^9.1.0",
    "jsdom": "^25.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json package-lock.json
git commit -m "chore: initialize project with package.json"
```

---

## Task 2: TypeScript + Vite + entry point

**Files:** `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/app/index.tsx`

- [ ] **Step 1: Create `tsconfig.json`**

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

- [ ] **Step 2: Create `tsconfig.node.json`**

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

- [ ] **Step 3: Create `vite.config.ts`**

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

Note: Use `import.meta.url` instead of `__dirname` — the project uses `"type": "module"` in package.json, making all files ESM. Vite polyfills `__dirname` in config files but this form is explicit and portable.

- [ ] **Step 4: Create `index.html`**

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

- [ ] **Step 5: Create `src/app/index.tsx`**

```tsx
export function App() {
  return <div id="app" />
}
```

- [ ] **Step 6: Create `src/main.tsx`**

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

- [ ] **Step 7: Verify build succeeds**

```bash
npm run build
```

Expected: `dist/` created, no TypeScript or Vite errors.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: add TypeScript and Vite configuration"
```

---

## Task 3: Vitest configuration + smoke test

**Files:** `vitest.config.ts`, `src/app/test-setup.ts`, `src/app/index.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/index.test.tsx`:

```tsx
import { render } from "@testing-library/react"
import { App } from "./index"

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />)
    expect(document.getElementById("app")).toBeInTheDocument()
  })
})
```

Note: `vitest.config.ts` does not exist yet, so `npm run test:run` would fail with "no test runner found". The failure confirmation is implicit at this stage — the test cannot even run until the runner is configured. Proceed to create the config.

- [ ] **Step 2: Create `src/app/test-setup.ts`**

```ts
import "@testing-library/jest-dom"
```

- [ ] **Step 3: Create `vitest.config.ts`**

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

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run
```

Expected: 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/app/test-setup.ts src/app/index.test.tsx
git commit -m "test: add Vitest configuration and App smoke test"
```

---

## Task 4: Prettier configuration

**Files:** `.prettierrc`, `.prettierignore`

- [ ] **Step 1: Create `.prettierrc`**

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

- [ ] **Step 2: Create `.prettierignore`**

```
node_modules/
dist/
coverage/
docs/superpowers/
*.lock
```

- [ ] **Step 3: Format all source files**

```bash
npx prettier --write "src/**/*.{ts,tsx}"
```

- [ ] **Step 4: Verify no formatting issues remain**

```bash
npx prettier --check "src/**/*.{ts,tsx}"
```

Expected: All files match Prettier style.

- [ ] **Step 5: Commit**

```bash
git add .prettierrc .prettierignore
git commit -m "chore: add Prettier configuration"
```

---

## Task 5: ESLint + FSD boundary enforcement

**Files:** `.eslintrc.cjs`

- [ ] **Step 1: Create `.eslintrc.cjs`**

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
      // mode: "folder" groups all files under a folder as one element — required for slice-level grouping
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
    // FSD layer direction + same-layer slice isolation
    // capture syntax: ${slice} references the captured value from the matching element's capture array
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          { from: "app", allow: ["pages", "widgets", "features", "entities", "shared"] },
          {
            from: ["pages", { slice: "${slice}" }],
            allow: [
              ["pages", { slice: "${slice}" }],
              "widgets", "features", "entities", "shared",
            ],
          },
          {
            from: ["widgets", { slice: "${slice}" }],
            allow: [
              ["widgets", { slice: "${slice}" }],
              "features", "entities", "shared",
            ],
          },
          {
            from: ["features", { slice: "${slice}" }],
            allow: [
              ["features", { slice: "${slice}" }],
              "entities", "shared",
            ],
          },
          {
            from: ["entities", { slice: "${slice}" }],
            allow: [
              ["entities", { slice: "${slice}" }],
              "shared",
            ],
          },
          { from: "shared", allow: [] },
        ],
      },
    ],
    "boundaries/no-unknown": ["error"],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
  ignorePatterns: ["dist/", "node_modules/", "coverage/", "*.cjs"],
}
```

- [ ] **Step 2: Verify lint passes on clean source**

```bash
npm run lint
```

Expected: No errors, exit code 0.

- [ ] **Step 3: Write a boundary violation test file to verify enforcement works**

Create `src/shared/_boundary_test.ts`:

```ts
// Intentional violation: shared must not import from any layer above
import type { App } from "@/app"
export type { App }
```

- [ ] **Step 4: Run lint on violation file and confirm error is caught**

```bash
npx eslint src/shared/_boundary_test.ts
```

Expected: `boundaries/element-types` error — shared is not allowed to import from app.

If NO error is reported, `eslint-plugin-boundaries` is not resolving `@/` aliases. Debug steps:
1. Confirm `eslint-import-resolver-typescript` is installed: `ls node_modules/eslint-import-resolver-typescript`
2. Check that `tsconfig.json` paths include `"@/*": ["./src/*"]`
3. Try running with `DEBUG=eslint-plugin-boundaries:* npx eslint src/shared/_boundary_test.ts` to see resolution logs

- [ ] **Step 5: Delete the violation test file**

```bash
rm src/shared/_boundary_test.ts
```

- [ ] **Step 6: Commit**

```bash
git add .eslintrc.cjs
git commit -m "chore: add ESLint with FSD boundary enforcement"
```

---

## Task 6: Husky + lint-staged + commitlint

**Files:** `commitlint.config.cjs`, `.lintstagedrc.cjs`, `.husky/pre-commit`, `.husky/commit-msg`

- [ ] **Step 1: Create `commitlint.config.cjs`**

```js
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      // "ci" intentionally omitted — this template has no CI pipeline.
      // Downstream consumers can add it to their own commitlint.config.cjs.
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "revert"],
    ],
  },
}
```

- [ ] **Step 2: Create `.lintstagedrc.cjs`**

```js
/** @type {import('lint-staged').Config} */
module.exports = {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"],
}
```

- [ ] **Step 3: Initialize Husky**

```bash
npx husky init
```

Expected: `.husky/` directory created.

- [ ] **Step 4: Write `.husky/pre-commit`**

```sh
npx lint-staged
```

- [ ] **Step 5: Write `.husky/commit-msg`**

```sh
npx --no -- commitlint --edit "$1"
```

- [ ] **Step 6: Verify commitlint rejects invalid message**

```bash
echo "bad commit" | npx commitlint
```

Expected: Error — type may not be empty.

- [ ] **Step 7: Verify commitlint accepts valid message**

```bash
echo "feat: add feature" | npx commitlint
```

Expected: No errors, exit code 0.

- [ ] **Step 8: Commit**

```bash
git add .husky/ commitlint.config.cjs .lintstagedrc.cjs
git commit -m "chore: add Husky, lint-staged, and commitlint"
```

---

## Task 7: FSD directory skeleton + layer README files

**Files:** `src/pages/README.md`, `src/widgets/README.md`, `src/features/README.md`, `src/entities/README.md`, `src/shared/README.md`, shared subdirectory placeholders

- [ ] **Step 1: Create `src/pages/README.md`**

```markdown
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
```

- [ ] **Step 2: Create `src/widgets/README.md`**

```markdown
# widgets

Self-contained UI blocks reused across multiple pages.

**Allowed imports:** `@/features`, `@/entities`, `@/shared`
**Forbidden:** `@/app`, `@/pages`, other `@/widgets/*` slices

## When to create a widget

Only extract to a widget if the UI block appears on **two or more pages**.
If it appears on one page only, keep it in that page's slice.

## Structure

```
widgets/
└── <widget-name>/
    ├── ui/
    └── index.ts
```
```

- [ ] **Step 3: Create `src/features/README.md`**

```markdown
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
```

- [ ] **Step 4: Create `src/entities/README.md`**

```markdown
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
```

- [ ] **Step 5: Create `src/shared/README.md`**

```markdown
# shared

Foundation layer. Zero business domain knowledge.

**Allowed imports:** none
**Forbidden:** any import from `@/app`, `@/pages`, `@/widgets`, `@/features`, `@/entities`

## Subdirectories

| Directory | Contents |
|---|---|
| `api/` | Axios instance and base HTTP config |
| `config/` | Typed env variable accessors |
| `lib/` | Pure utility functions (no React, no domain) |
| `store/` | Zustand `create` re-export |
| `ui/` | Generic UI components wrapping Ant Design |

## The rule

If a function references a business concept (user, product...), it does NOT belong in shared.
```

- [ ] **Step 6: Create `.gitkeep` files for empty shared subdirectories**

```bash
touch src/shared/api/.gitkeep src/shared/config/.gitkeep src/shared/lib/.gitkeep src/shared/store/.gitkeep src/shared/ui/.gitkeep
```

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "chore: add FSD layer skeleton and in-editor README guides"
```

---

## Task 8: App layer implementation

**Files:** `src/app/providers/index.tsx`, `src/app/router/index.tsx`, `src/app/styles/index.css`, update `src/app/index.tsx`

- [ ] **Step 1: Update smoke test before changing the App component**

The current test checks for `#app` div. The updated App will use providers + router (no direct `#app` div). Update the test first so it fails, confirming the current implementation doesn't satisfy the new expectation:

```tsx
// src/app/index.test.tsx
import { render } from "@testing-library/react"
import { App } from "./index"

describe("App", () => {
  it("renders without crashing", () => {
    expect(() => render(<App />)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to confirm it passes on old implementation (and will still pass after refactor)**

```bash
npm run test:run -- src/app/index.test.tsx
```

Expected: PASS — `not.toThrow()` is satisfied by the current minimal App too.

- [ ] **Step 3: Create `src/app/styles/index.css`**

```css
:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

- [ ] **Step 4: Create `src/app/router/index.tsx`**

```tsx
import { BrowserRouter, Route, Routes } from "react-router"

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

- [ ] **Step 5: Create `src/app/providers/index.tsx`**

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

- [ ] **Step 6: Update `src/app/index.tsx`**

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

- [ ] **Step 7: Run tests**

```bash
npm run test:run
```

Expected: All tests pass.

- [ ] **Step 8: Run build**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 9: Commit**

```bash
git add src/app/
git commit -m "feat: implement app layer with providers and router"
```

---

## Task 9: Shared layer infrastructure

**Files:** `src/shared/api/instance.ts`, `src/shared/api/instance.test.ts`, `src/shared/config/env.ts`, `src/shared/config/env.test.ts`, `src/shared/lib/index.ts`, `src/shared/store/index.ts`, `src/shared/ui/index.ts`

- [ ] **Step 1: Write failing test for axios instance**

Create `src/shared/api/instance.test.ts`:

```ts
import { apiInstance } from "./instance"

describe("apiInstance", () => {
  it("uses VITE_API_BASE_URL or falls back to /api", () => {
    expect(apiInstance.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL ?? "/api")
  })

  it("has a 10-second timeout", () => {
    expect(apiInstance.defaults.timeout).toBe(10_000)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/shared/api/instance.test.ts
```

Expected: FAIL — cannot find module `./instance`.

- [ ] **Step 3: Create `src/shared/api/instance.ts`**

Remove `src/shared/api/.gitkeep` first, then create the file:

```ts
import axios from "axios"

export const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/shared/api/instance.test.ts
```

Expected: 2 tests passed.

- [ ] **Step 5: Write failing test for env config**

Create `src/shared/config/env.test.ts`:

```ts
import { env } from "./env"

describe("env", () => {
  it("exposes apiBaseUrl with /api fallback", () => {
    expect(env.apiBaseUrl).toBe(import.meta.env.VITE_API_BASE_URL ?? "/api")
  })

  it("exposes isDev as boolean", () => {
    expect(typeof env.isDev).toBe("boolean")
  })

  it("exposes mode as string", () => {
    expect(typeof env.mode).toBe("string")
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npm run test:run -- src/shared/config/env.test.ts
```

Expected: FAIL — cannot find module `./env`.

- [ ] **Step 7: Create `src/shared/config/env.ts`**

Remove `src/shared/config/.gitkeep` first, then create the file:

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

- [ ] **Step 8: Run test to verify it passes**

```bash
npm run test:run -- src/shared/config/env.test.ts
```

Expected: 3 tests passed.

- [ ] **Step 9: Create `src/shared/lib/index.ts`**

Remove `src/shared/lib/.gitkeep` first:

```ts
// Generic utility functions with no side effects, no React, no domain references.
// Add and export utility functions here as the project grows.
```

- [ ] **Step 10: Create `src/shared/store/index.ts`**

Remove `src/shared/store/.gitkeep` first:

```ts
// Re-export Zustand primitives for use in feature model files.
// Feature stores: create in features/<name>/model/use<Name>Store.ts
export { create } from "zustand"
export type { StateCreator, StoreApi, UseBoundStore } from "zustand"
```

- [ ] **Step 11: Create `src/shared/ui/index.ts`**

Remove `src/shared/ui/.gitkeep` first:

```ts
// Re-export shared UI components built on top of Ant Design.
// Components here have zero business domain knowledge.
// Example: export { PageLayout } from "./PageLayout"
```

- [ ] **Step 12: Run all tests**

```bash
npm run test:run
```

Expected: All tests pass.

- [ ] **Step 13: Commit**

```bash
git add src/shared/
git commit -m "feat: implement shared layer infrastructure"
```

---

## Task 10: CLAUDE.md

**Files:** `CLAUDE.md`

- [ ] **Step 1: Create `CLAUDE.md`**

```markdown
# Project Architecture Context

This file provides architectural context for AI coding tools. Read before suggesting code changes.

## Stack

| Concern | Technology |
|---|---|
| UI | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| Components | Ant Design 5 |
| Styling | CSS Modules (co-located: `Component.module.css`) |
| State | Zustand 5 — feature stores in `features/<name>/model/` |
| Server state | TanStack Query 5 — `useQuery` / `useMutation` |
| Routing | React Router 7 — configured in `src/app/router/` |
| HTTP | Axios — instance at `src/shared/api/instance.ts` |
| Testing | Vitest 2 + jsdom + Testing Library |

## Architecture: Feature-Sliced Design (FSD)

Code is in 6 layers. **A module may only import from layers strictly below it.**

```
Layer       Path              Responsibility
──────────────────────────────────────────────────────
app         src/app/          Global config: providers, router, styles
pages       src/pages/        Route-level components (one slice per route)
widgets     src/widgets/      Reusable UI blocks used on multiple pages
features    src/features/     User interactions with business logic
entities    src/entities/     Business domain objects (User, Product...)
shared      src/shared/       Infrastructure — zero domain knowledge
```

## Import Rules (enforced by ESLint — violations block commits)

```
app      → pages, widgets, features, entities, shared  ✅
pages    → widgets, features, entities, shared         ✅
widgets  → features, entities, shared                  ✅
features → entities, shared                            ✅
entities → shared                                      ✅
shared   → (nothing)                                   ✅

features → widgets                   ❌ ESLint error
features/auth → features/profile     ❌ ESLint error (same-layer cross-slice)
shared → entities                    ❌ ESLint error
```

## Path Alias

`@/` maps to `src/`. Use for all cross-layer and cross-slice imports:

```ts
import { apiInstance } from "@/shared/api/instance"
import { useAuthStore } from "@/features/auth/model/useAuthStore"
```

Relative imports (`./`, `../`) are only used within the same slice/segment.

## Slice Structure

```
<slice-name>/
├── ui/        React components
├── model/     State (Zustand) and business logic
├── api/       API calls using @/shared/api/instance
├── lib/       Slice-local utilities
└── index.ts   Public API — only export what consumers need
```

Consumers import from the slice root: `import { X } from "@/features/auth"` — never from internal paths.

## Tests

Test files are co-located next to source files (`*.test.ts` / `*.test.tsx`).

```bash
npm test              # watch mode
npm run test:run      # single run
npm run test:coverage # with coverage
```

## Commits

Commitlint enforces Conventional Commits on every commit:

```
feat | fix | docs | style | refactor | test | chore | perf | revert
```

Example: `feat: add user authentication`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md for AI tool architecture context"
```

---

## Task 11a: Core architecture docs

**Files:** `docs/architecture.md`, `docs/conventions.md`

- [ ] **Step 1: Create `docs/architecture.md`**

```markdown
# Architecture: Feature-Sliced Design (FSD)

This project follows the [Feature-Sliced Design](https://feature-sliced.design) methodology.

## Why FSD?

- **Predictability** — every developer knows where to find code for any feature
- **Enforced boundaries** — ESLint prevents architectural violations at commit time
- **Scalability** — adding features does not require touching existing slices
- **AI-friendly** — consistent structure produces better AI code suggestions

## Layer Diagram

```
┌─────────────────────────────────────────────┐
│  app       Global config, providers, router  │
├─────────────────────────────────────────────┤
│  pages     Route-level UI composition        │
├─────────────────────────────────────────────┤
│  widgets   Reusable multi-page UI blocks     │
├─────────────────────────────────────────────┤
│  features  User interactions + logic         │
├─────────────────────────────────────────────┤
│  entities  Business domain objects           │
├─────────────────────────────────────────────┤
│  shared    Infrastructure (zero domain)      │
└─────────────────────────────────────────────┘
     Import direction: ↓ only
```

## The Import Rule

A module may only import from layers **strictly below** it.
Same-layer cross-slice imports are also forbidden.

This is enforced by `eslint-plugin-boundaries`. Violations are ESLint errors that block commits.

## Getting Started with a New Feature

1. Define the domain object in `entities/` if a new business concept is needed
2. Build business logic and API calls in `features/`
3. Compose a page in `pages/` that uses the feature
4. Promote to `widgets/` only when UI blocks are reused across multiple pages

See `docs/layers/` for detailed per-layer guides.
```

- [ ] **Step 2: Create `docs/conventions.md`**

```markdown
# Conventions

## Naming

| Concern | Convention | Example |
|---|---|---|
| Component files | PascalCase | `LoginForm.tsx` |
| Non-component TS files | camelCase | `useAuthStore.ts` |
| Slice directories | kebab-case | `user-profile/` |
| CSS Module classes | camelCase | `.loginButton` |
| Test files | `*.test.ts(x)` | `LoginForm.test.tsx` |
| Public API file | `index.ts` | `features/auth/index.ts` |

## Slice Public API

Always import from the slice root (`index.ts`), never from internal paths:

```ts
import { LoginForm } from "@/features/auth"        // ✅
import { LoginForm } from "@/features/auth/ui/LoginForm"  // ❌
```

## CSS Modules

Co-locate style files with components:

```
features/auth/ui/
├── LoginForm.tsx
└── LoginForm.module.css
```

## Conventional Commits

| Type | Use when |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no behavior change |
| `test` | Add or fix tests |
| `chore` | Dependencies, config, tooling |
| `perf` | Performance improvement |
| `revert` | Revert a previous commit |

Validated automatically by commitlint on every commit.
```

- [ ] **Step 3: Commit**

```bash
git add docs/architecture.md docs/conventions.md
git commit -m "docs: add architecture overview and conventions guide"
```

---

## Task 11b: Layer guides

**Files:** `docs/layers/app.md`, `docs/layers/pages.md`, `docs/layers/widgets.md`, `docs/layers/features.md`, `docs/layers/entities.md`, `docs/layers/shared.md`

- [ ] **Step 1: Create `docs/layers/app.md`**

```markdown
# Layer: app

**Path:** `src/app/` — no slice subdivision

## Responsibilities

- Composing global React providers (`src/app/providers/index.tsx`)
- Defining the route tree (`src/app/router/index.tsx`)
- Global styles and Ant Design theme tokens (`src/app/styles/`)
- Vitest setup (`src/app/test-setup.ts`)

## What does NOT belong here

- Business logic → use `features/`
- Page UI → use `pages/`
- API calls → use `shared/api/` or `features/<name>/api/`

## Adding a provider

1. Import and wrap `children` in `src/app/providers/index.tsx`
2. Place global configuration (QueryClient, theme tokens) at the top of that file

## Adding a route

1. Create `src/pages/<page-name>/` with an `index.ts` public API
2. Add `<Route path="..." element={<PageComponent />} />` in `src/app/router/index.tsx`
```

- [ ] **Step 2: Create `docs/layers/pages.md`**

```markdown
# Layer: pages

**Path:** `src/pages/` — one slice per route

## Responsibilities

Composing widgets and features into a complete page layout.

## Rules

- One slice per URL route; name after the route path (`home`, `user-profile`, `settings`)
- Page components are thin — delegate business logic to features and entities
- Page-local state is acceptable but should be minimal

## Structure

```
pages/
└── home/
    ├── ui/
    │   └── HomePage.tsx
    └── index.ts          ← export { HomePage } from "./ui/HomePage"
```

## Registering a page

```ts
// src/app/router/index.tsx
import { HomePage } from "@/pages/home"
<Route path="/" element={<HomePage />} />
```
```

- [ ] **Step 3: Create `docs/layers/widgets.md`**

```markdown
# Layer: widgets

**Path:** `src/widgets/` — one slice per reusable UI block

## When to create a widget

Only extract to a widget if the **same UI block appears on two or more pages**.
Single-page UI stays in the page's slice.

## Rules

- A widget fetches its own data and manages its own local state
- No widget imports another widget
- No widget imports from `pages` or `app`

## Structure

```
widgets/
└── header/
    ├── ui/
    │   └── Header.tsx
    └── index.ts
```
```

- [ ] **Step 4: Create `docs/layers/features.md`**

```markdown
# Layer: features

**Path:** `src/features/` — one slice per user interaction

## Responsibilities

User-facing interactions with business logic: login, add-to-cart, submit-form, etc.

## Structure

```
features/
└── auth/
    ├── ui/
    │   └── LoginForm.tsx
    ├── model/
    │   └── useAuthStore.ts   ← Zustand store slice
    ├── api/
    │   └── login.ts          ← uses @/shared/api/instance
    └── index.ts
```

## Feature store

```ts
// features/auth/model/useAuthStore.ts
import { create } from "@/shared/store"

interface AuthState {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clearToken: () => set({ token: null }),
}))
```

## Feature API call

```ts
// features/auth/api/login.ts
import { apiInstance } from "@/shared/api/instance"

export async function login(credentials: { email: string; password: string }) {
  const { data } = await apiInstance.post<{ token: string }>("/auth/login", credentials)
  return data
}
```
```

- [ ] **Step 5: Create `docs/layers/entities.md`**

```markdown
# Layer: entities

**Path:** `src/entities/` — one slice per business domain object

## Responsibilities

Core domain types, base stores, and CRUD API operations for business objects (User, Product, Order...).

## Structure

```
entities/
└── user/
    ├── ui/
    │   └── UserCard.tsx
    ├── model/
    │   └── types.ts          ← TypeScript interfaces for User
    ├── api/
    │   └── userApi.ts        ← CRUD operations
    ├── @x/                   ← Cross-entity contracts (only if needed)
    │   └── post.ts
    └── index.ts
```

## Cross-entity references (@x)

Same-layer imports are forbidden. When entity A must reference entity B, use `@x`:

```
entities/user/@x/post.ts    ← defines what "post" is allowed to know about "user"
```

Entity `post` imports:
```ts
import { UserSummary } from "@/entities/user/@x/post"   // ✅
import { User } from "@/entities/user"                   // ❌ same-layer violation
```

Only create `@x/` when the cross-entity dependency is genuinely needed.
```

- [ ] **Step 6: Create `docs/layers/shared.md`**

```markdown
# Layer: shared

**Path:** `src/shared/` — no slice subdivision

## The one rule

**If a file references any business concept, it does not belong in shared.**

## Subdirectories

### api/

Axios instance pre-configured with base URL, auth token injection, and timeout.

```ts
import { apiInstance } from "@/shared/api/instance"
const { data } = await apiInstance.get<User[]>("/users")
```

### config/

Typed environment variable accessors. All VITE_ variables are centralized here.

```ts
import { env } from "@/shared/config/env"
env.apiBaseUrl  // string
env.isDev       // boolean
```

Add new env variables: (1) declare in `.env.example`, (2) add accessor in `env.ts`.

### lib/

Generic utility functions: no React, no side effects, no domain references.

### store/

Zustand re-exports. Feature stores import `create` from here.

```ts
import { create } from "@/shared/store"
```

### ui/

Generic UI components wrapping Ant Design. Export all from `src/shared/ui/index.ts`.
No business domain references permitted.
```

- [ ] **Step 7: Run lint and tests**

```bash
npm run lint && npm run test:run
```

Expected: No errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add docs/
git commit -m "docs: add full FSD architecture documentation"
```

---

## Task 12: Final verification

**Files:** `.env.example`

- [ ] **Step 1: Create `.env.example`**

```bash
# Copy to .env.local for local development. Never commit .env.local.
VITE_API_BASE_URL=http://localhost:3000/api
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 3: Run all tests with coverage**

```bash
npm run test:coverage
```

Expected: All tests pass, coverage report printed.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: Zero errors, zero warnings.

- [ ] **Step 5: Check Prettier**

```bash
npx prettier --check "src/**/*.{ts,tsx}"
```

Expected: All files formatted correctly.

- [ ] **Step 6: Final commit**

```bash
git add .env.example
git commit -m "chore: finalize template with .env.example"
```

---

## Done

Template is ready for teams to clone:

```bash
git clone <repo-url> my-new-project
cd my-new-project
npm install
npm run dev
```

Architecture docs: `docs/architecture.md` | AI context: `CLAUDE.md`
