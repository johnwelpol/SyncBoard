# SyncBoard --- Collaborative Kanban Project Tool

## 1. Project Overview

**SyncBoard** is a real-time, multi-tenant project management
application built around collaborative Kanban boards. Teams can create
workspaces and projects, manage tasks through customizable workflow
columns, move cards with drag-and-drop, and monitor project progress.

The application will demonstrate modern Next.js capabilities,
particularly:

-   **Intercepting and Parallel Routes** for card-detail modals that
    preserve board context.
-   **Optimistic UI** with React's `useOptimistic` hook for immediate
    task movement and updates.
-   **Server-side route protection** for authenticated workspace access.
-   Real-time synchronization so changes made by one team member appear
    for other members.
-   Multi-tenant data isolation so each organization can access only its
    own workspaces and projects.

## 2. Goals and Success Criteria

### Product goals

1.  Let teams organize work visually using Kanban boards.
2.  Make common board interactions feel immediate and responsive.
3.  Keep all collaborators' views synchronized.
4.  Support multiple organizations or teams while securely isolating
    their data.
5.  Make task details directly addressable through shareable URLs.
6.  Provide useful project metrics without overwhelming the board
    experience.

### Initial success criteria

-   A user can create a workspace, project, board, column, and task.
-   A user can drag a task between columns and reorder tasks.
-   The board updates immediately while the change is being saved.
-   Other authorized board members receive task changes in real time.
-   Selecting a task opens a modal while retaining the board behind it.
-   Refreshing or directly opening a task URL renders a standalone
    task-detail page.
-   Unauthenticated users are redirected to sign in.
-   Users cannot access data belonging to another tenant, even by
    guessing record IDs.
-   Board metrics accurately reflect the current task data.

## 3. Proposed Technology Stack

  Area                Technology
  ------------------- --------------------------------------------------
  Framework           Next.js (App Router)
  Language            TypeScript
  UI                  React, Tailwind CSS, shadcn/ui
  Authentication      Auth.js (NextAuth.js) or Clerk
  Auth Provider       ORM
  Database            PostgreSQL
  ORM                 Prisma or Drizzle
  Real-time updates   Ably, Pusher, or Supabase Realtime
  Drag and drop       dnd-kit
  Validation          Zod
  Forms               React Hook Form
  Testing             Vitest, React Testing Library, Playwright
  Deployment          Vercel or an equivalent Next.js hosting platform

**Implementation note:** Choose one authentication provider, ORM, and
real-time provider before implementation. The plan keeps these choices
flexible. Middleware or Next.js Proxy can provide an initial
authentication gate, but authorization must also be enforced in
server-side data access and mutations.

## 4. Core Features

### 4.1 Authentication and User Accounts

Users must be authenticated before accessing private workspaces.

**Scope** - Sign up, sign in, and sign out. - Session management. - User
profile with name and avatar. - Protected workspace and project
routes. - Invitation flow for adding members to a workspace (can follow
the initial release).

**Acceptance criteria** - Unauthenticated users cannot access private
workspace pages or APIs. - Expired or invalid sessions are handled
safely. - Server actions and API endpoints verify the current user's
permissions; hiding a page link is not treated as authorization.

### 4.2 Multi-Tenant Workspaces and Membership

A tenant represents an organization or team. Each tenant can contain
multiple members, projects, and boards.

**Scope** - Create and view workspaces. - Add members and assign
workspace roles. - Support at least `OWNER`, `ADMIN`, and `MEMBER`
roles. - Switch between workspaces. - Enforce tenant ownership on every
read and write.

**Acceptance criteria** - A user sees only workspaces they belong to. -
A member cannot read or modify another tenant's records. - Workspace
role restrictions are enforced on the server.

### 4.3 Projects and Kanban Boards

Each workspace can contain multiple projects. A project has a Kanban
board with configurable columns.

