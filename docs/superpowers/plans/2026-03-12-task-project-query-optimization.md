# Task Project Query Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce latency for `/api/tasks/project/id/:projectId` by removing the current N+1 label loading pattern and verifying the optimized path behaves correctly.

**Architecture:** Keep the public API contract unchanged, but change the server-side data loading strategy from per-task label queries to a batched label query keyed by task IDs. Add focused validation around the service path so future refactors can catch regressions, and document any remaining database-index follow-up if a migration is added or deferred.

**Tech Stack:** TypeScript, Express, Drizzle ORM, PostgreSQL, Vitest

---

## Chunk 1: Query Path Refactor

### Task 1: Capture the Existing Slow Path

**Files:**
- Modify: `server/src/services/TaskService.ts`
- Reference: `server/src/api/tasks.ts`

- [ ] **Step 1: Re-read the existing implementation path**

Review:
- `server/src/api/tasks.ts` for `/project/id/:projectId`
- `server/src/services/TaskService.ts#getTasksByProjectId`

Expected finding:
- One task list query, followed by per-task label queries inside a sequential loop.

- [ ] **Step 2: Record the refactor target inside the implementation notes**

Target behavior:
- Keep one main task query.
- Replace N label queries with one batched label query using all returned task IDs.
- Rebuild `entity.labels` from an in-memory grouping map.

- [ ] **Step 3: Verify API contract remains unchanged before editing**

Contract to preserve:
- Same route path.
- Same `TaskResDto[]` response shape.
- Same embedded `labels` array semantics.

### Task 2: Replace N+1 Label Loading With Batched Loading

**Files:**
- Modify: `server/src/services/TaskService.ts`

- [ ] **Step 1: Write the failing verification target conceptually before code changes**

Behavior to protect:
- For project tasks, all labels are still returned.
- Labels stay attached to the correct task.
- Tasks with no labels return an empty label list.

- [ ] **Step 2: Implement a batched label query in `getTasksByProjectId`**

Implementation shape:
- Run the existing task query first.
- If no tasks are returned, return early.
- Collect task IDs from the result set.
- Query labels with one `inArray(taskLabels.taskId, taskIds)` query.
- Group rows by `taskId` in memory.
- Populate each `TaskEntity.labels` from the grouped map.

- [ ] **Step 3: Remove sequential `await` calls inside the task loop**

Expected result:
- The task loop only maps rows into entities.
- No per-task database round trip remains.

- [ ] **Step 4: Keep the method readable and localize helper logic**

Constraints:
- Prefer a small local grouping helper or inline map-building logic.
- Do not redesign unrelated service methods.
- Preserve existing entity mapping style unless change is required for correctness.

## Chunk 2: Validation Coverage

### Task 3: Add Regression Coverage For Batched Label Loading

**Files:**
- Create: `server/src/tests/task.service.test.ts`
- Modify: `server/vitest.config.ts` only if required by the new test setup
- Reference: `server/src/tests/task.api.test.ts`

- [ ] **Step 1: Write a failing test for grouped label hydration**

Test should cover:
- Multiple tasks in one project.
- At least one task with multiple labels.
- At least one task with zero labels.
- Returned tasks preserve correct label membership.

- [ ] **Step 2: Run the new focused test and verify it fails for the right reason**

Run:
```bash
npm --prefix server test -- task.service.test.ts
```

Expected:
- FAIL due to missing test scaffolding or incorrect query behavior before the implementation is complete.

- [ ] **Step 3: Implement the minimal test scaffolding needed to exercise `getTasksByProjectId`**

Preferred approach:
- Keep the test focused on service behavior.
- Mock only the DB access boundary if a real DB-backed test would be too heavy.
- Verify query result assembly, not Express routing.

- [ ] **Step 4: Re-run the focused test and verify it passes**

Run:
```bash
npm --prefix server test -- task.service.test.ts
```

Expected:
- PASS with grouped labels correctly attached.

### Task 4: Add Lightweight Instrumentation Or Evidence Hooks If Needed

**Files:**
- Modify: `server/src/services/TaskService.ts` only if timing evidence is added

- [ ] **Step 1: Decide whether temporary or durable timing evidence is needed**

Rule:
- If the refactor is structurally obvious and covered by tests, avoid noisy logging.
- If evidence is added, keep it behind existing debug logging style and make it useful.

- [ ] **Step 2: If added, ensure the timing output is scoped and non-spammy**

Acceptable examples:
- One debug log for main task query duration.
- One debug log for batched label hydration duration.

## Chunk 3: Database Follow-Up And Documentation

### Task 5: Assess Whether To Add A `tasks.project_id` Index Migration Now

**Files:**
- Modify: `server/src/database/schema.ts` if adding index metadata
- Create: `server/drizzle/0008_add_task_project_indexes.sql` only if migration is added
- Modify: `server/drizzle/meta/_journal.json` only if migration is added
- Reference: `server/src/drizzle.config.ts`

- [ ] **Step 1: Decide if the migration is in scope for this change**

Decision criteria:
- If the schema currently has no explicit index for `tasks.projectId`, note that it remains a likely performance multiplier.
- If migration support is straightforward in the current environment, add it now.
- If not, document the follow-up clearly instead of guessing.

- [ ] **Step 2: If adding the migration, update schema and SQL together**

Expected change:
- Add an explicit index for project task lookup.
- Keep migration naming aligned with existing sequence.

- [ ] **Step 3: If not adding the migration, record the deferred optimization in docs**

Documentation target:
- Add a short note to this plan’s execution outcome or another relevant repo doc explaining that application-level N+1 removal shipped first and index migration remains recommended.

### Task 6: Update Architecture-Oriented Docs If The Runtime Data Flow Changed Materially

**Files:**
- Modify: `ARCHITECTURE.md` only if the change materially affects documented runtime flow or backend conventions

- [ ] **Step 1: Check whether the refactor changes documented architecture or only internal implementation details**

Rule:
- If external runtime flow and package responsibilities are unchanged, no architecture doc edit is necessary.
- If backend data-loading conventions are documented and materially affected, update the doc in the same task.

## Chunk 4: Final Verification

### Task 7: Run Targeted Verification And Summarize Residual Risk

**Files:**
- Modify: none unless verification reveals a required fix

- [ ] **Step 1: Run focused server tests for touched coverage**

Run:
```bash
npm --prefix server test -- task.service.test.ts
```

Expected:
- PASS

- [ ] **Step 2: If practical, run the broader server test command**

Run:
```bash
npm --prefix server test
```

Expected:
- PASS, or document unrelated failures without expanding scope.

- [ ] **Step 3: Summarize what changed and what still remains to be measured in production**

Include:
- N+1 removal completed or not.
- Index migration completed or deferred.
- Any remaining need for production timing evidence or `EXPLAIN ANALYZE` confirmation.