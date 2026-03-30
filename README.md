# FundWatcher - 基金估值工具

纯前端的基金实时监控工具，支持添加基金、查看估值、查看重仓股，数据存储在本地。

## 在线访问

项目地址：https://luckychen666.github.io/FundWatcher/

## 功能特性

✅ **基金管理**
- 通过基金代码快速添加基金
- 自动获取基金名称和实时估值
- 删除不再关注的基金

✅ **实时监控**
- 显示基金最新净值、估值、涨跌幅
- 每30秒自动刷新数据
- 实时估值时间展示

✅ **重仓股查看**
- 点击展开查看前10大重仓股票
- 显示股票代码、名称、持仓占比

✅ **本地存储**
- 基金列表保存在 LocalStorage
- 刷新页面不丢失数据
- 完全前端实现，无需后端

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **数据源**: 天天基金网公开接口
- **存储**: LocalStorage

## 本地运行

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
\`\`\`

## 使用说明

1. **添加基金**: 输入6位基金代码（如 \`161725\`），点击"添加"
2. **查看数据**: 自动显示基金名称、涨跌幅、净值、估值等信息
3. **查看重仓**: 点击"查看前10重仓股"按钮展开详情
4. **删除基金**: 点击卡片右上角的"✕"按钮

## 数据接口

- **估值接口**: \`https://fundgz.1234567.com.cn/js/{code}.js\`
- **持仓接口**: \`http://fund.eastmoney.com/f10/FundArchivesDatas.aspx\`

> 注意：由于浏览器CORS限制，持仓数据接口可能需要代理或在生产环境配置跨域。

## 项目结构

\`\`\`
src/
├── components/         # 组件目录
│   └── FundCard.tsx   # 基金卡片组件
├── hooks/             # 自定义 Hooks
│   ├── useLocalStorage.ts  # LocalStorage Hook
│   └── useFunds.ts    # 基金管理 Hook
├── services/          # 服务层
│   └── fundApi.ts     # 基金数据API
├── types/             # TypeScript 类型定义
│   └── fund.ts        # 基金相关类型
├── utils/             # 工具函数
│   └── storage.ts     # 存储工具
├── App.tsx            # 主应用组件
├── App.css            # 样式文件
└── main.tsx           # 入口文件
\`\`\`

## 待优化

- [ ] 支持基金搜索和自动补全
- [ ] 添加基金对比功能
- [ ] 支持导出基金列表
- [ ] 优化移动端适配
- [ ] 添加暗黑模式
- [ ] 支持自定义刷新间隔
- [ ] 添加基金历史净值图表

## License

MIT
