---
description: 'Add comprehensive TypeScript type definitions and type guards for runtime safety'
tools: []
---

# Add Type Safety Skill

## Purpose

Strengthen TypeScript type definitions and add runtime type guards to ensure type safety throughout the application.

## Inputs

- **targetFile** (string, required): File to add type safety to
- **focus** (string, required): What to type (API responses, props, state, etc.)
- **addGuards** (boolean, optional): Whether to add runtime type guards

## Output

1. Complete TypeScript type definitions
2. Runtime type guard functions (if requested)
3. Updated code using new types
4. Type safety validation report

## Type Definition Patterns

### 1. Basic Type Definitions

```typescript
// src/types/fund.ts

export interface FundData {
  fundcode: string;
  name: string;
  jzrq: string;           // 净值日期
  dwjz: string;           // 单位净值
  gsz: string;            // 估算净值
  gszzl: string;          // 估算涨跌幅
  gztime: string;         // 估值时间
}

export interface TopHolding {
  code: string;           // 股票代码
  name: string;           // 股票名称
  proportion: string;     // 持仓比例
}

export type LayoutMode = 'normal' | 'compact' | 'minimal';

export type RefreshInterval = 30000 | 60000 | 300000; // 30s, 1min, 5min
```

### 2. Union Types for State

```typescript
export type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: FundData }
  | { status: 'error'; error: Error };

// Usage
function handleState(state: LoadingState) {
  switch (state.status) {
    case 'idle':
      return <div>准备加载</div>;
    case 'loading':
      return <div>加载中...</div>;
    case 'success':
      return <div>{state.data.name}</div>;
    case 'error':
      return <div>错误: {state.error.message}</div>;
  }
}
```

### 3. Generic Types

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage
async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## Type Guard Patterns

### 1. Basic Type Guards

```typescript
export function isFundData(value: unknown): value is FundData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fundcode' in value &&
    'name' in value &&
    'gszzl' in value &&
    typeof (value as FundData).fundcode === 'string' &&
    typeof (value as FundData).name === 'string' &&
    typeof (value as FundData).gszzl === 'string'
  );
}

// Usage
function processFund(data: unknown) {
  if (!isFundData(data)) {
    throw new Error('Invalid fund data');
  }
  // TypeScript knows data is FundData here
  return data.name;
}
```

### 2. Array Type Guards

```typescript
export function isFundDataArray(value: unknown): value is FundData[] {
  return (
    Array.isArray(value) &&
    value.every(isFundData)
  );
}
```

### 3. Exhaustive Type Checking

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function handleLayoutMode(mode: LayoutMode) {
  switch (mode) {
    case 'normal':
      return 'Normal Layout';
    case 'compact':
      return 'Compact Layout';
    case 'minimal':
      return 'Minimal Layout';
    default:
      return assertNever(mode); // TypeScript error if case is missing
  }
}
```

## API Response Type Safety

### Pattern 1: Parse and Validate

```typescript
// src/services/fundApi.ts

import { FundData, isFundData } from '../types/fund';

export async function fetchFundData(code: string): Promise<FundData> {
  try {
    const response = await fetch(`/api/fund/${code}.js`);
    const text = await response.text();
    
    // Parse JSONP response
    const match = text.match(/jsonpgz\((.*)\)/);
    if (!match) {
      throw new Error('Invalid response format');
    }
    
    const data = JSON.parse(match[1]);
    
    // Runtime type validation
    if (!isFundData(data)) {
      throw new Error('Invalid fund data structure');
    }
    
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch fund data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

### Pattern 2: Type-Safe LocalStorage

```typescript
// src/utils/storage.ts

export function getStorageItem<T>(
  key: string,
  defaultValue: T,
  validator: (value: unknown) => value is T
): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    
    const parsed = JSON.parse(item);
    
    if (!validator(parsed)) {
      console.warn(`Invalid storage data for key: ${key}`);
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error reading storage key: ${key}`, error);
    return defaultValue;
  }
}

// Usage
const fundCodes = getStorageItem(
  'fundCodes',
  [],
  (value): value is string[] => 
    Array.isArray(value) && value.every(item => typeof item === 'string')
);
```

## Removing `any` Types

### Before (Unsafe)

```typescript
function processData(data: any) {
  return data.value.toFixed(2);
}
```

### After (Type-Safe)

```typescript
interface DataWithValue {
  value: number;
}

function isDataWithValue(data: unknown): data is DataWithValue {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as DataWithValue).value === 'number'
  );
}

function processData(data: unknown): string {
  if (!isDataWithValue(data)) {
    throw new Error('Invalid data: expected object with numeric value');
  }
  return data.value.toFixed(2);
}
```

## Strict TypeScript Configuration

Ensure `tsconfig.json` has strict settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Validation Checklist

- [ ] No `any` types (except when interfacing with untyped libraries)
- [ ] All API responses have type guards
- [ ] All LocalStorage operations are type-safe
- [ ] Union types use discriminated unions
- [ ] Generic types where appropriate
- [ ] Exhaustive type checking in switch statements
- [ ] TypeScript compiles with no errors
- [ ] No type assertions (`as`) without justification

## Example

### Input

```json
{
  "targetFile": "src/services/fundApi.ts",
  "focus": "API response validation",
  "addGuards": true
}
```

### Output

```typescript
// Updated src/services/fundApi.ts

import { FundData, isFundData, TopHolding, isTopHoldingArray } from '../types/fund';

export async function fetchFundData(code: string): Promise<FundData> {
  try {
    const response = await fetch(`/api/fund/${code}.js`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    const match = text.match(/jsonpgz\((.*)\)/);
    
    if (!match) {
      throw new Error('Invalid JSONP format');
    }
    
    const data: unknown = JSON.parse(match[1]);
    
    if (!isFundData(data)) {
      throw new Error('Invalid fund data structure');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

export async function fetchTopHoldings(code: string): Promise<TopHolding[]> {
  try {
    const response = await fetch(`/api/eastmoney/${code}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: unknown = await response.json();
    
    if (!isTopHoldingArray(data)) {
      console.warn('Invalid holdings data, using mock');
      return getMockHoldings(code);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch holdings:', error);
    return getMockHoldings(code);
  }
}
```

---

**Version**: 1.0  
**Last Updated**: 2026-02-04
