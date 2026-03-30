---
description: 'Refactor existing code by extracting custom hooks, improving structure, or optimizing performance'
---

# Refactor Code Prompt

## Task

Refactor existing code to improve maintainability, performance, or type safety while preserving functionality.

## Requirements

### Refactoring Principles

1. **Preserve Behavior**: Refactored code must produce identical output
2. **Single Concern**: Focus on one refactoring goal at a time
3. **Type Safety**: Maintain or improve TypeScript type coverage
4. **Testability**: Make code easier to test
5. **Documentation**: Explain significant changes

### Common Refactoring Patterns

#### Extract Custom Hook
- Move stateful logic from component to hook
- Use `use` prefix for hook name
- Return object with clear property names
- Apply `useCallback` to returned functions

#### Optimize Performance
- Add `React.memo` to pure components
- Use `useMemo` for expensive calculations
- Apply `useCallback` to event handlers
- Avoid inline object/array creation in props

#### Improve Type Safety
- Remove `any` types
- Add runtime type guards
- Strengthen union types
- Add JSDoc for complex types

## Parameters

- **targetFile** (required): File path to refactor
- **goal** (required): What to improve (extract hook, optimize, etc.)
- **focus** (optional): Specific area to refactor
- **preserve** (optional): Constraints (must keep X, cannot change Y)

## Example Usage

### Example 1: Extract Hook

```
Refactor src/components/FundCard.tsx:
- Extract holdings expansion logic into useHoldingsExpansion hook
- Move to src/hooks/useHoldingsExpansion.ts
- Keep component behavior identical
- Add TypeScript types for all hook inputs/outputs
```

### Example 2: Optimize Performance

```
Optimize src/components/FundList.tsx:
- Component re-renders on every parent state change
- Apply React.memo to FundList
- Memoize fund sorting calculation
- Use useCallback for remove handler
- Target: Reduce renders by 70%+
```

### Example 3: Improve Structure

```
Refactor src/App.tsx:
- Component is too large (300+ lines)
- Extract settings panel into separate component
- Extract auto-refresh logic into custom hook
- Maintain current functionality exactly
```

## Expected Output

### For Hook Extraction

**New Hook File:**
```tsx
// src/hooks/useHoldingsExpansion.ts

import { useState, useCallback } from 'react';

export function useHoldingsExpansion(initialState = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);
  
  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);
  
  return { isExpanded, toggle, expand, collapse };
}
```

**Updated Component:**
```tsx
// src/components/FundCard.tsx

import { useHoldingsExpansion } from '../hooks/useHoldingsExpansion';

export function FundCard({ fund, layoutMode }: FundCardProps) {
  const { isExpanded, toggle } = useHoldingsExpansion();
  
  return (
    <div className="fund-card">
      {/* Component content */}
      <button onClick={toggle}>
        {isExpanded ? '收起持仓' : '查看持仓'}
      </button>
      
      {isExpanded && (
        <div className="holdings">
          {/* Holdings display */}
        </div>
      )}
    </div>
  );
}
```

### For Performance Optimization

**Before:**
```tsx
function FundList({ funds, onRemove }: FundListProps) {
  const sortedFunds = funds.sort((a, b) => 
    parseFloat(b.gszzl) - parseFloat(a.gszzl)
  );

  return (
    <div>
      {sortedFunds.map(fund => (
        <FundCard
          key={fund.fundcode}
          fund={fund}
          onRemove={() => onRemove(fund.fundcode)}
        />
      ))}
    </div>
  );
}
```

**After:**
```tsx
import { memo, useMemo, useCallback } from 'react';

export const FundList = memo(function FundList({ 
  funds, 
  onRemove 
}: FundListProps) {
  // Memoize expensive sort operation
  const sortedFunds = useMemo(() => 
    [...funds].sort((a, b) => 
      parseFloat(b.gszzl) - parseFloat(a.gszzl)
    ),
    [funds]
  );

  return (
    <div>
      {sortedFunds.map(fund => (
        <FundCard
          key={fund.fundcode}
          fund={fund}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
});

// Parent component should memoize onRemove:
function Parent() {
  const handleRemove = useCallback((code: string) => {
    setFunds(prev => prev.filter(f => f.fundcode !== code));
  }, []);
  
  return <FundList funds={funds} onRemove={handleRemove} />;
}
```

## Change Summary Template

After refactoring, provide a summary:

```markdown
## Refactoring Summary

### Changes Made
- Extracted holdings expansion logic to `useHoldingsExpansion` hook
- Updated FundCard to use new hook
- Added TypeScript types for all hook parameters

### Before/After Metrics
- FundCard.tsx: 150 lines → 120 lines (-20%)
- Hooks directory: +1 file (useHoldingsExpansion.ts)
- Type coverage: 95% → 100%

### Behavior Verification
- ✅ All existing functionality preserved
- ✅ TypeScript compilation successful
- ✅ No new linter warnings
- ✅ Manual testing passed

### Migration Notes
- No breaking changes
- Existing tests should continue to work
- New hook can be reused in other components
```

## Safety Checklist

Before applying refactored code:

- [ ] Current code committed to git
- [ ] Behavior unchanged (test manually)
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no new warnings
- [ ] No performance regressions
- [ ] All edge cases still handled

## When to Ask for Guidance

Stop and ask when:

- Multiple refactoring approaches seem equally valid
- Refactor requires changing public APIs
- Performance tradeoffs need human judgment
- Breaking changes appear unavoidable

---

**Related**: 
- Skill: `extract-hook.skill.md`, `optimize-performance.skill.md`
- Agent: `refactor.agent.md`
