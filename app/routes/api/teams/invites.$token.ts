import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import {
  workTeamInvites,
  workTeams,
} from "~/features/work/team-management/team-schema";

/**
 * GET /api/teams/invites/:token
 * 초대 정보 조회 (로그인 전에도 볼 수 있어야 함)
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { token } = params;
  if (!token) return data({ error: "Token required" }, { status: 400 });

  // 초대 토큰 조회
  const [invite] = await db
    .select({
      invite_id: workTeamInvites.invite_id,
      team_id: workTeamInvites.team_id,
      email: workTeamInvites.email,
      role: workTeamInvites.role,
      expires_at: workTeamInvites.expires_at,
      accepted_at: workTeamInvites.accepted_at,
      created_at: workTeamInvites.created_at,
    })
    .from(workTeamInvites)
    .where(eq(workTeamInvites.token, token))
    .limit(1);

  if (!invite) {
    return data({ error: "Invalid invite token" }, { status: 404 });
  }

  // 팀 정보 조회
  const [team] = await db
    .select({
      team_id: workTeams.team_id,
      name: workTeams.name,
      description: workTeams.description,
    })
    .from(workTeams)
    .where(eq(workTeams.team_id, invite.team_id))
    .limit(1);

  if (!team) {
    return data({ error: "Team not found" }, { status: 404 });
  }

  // 토큰 만료 여부
  const isExpired = invite.expires_at < new Date();
  const isAccepted = !!invite.accepted_at;

  return data({
    team,
    invite: {
      email: invite.email,
      role: invite.role,
      expires_at: invite.expires_at,
      is_expired: isExpired,
      is_accepted: isAccepted,
    },
  });
}
