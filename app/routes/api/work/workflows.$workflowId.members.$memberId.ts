import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { workWorkflowMembers } from "~/features/work/team-management/schema";

const patchSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const { workflowId, memberId } = params as { workflowId: string; memberId: string };
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const wid = Number(workflowId);
  // memberId는 user_id(UUID)로 처리
  const targetUserId = memberId;

  // 권한 확인: 요청자가 admin이어야 함
  const myMembership = await db
    .select({ user_id: workWorkflowMembers.user_id, role: workWorkflowMembers.role })
    .from(workWorkflowMembers)
    .where(and(eq(workWorkflowMembers.workflow_id, wid), eq(workWorkflowMembers.user_id, user.id as any)));
  const me = myMembership[0];
  if (!me || me.role !== "admin") {
    return data({ error: "Forbidden" }, { status: 403 });
  }

  if (request.method === "PATCH") {
    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return data({ error: "Invalid body" }, { status: 400 });
    }
    await db
      .update(workWorkflowMembers)
      .set({ ...(parsed.data as any) })
      .where(and(eq(workWorkflowMembers.workflow_id, wid), eq(workWorkflowMembers.user_id, targetUserId as any)));
    return data({ ok: true });
  }

  if (request.method === "DELETE") {
    await db
      .delete(workWorkflowMembers)
      .where(and(eq(workWorkflowMembers.workflow_id, wid), eq(workWorkflowMembers.user_id, targetUserId as any)));
    return data({ ok: true });
  }

  return data(null, { status: 405 });
}
