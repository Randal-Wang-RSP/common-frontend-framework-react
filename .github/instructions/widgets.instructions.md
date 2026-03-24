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
// → shared dependency belongs in features/, entities/, or shared/
```

## Never Do

```ts
// ❌ Own business logic — widgets only compose and arrange
export function Header() {
  const [user, setUser] = useState(null)
  useEffect(() => { fetchUser().then(setUser) }, [])  // → move to features/
}

// ❌ Define routes or navigation logic
// → belongs in app/router/
```
