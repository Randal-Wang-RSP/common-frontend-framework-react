# Bitbucket PR Workflow

Platform-specific scripted commit and PR workflow for Bitbucket-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = Bitbucket.
>
> **Prerequisite:** Read the main [SKILL.md](../SKILL.md) first for generic Git Flow rules,
> branch naming, merge strategy, and AI agent behavior rules. This file covers only the
> **Bitbucket-specific scripted workflow** — the 9-step commit/PR automation.

---

## ✅ [TASKS] Script-Powered Workflow

> ### 🚨 HARD STOP — READ BEFORE EXECUTING ANY GIT COMMAND
> 
> **RULE 1:** You MUST call `vscode_askQuestions` and receive explicit user confirmation **before every push to remote**. No exceptions.
> 
> **RULE 2:** The user selecting `✅ 提交变更` in a prior turn is NOT sufficient. Each commit workflow requires its own confirmation at **Step 4.5** (see below).
> 
> **Violation = unauthorised remote push. Never skip the confirmation gate.**

### Step 0: Initialize Todo List (ALWAYS FIRST)

Before doing anything else, call `manage_todo_list` to create the full workflow plan:

```typescript
manage_todo_list([
  { id: 1, title: "Request commit permission", status: "not-started" },
  { id: 2, title: "Parse staged changes",      status: "not-started" },
  { id: 3, title: "Generate commit message",   status: "not-started" },
  { id: 4, title: "Validate & format message", status: "not-started" },
  { id: 5, title: "Confirm push",              status: "not-started" },
  { id: 6, title: "Execute git workflow",      status: "not-started" },
  { id: 7, title: "Create PR (if needed)",     status: "not-started" },
  { id: 8, title: "Code review (optional)",    status: "not-started" },
  { id: 9, title: "Post-merge cleanup",        status: "not-started" },
])
```

This gives the user a live view of workflow progress in VS Code.

> **Todo → Step mapping**: id:1 = Step 1 (permission), id:2 = Step 2 (parse), id:3 = Step 3 (generate), id:4 = Step 4 (validate), id:5 = Step 4.5 (confirm gate), id:6 = Step 5 (git push), id:7 = Step 6 (PR), id:8 = Step 8 (code review), id:9 = Step 9 (post-merge cleanup)

> **Note**: If Step 1 is skipped (user JUST approved in same turn), mark todo id:1 as `completed` immediately and proceed.

---

### Step 1: Request User Permission (MANDATORY)

**Mark todo id:1 as `in-progress` before calling `vscode_askQuestions`.**

Use `vscode_askQuestions` with this structure:

```typescript
{
  questions: [{
    header: "提交变更",
    question: "代码变更已完成并验证。是否提交本次变更到 Git？（本次变更：<brief summary>）",
    options: [
      { label: "✅ 允许提交（git add + commit + push）", recommended: true },
      { label: "❌ 暂不提交（我需要再检查）" }
    ]
  }]
}
```

**NEVER** proceed without explicit "Allow" selection.

> **Skip condition**: Step 1 MAY be skipped only when the user JUST selected `✅ 提交变更` in the post-implementation `vscode_askQuestions` **in the same response turn**. In that case, treat that selection as the Step 1 approval and proceed directly to Step 2. All other invocations require a fresh `vscode_askQuestions`.

When user selects "Allow": **mark todo id:1 as `completed`**.
When user selects "Cancel": mark id:1 as `completed`, stop workflow.

### Step 2: Parse Changes

**Mark todo id:2 as `in-progress`**, then run:

IF user selects "Allow":

```bash
node .github/skills/git-workflow/scripts/parse-diff.js --staged
```

**Output**: JSON with `{ files, stats, summary }` for context.

**Mark todo id:2 as `completed`** after parsing.

### Step 3: Generate Commit Message Content

**Mark todo id:3 as `in-progress`**.

1. **READ** `.copilot-commit-message-instructions.md` (entire file)
2. Apply content rules (type selection, imperative mood, English, meaningful description)
3. Structure message as JSON:
   ```json
   {
     "title": "<type>[scope]: <description>",
     "paragraphs": [
       "Description paragraph",
       "Changes:\n- Item 1\n- Item 2",
       "Results:\n- Metric"
     ]
   }
   ```
4. **Focus on CONTENT ONLY** - scripts handle formatting/validation

**Mark todo id:3 as `completed`** once the JSON message is constructed.

### Step 4: Validate & Format Message

