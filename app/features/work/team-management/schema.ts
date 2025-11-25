import { sql } from "drizzle-orm";
import {
  bigint,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

export const memberRole = pgEnum("member_role", ["admin", "member"]);
export const memberStatus = pgEnum("member_status", [
  "active",
  "pending",
  "inactive",
]);
export const inviteStatus = pgEnum("invite_status", [
  "sent",
  "accepted",
  "expired",
  "revoked",
]);

export const workWorkflowMembers = pgTable(
  "work_workflow_members",
  {
    ...makeIdentityColumn("workflow_member_id"),
    workflow_id: bigint({ mode: "number" })
      .references(() => workWorkflows.workflow_id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid()
      .references(() => authUsers.id, { onDelete: "cascade" })
      .notNull(),
    role: memberRole().notNull().default("member"),
    status: memberStatus().notNull().default("pending"),
    joined_at: timestamp().defaultNow().notNull(),
    member_email_snapshot: text(),
    member_name_snapshot: text(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("ux_workflow_user").on(t.workflow_id, t.user_id),
    pgPolicy("select-members", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`
        EXISTS (
          SELECT 1 FROM work_workflow_members my_membership
          WHERE my_membership.workflow_id = ${t.workflow_id}
            AND my_membership.user_id = ${authUid}
            AND my_membership.status = 'active'
        )
      `,
    }),
  ],
);

export const workWorkflowInvites = pgTable(
  "work_workflow_invites",
  {
    ...makeIdentityColumn("invite_id"),
    workflow_id: bigint({ mode: "number" })
      .references(() => workWorkflows.workflow_id, { onDelete: "cascade" })
      .notNull(),
    email: text().notNull(),
    role: memberRole().notNull().default("member"),
    status: inviteStatus().notNull().default("sent"),
    token: text().notNull(),
    invited_by: uuid().references(() => authUsers.id, { onDelete: "set null" }),
    expires_at: timestamp(),
    accepted_by: uuid().references(() => authUsers.id, {
      onDelete: "set null",
    }),
    accepted_at: timestamp(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("ux_invite_token").on(t.token),
    pgPolicy("select-invites", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${t.invited_by}`,
    }),
  ],
);
