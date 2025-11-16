import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";

import db from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  workWorkflowInvites,
  workWorkflowMembers,
} from "~/features/work/team-management/schema";

const postSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const { workflowId } = params as { workflowId: string };
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  if (request.method !== "POST") {
    return data(null, { status: 405 });
  }

  const wid = Number(workflowId);

  // 요청자 권한 확인: 해당 워크플로우의 admin만 초대 가능
  const myMembership = await db
    .select({ role: workWorkflowMembers.role })
    .from(workWorkflowMembers)
    .where(and(eq(workWorkflowMembers.workflow_id, wid), eq(workWorkflowMembers.user_id, user.id as any)));
  const me = myMembership[0];
  if (!me || me.role !== "admin") {
    return data({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return data({ error: "Invalid body" }, { status: 400 });
  }

  const token = crypto.randomUUID();

  await db.insert(workWorkflowInvites).values({
    workflow_id: wid,
    email: parsed.data.email,
    role: parsed.data.role as any,
    status: "sent" as any,
    token,
    invited_by: user.id as any,
  });

  // 실제로는 이메일 발송 등을 트리거
  return data({ ok: true, token });
}