**Mark todo id:4 as `in-progress`**.

```bash
echo '<json>' | node .github/skills/git-workflow/scripts/format-commit.js
```

**Result**: 
- ✅ Valid: Returns `{ valid: true, messageFilePath: "/tmp/...", ... }` → **mark todo id:4 as `completed`**
- ❌ Invalid: Returns `{ valid: false, errors: [...] }` → fix and retry (keep id:4 as `in-progress`)

### Step 4.5: Confirm Before Push (MANDATORY — NO EXCEPTIONS)

**Mark todo id:5 as `in-progress`**.

The formatted commit message is already written to `messageFilePath` by `format-commit.js`.
Create a human-readable preview file **in the workspace root** and include the path as a link in the confirmation prompt:

> ⚠️ **CRITICAL — Preview file location**: ALWAYS use the **`.tmp/` directory** in workspace root (e.g. `<workspace-root>/.tmp/commit-preview.md`).  
> **NEVER** use `/tmp`, system temp folders, or paths outside the project.  
> Only workspace-rooted files are visible/clickable in VS Code's Copilot Chat.

```bash
# 0. Ensure .tmp directory exists
mkdir -p .tmp
```

```typescript
// 1. Write a Markdown preview of the commit message
//    ✅ CORRECT: .tmp directory in workspace root
const previewPath = `<absoluteWorkspaceRoot>/.tmp/commit-preview.md`
//    ❌ WRONG:   /tmp/commit-preview-xxx.md  (not visible in VS Code)
create_file(previewPath, [
  `# Commit Preview`,
  ``,
  `**Branch**: ${source} → origin/${source}`,
  ``,
  `\`\`\``,
  commitMessageText,   // full formatted message read from messageFilePath
  `\`\`\``,
].join('\n'))

// 2. In the CHAT RESPONSE TEXT (not inside ask_questions), output a
//    Markdown link so the user can click to open the file:
//      请审阅提交消息：[.tmp/commit-preview.md](.tmp/commit-preview.md)
//    This renders as a clickable link in Copilot Chat.

// 3. Then show a minimal prompt — NO path or content in the question
ask_questions([{
  header: "确认推送",
  question: "已弹出预览，审阅后确认执行 git add → commit → push？",
  options: [
    { label: "✅ 确认推送", recommended: true },
    { label: "✏️ 修改后重新生成", description: "返回 Step 3 重新生成消息" },
    { label: "❌ 取消" }
  ]
}])
```

- If `✅ 确认推送`:
  1. **Mark todo id:5 as `completed`**
  2. `run_in_terminal`: `rm "${previewPath}"`
  3. Proceed to Step 5
- If `✏️ 修改后重新生成`:
  1. `run_in_terminal`: `rm "${previewPath}"`
  2. Mark id:5 as `not-started`, return to Step 3
- If `❌ 取消`:
  1. `run_in_terminal`: `rm "${previewPath}"`
  2. **STOP. Do NOT run git-workflow.js.**

> ⚠️ **This is the only gate that prevents an unauthorised remote push. Never skip it.**

### Step 5: Execute Git Workflow

**Mark todo id:6 as `in-progress`**.

```bash
node .github/skills/git-workflow/scripts/git-workflow.js \
  --all \
  --message-file <path-from-step-4> \
  --push
