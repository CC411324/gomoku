# 五子棋 (Gomoku)

一款基于 React + TypeScript + Node.js 的五子棋游戏，支持双人在线对战和单机模式（多难度 AI）。

## 功能特性

### 游戏模式
- **双人在线对战**：创建房间、生成邀请链接或房间密码，邀请好友对弈
- **单机模式**：与 AI 对弈，支持简单/中等/困难三档难度

### 规则模式
- **标准模式**：任意一方先连成 5 子获胜
- **无尽模式**：成 5 连可提子并吃对方 1 颗棋子，最终棋子多者获胜
- 统一遵循五子棋无禁手规则

### 技术特性
- 15x15 标准棋盘，带星位标记和坐标
- Minimax + Alpha-Beta 剪枝 AI 算法
- Socket.io 实时通信
- 响应式设计，支持移动端和 PC 端
- 断线重连机制（5 分钟超时）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | Node.js + Express + Socket.io |
| 通信 | WebSocket (Socket.io) |
| 样式 | CSS Modules |
| AI | Minimax + Alpha-Beta 剪枝 |
| 包管理 | npm workspaces (monorepo) |

## 项目结构

```
gomoku/
├── packages/
│   ├── shared/     # 前后端共享代码（类型、规则引擎、常量）
│   ├── client/     # React 前端
│   └── server/     # Node.js 后端
├── package.json    # monorepo 根配置
└── README.md
```

## 云端部署（Replit）

项目已配置 [.replit](.replit)，支持一键部署到 Replit 免费平台（无需绑定信用卡）。

### 部署步骤

1. **访问 Replit 并导入仓库**

   - 打开 [https://replit.com](https://replit.com) 并注册/登录
   - 点击 **Create Repl** → **Import from GitHub**
   - 粘贴仓库地址：`https://github.com/CC411324/gomoku`
   - 点击 **Import from GitHub**

2. **首次运行**

   - Replit 会自动读取 `.replit` 配置
   - 点击 **Run** 按钮，自动执行：安装依赖 → 构建 → 启动服务
   - 首次构建约需 2-3 分钟

3. **获取访问地址**

   - 运行成功后，右侧会显示 **Webview** 预览窗口
   - 点击预览窗口右上角的 **Open in a new tab** 获得完整访问地址
   - 地址格式：`https://gomoku.你的用户名.repl.co`

### 部署架构

```
Replit (免费)
├── Node.js 后端 (Express + Socket.io)
├── 前端静态文件 (Vite build → server/dist/public)
└── 统一端口对外服务 (HTTP + WebSocket)
```

### 免费额度说明

- 免费计划：500 小时/月运行时长
- 30 分钟无访问会自动休眠，再次访问自动唤醒
- 无需绑定信用卡

## 本地运行

### 环境要求
- Node.js >= 18
- npm >= 7

### 安装依赖

```bash
cd gomoku
npm install
```

### 构建共享包

```bash
npm run build:shared
```

### 开发模式

```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:client   # 前端 http://localhost:3000
npm run dev:server   # 后端 ws://localhost:3001
```

### 生产构建与运行

```bash
npm run build
npm start
```

## 游戏说明

### 单机模式
1. 点击首页「单机模式」
2. 选择游戏模式（标准/无尽）
3. 选择 AI 难度（简单/中等/困难）
4. 点击「开始游戏」
5. 玩家执黑先手，点击棋盘落子

### 双人在线对战
1. 点击首页「双人在线对战」
2. 输入昵称
3. 点击「创建房间」，获取房间号和邀请链接
4. 将链接发送给好友，或告知房间号
5. 好友输入房间号点击「加入」即可开始对弈

### 无尽模式规则
- 双方各 40 颗棋子
- 成 5 连后，移除连线的 5 颗棋子（不消耗）
- 可选择吃掉对方 1 颗棋子（变为己方颜色）或跳过
- 棋盘下满或双方无棋子时结束，棋子多者获胜

## 后续扩展

- [ ] 用户账号系统与排行榜
- [ ] 观战模式
- [ ] 对局回放
- [ ] 微信小程序适配
- [ ] 聊天功能
- [ ] 落子音效

## License

MIT
