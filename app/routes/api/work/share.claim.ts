/**
 * Share Token Claim API
 * 
 * POST /api/work/share/claim
 * - 공유 토큰을 브라우저 세션에 귀속시켜 일시적 접근을 허용합니다.
 */

import type { Route } from "./+types/share.claim";
import db from "~/core/db/drizzle-client.server";
import { workShareTokens } from "~/features/work/share/schema";
import { and, eq, isNull, lt, or } from "drizzle-orm";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { token, session_id } = await request.json();

    if (!token || !session_id) {
      return Response.json({ error: "token and session_id required" }, { status: 400 });
    }

    const share = await db.query.workShareTokens.findFirst({
      where: eq(workShareTokens.token, token),
    });

    if (!share) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (share.status !== "active") {
      return Response.json({ error: "Invalid status" }, { status: 403 });
    }

    if (share.expires_at && share.expires_at < new Date()) {
      return Response.json({ error: "Expired" }, { status: 410 });
    }

    // 이미 세션이 귀속되어 있으면 동일 세션만 허용
    if (share.session_id && share.session_id !== session_id) {
      return Response.json({ error: "Already claimed by different session" }, { status: 409 });
    }

    if (!share.session_id) {
      await db
        .update(workShareTokens)
        .set({ session_id, claimed_at: new Date(), status: "claimed" })
        .where(eq(workShareTokens.token, token));
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Share claim error:", error);
    return Response.json(
      { error: "Failed to claim share token" },
      { status: 500 },
    );
  }
}
