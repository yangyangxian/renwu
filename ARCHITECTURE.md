# Renwu Architecture Overview

## Monorepo Shape

This repository is an npm workspace monorepo with three application packages:

- `client/`: React 19 + Vite single-page app.
- `server/`: Express 5 + TypeScript API server and static asset host.
- `common/`: shared DTOs, enums, permission helpers, and response types consumed by both client and server.

The root `package.json` orchestrates builds and local development across all three packages. `npm run dev` builds `common` first and then runs `common`, `client`, and `server` watchers concurrently.

## High-Level Runtime Flow

1. The browser loads the Vite-built React app from `client/`.
2. `client/src/main.tsx` bootstraps the app with `BrowserRouter`, `AuthProvider`, Milkdown providers, and toast notifications.
3. `client/src/App.tsx` builds the route tree dynamically from files under `client/src/pages/**` and wraps routes with `ProtectedRoute` inside `MainLayout`.
4. UI components call thin endpoint helpers in `client/src/apiRequests/apiEndpoints.ts` and use `client/src/utils/APIClient.ts` for HTTP requests.
5. The API client talks to `/api/**`, sending cookies with requests for session-based auth.
6. `server/src/index.ts` wires middleware, mounts public routes, serves static assets for the SPA, protects authenticated API routes with `globalAuthMiddleware`, and attaches centralized error handling.
7. `server/src/routes/apiRouter.ts` auto-discovers route modules in `server/src/api/` and mounts them under `/api/<filename>`.
8. Route handlers delegate business logic to service classes in `server/src/services/`.
9. Services use Drizzle ORM through `server/src/database/databaseAccess.ts` against PostgreSQL, with schema definitions in `server/src/database/schema.ts` and SQL migrations in `server/drizzle/`.

## Package Responsibilities

### Root Workspace

- Coordinates workspace scripts and cross-package build order.
- Provides containerization and deployment entrypoints through `Dockerfile`, `docker-compose.yml`, and `fly.toml`.
- Uses the built server as the production entrypoint.

### Client Package

The frontend is a route-driven SPA with a few clear layers:

- `src/pages/`: routeable screens. File location determines URL structure through `pageRouteGenerator.ts`.
- `src/components/`: reusable UI grouped by feature areas such as homepage, tasks, labels, and projects.
- `src/layout/`: shared page shell.
- `src/providers/`: app-wide providers, especially authentication.
- `src/stores/`: Zustand stores for client state such as tasks, projects, labels, permissions, and task views.
- `src/apiRequests/`: string builders for API endpoints.
- `src/utils/`: cross-cutting browser utilities, including the typed fetch wrapper.
- `src/consts/`, `src/resources/`, `src/styles/`: frontend configuration and presentation support.

Important frontend patterns:

- Routing is file-system-inspired, but implemented manually with `import.meta.glob` rather than a framework router.
- Almost every route is guarded by auth, with a small allowlist of public routes.
- State is managed locally in several focused Zustand stores rather than a single global store.
- Rich text editing is supported through Milkdown providers at app bootstrap.

### Server Package

The backend is an Express application with modular route loading and service-based business logic:

- `src/index.ts`: app composition, middleware order, server startup, graceful shutdown, and startup jobs.
- `src/api/`: route modules. Each file exports a default authenticated router and can optionally export `publicRouter`.
- `src/routes/`: router composition, including SPA static routing.
- `src/services/`: domain logic for tasks, projects, labels, invitations, permissions, and users.
- `src/services/ActivityService.ts`: shared activity event recording and query logic used by multiple feature services and routes.
- `src/middlewares/`: cross-cutting HTTP concerns such as auth, CORS, request logging, and error handling.
- `src/database/`: Drizzle connection and relational schema.
- `src/jobs/`: background job scheduling and workers. Current code schedules a user sync job at startup and depends on Redis for queue infrastructure.
- `src/utils/`, `src/classes/`, `src/logs/`: operational helpers and supporting abstractions.

Important backend patterns:

- API route registration is automatic. Adding a new file to `server/src/api/` creates a new `/api/<file>` mount.
- Business logic is intentionally pushed down into services rather than embedded in route handlers.
- Authentication is enforced globally for `/api` after public routers are mounted.
- The server also serves the built frontend, so production can run as one Node process behind a single port.
- Cross-entity activity logging is centralized in `ActivityService`, with shared enums and DTOs defined in `common/` so tasks, project documents, and future entities emit a consistent event shape.

### Common Package

`common/` is the contract layer between frontend and backend:

- DTOs define request and response payload shapes.
- Enums define shared domain values such as task status, invitation status, and permission actions.
- Permission helpers and shared response types remove duplication between packages.

This package must be built before the client and server when types change.

## Data and Integration Boundaries

### Database

- PostgreSQL is the primary application database.
- Drizzle ORM provides the typed access layer.
- Schema lives in `server/src/database/schema.ts`.
- Migration history is committed under `server/drizzle/` and root `drizzle/meta/`.

Primary domain entities include:

- users
- projects
- project documents
- activity events
- tasks
- task views
- labels and label sets
- roles, permissions, and membership tables
- invitations

### Auth

- The client performs an initial `/api/auth/me` check in `AuthProvider`.
- Requests include cookies via `credentials: 'include'`.
- Public and authenticated routes are split on the server.
- JWT settings are configured in `server/src/appConfig.ts`.

### Background and External Services

- Redis is provisioned in `docker-compose.yml` and used by BullMQ-style job infrastructure.
- File and media operations are prepared for Aliyun OSS through server config.
- Email-related configuration is present through Resend settings.

## Development and Deployment Model

### Local Development

- Root `npm run dev` is the main full-stack workflow.
- `common` runs in watch mode so type changes propagate to dependents.
- The client runs via Vite.
- The server runs via `tsx --watch`.

### Production

- The root build compiles `common`, `client`, and `server` in order.
- The server process serves both API traffic and the built SPA.
- Docker Compose provisions PostgreSQL, Redis, and the web container.
- The container startup command applies Drizzle migrations before launching the Node server.

## Directory Guide

- `client/src/components/`: feature and shared UI.
- `client/src/pages/`: route entry screens.
- `client/src/stores/`: client-side state containers.
- `server/src/api/`: HTTP endpoints.
- `server/src/services/`: domain services.
- `server/src/database/`: schema and database access.
- `common/src/`: shared contracts.

## Architectural Strengths

- Clear separation between UI, API, and shared contracts.
- Shared TypeScript contract package reduces client-server drift.
- Auto-discovered API modules keep server routing scalable.
- Service-layer backend makes domain logic easier to test and evolve.
- Single-port production deployment keeps hosting simpler.

## Tradeoffs To Keep In Mind

- The server package has a build-time dependency on both `common` and the built frontend.
- Auto-discovery of routes is convenient, but route naming is tightly coupled to filenames.
- Zustand stores are simple and localized, but cross-store workflows can become harder to trace as the app grows.
- Shared package changes require rebuild coordination across the monorepo.
