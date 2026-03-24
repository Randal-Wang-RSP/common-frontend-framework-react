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
   - [ ] No user interaction state (`useState` for editing, etc.) — interactions belong in `features/`
   - [ ] No imports from other entities directly — use `@x` pattern
   - [ ] No imports from `features/`, `widgets/`, `pages/`, `app/`
   - [ ] All exported functions have explicit return types
   - [ ] Named exports only — no default exports
