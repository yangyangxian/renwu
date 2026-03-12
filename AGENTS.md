# Renwu Agent Guide

This file defines the default working contract for future coding agents operating in this repository.

## Purpose

Use this repository as a three-package npm workspace:

- `client/`: frontend SPA.
- `server/`: backend API and production static host.
- `common/`: shared contract package.

Read `ARCHITECTURE.md` before making broad structural changes.

## Where Skills Live

Repository-specific skills belong in:

- `.github/workflows/skills/`

This is the canonical and only supported repository skill location. Do not create or maintain duplicate repo skills under the workspace root.

Each skill should use this structure:

- `.github/workflows/skills/<skill-name>/SKILL.md`

Optional supporting files for a skill can live next to `SKILL.md` inside the same skill folder.

When a task matches an installed workflow skill, load and follow that skill before inventing a new workflow. This applies especially to planning, executing plans, debugging, code review, test-first work, and branch-finishing workflows.

When creating a new reusable skill for this repo:

1. Create a new folder under `.github/workflows/skills/`.
2. Add a `SKILL.md` file that explains when to use the skill, what context it covers, and any repo-specific commands or caveats.
3. Keep skills focused on stable, reusable knowledge such as migration workflow, route conventions, state management patterns, or deployment procedures.
4. Reuse or extend an existing installed skill when possible instead of creating overlapping variants.

## Operating Rules

1. Treat `common/` as the source of truth for shared DTOs, enums, and response contracts.
2. When changing API payloads, update `common/` first, then adapt both `server/` and `client/`.
3. Preserve the current server pattern where route files in `server/src/api/` stay thin and business logic lives in `server/src/services/`.
4. Preserve the current client pattern where routeable screens live in `client/src/pages/` and shared state stays in focused Zustand stores under `client/src/stores/`.
5. If code changes affect architecture, package responsibilities, directory conventions, runtime flow, infrastructure, or developer workflow, update the relevant documentation in the same task.
6. Do not add one-off conventions to this file. Put reusable workflow knowledge into a skill under `.github/workflows/skills/`.
7. Before starting work that clearly matches an installed workflow skill, consult the matching skill first and then execute the task under that workflow.

## Common Commands

- Full-stack dev: `npm run dev`
- Full build: `npm run build`
- Server tests: `npm test`
- Client only: `npm --prefix client run dev:alone`
- Server only: `npm --prefix server run dev:alone`
- Common watch: `npm --prefix common run watch`

## Database Workflow

Drizzle schema is defined in `server/src/database/schema.ts`.

Before generating a new migration:

1. Pull the latest code.
2. Apply existing migrations to the target database.
3. Generate a new migration.
4. Commit both migration SQL and metadata changes.

## Documentation Maintenance

Documentation updates are part of the implementation when structural code changes are made. Do not leave architecture or workflow docs stale after changing the codebase.

Update `ARCHITECTURE.md` when any of these change materially:

- package responsibilities
- runtime request flow
- major infrastructure dependencies
- directory conventions

Also update `ARCHITECTURE.md` or other repo docs when code changes introduce or remove:

- major feature modules or cross-package dependencies
- new backend service or routing conventions
- new frontend state or page composition patterns
- new deployment, build, or environment requirements

Update this file as well when the repository skill location, skill-loading expectations, or workflow conventions change.

Update this file when the agent workflow itself changes.