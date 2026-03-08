# arch-mock-data

Mock data has a fixed location and must flow through hooks — never imported directly into components.

Paths: `arch-folder-structure.md` → `src/mock/`

## Rules

- Lives in the mock directory (`<page-name>/index.ts`) alongside its TypeScript types
- Consumed by the page-level hook — never imported directly in a component or feature hook

## Incorrect

```tsx
// ❌ Mock imported in component
import { mockDeliveryItems } from '@/mock/deliveries'

const DeliveryListing = () => {
  return <ul>{mockDeliveryItems.map(...)}</ul>
}
```

## Correct

```tsx
// src/app/deliveries/hooks/useDeliveries.ts — page hook owns the import
import { mockDeliveryItems } from '@/mock/deliveries'

export const useDeliveries = () => ({
  items: mockDeliveryItems,
})

// DeliveryListing.tsx — receives data via props or store, never touches mock
const DeliveryListing = ({ items }: Props) => {
  return <ul>{items.map(...)}</ul>
}
```
