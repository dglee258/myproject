CREATE TYPE "public"."share_status" AS ENUM('active', 'claimed', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "service_items" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"section_key" varchar(100) NOT NULL,
	"item_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_sections" (
	"section_id" serial PRIMARY KEY NOT NULL,
	"section_key" varchar(100) NOT NULL,
	"title" text,
	"subtitle" text,
	"description" text,
	"badge_text" varchar(100),
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_sections_section_key_unique" UNIQUE("section_key")
);
--> statement-breakpoint
CREATE TABLE "work_share_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"workflow_id" bigint NOT NULL,
	"created_by" uuid,
	"status" "share_status" DEFAULT 'active' NOT NULL,
	"session_id" text,
	"expires_at" timestamp,
	"claimed_at" timestamp,
	"revoked_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_share_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_analysis_steps" ADD COLUMN "screenshot_url" text;--> statement-breakpoint
ALTER TABLE "work_workflows" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "work_share_tokens" ADD CONSTRAINT "work_share_tokens_workflow_id_work_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."work_workflows"("workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_share_tokens" ADD CONSTRAINT "work_share_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflows" ADD CONSTRAINT "work_workflows_team_id_work_teams_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."work_teams"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-share-tokens" ON "work_share_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "work_share_tokens"."created_by");--> statement-breakpoint
ALTER POLICY "select-workflows" ON "work_workflows" TO authenticated USING (
        (select auth.uid()) = "work_workflows"."owner_id"
        OR (
          "work_workflows"."team_id" IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM work_team_members tm
            WHERE tm.team_id = "work_workflows"."team_id"
              AND tm.user_id = (select auth.uid())
              AND tm.status = 'active'
          )
        )
        OR EXISTS (
          SELECT 1 FROM work_workflow_members m
          WHERE m.workflow_id = "work_workflows"."workflow_id"
            AND m.user_id = (select auth.uid())
            AND m.status = 'active'
        )
      );