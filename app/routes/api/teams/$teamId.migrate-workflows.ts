import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, and, isNull } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import { workTeams, workTeamMembers } from "~/features/work/team-management/team-schema";
import { workWorkflows, workAnalysisSteps } from "~/features/work/business-logic/schema";

/**
 * POST /api/teams/:teamId/migrate-workflows
 * 기존 워크플로우를 팀에 공유하는 API
 * - 개인 워크플로우: team_id 설정
 * - 이미 다른 팀에 공유된 워크플로우: 복사본 생성
 * Body: { workflow_ids?: number[] } - 특정 워크플로우만 공유
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

  console.log("[Migrate API] Request body:", body);
  console.log("[Migrate API] Workflow IDs:", workflow_ids);

  if (!workflow_ids || !Array.isArray(workflow_ids) || workflow_ids.length === 0) {
    return data({ error: "workflow_ids required" }, { status: 400 });
  }

  try {
    // 선택된 워크플로우 조회
    console.log("[Migrate API] User ID:", user.id);
    const allUserWorkflows = await db
      .select()
      .from(workWorkflows)
      .where(eq(workWorkflows.owner_id, user.id as any));
    
    console.log("[Migrate API] All user workflows:", allUserWorkflows.map(w => ({ id: w.workflow_id, title: w.title, team_id: w.team_id })));
    
    const selectedWorkflows = allUserWorkflows.filter(w => workflow_ids.includes(w.workflow_id.toString()));
    
    console.log("[Migrate API] Selected workflows:", selectedWorkflows);

    if (selectedWorkflows.length === 0) {
      return data({
        message: "공유할 워크플로우가 없습니다",
        migrated_count: 0,
      });
    }

    let migratedCount = 0;
    const migratedWorkflows = [];

    for (const workflow of selectedWorkflows) {
      if (workflow.team_id === null) {
        // 개인 워크플로우: team_id 설정
        await db
          .update(workWorkflows)
          .set({ team_id: teamId as any })
          .where(eq(workWorkflows.workflow_id, workflow.workflow_id));
        
        migratedCount++;
        migratedWorkflows.push({
          workflow_id: workflow.workflow_id,
          title: workflow.title,
          action: 'shared',
        });
      } else {
        // 이미 다른 팀에 속한 워크플로우: 복사본 생성
        const steps = await db
          .select()
          .from(workAnalysisSteps)
          .where(eq(workAnalysisSteps.workflow_id, workflow.workflow_id));

        // 워크플로우 복사본 생성
        const [newWorkflow] = await db
          .insert(workWorkflows)
          .values({
            owner_id: user.id as any,
            team_id: teamId as any,
            title: workflow.title,
            description: workflow.description,
            source_video_id: workflow.source_video_id,
            duration_seconds: workflow.duration_seconds,
            thumbnail_url: workflow.thumbnail_url,
            status: workflow.status,
            is_demo: workflow.is_demo,
          })
          .returning();

        // 스텝 복사
        if (steps.length > 0) {
          await db.insert(workAnalysisSteps).values(
            steps.map(step => ({
              workflow_id: newWorkflow.workflow_id,
              sequence_no: step.sequence_no,
              type: step.type,
              action: step.action,
              description: step.description,
              timestamp_label: step.timestamp_label,
              timestamp_seconds: step.timestamp_seconds,
              confidence: step.confidence,
              screenshot_url: step.screenshot_url,
              notes: step.notes,
            }))
          );
        }

        migratedCount++;
        migratedWorkflows.push({
          workflow_id: newWorkflow.workflow_id,
          title: newWorkflow.title,
          action: 'copied',
        });
      }
    }

    return data({
      message: `${migratedCount}개의 워크플로우가 팀에 공유되었습니다`,
      migrated_count: migratedCount,
      migrated_workflows: migratedWorkflows,
    });
  } catch (error) {
    console.error("[Team] Failed to migrate workflows", error);
    return data({ error: "워크플로우 공유에 실패했습니다" }, { status: 500 });
  }
}