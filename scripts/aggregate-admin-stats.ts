import "dotenv/config";

import { and, count, gte, lte, sql } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import { profiles } from "~/features/users/schema";
import { workWorkflows } from "~/features/work/business-logic/schema";
import { adminDailyStats } from "~/features/admin/schema";

async function main() {
  const today = new Date();
  const statDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
  const statDateStr = statDate.toISOString().slice(0, 10); // YYYY-MM-DD

  console.log(`[AdminStats] Aggregating stats for ${statDateStr}`);

  const [{ total_users }] = await db
    .select({ total_users: count() })
    .from(profiles);

  const [{ new_users }] = await db
    .select({ new_users: count() })
    .from(profiles)
    .where(sql`date(${profiles.created_at}) = ${statDateStr}` as any);

  const [{ total_workflows }] = await db
    .select({ total_workflows: count() })
    .from(workWorkflows);

  const [{ new_workflows }] = await db
    .select({ new_workflows: count() })
    .from(workWorkflows)
    .where(sql`date(${workWorkflows.created_at}) = ${statDateStr}` as any);

  // Placeholder for total/new analyses, depends on where analysis runs are logged.
  const total_analyses = 0;
  const new_analyses = 0;

  await db
    .insert(adminDailyStats)
    .values({
      stat_date: statDateStr as any,
      total_users,
      new_users,
      total_workflows,
      new_workflows,
      total_analyses,
      new_analyses,
    })
    .onConflictDoUpdate({
      target: adminDailyStats.stat_date,
      set: {
        total_users,
        new_users,
        total_workflows,
        new_workflows,
        total_analyses,
        new_analyses,
        updated_at: sql`now()` as any,
      },
    });

  console.log("[AdminStats] Aggregation finished");
}

main().catch((err) => {
  console.error("[AdminStats] Aggregation failed", err);
  process.exit(1);
});
