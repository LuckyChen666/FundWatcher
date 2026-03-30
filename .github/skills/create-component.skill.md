---
description: 'Generate a new React functional component with TypeScript support following FundWatcher conventions'
tools: []
---

# Create Component Skill

## Purpose

Generate a complete React functional component file with TypeScript types, following FundWatcher project conventions.

## Inputs

- **componentName** (string, required): Component name in PascalCase
- **props** (object, optional): Props definition with types
- **description** (string, optional): Component purpose description
- **layoutMode** (boolean, optional): Whether component supports layout modes
- **responsive** (boolean, optional): Whether component needs responsive design

## Output

A complete `.tsx` file containing:

1. TypeScript interface for props
2. Functional component implementation
3. Proper exports
4. Basic styling structure (if needed)

## Rules

1. **Always use functional components** with TypeScript
2. **Export component as named export** (not default)
3. **Props must have TypeScript interface** defined above component
4. **Apply project color semantics**: 涨红跌绿 (red for up, green for down)
5. **Conditional rendering** based on `layoutMode` if applicable
6. **Responsive design** with mobile-first approach if needed

## Example

### Input

```json
{
  "componentName": "TrendChart",
  "props": {
    "fundCode": "string",
    "data": "FundData[]",
    "layoutMode": "LayoutMode"
  },
  "description": "Display fund value trend as line chart",
  "responsive": true
}
```

### Output

```tsx
// src/components/TrendChart.tsx

import { FundData, LayoutMode } from '../types/fund';

interface TrendChartProps {
  fundCode: string;
  data: FundData[];
  layoutMode: LayoutMode;
}

export function TrendChart({ fundCode, data, layoutMode }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={`trend-chart layout-${layoutMode} empty`}>
        <p>暂无数据</p>
      </div>
    );
  }

  return (
    <div className={`trend-chart layout-${layoutMode}`}>
      <h3>趋势图 - {fundCode}</h3>
      <div className="chart-container">
        {/* Chart implementation */}
      </div>
    </div>
  );
}
```

## Validation

Generated component must:

- ✅ Compile with TypeScript (no `any` types)
- ✅ Export named component
- ✅ Have props interface defined
- ✅ Handle empty/error states
- ✅ Use project color semantics if displaying rates

---

**Version**: 1.0  
**Last Updated**: 2026-02-04
