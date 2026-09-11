import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  eyebrow: varchar("eyebrow", { length: 180 }).notNull(),
  description: text("description").notNull(),
  previewUrl: varchar("previewUrl", { length: 700 }),
  imageUrl: varchar("imageUrl", { length: 700 }),
  imageKey: varchar("imageKey", { length: 700 }),
  tags: text("tags").notNull(),
  color: varchar("color", { length: 32 }).notNull().default("mint"),
  glyph: varchar("glyph", { length: 16 }).notNull().default("✦"),
  sortOrder: int("sortOrder").notNull().default(0),
  isPublished: int("isPublished").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "archived"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  role: varchar("role", { length: 180 }).notNull(),
  avatarUrl: varchar("avatarUrl", { length: 700 }),
  instagramUrl: varchar("instagramUrl", { length: 700 }),
  whatsappUrl: varchar("whatsappUrl", { length: 700 }),
  githubUrl: varchar("githubUrl", { length: 700 }),
  linkedinUrl: varchar("linkedinUrl", { length: 700 }),
  sortOrder: int("sortOrder").notNull().default(0),
  isVisible: int("isVisible").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  primaryColor: varchar("primaryColor", { length: 32 }).notNull().default("#1c2826"),
  accentColor: varchar("accentColor", { length: 32 }).notNull().default("#8ca68f"),
  backgroundColor: varchar("backgroundColor", { length: 32 }).notNull().default("#f5f4ee"),
  surfaceColor: varchar("surfaceColor", { length: 32 }).notNull().default("#dbe5d6"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  path: varchar("path", { length: 180 }).notNull().unique(),
  viewCount: int("viewCount").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const localAdmins = mysqlTable("local_admins", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 220 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;
export type PageView = typeof pageViews.$inferSelect;
export type LocalAdmin = typeof localAdmins.$inferSelect;
