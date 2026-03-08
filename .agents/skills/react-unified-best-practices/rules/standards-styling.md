# standards-styling

Tailwind-only styling rules. No inline styles, no hardcoded values.

## Rules

- Tailwind utility classes only — no inline `style={}` unless the value is dynamic and cannot be expressed in Tailwind
- Use `cn()` for conditional class merging
- Semantic design tokens only — no hardcoded hex, rgb, or arbitrary color values

## Incorrect

```tsx
// ❌ inline style
<div style={{ backgroundColor: '#f4f4f5', padding: '16px' }}>

// ❌ hardcoded arbitrary value
<div className="bg-[#f4f4f5] text-[#18181b]">
```

## Correct

```tsx
// ✅ semantic tokens + cn()
<div className={cn('rounded-md p-4', isActive && 'bg-accent text-accent-foreground')}>

// ✅ semantic tokens
<div className="bg-muted text-muted-foreground">
```

## Component File Structure

Recommended order within a single component file:

1. Type definitions (`export type Props = ...`)
2. Sub-components used only in this file
3. Main component export
4. Utility / helper functions scoped to the file
