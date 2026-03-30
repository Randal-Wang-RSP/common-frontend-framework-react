# Bitbucket PR Workflow

Platform-specific scripted commit and PR workflow for Bitbucket-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = Bitbucket.
>
> **Prerequisite:** Read the main [SKILL.md](../SKILL.md) first for generic Git Flow rules,
> branch naming, merge strategy, and AI agent behavior rules. This file covers only the
> **Bitbucket-specific scripted workflow** — the optimized 4-phase commit/PR automation.

---

## ✅ [TASKS] Optimized Script-Powered Workflow

> ### 🚨 HARD STOP — READ BEFORE EXECUTING ANY GIT COMMAND
>
> **RULE 1:** You MUST receive explicit user confirmation **before every push to remote**. No exceptions.
>
> **RULE 2:** The user selecting `✅ 提交变更` in a prior turn is NOT sufficient. Each commit workflow requires its own confirmation at **Interaction 1** (see below).
>
> **Violation = unauthorised remote push. Never skip the confirmation gate.**

### Design Principles

This workflow optimizes the commit→push→PR→review pipeline by:

1. **Parallel preparation** — parse diff, read instructions, detect branch simultaneously
2. **Compressed interactions** — 2 user confirmations instead of 6, without sacrificing safety
3. **Pipeline execution** — push, PR prep, and review run in parallel where possible
4. **Single-pass confirmation** — user sees everything upfront and decides once

```
Phase 0 (auto, parallel) → Interaction 1 (confirm all) → Phase 2 (auto, pipeline) → Interaction 2 (results + next)
```

---

### Phase 0: Automatic Preparation (Zero Interaction)

**Initialize todo list immediately:**

```typescript
manage_todo_list([
  { id: 1, title: "Prepare: parse diff + read instructions", status: "in-progress" },
  { id: 2, title: "Generate and validate commit message", status: "not-started" },
  { id: 3, title: "User confirmation", status: "not-started" },
  { id: 4, title: "Execute: commit + push", status: "not-started" },
  { id: 5, title: "Create PR (if requested)", status: "not-started" },
  { id: 6, title: "Code review (if requested)", status: "not-started" },
  { id: 7, title: "Results and next steps", status: "not-started" },
])
```

**Run these three operations in parallel:**

```bash
# 1. Parse staged changes
node .github/skills/git-workflow/scripts/parse-diff.js --staged

# 2. Read commit message content rules (AI reads this file)
# .github/.copilot-commit-message-instructions.md

# 3. Detect current branch and infer target
git rev-parse --abbrev-ref HEAD
# feat/* or fix/* → target = development
# hotfix/* or release/* → target = main
```

**Then immediately** (still Phase 0, no user interaction):

1. AI generates commit message as JSON `{title, paragraphs}` following the content rules
2. Pipe to `format-commit.js` for validation:
   ```bash
   echo '<json>' | node .github/skills/git-workflow/scripts/format-commit.js
   ```
3. If validation fails → fix and retry (user never sees the failure)
4. Collect ALL commits for PR description (if applicable):
   ```bash
   git log origin/<target>..HEAD --format="%s" --reverse
   ```
5. AI generates PR title + summary (following the rules in SKILL.md § PR Convention)

**Mark todo id:1 and id:2 as `completed`** once message is validated and PR content prepared.

> **Key insight:** By the time the user sees anything, ALL preparation is done. No waiting.

---

### Interaction 1: Combined Confirmation (Replaces 4 Separate Gates)

**Mark todo id:3 as `in-progress`.**

#### Preview File

> ⚠️ **CRITICAL — Preview file location**: ALWAYS use the **`.tmp/` directory** in workspace root (e.g. `<workspace-root>/.tmp/commit-preview.md`).
> **NEVER** use `/tmp`, system temp folders, or paths outside the project.
> Only workspace-rooted files are visible/clickable in VS Code's Copilot Chat.

```bash
mkdir -p .tmp
```

Write a combined preview file:

````typescript
const previewPath = `<absoluteWorkspaceRoot>/.tmp/commit-preview.md`

