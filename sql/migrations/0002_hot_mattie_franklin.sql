CREATE TYPE "public"."step_type" AS ENUM('click', 'input', 'navigate', 'wait', 'decision');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('analyzed', 'analyzing', 'pending');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('sent', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'pending', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('idle', 'uploading', 'processing', 'completed', 'error');--> statement-breakpoint
CREATE TABLE "work_analysis_steps" (
	"step_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_analysis_steps_step_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"workflow_id" bigint NOT NULL,
	"sequence_no" integer NOT NULL,
	"type" "step_type" NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"timestamp_label" text,
	"timestamp_seconds" double precision,
	"confidence" integer,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_analysis_steps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "work_workflows" (
	"workflow_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_workflows_workflow_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"owner_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"source_video_id" bigint,
	"duration_seconds" double precision,
	"thumbnail_url" text,
	"status" "workflow_status" DEFAULT 'analyzing' NOT NULL,
	"requested_at" timestamp,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_workflows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "work_workflow_invites" (
	"invite_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_workflow_invites_invite_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"workflow_id" bigint NOT NULL,
	"email" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "invite_status" DEFAULT 'sent' NOT NULL,
	"token" text NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp,
	"accepted_by" uuid,
	"accepted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_workflow_invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "work_workflow_members" (
	"workflow_member_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_workflow_members_workflow_member_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"workflow_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "member_status" DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"member_email_snapshot" text,
	"member_name_snapshot" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_workflow_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "work_videos" (
	"video_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_videos_video_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"owner_id" uuid,
	"title" text,
	"original_filename" text,
	"mime_type" text,
	"file_size" bigint,
	"storage_path" text,
	"preview_url" text,
	"thumbnail_url" text,
	"duration_seconds" double precision,
	"status" "upload_status" DEFAULT 'idle' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"requested_at" timestamp,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_videos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_analysis_steps" ADD CONSTRAINT "work_analysis_steps_workflow_id_work_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."work_workflows"("workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflows" ADD CONSTRAINT "work_workflows_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflows" ADD CONSTRAINT "work_workflows_source_video_id_work_videos_video_id_fk" FOREIGN KEY ("source_video_id") REFERENCES "public"."work_videos"("video_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflow_invites" ADD CONSTRAINT "work_workflow_invites_workflow_id_work_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."work_workflows"("workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflow_invites" ADD CONSTRAINT "work_workflow_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflow_invites" ADD CONSTRAINT "work_workflow_invites_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflow_members" ADD CONSTRAINT "work_workflow_members_workflow_id_work_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."work_workflows"("workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_workflow_members" ADD CONSTRAINT "work_workflow_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_videos" ADD CONSTRAINT "work_videos_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_invite_token" ON "work_workflow_invites" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_workflow_user" ON "work_workflow_members" USING btree ("workflow_id","user_id");--> statement-breakpoint
CREATE POLICY "select-steps" ON "work_analysis_steps" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM work_workflows w
          WHERE w.workflow_id = "work_analysis_steps"."workflow_id"
            AND (
              (select auth.uid()) = w.owner_id
              OR EXISTS (
                SELECT 1 FROM work_workflow_members m
                WHERE m.workflow_id = w.workflow_id
                  AND m.user_id = (select auth.uid())
                  AND m.status = 'active'
              )
            )
        )
      );--> statement-breakpoint
CREATE POLICY "select-workflows" ON "work_workflows" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        (select auth.uid()) = "work_workflows"."owner_id"
        OR EXISTS (
          SELECT 1 FROM work_workflow_members m
          WHERE m.workflow_id = "work_workflows"."workflow_id"
            AND m.user_id = (select auth.uid())
            AND m.status = 'active'
        )
      );--> statement-breakpoint
CREATE POLICY "select-invites" ON "work_workflow_invites" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "work_workflow_invites"."invited_by");--> statement-breakpoint
CREATE POLICY "select-members" ON "work_workflow_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM work_workflow_members my_membership
          WHERE my_membership.workflow_id = "work_workflow_members"."workflow_id"
            AND my_membership.user_id = (select auth.uid())
            AND my_membership.status = 'active'
        )
      );--> statement-breakpoint
CREATE POLICY "select-work-videos" ON "work_videos" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "work_videos"."owner_id");