import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Helper function moved inline to avoid server/client code splitting
const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull(),
};

export const pricingPlans = pgTable("pricing_plans", {
  plan_id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  price_monthly: integer().notNull(),
  price_yearly: integer(),
  currency: varchar({ length: 10 }).default("KRW"),
  is_popular: boolean().default(false),
  is_active: boolean().default(true),
  display_order: integer().default(0),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp().defaultNow(),
});

export const pricingPlanFeatures = pgTable("pricing_plan_features", {
  feature_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  plan_id: bigint({ mode: "number" })
    .references(() => pricingPlans.plan_id, { onDelete: "cascade" })
    .notNull(),
  feature_name: varchar({ length: 255 }).notNull(),
  feature_value: text(),
  is_included: boolean().default(true),
  display_order: integer().default(0),
  created_at: timestamp().defaultNow(),
});

// Relations
export const pricingPlansRelations = relations(pricingPlans, ({ many }) => ({
  features: many(pricingPlanFeatures),
}));

export const pricingPlanFeaturesRelations = relations(
  pricingPlanFeatures,
  ({ one }) => ({
    plan: one(pricingPlans, {
      fields: [pricingPlanFeatures.plan_id],
      references: [pricingPlans.plan_id],
    }),
  }),
);