```

**Error handling**: Script returns structured errors with suggestions (e.g., commitlint failures, push conflicts).

On success: **mark todo id:6 as `completed`**.
On failure: keep id:6 as `in-progress`, report the error.

### Step 6: Offer PR Creation (MANDATORY after successful commit)

**Mark todo id:7 as `in-progress`**.

After `git-workflow.js` reports a successful push, **always** ask the user:

```typescript
{
  questions: [{
    header: "创建 PR",
    question: "提交已推送。是否需要创建 Pull Request？",
    options: [
      { label: "✅ 创建 PR → development", recommended: true },
      { label: "✅ 创建 PR → main" },
      { label: "❌ 不需要，结束流程" }
    ]
  }]
}
```

IF user selects "❌ 不需要": **mark todo id:7 as `completed`**, workflow ends.

IF user selects a branch target, follow this sequence:

#### 6a. Collect ALL commits since merge base (MANDATORY — must execute)

```bash
git log origin/<target>..HEAD --format="%s" --reverse
```

> ⚠️ **CRITICAL**: You MUST execute this command and capture the FULL output.
> Do NOT skip this step. Do NOT assume you know the commits.
> The PR title and summary MUST be based on ALL commits, not just the latest one.

#### 6b. AI generates PR title AND summary (MANDATORY — do NOT skip)

**INPUT**: The COMPLETE commit list from Step 6a (all commits, oldest → newest)

**REQUIREMENT**: Analyze **EVERY commit** in the list and produce **two outputs**:

**① Title** — concise headline for the PR:
- Follows **conventional commit** format: `type(scope): description`
- Uses the **dominant type** by priority: `feat > fix > perf > refactor > chore`
- Sets `(scope)` to the branch name stripped of its prefix (e.g. `feature/setup` → `setup`)
- The **description** must **semantically summarize what this ENTIRE PR achieves** as a whole
  — ⚠️ **CRITICAL**: Do NOT copy-paste ONE commit message
  — ⚠️ **CRITICAL**: Do NOT ignore commits — analyze ALL of them
  — ⚠️ **CRITICAL**: If there are 5 commits, your summary must reflect all 5
  — think: "What would a reviewer need to know at a glance about this entire branch?"
- Must be ≤ 72 characters
- Good examples:
  - `feat(setup): initial project scaffolding and CI automation`
  - `fix(auth): resolve token refresh race condition`
  - `refactor(time-runner): extract PiP logic and improve UI layout`

**② Summary paragraph** — 2-3 sentence natural-language overview for the PR description body:
- Describe *what changed and why* **across ALL commits**, not just one commit
- ⚠️ **CRITICAL**: Must cover the FULL scope of changes in the commit list from 6a
- Audience: a code reviewer who needs context at a glance
- Do NOT exceed 3 sentences; avoid repeating the title
- Good examples:
  - `Refactors the PiP window feature into a dedicated hook and component, improving layout consistency and making the UI resize-aware. Also automates Bitbucket PR creation with commit-driven title and description generation.`
  - `Adds support for theme tokens in PiP forms, fixes UTF-8 encoding issues in skill documentation, and standardizes the five-element framework across all prompt files.`

#### 6c. Preview in VS Code, then confirm

```bash
# 1. Dry-run to build the full payload without calling the API
node .github/skills/git-workflow/scripts/create-pr.js \
  --target <development|main> \
  --title "<AI-generated title from 6b ①>" \
  --summary "<AI-generated summary paragraph from 6b ②>" \
  [--pr-id <n>] \
  --dry-run
```

```bash
# 2. Ensure .tmp directory exists
mkdir -p .tmp
```

```typescript
// 3. Write a human-readable Markdown preview in the .tmp directory.
//    ⚠️ MUST use .tmp/ in workspace root so the file is visible and git-ignored.
//    ⚠️ ALWAYS delete existing file first, then create fresh.
//       Temp files may have been modified by external tools between sessions.
//       NEVER use replace_string_in_file on temp/preview files — always rm + create_file.
const previewPath = `<absoluteWorkspaceRoot>/.tmp/pr-preview.md`

// Step 3a: Delete any existing preview file
run_in_terminal(`rm -f "${previewPath}"`)

// Step 3b: Create fresh preview file
create_file(previewPath, [
  `# PR Preview`,
  ``,
  `**Title**: ${payload.title}`,
  `**${isUpdate ? 'Updating' : 'Creating'}**: ${source} → ${target}`,
  `**Commits included**: ${commits.length} (from Step 6a)`,
  ``,
  `---`,
  ``,
  payload.description,
].join('\n'))

// Step 3c: Read-back verification (MANDATORY)
//    Immediately read the file after writing to confirm content matches.
//    If title or commit count mismatch → delete and recreate.
read_file(previewPath)  // verify title + commits count

// 4. In the CHAT RESPONSE TEXT, output a Markdown link:
//      请审阅 PR 预览：[.tmp/pr-preview.md](.tmp/pr-preview.md)
//    Clickable in Copilot Chat. Do NOT put the path inside ask_questions.
//    ⚠️ VERIFICATION: Check that "Commits included" matches the count from 6a.

// 5. Show a minimal prompt — NO path or content in the question
ask_questions([{
  header: "确认 PR",
  question: `已弹出预览，审阅后确认${isUpdate ? '更新' : '创建'} PR？`,
  options: [
    { label: "✅ 确认", recommended: true },
    { label: "✏️ 修改标题或概述", description: "返回 6b 重新生成" },
    { label: "❌ 取消" }
  ]
}])
```

```bash
# On confirm ✅ — delete preview then call the API
rm "${previewPath}"
node .github/skills/git-workflow/scripts/create-pr.js \
  --target <development|main> \
  --title "<title>" \
  --summary "<summary>" \
  [--pr-id <n>]

