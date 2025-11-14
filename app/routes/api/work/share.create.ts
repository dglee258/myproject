/**
 * Share Token Create API
 * 
 * POST /api/work/share/create
 * - 워크플로우 공유 토큰을 생성하여 일회성 공유 URL을 발급합니다.
 */

import type { Route } from "./+types/share.create";
import db from "~/core/db/drizzle-client.server";
import { workShareTokens } from "~/features/work/share/schema";
import { workWorkflows } from "~/features/work/business-logic/schema";
import { eq } from "drizzle-orm";
import makeServerClient from "~/core/lib/supa-client.server";

function makeToken() {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const [supabase, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const { workflow_id, expires_in_seconds } = await request.json();

    // 워크플로우 소유자 확인
    const workflow = await db.query.workWorkflows.findFirst({
      where: eq(workWorkflows.workflow_id, Number(workflow_id)),
    });

    if (!workflow) {
      return Response.json({ error: "Workflow not found" }, { status: 404, headers });
    }
    if (workflow.owner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403, headers });
    }

    const token = makeToken();
    const expires_at = expires_in_seconds
      ? new Date(Date.now() + Number(expires_in_seconds) * 1000)
      : null;

    await db.insert(workShareTokens).values({
      token,
      workflow_id: workflow.workflow_id,
      created_by: user.id,
      status: "active",
      expires_at,
    });

    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const share_url = `${origin}/share/${token}`;

    return Response.json(
      { success: true, token, share_url, expires_at },
      { headers },
    );
  } catch (error) {
    console.error("Share create error:", error);
    return Response.json(
      {
        error: "Failed to create share token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers },
    );
  }
}
