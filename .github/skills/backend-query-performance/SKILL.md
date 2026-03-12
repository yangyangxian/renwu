---
name: backend-query-performance
description: Use when a backend endpoint or service method is slow despite modest result sizes, especially when loading related records, hydrating child collections, or filtering by foreign keys such as projectId or userId.
---

# Backend Query Performance

## Overview

Backend query optimization is not one technique. It is a collection of recurring failure patterns.

**Core principle:** Count database round trips before blaming row count.

## When to Use

Use for backend performance investigations when:
- An endpoint takes seconds but returns only dozens of records
- A service method loads parent rows and then related data like labels, comments, or permissions
- Code contains `await` inside loops over query results
- Latency grows with the number of returned entities rather than payload size
- A query filters by foreign keys such as `projectId`, `userId`, or `taskId`

Don't use when:
- The bottleneck is clearly outside the database path
- The problem is frontend rendering, serialization, or network transfer only

## Quick Reference

| Symptom | Likely Cause | First Check |
|--------|--------------|-------------|
| 8s for 30-50 rows | N+1 queries | Look for per-row DB calls in service loop |
| One project/user scope is slow | Missing foreign-key index | Check schema and query plan |
| Route handler looks simple | Service-layer bottleneck | Trace route -> service -> query path |
| Child collections missing after refactor | Incorrect batch hydration | Add focused service test |

## Optimization Patterns

This skill is meant to accumulate multiple backend query optimization patterns over time.

Current patterns:
- N+1 queries

Likely future additions:
- Missing foreign-key indexes
- Over-fetching unused columns
- Large joins that duplicate parent rows
- Unbounded scans caused by missing pagination or filters
- Sort-heavy queries without supporting indexes

## Pattern 1: N+1 Queries

### What It Looks Like

One query loads parent rows, then another query runs once per parent row to load children.

### Why It Hurts

The payload may be small, but latency becomes proportional to the number of returned parents multiplied by database round trips.

This gets especially bad when:
- The database is remote
- Queries run sequentially inside `for` loops
- Child hydration touches tables like labels, comments, permissions, or attachments

### Example

**Bad pattern:**

```ts
const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, projectId));

for (const task of tasks) {
  task.labels = await db
    .select()
    .from(taskLabels)
    .where(eq(taskLabels.taskId, task.id));
}
```

**Better pattern:**

```ts
const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, projectId));
const taskIds = tasks.map(task => task.id);

const labelRows = await db
  .select()
  .from(taskLabels)
  .where(inArray(taskLabels.taskId, taskIds));
```

Load once, group in memory, then attach child rows back to parents.

### How To Fix It

1. Keep the main parent query.
2. Collect parent IDs.
3. Batch-load child rows in one query.
4. Group child rows in memory by parent ID.
5. Reattach grouped children without changing response shape.

## Investigation Workflow

1. Trace the request path from route file to service method to query code.
2. Count actual DB round trips, especially any query executed inside a loop.
3. Identify which optimization pattern applies. Start with N+1 unless evidence points elsewhere.
4. Batch-load related records using parent IDs, then group them in memory when N+1 is present.
5. Preserve the API contract. Change loading strategy, not response semantics.
6. Check whether the main filter column has an explicit index.
7. Add a focused regression test at the service layer.
8. Verify with targeted tests first, then use `EXPLAIN ANALYZE` if database work remains suspicious.

## Common Mistakes

- Assuming "small response" means the database cannot be the problem.
- Optimizing serialization or DTO mapping before counting queries.
- Replacing N+1 with a huge join that changes response semantics or duplicates rows.
- Skipping the index check after fixing query shape.
- Only testing the HTTP route and not the service method that assembles related entities.
- Adding logs everywhere instead of measuring the exact slow query path.

## Renwu Notes

- Keep routes thin under `server/src/api/`.
- Put query-shape fixes in `server/src/services/`.
- If payload contracts change, update `common/` first. Query-path refactors usually should not require contract changes.

## Real-World Impact

In this repository, `/api/tasks/project/id/:projectId` was slow even for dozens of tasks because labels were loaded with sequential per-task queries. That issue fits the N+1 pattern. Refactoring to one batched label query plus in-memory grouping produced a significant latency drop without changing the API response shape.