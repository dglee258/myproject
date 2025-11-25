import { sql } from "drizzle-orm";
import {
  bigint,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { workWorkflows } from "../business-logic/schema";

// Helper functions moved inline to avoid server/client code splitting
const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull(),
};

function makeIdentityColumn(name: string) {
  return {
    [name]: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  };
}

// 팀 멤버 상태
export const teamMemberStatusEnum = pgEnum("team_member_status", [
  "active", // 활동중 (가입 완료)
  "pending", // 대기중 (초대만 됨)
  "inactive", // 비활성 (제외됨)
]);

// 팀 멤버 역할
export const teamMemberRoleEnum = pgEnum("team_member_role", [
  "owner", // 팀 소유자
  "admin", // 관리자
  "member", // 일반 멤버
]);

/**
 * 팀 테이블
 * - 최상위 엔티티
 * - 여러 워크플로우를 포함
 */
export const workTeams = pgTable("work_teams", {
  team_id: uuid("team_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  owner_id: uuid("owner_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  ...timestamps,
});

/**
 * 팀 멤버 테이블
 * - 팀에 속한 멤버 관리
 * - 상태: active(활동중), pending(대기중), inactive(제외됨)
 */
export const workTeamMembers = pgTable("work_team_members", {
  member_id: uuid("member_id").primaryKey().defaultRandom(),
  team_id: uuid("team_id")
    .notNull()
    .references(() => workTeams.team_id, { onDelete: "cascade" }),
  user_id: uuid("user_id").references(() => authUsers.id, {
    onDelete: "cascade",
  }),
  email: text("email"), // 초대된 이메일 (가입 전)
  role: teamMemberRoleEnum("role").notNull().default("member"),
  status: teamMemberStatusEnum("status").notNull().default("pending"),
  invited_by: uuid("invited_by").references(() => authUsers.id),
  invited_at: timestamp("invited_at").defaultNow().notNull(),
  joined_at: timestamp("joined_at"),
  ...timestamps,
});

/**
 * 팀 초대 토큰 테이블
 * - 이메일/링크 기반 초대
 */
export const workTeamInvites = pgTable("work_team_invites", {
  invite_id: uuid("invite_id").primaryKey().defaultRandom(),
  team_id: uuid("team_id")
    .notNull()
    .references(() => workTeams.team_id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: teamMemberRoleEnum("role").notNull().default("member"),
  token: text("token").notNull().unique(),
  invited_by: uuid("invited_by")
    .notNull()
    .references(() => authUsers.id),
  expires_at: timestamp("expires_at").notNull(),
  accepted_at: timestamp("accepted_at"),
  ...timestamps,
});

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

// NOTE: RLS 정책은 별도 마이그레이션 파일(0004_team_hierarchy.sql)에서 적용됩니다.
