# FundWatcher Copilot Infrastructure

This directory contains the complete Copilot AI infrastructure for the FundWatcher project, following enterprise-grade best practices.

## 📁 Directory Structure

```
.github/
├── COPILOT_USAGE_GUIDE.md       # 企业级使用规范（主文档）
├── copilot-instructions.md      # 项目全局约束（始终生效）
├── agents/                      # AI 代理（目标导向执行器）
│   ├── README.md
│   ├── frontend.agent.md        # 前端开发 Agent
│   ├── refactor.agent.md        # 代码重构 Agent
│   └── testing.agent.md         # 测试生成 Agent
├── skills/                      # 可复用技能模块
│   ├── README.md
│   ├── create-component.skill.md
│   ├── extract-hook.skill.md
│   ├── optimize-performance.skill.md
│   └── add-type-safety.skill.md
└── prompts/                     # 任务模板
    ├── README.md
    ├── create-component.prompt.md
    ├── refactor-code.prompt.md
    └── generate-tests.prompt.md
```

---

## 🚀 Quick Start

### 1. 阅读使用规范

首先阅读 [COPILOT_USAGE_GUIDE.md](./COPILOT_USAGE_GUIDE.md)，了解：
- 角色与职责
- 标准工作流
- 质量控制标准
- 最佳实践和反模式

### 2. 使用 Agents

在 Copilot Chat 中使用 Agent 命令：

```bash
# 创建新组件
/fund-frontend create-component TrendChart \
  --props "fundCode: string, data: FundData[]" \
  --description "显示基金趋势图"

# 重构代码
/fund-refactor refactor-hook useFunds \
  --focus "Extract API logic"

# 生成测试
/fund-testing generate-tests FundCard \
  --coverage "all props combinations"
```

### 3. 遵循工作流

所有 AI 生成代码必须：
1. ✅ 通过 TypeScript 编译
2. ✅ 通过 ESLint 检查
3. ✅ 人工审查
4. ✅ 使用审查清单
5. ✅ 标记 "AI-Generated" 标签

---

## 📖 核心概念

### Instructions（全局约束）

**文件**: `copilot-instructions.md`

**作用**: 定义项目级别的常驻规则，AI 始终遵循

**包含内容**:
- 技术栈约束（React + TypeScript + Vite）
- 架构约定（组件模式、状态管理）
- 关键规范（涨红跌绿颜色语义）
- 配置注意事项（Vite 代理设置）

**何时修改**: 仅 Tech Lead / 架构师可修改

---

### Agents（智能执行器）

**目录**: `agents/`

**作用**: 目标导向的 AI 执行器，能理解意图、选择工具、执行任务

**可用 Agents**:
- **frontend.agent.md**: 创建组件、实现 UI、处理样式
- **refactor.agent.md**: 重构代码、优化性能、改进架构
- **testing.agent.md**: 生成测试、创建 Mock、提升覆盖率

**使用场景**: 多步骤、需要推理的复杂任务

---

### Skills（可复用能力）

**目录**: `skills/`

**作用**: 定义明确的输入输出规范，类似函数或工具

**可用 Skills**:
- **create-component**: 生成符合规范的 React 组件
- **extract-hook**: 提取自定义 Hook
- **optimize-performance**: 性能优化（memo、useMemo、useCallback）
- **add-type-safety**: 增强类型安全（type guards、移除 any）

**使用场景**: Agent 内部调用，或直接用于单一明确任务

---

### Prompts（任务模板）

**目录**: `prompts/`

**作用**: 预定义任务模板，确保一致性和可复用性

**可用 Prompts**:
- **create-component**: 创建新组件的完整模板
- **refactor-code**: 重构任务的标准流程
- **generate-tests**: 测试生成的完整规范

**使用场景**: 常见任务快速启动，避免重复描述需求

---

## 🎯 使用场景示例

### 场景 1：创建新功能组件

**需求**: 创建一个基金趋势图组件

**步骤**:
1. 调用 Frontend Agent:
   ```
   /fund-frontend create-component TrendChart \
     --props "fundCode: string, data: FundData[], layoutMode: LayoutMode" \
     --description "Line chart showing fund value trends"
   ```

2. Agent 自动应用：
   - Instructions 中的全局规则
   - create-component Skill
   - 项目颜色语义（涨红跌绿）

3. 人工审查：
   - 检查类型安全
   - 验证样式符合设计
   - 确认响应式布局

4. 提交代码：
   - 使用审查清单
   - 标记 "AI-Generated"

---

### 场景 2：重构现有代码

**需求**: useFunds Hook 太复杂，需要拆分

**步骤**:
1. 备份当前代码:
   ```bash
   git commit -am "chore: backup before refactor"
   ```

2. 调用 Refactor Agent:
   ```
   /fund-refactor refactor-hook useFunds \
     --focus "Extract API logic to service layer" \
     --preserve "LocalStorage persistence"
   ```

