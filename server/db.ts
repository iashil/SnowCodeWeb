import { asc, desc, eq, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { contacts, InsertContact, InsertProject, InsertTeamMember, InsertUser, localAdmins, pageViews, projects, siteSettings, teamMembers, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function listPublishedProjects() { const db = await getDb(); if (!db) return []; return db.select().from(projects).where(eq(projects.isPublished, 1)).orderBy(asc(projects.sortOrder), desc(projects.createdAt)); }
export async function listAllProjects() { const db = await getDb(); if (!db) return []; return db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.createdAt)); }
export async function createProject(project: InsertProject) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); const result = await db.insert(projects).values(project); return { id: Number(result[0].insertId), ...project }; }
export async function updateProject(id: number, project: Partial<InsertProject>) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.update(projects).set({ ...project, updatedAt: new Date() }).where(eq(projects.id, id)); return (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0]; }
export async function deleteProject(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.delete(projects).where(eq(projects.id, id)); return { success: true } as const; }

export async function createContact(contact: InsertContact) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); const result = await db.insert(contacts).values(contact); return { id: Number(result[0].insertId), ...contact }; }
export async function purgeExpiredContacts() { const db = await getDb(); if (!db) return { success: false, deleted: 0 }; const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); const result = await db.delete(contacts).where(lt(contacts.createdAt, cutoff)); return { success: true, deleted: Number(result[0]?.affectedRows ?? 0) }; }
export async function listContacts() { const db = await getDb(); if (!db) return []; await purgeExpiredContacts().catch((error) => console.warn("[Contacts] Retention cleanup skipped:", error)); return db.select().from(contacts).orderBy(desc(contacts.createdAt)); }
export async function deleteContact(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.delete(contacts).where(eq(contacts.id, id)); return { success: true } as const; }
export async function updateContactStatus(id: number, status: "new" | "read" | "archived") { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.update(contacts).set({ status, updatedAt: new Date() }).where(eq(contacts.id, id)); return (await db.select().from(contacts).where(eq(contacts.id, id)).limit(1))[0]; }

export async function listVisibleTeam() { const db = await getDb(); if (!db) return []; return db.select().from(teamMembers).where(eq(teamMembers.isVisible, 1)).orderBy(asc(teamMembers.sortOrder), asc(teamMembers.createdAt)); }
export async function listAllTeam() { const db = await getDb(); if (!db) return []; return db.select().from(teamMembers).orderBy(asc(teamMembers.sortOrder), asc(teamMembers.createdAt)); }
export async function createTeamMember(member: InsertTeamMember) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); const result = await db.insert(teamMembers).values(member); return { id: Number(result[0].insertId), ...member }; }
export async function updateTeamMember(id: number, member: Partial<InsertTeamMember>) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.update(teamMembers).set({ ...member, updatedAt: new Date() }).where(eq(teamMembers.id, id)); return (await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1))[0]; }
export async function deleteTeamMember(id: number) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.delete(teamMembers).where(eq(teamMembers.id, id)); return { success: true } as const; }

const defaultSettings = { id: 1, primaryColor: "#1c2826", accentColor: "#8ca68f", backgroundColor: "#f5f4ee", surfaceColor: "#dbe5d6" };
export async function getSiteSettings() { const db = await getDb(); if (!db) return defaultSettings; return (await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1))[0] ?? defaultSettings; }
export async function saveSiteSettings(settings: { primaryColor: string; accentColor: string; backgroundColor: string; surfaceColor: string }) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.insert(siteSettings).values({ id: 1, ...settings }).onDuplicateKeyUpdate({ set: { ...settings, updatedAt: new Date() } }); return getSiteSettings(); }

export async function recordPageView(path: string) { const db = await getDb(); if (!db) return; await db.insert(pageViews).values({ path, viewCount: 1 }).onDuplicateKeyUpdate({ set: { viewCount: sql`${pageViews.viewCount} + 1`, updatedAt: new Date() } }); }
export async function getDashboardStats() { const db = await getDb(); if (!db) return { messages: 0, newMessages: 0, projects: 0, publishedProjects: 0, teamMembers: 0, visits: 0 };
  const [messageRows, projectRows, teamRows, viewRows] = await Promise.all([db.select().from(contacts), db.select().from(projects), db.select().from(teamMembers), db.select().from(pageViews)]);
  return { messages: messageRows.length, newMessages: messageRows.filter((item) => item.status === "new").length, projects: projectRows.length, publishedProjects: projectRows.filter((item) => item.isPublished === 1).length, teamMembers: teamRows.length, visits: viewRows.reduce((total, item) => total + item.viewCount, 0) };
}

export async function getLocalAdmin(email: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(localAdmins).where(eq(localAdmins.email, email)).limit(1))[0]; }
export async function upsertLocalAdmin(email: string, passwordHash: string) { const db = await getDb(); if (!db) throw new Error("Database is not configured"); await db.insert(localAdmins).values({ email, passwordHash }).onDuplicateKeyUpdate({ set: { passwordHash, updatedAt: new Date() } }); return getLocalAdmin(email); }