**Scope** - Create, edit, archive, and view projects. - Create, rename,
reorder, and remove board columns. - Provide sensible default columns:
`Backlog`, `To Do`, `In Progress`, and `Done`. - Display task cards
within their current columns. - Support empty-board and empty-column
states.

**Acceptance criteria** - Board data is loaded for the active workspace
and project. - Column order is preserved after refresh. - A task always
belongs to a valid board column.

### 4.4 Task Cards and Drag-and-Drop

Tasks are the primary units of work on a board.

**Task fields** - Title (required). - Description. - Status / column. -
Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). - Assignee (optional). -
Due date (optional). - Labels (optional). - Position / sort order. -
Created by, created at, and updated at.

**Scope** - Create, edit, and delete tasks. - Move tasks between
columns. - Reorder tasks within a column. - Assign tasks to workspace
members. - Set priority and due dates. - Display useful task information
on each card.

**Acceptance criteria** - Dragging a card updates the board
immediately. - The final order persists after refresh. - Invalid moves
are rejected with a useful error. - If a save fails, the UI rolls back
or reconciles with the server's latest state. - Concurrent changes do
not silently overwrite newer task positions.

### 4.5 Real-Time Collaboration

Board changes should be reflected for all currently connected members.

**Events to synchronize** - Task created, updated, deleted, or moved. -
Column created, updated, reordered, or deleted. - Relevant assignment
and priority changes.

**Implementation approach** 1. A user performs an action. 2. The client
applies an optimistic update where appropriate. 3. The server validates
the session, tenant, and permission. 4. The server persists the change
in the database. 5. A real-time event is published for the affected
board. 6. Other connected clients reconcile their local state with the
event. 7. The initiating client confirms or rolls back its optimistic
state.

**Acceptance criteria** - Authorized collaborators receive board changes
without manually refreshing. - Events are scoped to the correct tenant
and board. - Clients handle duplicate or out-of-order events safely. - A
reconnecting client can fetch the latest canonical board state.

### 4.6 Task Detail Modal with Intercepting and Parallel Routes

Selecting a task should open its details in a modal without navigating
away from the visible board context.

**Next.js App Router concept** - Use an `@modal` parallel route slot in
the workspace layout. - Use an intercepting route such as
`(.)tasks/[taskId]` to render the task as a modal during client-side
navigation from the board. - Provide a normal `/tasks/[taskId]` page for
direct navigation and refresh. - Include a default route for the modal
slot so the layout renders correctly when no modal is active.

**Expected behavior** - Clicking a card opens the modal over the current
board. - The URL changes to a task-specific URL. - Closing the modal
returns to the board without losing its context. - Refreshing the task
URL renders the standalone task-detail page. - Pasting or opening the
task URL directly also renders the standalone page. - Access checks
apply to both modal and standalone views.

**Task detail content** - Title and description. - Status and
priority. - Assignee and due date. - Labels. - Activity history or
comments (can be phased in later). - Edit and delete actions.

### 4.7 Optimistic UI

Use React's `useOptimistic` hook for interactions where immediate
feedback improves the experience.

**Initial use cases** - Moving a task between columns. - Reordering
tasks. - Updating task status. - Updating priority or assignee where
appropriate.

**Implementation principles** - Keep the optimistic state predictable
and derived from the current board state. - Submit the mutation to a
server action or API endpoint. - Validate permissions and input on the
server. - Reconcile with the canonical server response. - Roll back or
refresh affected data when a mutation fails. - Prevent rapid repeated
actions from creating inconsistent ordering.

Optimistic UI improves perceived responsiveness; it does not replace
server validation or database consistency.

### 4.8 Project Metrics and Dashboard

Provide a lightweight overview of project health.

**Initial metrics** - Total tasks. - Tasks by status. - Completed
tasks. - Overdue tasks. - Tasks by priority. - Tasks assigned to each
member.

**Possible later metrics** - Completion trend over time. - Average cycle
time. - Workload distribution. - Tasks completed within a selected date
range.

