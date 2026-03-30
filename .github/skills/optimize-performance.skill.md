---
description: 'Optimize React component performance by reducing unnecessary re-renders'
tools: []
---

# Optimize Performance Skill

## Purpose

Identify and fix performance bottlenecks in React components, focusing on unnecessary re-renders and expensive computations.

## Inputs

- **componentFile** (string, required): Path to component to optimize
- **issue** (string, required): Specific performance problem
- **target** (string, optional): Performance improvement goal (e.g., "reduce renders by 50%")

## Output

1. Optimized component code
2. Performance analysis report
3. Before/after comparison
4. Verification recommendations

## Optimization Techniques

### 1. Memoize Components

**Use `React.memo` for pure components:**

```tsx
// Before
export function FundCard({ fund, layoutMode }: FundCardProps) {
  return <div>{/* Render content */}</div>;
}

// After
export const FundCard = memo(function FundCard({ 
  fund, 
  layoutMode 
}: FundCardProps) {
  return <div>{/* Render content */}</div>;
});
```

### 2. Memoize Expensive Computations

**Use `useMemo` for calculations:**

```tsx
// Before
function FundList({ funds }: FundListProps) {
  const sortedFunds = funds.sort((a, b) => 
    parseFloat(b.gszzl) - parseFloat(a.gszzl)
  );
  
  return <div>{/* Render */}</div>;
}

// After
function FundList({ funds }: FundListProps) {
  const sortedFunds = useMemo(() => 
    [...funds].sort((a, b) => 
      parseFloat(b.gszzl) - parseFloat(a.gszzl)
    ),
    [funds]
  );
  
  return <div>{/* Render */}</div>;
}
```

### 3. Memoize Callbacks

**Use `useCallback` for event handlers:**

```tsx
// Before
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <Child onClick={() => setCount(count + 1)} />
  );
}

// After
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  return <Child onClick={handleClick} />;
}
```

### 4. Lazy Load Components

**Use `React.lazy` and `Suspense`:**

```tsx
// Before
import { HeavyComponent } from './HeavyComponent';

function App() {
  return (
    <div>
      <HeavyComponent />
    </div>
  );
}

// After
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>加载中...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}
```

### 5. Virtualize Long Lists

**Use windowing for large lists:**

```tsx
import { FixedSizeList } from 'react-window';

function FundList({ funds }: FundListProps) {
  return (
    <FixedSizeList
      height={600}
      itemCount={funds.length}
      itemSize={100}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <FundCard fund={funds[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

## Performance Analysis Checklist

### Identify Issues

- [ ] Profile with React DevTools Profiler
- [ ] Identify components with high render counts
- [ ] Find expensive computations in render
- [ ] Check for inline object/array/function creation
- [ ] Verify effect dependencies are optimal

### Apply Optimizations

- [ ] Add `React.memo` to pure components
- [ ] Wrap callbacks with `useCallback`
- [ ] Memoize expensive calculations with `useMemo`
- [ ] Optimize effect dependencies
- [ ] Consider code splitting for heavy components

### Verify Improvements

- [ ] Re-profile after optimization
- [ ] Measure render count reduction
- [ ] Check bundle size impact
- [ ] Test user-facing performance
- [ ] Ensure no functionality regression

## Example

### Input

```json
{
  "componentFile": "src/components/FundCard.tsx",
  "issue": "Re-renders when parent updates unrelated state",
  "target": "Prevent unnecessary re-renders"
}
```

### Analysis

1. **Identified Issue**: FundCard re-renders when parent's refresh timer updates
2. **Root Cause**: Component not memoized, props create new references
3. **Solution**: Apply `React.memo` and optimize callback props

### Output

```tsx
// Optimized FundCard

import { memo } from 'react';

interface FundCardProps {
  fund: FundData;
  layoutMode: LayoutMode;
  onRemove: (code: string) => void;
}

export const FundCard = memo(function FundCard({
  fund,
  layoutMode,
  onRemove,
}: FundCardProps) {
  // Component implementation
  
  return (
    <div className={`fund-card layout-${layoutMode}`}>
      {/* Content */}
    </div>
  );
});
```

**Parent Component:**
```tsx
function App() {
  const [funds, setFunds] = useState<FundData[]>([]);
  
  // Memoize callback to prevent FundCard re-renders
  const handleRemove = useCallback((code: string) => {
    setFunds(prevFunds => prevFunds.filter(f => f.fundcode !== code));
  }, []);
  
  return (
    <div>
      {funds.map(fund => (
        <FundCard
          key={fund.fundcode}
          fund={fund}
          layoutMode={layoutMode}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
```

## Common Pitfalls

### ❌ Over-optimization

Don't optimize prematurely. Only optimize components that:
- Render frequently
- Are expensive to render
- Cause noticeable performance issues

### ❌ Incorrect Dependencies

```tsx
// Wrong: Missing dependency
useEffect(() => {
  doSomething(value);
}, []); // Should include 'value'

// Correct
useEffect(() => {
  doSomething(value);
}, [value]);
```

### ❌ Breaking Memoization

```tsx
// Wrong: New object every render
<Component data={{ value }} />

// Correct: Memoize object
const data = useMemo(() => ({ value }), [value]);
<Component data={data} />
```

## Validation

Optimized code must:

- ✅ Reduce render count measurably
- ✅ Maintain all functionality
- ✅ Pass all existing tests
- ✅ Have no new console warnings
- ✅ Improve perceived performance

---

**Version**: 1.0  
**Last Updated**: 2026-02-04
