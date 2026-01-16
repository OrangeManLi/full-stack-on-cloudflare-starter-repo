import { sqliteTable, text, numeric } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const linksTable = sqliteTable("links", {
  linkId: text("link_id").primaryKey(),
  accountId: text("account_id").notNull(),
  name: text("name").notNull(),
  destinations: text("destinations", { mode: "json" }).notNull().$type<{
    default: string;
    [countryCode: string]: string;
  }>(),
  createdAt: numeric("created").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: numeric("updated").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Link = typeof linksTable.$inferSelect;
export type NewLink = typeof linksTable.$inferInsert;
