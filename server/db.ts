import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { contacts, InsertContact, InsertProject, InsertUser, projects, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      if (user[field] !== undefined) {
        values[field] = user[field] ?? null;
        updateSet[field] = user[field] ?? null;
      }
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    values.lastSignedIn ??= new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listPublishedProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.isPublished, 1)).orderBy(asc(projects.sortOrder), desc(projects.createdAt));
}

export async function listAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.createdAt));
}

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(projects).values(project);
  return { id: Number(result[0].insertId), ...project };
}

export async function updateProject(id: number, project: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(projects).set({ ...project, updatedAt: new Date() }).where(eq(projects.id, id));
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.delete(projects).where(eq(projects.id, id));
  return { success: true } as const;
}

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(contacts).values(contact);
  return { id: Number(result[0].insertId), ...contact };
}

export async function listContacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

export async function updateContactStatus(id: number, status: "new" | "read" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(contacts).set({ status, updatedAt: new Date() }).where(eq(contacts.id, id));
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result[0];
}
