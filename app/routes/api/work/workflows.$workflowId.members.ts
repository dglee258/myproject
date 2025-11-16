import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { workWorkflowMembers, memberRole, memberStatus } from "~/features/work/team-management/schema";

const postSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { workflowId } = params as { workflowId: string };
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const wid = Number(workflowId);
  const members = await db
    .select()
    .from(workWorkflowMembers)
    .where(eq(workWorkflowMembers.workflow_id, wid));
  const me = members.find((m) => m.user_id === user.id);
  return data({ members, myRole: me?.role ?? null });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { workflowId } = params as { workflowId: string };
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  if (request.method === "POST") {
    const wid = Number(workflowId);
    const form = await request.json().catch(() => ({}));
    const parsed = postSchema.safeParse(form);
    if (!parsed.success) {
      return data({ error: "Invalid body" }, { status: 400 });
    }
    const members = await db
      .select({ user_id: workWorkflowMembers.user_id, role: workWorkflowMembers.role })
      .from(workWorkflowMembers)
      .where(eq(workWorkflowMembers.workflow_id, wid));
    const me = members.find((m) => m.user_id === user.id);
    if (me?.role !== "admin") {
      return data({ error: "Forbidden" }, { status: 403 });
    }
    const exists = members.find((m) => m.user_id === parsed.data.user_id);
    if (exists) {
      return data({ error: "Already a member" }, { status: 409 });
    }
    await db.insert(workWorkflowMembers).values({
      workflow_id: wid,
      user_id: parsed.data.user_id as any,
      role: parsed.data.role as any,
      status: "active" as any,
    });
    return data({ ok: true });
  }

  return data(null, { status: 405 });
}
