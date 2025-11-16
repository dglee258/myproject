import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, and } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import { workTeams, workTeamMembers } from "~/features/work/team-management/team-schema";
import { workWorkflows } from "~/features/work/business-logic/schema";

/**
 * GET /api/teams/:teamId/workflows
 * 팀의 워크플로우 목록 조회
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const { teamId } = params;
  if (!teamId) return data({ error: "Team ID required" }, { status: 400 });

  console.log(`[API] Loading workflows for team: ${teamId}, user: ${user.id}`);

  // 팀 접근 권한 확인
  const [team] = await db
    .select()
    .from(workTeams)
    .where(eq(workTeams.team_id, teamId as any))
    .limit(1);

  if (!team) return data({ error: "Team not found" }, { status: 404 });

  const isOwner = team.owner_id === user.id;
  console.log(`[API] User is owner: ${isOwner}, team owner: ${team.owner_id}`);
  
  // owner가 아닌 경우에만 멤버십 확인
  let myMembership = null;
  if (!isOwner) {
    const [membership] = await db
      .select()
      .from(workTeamMembers)
      .where(
        and(
          eq(workTeamMembers.team_id, teamId as any),
          eq(workTeamMembers.user_id, user.id as any),
        ),
      )
      .limit(1);
    myMembership = membership;
    console.log(`[API] User membership:`, myMembership);
  }

  if (!isOwner && (!myMembership || myMembership.status !== "active")) {
    console.log(`[API] Access denied - isOwner: ${isOwner}, membership status: ${myMembership?.status}`);
    return data({ error: "Forbidden" }, { status: 403 });
  }

  // 팀의 워크플로우 목록 조회
  const workflows = await db
    .select({
      workflow_id: workWorkflows.workflow_id,
      title: workWorkflows.title,
      description: workWorkflows.description,
      status: workWorkflows.status,
      created_at: workWorkflows.created_at,
      owner_id: workWorkflows.owner_id,
    })
    .from(workWorkflows)
    .where(eq(workWorkflows.team_id, teamId as any));

  console.log(`[API] Found ${workflows.length} workflows for team: ${teamId}`);

  return data({ workflows });
}

/**
 * POST /api/teams/:teamId/workflows
 * 새 워크플로우 생성 (팀에 속함)
 */
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const { teamId } = params;
  if (!teamId) return data({ error: "Team ID required" }, { status: 400 });

  // 팀 멤버 확인
  const [team] = await db
    .select()
    .from(workTeams)
    .where(eq(workTeams.team_id, teamId as any))
    .limit(1);

  if (!team) return data({ error: "Team not found" }, { status: 404 });

  const isOwner = team.owner_id === user.id;
  const [myMembership] = await db
    .select()
    .from(workTeamMembers)
    .where(
      and(
        eq(workTeamMembers.team_id, teamId as any),
        eq(workTeamMembers.user_id, user.id as any),
        eq(workTeamMembers.status, "active" as any),
      ),
    )
    .limit(1);

  if (!isOwner && !myMembership) {
    return data({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description } = body;

  if (!title || typeof title !== "string") {
    return data({ error: "Title is required" }, { status: 400 });
  }

  // 워크플로우 생성
  const [workflow] = await db
    .insert(workWorkflows)
    .values({
      title,
      description: description || null,
      owner_id: user.id as any,
      team_id: teamId as any,
      status: "pending" as any,
    })
    .returning();

  return data({ workflow }, { status: 201 });
}
