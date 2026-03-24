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

5. **Register the route** in `src/app/router/index.tsx` — not in the page file:
   ```tsx
   import { <PageName>Page } from "@/pages/<route-name>"
   // add: <Route path="/<route>" element={<<PageName>Page />} />
   ```

6. **Check before finishing:**
   - [ ] No `useState`, `useEffect`, `useQuery` directly in the page component
   - [ ] No direct API calls — all data fetching lives in `features/`
   - [ ] Route registered in `src/app/router/`, not inside the page file
   - [ ] No imports from other pages
   - [ ] Named exports only — no default exports
