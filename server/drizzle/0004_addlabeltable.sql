CREATE TABLE "label_set_labels" (
	"label_set_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "label_set_labels_label_set_id_label_id_pk" PRIMARY KEY("label_set_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "label_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label_set_name" varchar(255) NOT NULL,
	"label_set_description" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label_name" varchar(255) NOT NULL,
	"label_description" text,
	"label_color" varchar(30),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "label_set_labels" ADD CONSTRAINT "label_set_labels_label_set_id_label_sets_id_fk" FOREIGN KEY ("label_set_id") REFERENCES "public"."label_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_set_labels" ADD CONSTRAINT "label_set_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label_sets" ADD CONSTRAINT "label_sets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;