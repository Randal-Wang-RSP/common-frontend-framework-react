# GitHub PR Workflow

Platform-specific PR operations for GitHub-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = GitHub.
>
> **Prerequisite:** Read the main [SKILL.md](../SKILL.md) first for generic Git Flow rules,
> branch naming, merge strategy, and AI agent behavior rules. This file covers only the
> **GitHub-specific workflow** — using MCP tools or `gh` CLI for PR operations.

---

## Optimized Workflow (4-Phase Model)

This workflow follows the same compressed interaction model as the Bitbucket workflow.
See [SKILL.md](../SKILL.md) § "Commit/PR Message Review" for the core principle.

```
Phase 0 (auto, parallel) → Interaction 1 (confirm all) → Phase 2 (auto, pipeline) → Interaction 2 (results + next)
```

### Phase 0: Automatic Preparation

Run in parallel:

1. **Analyze staged changes** — `git diff --cached --stat`
2. **Read commit instructions** — `.github/.copilot-commit-message-instructions.md`
3. **Detect branch + target** — `git rev-parse --abbrev-ref HEAD` → infer target branch
4. **Generate + validate commit message** — AI generates, pipe to `format-commit.js` if available
5. **Prepare PR content** — collect commits via `git log origin/<target>..HEAD --format="%s" --reverse`, generate title + summary

### Interaction 1: Combined Confirmation

Show the user a single preview containing:

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

### Phase 2: Automatic Pipeline

After user approval, execute in sequence (with parallel steps where possible):

#### Step A: Commit + Push

```bash
git add <files>
git commit -F <message-file>   # or git commit -m "<message>"
git push -u origin <branch>
```

#### Step B: Create PR (parallel with Step C)

Use MCP tools or `gh` CLI:

**Option 1 — MCP Tool:**

```typescript
mcp_github_create_pull_request({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  title: "<type>(<scope>): <description>",
  body: "<PR description — MUST use real newlines, NOT \\n escapes>",
  head: "<source-branch>",
  base: "<target-branch>", // "development" for features, "main" for releases/hotfixes
})
```

**Option 2 — gh CLI:**

```bash
gh pr create \
  --title "<type>(<scope>): <description>" \
  --body "$(cat <<'EOF'
## Summary
<summary paragraph>

## Changes
- Change 1
- Change 2

## Testing
- How tested

## Checklist
- [ ] Code follows project conventions
- [ ] Tests added/updated and passing
- [ ] No lint or type errors
- [ ] Branch is up-to-date with target branch
EOF
)" \
  --base <target-branch>
```

#### Step C: Code Review (parallel with Step B)

Start analyzing the diff for code review while PR creation is in progress.
Post findings to the PR after it's created:

```typescript
mcp_github_add_issue_comment({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  issueNumber: <pr-number>,
  body: "## 🔍 Code Review Summary\n\n<findings in markdown>"
})
```

### Interaction 2: Results + Next Steps

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

---

## Error Recovery

| Failure              | Action                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Push conflict        | `git pull --rebase origin <target>` → retry push                                                  |
| PR creation fails    | Report error, provide manual URL: `https://github.com/<owner>/<repo>/compare/<target>...<source>` |
| MCP tool unavailable | Fall back to `gh` CLI                                                                             |

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
