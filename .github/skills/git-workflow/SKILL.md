---
name: git-workflow
description: "Git workflow rules: branch strategy, commit conventions, PR templates, rebase strategy, conflict resolution, release tagging."
---

# Git Workflow

> 所有 agent 执行 git 操作前**必须**加载本 skill。这是分支、commit、PR、rebase、release 的唯一权威规则源。

## 分支策略

### 基础分支

- **`main`** — 生产分支，仅通过 PR 合入
- **`development`** — 开发主线，feature/fix 分支从此创建

### 命名规则

| 场景      | 格式                     | 示例                      |
| --------- | ------------------------ | ------------------------- |
| Jira 功能 | `feat/{jira-key}-{简称}` | `feat/FE-1234-login-form` |
| 需求功能  | `feat/{任务简称}`        | `feat/avatar-upload`      |
| Bug 修复  | `fix/{标识}-{简述}`      | `fix/safari-whitepage`    |
| 文档      | `docs/{简述}`            | `docs/readme-quick-start` |
| 重构      | `refactor/{简述}`        | `refactor/auth-store`     |

### 多 Chunk 任务（Stacked Branches）

每个 Chunk 使用独立分支，形成分支链：

```
development
  └── feat/{task}-chunk-1  ← Chunk 1 PR → development
        └── feat/{task}-chunk-2  ← Chunk 2 PR → development
              └── feat/{task}-chunk-3  ← Chunk 3 PR → development
```

- **Chunk 1**: 基于 `development` 创建
- **Chunk N (N>1)**: 基于前一个 Chunk 的分支创建
- 所有 PR 都 target 到 `development`（非前一个 chunk 的分支）
- 优先使用 planner 返回的 `branch-suggestion`

### 分支创建命令

**必须使用 `--no-track` 防止意外推送到基础分支：**

```bash
# 正确：创建分支时不自动追踪基础分支
git checkout -b feat/my-feature --no-track origin/development

# 创建后立即设置正确的 upstream
git push -u origin feat/my-feature
```

```bash
# ❌ 禁止：不使用 --no-track（会自动追踪 origin/development，可能导致意外推送）
git checkout -b feat/my-feature origin/development
```

### 分支创建时机

- **单 Chunk**: Gate ① 确认后、实现前创建
- **多 Chunk**: 每个 Chunk 在 Gate ② 确认后、实现前创建

---

## Commit 规范

### 选择性暂存

```bash
# 正确：只暂存变更文件清单中的文件
git add src/features/auth/model/useAuthStore.ts
git add src/features/auth/model/useAuthStore.test.ts

# 错误：不要使用全量暂存
git add -A  # ❌ 禁止
git add .   # ❌ 禁止
```

对于多 Chunk 任务，同时暂存 `.dev/chunks/` Manifest 文件。

### Conventional Commit 格式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**标题规则：**

- **长度**: ≤ 100 字符（commitlint 强制）
- **目标**: ~50 字符
- **语气**: 祈使句（add, fix, update — 非 adds, added, updating）
- **结尾**: 无句号

**Body 规则：**

- 每行 ≤ 72 字符（硬限制，Git 标准）
- 解释 what 和 why，不解释 how
- 用 bullet points 增加可读性

### Commit 类型

| Type       | 用途     | 示例                                |
| ---------- | -------- | ----------------------------------- |
| `feat`     | 新功能   | `feat(auth): add OAuth2 login`      |
| `fix`      | Bug 修复 | `fix(api): handle null response`    |
| `docs`     | 文档     | `docs(readme): update setup guide`  |
| `style`    | 代码风格 | `style: fix indentation`            |
| `refactor` | 重构     | `refactor(utils): simplify helpers` |
| `test`     | 测试     | `test(auth): add login tests`       |
| `chore`    | 杂项     | `chore: update dependencies`        |
| `perf`     | 性能优化 | `perf(db): optimize queries`        |

### 多 Chunk Commit Message

多 Chunk 任务在 commit message 标题中标注 Chunk 编号：

```
feat(auth): add data layer and store (chunk 1/3)
feat(auth): add login form UI (chunk 2/3)
feat(auth): add register UI and route guard (chunk 3/3)
```

### 用户确认流程

在执行 `git commit` 前**必须**向用户确认：

1. 在回复中展示 commit message 预览（格式化显示）
2. 调用 `vscode/askQuestions` 提供选项：✅ 确认 / ✏️ 修改 / ❌ 取消
3. 用户确认后执行 commit

---

## PR 规范

### PR 标题

- **单 Chunk**: `<type>(<scope>): <description>`
- **多 Chunk**: `<type>(<scope>): <chunk 描述> (chunk N/Total)`
  - 示例: `feat(auth): add data layer — store, API, validators (chunk 1/2)`

### PR Body 模板

```markdown
## Chunk {N}/{Total}: {Chunk 名称}

### 技术方案

{从 Manifest 中提取该 Chunk 的"技术方案"段落}

### 变更文件

{从 Manifest 中提取该 Chunk 的"变更文件清单"表格}

### 实现要点

{从 Manifest 中提取该 Chunk 的"实现步骤"关键项}

### 测试覆盖

{从 Manifest 中提取该 Chunk 的"测试要点"}

---

> 此 PR 是 [{任务标题}] 的 Chunk {N}/{Total}。
> 完整的 Chunk 清单和任务概览详见 Manifest。
```

- 单 Chunk 任务省略 Chunk 编号标注
- PR body 使用真实多行字符串，**不使用 `\n` 转义**

