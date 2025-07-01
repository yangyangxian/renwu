ALTER TABLE "projects" RENAME COLUMN "owner_id" TO "created_by";--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;