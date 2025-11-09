/**
 * Workflow Status API
 * 
 * GET /api/work/workflows/:workflowId/status
 * - 워크플로우 분석 진행 상황 조회
 */

import type { Route } from "./+types/workflows.$workflowId.status";
import db from "~/core/db/drizzle-client.server";
import { workWorkflows, workAnalysisSteps } from "~/features/work/business-logic/schema";
import { eq } from "drizzle-orm";
import makeServerClient from "~/core/lib/supa-client.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const [supabase, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const workflowId = parseInt(params.workflowId);

    if (isNaN(workflowId)) {
      return Response.json(
        { error: "Invalid workflow ID" },
        { status: 400, headers },
      );
    }

    // 워크플로우 조회
    const workflow = await db.query.workWorkflows.findFirst({
      where: eq(workWorkflows.workflow_id, workflowId),
    });

    if (!workflow) {
      return Response.json(
        { error: "Workflow not found" },
        { status: 404, headers },
      );
    }

    // 권한 확인 (소유자 또는 멤버)
    if (workflow.owner_id !== user.id) {
      // TODO: 멤버 권한 체크 추가
      return Response.json({ error: "Forbidden" }, { status: 403, headers });
    }

    // 분석 단계 조회
    const steps = await db.query.workAnalysisSteps.findMany({
      where: eq(workAnalysisSteps.workflow_id, workflowId),
    });

    // 진행률 계산
    let progress = 0;
    if (workflow.status === "analyzing") {
      // 분석 중: 단계 수 기반 (임시)
      progress = Math.min(steps.length * 20, 90);
    } else if (workflow.status === "analyzed") {
      progress = 100;
    } else if (workflow.status === "pending") {
      progress = 0;
    }

    return Response.json(
      {
        workflow_id: workflow.workflow_id,
        status: workflow.status,
        progress,
        steps_count: steps.length,
        title: workflow.title,
        created_at: workflow.created_at,
        completed_at: workflow.completed_at,
      },
      { headers },
    );
  } catch (error) {
    console.error("Status check error:", error);
    return Response.json(
      {
        error: "Failed to get workflow status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers },
    );
  }
}