**Acceptance criteria** - Metrics are calculated from authorized project
data. - Counts update after relevant task changes. - Empty projects
display clear zero states. - Metric definitions are documented so users
understand what each number means.

## 5. Suggested Application Routes

  -----------------------------------------------------------------------------------------------------
  Route                                                             Purpose
  ----------------------------------------------------------------- -----------------------------------
  `/`                                                               Landing page or redirect

  `/sign-in`                                                        Authentication

  `/sign-up`                                                        Account creation

  `/workspaces`                                                     List of user's workspaces

  `/workspaces/[workspaceId]`                                       Workspace overview

  `/workspaces/[workspaceId]/projects`                              Project list

  `/workspaces/[workspaceId]/projects/[projectId]`                  Kanban board

  `/workspaces/[workspaceId]/projects/[projectId]/tasks/[taskId]`   Canonical task detail URL

  `/workspaces/[workspaceId]/settings`                              Workspace settings and members
  -----------------------------------------------------------------------------------------------------

The modal route should be implemented as a parallel/intercepting route
in the App Router while preserving a normal page for direct task
navigation. The exact route-group and slot folder structure should be
confirmed during implementation.

## 6. Initial Data Model

The following is a conceptual schema. Field types, indexes, and deletion
behavior should be finalized with the selected ORM.

### User

-   `id`
-   `name`
-   `email` (unique)
-   `avatarUrl`
-   `createdAt`
-   `updatedAt`

### Workspace

-   `id`
-   `name`
-   `slug`
-   `createdAt`
-   `updatedAt`

### WorkspaceMember

-   `id`
-   `workspaceId`
-   `userId`
-   `role`
-   `joinedAt`

Add a unique constraint on `(workspaceId, userId)`.

### Project

-   `id`
-   `workspaceId`
-   `name`
-   `description`
-   `createdAt`
-   `updatedAt`
-   `archivedAt` (optional)

### Board

-   `id`
-   `projectId`
-   `name`
-   `createdAt`
-   `updatedAt`

### BoardColumn

-   `id`
-   `boardId`
-   `name`
-   `position`
-   `createdAt`
-   `updatedAt`

### Task

-   `id`
-   `boardId`
-   `columnId`
-   `title`
-   `description`
-   `priority`
-   `assigneeId` (optional)
-   `dueDate` (optional)
-   `position`
-   `createdById`
-   `createdAt`
-   `updatedAt`

### Label and TaskLabel

-   `Label`: `id`, `workspaceId`, `name`, `color`
-   `TaskLabel`: `taskId`, `labelId`

### Activity (later phase)

-   `id`
-   `taskId`
-   `actorId`
-   `type`
-   `metadata`
-   `createdAt`

**Data integrity requirements** - Add indexes for common workspace,
project, board, column, assignee, and task lookups. - Enforce tenant
membership before accessing related records. - Use database transactions
for moves that update task positions or multiple related records. -
Consider composite constraints or tenant-aware query patterns to prevent
cross-tenant references. - Define how deleted columns are handled when
they still contain tasks.

## 7. Architecture and Request Flow

### Read flow

1.  The user opens a workspace or board route.
2.  The server obtains the authenticated user.
3.  The server verifies workspace membership and project access.
4.  The server loads the board, columns, tasks, and required member
    data.
5.  The client renders the interactive board.

### Mutation flow

1.  The user creates, edits, or moves a task.
2.  The client applies an optimistic update if the action supports it.
3.  A server action or API route validates the input.
4.  The server verifies the user's membership and role.
5.  The database mutation runs, using a transaction when necessary.
6.  The server returns the canonical updated data.
7.  A real-time event informs other clients.
8.  The initiating client reconciles its state.

### Authorization rule

Never rely on route middleware alone. Every server action, route
handler, and data-access operation that reads or changes tenant-owned
data must independently verify the authenticated user's access to the
relevant workspace and resource.

## 8. Development Phases

### Phase 1 --- Foundation and Project Setup

