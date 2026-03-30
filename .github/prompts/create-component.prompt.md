---
description: 'Create a new React functional component with TypeScript, styling, and proper error handling'
---

# Create Component Prompt

## Task

Generate a complete React functional component following FundWatcher project conventions.

## Requirements

### Component Structure

1. **TypeScript Interface**: Define props interface above component
2. **Functional Component**: Use arrow function or function declaration
3. **Named Export**: Export component as named export (not default)
4. **Error Handling**: Handle empty/null states gracefully
5. **Accessibility**: Include proper ARIA labels and semantic HTML

### Styling

1. **CSS Classes**: Use descriptive class names with BEM-like convention
2. **Layout Mode Support**: Implement conditional rendering if layoutMode prop is provided
3. **Responsive Design**: Mobile-first approach with responsive breakpoints
4. **Color Semantics**: Apply correct Chinese stock market colors (涨红跌绿)

### Type Safety

1. **No `any` Types**: All props and state must have explicit types
2. **Strict Null Checks**: Handle nullable values properly
3. **Type Imports**: Import types from `src/types/`

## Parameters

- **componentName** (required): Name in PascalCase
- **props** (required): TypeScript props definition
- **description** (optional): What the component does
- **layoutMode** (optional): Whether component supports layout modes
- **hasInteraction** (optional): Whether component has user interactions

## Example Usage

```
Create a FundStatistics component that:
- Accepts funds: FundData[] and layoutMode: LayoutMode
- Displays total count, average gain/loss, best/worst performers
- Shows minimal info in minimal mode
- Uses correct color coding for gains/losses
```

## Expected Output

```tsx
// src/components/FundStatistics.tsx

import { FundData, LayoutMode } from '../types/fund';

interface FundStatisticsProps {
  funds: FundData[];
  layoutMode: LayoutMode;
}

export function FundStatistics({ funds, layoutMode }: FundStatisticsProps) {
  if (funds.length === 0) {
    return (
      <div className={`fund-statistics layout-${layoutMode} empty`}>
        <p>暂无基金数据</p>
      </div>
    );
  }

  const totalGain = funds.reduce((sum, fund) => 
    sum + parseFloat(fund.gszzl || '0'), 0
  );
  const avgGain = totalGain / funds.length;

  const bestFund = funds.reduce((best, fund) => 
    parseFloat(fund.gszzl) > parseFloat(best.gszzl) ? fund : best
  );

  const worstFund = funds.reduce((worst, fund) => 
    parseFloat(fund.gszzl) < parseFloat(worst.gszzl) ? fund : worst
  );

  const isMinimal = layoutMode === 'minimal';

  return (
    <div className={`fund-statistics layout-${layoutMode}`}>
      <h2 className="statistics-title">统计概览</h2>
      
      <div className="statistics-grid">
        <div className="stat-item">
          <span className="stat-label">总数</span>
          <span className="stat-value">{funds.length}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">平均涨跌幅</span>
          <span className={`stat-value ${avgGain >= 0 ? 'stock-up' : 'stock-down'}`}>
            {avgGain >= 0 ? '+' : ''}{avgGain.toFixed(2)}%
          </span>
        </div>

        {!isMinimal && (
          <>
            <div className="stat-item">
              <span className="stat-label">最佳</span>
              <span className="stat-value stock-up">
                {bestFund.name} ({parseFloat(bestFund.gszzl).toFixed(2)}%)
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">最差</span>
              <span className="stat-value stock-down">
                {worstFund.name} ({parseFloat(worstFund.gszzl).toFixed(2)}%)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

## Validation Checklist

- [ ] Component compiles with TypeScript (no errors)
- [ ] All props have TypeScript types
- [ ] Empty/error states handled
- [ ] Color semantics correct (涨红跌绿)
- [ ] Responsive design implemented
- [ ] Accessibility attributes included
- [ ] Named export used

---

**Related**: 
- Skill: `create-component.skill.md`
- Agent: `frontend.agent.md`
