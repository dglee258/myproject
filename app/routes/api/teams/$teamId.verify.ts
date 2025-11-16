import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { eq, and, or, isNull } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import db from "~/core/db/drizzle-client.server";
import { workTeams, workTeamMembers, workWorkflowShares } from "~/features/work/team-management/team-schema";
import { workWorkflows } from "~/features/work/business-logic/schema";

/**
 * GET /api/teams/:teamId/verify
 * 팀 워크플로우 접근 권한 검증 API
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401 });

  const { teamId } = params;
  if (!teamId) return data({ error: "Team ID required" }, { status: 400 });

  // 팀 관리자 권한 확인
  const [team] = await db
    .select()
    .from(workTeams)
    .where(eq(workTeams.team_id, teamId as any))
    .limit(1);

  if (!team) return data({ error: "Team not found" }, { status: 404 });

  const isOwner = team.owner_id === user.id;
  const [myMembership] = await db
    .select()
    .from(workTeamMembers)
    .where(
      and(
        eq(workTeamMembers.team_id, teamId as any),
        eq(workTeamMembers.user_id, user.id as any),
        eq(workTeamMembers.status, "active" as any),
      ),
    )
    .limit(1);

  const isAdmin = isOwner || myMembership?.role === "admin";
  if (!isAdmin) {
    return data({ error: "Admin permission required" }, { status: 403 });
  }

  try {
    // 1. 팀의 모든 활성 멤버 조회
    const activeMembers = await db
      .select()
      .from(workTeamMembers)
      .where(
        and(
          eq(workTeamMembers.team_id, teamId as any),
          eq(workTeamMembers.status, "active" as any),
        ),
      );

    // 2. 팀의 모든 워크플로우 조회
    const teamWorkflows = await db
      .select()
      .from(workWorkflows)
      .where(eq(workWorkflows.team_id, teamId as any));

    // 3. 워크플로우 공유 설정 조회
    const workflowShares = await db
      .select()
      .from(workWorkflowShares)
      .where(
        eq(workWorkflowShares.workflow_id, teamWorkflows[0]?.workflow_id || -1),
      );

    // 4. 각 멤버별 접근 가능한 워크플로우 수 계산
    const memberAccess = await Promise.all(
      activeMembers.map(async (member) => {
        // 팀 소유자/워크플로우 소유자는 모든 워크플로우 접근 가능
        if (member.user_id === team.owner_id) {
          return {
            member_id: member.member_id,
            email: member.email,
            role: member.role,
            accessible_workflows: teamWorkflows.length,
            total_workflows: teamWorkflows.length,
            issues: [],
          };
        }

        // 다른 멤버들의 접근 권한 확인
        const accessibleCount = await db
          .select({ count: workWorkflows.workflow_id })
          .from(workWorkflows)
          .where(
            or(
              // 팀 전체 공유된 워크플로우
              and(
                eq(workWorkflows.team_id, teamId as any),
                isNull(workWorkflowShares.team_member_id),
              ),
              // 특정 멤버에게 공유된 워크플로우
              and(
                eq(workWorkflows.team_id, teamId as any),
                eq(workWorkflowShares.team_member_id, member.member_id),
              ),
            ),
          )
          .leftJoin(
            workWorkflowShares,
            eq(workWorkflows.workflow_id, workWorkflowShares.workflow_id),
          );

        const issues = [];
        if (accessibleCount.length < teamWorkflows.length) {
          issues.push("일부 워크플로우에 접근할 수 없음");
        }

        return {
          member_id: member.member_id,
          email: member.email,
          role: member.role,
          accessible_workflows: accessibleCount.length,
          total_workflows: teamWorkflows.length,
          issues,
        };
      }),
    );

    // 5. 전체 검증 결과
    const allIssues = memberAccess.flatMap(m => m.issues);
    const hasIssues = allIssues.length > 0;

    return data({
      verified: !hasIssues,
      summary: {
        total_members: activeMembers.length,
        total_workflows: teamWorkflows.length,
        members_with_issues: memberAccess.filter(m => m.issues.length > 0).length,
      },
      members: memberAccess,
      recommendations: hasIssues ? [
        "워크플로우 이관 기능을 사용하여 미분류 워크플로우를 팀에 연결하세요",
        "워크플로우 공유 설정을 확인하여 모든 팀원이 접근할 수 있도록 하세요",
        "팀원 상태를 확인하여 모두 '활동 중'인지 확인하세요",
      ] : [
        "모든 팀원이 워크플로우에 정상적으로 접근할 수 있습니다",
      ],
    });
  } catch (error) {
    console.error("[Team] Verification failed", error);
    return data({ error: "검증에 실패했습니다" }, { status: 500 });
  }
}
