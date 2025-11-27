import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, and } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import {
  workTeams,
  workTeamMembers,
} from "~/features/work/team-management/team-schema";
import { workWorkflowShares } from "~/features/work/team-management/team-shares-schema";
import { workWorkflows } from "~/features/work/business-logic/schema";

async function checkAdminPermission(teamId: string, userId: string): Promise<boolean> {
  const [team] = await db
    .select()
    .from(workTeams)
    .where(eq(workTeams.team_id, teamId as any))
    .limit(1);

  if (!team) return false;
  if (team.owner_id === userId) return true;

  const [member] = await db
    .select()
    .from(workTeamMembers)
    .where(
      and(
        eq(workTeamMembers.team_id, teamId as any),
        eq(workTeamMembers.user_id, userId as any),
        eq(workTeamMembers.status, "active" as any),
      ),
    )
    .limit(1);

  return member?.role === "admin" || member?.role === "owner";
}

export async function action({ request, params }: ActionFunctionArgs) {
  console.log(`[API] Workflow Action: ${request.method} ${request.url}`);
  
  if (request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const { teamId, workflowId } = params;
  if (!teamId || !workflowId) {
    return data({ error: "Team ID and Workflow ID required" }, { status: 400 });
  }

  const isAdmin = await checkAdminPermission(teamId, user.id);
  if (!isAdmin) {
    return data({ error: "Admin permission required" }, { status: 403 });
  }

  try {
    // 1. Update workflow to remove team_id
    await db
      .update(workWorkflows)
      .set({ team_id: null as any })
      .where(
        and(
          eq(workWorkflows.workflow_id, parseInt(workflowId)),
          eq(workWorkflows.team_id, teamId as any),
        ),
      );

    // 2. Remove all shares for this workflow
    await db
      .delete(workWorkflowShares)
      .where(eq(workWorkflowShares.workflow_id, parseInt(workflowId)));

    return data({ success: true });
  } catch (error: any) {
    console.error("[API] Error unsharing workflow:", error);
    return data(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
