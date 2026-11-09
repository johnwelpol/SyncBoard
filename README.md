# SyncBoard

A real-time, multi-tenant collaborative Kanban app built with Next.js. The product spec and roadmap are in [PLAN.md](PLAN.md).

## Development setup

Prerequisites: Node.js 22 and a PostgreSQL server you can create a database on.

```bash
cp .env.example .env        # then set DATABASE_URL to your Postgres
npm install                 # also generates the Prisma client
npm run db:migrate          # creates the database (if missing) and applies migrations
npm run dev
```

Open http://localhost:3000. http://localhost:3000/api/health returns `{"ok":true}` when the app can reach the database.

## Scripts

| Command                       | What it does                               |
| ----------------------------- | ------------------------------------------ |
| `npm run dev`                 | Dev server                                 |
| `npm run build` / `npm start` | Production build / serve                   |
| `npm test`                    | Unit and component tests (Vitest)          |
| `npm run lint`                | ESLint                                     |
| `npm run format`              | Prettier                                   |
| `npm run db:migrate`          | Create and apply migrations in development |
| `npm run db:deploy`           | Apply migrations in production             |
| `npm run db:studio`           | Browse the database                        |
