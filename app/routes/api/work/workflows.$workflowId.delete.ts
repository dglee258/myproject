import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import { workWorkflows } from "~/features/work/business-logic/schema";
import { eq, and } from "drizzle-orm";

export async function action({ request, params }: ActionFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const workflowId = parseInt(params.workflowId!);
  
  if (isNaN(workflowId)) {
    return data({ error: "Invalid workflow ID" }, { status: 400 });
  }

  try {
    // Check ownership
    const [workflow] = await db
      .select()
      .from(workWorkflows)
      .where(
        and(
          eq(workWorkflows.workflow_id, workflowId),
          eq(workWorkflows.owner_id, user.id)
        )
      )
      .limit(1);

    if (!workflow) {
      return data({ error: "Workflow not found or unauthorized" }, { status: 404 });
    }

    // Delete workflow (cascade will delete steps and members)
    await db
      .delete(workWorkflows)
      .where(eq(workWorkflows.workflow_id, workflowId));

    return data({ success: true });
  } catch (error: any) {
    console.error("Delete workflow error:", error);
    return data({ error: error.message || "Failed to delete workflow" }, { status: 500 });
  }
}
