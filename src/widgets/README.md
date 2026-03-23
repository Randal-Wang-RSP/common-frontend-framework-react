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
