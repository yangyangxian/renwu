CREATE TYPE "public"."project_role" AS ENUM('member', 'admin', 'owner');--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."project_role";--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DATA TYPE "public"."project_role" USING "role"::"public"."project_role";--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET NOT NULL;