-   [ ] Create the Next.js App Router project with TypeScript.
-   [ ] Configure linting, formatting, environment variables, and
    project scripts.
-   [ ] Set up Tailwind CSS and the component library.
-   [ ] Configure PostgreSQL and the selected ORM.
-   [ ] Create the initial database schema and migrations.
-   [ ] Add shared validation schemas and error-handling conventions.

**Deliverable:** A running application connected to the database with a
documented development setup.

### Phase 2 --- Authentication and Multi-Tenancy

-   [ ] Integrate Auth.js or Clerk.
-   [ ] Implement sign-in and sign-out flows.
-   [ ] Add protected workspace routes.
-   [ ] Implement workspace creation and listing.
-   [ ] Add workspace membership and role checks.
-   [ ] Add tenant-scoped data-access helpers.
-   [ ] Test cross-tenant access restrictions.

**Deliverable:** Users can securely create and access only their own
workspaces.

### Phase 3 --- Projects and Kanban Board

-   [ ] Implement project CRUD.
-   [ ] Create a default board and columns for each project.
-   [ ] Build the Kanban board layout.
-   [ ] Implement task creation, editing, and deletion.
-   [ ] Add task cards and empty/loading/error states.
-   [ ] Add column creation, editing, and ordering.

**Deliverable:** A functional Kanban board with persistent tasks and
columns.

### Phase 4 --- Drag-and-Drop and Optimistic Updates

-   [ ] Integrate dnd-kit.
-   [ ] Support moving cards between columns.
-   [ ] Support reordering cards within a column.
-   [ ] Implement position persistence with database transactions.
-   [ ] Add optimistic updates using `useOptimistic`.
-   [ ] Handle mutation errors and state reconciliation.
-   [ ] Test rapid moves and concurrent updates.

**Deliverable:** Responsive drag-and-drop interactions with reliable
persistence.

### Phase 5 --- Intercepting Routes and Task Details

-   [ ] Add the `@modal` parallel route slot.
-   [ ] Implement the intercepting task route.
-   [ ] Build the task-detail modal.
-   [ ] Implement modal dismissal and board-context preservation.
-   [ ] Implement the standalone task-detail page.
-   [ ] Verify direct navigation, refresh, browser back, and browser
    forward behavior.

**Deliverable:** Task details work both as an in-context modal and as a
standalone URL.

### Phase 6 --- Real-Time Collaboration

-   [ ] Select and configure the real-time provider.
-   [ ] Define board event names and payload contracts.
-   [ ] Publish events after successful database mutations.
-   [ ] Subscribe clients to authorized board channels.
-   [ ] Reconcile remote events with local optimistic state.
-   [ ] Handle reconnects, duplicate events, and stale data.
-   [ ] Verify tenant and board isolation for subscriptions.

**Deliverable:** Multiple members can collaborate on a board and see
changes live.

### Phase 7 --- Metrics and Dashboard

-   [ ] Implement task counts by status.
-   [ ] Add completed and overdue task metrics.
-   [ ] Add priority and assignee breakdowns.
-   [ ] Build project overview widgets.
-   [ ] Ensure metrics update after task mutations.

**Deliverable:** A project dashboard with accurate, useful progress
metrics.

### Phase 8 --- Quality, Security, and Release

-   [ ] Add unit tests for validation and business logic.
-   [ ] Add integration tests for server actions and authorization.
-   [ ] Add Playwright tests for key user journeys.
-   [ ] Test concurrent board edits and failed mutations.
-   [ ] Review tenant isolation and real-time channel permissions.
-   [ ] Add logging and error monitoring.
-   [ ] Document environment setup and deployment.
-   [ ] Deploy a staging version and run acceptance testing.

**Deliverable:** A tested, documented application ready for an initial
release.

