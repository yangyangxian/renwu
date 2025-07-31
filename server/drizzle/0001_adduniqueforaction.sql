ALTER TABLE "permissions" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."permission_action";--> statement-breakpoint
CREATE TYPE "public"."permission_action" AS ENUM('delete_project', 'update_project');--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "action" SET DATA TYPE "public"."permission_action" USING "action"::"public"."permission_action";--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_action_unique" UNIQUE("action");