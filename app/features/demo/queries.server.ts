/**
 * Database Queries for Demo Page
 * 
 * Fetches demo workflows that are publicly accessible
 */

import { eq } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import { workWorkflows } from "~/features/work/business-logic/schema";

/**
 * Get all demo workflows (is_demo = true)
 * No authentication required - public data
 */
export async function getDemoWorkflows() {
  const workflows = await db.query.workWorkflows.findMany({
    where: eq(workWorkflows.is_demo, true),
    with: {
      steps: true,
    },
    orderBy: (workWorkflows, { desc }) => [desc(workWorkflows.created_at)],
  });

  return workflows;
}
