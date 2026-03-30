# FundWatcher - AI Coding Instructions

## Project Overview
React + TypeScript + Vite 纯前端基金估值工具。使用天天基金网公开接口获取实时数据，通过 LocalStorage 持久化，无需后端。

## Architecture & Key Patterns

### Data Flow
1. **API Layer** (`src/services/fundApi.ts`): 通过 Vite 代理访问外部接口，解析 JSONP 响应
2. **State Management**: 使用自定义 Hook (`useLocalStorage`) 实现状态与本地存储同步
3. **Component Structure**: App.tsx → FundCard.tsx，通过 props 传递 layoutMode 和事件处理器

### Critical Configuration: Vite Proxy
`vite.config.ts` 配置了两个代理路径解决 CORS：
```typescript
'/api/fund': 'https://fundgz.1234567.com.cn'
'/api/eastmoney': 'http://fund.eastmoney.com'
```
**重要**: 修改 Vite 配置后必须重启开发服务器

### State Persistence Pattern
所有用户偏好使用 `useLocalStorage` Hook 持久化：
- `fundCodes`: 基金代码列表
- `refreshInterval`: 刷新间隔（毫秒）
- `layoutMode`: 排版模式 ('normal' | 'compact' | 'minimal')

## Development Workflow

### Local Development
```bash
npm run dev      # 启动开发服务器 (http://localhost:5173)
npm run build    # 生产构建
```

### Common Tasks
- **添加新功能**: 优先考虑 LocalStorage 持久化和 TypeScript 类型安全
- **修改 API**: 更新 `src/services/fundApi.ts` 和 `src/types/fund.ts`
- **样式调整**: 使用 CSS 类前缀区分模式 (如 `.layout-minimal`)

## Project-Specific Conventions

### Color Semantics (Chinese Stock Market)
**涨红跌绿** - 与国际惯例相反：
- 上涨 (positive): `color: #dc2626` (红色)
- 下跌 (negative): `color: #16a34a` (绿色)

CSS 类: `.stock-up`, `.stock-down`, `.rate.positive`, `.rate.negative`

### Layout Modes
三种显示模式通过 `layoutMode` prop 控制：
- **normal**: 完整信息 + 可展开重仓股
- **compact**: 简化间距，保留所有字段
- **minimal**: 仅显示基金名称、代码、涨跌幅

实现方式: 条件渲染 + CSS 类组合 (`layout-${mode}`)

### API Response Handling
天天基金接口返回 JSONP 格式：
```javascript
jsonpgz({"fundcode":"015790","name":"永赢高端...",...})
```
解析模式: `text.match(/jsonpgz\((.*)\)/)`，然后 `JSON.parse()`

## External Dependencies

### Data Sources
- **估值接口**: 天天基金 JSONP (实时数据)
- **持仓接口**: 东方财富 (当前使用 mock 数据，因接口限制)

### Mock Data Strategy
`fetchTopHoldings` 函数在接口失败时返回模拟持仓数据（`getMockHoldings`），确保界面功能完整性。

## Key Files Reference
- `src/App.tsx`: 主逻辑，状态管理，自动刷新定时器
- `src/components/FundCard.tsx`: 卡片组件，支持三种布局模式
- `src/hooks/useLocalStorage.ts`: 状态持久化 Hook
- `src/services/fundApi.ts`: API 调用和数据解析
- `vite.config.ts`: **关键配置** - CORS 代理设置

## Debugging Tips
- 检查浏览器控制台中的 CORS 错误
- 验证 Vite 代理是否正确转发请求（Network 面板）
- 检查 LocalStorage 中的 `fundCodes`, `refreshInterval`, `layoutMode` 键
- 重仓股数据暂为 mock，真实接口需额外处理
