/**
 * Database Queries for Business Logic (Workflows)
 * 
 * This module contains all database queries related to workflows and analysis steps.
 */

import { desc, eq, and, or, isNull, inArray } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import { workAnalysisSteps, workWorkflows } from "./schema";
import { workTeamMembers, workWorkflowShares } from "../team-management/team-schema";
import { workWorkflowMembers } from "../team-management/schema";

/**
 * Get all workflows for the current user with their steps
 * Includes workflows they own, team workflows, and shared workflows
 */
export async function getUserWorkflows(userId: string) {
  // 1. 사용자가 직접 소유한 워크플로우
  const ownedWorkflows = await db.query.workWorkflows.findMany({
    where: eq(workWorkflows.owner_id, userId),
    orderBy: desc(workWorkflows.created_at),
    with: {
      steps: true,
      sourceVideo: true,
    },
  });

  // 2. 사용자가 속한 활성 팀들 찾기
  const userTeams = await db
    .select({
      team_id: workTeamMembers.team_id,
      member_id: workTeamMembers.member_id,
    })
    .from(workTeamMembers)
    .where(
      and(
        eq(workTeamMembers.user_id, userId),
        eq(workTeamMembers.status, "active" as any),
      ),
    );

  if (userTeams.length === 0) {
    return ownedWorkflows;
  }

  const teamIds = userTeams.map(t => t.team_id);

  // 3. 팀 워크플로우 조회 (팀 전체 공유)
  const teamWorkflows = await db.query.workWorkflows.findMany({
    where: inArray(workWorkflows.team_id, teamIds),
    orderBy: desc(workWorkflows.created_at),
    with: {
      steps: true,
      sourceVideo: true,
    },
  });

  // 4. 모든 워크플로우 합치고 중복 제거
  const allWorkflows = [
    ...ownedWorkflows,
    ...teamWorkflows,
  ];

  // workflow_id로 중복 제거
  const uniqueWorkflows = allWorkflows.filter((workflow, index, self) =>
    index === self.findIndex((w) => w.workflow_id === workflow.workflow_id)
  );

  // 생성일 순으로 정렬
  return uniqueWorkflows.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Get a single workflow by ID with all its analysis steps
 * Checks if user has access to the workflow
 */
export async function getWorkflowWithSteps(workflowId: number, userId: string) {
  // 1. 워크플로우 조회
  const workflow = await db.query.workWorkflows.findFirst({
    where: eq(workWorkflows.workflow_id, workflowId),
    with: {
      steps: true,
    },
  });

  if (!workflow) {
    return null;
  }

  // 2. 접근 권한 확인
  // 2.1. 직접 소유한 워크플로우
  if (workflow.owner_id === userId) {
    return workflow;
  }

  // 2.2. 팀 워크플로우인 경우
  if (workflow.team_id) {
    // 사용자가 해당 팀의 활성 멤버인지 확인
    const [teamMember] = await db
      .select()
      .from(workTeamMembers)
      .where(
        and(
          eq(workTeamMembers.team_id, workflow.team_id),
          eq(workTeamMembers.user_id, userId),
          eq(workTeamMembers.status, "active" as any),
        ),
      )
      .limit(1);

    if (teamMember) {
      // 팀 전체 공유인지 확인
      const [shareRecord] = await db
        .select()
        .from(workWorkflowShares)
        .where(
          eq(workWorkflowShares.workflow_id, workflowId),
        )
        .limit(1);

      // 공유 레코드가 없으면 팀 전체 공유
      if (!shareRecord) {
        return workflow;
      }

      // 특정 멤버에게 공유된 경우
      if (shareRecord.team_member_id === teamMember.member_id) {
        return workflow;
      }
    }
  }

  // 3. 레거시: 개별 워크플로우 멤버인 경우
  const [legacyMember] = await db
    .select()
    .from(workWorkflowMembers)
    .where(
      and(
        eq(workWorkflowMembers.workflow_id, workflowId),
        eq(workWorkflowMembers.user_id, userId),
        eq(workWorkflowMembers.status, "active" as any),
      ),
    )
    .limit(1);

  if (legacyMember) {
    return workflow;
  }

  // 접근 권한 없음
  return null;
}

/**
 * Get all analysis steps for a workflow
 */
export async function getWorkflowSteps(workflowId: number) {
  const steps = await db
    .select()
    .from(workAnalysisSteps)
    .where(eq(workAnalysisSteps.workflow_id, workflowId))
    .orderBy(workAnalysisSteps.sequence_no);

  return steps;
}

/**
 * Update a step's notes
 */
export async function updateStepNotes(
  stepId: number,
  notes: string,
): Promise<void> {
  await db
    .update(workAnalysisSteps)
    .set({ notes })
    .where(eq(workAnalysisSteps.step_id, stepId));
}
