ALTER TABLE "users" ADD COLUMN "last_personal_task_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH personal_task_offsets AS (
	SELECT
		created_by,
		COALESCE(MAX(task_number), 0) AS last_task_number
	FROM "tasks"
	WHERE project_id IS NULL
	GROUP BY created_by
), numbered_tasks AS (
	SELECT
		"tasks".id,
		COALESCE(personal_task_offsets.last_task_number, 0)
			+ ROW_NUMBER() OVER (PARTITION BY "tasks".created_by ORDER BY "tasks".created_at ASC NULLS LAST, "tasks".id ASC) AS next_task_number
	FROM "tasks"
	LEFT JOIN personal_task_offsets ON personal_task_offsets.created_by = "tasks".created_by
	WHERE "tasks".project_id IS NULL
		AND "tasks".task_number IS NULL
)
UPDATE "tasks"
SET "task_number" = numbered_tasks.next_task_number
FROM numbered_tasks
WHERE "tasks".id = numbered_tasks.id;--> statement-breakpoint
UPDATE "users"
SET "last_personal_task_number" = COALESCE(personal_task_counts.max_task_number, 0)
FROM (
	SELECT
		"users".id AS user_id,
		MAX("tasks".task_number) AS max_task_number
	FROM "users"
	LEFT JOIN "tasks"
		ON "tasks".created_by = "users".id
		AND "tasks".project_id IS NULL
	GROUP BY "users".id
) AS personal_task_counts
WHERE "users".id = personal_task_counts.user_id;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_personal_task_number_unique" ON "tasks" USING btree ("created_by","task_number") WHERE "tasks"."project_id" IS NULL AND "tasks"."task_number" IS NOT NULL;