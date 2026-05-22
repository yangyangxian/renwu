ALTER TABLE "projects" ADD COLUMN "last_task_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_number" integer;--> statement-breakpoint
WITH project_task_offsets AS (
	SELECT
		project_id,
		COALESCE(MAX(task_number), 0) AS last_task_number
	FROM "tasks"
	WHERE project_id IS NOT NULL
	GROUP BY project_id
), numbered_tasks AS (
	SELECT
		"tasks".id,
		COALESCE(project_task_offsets.last_task_number, 0)
			+ ROW_NUMBER() OVER (PARTITION BY "tasks".project_id ORDER BY "tasks".created_at ASC NULLS LAST, "tasks".id ASC) AS next_task_number
	FROM "tasks"
	LEFT JOIN project_task_offsets ON project_task_offsets.project_id = "tasks".project_id
	WHERE "tasks".project_id IS NOT NULL
		AND "tasks".task_number IS NULL
)
UPDATE "tasks"
SET "task_number" = numbered_tasks.next_task_number
FROM numbered_tasks
WHERE "tasks".id = numbered_tasks.id;--> statement-breakpoint
UPDATE "projects"
SET "last_task_number" = COALESCE(project_task_counts.max_task_number, 0)
FROM (
	SELECT
		"projects".id AS project_id,
		MAX("tasks".task_number) AS max_task_number
	FROM "projects"
	LEFT JOIN "tasks" ON "tasks".project_id = "projects".id
	GROUP BY "projects".id
) AS project_task_counts
WHERE "projects".id = project_task_counts.project_id;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_project_task_number_unique" ON "tasks" USING btree ("project_id","task_number");