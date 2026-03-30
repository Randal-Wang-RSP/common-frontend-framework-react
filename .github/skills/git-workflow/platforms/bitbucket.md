# Bitbucket PR Workflow

Platform-specific scripted commit and PR workflow for Bitbucket-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = Bitbucket.
>
> **Prerequisite:** Read the main [SKILL.md](../SKILL.md) first for generic Git Flow rules,
> branch naming, merge strategy, and AI agent behavior rules. This file covers only the
> **Bitbucket-specific scripted workflow** — the subagent-delegated commit/PR automation.

---

## ✅ [TASKS] Subagent-Delegated Workflow

> ### 🚨 HARD STOP — READ BEFORE EXECUTING ANY GIT COMMAND
>
> **RULE 1:** You MUST receive explicit user confirmation **before every push to remote**. No exceptions.
>
> **RULE 2:** The user selecting `✅ 提交变更` in a prior turn is NOT sufficient. Each commit workflow requires its own confirmation at **Interaction 1** (see below).
>
> **Violation = unauthorised remote push. Never skip the confirmation gate.**

### Design Principles

This workflow delegates heavy git operations to specialized subagents, keeping the main agent's context minimal:

1. **Subagent isolation** — Diff parsing, message generation, and pipeline execution run in subagent context windows, not the main agent
2. **Session continuity** — Execute Subagent reuses Prep Subagent's `session_id`, preserving full context without re-reading files
3. **Compressed interactions** — 2 user confirmations (unchanged), handled by main agent only
4. **Token efficiency** — Main agent sees only structured summaries (~300 tokens), not raw git output (~3000+ tokens)

```
Prep Subagent (background) → Main Agent: Interaction 1 → Execute Subagent (sync) → Main Agent: Interaction 2
                                                                                 └→ PR Subagent (optional, sync)
```

---

### Subagent Architecture

| Role        | Category | Skills       | Run Mode                  | Purpose                                                   |
| ----------- | -------- | ------------ | ------------------------- | --------------------------------------------------------- |
| **Prep**    | `quick`  | `git-master` | `run_in_background=true`  | Analyze changes, draft commit message, prepare PR content |
| **Execute** | —        | `git-master` | `run_in_background=false` | Stage, commit, push, handle hook failures                 |
| **PR**      | `quick`  | `git-master` | `run_in_background=false` | Create PR, optionally post review comments                |

**Session chaining:** Execute reuses Prep's `session_id` — no `category` needed, full context preserved.

### Environment Adaptation

| Phase          | opencode (Sisyphus)                                               | VS Code Copilot                          |
| -------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| Phase 0 (Prep) | `task(category="quick", load_skills=["git-master"])` — background | Agent runs the `[INSTRUCTIONS]` directly |
| Interaction 1  | `question()`                                                      | `vscode_askQuestions()`                  |
| Phase 2 (Exec) | `task(session_id=..., load_skills=["git-master"])` — sync         | Agent runs the `[INSTRUCTIONS]` directly |
| PR creation    | `task(category="quick", load_skills=["git-master"])` — sync       | Agent runs script calls directly         |
| Interaction 2  | `question()`                                                      | `vscode_askQuestions()`                  |
| Preview file   | `write()`                                                         | `create_file()`                          |
| Todo tracking  | `todowrite()`                                                     | `manage_todo_list()`                     |

**VS Code Copilot agents:** Ignore `task()` wrappers — read the `[INSTRUCTIONS]` section inside each prompt template and execute those steps directly. All phases, confirmations, and error recovery apply identically.

---

### Phase 0: Prep Subagent

**Main agent fires a background subagent to analyze changes and prepare everything:**

