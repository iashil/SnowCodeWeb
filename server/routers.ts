import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createContact, createProject, createTeamMember, deleteContact, deleteProject, deleteTeamMember, getDashboardStats, getSiteSettings, listAllProjects, listAllTeam, listContacts, listPublishedProjects, listVisibleTeam, recordPageView, saveSiteSettings, updateContactStatus, updateProject, updateTeamMember } from "./db";
import { authenticateLocalAdmin, changeLocalAdminPassword, createLocalAdminSession, LOCAL_ADMIN_COOKIE } from "./localAuth";
import { storagePut } from "./storage";
import type { InsertProject, InsertTeamMember } from "../drizzle/schema";

const optionalUrl = z.string().url().max(700).optional().or(z.literal(""));
const projectInput = z.object({ title: z.string().min(2).max(180), eyebrow: z.string().min(2).max(180), description: z.string().min(10), previewUrl: optionalUrl, imageUrl: z.string().max(700).optional(), imageKey: z.string().max(700).optional(), tags: z.array(z.string().min(1).max(40)).max(8).default([]), color: z.string().max(32).default("mint"), glyph: z.string().max(16).default("✦"), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });
const teamInput = z.object({ name: z.string().min(2).max(160), role: z.string().min(2).max(180), avatarUrl: optionalUrl, instagramUrl: optionalUrl, whatsappUrl: optionalUrl, githubUrl: optionalUrl, linkedinUrl: optionalUrl, sortOrder: z.number().int().min(0).default(0), isVisible: z.boolean().default(true) });
const settingsInput = z.object({ primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), surfaceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
const toProjectRow = (input: z.infer<typeof projectInput>): InsertProject => ({ title: input.title, eyebrow: input.eyebrow, description: input.description, previewUrl: input.previewUrl || null, imageUrl: input.imageUrl || null, imageKey: input.imageKey || null, tags: input.tags.join(","), color: input.color, glyph: input.glyph, sortOrder: input.sortOrder, isPublished: input.isPublished ? 1 : 0 });
const toTeamRow = (input: z.infer<typeof teamInput>): InsertTeamMember => ({ name: input.name, role: input.role, avatarUrl: input.avatarUrl || null, instagramUrl: input.instagramUrl || null, whatsappUrl: input.whatsappUrl || null, githubUrl: input.githubUrl || null, linkedinUrl: input.linkedinUrl || null, sortOrder: input.sortOrder, isVisible: input.isVisible ? 1 : 0 });
const publicProject = (row: any) => ({ ...row, tags: row.tags ? row.tags.split(",").filter(Boolean) : [], isPublished: Boolean(row.isPublished) });
const publicTeam = (row: any) => ({ ...row, isVisible: Boolean(row.isVisible) });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure.input(z.object({ email: z.string().min(3).max(320), password: z.string().min(1).max(200), rememberMe: z.boolean().default(false) })).mutation(async ({ input, ctx }) => { const user = await authenticateLocalAdmin(input.email, input.password); if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin credentials" }); const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.cookie(LOCAL_ADMIN_COOKIE, createLocalAdminSession(input.rememberMe), { ...cookieOptions, ...(input.rememberMe ? { maxAge: 1000 * 60 * 60 * 24 * 30 } : {}) }); return { success: true, user } as const; }),
    changePassword: adminProcedure.input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(200) })).mutation(async ({ input }) => { const changed = await changeLocalAdminPassword(input.currentPassword, input.newPassword); if (!changed) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" }); return { success: true } as const; }),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); ctx.res.clearCookie(LOCAL_ADMIN_COOKIE, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  site: router({
    settings: publicProcedure.query(getSiteSettings),
    team: publicProcedure.query(async () => (await listVisibleTeam()).map(publicTeam)),
    trackVisit: publicProcedure.input(z.object({ path: z.string().min(1).max(180).default("/") })).mutation(({ input }) => recordPageView(input.path)),
    stats: adminProcedure.query(getDashboardStats),
    saveSettings: adminProcedure.input(settingsInput).mutation(({ input }) => saveSiteSettings(input)),
  }),
  projects: router({
    list: publicProcedure.query(async () => (await listPublishedProjects()).map(publicProject)),
    adminList: adminProcedure.query(async () => (await listAllProjects()).map(publicProject)),
    create: adminProcedure.input(projectInput).mutation(async ({ input }) => { const row = await createProject(toProjectRow(input)); return { ...row, tags: input.tags, isPublished: input.isPublished }; }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: projectInput.partial() })).mutation(async ({ input }) => { const data: Partial<InsertProject> = {}; if (input.data.title !== undefined) data.title = input.data.title; if (input.data.eyebrow !== undefined) data.eyebrow = input.data.eyebrow; if (input.data.description !== undefined) data.description = input.data.description; if (input.data.previewUrl !== undefined) data.previewUrl = input.data.previewUrl || null; if (input.data.imageUrl !== undefined) data.imageUrl = input.data.imageUrl || null; if (input.data.imageKey !== undefined) data.imageKey = input.data.imageKey || null; if (input.data.tags !== undefined) data.tags = input.data.tags.join(","); if (input.data.color !== undefined) data.color = input.data.color; if (input.data.glyph !== undefined) data.glyph = input.data.glyph; if (input.data.sortOrder !== undefined) data.sortOrder = input.data.sortOrder; if (input.data.isPublished !== undefined) data.isPublished = input.data.isPublished ? 1 : 0; const row = await updateProject(input.id, data); if (!row) throw new Error("Project not found"); return publicProject(row); }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteProject(input.id)),
    uploadImage: adminProcedure.input(z.object({ filename: z.string().min(1).max(180), contentType: z.string().regex(/^image\//), data: z.string().max(12_000_000) })).mutation(async ({ input }) => { const rawData = input.data.includes(",") ? input.data.slice(input.data.indexOf(",") + 1) : input.data; const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-"); return storagePut(`projects/${Date.now()}-${safeFilename}`, Buffer.from(rawData, "base64"), input.contentType); }),
  }),
  contacts: router({ create: publicProcedure.input(z.object({ name: z.string().min(2).max(180), email: z.string().email().max(320), message: z.string().min(10).max(5000) })).mutation(({ input }) => createContact(input)), list: adminProcedure.query(listContacts), setStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "read", "archived"]) })).mutation(({ input }) => updateContactStatus(input.id, input.status)), remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteContact(input.id)) }),
  team: router({
    adminList: adminProcedure.query(async () => (await listAllTeam()).map(publicTeam)),
    create: adminProcedure.input(teamInput).mutation(({ input }) => createTeamMember(toTeamRow(input))),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: teamInput.partial() })).mutation(({ input }) => { const data: Partial<InsertTeamMember> = {}; for (const field of ["name", "role", "avatarUrl", "instagramUrl", "whatsappUrl", "githubUrl", "linkedinUrl", "sortOrder"] as const) if (input.data[field] !== undefined) data[field] = input.data[field] as never; if (input.data.isVisible !== undefined) data.isVisible = input.data.isVisible ? 1 : 0; return updateTeamMember(input.id, data); }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteTeamMember(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
