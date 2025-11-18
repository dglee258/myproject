import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { and, eq } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import {
  workTeams,
  workTeamMembers,
  workWorkflowShares,
} from "~/features/work/team-management/team-schema";
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

  if (request.method === "DELETE") {
    const id = parseInt(workflowId, 10);
    if (Number.isNaN(id)) {
      return data({ error: "Invalid workflow ID" }, { status: 400 });
    }

    const [workflow] = await db
      .select()
      .from(workWorkflows)
      .where(
        and(
          eq(workWorkflows.workflow_id, id),
          eq(workWorkflows.team_id, teamId as any),
        ),
      )
      .limit(1);

    if (!workflow) {
      return data({ error: "Workflow not found in this team" }, { status: 404 });
    }

    await db
      .update(workWorkflows)
      .set({ team_id: null as any })
      .where(eq(workWorkflows.workflow_id, id));

    await db
      .delete(workWorkflowShares)
      .where(eq(workWorkflowShares.workflow_id, id));

    return data({ success: true });
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}
