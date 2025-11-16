import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, desc, and, or, exists } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import { workTeams, workTeamMembers } from "~/features/work/team-management/team-schema";

/**
 * GET /api/teams
 * 현재 사용자가 속한 팀 목록 조회 (소유 or 멤버)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  // 소유한 팀 + 멤버로 속한 팀 (active 상태만)
  const teams = await db
    .select({
      team_id: workTeams.team_id,
      name: workTeams.name,
      description: workTeams.description,
      owner_id: workTeams.owner_id,
      created_at: workTeams.created_at,
    })
    .from(workTeams)
    .where(
      or(
        eq(workTeams.owner_id, user.id as any),
        exists(
          db
            .select()
            .from(workTeamMembers)
            .where(
              and(
                eq(workTeamMembers.team_id, workTeams.team_id),
                eq(workTeamMembers.user_id, user.id as any),
                eq(workTeamMembers.status, "active" as any),
              ),
            ),
        ),
      ),
    )
    .orderBy(desc(workTeams.created_at));

  return data({ teams });
}

/**
 * POST /api/teams
 * 새 팀 생성 (현재 사용자가 owner)
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== "string") {
    return data({ error: "Team name is required" }, { status: 400 });
  }

  // 팀 생성
  const [team] = await db
    .insert(workTeams)
    .values({
      name,
      description: description || null,
      owner_id: user.id as any,
    })
    .returning();

  // 팀 owner를 팀 멤버에 추가 (owner role, active status)
  await db.insert(workTeamMembers).values({
    team_id: team.team_id,
    user_id: user.id as any,
    email: user.email || null,
    role: "owner" as any,
    status: "active" as any,
    invited_by: user.id as any,
    joined_at: new Date(),
  });

  return data({ team }, { status: 201 });
}