3. Agent 执行：
   - 分析当前代码
   - 提取 API 逻辑到 `fundService.ts`
   - 更新 Hook 使用 Service
   - 保持 LocalStorage 行为不变

4. 验证：
   - 运行测试
   - 对比 git diff
   - 手动测试功能

5. 提交：
   ```bash
   git commit -am "refactor: extract API logic from useFunds (AI-assisted)"
   ```

---

### 场景 3：生成测试用例

**需求**: 为 FundCard 组件补充测试

**步骤**:
1. 调用 Testing Agent:
   ```
   /fund-testing generate-tests FundCard \
     --coverage "all layoutMode variants, color semantics, interactions" \
     --mockData true
   ```

2. Agent 生成：
   - 完整测试文件 `FundCard.test.tsx`
   - Mock 数据工具 `mockData.ts`
   - 覆盖所有场景（normal/compact/minimal 模式）
   - 测试涨跌颜色正确性

3. 运行测试（如已配置测试脚本）：
   ```bash
   npm run test FundCard.test.tsx
   ```

4. 提交：
   ```bash
   git add src/components/FundCard.test.tsx src/test-utils/mockData.ts
   git commit -m "test: add comprehensive tests for FundCard (AI-generated)"
   ```

---

## ✅ 代码审查清单

### 自动检查（必须通过）

```bash
npm run build       # TypeScript 类型检查（当前项目使用 build 脚本）
npm run lint        # ESLint 规则检查
```

> 若已配置测试框架与脚本，再执行 `npm run test`。

### 人工审查（关键项）

**类型安全**:
- [ ] 无 `any` 类型（除非有充分理由）
- [ ] Props 有完整 TypeScript 定义
- [ ] API 响应有类型守卫

**项目规范**:
- [ ] 符合 `copilot-instructions.md` 规范
- [ ] 涨红跌绿颜色语义正确
- [ ] 组件导出方式正确（named export）

**性能与安全**:
- [ ] 无不必要的 re-render
- [ ] LocalStorage 操作有错误处理
- [ ] 无敏感信息硬编码

**可维护性**:
- [ ] 代码逻辑清晰，有必要注释
- [ ] 组件职责单一
- [ ] 可复用性良好

---

## 📊 效果跟踪

### 建议记录的指标

- **代码质量**: AI 生成代码的审查通过率
- **效率提升**: 相同任务 AI 辅助 vs 人工时间对比
- **错误率**: AI 生成代码引入 bug 的频率
- **复用率**: Prompts/Skills 被使用的次数

### 持续改进

1. **记录问题**:
   - AI 生成错误代码 → 记录到 Issues
   - 重复修正同类问题 → 更新 Instructions

2. **优化 Prompts**:
   - 发现通用任务 → 创建新 Prompt
   - Prompt 参数不够用 → 增加可配置项

3. **分享经验**:
   - 好的 AI 使用案例 → 写入文档
   - 避坑经验 → 加入反模式列表

---

## 🔗 相关资源

### 内部文档
- [项目 README](../README.md)
- [项目 Instructions](./copilot-instructions.md)
- [使用规范](./COPILOT_USAGE_GUIDE.md)

### 外部参考
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/react)

---

## 🆘 常见问题

### Q: Agent 生成的代码不符合项目规范？

**A**: 
1. 检查 `copilot-instructions.md` 是否包含该规范
2. 如果没有，添加规范到 Instructions
3. 重新调用 Agent

### Q: 如何创建新的 Agent/Skill/Prompt？

**A**:
1. 参考现有文件格式
2. 遵循命名约定（`name.agent.md`, `name.skill.md`, `name.prompt.md`）
3. 添加清晰的描述、输入输出、示例
4. 由 Tech Lead 审查后添加

### Q: AI 生成的代码有 bug，怎么办？

**A**:
1. 不要盲目信任，必须人工审查
2. 记录问题到 Issues（标签: `ai-bug`）
3. 分析根因（Instructions 不足？Prompt 不清晰？）
4. 更新相关文档避免重复

---

## 📝 维护说明

### 谁负责维护？

- **Instructions**: Tech Lead / 架构师
- **Agents**: Tech Lead（需求变化时更新）
- **Skills**: 高级开发者（发现可复用模式时添加）
- **Prompts**: 任何开发者（常见任务可提交 PR）

### 更新频率？

- **Instructions**: 每次架构调整或规范变更
- **Agents**: 季度回顾，按需更新
- **Skills/Prompts**: 发现新模式时随时添加

---

## 🎉 开始使用

1. 阅读 [COPILOT_USAGE_GUIDE.md](./COPILOT_USAGE_GUIDE.md)
2. 尝试使用 Agent 完成一个简单任务
3. 遵循工作流和审查清单
4. 提供反馈，持续优化

**记住：Copilot 是强大的工具，但代码质量的最终责任在人。**
