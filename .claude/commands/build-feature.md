---
description: Build one PLAN.md feature in its own worktree (e.g. /build-feature 4.1)
argument-hint: <feature number from the CLAUDE.md Feature workflow table>
---

Build feature `$ARGUMENTS` from `PLAN.md`. Follow these steps in order and don't skip any.

1. **Look up** `$ARGUMENTS` in the "Feature workflow" table in `CLAUDE.md` to get its slug, branch and PLAN.md sections. If it isn't in the table, stop and list the valid numbers. Read those PLAN.md sections, plus §6 (data model), §7 (request flow) and §13 (definition of done).

2. **Check the prerequisite.** Unless this is order 0, the branch from the previous row must show up in `git branch --merged main`. If it doesn't, stop and tell the user which feature to finish first. Also stop if `feature/<slug>` or `.claude/worktrees/<slug>` already exists, and ask whether to resume it or start over.

3. **Decisions.** If this feature depends on a `PLAN.md` §12 choice that isn't listed under "Decisions" in `CLAUDE.md` (for example ORM at 0, auth provider at 4.1, real-time provider at 4.5, task ordering at 4.4), ask with AskUserQuestion and give a recommendation. Record the answer under Decisions in `CLAUDE.md` and commit it on `main`, so the worktree inherits it.

4. **Worktree.** From the main checkout, run:

   ```
   git worktree add .claude/worktrees/<slug> -b feature/<slug> main
   ```

   Then call `EnterWorktree` with `path` set to that directory. Don't use `name`: it creates a `worktree-*` branch. Then run `npm install && npx next typegen`. Without typegen, tsc can't find `LayoutProps`/`PageProps`.

5. **Plan.** Use the `superpowers:writing-plans` skill and save the plan to `docs/plans/<slug>.md`. Stop and get the user's approval before writing feature code.

6. **Build** with the `superpowers:test-driven-development` skill. Follow `CLAUDE.md` (code under `src/`, authorization rules, mutation flow). Read the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API. Tick this feature's checkboxes in `PLAN.md` §8 as items get done.

7. **Verify.** All of these must pass: `npm run lint`, `npx tsc --noEmit`, the project's test command (once foundation has added one) and `npm run build`. Then use the `run` skill to see the feature working in the app. Report any failure with its output; don't claim success without it.

8. **Finish.** Commit on `feature/<slug>`, then use the `superpowers:finishing-a-development-branch` skill. There's no git remote, so the default is a local merge into `main` followed by removing the worktree.
