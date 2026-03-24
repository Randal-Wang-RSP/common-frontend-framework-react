# common-frontend-framework-react

A React project template based on Feature-Sliced Design (FSD). Clone this repo, or use the one-liner below to let an AI agent scaffold a new project from scratch.

## One-Liner Initialization

Paste this instruction into any AI coding assistant (GitHub Copilot, Claude Code, etc.) to initialize a new project from scratch:

```
Initialize a new React FSD project by following the instructions at:
https://raw.githubusercontent.com/<your-username>/common-frontend-framework-react/main/docs/installation.md
```

> Replace `<your-username>` with your GitHub username after pushing this repo.

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
