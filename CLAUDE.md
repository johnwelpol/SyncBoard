# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev`: dev server at http://localhost:3000 (Turbopack)
- `npm run build` / `npm start`: production build and serve
- `npm run lint`: ESLint 9 flat config (`eslint.config.mjs`, next core-web-vitals + typescript)
- Type-check: `npx tsc --noEmit`

There is no test runner yet. Add one before writing tests.

## Current state

This is still close to the `create-next-app` scaffold (`src/app/layout.tsx`, `page.tsx`, `globals.css`). `PLAN.md` is the product spec: a multi-tenant, real-time collaborative Kanban app. Read it before building features. It defines the routes (§5), data model (§6), request flow (§7) and phased roadmap (§8). Stack choices it leaves open (§12) are recorded under Decisions once made; ask before picking one that isn't recorded.

## Stack quirks

- **Next.js 16.4 / React 19.3.** APIs differ from older versions. Check `node_modules/next/dist/docs/` (`01-app/` for App Router) before using any Next API.
- `next.config.ts` turns on `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. With Cache Components, data fetching and caching rules differ from classic App Router (`"use cache"`, Suspense boundaries for dynamic data). Read the docs before you write data-loading code.
- **Tailwind v4 runs through a Turbopack loader rule** (`@tailwindcss/turbopack` in `next.config.ts`), not PostCSS. There is no `postcss.config` or `tailwind.config`. Theme tokens live in `src/app/globals.css` under `@theme inline`.
- Route props use the globally generated types (`LayoutProps<"/">`, `PageProps<...>`) instead of hand-written prop interfaces.
- Path alias: `@/*` points to `src/` (see Project Structure).

## Project Structure

All application code lives under `src/`. Only `public/` and tool config files (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `package.json`) stay at the repo root.

```
public/          static assets, served from /
src/
  app/           App Router: routes, layouts, globals.css
  components/    React components
  hooks/         custom React hooks
  lib/           shared utilities, data access, validation
  plugins/       plugins / third-party integrations
```

Don't create feature folders at the repo root.

## Feature workflow

Features are built one at a time with `/build-feature <number>` (`.claude/commands/build-feature.md`). Each runs in its own worktree under `.claude/worktrees/<slug>` on branch `feature/<slug>`, and is merged into `main` before the next starts. Order follows `PLAN.md` §8 dependencies:

| Order | Number | Branch | PLAN.md sections |
|---|---|---|---|
| 0 | `0` | `feature/foundation` | §8 Phase 1: DB, ORM, test runner, env |
| 1 | `4.1` | `feature/authentication` | §4.1, Phase 2 (auth part) |
| 2 | `4.2` | `feature/workspaces` | §4.2, Phase 2 (tenancy part) |
| 3 | `4.3` | `feature/kanban-board` | §4.3, Phase 3 |
| 4 | `4.4` | `feature/drag-and-drop` | §4.4 + §4.7 (Phase 4) |
| 5 | `4.6` | `feature/task-modal` | §4.6, Phase 5 |
| 6 | `4.5` | `feature/realtime` | §4.5, Phase 6 |
| 7 | `4.8` | `feature/metrics` | §4.8, Phase 7 |
| 8 | `8` | `feature/release-hardening` | Phase 8 |

## Decisions

Answers to `PLAN.md` §12, filled in as each feature needs them.

- **ORM:** Prisma, with PostgreSQL (decided 2026-11-09).
- **Database:** the developer's own Postgres, configured with `DATABASE_URL` in `.env`. The repo has no docker-compose file.
- **Ordering:** fractional indexing. `position` columns are text keys, so a move updates one row.

## Architecture rules from the spec

- **Authorization:** never rely on middleware/proxy alone. Every server action, route handler and data-access function that touches tenant data must check the user's workspace membership on its own, so guessed IDs cannot cross tenants.
- **Mutation flow:** optimistic update (`useOptimistic`) → server action validates input → membership/role check → DB write (in a transaction for position changes) → return the canonical data → broadcast a real-time event → the client reconciles.
- **Task detail** has one canonical page at `/workspaces/[workspaceId]/projects/[projectId]/tasks/[taskId]`. A parallel + intercepting route renders the same task as a modal over the board during client navigation.

## Development Notes

- Use `@/*` path alias for src imports
- Dark mode state is managed via CSS classes on root element
- Component testing follows React Testing Library patterns
