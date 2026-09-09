import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { User } from "../drizzle/schema";
import { getLocalAdmin, upsertLocalAdmin } from "./db";
import { ENV } from "./_core/env";

export const LOCAL_ADMIN_COOKIE = "snow_local_admin";
export const LOCAL_ADMIN_EMAIL = "Snowsteam@gmail.com";
const BOOTSTRAP_PASSWORD_HASH = "112e694aa4dc30263b7d3b05f4285cfd:f276d264b9997269429fac442d71afb46ac221328206b12d62ed445ca1b1b5181a2453a4868617b4d83086cbf690253a2f810e71625c7ed0b126c6a96d0e9a6e";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_SECRET = ENV.cookieSecret || "snow-code-local-session-fallback";

const localAdminUser: User = { id: 0, openId: "local-admin", name: "Snow Code Admin", email: LOCAL_ADMIN_EMAIL, loginMethod: "local", role: "admin", createdAt: new Date(0), updatedAt: new Date(), lastSignedIn: new Date() };

export function hashPassword(password: string) { const salt = randomBytes(16); return `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`; }
export function verifyPasswordHash(password: string, storedHash: string) { const [saltHex, hashHex] = storedHash.split(":"); if (!saltHex || !hashHex) return false; const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 64); const expected = Buffer.from(hashHex, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }

export async function authenticateLocalAdmin(identifier: string, password: string) {
  if (identifier.trim().toLowerCase() !== LOCAL_ADMIN_EMAIL.toLowerCase()) return null;
  const record = await getLocalAdmin(LOCAL_ADMIN_EMAIL);
  const storedHash = record?.passwordHash ?? BOOTSTRAP_PASSWORD_HASH;
  if (!verifyPasswordHash(password, storedHash)) return null;
  if (!record) { try { await upsertLocalAdmin(LOCAL_ADMIN_EMAIL, BOOTSTRAP_PASSWORD_HASH); } catch { /* DB may be temporarily unavailable; signed session still works. */ } }
  return localAdminUser;
}

export async function changeLocalAdminPassword(currentPassword: string, newPassword: string) {
  const record = await getLocalAdmin(LOCAL_ADMIN_EMAIL);
  const storedHash = record?.passwordHash ?? BOOTSTRAP_PASSWORD_HASH;
  if (!verifyPasswordHash(currentPassword, storedHash)) return false;
  await upsertLocalAdmin(LOCAL_ADMIN_EMAIL, hashPassword(newPassword));
  return true;
}

function sign(payload: string) { return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url"); }
function parseCookies(request: Request) { const header = request.headers.cookie ?? ""; return Object.fromEntries(header.split(";").filter(Boolean).map((part) => { const index = part.indexOf("="); return index === -1 ? [part.trim(), ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))]; })); }
export function createLocalAdminSession() { const expiresAt = Date.now() + SESSION_TTL_MS; const payload = `${LOCAL_ADMIN_EMAIL}.${expiresAt}`; return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`; }
export function getLocalAdminFromRequest(request: Request) { const token = parseCookies(request)[LOCAL_ADMIN_COOKIE]; if (!token) return null; const [encodedPayload, signature] = token.split("."); if (!encodedPayload || !signature) return null; let payload: string; try { payload = Buffer.from(encodedPayload, "base64url").toString("utf8"); } catch { return null; } if (sign(payload) !== signature) return null; const [email, expiry] = payload.split("."); if (email !== LOCAL_ADMIN_EMAIL || !expiry || Number(expiry) < Date.now()) return null; return localAdminUser; }
