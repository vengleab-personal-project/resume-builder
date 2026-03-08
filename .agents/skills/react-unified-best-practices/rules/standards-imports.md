# standards-imports

Import rules for path aliases, ordering, and external library imports.

## Rules

- `@/` alias for all cross-folder imports — never `../../`
- External icon/component libraries: direct file path imports (not barrel)
- Internal `index.ts` barrels for feature/composition public APIs are fine

## Import Order

```tsx
// 1. React and external packages
import { useState } from 'react'
import { cn } from 'class-variance-authority'

// 2. shadcn/ui primitives
import { Button } from '@/components/ui/button'

// 3. Feature components
import { DeliveryListing } from '@/features/delivery-listing'

// 4. Types
import type { Delivery } from '@/types/delivery'

// 5. Services
import { fetchDelivery } from '@/services/deliveryService'

// 6. Local (same folder)
import { useContactFormLogic } from './hooks/useContactFormLogic'
```

## External Library Barrel Imports

Use direct file imports for icon/component libraries. Barrel imports load the entire module tree.

```tsx
// ❌ loads entire lucide-react
import { Check } from 'lucide-react'

// ✅ direct
import Check from 'lucide-react/dist/esm/icons/check'
```

Alternative: enable `experimental.optimizePackageImports` in `next.config.js` to auto-transform barrel imports at build time.

> Internal `index.ts` barrels (e.g. `@/features/delivery-listing`) are fine — the bundler tree-shakes these. Performance impact details: `vercel-react-best-practices` → `rules/bundle-barrel-imports.md`.
