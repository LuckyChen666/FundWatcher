---
description: 'Generate comprehensive unit tests for components, hooks, and utilities'
---

# Generate Tests Prompt

## Task

Generate complete unit tests for React components, custom hooks, or utility functions following testing best practices.

## Requirements

### Test Structure

1. **Describe Blocks**: Group related tests logically
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Descriptive Names**: Test names describe behavior, not implementation
4. **Setup/Teardown**: Use `beforeEach`/`afterEach` for cleanup
5. **Edge Cases**: Cover boundary conditions and error states

### Testing Principles

1. **Test Behavior, Not Implementation**: Focus on what happens, not how
2. **User-Centric**: Simulate real user interactions
3. **Isolated Tests**: Each test should run independently
4. **Readable Tests**: Tests are documentation
5. **Fast Execution**: Avoid unnecessary delays

### Coverage Goals

- **Happy Path**: Normal usage scenarios
- **Edge Cases**: Empty data, null values, boundary conditions
- **Error States**: Network failures, invalid input, exceptions
- **User Interactions**: Clicks, inputs, navigation
- **Accessibility**: ARIA labels, keyboard navigation (for components)

## Parameters

- **targetFile** (required): File to generate tests for
- **testType** (required): 'component', 'hook', or 'utility'
- **coverage** (optional): Specific scenarios to cover
- **mockData** (optional): Whether to create mock data utilities

## Example Usage

### Example 1: Component Tests

```
Generate tests for src/components/FundCard.tsx:
- Test all layoutMode variants (normal, compact, minimal)
- Test positive/negative rate display with correct colors
- Test holdings expansion interaction
- Test remove button functionality
- Include edge case: empty fund data
```

### Example 2: Hook Tests

```
Generate tests for src/hooks/useFunds.ts:
- Test initial data fetch
- Test periodic refresh
- Test error handling (network failure)
- Test data persistence to LocalStorage
- Test adding/removing fund codes
```

### Example 3: Utility Tests

```
Generate tests for src/services/fundApi.ts:
- Test successful JSONP parsing
- Test invalid response format handling
- Test network error handling
- Test multiple concurrent requests
```

## Expected Output

### Component Test Example

```tsx
// src/components/FundCard.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FundCard } from './FundCard';
import { createMockFund } from '../test-utils/mockData';

describe('FundCard', () => {
  const mockFund = createMockFund();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    mockOnRemove.mockClear();
  });

  describe('rendering', () => {
    test('displays fund name and code', () => {
      render(
        <FundCard 
          fund={mockFund} 
          layoutMode="normal" 
          onRemove={mockOnRemove} 
        />
      );

      expect(screen.getByText(mockFund.name)).toBeInTheDocument();
      expect(screen.getByText(mockFund.fundcode)).toBeInTheDocument();
    });

    test('displays rate with correct color for positive value', () => {
      const positiveFund = createMockFund({ gszzl: '2.5' });
      render(
        <FundCard 
          fund={positiveFund} 
          layoutMode="normal" 
          onRemove={mockOnRemove} 
        />
      );

      const rateElement = screen.getByText(/2.5%/);
      expect(rateElement).toHaveClass('stock-up'); // Red for positive
    });

    test('displays rate with correct color for negative value', () => {
      const negativeFund = createMockFund({ gszzl: '-1.8' });
      render(
        <FundCard 
          fund={negativeFund} 
          layoutMode="normal" 
          onRemove={mockOnRemove} 
        />
      );

      const rateElement = screen.getByText(/-1.8%/);
      expect(rateElement).toHaveClass('stock-down'); // Green for negative
    });
  });

  describe('layout modes', () => {
    test('shows full content in normal mode', () => {
      render(
        <FundCard 
          fund={mockFund} 
          layoutMode="normal" 
          onRemove={mockOnRemove} 
        />
      );

      expect(screen.getByText(/估算净值/)).toBeInTheDocument();
      expect(screen.getByText(/估值时间/)).toBeInTheDocument();
    });

    test('shows minimal content in minimal mode', () => {
      render(
        <FundCard 
          fund={mockFund} 
          layoutMode="minimal" 
          onRemove={mockOnRemove} 
        />
      );

      expect(screen.getByText(mockFund.name)).toBeInTheDocument();
      expect(screen.queryByText(/估算净值/)).not.toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    test('expands holdings on button click', async () => {
      const user = userEvent.setup();
      render(
        <FundCard 
          fund={mockFund} 
          layoutMode="normal" 
          onRemove={mockOnRemove} 
        />
      );

      const expandButton = screen.getByRole('button', { name: /查看持仓/i });
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText(/重仓股/i)).toBeVisible();
      });
    });

    test('calls onRemove with fund code when remove button clicked', async () => {
      const user = userEvent.setup();
      render(
        <FundCard 
          fund={mockFund} 
          layoutMode="normal" 
          onRemove={mockOnRemove} 
        />
      );

      const removeButton = screen.getByRole('button', { name: /删除/i });
      await user.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith(mockFund.fundcode);
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    test('handles missing gszzl gracefully', () => {
      const incompleteFund = createMockFund({ gszzl: '' });
      render(
        <FundCard 
          fund={incompleteFund} 
          layoutMode="normal" 
          onRemove={mockOnRemove} 
        />
      );

      expect(screen.getByText(incompleteFund.name)).toBeInTheDocument();
    });
  });
});
```

