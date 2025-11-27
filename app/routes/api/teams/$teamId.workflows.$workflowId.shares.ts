import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
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

/**
 * Admin 권한 확인
 */
async function checkAdminPermission(
  teamId: string,
  userId: string,
): Promise<boolean> {
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

/**
 * GET /api/teams/:teamId/workflows/:workflowId/shares
 * 워크플로우 공유 설정 조회
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const { teamId, workflowId } = params;
  if (!teamId || !workflowId) {
    return data({ error: "Team ID and Workflow ID required" }, { status: 400 });
  }

  // Admin 권한 확인
  const isAdmin = await checkAdminPermission(teamId, user.id);
  if (!isAdmin) {
    return data({ error: "Admin permission required" }, { status: 403 });
  }

  // 워크플로우가 팀에 속하는지 확인
  const [workflow] = await db
    .select()
    .from(workWorkflows)
    .where(
      and(
        eq(workWorkflows.workflow_id, parseInt(workflowId)),
        eq(workWorkflows.team_id, teamId as any),
      ),
    )
    .limit(1);

  if (!workflow) {
    return data({ error: "Workflow not found in this team" }, { status: 404 });
  }

  // 공유 설정 조회
  const shares = await db
    .select({
      share_id: workWorkflowShares.share_id,
      team_member_id: workWorkflowShares.team_member_id,
      shared_by: workWorkflowShares.shared_by,
      created_at: workWorkflowShares.created_at,
    })
    .from(workWorkflowShares)
    .where(eq(workWorkflowShares.workflow_id, parseInt(workflowId)));

  // 공유 설정이 없으면 팀 전체 공유
  const isSharedWithAll = shares.length === 0;

  return data({
    workflow_id: workflow.workflow_id,
    is_shared_with_all: isSharedWithAll,
    shared_members: shares,
  });
}

/**
 * POST /api/teams/:teamId/workflows/:workflowId/shares
 * 워크플로우를 특정 멤버에게 공유
 * Body: { member_ids: string[] } - 공유할 멤버 ID 배열
 * 빈 배열 or 생략 = 팀 전체 공유 (기존 공유 삭제)
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

  const { teamId, workflowId } = params;
  if (!teamId || !workflowId) {
    return data({ error: "Team ID and Workflow ID required" }, { status: 400 });
  }

  // Admin 권한 확인
  const isAdmin = await checkAdminPermission(teamId, user.id);
  if (!isAdmin) {
    return data({ error: "Admin permission required" }, { status: 403 });
  }

  // 워크플로우가 팀에 속하는지 확인
  const [workflow] = await db
    .select()
    .from(workWorkflows)
    .where(
      and(
        eq(workWorkflows.workflow_id, parseInt(workflowId)),
        eq(workWorkflows.team_id, teamId as any),
      ),
    )
    .limit(1);

  if (!workflow) {
    return data({ error: "Workflow not found in this team" }, { status: 404 });
  }

  const body = await request.json();
  const { member_ids = [] } = body;

  // 기존 공유 설정 삭제
  await db
    .delete(workWorkflowShares)
    .where(eq(workWorkflowShares.workflow_id, parseInt(workflowId)));

  // 빈 배열이면 팀 전체 공유 (공유 레코드 없음)
  if (!member_ids || member_ids.length === 0) {
    return data({
      message: "Workflow is now shared with all team members",
      is_shared_with_all: true,
    });
  }

  // 특정 멤버에게만 공유
  const sharesToInsert = member_ids.map((memberId: string) => ({
    workflow_id: parseInt(workflowId),
    team_member_id: memberId as any,
    shared_by: user.id as any,
  }));

  await db.insert(workWorkflowShares).values(sharesToInsert);

  return data({
    message: `Workflow shared with ${member_ids.length} member(s)`,
    is_shared_with_all: false,
    shared_member_count: member_ids.length,
  });
}
