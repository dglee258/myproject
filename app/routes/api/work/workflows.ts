import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { desc, eq } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import { workWorkflows } from "../../../features/work/business-logic/schema";

/**
 * GET /api/work/workflows
 * 사용자의 모든 워크플로우 목록 조회 (개인 + 팀 모두)
 * 다른 팀에 공유하기 위해 복사할 수 있도록 모든 워크플로우 반환
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[API /api/work/workflows] User ID:", user.id);
    
    // 사용자가 만든 모든 워크플로우 조회 (팀 소속 여부 무관)
    const allWorkflows = await db.query.workWorkflows.findMany({
      where: eq(workWorkflows.owner_id, user.id),
      orderBy: desc(workWorkflows.created_at),
      with: {
        steps: true,
        sourceVideo: true,
      },
    });

    console.log("[API /api/work/workflows] Total workflows count:", allWorkflows.length);
    console.log("[API /api/work/workflows] Workflows:", allWorkflows.map(w => ({ 
      id: w.workflow_id, 
      title: w.title, 
      team_id: w.team_id,
      team_id_type: typeof w.team_id,
      is_shared: w.team_id !== null && w.team_id !== "",
      status: w.team_id !== null && w.team_id !== "" ? 'shared' : 'personal'
    })));
    
    return data({ workflows: allWorkflows });
  } catch (error) {
    console.error("[API /api/work/workflows] Error:", error);
    return data({ error: "Failed to load workflows", workflows: [] }, { status: 500 });
  }
}
