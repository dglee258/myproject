import { pgEnum, pgPolicy, pgTable, text, timestamp, uuid, bigint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers, authUid, authenticatedRole } from "drizzle-orm/supabase";
import { workWorkflows } from "../business-logic/schema";
import { timestamps } from "~/core/db/helpers.server";

export const shareStatus = pgEnum("share_status", ["active", "claimed", "revoked", "expired"]);

export const workShareTokens = pgTable(
  "work_share_tokens",
  {
    token: text().primaryKey(),
    workflow_id: bigint({ mode: "number" })
      .references(() => workWorkflows.workflow_id, { onDelete: "cascade" })
      .notNull(),
    created_by: uuid().references(() => authUsers.id, { onDelete: "set null" }),
    status: shareStatus().notNull().default("active"),
    session_id: text(),
    expires_at: timestamp(),
    claimed_at: timestamp(),
    revoked_at: timestamp(),
    ...timestamps,
  },
  (t) => [
    // 읽기는 공개 Endpoints에서만 사용되며, 앱 내부에선 인증된 사용자만 접근하도록 제한
    pgPolicy("select-share-tokens", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${t.created_by}`,
    }),
  ],
);
