/**
 * Database Queries for Business Logic (Workflows)
 * 
 * This module contains all database queries related to workflows and analysis steps.
 */

import { desc, eq } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import { workAnalysisSteps, workWorkflows } from "./schema";

/**
 * Get all workflows for the current user with their steps
 * Includes workflows they own or are members of
 */
export async function getUserWorkflows(userId: string) {
  const workflows = await db.query.workWorkflows.findMany({
    where: eq(workWorkflows.owner_id, userId),
    orderBy: desc(workWorkflows.created_at),
    with: {
      steps: true,
    },
  });

  return workflows;
}

/**
 * Get a single workflow by ID with all its analysis steps
 */
export async function getWorkflowWithSteps(workflowId: number) {
  const workflow = await db.query.workWorkflows.findFirst({
    where: eq(workWorkflows.workflow_id, workflowId),
    with: {
      steps: true,
    },
  });

  return workflow;
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