### Hook Test Example

```tsx
// src/hooks/useFunds.test.ts

import { renderHook, waitFor, act } from '@testing-library/react';
import { useFunds } from './useFunds';
import { fetchFundData } from '../services/fundApi';
import { createMockFund } from '../test-utils/mockData';

jest.mock('../services/fundApi');

describe('useFunds', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('initializes with empty funds array', () => {
    const { result } = renderHook(() => useFunds([]));

    expect(result.current.funds).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('fetches fund data on mount', async () => {
    const mockFund = createMockFund({ fundcode: '015790' });
    (fetchFundData as jest.Mock).mockResolvedValue(mockFund);

    const { result } = renderHook(() => useFunds(['015790']));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.funds).toHaveLength(1);
    expect(result.current.funds[0]).toEqual(mockFund);
  });

  test('handles fetch error gracefully', async () => {
    const error = new Error('Network error');
    (fetchFundData as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useFunds(['015790']));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(error.message);
    expect(result.current.funds).toEqual([]);
  });

  test('refreshes data periodically', async () => {
    jest.useFakeTimers();
    const mockFund1 = createMockFund({ gszzl: '1.5' });
    const mockFund2 = createMockFund({ gszzl: '2.5' });
    
    (fetchFundData as jest.Mock)
      .mockResolvedValueOnce(mockFund1)
      .mockResolvedValueOnce(mockFund2);

    const { result } = renderHook(() => useFunds(['015790'], 30000));

    await waitFor(() => {
      expect(result.current.funds[0].gszzl).toBe('1.5');
    });

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(result.current.funds[0].gszzl).toBe('2.5');
    });

    jest.useRealTimers();
  });

  test('persists fund codes to localStorage', async () => {
    const mockFund = createMockFund();
    (fetchFundData as jest.Mock).mockResolvedValue(mockFund);

    renderHook(() => useFunds(['015790']));

    await waitFor(() => {
      const stored = localStorage.getItem('fundCodes');
      expect(stored).toBe(JSON.stringify(['015790']));
    });
  });
});
```

### Mock Data Utility

```tsx
// src/test-utils/mockData.ts

import { FundData, TopHolding } from '../types/fund';

export function createMockFund(overrides?: Partial<FundData>): FundData {
  return {
    fundcode: '015790',
    name: '永赢高端制造混合A',
    jzrq: '2026-02-03',
    dwjz: '1.2345',
    gsz: '1.2468',
    gszzl: '1.50',
    gztime: '2026-02-04 15:00',
    ...overrides,
  };
}

export function createMockHolding(overrides?: Partial<TopHolding>): TopHolding {
  return {
    code: '600519',
    name: '贵州茅台',
    proportion: '8.5',
    ...overrides,
  };
}

export const mockFunds = {
  positive: createMockFund({ gszzl: '2.5' }),
  negative: createMockFund({ gszzl: '-1.8' }),
  zero: createMockFund({ gszzl: '0.0' }),
  high: createMockFund({ gszzl: '5.8' }),
  low: createMockFund({ gszzl: '-4.2' }),
};
```

## Testing Checklist

Before considering tests complete:

- [ ] Happy path covered
- [ ] Edge cases included (empty, null, boundary values)
- [ ] Error states tested
- [ ] User interactions verified (for components)
- [ ] Async behavior handled correctly
- [ ] Mocks cleaned up after each test
- [ ] Tests run independently
- [ ] Test names are descriptive
- [ ] No console errors or warnings

## Common Testing Patterns

### Async Testing
```tsx
test('loads data asynchronously', async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### User Interaction
```tsx
test('handles user input', async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  await user.type(screen.getByRole('textbox'), 'test input');
  await user.click(screen.getByRole('button'));
  
  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

### Mocking Functions
```tsx
const mockCallback = jest.fn();

test('calls callback on event', async () => {
  const user = userEvent.setup();
  render(<Component onEvent={mockCallback} />);
  
  await user.click(screen.getByRole('button'));
  
  expect(mockCallback).toHaveBeenCalledWith(expectedArg);
  expect(mockCallback).toHaveBeenCalledTimes(1);
});
```

---

**Related**: 
- Skill: N/A (testing is cross-cutting)
- Agent: `testing.agent.md`