## 9. Testing Strategy

  -----------------------------------------------------------------------
  Level                               What to test
  ----------------------------------- -----------------------------------
  Unit                                Validation schemas, position
                                      calculations, permission helpers,
                                      metric calculations

  Integration                         Task mutations, workspace
                                      membership, tenant isolation,
                                      transaction behavior

  Component                           Kanban cards, columns, task modal,
                                      forms, loading and error states

  End-to-end                          Sign in, create workspace, create
                                      project, move task, open modal,
                                      refresh task URL

  Real-time                           Two authorized users see updates;
                                      unauthorized users cannot subscribe

  Resilience                          Failed mutations, reconnects,
                                      duplicate events, stale client
                                      state
  -----------------------------------------------------------------------

### Critical end-to-end scenarios

1.  A signed-out visitor attempts to open a private board and is
    redirected to sign in.
2.  A workspace member creates a project and moves a task to
    `In Progress`.
3.  The task moves immediately in the UI and remains in the new column
    after refresh.
4.  A second member sees the task move without refreshing.
5.  Clicking a task opens a modal while the board remains visible.
6.  Refreshing the task URL opens the standalone task-detail page.
7.  A user from another workspace cannot access the task URL or mutate
    the task.
8.  A failed task move is rolled back or reconciled to the latest server
    state.

## 10. Security and Reliability Considerations

-   Enforce authorization on the server for every protected read and
    mutation.
-   Scope database queries and real-time subscriptions by tenant and
    board.
-   Validate all client input on the server.
-   Never expose secret keys or privileged database credentials to the
    browser.
-   Use secure session and cookie settings provided by the
    authentication provider.
-   Rate-limit sensitive endpoints where appropriate.
-   Use transactions for multi-record ordering changes.
-   Treat real-time messages as notifications, not as the source of
    truth; the database remains canonical.
-   Avoid leaking private task details through logs, event payloads, or
    error messages.
-   Add audit/activity records for important actions in a later
    iteration.

## 11. MVP Scope and Future Enhancements

### MVP --- Required for the first usable release

-   Authentication.
-   Multi-tenant workspaces and membership.
-   Projects and Kanban boards.
-   Default and configurable columns.
-   Task CRUD and assignment.
-   Drag-and-drop with optimistic updates.
-   Intercepting-route task modal and standalone task page.
-   Server-side authorization.
-   Basic real-time task and board updates.
-   Basic project metrics.

### Future enhancements

-   Comments and task activity timeline.
-   File attachments.
-   Labels and advanced filtering.
-   Notifications and mentions.
-   Workspace invitations by email.
-   Search across projects and tasks.
-   Custom workflows and permissions.
-   Due-date calendar.
-   Sprint planning and swimlanes.
-   Advanced analytics and export.
-   Mobile-focused board interactions.

## 12. Key Technical Decisions to Confirm

Before implementation, agree on:

1.  **Authentication:** Auth.js or Clerk.
2.  **Database and ORM:** PostgreSQL with Prisma or Drizzle.
3.  **Real-time provider:** Ably, Pusher, or Supabase Realtime.
4.  **Tenant model:** Organization-based workspace membership and role
    definitions.
5.  **Conflict strategy:** How simultaneous moves of the same task or
    changes to the same column are reconciled.
6.  **Task ordering:** Integer positions, fractional indexing, or
    another ordering strategy.
7.  **Deployment:** Hosting provider, database hosting, and environment
    strategy.

## 13. Definition of Done

A feature is complete when:

-   Its expected behavior is implemented and reviewed.
-   Input validation and server-side authorization are in place.
-   Loading, empty, success, and error states are handled.
-   Relevant unit, integration, or end-to-end tests pass.
-   Tenant isolation is preserved.
-   Changes are documented where needed.
-   The feature has been verified in the staging environment.

------------------------------------------------------------------------

## Recommended Implementation Order

Build the product in vertical slices rather than implementing every
backend feature before the UI. Start with authentication and tenant
isolation, then deliver a basic persistent board. Add drag-and-drop and
optimistic updates next, followed by the modal routing experience,
real-time synchronization, and metrics. This order creates a usable
product early while keeping the most complex collaboration behavior on
top of a secure data foundation.
