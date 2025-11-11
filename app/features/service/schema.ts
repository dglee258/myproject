import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const serviceSections = pgTable("service_sections", {
  section_id: serial("section_id").primaryKey(),
  section_key: varchar("section_key", { length: 100 }).notNull().unique(),
  title: text("title"),
  subtitle: text("subtitle"),
  description: text("description"),
  badge_text: varchar("badge_text", { length: 100 }),
  is_active: boolean("is_active").default(true),
  display_order: integer("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const serviceItems = pgTable("service_items", {
  item_id: serial("item_id").primaryKey(),
  section_key: varchar("section_key", { length: 100 }).notNull(),
  item_type: varchar("item_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  display_order: integer("display_order").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});
