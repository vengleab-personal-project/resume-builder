# arch-page-feature-separation

Pages are route entry points that compose features. Features own their own logic and are reusable across pages.

Paths: `arch-folder-structure.md` → `src/app/` and `src/features/`

## Rules

- **Pages** (`page.tsx`) — composition only, zero business logic inline
- **Page hooks** (`hooks/use<PageName>.ts`) — route-specific data wiring only
- **Features** — reusable; must not be hard-coded to one route
- New pages use `npm run generate:page -- <name>` (creates page, hook, and mock)

## Incorrect: logic in page

```tsx
// src/app/deliveries/page.tsx
export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([])

  useEffect(() => {
    fetch('/api/deliveries').then(r => r.json()).then(setDeliveries)
  }, [])

  return <DeliveryListing items={deliveries} />
}
```

## Correct: page composes, hook wires

```tsx
// src/app/deliveries/page.tsx
export default function DeliveriesPage() {
  return <DeliveryListing />
}

// src/app/deliveries/hooks/useDeliveries.ts
export const useDeliveries = () => {
  const { items, isLoading } = useDeliveryStore()
  return { items, isLoading }
}
```

## Red flags (code-review-agent)

- Business logic or API calls inside `page.tsx`
- Feature component that only works for one specific page
- Mock data imported directly in a component (must go via hook)