```typescript
const prepTask = task(
  category: "quick",
  load_skills: ["git-master"],
  run_in_background: true,
  description: "Git prep: analyze and draft commit",
  prompt: `
    [CONTEXT]
    Workspace: ${workspaceRoot}
    Scripts: .github/skills/git-workflow/scripts/
    Commit rules: .github/.copilot-commit-message-instructions.md

    [GOAL]
    Analyze staged git changes and produce everything needed for user confirmation:
    commit message, PR content, and a concise diff summary.

    [INSTRUCTIONS]
    Run these in parallel:
    1. node .github/skills/git-workflow/scripts/parse-diff.js --staged
    2. Read .github/.copilot-commit-message-instructions.md
    3. git rev-parse --abbrev-ref HEAD → infer target branch
       (feat/* | fix/* → development, hotfix/* | release/* → main)

    Then sequentially:
    4. Generate commit message as JSON {title, paragraphs} following the content rules
    5. Validate: echo '<json>' | node .github/skills/git-workflow/scripts/format-commit.js
       - If invalid → auto-fix and retry (never surface failures to main agent)
    6. Collect commits: git log origin/<target>..HEAD --format="%s" --reverse
    7. Generate PR title + summary (follow SKILL.md § PR Convention)

    [OUTPUT FORMAT]
    Return a structured response with these clearly labeled sections:
    - DIFF_SUMMARY: e.g. "3 files changed: 2 modified, 1 added (+45 -12 lines)"
    - STAGED_FILES: list of file paths
    - COMMIT_MESSAGE: full validated message text
    - MESSAGE_FILE_PATH: path written by format-commit.js
    - BRANCH: current branch name
    - TARGET: inferred target branch
    - PR_TITLE: conventional commits format
    - PR_SUMMARY: full PR description following the template
    - COMMIT_LOG: commits since divergence from target

    [MUST NOT DO]
    - Do NOT run git add, git commit, or git push
    - Do NOT interact with the user
    - Do NOT create files outside .tmp/
  `
)
// Store: prepTask.task_id, prepTask.session_id
// Continue with non-overlapping work or end response to wait for completion
```

**When Prep completes**, collect results:

```typescript
const prepResult = background_output(task_id: prepTask.task_id)
// Extract structured sections: DIFF_SUMMARY, COMMIT_MESSAGE, PR_TITLE, etc.
```

> **Key insight:** By the time the user sees anything, ALL preparation is done. The main agent
> never processes raw diff output — only the Prep Subagent's structured summary.

---

### Interaction 1: Combined Confirmation (Main Agent)

**Main agent presents the Prep Subagent's summary to the user.**

#### Preview File

> ⚠️ **CRITICAL — Preview file location**: ALWAYS use the **`.tmp/` directory** in workspace root (e.g. `<workspace-root>/.tmp/commit-preview.md`).
> **NEVER** use `/tmp`, system temp folders, or paths outside the project.
> Only workspace-rooted files are visible/clickable in VS Code's Copilot Chat.

```bash
mkdir -p .tmp
```

Write a combined preview file from the Prep Subagent's output:

````typescript
const previewPath = `<absoluteWorkspaceRoot>/.tmp/commit-preview.md`

create_file(
  previewPath,
  [
    `# Commit & PR Preview`,
    ``,
    `## Diff Summary`,
    ``,
    prepResult.DIFF_SUMMARY,
    ``,
    `## Commit Message`,
    ``,
    "```",
    prepResult.COMMIT_MESSAGE,
    "```",
    ``,
    `## Pull Request`,
    ``,
    `**Branch**: ${prepResult.BRANCH} → ${prepResult.TARGET}`,
    `**Title**: ${prepResult.PR_TITLE}`,
    ``,
    `### Description`,
    ``,
    prepResult.PR_SUMMARY,
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

| Selection             | Action                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `✅ 全部执行`         | Delete preview. Proceed to Execute Subagent with `createPR: true`.  |
| `✅ 仅 commit + push` | Delete preview. Proceed to Execute Subagent with `createPR: false`. |
| `✏️ 修改`             | Delete preview. Re-fire Prep Subagent (new task, new session).      |
| `❌ 取消`             | Delete preview. **STOP.** End workflow.                             |

```bash
# Always clean up preview file after interaction
rm -f "${previewPath}"
```

---

### Phase 2: Execute Subagent

**Main agent delegates commit + push to the Execute Subagent, reusing Prep's session:**

```typescript
const execTask = task(
  session_id: prepTask.session_id,  // Reuses Prep's full context (diff, files, message)
  load_skills: ["git-master"],
  run_in_background: false,         // Sync — main agent waits for result
  description: "Git execute: commit and push",
  prompt: `
    [CONTEXT]
    User confirmed: commit + push.
    Commit message file: (use MESSAGE_FILE_PATH from your earlier output)
    All staged files should be committed.

    [INSTRUCTIONS]
    Execute the commit pipeline:
    1. Run:
       node .github/skills/git-workflow/scripts/git-workflow.js \
         --all \
         --message-file <MESSAGE_FILE_PATH> \
         --push

    2. If commit fails (commitlint / lint-staged):
       - Analyze the specific error
       - Auto-fix if possible (lint/format issues)
       - Retry once
       - If still failing, report the error clearly

    3. If push fails (conflict):
       - Report "Push failed: remote has new commits"
       - Do NOT auto-resolve — report for main agent to handle

    [OUTPUT FORMAT]
    Return clearly labeled:
    - STATUS: success | commit_failed | push_failed
    - COMMIT_SHA: short hash (if successful)
    - BRANCH: branch that was pushed
    - ERROR: error details (if failed)
    - HOOK_OUTPUT: any lint-staged or commitlint output (if relevant)

    [MUST NOT DO]
    - Do NOT interact with the user
    - Do NOT create PRs
    - Do NOT force push
    - Do NOT amend commits
  `
)
```

**Main agent evaluates result:**

- `STATUS: success` → Continue to PR Subagent (if requested) or Interaction 2
- `STATUS: commit_failed` → Report error, offer retry / return to Phase 0 / cancel
- `STATUS: push_failed` → Report error, offer pull-rebase-retry / cancel

---

### PR Subagent (Optional)

**Skipped if user chose "仅 commit + push".**

```typescript
const prTask = task(
  category: "quick",
  load_skills: ["git-master"],
  run_in_background: false,
  description: "Create Bitbucket PR",
  prompt: `
    [CONTEXT]
    Repository: Bitbucket-hosted
    Source branch: ${prepResult.BRANCH}
    Target branch: ${prepResult.TARGET}
    PR title: ${prepResult.PR_TITLE}
    PR summary (use as --summary argument):
    ${prepResult.PR_SUMMARY}

    Scripts: .github/skills/git-workflow/scripts/

    [INSTRUCTIONS]
    1. Create the PR:
       node .github/skills/git-workflow/scripts/create-pr.js \
         --target ${prepResult.TARGET} \
         --title "${prepResult.PR_TITLE}" \
         --summary "${prepResult.PR_SUMMARY}"

    2. Handle create-pr.js output:
       - success=true → record the URL
       - success=false + fallbackUrl → record fallback URL
       - success=false + error only → record error message

    3. (Optional) If code review was requested:
       - Read .github/skills/requesting-code-review/SKILL.md
       - Analyze the diff following that skill's instructions
       - Post findings as PR comments:
         node .github/skills/git-workflow/scripts/add-pr-comment.js \
           --pr-id <pr-number> \
           --signature "🤖 *AI Review*" \
           --data '<JSON findings array>'

    [OUTPUT FORMAT]
    - PR_STATUS: success | failed
    - PR_URL: Bitbucket PR URL (if successful)
    - FALLBACK_URL: manual creation URL (if API failed)
    - REVIEW_SUMMARY: findings summary (if review was performed)

    [MUST NOT DO]
    - Do NOT modify any source code
    - Do NOT make additional commits
    - Do NOT interact with the user
  `
)
```

---

### Interaction 2: Results + Next Steps (Main Agent)

Present a unified results summary assembled from subagent outputs:

```markdown
## Results

| Step   | Status | Detail                                      |
| ------ | ------ | ------------------------------------------- |
| Commit | ✅     | `${execResult.COMMIT_SHA}` — ${commitTitle} |
| Push   | ✅     | → origin/${prepResult.BRANCH}               |
| PR     | ✅     | #42 — ${prResult.PR_URL}                    |
| Review | 🔍     | ${prResult.REVIEW_SUMMARY}                  |
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
| `🔧 修复问题`         | Fix findings → re-enter workflow from Phase 0 (new Prep Subagent).   |
| `🧹 合并后清理`       | Execute post-merge cleanup (see below).                              |
| `📝 继续` / `⏸️ 暂停` | End workflow.                                                        |

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

1. **Trigger the universal session end gate** from `copilot-instructions.md`
   - Derive options from current session context
   - This is MANDATORY — the commit workflow does NOT own the session end

> ⚠️ The git-commit-workflow is a **sub-workflow**. When it completes,
> control returns to the main session.

---

## 🔄 Error Recovery

### Commit Failure (commitlint / lint-staged)

```
Execute Subagent returns STATUS: commit_failed
→ Main agent reports the specific error to the user
→ Offer:
  ✏️ "Auto-fix and retry" → re-fire Execute Subagent with session_id + fix instructions
  🔙 "Return to Phase 0" → fire new Prep Subagent
  ❌ "Cancel workflow"
```

### Push Failure (conflict / auth)

```
Execute Subagent returns STATUS: push_failed
→ Main agent reports error to the user
→ Offer:
  🔄 "Pull and rebase, then retry" → main agent runs git pull --rebase, then re-fire Execute
  ❌ "Cancel (commit preserved locally)"
```

### PR Creation Failure (auth / API)

```
PR Subagent returns PR_STATUS: failed
→ Still report commit/push success in Interaction 2
→ Include FALLBACK_URL for manual PR creation
→ Workflow is NOT blocked — PR is optional
```

---

## 💡 [EXAMPLES] Usage Patterns

### Example 1: Full Flow (commit + push + PR)

```
Main Agent fires Prep Subagent (background):
  task(category="quick", load_skills=["git-master"], run_in_background=true, ...)
  → Prep runs: parse-diff, read instructions, generate message, validate, prepare PR content
  → Returns: DIFF_SUMMARY, COMMIT_MESSAGE, PR_TITLE, PR_SUMMARY, etc.

Main Agent: Interaction 1
  Writes preview from Prep output → shows to user
  User selects: "✅ 全部执行 (commit + push + PR)"

Main Agent fires Execute Subagent (sync, session_id from Prep):
  task(session_id=prepTask.session_id, load_skills=["git-master"], run_in_background=false, ...)
  → Execute runs: git-workflow.js --all --message-file --push
  → Returns: STATUS=success, COMMIT_SHA=abc1234

Main Agent fires PR Subagent (sync):
  task(category="quick", load_skills=["git-master"], run_in_background=false, ...)
  → PR runs: create-pr.js → PR #42 created
  → Returns: PR_STATUS=success, PR_URL=https://bitbucket.org/.../42

Main Agent: Interaction 2
  Shows: Commit ✅ abc1234, Push ✅, PR #42 ✅
  User selects: "📝 继续其他工作"
  Workflow ends ✅
```

### Example 2: Commit Only (no PR)

```
Prep Subagent (background) → returns summary
Interaction 1 → User selects: "✅ 仅 commit + push"
Execute Subagent (sync) → commit def5678 + push ✅
PR Subagent: skipped
Interaction 2 → Shows: Commit ✅, Push ✅ → User: "⏸️ 暂停"
```

### Example 3: Validation Failure Recovery (invisible to user)

```
Prep Subagent runs:
  generate message → format-commit.js → { valid: false, errors: ["Body line exceeds 72 chars"] }
  Auto-fix internally → retry → { valid: true } ✅
  Returns clean result to main agent (user never sees the failure)
```

### Example 4: Hook Failure Recovery

```
Execute Subagent runs:
  git-workflow.js → commit FAILED (lint-staged found issues)
  Auto-fix lint errors → retry once → commit ✅, push ✅
  Returns: STATUS=success (if retry worked)
  OR: STATUS=commit_failed, ERROR="..." (if retry also failed)

Main agent receives failure → offers user: retry / Phase 0 / cancel
```

---

## 📊 Performance Comparison

| Metric                         | Direct (4-phase)  | Subagent-Delegated            | Improvement        |
| ------------------------------ | ----------------- | ----------------------------- | ------------------ |
| User interactions              | 2                 | 2                             | Same               |
| Main agent context (per cycle) | ~3000-5000 tokens | ~300-500 tokens               | **~90% reduction** |
| Failure handling               | Inline            | Subagent-internal             | Cleaner            |
| Session chaining               | N/A               | Prep → Execute via session_id | Context reuse      |
| Parallel potential             | Limited           | Prep runs in background       | Better throughput  |

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