create_file(
  previewPath,
  [
    `# Commit & PR Preview`,
    ``,
    `## Diff Summary`,
    ``,
    `${diffStats}`, // e.g., "3 files changed: 2 modified, 1 added (+45 -12 lines)"
    ``,
    `## Commit Message`,
    ``,
    "```",
    commitMessageText, // full formatted message from format-commit.js
    "```",
    ``,
    `## Pull Request`,
    ``,
    `**Branch**: ${source} → ${target}`,
    `**Title**: ${prTitle}`,
    `**Commits**: ${commitCount} commit(s)`,
    ``,
    `### Description`,
    ``,
    prDescription, // full PR description from Step 6b logic
  ].join("\n")
)
````

In the chat response text, output a clickable link:

```
请审阅提交预览：[.tmp/commit-preview.md](.tmp/commit-preview.md)
```

Then show ONE combined prompt:

```typescript
ask_questions([
  {
    header: "确认提交",
    question: "已弹出预览，请审阅后选择操作：",
    options: [
      { label: "✅ 全部执行 (commit + push + PR)", recommended: true },
      { label: "✅ 仅 commit + push (不创建 PR)" },
      { label: "✏️ 修改 commit message", description: "返回重新生成消息" },
      { label: "❌ 取消" },
    ],
  },
])
```

**Handling responses:**

| Selection             | Action                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `✅ 全部执行`         | Mark id:3 `completed`. Delete preview. Proceed to Phase 2 with PR creation.                            |
| `✅ 仅 commit + push` | Mark id:3 `completed`. Delete preview. Proceed to Phase 2 without PR. Mark id:5 `completed` (skipped). |
| `✏️ 修改`             | Delete preview. Return to Phase 0 message generation. Keep id:3 `in-progress`.                         |
| `❌ 取消`             | Delete preview. Mark all remaining todos `completed`. **STOP.**                                        |

```bash
# Always clean up preview file after interaction
rm -f "${previewPath}"
```

---

### Phase 2: Automatic Pipeline (Zero Interaction)

Everything here runs automatically after Interaction 1 approval.

#### Step A: Commit + Push

**Mark todo id:4 as `in-progress`.**

```bash
node .github/skills/git-workflow/scripts/git-workflow.js \
  --all \
  --message-file <path-from-format-commit> \
  --push
```

**Error handling:**

- **Commit fails** (commitlint, lint-staged): Report error, offer retry → return to Phase 0.
- **Push fails** (conflict, auth): Report error, suggest resolution.

On success: **Mark id:4 as `completed`.**

#### Step B: Create PR (parallel with Step C if applicable)

**Skip if user chose "仅 commit + push".** Mark id:5 `completed` and jump to Step C.

**Mark todo id:5 as `in-progress`.**

> **Parallel opportunity:** PR title + summary were already generated in Phase 0.
> No additional computation needed — just call the API.

```bash
node .github/skills/git-workflow/scripts/create-pr.js \
  --target <development|main> \
  --title "<title-from-phase-0>" \
  --summary "<summary-from-phase-0>" \
  [--pr-id <n>]   # omit for new PR; add to update existing
```

**Handling `create-pr.js` output:**

| `success` | Field         | Action                                                        |
| --------- | ------------- | ------------------------------------------------------------- |
| `true`    | `url`         | Record PR URL for Interaction 2                               |
| `false`   | `fallbackUrl` | Credentials not configured → include `fallbackUrl` in results |
| `false`   | `error` only  | Record error for Interaction 2                                |

On completion: **Mark id:5 as `completed`.**

#### Step C: Code Review (parallel with Step B)

**Mark todo id:6 as `in-progress`.**

> **Parallel opportunity:** Code review analyzes the local diff, not the PR.
> It can start as soon as commit succeeds — no need to wait for PR creation.

Run the code review workflow:

1. Read `.github/skills/requesting-code-review/SKILL.md`
2. Follow the skill instructions to analyze the diff
3. Collect findings (severity: Critical / Important / Suggestion)

If a PR was created (Step B succeeded), post findings as PR comments:

```bash
# Inline comments
node .github/skills/git-workflow/scripts/add-pr-comment.js \
  --pr-id <pr-number> \
  --signature "🤖 *AI Review — GitHub Copilot*" \
  --data '[
    { "file": "src/path/to/file.ts", "line": 10, "comment": "**[Critical]** Issue..." },
    { "file": "src/path/to/other.ts", "line": 25, "comment": "**[Suggestion]** Consider..." }
  ]'

# General summary
node .github/skills/git-workflow/scripts/add-pr-comment.js \
  --pr-id <pr-number> \
  --signature "🤖 *AI Review — GitHub Copilot*" \
  --comment "## 🔍 Code Review Summary\n\n<markdown summary>"
```

