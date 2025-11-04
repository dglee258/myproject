import { sql } from "drizzle-orm";
import {
  bigint,
  doublePrecision,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";
import { workVideos } from "../upload/schema";

export const stepType = pgEnum("step_type", [
  "click",
  "input",
  "navigate",
  "wait",
  "decision",
]);

export const workflowStatus = pgEnum("workflow_status", [
  "analyzed",
  "analyzing",
  "pending",
]);

export const workWorkflows = pgTable(
  "work_workflows",
  {
    workflow_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    owner_id: uuid().references(() => authUsers.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text(),
    source_video_id: bigint({ mode: "number" }).references(
      () => workVideos.video_id,
      { onDelete: "set null" },
    ),
    duration_seconds: doublePrecision(),
    thumbnail_url: text(),
    status: workflowStatus().notNull().default("analyzing"),
    requested_at: timestamp(),
    completed_at: timestamp(),
    ...timestamps,
  },
  (t) => [
    pgPolicy("select-workflows", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        ${authUid} = ${t.owner_id}
        OR EXISTS (
          SELECT 1 FROM work_workflow_members m
          WHERE m.workflow_id = ${t.workflow_id}
            AND m.user_id = ${authUid}
            AND m.status = 'active'
        )
      `,
    }),
  ],
);

export const workAnalysisSteps = pgTable(
  "work_analysis_steps",
  {
    step_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    workflow_id: bigint({ mode: "number" })
      .references(() => workWorkflows.workflow_id, { onDelete: "cascade" })
      .notNull(),
    sequence_no: integer().notNull(),
    type: stepType().notNull(),
    action: text().notNull(),
    description: text().notNull(),
    timestamp_label: text(),
    timestamp_seconds: doublePrecision(),
    confidence: integer(),
    notes: text(),
    ...timestamps,
  },
  (t) => [
    pgPolicy("select-steps", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        EXISTS (
          SELECT 1 FROM work_workflows w
          WHERE w.workflow_id = ${t.workflow_id}
            AND (
              ${authUid} = w.owner_id
              OR EXISTS (
                SELECT 1 FROM work_workflow_members m
                WHERE m.workflow_id = w.workflow_id
                  AND m.user_id = ${authUid}
                  AND m.status = 'active'
              )
            )
        )
      `,
    }),
  ],
);
