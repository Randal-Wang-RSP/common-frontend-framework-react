# common-frontend-framework-react

A React project template based on Feature-Sliced Design (FSD). Clone this repo, or use the instructions below to let an AI agent scaffold a new project from scratch.

## Quick Start (AI-Powered)

Paste the following into any AI coding assistant (GitHub Copilot, Claude Code, Cursor, etc.) to scaffold a new project from scratch:

```
Create a new React FSD project by following the instructions here:
https://raw.githubusercontent.com/Randal-Wang-RSP/common-frontend-framework-react/refs/heads/main/docs/installation.md

Then configure AI agent files by following the instructions here:
https://raw.githubusercontent.com/Randal-Wang-RSP/common-frontend-framework-react/refs/heads/main/docs/installation-ai-config.md
```

## Tech Stack

- React 18 + Vite + TypeScript (strict mode)
- CSS Modules + Ant Design
- Zustand (client state) + TanStack Query (server state)
- React Router v7
- Vitest + jsdom
- ESLint (`eslint-plugin-boundaries` enforces FSD import rules)
- Prettier + Husky + lint-staged + commitlint

## Getting Started (clone approach)

```bash
# Clone the template
git clone <this-repo> my-project
cd my-project

# Install dependencies
npm install

# Copy env file
cp .env.example .env.local

# Start dev server
npm run dev
```

## Available Scripts

| Command            | Description             |
| ------------------ | ----------------------- |
| `npm run dev`      | Start dev server        |
| `npm run build`    | Production build        |
| `npm test`         | Run tests in watch mode |
| `npm run test:run` | Run tests once          |
| `npm run lint`     | Lint check              |
| `npm run lint:fix` | Lint and auto-fix       |
| `npm run format`   | Format with Prettier    |

## Architecture

This template uses Feature-Sliced Design. See `docs/architecture.md` for full details.

## For AI Tools

Architecture context for AI coding assistants is in `CLAUDE.md`.
