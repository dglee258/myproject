import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const featureFlags = pgTable("feature_flags", {
  flag_id: serial("flag_id").primaryKey(),
  feature_key: varchar("feature_key", { length: 100 }).notNull().unique(),
  feature_name: varchar("feature_name", { length: 255 }).notNull(),
  description: text("description"),
  is_enabled: boolean("is_enabled").default(false),
  disabled_message: varchar("disabled_message", { length: 255 }).default(
    "추후 공개 예정",
  ),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
