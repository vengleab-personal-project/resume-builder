# arch-compound

Use compound components for reusable UI that has 2+ related sub-parts sharing internal state. Location: `src/components/compositions/<name>/`.

## When to Use

- Component has 2+ sub-parts that share internal state
- API should be declarative and composable

## When NOT to Use

- No sub-parts or no shared state
- Purely presentational
- A simpler props API is clearly better

Paths: `arch-folder-structure.md` → `src/components/compositions/<name>/`

> Location is `src/components/compositions/`, not flat `src/components/`. See `conflicts.md` §2.

## Incorrect: configuration props

```tsx
<List items={users} header="Users" selectable onSelect={fn} />
<Modal size="lg" centered scrollable backdrop closeOnOutside />
```

## Correct: composition API

```tsx
<List>
  <List.Header>Users</List.Header>
  <List.Item id="john">John</List.Item>
</List>

<Modal>
  <Modal.Header />
  <Modal.Body />
  <Modal.Footer />
</Modal>
```

For full implementation with all files: `patterns-compound.md`
