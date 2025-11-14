/**
 * Public Workflow via Share Token API
 * 
 * GET /api/work/share/workflows/:token
 * - 공유 토큰과 세션을 검증하여 워크플로우 및 단계 목록을 반환
 */

import type { Route } from "./+types/share.workflows.$token";
import db from "~/core/db/drizzle-client.server";
import { workShareTokens } from "~/features/work/share/schema";
import { workWorkflows, workAnalysisSteps } from "~/features/work/business-logic/schema";
import { eq } from "drizzle-orm";

export async function loader({ params, request }: Route.LoaderArgs) {
  const token = params.token;
  const sessionId = request.headers.get("x-share-session");

  if (!token || !sessionId) {
    return Response.json({ error: "token and x-share-session required" }, { status: 400 });
  }

  const share = await db.query.workShareTokens.findFirst({
    where: eq(workShareTokens.token, token),
  });

  if (!share) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (share.expires_at && share.expires_at < new Date()) {
    return Response.json({ error: "Expired" }, { status: 410 });
  }

  if (share.session_id !== sessionId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const workflow = await db.query.workWorkflows.findFirst({
    where: eq(workWorkflows.workflow_id, share.workflow_id),
    with: { steps: true },
  });

  if (!workflow) {
    return Response.json({ error: "Workflow not found" }, { status: 404 });
  }

  const sortedSteps = (workflow.steps || []).sort((a, b) => a.sequence_no - b.sequence_no);

  return Response.json({ workflow: { ...workflow, steps: sortedSteps } });
}
