import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, and } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import {
  workTeamInvites,
  workTeamMembers,
} from "~/features/work/team-management/team-schema";

/**
 * POST /api/teams/invites/:token/accept
 * 초대 수락 및 팀 가입
 */
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const { token } = params;
  if (!token) return data({ error: "Token required" }, { status: 400 });

  // 초대 토큰 조회
  const [invite] = await db
    .select()
    .from(workTeamInvites)
    .where(eq(workTeamInvites.token, token))
    .limit(1);

  if (!invite) {
    return data({ error: "Invalid invite token" }, { status: 404 });
  }

  // 토큰 만료 확인
  if (invite.expires_at < new Date()) {
    return data({ error: "Invite has expired" }, { status: 410 });
  }

  // 이미 수락된 초대인지 확인
  if (invite.accepted_at) {
    return data({ error: "Invite already accepted" }, { status: 409 });
  }

  // 이메일 확인 (초대된 이메일과 현재 사용자 이메일이 일치해야 함)
  if (user.email !== invite.email) {
    return data(
      {
        error: "This invite is for a different email address",
        invited_email: invite.email,
        your_email: user.email,
      },
      { status: 403 },
    );
  }

  // 이미 팀 멤버인지 확인
  const [existingMember] = await db
    .select()
    .from(workTeamMembers)
    .where(
      and(
        eq(workTeamMembers.team_id, invite.team_id),
        eq(workTeamMembers.user_id, user.id as any),
      ),
    )
    .limit(1);

  if (existingMember) {
    // 이미 멤버라면 상태를 active로 업데이트
    const [updated] = await db
      .update(workTeamMembers)
      .set({
        status: "active" as any,
        joined_at: new Date(),
      })
      .where(eq(workTeamMembers.member_id, existingMember.member_id))
      .returning();

    // 초대 수락 표시
    await db
      .update(workTeamInvites)
      .set({ accepted_at: new Date() })
      .where(eq(workTeamInvites.invite_id, invite.invite_id));

    return data({
      message: "Successfully joined the team",
      team_id: invite.team_id,
      member: updated,
    });
  }

  // pending 상태 멤버 찾기 (이메일 기반)
  const [pendingMember] = await db
    .select()
    .from(workTeamMembers)
    .where(
      and(
        eq(workTeamMembers.team_id, invite.team_id),
        eq(workTeamMembers.email, invite.email),
        eq(workTeamMembers.status, "pending" as any),
      ),
    )
    .limit(1);

  if (pendingMember) {
    // pending 멤버를 active로 전환하고 user_id 설정
    const [updated] = await db
      .update(workTeamMembers)
      .set({
        user_id: user.id as any,
        status: "active" as any,
        joined_at: new Date(),
      })
      .where(eq(workTeamMembers.member_id, pendingMember.member_id))
      .returning();

    // 초대 수락 표시
    await db
      .update(workTeamInvites)
      .set({ accepted_at: new Date() })
      .where(eq(workTeamInvites.invite_id, invite.invite_id));

    return data({
      message: "Successfully joined the team",
      team_id: invite.team_id,
      member: updated,
    });
  }

  // 멤버가 없으면 새로 생성
  const [newMember] = await db
    .insert(workTeamMembers)
    .values({
      team_id: invite.team_id,
      user_id: user.id as any,
      email: user.email || invite.email,
      role: invite.role,
      status: "active" as any,
      invited_by: invite.invited_by,
      joined_at: new Date(),
    })
    .returning();

  // 초대 수락 표시
  await db
    .update(workTeamInvites)
    .set({ accepted_at: new Date() })
    .where(eq(workTeamInvites.invite_id, invite.invite_id));

  return data({
    message: "Successfully joined the team",
    team_id: invite.team_id,
    member: newMember,
  });
}
