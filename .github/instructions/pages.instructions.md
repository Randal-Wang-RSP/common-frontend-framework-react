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

```ts
// ❌ Business logic or state in a page
export function HomePage() {
  const [items, setItems] = useState([])
  useEffect(() => { fetchItems().then(setItems) }, [])  // → move to features/
}

// ❌ Direct API calls in a page
export function HomePage() {
  const { data } = useQuery({ queryFn: () => apiInstance.get("/items") })  // → features/api/
}
```
