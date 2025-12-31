ALTER TABLE "label_sets" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "labels" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "label_sets" ADD CONSTRAINT "label_sets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;