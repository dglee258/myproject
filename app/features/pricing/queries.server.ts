/**
 * Database Queries for Pricing Page
 */

import db from "~/core/db/drizzle-client.server";
import { pricingPlans, pricingPlanFeatures } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Get all active pricing plans with their features
 */
export async function getPricingPlans() {
  const plans = await db.query.pricingPlans.findMany({
    where: eq(pricingPlans.is_active, true),
    with: {
      features: {
        orderBy: (features, { asc }) => [asc(features.display_order)],
      },
    },
    orderBy: (plans, { asc }) => [asc(plans.display_order)],
  });

  return plans;
}
