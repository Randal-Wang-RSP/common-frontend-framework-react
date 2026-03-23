# common-frontend-framework-react

A React project template based on Feature-Sliced Design (FSD). Clone this as the starting point for new projects.

## Tech Stack

- React 18
- Vite
- TypeScript
- CSS Modules
- Ant Design
- Zustand
- TanStack Query
- React Router v7
- Vitest

## Getting Started

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
