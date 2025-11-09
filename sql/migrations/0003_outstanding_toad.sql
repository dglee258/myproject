CREATE TABLE "pricing_plan_features" (
	"feature_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pricing_plan_features_feature_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"plan_id" bigint NOT NULL,
	"feature_name" varchar(255) NOT NULL,
	"feature_value" text,
	"is_included" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"plan_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pricing_plans_plan_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"description" text,
	"price_monthly" integer NOT NULL,
	"price_yearly" integer,
	"currency" varchar(10) DEFAULT 'KRW',
	"is_popular" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "work_workflows" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_plan_features" ADD CONSTRAINT "pricing_plan_features_plan_id_pricing_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("plan_id") ON DELETE cascade ON UPDATE no action;