### PR Target Branch

根据源分支类型自动推导 PR target：

| 源分支类型             | PR Target              | 说明                          |
| ---------------------- | ---------------------- | ----------------------------- |
| `feat/*`, `fix/*`      | `development`          | 正常开发流                    |
| `refactor/*`, `perf/*` | `development`          | 代码优化                      |
| `docs/*`, `chore/*`    | `development`          | 文档/杂项                     |
| `release/*`            | `main`                 | 版本发布                      |
| `hotfix/*`             | `main` + `development` | 生产紧急修复（需创建两个 PR） |

**Hotfix 双 PR 规则**：hotfix 分支需同时向 `main` 和 `development` 创建 PR，确保生产修复不丢失。`main` PR 优先 merge。

### PR 创建后

- 更新 Manifest 中的 Chunk 状态（⏳ → ✅）
- 记录 commit hash 和 PR 编号

---

## Push 规范

```bash
# 首次 push：设置 upstream
git push -u origin {branch-name}

# 后续 push
git push
```

---

## Rebase 策略

### 何时 Rebase

| 场景                                  | 操作                                 |
| ------------------------------------- | ------------------------------------ |
| Feature branch 落后 development       | `git rebase origin/development`      |
| Chunk N 分支需要 Chunk N-1 的最新变更 | `git rebase feat/{task}-chunk-{N-1}` |
| PR 有冲突无法合入                     | 先 rebase 解决冲突再 push            |

### 何时不 Rebase

- **已 push 且有他人基于此分支工作** — 改用 merge
- **主分支 (main/development)** — 永远不 rebase 主分支

### Rebase 执行流程

```bash
# 1. 确保工作区干净
git stash  # 如有未提交变更

# 2. 获取最新远程
git fetch origin

# 3. 执行 rebase
git rebase origin/development

# 4. 如果有冲突 → 进入冲突解决流程（见下节）

# 5. 强制推送（rebase 后必须 force push）
git push --force-with-lease  # 安全的 force push

# 6. 恢复工作区
git stash pop  # 如果第 1 步执行了 stash
```

**始终使用 `--force-with-lease`**（非 `--force`），防止覆盖他人提交。

---

## Merge Conflict 解决

### 检测冲突

```bash
# rebase 过程中出现冲突
git rebase origin/development
# 输出: CONFLICT (content): Merge conflict in src/...

# 查看冲突文件
git diff --name-only --diff-filter=U
```

### 解决策略

1. **读取冲突文件** — 理解双方变更意图
2. **分析上下文** — 搜索相关代码理解业务逻辑
3. **提出方案** — 向用户展示冲突内容和建议的解决方案
4. **用户确认** — 调用 `vscode/askQuestions`：
   - ✅ 接受建议方案
   - ✏️ 手动解决（用户自行修改）
   - 🔄 采用 ours / theirs 版本
5. **执行解决** — 修改文件、标记已解决

```bash
# 解决完单个文件后
git add {resolved-file}

# 所有冲突解决后
git rebase --continue

# 如果需要放弃 rebase
git rebase --abort
```

### 冲突解决原则

- **优先保留功能完整性** — 不要丢失任何一方的有效功能
- **类型安全** — 解决后确保 TypeScript 类型正确
- **测试覆盖** — 如果冲突涉及测试文件，确保测试逻辑一致
- **不猜测** — 不确定时必须询问用户

---

## Release Tagging

### SemVer 版本规则

| 变更类型        | 版本号位        | 示例    |
| --------------- | --------------- | ------- |
| Breaking change | Major (`X.0.0`) | `2.0.0` |
| 新功能 (feat)   | Minor (`0.X.0`) | `1.3.0` |
| Bug 修复 (fix)  | Patch (`0.0.X`) | `1.2.4` |

### Release 流程

1. **分析变更** — 从上一个 tag 到 HEAD 的 commit 列表
   ```bash
   git log $(git describe --tags --abbrev=0)..HEAD --oneline
   ```
2. **确定版本号** — 根据 commit 类型推断版本 bump 类型
3. **用户确认** — 展示建议版本号，调用 `vscode/askQuestions` 确认
4. **创建 Tag**
   ```bash
   git tag -a v{version} -m "release: v{version}"
   git push origin v{version}
   ```
5. **生成 Changelog**（可选）
   - 按 type 分组 commit
   - 格式化为 markdown

### Tag 命名

- 格式: `v{major}.{minor}.{patch}`
- 示例: `v1.2.0`, `v2.0.0-beta.1`

---

## Platform: GitHub

### PR 创建

使用 MCP GitHub 工具：

- 工具: `mcp_github_create_pull_request`
- **PR body 必须使用真实多行字符串**（不使用 `\n` 转义，否则格式错乱）

### PR 更新

- 工具: `mcp_github_update_pull_request`
- 用于修正 PR body 格式问题

### Branch 操作

```bash
# 创建分支
git checkout -b {branch-name} origin/development

# 删除远程分支（PR merge 后）
git push origin --delete {branch-name}
```

---

## 禁止事项

- ❌ `git add -A` 或 `git add .`（必须选择性暂存）
- ❌ `git push --force`（使用 `--force-with-lease`）
- ❌ Rebase 主分支 (`main` / `development`)
- ❌ 直接向 `main` 或 `development` push
- ❌ 创建分支时不带 `--no-track`（防止意外推送到基础分支）
- ❌ PR body 中使用 `\n` 转义
- ❌ 跳过用户确认直接 commit
- ❌ 提交 `.env` 文件或 secrets
