# patterns-compound

Full Compound Component implementation. Rule overview: `rules/arch-compound.md`.

## File Structure

```
src/components/ui/List/
├── List.tsx              # Root component + static sub-component assignments
├── ListItem.tsx          # Sub-component
├── ListHeader.tsx        # Sub-component
├── List.context.ts       # Context definition + useListContext guard hook
├── List.types.ts         # Exported TypeScript types
└── index.ts              # Public API barrel
```

## Context

```tsx
// List.context.ts
import { createContext, useContext } from 'react'

type ListContextType = {
  selectedId: string | null
  onSelect: (id: string) => void
}

const ListContext = createContext<ListContextType | null>(null)

export const useListContext = () => {
  const ctx = useContext(ListContext)
  if (!ctx) throw new Error('List sub-components must be used within <List>')
  return ctx
}

export { ListContext }
```

## Root Component

```tsx
// List.tsx
import { useState } from 'react'
import { ListContext } from './List.context'
import { ListItem } from './ListItem'
import { ListHeader } from './ListHeader'
import type { ListProps } from './List.types'

const ListRoot = ({ children }: ListProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <ListContext.Provider value={{ selectedId, onSelect: setSelectedId }}>
      <ul>{children}</ul>
    </ListContext.Provider>
  )
}

ListRoot.Item = ListItem
ListRoot.Header = ListHeader

export const List = ListRoot
```

## Sub-components

```tsx
// ListItem.tsx
import { cn } from '@/lib/utils'
import { useListContext } from './List.context'

type ListItemProps = { id: string; children: React.ReactNode }

export const ListItem = ({ id, children }: ListItemProps) => {
  const { selectedId, onSelect } = useListContext()
  return (
    <li
      onClick={() => onSelect(id)}
      className={cn('cursor-pointer px-3 py-2', selectedId === id && 'bg-accent')}
    >
      {children}
    </li>
  )
}
```

```tsx
// ListHeader.tsx
type ListHeaderProps = { children: React.ReactNode }

export const ListHeader = ({ children }: ListHeaderProps) => (
  <li className="px-3 py-2 font-semibold text-muted-foreground">{children}</li>
)
```

## Barrel

```tsx
// index.ts
export { List } from './List'
export type { ListProps } from './List.types'
```

## Usage

```tsx
<List>
  <List.Header>Users</List.Header>
  <List.Item id="john">John</List.Item>
  <List.Item id="jane">Jane</List.Item>
</List>
```
