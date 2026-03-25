# GitHub PR Workflow

Platform-specific PR operations for GitHub-hosted repositories.

> **Loaded on-demand** when `copilot-instructions.md` → Context → Hosting = GitHub.

---

## Creating a Pull Request

Use the `mcp_github_create_pull_request` MCP tool:

```typescript
mcp_github_create_pull_request({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  title: "<type>(<scope>): <description>",
  body: "<PR description in markdown>",
  head: "<source-branch>",
  base: "<target-branch>"  // "development" for features, "main" for releases/hotfixes
})
```

### Body Formatting Rule

**CRITICAL:** The `body` parameter MUST use actual multi-line strings (real newlines), NOT `\n` escape sequences. Escaped newlines are stored literally and break markdown rendering.

```
# ❌ Escape sequences — renders as one long line
body: "## Summary\n\nSome text\n\n## Changes\n- item"

# ✅ Real newlines — renders correctly as markdown
body: `## Summary

Some text

## Changes
- item`
```

---

## Updating a Pull Request

If the PR body is malformatted or needs changes:

```typescript
mcp_github_update_pull_request({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  pullNumber: <pr-number>,
  body: "<corrected body with real newlines>"
})
```

---

## Adding PR Comments

Use `mcp_github_add_issue_comment` for general comments:

```typescript
mcp_github_add_issue_comment({
  owner: "<org-or-user>",
  repo: "<repo-name>",
  issueNumber: <pr-number>,
  body: "<comment in markdown>"
})
```

---

## Workflow Summary

```
1. Implement changes on feature branch
2. Commit with conventional commit format
3. Push to remote
4. Create PR via mcp_github_create_pull_request
5. (Optional) Request code review
6. Merge via GitHub UI or mcp_github_merge_pull_request
```
