import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, and } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import {
  workTeams,
  workTeamMembers,
} from "~/features/work/team-management/team-schema";

/**
 * 사용자가 팀의 owner/admin인지 확인
 */
async function checkAdminPermission(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const [team] = await db
    .select()
    .from(workTeams)
    .where(eq(workTeams.team_id, teamId as any))
    .limit(1);

  if (!team) return false;
  if (team.owner_id === userId) return true;

  const [member] = await db
    .select()
    .from(workTeamMembers)
    .where(
      and(
        eq(workTeamMembers.team_id, teamId as any),
        eq(workTeamMembers.user_id, userId as any),
        eq(workTeamMembers.status, "active" as any),
      ),
    )
    .limit(1);

  return member?.role === "admin" || member?.role === "owner";
}

/**
 * PATCH /api/teams/:teamId/members/:memberId
 * 팀원 정보 수정 (역할, 상태 변경)
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const { teamId, memberId } = params;
  if (!teamId || !memberId) {
    return data({ error: "Team ID and Member ID required" }, { status: 400 });
  }

  // Admin 권한 확인
  const isAdmin = await checkAdminPermission(teamId, user.id);
  if (!isAdmin) {
    return data({ error: "Admin permission required" }, { status: 403 });
  }

  if (request.method === "PATCH") {
    // 멤버 정보 수정
    const body = await request.json();
    const { role, status } = body;

    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return data({ error: "No updates provided" }, { status: 400 });
    }

    const [updated] = await db
      .update(workTeamMembers)
      .set(updates)
      .where(
        and(
          eq(workTeamMembers.team_id, teamId as any),
          eq(workTeamMembers.member_id, memberId as any),
        ),
      )
      .returning();

    if (!updated) {
      return data({ error: "Member not found" }, { status: 404 });
    }

    return data({ member: updated });
  }

  if (request.method === "DELETE") {
    // 멤버 제외 (inactive 상태로 변경 or 삭제)
    const [deleted] = await db
      .update(workTeamMembers)
      .set({ status: "inactive" as any })
      .where(
        and(
          eq(workTeamMembers.team_id, teamId as any),
          eq(workTeamMembers.member_id, memberId as any),
        ),
      )
      .returning();

    if (!deleted) {
      return data({ error: "Member not found" }, { status: 404 });
    }

    return data({ success: true });
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}