# On cancel/retry ✏️ or ❌ — always delete the preview file first
rm "${previewPath}"
```

> **Note on `--pr-id`**: omit when creating a new PR; add `--pr-id <number>` to update an existing one (uses HTTP PUT, expects HTTP 200).

**Handling `create-pr.js` output**:

| `success` | field | Action |
|-----------|-------|--------|
| `true` | `url` | **Mark todo id:7 as `completed`**. Report PR URL to user — workflow complete ✅ |
| `false` | `fallbackUrl` | Mark todo id:7 as `completed`. Credentials not configured → tell user to open `fallbackUrl` in browser |
| `false` | `error` only | Mark todo id:7 as `completed`. Report error message — workflow complete with warning ⚠️ |

> ### 🚨 MANDATORY WORKFLOW END RULE
>
> After marking id:7 as `completed`, if you have **any follow-up question** for the user
> (e.g. "是否还需要更新 PR 描述？", "需要我做 code review 吗？"), you MUST ask it via
> `vscode_askQuestions`. **Never use plain chat text as a question.** Plain text questions are
> invisible to the workflow and cannot be tracked or enforced.

---

### Step 8: Optional Code Review (AFTER PR success)

**Mark todo id:8 as `in-progress`**.

After PR creation succeeds (Step 6 marked as `completed`), **always** offer code review:

```typescript
{
  questions: [{
    header: "代码审查",
    question: "PR 已创建成功。是否需要立即执行代码审查？",
    options: [
      { label: "🔍 立即执行代码审查", description: "读取 requesting-code-review skill 并执行" },
      { label: "⏸️ 稍后手动审查", description: "结束工作流", recommended: true },
      { label: "📝 继续其他工作", description: "结束工作流" }
    ]
  }]
}
```

**IF user selects "🔍 立即执行代码审查"**:

1. **Read the skill file**:
   ```typescript
   read_file({
     filePath: "d:\\source\\rsp\\ctw\\.github\\skills\\requesting-code-review\\SKILL.md",
     startLine: 1,
     endLine: 999  // Read entire file
   })
   ```

2. **Follow the skill instructions** to execute the code review workflow

3. **Post review findings to PR (MANDATORY when PR exists)**:

   After the code review produces findings, use `add-pr-comment.js` to post them
   as comments on the PR page so reviewers can see them in context.

   **AI Signature**: Always include `--signature` to attribute AI-generated comments:
   ```
   --signature "🤖 *AI Review — GitHub Copilot*"
   ```

   **Inline comments** (for file-specific findings):
   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --data '[
       { "file": "src/path/to/file.ts", "line": 10, "comment": "**[Critical]** Issue description..." },
       { "file": "src/path/to/other.ts", "line": 25, "comment": "**[Important]** Suggestion..." }
     ]'
   ```

   **General summary comment** (for overall review):
   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --comment "## 🔍 Code Review Summary\n\n<markdown summary of all findings>"
   ```

   **Comment formatting rules**:
   - Prefix severity: `**[Critical]**`, `**[Important]**`, `**[Suggestion]**`
   - Use Markdown formatting in comment content
   - Include file path and line number in the comment body as fallback
   - Post inline comments first, then a general summary comment last

   > **Note**: If `add-pr-comment.js` fails (missing credentials), report findings in chat instead.
   > The code review results are still valuable even without PR comments.

4. **Fix issues and reply to review comments (MANDATORY after fixes)**:

   After fixing review findings, reply to each original comment with the fix result.
   Use `--parent-id` to create threaded replies:

   **Single reply** (CLI mode):
   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --parent-id <comment-id> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --comment "Fixed in <commit-hash>: <brief description of fix>"
   ```

   **Batch replies** (multiple comments at once):
   ```bash
   node .github/skills/git-workflow/scripts/add-pr-comment.js \
     --pr-id <pr-number> \
     --signature "🤖 *AI Review — GitHub Copilot*" \
     --data '[
       { "parentId": 12345, "comment": "Fixed in abc1234: Added NaN validation" },
       { "parentId": 12346, "comment": "Fixed in abc1234: Extracted to utils.js" }
     ]'
   ```

   **Reply content guidelines**:
   - Start with commit hash: `"Fixed in <hash>: ..."`
   - Briefly describe what was changed
   - Include test/verification result if applicable

