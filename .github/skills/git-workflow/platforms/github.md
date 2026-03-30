# GitHub PR Workflow

Platform-specific PR operations for GitHub-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = GitHub.
>
> **Prerequisite:** Read the main [SKILL.md](../SKILL.md) first for generic Git Flow rules,
> branch naming, merge strategy, and AI agent behavior rules. This file covers only the
> **GitHub-specific workflow** — using subagent delegation with `gh` CLI or MCP tools.

---

## Subagent-Delegated Workflow

This workflow follows the same subagent architecture as the Bitbucket workflow.
See [SKILL.md](../SKILL.md) § "Subagent Orchestration Model" for the core principle.

```
Prep Subagent (background) → Main Agent: Interaction 1 → Execute Subagent (sync) → Main Agent: Interaction 2
                                                                                 └→ PR Subagent (optional, sync)
```

### Subagent Architecture

| Role        | Category | Skills       | Run Mode                  | Purpose                                           |
| ----------- | -------- | ------------ | ------------------------- | ------------------------------------------------- |
| **Prep**    | `quick`  | `git-master` | `run_in_background=true`  | Analyze changes, draft commit message, prepare PR |
| **Execute** | —        | `git-master` | `run_in_background=false` | Stage, commit, push, handle hook failures         |
| **PR**      | `quick`  | `git-master` | `run_in_background=false` | Create PR via `gh` CLI or MCP, post review        |

**Session chaining:** Execute reuses Prep's `session_id` for context continuity.

### Environment Adaptation

| Phase          | opencode (Sisyphus)                                               | VS Code Copilot                          |
| -------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| Phase 0 (Prep) | `task(category="quick", load_skills=["git-master"])` — background | Agent runs the `[INSTRUCTIONS]` directly |
| Interaction 1  | `question()`                                                      | `vscode_askQuestions()`                  |
| Phase 2 (Exec) | `task(session_id=..., load_skills=["git-master"])` — sync         | Agent runs the `[INSTRUCTIONS]` directly |
| PR creation    | `task(category="quick", load_skills=["git-master"])` — sync       | Agent runs `gh` CLI / MCP tools directly |
| Interaction 2  | `question()`                                                      | `vscode_askQuestions()`                  |

**VS Code Copilot agents:** Ignore `task()` wrappers — read the `[INSTRUCTIONS]` section inside each prompt template and execute those steps directly.

---

### Phase 0: Prep Subagent

```typescript
const prepTask = task({
  category: "quick",
  load_skills: ["git-master"],
  run_in_background: true,
  description: "Git prep: analyze and draft commit",
  prompt: `
    [CONTEXT]
    Workspace: ${workspaceRoot}
    Platform: GitHub
    Commit rules: .github/.copilot-commit-message-instructions.md

    [GOAL]
    Analyze staged git changes and produce everything needed for user confirmation.

    [INSTRUCTIONS]
    Run in parallel:
    1. git diff --cached --stat (analyze staged changes)
    2. Read .github/.copilot-commit-message-instructions.md
    3. git rev-parse --abbrev-ref HEAD → infer target branch

    Then sequentially:
    4. Generate commit message following content rules
    5. If .github/skills/git-workflow/scripts/format-commit.js exists, validate through it
    6. Collect commits: git log origin/<target>..HEAD --format="%s" --reverse
    7. Generate PR title + summary (follow SKILL.md § PR Convention)

    [OUTPUT FORMAT]
    - DIFF_SUMMARY: files changed, lines added/removed
    - STAGED_FILES: list of file paths
    - COMMIT_MESSAGE: full validated message
    - BRANCH: current branch name
    - TARGET: inferred target branch
    - PR_TITLE: conventional commits format
    - PR_SUMMARY: full PR description
    - COMMIT_LOG: commits since divergence

    [MUST NOT DO]
    - Do NOT run git add, git commit, or git push
    - Do NOT interact with the user
  `,
})
```

**When Prep completes**, collect results:

```typescript
const prepResult = background_output({ task_id: prepTask.task_id })
// Extract structured sections: DIFF_SUMMARY, COMMIT_MESSAGE, PR_TITLE, etc.
```

### Interaction 1: Combined Confirmation (Main Agent)

Show the user a single preview assembled from Prep Subagent output:

- Diff summary (files changed, lines added/removed)
- Commit message (full formatted text)
- PR details (title, source → target, description)

```typescript
ask_questions([
  {
    header: "确认提交",
    question: "请审阅后选择操作：",
    options: [
      { label: "✅ 全部执行 (commit + push + PR)", recommended: true },
      { label: "✅ 仅 commit + push (不创建 PR)" },
      { label: "✏️ 修改 commit message" },
      { label: "❌ 取消" },
    ],
  },
])
```

### Phase 2: Execute Subagent

