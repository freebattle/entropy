# Entropy

> *"Entropy is inevitable, efficiency is a choice."*
> (熵增不可避免，但效率是一种选择。)

<p align="center">
  <img src="app-icon.png" alt="Entropy Logo" width="128" height="128">
</p>

<p align="center">
  <strong>一款反熵增的专注力与任务管理桌面应用</strong><br>
  <em>An anti-entropy productivity desktop app with Pomodoro timer and task management</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/platform-Windows-lightgrey" alt="Platform">
  <img src="https://img.shields.io/badge/Tauri-2.0-orange" alt="Tauri">
</p>

---

## 📖 设计理念 (Design Philosophy)

在热力学第二定律的统治下，宇宙万物都倾向于从有序走向无序（熵增）。我们的时间、精力和注意力也是如此——如果不加以干预，它们自然会耗散在琐碎与混乱之中。

**Entropy** 不是又一个待办事项清单，也不是一个简单的番茄钟。它是一套 **对抗混乱的认知系统**。

它不相信"多任务处理"，不相信"稍后提醒"，也不相信模糊的"大目标"。它只相信此时此刻的行动，以及必须付出的代价。在这里，每一次专注都是能量的结晶，每一次放弃都是能量的损耗。

---

## ✨ 核心功能 (Features)

### ⚛️ 强制性任务拆解 (Fractal Decomposition)
- **Rule of 4**: 任何预估超过 4 个番茄钟的任务会被判定为"项目"，必须强制分解
- **原子执行**: 你不能"执行"一个项目，只能执行其下的原子任务
- 智能识别大任务，引导用户进行多层级拆解

### 🍅 沉浸式专注定时器 (Immersive Focus Timer)
- 极简 UI，屏蔽一切列表干扰
- 支持 **数字倒计时** 和 **圆环进度** 两种显示模式
- **长按熔断机制**: 防止冲动放弃，增加放弃的心理成本
- 二元结局: 完成获得"晶体"，放弃留下"灰烬"

### 🌊 能量守恒休息模式 (Restoration Mode)
- 专注于呼吸与恢复，而非数字倒数
- 休息结束后强制跳转回列表，保持工作流惯性
- 可自定义休息时长

### 📊 编年史 (The Chronicle)
- **Timeline**: 像地质沉积层一样展示操作轨迹
- **Energy Audit**: 自动计算每日"能量转化率"（有效番茄 vs 作废番茄）
- 7 天能量审计图表

### 🌓 动态双主题 (Dual Theme)
- **Light Mode (Architect)**: 纸张与墨水的质感，用于理性的规划与复盘
- **Dark Mode (Void)**: 深渊与微光的质感，用于极致的沉浸与执行

### 🌍 多语言支持 (i18n)
- 中文 / English 双语界面

### 🖥️ 桌面原生体验 (Native Desktop Experience)
- 自定义无边框窗口
- 系统托盘图标，最小化到托盘
- 窗口置顶功能
- 支持开机自启

---

## 🛠️ 技术栈 (Tech Stack)