5. **After code review completes**: mark todo id:8 as `completed`, workflow ends ✅

**IF user selects "⏸️ 稍后手动审查" or "📝 继续其他工作"**:

- Mark todo id:8 as `completed`
- Workflow ends ✅

> **Note**: This step is OPTIONAL. Users may prefer to review code later or have already reviewed during implementation. The choice respects different workflow preferences.

---

### Step 9: Post-Merge Cleanup (AFTER PR is merged)

**Mark todo id:9 as `in-progress`**.

This step activates when the user confirms that the PR has been merged (or when the agent detects a merged PR). It cleans up the local workspace by switching back to development and pulling the latest changes.

**1. Switch to development and pull latest**:

```bash
git checkout development && git pull origin development
```

**2. Optionally delete the feature branch**:

```typescript
ask_questions([{
  header: "清理分支",
  question: `PR 已合并。是否删除本地分支 \`${featureBranch}\`？`,
  options: [
    { label: `✅ 删除 ${featureBranch}`, recommended: true },
    { label: "❌ 保留分支" }
  ]
}])
```

If user confirms deletion:
```bash
git branch -d <feature-branch>
```

**3. Report cleanup result**:

Report: `✅ 已切换到 development 并更新到最新 (${shortHash})。本地分支 \`${featureBranch}\` 已删除。`

**Mark todo id:9 as `completed`**.

> **Trigger**: This step is offered after the user says "已合并" / "merged" / "PR 已合并",
> or when the agent detects the PR has been merged via API.
> It can also be included as an option in the post-workflow `vscode_askQuestions`.

---

### Workflow Complete — Hand Back to Session

After the git-commit-workflow ends (regardless of which step):

1. **Clear the todo list** (`manage_todo_list` with empty array)
2. **Trigger the universal ask_questions rule** from `copilot-instructions.md` Section 5A
   - Derive options from current session context
   - This is MANDATORY — the commit workflow does NOT own the session end

> ⚠️ The git-commit-workflow is a **sub-workflow**. When it completes,
> control returns to the main session. Section 5A always applies.

---

**Credentials setup** (guide user through this when `fallbackUrl` is returned):

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
3. Or set both `BITBUCKET_EMAIL` and `BITBUCKET_TOKEN` in **Windows User Environment Variables** and restart VS Code.

---


---

### 3. Script Delegation

**Let scripts handle**:
- Character limit validation (title ≤100, body ≤72)
- Message file writing and `git commit -F <file>` execution
- Conventional commit format verification
- Git command sequencing and error handling

**Your responsibility**:
- Generating meaningful commit content
- Selecting appropriate type/scope
- Crafting clear descriptions and metrics

---


---

## 💡 [EXAMPLES] Usage Patterns

### Example 1: Standard Feature Commit (with PR)

```
1. ask_questions → User: "✅ 允许"
2. parse-diff.js → "3 files: 2 modified, 1 added (+45 -12 lines)"
3. Read guidelines → Generate JSON:
   { "title": "feat(auth): add OAuth2 login",
     "paragraphs": ["Implement OAuth2 with Google provider", "Changes:\n- Add strategy config\n- Integrate library"] }
4. format-commit.js → { valid: true, messageFilePath: "/tmp/msg.txt" }
5. git-workflow.js --all --message-file /tmp/msg.txt --push
   → { commit: { success: true, hash: "abc123" }, push: { success: true } }
6. ask_questions → User: "✅ 创建 PR → development"
   create-pr.js --target development
   → { success: true, url: "https://bitbucket.org/.../pull-requests/42" }
   Report: "PR created: https://..."
```

### Example 2: Validation Failure Recovery

```
1-3. [Normal flow]
4. format-commit.js → { valid: false, errors: ["Body line 2 exceeds 72 chars (78 chars): '- Implement comprehensive validation logic...'"] }
5. Shorten line: "- Implement comprehensive validation\n- Add credential checks"
6. Retry format-commit.js → { valid: true }
7. Proceed with git-workflow.js
```

---


---

## 🔗 Related Files

- **Content Rules**: `.github/.copilot-commit-message-instructions.md` (MANDATORY)
- **Scripts**: `.github/skills/git-workflow/scripts/*.js`
- **Validation Config**: `commitlint.config.ts`

---

