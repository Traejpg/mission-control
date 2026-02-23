# Mission Control Dashboard

Tee's personal command center for managing all workflows, tasks, and operations.

## Features

- **Dashboard**: Overview of all workflows with live metrics
- **Task Board**: Kanban-style task management with assignments
- **Calendar**: Scheduled tasks, cron jobs, and deadlines
- **Memory**: Searchable memory browser
- **Team**: Subagent organization and digital office view
- **Command Center**: Execute and queue OpenClaw tasks

## Tech Stack

- React 18 + TypeScript
- Vite (fast HMR and builds)
- TailwindCSS (utility-first styling)
- React Router (navigation)
- Framer Motion (animations)
- Recharts (data visualization)
- Lucide React (icons)
- date-fns (date handling)

## Getting Started

```bash
npm install
npm run dev
```

## Deployment

### Netlify (Recommended)
```bash
npm run deploy
```

### Vercel
```bash
npx vercel --prod
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your API keys.

## Structure

```
src/
  components/    # Reusable UI components
  pages/         # Screen components
  hooks/         # Custom React hooks
  utils/         # Utility functions
  types/         # TypeScript definitions
  data/          # Static data and stores
```