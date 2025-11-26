CREATE TABLE IF NOT EXISTS "work_video_analysis_rate_limits" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_video_analysis_rate_limits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"last_request_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_video_analysis_rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_id" DROP IDENTITY;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_video_analysis_rate_limits" ADD CONSTRAINT "work_video_analysis_rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE POLICY "users-access-own-rate-limits" ON "work_video_analysis_rate_limits" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "work_video_analysis_rate_limits"."user_id") WITH CHECK ((select auth.uid()) = "work_video_analysis_rate_limits"."user_id");