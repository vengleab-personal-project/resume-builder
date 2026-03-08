# standards-typescript

TypeScript rules for all components and hooks.

## Rules

- Named `type` or `interface` for props — always exported
- `ReactNode` for children props
- Discriminated unions for variants
- No `any` — use proper types or `unknown`
- No `React.FC` — use plain function declarations with typed props
- Props interfaces defined for all components

## Incorrect

```tsx
// ❌ React.FC
const Button: React.FC<Props> = ({ label, onClick }) => { ... }

// ❌ implicit any
const process = (data) => { ... }

// ❌ unexported / anonymous type
const Card = ({ title }: { title: string }) => { ... }
```

## Correct

```tsx
// ✅
export type ButtonProps = {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => {
  return <button onClick={onClick}>{label}</button>
}
```

## Discriminated Unions for Variants

```tsx
type AlertProps =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string; retry?: () => void }

const Alert = (props: AlertProps) => {
  if (props.type === 'error') {
    return <div>{props.message} {props.retry && <button onClick={props.retry}>Retry</button>}</div>
  }
  return <div>{props.message}</div>
}
```
