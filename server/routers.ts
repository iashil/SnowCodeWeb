import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createContact, createProject, deleteProject, listAllProjects, listContacts, listPublishedProjects, updateContactStatus, updateProject } from "./db";
import { storagePut } from "./storage";
import { authenticateLocalAdmin, createLocalAdminSession, LOCAL_ADMIN_COOKIE } from "./localAuth";
import type { InsertProject } from "../drizzle/schema";

const projectInput = z.object({
  title: z.string().min(2).max(180),
  eyebrow: z.string().min(2).max(180),
  description: z.string().min(10),
  previewUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().max(700).optional(),
  imageKey: z.string().max(700).optional(),
  tags: z.array(z.string().min(1).max(40)).max(8).default([]),
  color: z.string().max(32).default("mint"),
  glyph: z.string().max(16).default("✦"),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

const toProjectRow = (input: z.infer<typeof projectInput>): InsertProject => ({
  title: input.title,
  eyebrow: input.eyebrow,
  description: input.description,
  previewUrl: input.previewUrl || null,
  imageUrl: input.imageUrl || null,
  imageKey: input.imageKey || null,
  tags: input.tags.join(","),
  color: input.color,
  glyph: input.glyph,
  sortOrder: input.sortOrder,
  isPublished: input.isPublished ? 1 : 0,
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1).max(200) })).mutation(({ input, ctx }) => {
      const user = authenticateLocalAdmin(input.email, input.password);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin email or password" });
      ctx.res.cookie(LOCAL_ADMIN_COOKIE, createLocalAdminSession(), { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 7 });
      return { success: true, user } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(LOCAL_ADMIN_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  projects: router({
    list: publicProcedure.query(async () => {
      const rows = await listPublishedProjects();
      return rows.map((row) => ({ ...row, tags: row.tags ? row.tags.split(",").filter(Boolean) : [], isPublished: Boolean(row.isPublished) }));
    }),
    adminList: adminProcedure.query(async () => {
      const rows = await listAllProjects();
      return rows.map((row) => ({ ...row, tags: row.tags ? row.tags.split(",").filter(Boolean) : [], isPublished: Boolean(row.isPublished) }));
    }),
    create: adminProcedure.input(projectInput).mutation(async ({ input }) => {
      const row = await createProject(toProjectRow(input));
      return { ...row, tags: input.tags, isPublished: input.isPublished };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: projectInput.partial() })).mutation(async ({ input }) => {
      const data: Partial<InsertProject> = {};
      if (input.data.title !== undefined) data.title = input.data.title;
      if (input.data.eyebrow !== undefined) data.eyebrow = input.data.eyebrow;
      if (input.data.description !== undefined) data.description = input.data.description;
      if (input.data.previewUrl !== undefined) data.previewUrl = input.data.previewUrl || null;
      if (input.data.imageUrl !== undefined) data.imageUrl = input.data.imageUrl || null;
      if (input.data.imageKey !== undefined) data.imageKey = input.data.imageKey || null;
      if (input.data.tags !== undefined) data.tags = input.data.tags.join(",");
      if (input.data.color !== undefined) data.color = input.data.color;
      if (input.data.glyph !== undefined) data.glyph = input.data.glyph;
      if (input.data.sortOrder !== undefined) data.sortOrder = input.data.sortOrder;
      if (input.data.isPublished !== undefined) data.isPublished = input.data.isPublished ? 1 : 0;
      const row = await updateProject(input.id, data);
      if (!row) throw new Error("Project not found");
      return { ...row, tags: row.tags ? row.tags.split(",").filter(Boolean) : [], isPublished: Boolean(row.isPublished) };
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteProject(input.id)),
    uploadImage: adminProcedure.input(z.object({ filename: z.string().min(1).max(180), contentType: z.string().regex(/^image\//), data: z.string().max(12_000_000) })).mutation(async ({ input }) => {
      const rawData = input.data.includes(",") ? input.data.slice(input.data.indexOf(",") + 1) : input.data;
      const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
      const buffer = Buffer.from(rawData, "base64");
      return storagePut(`projects/${Date.now()}-${safeFilename}`, buffer, input.contentType);
    }),
  }),
  contacts: router({
    create: publicProcedure.input(z.object({ name: z.string().min(2).max(180), email: z.string().email().max(320), message: z.string().min(10).max(5000) })).mutation(({ input }) => createContact(input)),
    list: adminProcedure.query(listContacts),
    setStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "read", "archived"]) })).mutation(({ input }) => updateContactStatus(input.id, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
