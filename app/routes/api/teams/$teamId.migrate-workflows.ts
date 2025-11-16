import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, and, isNull } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import { workTeams, workTeamMembers } from "~/features/work/team-management/team-schema";
import { workWorkflows } from "~/features/work/business-logic/schema";

/**
 * POST /api/teams/:teamId/migrate-workflows
 * 기존 워크플로우를 팀에 소속시키는 마이그레이션 API
 * Body: { workflow_ids?: number[] } - 특정 워크플로우만 이관 (선택사항)
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

  // 팀 관리자 권한 확인
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

  const isAdmin = isOwner || myMembership?.role === "admin";
  if (!isAdmin) {
    return data({ error: "Admin permission required" }, { status: 403 });
  }

  const body = await request.json();
  const { workflow_ids } = body;

  try {
    let workflowsToUpdate;

    if (workflow_ids && Array.isArray(workflow_ids) && workflow_ids.length > 0) {
      // 특정 워크플로우만 이관
      workflowsToUpdate = await db
        .select()
        .from(workWorkflows)
        .where(
          and(
            eq(workWorkflows.owner_id, user.id as any), // 자신의 워크플로우만
            isNull(workWorkflows.team_id), // 팀에 속하지 않은 것만
          ),
        )
        .then((workflows) => 
          workflows.filter(w => workflow_ids.includes(w.workflow_id))
        );
    } else {
      // 팀 owner의 모든 미소속 워크플로우 이관
      workflowsToUpdate = await db
        .select()
        .from(workWorkflows)
        .where(
          and(
            eq(workWorkflows.owner_id, team.owner_id), // 팀 owner의 워크플로우
            isNull(workWorkflows.team_id), // 팀에 속하지 않은 것만
          ),
        );
    }

    if (workflowsToUpdate.length === 0) {
      return data({
        message: "이관할 워크플로우가 없습니다",
        migrated_count: 0,
      });
    }

    // 워크플로우 팀 소속 업데이트
    const updatePromises = workflowsToUpdate.map((workflow) =>
      db
        .update(workWorkflows)
        .set({ team_id: teamId as any })
        .where(eq(workWorkflows.workflow_id, workflow.workflow_id))
    );

    await Promise.all(updatePromises);

    return data({
      message: `${workflowsToUpdate.length}개의 워크플로우가 팀에 이관되었습니다`,
      migrated_count: workflowsToUpdate.length,
      migrated_workflows: workflowsToUpdate.map(w => ({
        workflow_id: w.workflow_id,
        title: w.title,
      })),
    });
  } catch (error) {
    console.error("[Team] Failed to migrate workflows", error);
    return data({ error: "워크플로우 이관에 실패했습니다" }, { status: 500 });
  }
}