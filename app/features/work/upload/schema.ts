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

export const uploadStatus = pgEnum("upload_status", [
  "idle",
  "uploading",
  "processing",
  "completed",
  "error",
]);

export const workVideos = pgTable(
  "work_videos",
  {
    video_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    owner_id: uuid().references(() => authUsers.id, { onDelete: "cascade" }),
    title: text(),
    original_filename: text(),
    mime_type: text(),
    file_size: bigint({ mode: "number" }),
    storage_path: text(),
    preview_url: text(),
    thumbnail_url: text(),
    duration_seconds: doublePrecision(),
    status: uploadStatus().notNull().default("idle"),
    progress: integer().notNull().default(0),
    error_message: text(),
    requested_at: timestamp(),
    completed_at: timestamp(),
    ...timestamps,
  },
  (t) => [
    pgPolicy("select-work-videos", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${t.owner_id}`,
    }),
  ],
);
