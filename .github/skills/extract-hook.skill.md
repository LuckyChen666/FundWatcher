---
description: 'Extract reusable logic from components into custom React hooks'
tools: []
---

# Extract Hook Skill

## Purpose

Identify and extract reusable logic from components into custom hooks, improving code organization and reusability.

## Inputs

- **sourceFile** (string, required): Path to component containing logic to extract
- **hookName** (string, required): Name for the new hook (e.g., `useFundData`)
- **logic** (string, required): Description of logic to extract
- **returnValue** (string, optional): What the hook should return

## Output

1. New hook file in `src/hooks/`
2. Updated component using the new hook
3. TypeScript types for hook inputs/outputs

## Rules

1. **Hook naming**: Must start with `use` prefix
2. **Single responsibility**: Each hook should do one thing well
3. **Type safety**: All inputs and outputs must be typed
4. **No side effects**: Unless explicitly needed (e.g., data fetching)
5. **Error handling**: Include error states in return value

## Example

### Input

```json
{
  "sourceFile": "src/components/FundCard.tsx",
  "hookName": "useFundExpansion",
  "logic": "Toggle expansion state for fund holdings",
  "returnValue": "{ isExpanded, toggle }"
}
```

### Output

**New Hook:**
```tsx
// src/hooks/useFundExpansion.ts

import { useState, useCallback } from 'react';

export function useFundExpansion(initialState = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);
  
  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);
  
  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);
  
  return { isExpanded, toggle, expand, collapse };
}
```

**Updated Component:**
```tsx
// src/components/FundCard.tsx

import { useFundExpansion } from '../hooks/useFundExpansion';

export function FundCard({ fund }: FundCardProps) {
  const { isExpanded, toggle } = useFundExpansion();
  
  return (
    <div className="fund-card">
      {/* Component content */}
      <button onClick={toggle}>
        {isExpanded ? '收起' : '展开'}
      </button>
    </div>
  );
}
```

## Common Hook Patterns

### State Management Hook
```tsx
export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  return { count, increment, decrement, reset };
}
```

### Data Fetching Hook
```tsx
export function useAsyncData<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);
  
  return { data, loading, error, execute };
}
```

## Validation

Generated hook must:

- ✅ Follow `use` naming convention
- ✅ Have TypeScript types for all parameters and return values
- ✅ Use `useCallback` for returned functions
- ✅ Handle error cases appropriately
- ✅ Be testable independently

---

**Version**: 1.0  
**Last Updated**: 2026-02-04
