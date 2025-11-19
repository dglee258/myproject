import { date, integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const adminDailyStats = pgTable("admin_daily_stats", {
  id: serial("id").primaryKey(),
  stat_date: date("stat_date").notNull(),
  total_users: integer("total_users").notNull().default(0),
  new_users: integer("new_users").notNull().default(0),
  total_workflows: integer("total_workflows").notNull().default(0),
  new_workflows: integer("new_workflows").notNull().default(0),
  total_analyses: integer("total_analyses").notNull().default(0),
  new_analyses: integer("new_analyses").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: serial("id").primaryKey(),
  occurred_at: timestamp("occurred_at").defaultNow().notNull(),
  user_id: uuid("user_id"),
  event_type: text("event_type").notNull(),
  detail: text("detail"),
});
