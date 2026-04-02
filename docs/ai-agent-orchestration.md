# AI Agent Orchestration

基于 VS Code Copilot Custom Agents 的前端团队 AI 辅助开发工作流。

## 概述

本项目提供一套完整的 **AI 驱动开发工作流**配置，覆盖从需求分析到发布的全流程。核心设计理念：

- **两段式工作流** — 以人工 Code Review 为分界，拆成"开发流"和"合并流"两段独立对话
- **智能分块** — 大需求自动拆分为多个可独立 Review 的小 PR
- **双模式开发** — 支持 Figma 驱动（UI 实现）和需求驱动（逻辑实现）
- **人机协作** — AI 辅助开发和审查，但合并权始终由真人掌控

## 技术栈集成

| 工具                | 用途                  | MCP 服务器                                                                         |
| ------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| **BitBucket Cloud** | 代码托管、PR 管理     | [bitbucket-mcp](https://github.com/MatanYemini/bitbucket-mcp)                      |
| **Jira Cloud**      | 需求管理、Sprint 追踪 | [atlassian-mcp-server](https://github.com/atlassian/atlassian-mcp-server) (官方)   |
| **Jenkins**         | CI/CD                 | [mcp-server-plugin](https://github.com/jenkinsci/mcp-server-plugin) (官方插件)     |
| **SonarQube**       | 代码质量检查          | [sonarqube-mcp-server](https://github.com/SonarSource/sonarqube-mcp-server) (官方) |
| **Figma**           | UI 设计稿             | [figma-developer-mcp](https://github.com/GLips/Figma-Context-MCP) (Framelink)      |

## 快速开始

### 前置条件

- VS Code 1.99+（支持 Custom Agents 和 Subagents）
- GitHub Copilot 订阅（Chat + Agent Mode）
- 各工具的 API Token（BitBucket、Jira、Jenkins、SonarQube、Figma）

### 安装步骤

1. **复制配置文件到你的项目**

```bash
# 复制 Agent 和 Skill 配置
cp -r .github/agents/ <your-project>/.github/agents/
cp -r .github/skills/ <your-project>/.github/skills/

# 复制 MCP 配置（合并到已有 settings.json）
cp .vscode/settings.json <your-project>/.vscode/settings.json

# 创建 Chunk 追踪目录
mkdir -p <your-project>/.dev/chunks/
```

2. **配置 API Tokens**

首次使用时 VS Code 会提示输入各 MCP 服务器的 Token。参考 `.vscode/settings.json` 中的 `inputs` 配置。

3. **自定义 Skills**

根据你的项目实际情况修改以下 Skill 文件：

- `.github/skills/project-conventions/SKILL.md` — 项目技术栈和编码规范
- `.github/skills/component-patterns/SKILL.md` — 组件设计模式
- `.github/skills/testing-guide/SKILL.md` — 测试策略和覆盖率要求

## 使用方式

### 对话 1：开发流 — `@dev`

```bash
# Jira 驱动（有 ticket）
@dev "implement FE-1234"
@dev "implement FE-1234 --figma https://figma.com/design/xxx"
@dev "implement FE-1234 chunk 2"

# 需求驱动（无 ticket）
@dev "实现用户头像上传功能，支持裁剪和压缩"
@dev "fix: 登录页在 Safari 下白屏"
```

**流程**: Planner → Implementer → Verifier → PR Creator → CI Watcher → AI Reviewer → **STOP**

输出 Handoff Payload 后，去 BitBucket 完成人工 Code Review。

### 对话 2：合并流 — `@ship`

```bash
# 人工 Review + Approve 后
@ship "merge PR #567 for FE-1234"
@ship "merge PR #567"
```

**流程**: Gate Checker → Merger → Releaser

## 架构图

```
═══════════════════════════════════════════════════════════
  对话 1: @dev
═══════════════════════════════════════════════════════════

  ┌─────────┐   ┌────────────┐   ┌──────────┐   ┌──────────┐
  │ Planner │──▶│Implementer │──▶│ Verifier │──▶│PR Creator│
  │         │   │  🎨 / ⚙️   │   │          │   │          │
  └─────────┘   └────────────┘   └──────────┘   └──────────┘
   Jira MCP      Figma MCP        Terminal       BitBucket +
                 (UI 模式)                        Jira MCP

       ┌────────────┐   ┌─────────────┐
    ──▶│ CI Watcher │──▶│ AI Reviewer │──▶ 📋 Handoff
       │            │   │             │
       └────────────┘   └─────────────┘
        Jenkins +        BitBucket +
        Sonar MCP        Sonar MCP

═══════════════════════════════════════════════════════════
  🧑 人工 Code Review + Approve (BitBucket UI)
═══════════════════════════════════════════════════════════

  对话 2: @ship
═══════════════════════════════════════════════════════════

  ┌──────────────┐   ┌────────┐   ┌──────────┐
  │ Gate Checker │──▶│ Merger │──▶│ Releaser │
  │              │   │        │   │          │
  └──────────────┘   └────────┘   └──────────┘
   BitBucket +        BitBucket    Jira MCP +
   Jenkins +          MCP          Git Tag
   Sonar MCP
```

## 目录结构

```
your-project/
├── .vscode/
│   └── settings.json              # MCP 服务器配置（5 个 MCP）
│
├── .github/
│   ├── agents/
│   │   │
│   │   │  ── 对话 1: 开发流 ──
│   │   ├── dev.agent.md           # 🎯 入口 Coordinator
│   │   ├── planner.agent.md       # 需求分析 + 分块规划
│   │   ├── implementer.agent.md   # 代码实现（UI/Logic 双模式）
│   │   ├── verifier.agent.md      # 本地验证
│   │   ├── pr-creator.agent.md    # 创建 PR + 关联 Jira
│   │   ├── ci-watcher.agent.md    # Jenkins + Sonar 监控
│   │   ├── ai-reviewer.agent.md   # AI 代码审查
│   │   │
│   │   │  ── 对话 2: 合并流 ──
│   │   ├── ship.agent.md          # 🎯 入口 Coordinator
│   │   ├── gate-checker.agent.md  # 合并门禁（含人工审批验证）
│   │   ├── merger.agent.md        # PR 合并
│   │   └── releaser.agent.md      # Jira 更新 + Tag
│   │
│   └── skills/
│       ├── project-conventions/SKILL.md  # 编码规范
│       ├── component-patterns/SKILL.md   # 组件设计模式
│       ├── testing-guide/SKILL.md        # 测试指南
│       ├── pr-template/SKILL.md          # PR 模板
│       └── release-process/SKILL.md      # 发布流程
│
└── .dev/
    └── chunks/                    # Story/Task 分块追踪
        └── README.md
```

## Agent × MCP 矩阵

每个 Agent 只加载它需要的 MCP tools，最大化 token 效率：

```
                    │BitBucket│ Jira │Jenkins│ Sonar │ Figma │
Agent               │         │      │       │       │       │
────────────────────┼─────────┼──────┼───────┼───────┼───────┤
dev (coordinator)   │         │      │       │       │       │
planner             │  ✅ 读   │ ✅ 读 │       │       │       │
implementer         │         │      │       │       │ ✅ 读  │
verifier            │         │      │       │       │       │
pr-creator          │  ✅ 写   │ ✅ 读 │       │       │       │
ci-watcher          │  ✅ 读   │      │ ✅ 读  │ ✅ 读  │       │
ai-reviewer         │  ✅ 读写 │      │       │ ✅ 读  │       │
──── 人工审批 ───────┼─────────┼──────┼───────┼───────┼───────┤
ship (coordinator)  │         │      │       │       │       │
gate-checker        │  ✅ 读   │      │ ✅ 读  │ ✅ 读  │       │
merger              │  ✅ 写   │ ✅ 写 │       │       │       │
releaser            │  ✅ 读   │ ✅ 写 │       │       │       │
```

## 核心设计决策

### 1. 两段式工作流

VS Code Agent 没有后台轮询能力，无法"等待人工审批后自动继续"。因此将流程拆为两段独立对话，以人工审批为天然分界点。对话 2 通过 MCP 重新拉取所有最新状态，不依赖对话 1 的记忆。

### 2. 智能分块（Chunk Manifest）

大需求自动拆分为多个 Chunk，每个 Chunk 对应一个 PR。分块追踪状态存储在 `.dev/chunks/` 目录下，随代码一起版本控制，团队可见。

拆分触发条件（命中任意 2 条）：

- 涉及 2+ 个独立关注点
- 预估变更 > 300 行 或 > 8 个文件
- 无法用一句话解释 PR 做了什么
- 同时涉及 UI 和逻辑
- Figma Frame 包含 5+ 个独立组件

### 3. 双模式入口

- **Jira 驱动**: `@dev "implement FE-1234"` — 从 Jira 读取需求上下文
- **需求驱动**: `@dev "实现用户头像上传功能"` — 直接用自然语言描述需求

Jira 是增强，不是前置条件。无 Jira 时 workflow 退化为基于描述的开发流。

### 4. Figma 渐进式加载

UI 模式下，Figma 设计数据按组件粒度逐步加载，避免大 Frame 的 token 爆炸：

1. 先加载结构概览（~500 tokens）
2. 逐组件加载详情（~1000-2000 tokens/组件）
3. 提取 Design Tokens（~500 tokens）

### 5. 人工审批是硬性要求

Gate Checker 验证 5 项条件：PR Open、无冲突、≥1 真人 Approve（排除 bot 和自批）、Jenkins 绿灯、Sonar 通过。任何一项不满足则阻止合并。

## 自定义指南

### 适配你的项目

1. **编码规范** — 修改 `project-conventions/SKILL.md`，填入你的技术栈、命名约定、文件结构
2. **组件模式** — 修改 `component-patterns/SKILL.md`，添加你的组件模板和设计系统
3. **测试策略** — 修改 `testing-guide/SKILL.md`，调整覆盖率要求和测试工具
4. **PR 模板** — 修改 `pr-template/SKILL.md`，匹配你的团队 PR 审查流程
5. **发布流程** — 修改 `release-process/SKILL.md`，定义你的版本号规则和发布节奏

### 适配其他工具链

如果你使用 GitHub 而非 BitBucket：

- 替换 `bitbucket-mcp` → `github` (VS Code 内置)
- 修改 Agent 中的 `tools` 白名单
- PR/Review 相关操作适配 GitHub API

### 渐进式采用

建议按以下顺序逐步引入：

| 周     | 引入内容                                  | 风险                   |
| ------ | ----------------------------------------- | ---------------------- |
| Week 1 | `@dev` (planner + implementer + verifier) | 低 — 只辅助编码        |
| Week 2 | + pr-creator + ci-watcher                 | 低 — 自动化 PR 创建    |
| Week 3 | + ai-reviewer                             | 中 — AI 在 PR 上发评论 |
| Week 4 | + `@ship` (gate-checker + merger)         | 中 — 自动化合并        |
| Week 5 | + releaser + Jira 集成                    | 低 — 自动化收尾        |
| Week 6 | + Figma 集成                              | 低 — 按需启用          |

## 参考文档

- [VS Code Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [VS Code Agent Subagents](https://code.visualstudio.com/docs/copilot/agents/subagents)
- [VS Code Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [VS Code Agent Tools](https://code.visualstudio.com/docs/copilot/agents/agent-tools)
- [VS Code MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
