import {
  bigint,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { workWorkflows } from "../business-logic/schema";
import { workTeamMembers } from "./team-schema";

// Helper functions moved inline to avoid server/client code splitting
const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull(),
};

/**
 * 워크플로우 공유 테이블
 * - 팀 내 워크플로우를 특정 멤버에게만 공유
 * - 레코드가 없으면 팀 전체 공유, 있으면 특정 멤버만 접근
 */
export const workWorkflowShares = pgTable("work_workflow_shares", {
  share_id: uuid("share_id").primaryKey().defaultRandom(),
  workflow_id: bigint({ mode: "number" })
    .notNull()
    .references(() => workWorkflows.workflow_id, { onDelete: "cascade" }),
  team_member_id: uuid("team_member_id")
    .notNull()
    .references(() => workTeamMembers.member_id, { onDelete: "cascade" }),
  shared_by: uuid("shared_by")
    .notNull()
    .references(() => authUsers.id),
  ...timestamps,
});
