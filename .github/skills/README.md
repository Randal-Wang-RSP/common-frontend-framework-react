# Skills

On-demand deep knowledge for GitHub Copilot (Tier 4 of the AI customization system).

> System overview: [`docs/superpowers/ai-customization.md`](../../docs/superpowers/ai-customization.md)

## How Skills Work

Copilot reads each skill's `description` frontmatter and loads the full content only when the user's request matches. Skills are **not** auto-injected — they are invoked on demand.

## Available Skills

| Skill | Triggers when… |
|-------|---------------|
| [`zustand-patterns`](./zustand-patterns/SKILL.md) | Writing or reviewing Zustand stores |
| [`git-workflow`](./git-workflow/SKILL.md) | Performing Git operations: branching, committing, PRs, merging, releasing, hotfixing |

## Adding a New Skill

1. Create `.github/skills/<name>/SKILL.md`
2. Write a `description` frontmatter that starts with "Use when…"
3. Add the skill to the table above
4. Keep content detailed — skills are loaded situationally, token cost is not a concern here

## Candidates for Future Skills

- `react-query-patterns` — `useQuery`, `useMutation`, cache invalidation, optimistic updates
- `fsd-refactor` — migrating non-compliant code to the correct FSD layer