````typescript
const execTask = task({
  session_id: prepTask.session_id,
  load_skills: ["git-master"],
  run_in_background: false,
  description: "Git execute: commit and push",
  prompt: `
    [CONTEXT]
    User confirmed: commit + push.
    Use the commit message and staged files from your earlier analysis.

    [INSTRUCTIONS]
    1. Stage files: git add <files>
    2. Commit: git commit -F <message-file> (or git commit -m "<message>")
    3. Push: git push -u origin <branch>

    4. If commit fails (hook rejection):
       - Analyze error, auto-fix if possible, retry once
       - If still failing, report clearly

    5. If push fails (conflict):
       - Report "Push failed: remote has new commits"
       - Do NOT auto-resolve

    [OUTPUT FORMAT]
    - STATUS: success | commit_failed | push_failed
    - COMMIT_SHA: short hash (if successful)
    - BRANCH: pushed branch name
    - ERROR: details (if failed)

    [MUST NOT DO]
    - Do NOT create PRs
    - Do NOT force push
    - Do NOT interact with the user
  `,
})
```

### PR Subagent (Optional)

**Skipped if user chose "仅 commit + push".**

```typescript
const prTask = task({
  category: "quick",
  load_skills: ["git-master"],
  run_in_background: false,
  description: "Create GitHub PR",
  prompt: `
    [CONTEXT]
    Platform: GitHub
    Source branch: ${prepResult.BRANCH}
    Target branch: ${prepResult.TARGET}
    PR title: ${prepResult.PR_TITLE}
    PR summary:
    ${prepResult.PR_SUMMARY}

    [INSTRUCTIONS]
    Create the PR using one of these methods (in order of preference):

    Option 1 — gh CLI:
      gh pr create \
        --title "${prepResult.PR_TITLE}" \
        --body "$(cat <<'EOF'
${prepResult.PR_SUMMARY}
EOF
      )" \
        --base ${prepResult.TARGET}

    Option 2 — MCP Tool (if gh CLI unavailable):
      mcp_github_create_pull_request({
        owner: "<org-or-user>",
        repo: "<repo-name>",
        title: "${prepResult.PR_TITLE}",
        body: <PR_SUMMARY with REAL newlines, NOT \\n escapes>,
        head: "${prepResult.BRANCH}",
        base: "${prepResult.TARGET}",
      })

    CRITICAL: The body parameter MUST use actual multi-line strings (real newlines),
    NOT \\n escape sequences. Escaped newlines break markdown rendering.

    (Optional) Post code review if requested:
      gh pr comment <pr-number> --body "<review findings>"
      OR: mcp_github_add_issue_comment(...)

    [OUTPUT FORMAT]
    - PR_STATUS: success | failed
    - PR_URL: GitHub PR URL (if successful)
    - PR_NUMBER: PR number
    - FALLBACK_URL: https://github.com/<owner>/<repo>/compare/<target>...<source>
    - REVIEW_SUMMARY: findings (if review performed)

    [MUST NOT DO]
    - Do NOT modify source code
    - Do NOT make commits
    - Do NOT interact with the user
  `,
})
````

### Interaction 2: Results + Next Steps (Main Agent)

Present unified results and ask about next actions (same pattern as Bitbucket workflow).

---

## Body Formatting Rule

**CRITICAL:** The `body` parameter in MCP tools MUST use actual multi-line strings (real newlines), NOT `\n` escape sequences. Escaped newlines are stored literally and break markdown rendering.

```
# ❌ Escape sequences — renders as one long line
body: "## Summary\n\nSome text\n\n## Changes\n- item"

# ✅ Real newlines — renders correctly as markdown
body: `## Summary

Some text

## Changes
- item`
```

If a PR description is found to be malformatted, use the update tool to fix it:

```typescript
mcp_github_update_pull_request({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  pullNumber: <pr-number>,
  body: "<corrected body with real newlines>"
})
```

Or via `gh` CLI:

```bash
gh pr edit <pr-number> --body "<corrected body>"
```

---

## Error Recovery

| Failure              | Action                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Push conflict        | `git pull --rebase origin <target>` → re-fire Execute Subagent                                    |
| PR creation fails    | Report error, provide manual URL: `https://github.com/<owner>/<repo>/compare/<target>...<source>` |
| MCP tool unavailable | Fall back to `gh` CLI (PR Subagent handles this internally)                                       |
| `gh` auth failure    | Report error, suggest `gh auth login`                                                             |

---

## Quick Reference

```bash
# Commit + push + PR (using gh CLI)
git add <files>
git commit -m "<type>(<scope>): <description>"
git push -u origin <branch>
gh pr create --title "<title>" --body "<body>" --base development

# Update existing PR description
gh pr edit <pr-number> --body "<new body>"

# Add comment to PR
gh pr comment <pr-number> --body "<comment>"

# Merge PR (after approval)
gh pr merge <pr-number> --squash  # for features → development
gh pr merge <pr-number> --merge   # for releases/hotfixes → main
```