| 层级 | 技术 | 说明 |
|------|------|------|
| **核心框架** | [Tauri 2.0](https://tauri.app/) | Rust 后端，提供系统级 API 与极小构建体积 |
| **前端框架** | [React 19](https://react.dev/) + TypeScript | 构建复杂的交互逻辑 |
| **样式** | [Tailwind CSS](https://tailwindcss.com/) | 实现语义化的日夜主题切换 |
| **图标** | [Lucide React](https://lucide.dev/) | 精美的开源图标库 |
| **图表** | [Recharts](https://recharts.org/) | 数据可视化 |
| **存储** | LocalStorage | 本地数据持久化 |
| **构建工具** | [Vite](https://vitejs.dev/) | 极速的开发体验 |

### Tauri 插件
- `@tauri-apps/plugin-autostart` - 开机自启
- `@tauri-apps/plugin-notification` - 系统通知
- `@tauri-apps/plugin-sql` - SQLite 数据库支持

---

## 📁 项目结构 (Project Structure)

```
entropy/
├── src/                        # 前端源码
│   ├── components/             # React 组件
│   │   ├── PlanView.tsx        # 任务规划视图
│   │   ├── SolidView.tsx       # 专注模式视图
│   │   ├── LiquidView.tsx      # 休息模式视图
│   │   ├── MirrorView.tsx      # 编年史视图
│   │   ├── SettingsView.tsx    # 设置视图
│   │   ├── NotificationToast.tsx # 通知组件
│   │   └── ...
│   ├── hooks/                  # React Hooks
│   ├── utils/                  # 工具函数
│   ├── App.tsx                 # 主应用组件
│   ├── types.ts                # TypeScript 类型定义
│   ├── translations.ts         # 国际化文案
│   ├── constants.ts            # 常量定义
│   └── index.css               # 全局样式
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   └── lib.rs              # Tauri 应用入口
│   ├── icons/                  # 应用图标
│   ├── tauri.conf.json         # Tauri 配置
│   └── Cargo.toml              # Rust 依赖
├── package.json                # Node.js 依赖
├── tailwind.config.js          # Tailwind 配置
├── vite.config.ts              # Vite 配置
└── tsconfig.json               # TypeScript 配置
```

---

## 🚀 快速开始 (Getting Started)

### 前置要求 (Prerequisites)

- **Node.js** v18+
- **Rust** (stable 版本, 1.77.2+)
- **系统构建工具**:
  - Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Linux: `build-essential`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`

### 安装步骤 (Installation)

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/entropy.git
   cd entropy
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式运行**
   ```bash
   npm run tauri dev
   ```
   > 首次运行会编译 Rust 依赖，可能需要几分钟

4. **构建生产版本**
   ```bash
   npm run tauri:build
   ```
   > 构建产物位于 `src-tauri/target/release/bundle/`

---

## 🎮 使用指南 (Usage Guide)

### 应用模式 (App Modes)

| 模式 | 英文名 | 说明 |
|------|--------|------|
| 📋 **规划** | PLAN | 管理任务列表，添加/删除/开始任务 |
| 🎯 **专注** | SOLID | 番茄钟计时，沉浸式专注 |
| 🌊 **恢复** | LIQUID | 休息时间，恢复精力 |
| 📊 **镜像** | MIRROR | 查看历史记录和能量审计 |
| ⚙️ **设置** | SETTINGS | 配置应用参数 |

### 任务状态 (Task Status)

- **Active**: 活跃任务，等待执行
- **Completed**: 已完成的任务（移至 Done 列表）
- **Archived**: 已删除/归档的任务

### 熵增原因 (Entropy Reasons)

当你放弃一个番茄钟时，需要记录原因：
- **Internal (内部)**: 状态或意志问题
- **External (外部)**: 环境干扰
- **Cognitive (认知)**: 规划错误

---

## ⚙️ 配置选项 (Configuration)

在设置页面可配置以下选项：

| 选项 | 默认值 | 说明 |
|------|--------|------|
| 专注时长 | 25 分钟 | 每个番茄钟的时长 |
| 休息时长 | 5 分钟 | 每次休息的时长 |
| 显示领域标签 | 开启 | 是否显示 Inbox/Work/Life 标签 |
| 计时器样式 | 数字 | 数字倒计时或圆环进度 |
| 界面语言 | English | 中文/English |
| 开机自启 | 关闭 | 系统启动时自动运行 |

---

## 🔧 开发命令 (Development Scripts)

```bash
# 启动开发服务器 (仅前端)
npm run dev

# 启动 Tauri 开发模式
npm run tauri dev

# 构建生产版本
npm run tauri:build

# TypeScript 类型检查
npm run build

# 预览构建结果
npm run preview
```

---

## 📦 构建产物 (Build Output)

运行 `npm run tauri:build` 后，会在 `src-tauri/target/release/bundle/` 生成：

- **MSI 安装包**: `Entropy_0.1.0_x64.msi`
- **NSIS 安装包**: `Entropy_0.1.0_x64-setup.exe`

---

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 📄 许可证 (License)

本项目采用 [MIT 许可证](LICENSE)。

---

## 🙏 致谢 (Acknowledgments)

- [Tauri](https://tauri.app/) - 强大的桌面应用框架
- [React](https://react.dev/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [Lucide](https://lucide.dev/) - 精美图标库

---

<p align="center">
  <strong>🔥 ENTROPY IS INEVITABLE</strong><br>
  <em>熵增不可避免，但效率是一种选择</em>
</p>
