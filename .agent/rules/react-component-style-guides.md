---
trigger: model_decision
description: when create or update logic related to React Framework such as components, hooks, context etc
---

# React Component Design Patterns

## MVVM Architecture (Required)

### Model (`services/`) - API Layer
- Pure async functions only
- No UI logic or state

```typescript
export const sendMessageToApi = async (message: string) => {
  const response = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message }) });
  return response.json();
};
```

### ViewModel (`use*Logic.ts`) - Business Logic
- ALL state (`useState`, `useReducer`)
- ALL effects (`useEffect`)
- Event handlers
- Data transformation

```typescript
export const useChatInputLogic = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  
  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };
  
  return { input, setInput, handleSubmit };
};
```

### View (`.tsx`) - Presentation Only
- ✅ Render data & trigger events
- ✅ Call custom hooks
- ❌ NO `useEffect` for logic
- ❌ NO API calls
- ❌ NO complex calculations

```typescript
const ChatInput: React.FC<Props> = ({ onSend, isLoading }) => {
  const { input, setInput, handleSubmit } = useChatInputLogic({ onSend, isLoading });
  
  return (
    <textarea value={input} onChange={(e) => setInput(e.target.value)} />
    <Button onClick={handleSubmit} />
  );
};
```

## Imports

### Use `@` Alias (Always)
```typescript
// ✅ Correct
import { Button } from '@/components/ui';
import { ChatInput } from '@/features/ChatInput';
import { sendMessageToApi } from '@/services/api';

// ❌ Wrong
import { Button } from '../../components/ui/Button';
```

### Order
1. React & external
2. `@/components/ui`
3. `@/features/*`
4. `@/types`
5. `@/services`
6. Local `./`

## Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Types: `PascalCase`
- Services: `camelCase`

## Feature Structure

```
FeatureName/
├── FeatureName.tsx           # View
├── useFeatureNameLogic.ts    # ViewModel
└── index.ts                  # Exports
```

## Critical Rules

**DO** ✅
- Separate View & ViewModel
- Keep components dumb
- ALL logic in hooks
- Use `@/` imports

**DON'T** ❌
- Logic in components
- API calls in components
- Relative imports across folders
