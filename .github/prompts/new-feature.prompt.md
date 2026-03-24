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
