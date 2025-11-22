CREATE TABLE "admin_activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid,
	"event_type" text NOT NULL,
	"detail" text
);
--> statement-breakpoint
CREATE TABLE "admin_daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"stat_date" date NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"total_workflows" integer DEFAULT 0 NOT NULL,
	"new_workflows" integer DEFAULT 0 NOT NULL,
	"total_analyses" integer DEFAULT 0 NOT NULL,
	"new_analyses" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;