On completion: **Mark id:6 as `completed`.**

> **Note:** If code review was not requested or takes too long, skip and report "review available on demand" in Interaction 2.

---

### Interaction 2: Results + Next Steps (Replaces 3 Separate Gates)

**Mark todo id:7 as `in-progress`.**

Present a unified results summary in the chat:

```markdown
## Results

| Step   | Status | Detail                                           |
| ------ | ------ | ------------------------------------------------ |
| Commit | ✅     | `abc1234` — feat(auth): add login form           |
| Push   | ✅     | → origin/feat/auth-login                         |
| PR     | ✅     | #42 — https://bitbucket.org/.../pull-requests/42 |
| Review | 🔍     | 0 Critical, 1 Important, 2 Suggestions           |
```

Then ask about next steps:

```typescript
ask_questions([
  {
    header: "下一步",
    question: "提交流程已完成。接下来需要什么？",
    options: [
      { label: "📋 查看 Code Review 详情" },
      { label: "🔧 修复 Review 发现的问题", description: "自动修复并创建新 commit" },
      { label: "🧹 合并后清理", description: "切回 development + 删除分支" },
      { label: "📝 继续其他工作" },
      { label: "⏸️ 暂停" },
    ],
  },
])
```

**Handling responses:**

| Selection             | Action                                                               |
| --------------------- | -------------------------------------------------------------------- |
| `📋 查看详情`         | Display full review findings in chat. Re-ask with remaining options. |
| `🔧 修复问题`         | Fix findings → re-enter workflow from Phase 0 for the fix commit.    |
| `🧹 合并后清理`       | Execute post-merge cleanup (see below).                              |
| `📝 继续` / `⏸️ 暂停` | Mark id:7 `completed`. End workflow.                                 |

**Mark id:7 as `completed`** after user selects any terminal option.

---

### Post-Merge Cleanup (On Demand)

Activated when user selects "🧹 合并后清理" or says "已合并" / "merged":

```bash
# Switch to development and pull latest
git checkout development && git pull origin development
```

Then offer branch deletion:

```typescript
ask_questions([
  {
    header: "清理分支",
    question: `是否删除本地分支 \`${featureBranch}\`？`,
    options: [{ label: `✅ 删除 ${featureBranch}`, recommended: true }, { label: "❌ 保留分支" }],
  },
])
```

If confirmed:

```bash
git branch -d <feature-branch>
```

Report: `✅ 已切换到 development 并更新到最新 (${shortHash})。本地分支 \`${featureBranch}\` 已删除。`

---

### Workflow Complete — Hand Back to Session

After the workflow ends (regardless of which phase):

1. **Clear the todo list** (empty array)
2. **Trigger the universal session end gate** from `copilot-instructions.md`
   - Derive options from current session context
   - This is MANDATORY — the commit workflow does NOT own the session end

> ⚠️ The git-commit-workflow is a **sub-workflow**. When it completes,
> control returns to the main session.

---

## 🔄 Error Recovery

### Commit Failure (commitlint / lint-staged)

```
Phase 2 Step A fails → Report specific error → Offer:
  ✏️ "Auto-fix and retry" (for lint issues)
  🔙 "Return to Phase 0" (for message issues)
  ❌ "Cancel workflow"
```

### Push Failure (conflict / auth)

```
Phase 2 Step A push fails → Report error → Offer:
  🔄 "Pull and rebase, then retry"
  ❌ "Cancel (commit preserved locally)"
```

### PR Creation Failure (auth / API)

```
Phase 2 Step B fails → Still report commit/push success in Interaction 2
  → Include fallback URL for manual PR creation
  → Workflow is NOT blocked — PR is optional
```

---

## 💡 [EXAMPLES] Usage Patterns

### Example 1: Full Flow (commit + push + PR + review)

