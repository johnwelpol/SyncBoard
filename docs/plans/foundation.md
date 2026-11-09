# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running SyncBoard app with tests, formatting, shadcn/ui, Zod conventions, and a Prisma/PostgreSQL schema covering the PLAN.md §6 data model, with a health check that proves the DB connection.

**Architecture:** Prisma 7 generates its client into `src/generated/prisma` and connects through the `@prisma/adapter-pg` driver adapter. It's exposed only via the `server-only` module `src/lib/db.ts`. Shared Zod schemas and an `ActionResult` type in `src/lib/` set the validation and error convention that every later server action follows. Vitest + React Testing Library cover the unit and component tests. Integration tests against a real DB start in 4.2.

**Tech Stack:** Next.js 16.4.5, React 19.3, TypeScript, Tailwind v4 (Turbopack loader), shadcn/ui, Prisma 7.10.1 + `@prisma/adapter-pg`, PostgreSQL (the developer's own), Zod 4, Vitest 5, React Testing Library, Prettier.

**Spec:** `PLAN.md` §3, §6, §8 Phase 1, §9, §12. Decisions are in `CLAUDE.md` → Decisions.

## Global Constraints

- All app code goes under `src/` (CLAUDE.md → Project Structure). `@/*` maps to `./src/*`.
- Pin Prisma at **7.10.1** for `prisma`, `@prisma/client` and `@prisma/adapter-pg`. npm `latest` points at `8.0.0-rc`, so don't use it.
- `DATABASE_URL` comes from `.env` (the Prisma CLI loads it through `dotenv` in `prisma.config.ts`; Next.js loads it natively). `.env` is never committed. `.env.example` is.
- Tailwind runs through the Turbopack loader rule in `next.config.ts`. Don't add a `postcss.config.*` or a `tailwind.config.*`.
- `position` columns are `String` fractional-index keys (Decisions → Ordering).
- Read `node_modules/next/dist/docs/` before using a Next API (AGENTS.md).

## Review Focus

1. **Fractional keys sort wrongly under a locale collation.** Postgres sorts text using the database collation (for example `en_US.UTF-8`), and that order differs from the byte order the keys are generated in. Both `position` columns must use `COLLATE "C"`. Task 3 adds this to the migration SQL and checks it with a query.
2. **A task referencing a column from another board.** The composite FK `(columnId, boardId)` → `BoardColumn(id, boardId)` makes the DB reject it. Task 3 checks this.
3. **Deleting a column that still has tasks** must fail. Deleting a whole board must cascade cleanly. Task 3 uses `onDelete: NoAction` on Task→BoardColumn, not `Restrict`, because Restrict is checked immediately and would break the board cascade.
4. **`DATABASE_URL` missing or wrong.** `GET /api/health` returns 503 `{ ok: false }` instead of crashing or leaking the connection string. Task 3 tests this.
5. **The DB client gets imported into a Client Component.** `src/lib/db.ts` starts with `import "server-only"`, so the build fails loudly. Task 3 checks this.

---

### Task 1: Test runner, formatting, validation and error conventions

**Files:**
- Create: `vitest.config.mts`, `vitest.setup.ts`, `.prettierrc.json`, `.prettierignore`, `src/lib/action-result.ts`, `src/lib/validation.ts`
- Test: `src/lib/action-result.test.ts`, `src/lib/validation.test.ts`
- Modify: `package.json` (deps and scripts)

**Interfaces:**
- Produces (used by every later server action):
  - `type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: ActionErrorCode; message: string; fieldErrors?: Record<string, string[]> } }`
  - `type ActionErrorCode = "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL"`
  - `ok<T>(data: T): ActionResult<T>`, `fail(code: ActionErrorCode, message: string): ActionResult<never>`, `fromZodError(error: z.ZodError): ActionResult<never>`
  - `validation.ts`: `idSchema` (non-empty trimmed string, max 64), `nameSchema` (trimmed, 1–100 chars), `slugSchema` (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, 3–48 chars)

- [ ] **Step 1: Install the dev tooling**

  `npm i zod` and `npm i -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom prettier prettier-plugin-tailwindcss`.

  Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.

  `vitest.config.mts` uses the react and tsconfig-paths plugins, `environment: "jsdom"`, and `setupFiles: ["./vitest.setup.ts"]` (which imports `@testing-library/jest-dom/vitest`). `.prettierrc.json` sets `{ "plugins": ["prettier-plugin-tailwindcss"] }`. `.prettierignore` lists `.next`, `src/generated`, `PLAN.md`, `package-lock.json`.

- [ ] **Step 2: Write the failing tests**

```ts
// src/lib/action-result.test.ts
it("ok wraps data", () => expect(ok(5)).toEqual({ ok: true, data: 5 }));
it("fail carries code and message", () =>
  expect(fail("FORBIDDEN", "No access")).toEqual({ ok: false, error: { code: "FORBIDDEN", message: "No access" } }));
it("fromZodError maps field errors", () => {
  const r = z.object({ name: nameSchema }).safeParse({ name: "" });
  expect(fromZodError(r.error!)).toEqual({
    ok: false,
    error: { code: "VALIDATION", message: "Invalid input", fieldErrors: { name: [expect.any(String)] } },
  });
});

// src/lib/validation.test.ts
it("nameSchema trims and bounds", () => {
  expect(nameSchema.parse("  Board  ")).toBe("Board");
  expect(nameSchema.safeParse("   ").success).toBe(false);
  expect(nameSchema.safeParse("x".repeat(101)).success).toBe(false);
});
it("slugSchema accepts kebab-case only", () => {
  expect(slugSchema.safeParse("acme-team").success).toBe(true);
  for (const bad of ["Acme", "a", "acme--team", "-acme", "acme_team"]) expect(slugSchema.safeParse(bad).success).toBe(false);
});
it("idSchema rejects empty", () => expect(idSchema.safeParse("").success).toBe(false));
```

- [ ] **Step 3: Run** `npm test`. Expected: FAIL (the modules don't exist yet).
- [ ] **Step 4: Implement** `src/lib/action-result.ts` and `src/lib/validation.ts` with the signatures above. `fromZodError` uses `z.flattenError(error).fieldErrors`.
- [ ] **Step 5: Run** `npm test && npm run lint`. Expected: PASS.
- [ ] **Step 6: Commit** with the message `feat: add vitest, prettier, zod validation and ActionResult convention`.

### Task 2: shadcn/ui component library

**Files:**
- Create (via CLI): `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`
- Modify: `src/app/globals.css` (shadcn theme tokens), `src/app/page.tsx`, `src/app/layout.tsx` (metadata title `"SyncBoard"`)
- Test: `src/components/ui/button.test.tsx`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `@/lib/utils`, and `Button` from `@/components/ui/button`. Later features add more components with `npx shadcn@latest add <name>`.

- [ ] **Step 1: Write the failing test**

```tsx
it("renders a button that responds to clicks", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Create board</Button>);
  screen.getByRole("button", { name: "Create board" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL (can't resolve `@/components/ui/button`).
- [ ] **Step 3: Initialize** with `npx shadcn@latest init` (base color neutral, CSS file `src/app/globals.css`, aliases under `@/`), then `npx shadcn@latest add button`. If the CLI creates a `postcss.config.*`, delete it (Global Constraints). Keep the Geist font variables in `@theme inline`.
- [ ] **Step 4: Replace** the scaffold `src/app/page.tsx` with a minimal SyncBoard landing page: an `h1` "SyncBoard", a one-line tagline and a `Button`. No links to routes that don't exist yet.
- [ ] **Step 5: Run** `npm test && npm run lint && npm run build`. Expected: PASS. The build must not fail on CSS.
- [ ] **Step 6: Commit** with the message `feat: add shadcn/ui with button and landing page`.

### Task 3: Prisma schema, migration, DB client and health check

**Files:**
- Create: `prisma.config.ts`, `prisma/schema.prisma`, `prisma/migrations/<ts>_init/migration.sql` (generated, then edited), `src/lib/db.ts`, `src/app/api/health/route.ts`, `.env.example`
- Test: `src/app/api/health/route.test.ts`
- Modify: `package.json`, `.gitignore` (add `src/generated/` and `!.env.example`), `eslint.config.mjs` (ignore `src/generated/**`)

**Interfaces:**
- Produces: `db` (a `PrismaClient` singleton) from `@/lib/db`, which is server-only. Model types come from `@/generated/prisma/client`. Later features add tables through new migrations (4.1 adds the auth tables).

- [ ] **Step 1: Install and configure**

  Packages: `npm i @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 server-only dotenv` and `npm i -D prisma@7.10.1`.

  `prisma.config.ts`: `import "dotenv/config"`, `schema: "prisma/schema.prisma"`, `migrations.path: "prisma/migrations"`, `datasource.url: env("DATABASE_URL")`.

  Generator: `provider = "prisma-client"`, `output = "../src/generated/prisma"`.

  Scripts: `"postinstall": "prisma generate"`, `"db:migrate": "prisma migrate dev"`, `"db:deploy": "prisma migrate deploy"`, `"db:studio": "prisma studio"`.

  `.env.example`: `DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/syncboard"`.

- [ ] **Step 2: Write `prisma/schema.prisma`** with the §6 models: User, Workspace, WorkspaceMember, Project, Board, BoardColumn, Task, Label, TaskLabel. Activity is a later phase, so leave it out. Decisions the implementer can't make alone:
  - IDs: `String @id @default(cuid())`. Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
  - Enums: `WorkspaceRole { OWNER ADMIN MEMBER }` and `TaskPriority { LOW MEDIUM HIGH URGENT }` (default `MEDIUM`).
  - Unique constraints: `User.email`, `Workspace.slug`, `WorkspaceMember @@unique([workspaceId, userId])`, `Label @@unique([workspaceId, name])`, `TaskLabel @@id([taskId, labelId])`, `BoardColumn @@unique([id, boardId])` (the target of the composite FK).
  - `Task.column` relation: `fields: [columnId, boardId], references: [id, boardId], onDelete: NoAction`.
  - Cascades: Workspace → Member, Project and Label; Project → Board; Board → BoardColumn and Task; Task and Label → TaskLabel. `Task.assignee` uses `onDelete: SetNull`. `Task.createdBy` uses `onDelete: Restrict`.
  - Indexes: `WorkspaceMember(userId)`, `Project(workspaceId)`, `Board(projectId)`, `BoardColumn(boardId, position)`, `Task(columnId, position)`, `Task(boardId)`, `Task(assigneeId)`.
  - `position String` on both BoardColumn and Task.

- [ ] **Step 3: Generate the migration without applying it:** `npx prisma migrate dev --name init --create-only`. **This needs the user's `DATABASE_URL` in `.env`. Ask for it if `.env` is missing.** Then edit the generated SQL so both `"position" TEXT NOT NULL` columns become `"position" TEXT COLLATE "C" NOT NULL` (Review Focus 1). Apply with `npm run db:migrate`.

- [ ] **Step 4: Check the DB constraints** (Review Focus 1–3) with `npx prisma db execute --stdin` in a single transaction that ends in `ROLLBACK`:
  - `SELECT collation_name FROM information_schema.columns WHERE column_name='position'` returns `C` twice.
  - Inserting a Task whose `columnId` belongs to a different board fails with an FK violation.
  - Deleting a column that has a task fails. Deleting its board succeeds.

- [ ] **Step 5: Write the failing test**

```ts
// src/app/api/health/route.test.ts — mock next/server's connection() and @/lib/db
it("returns 200 when the DB answers", async () => {
  vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  const res = await GET();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});
it("returns 503 without leaking the error when the DB fails", async () => {
  vi.mocked(db.$queryRaw).mockRejectedValue(new Error("password authentication failed for postgresql://u:secret@h"));
  const res = await GET();
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ ok: false });
});
```

- [ ] **Step 6: Run** `npm test`. Expected: FAIL.
- [ ] **Step 7: Implement.**
  - `src/lib/db.ts`: `import "server-only"`, then a `PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`, cached on `globalThis` outside production so hot reload doesn't open new pools.
  - `src/app/api/health/route.ts`: `GET()` first calls `await connection()` (from `next/server`) so the build doesn't try to prerender a DB query. It then runs ``db.$queryRaw`SELECT 1` ``, returns `Response.json({ ok: true })`, and on error logs it server-side and returns `Response.json({ ok: false }, { status: 503 })`.
- [ ] **Step 8: Run** `npm test && npm run lint && npx tsc --noEmit && npm run build`. Expected: PASS. Then run `npm run dev`; `curl localhost:3000/api/health` should return `{"ok":true}`.
- [ ] **Step 9: Commit** with the message `feat: add prisma schema, init migration, db client and health check`.

### Task 4: Documentation and roadmap

**Files:** Modify `CLAUDE.md`, `README.md`, `PLAN.md` §8 Phase 1

- [ ] **Step 1: Update `CLAUDE.md` → Commands.**
  - Add `npm test`, single test: `npx vitest run src/lib/validation.test.ts -t "slug"`, `npm run format`, and `npm run db:migrate` / `db:studio`.
  - Remove the line "There is no test runner yet."
  - Add one line on architecture: Prisma client in `src/lib/db.ts` (server-only), generated types in `@/generated/prisma/client`, server actions return `ActionResult` from `src/lib/action-result.ts`.
- [ ] **Step 2: Replace the README** body with SyncBoard development setup: prerequisites (Node 22, PostgreSQL), `cp .env.example .env`, `npm install`, `npm run db:migrate`, `npm run dev`, and the health URL.
- [ ] **Step 3: Tick** all six Phase 1 boxes in `PLAN.md` §8.
- [ ] **Step 4: Commit** with the message `docs: document development setup and foundation commands`.
