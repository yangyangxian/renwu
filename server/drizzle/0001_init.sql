ALTER TABLE "projects" RENAME COLUMN "ownerId" TO "owner_id";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "dueDate" TO "due_date";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "createdBy" TO "created_by";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "assignedTo" TO "assigned_to";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_ownerId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_createdBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignedTo_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_projectId_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;