```
Phase 0 (auto):
  parse-diff → "3 files: 2 modified, 1 added (+45 -12 lines)"
  read instructions + generate message + validate → valid ✅
  detect branch: feat/auth-login → target: development
  prepare PR title + summary

Interaction 1:
  User sees preview with diff summary + commit message + PR description
  User selects: "✅ 全部执行 (commit + push + PR)"

Phase 2 (auto, pipeline):
  git-workflow.js → commit abc1234 + push ✅
  ├─ (parallel) create-pr.js → PR #42 ✅
  └─ (parallel) code review → 1 Important, 2 Suggestions

Interaction 2:
  Shows: commit ✅, push ✅, PR #42 ✅, review 🔍
  User selects: "📝 继续其他工作"
  Workflow ends ✅
```

### Example 2: Commit Only (no PR)

```
Phase 0 (auto):
  parse + generate + validate → valid ✅

Interaction 1:
  User selects: "✅ 仅 commit + push (不创建 PR)"

Phase 2 (auto):
  git-workflow.js → commit def5678 + push ✅
  PR step: skipped
  Review: skipped

Interaction 2:
  Shows: commit ✅, push ✅
  User selects: "⏸️ 暂停"
  Workflow ends ✅
```

### Example 3: Validation Failure Recovery

```
Phase 0 (auto):
  generate message → format-commit.js → { valid: false, errors: ["Body line exceeds 72 chars"] }
  Auto-fix: shorten line → retry → { valid: true } ✅
  (User never sees the failure)

Interaction 1:
  User sees clean preview → "✅ 全部执行"
  Proceeds normally
```

### Example 4: Push Conflict Recovery

```
Phase 0 + Interaction 1: normal flow

Phase 2:
  git-workflow.js → commit ✅, push FAILED (conflict)

  Agent reports: "Push 失败：远程有新提交。"
  Offers: "🔄 Pull rebase and retry" / "❌ Cancel"

  User: "🔄 retry"
  git pull --rebase origin development
  git push → ✅

Interaction 2: normal results display
```

---

## 📊 Performance Comparison

| Metric                 | Before (9-step) | After (4-phase)     | Improvement |
| ---------------------- | --------------- | ------------------- | ----------- |
| User interactions      | 6               | 2                   | **-67%**    |
| Sequential wait points | 9               | 4                   | **-56%**    |
| Parallel operations    | 0               | 3 groups            | ∞           |
| Estimated wall time    | 60-120s         | 15-30s + 2 confirms | **~60-75%** |

---

## 🔗 Script Reference

Scripts are located at `.github/skills/git-workflow/scripts/`:

| Script                | Purpose            | Input                                                     | Output                        |
| --------------------- | ------------------ | --------------------------------------------------------- | ----------------------------- |
| `parse-diff.js`       | Analyze changes    | `--staged` or `--files`                                   | JSON: files, stats, summary   |
| `validate-message.js` | Validate format    | stdin: plain text                                         | JSON: valid, errors           |
| `format-commit.js`    | Format & write     | stdin: `{title, paragraphs}`                              | JSON: messageFilePath, valid  |
| `git-workflow.js`     | Execute workflow   | `--all --message-file <path> --push`                      | JSON: add/commit/push results |
| `create-pr.js`        | Create / update PR | `--target <branch> [--title] [--summary] [--description]` | JSON: success, url            |
| `add-pr-comment.js`   | Add PR comments    | `--pr-id <n> --comment <text>`                            | JSON: success, results        |

> Prefer using `--summary` with `create-pr.js` so the script can auto-generate the full description. You may also pass `--description` manually; the script will normalize literal `\n` / `\r` sequences to real newlines for cross-shell compatibility.

---

## 🔑 Credentials Setup

> ⚠️ **Important**: Must use a **Bitbucket Cloud API Token** — NOT an Atlassian Account API Token.
> The `ATATT3x...` tokens from `id.atlassian.com` are for Jira/Confluence and will **not** work with `api.bitbucket.org`.
> Bitbucket API tokens use **Basic auth** (email + token), not Bearer.

1. Create a token at: **`https://bitbucket.org/account/settings/api-tokens/`** → "Create API token"
   - Required scopes: **Repositories** (Read + Write), **Pull requests** (Read + Write)
2. Add **both** vars to `~/.bashrc` (or `~/.bash_profile`):
   ```bash
   export BITBUCKET_EMAIL="your-atlassian-email@example.com"
   export BITBUCKET_TOKEN="your-bitbucket-api-token"
   ```
   Then run: `source ~/.bashrc`
3. Or set both `BITBUCKET_EMAIL` and `BITBUCKET_TOKEN` in **Windows User Environment Variables** and restart your editor.
