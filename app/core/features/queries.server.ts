/**
 * Feature Flags Queries
 * 
 * Manage feature availability without code deployment
 */

import { eq, inArray } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import { featureFlags } from "./schema";

/**
 * Get a specific feature flag by key
 */
export async function getFeatureFlag(featureKey: string) {
  const flag = await db.query.featureFlags.findFirst({
    where: eq(featureFlags.feature_key, featureKey),
  });

  return flag;
}

/**
 * Get all enabled features
 */
export async function getEnabledFeatures() {
  const flags = await db.query.featureFlags.findMany({
    where: eq(featureFlags.is_enabled, true),
    orderBy: (featureFlags, { asc }) => [asc(featureFlags.sort_order)],
  });

  return flags;
}

/**
 * Get multiple feature flags by keys
 */
export async function getFeatureFlags(featureKeys: string[]) {
  const flags = await db
    .select()
    .from(featureFlags)
    .where(inArray(featureFlags.feature_key, featureKeys));

  // Convert to object for easy access
  const flagsMap: Record<
    string,
    {
      isEnabled: boolean;
      disabledMessage: string;
    }
  > = {};

  flags.forEach((flag) => {
    flagsMap[flag.feature_key] = {
      isEnabled: flag.is_enabled || false,
      disabledMessage: flag.disabled_message || "추후 공개 예정",
    };
  });

  return flagsMap;
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  const flag = await getFeatureFlag(featureKey);
  return flag?.is_enabled || false;
}
