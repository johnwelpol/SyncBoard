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

This is a fresh `create-next-app` scaffold. Only `app/layout.tsx`, `app/page.tsx` and `app/globals.css` exist. `syncboard-feature-plan.md` is the product spec: a multi-tenant, real-time collaborative Kanban app. Read it before building features. It defines the routes (§5), data model (§6), request flow (§7) and phased roadmap (§8). Stack choices it leaves open (auth provider, ORM, real-time provider) are still undecided, so ask before picking one.

## Stack quirks

- **Next.js 16.4 / React 19.3.** APIs differ from older versions. Check `node_modules/next/dist/docs/` (`01-app/` for App Router) before using any Next API.
- `next.config.ts` turns on `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. With Cache Components, data fetching and caching rules differ from classic App Router (`"use cache"`, Suspense boundaries for dynamic data). Read the docs before you write data-loading code.
- **Tailwind v4 runs through a Turbopack loader rule** (`@tailwindcss/turbopack` in `next.config.ts`), not PostCSS. There is no `postcss.config` or `tailwind.config`. Theme tokens live in `app/globals.css` under `@theme inline`.
- Route props use the globally generated types (`LayoutProps<"/">`, `PageProps<...>`) instead of hand-written prop interfaces.
- Path alias: `@/*` points to the repo root.

## Architecture rules from the spec

- **Authorization:** never rely on middleware/proxy alone. Every server action, route handler and data-access function that touches tenant data must check the user's workspace membership on its own, so guessed IDs cannot cross tenants.
- **Mutation flow:** optimistic update (`useOptimistic`) → server action validates input → membership/role check → DB write (in a transaction for position changes) → return the canonical data → broadcast a real-time event → the client reconciles.
- **Task detail** has one canonical page at `/workspaces/[workspaceId]/projects/[projectId]/tasks/[taskId]`. A parallel + intercepting route renders the same task as a modal over the board during client navigation.
