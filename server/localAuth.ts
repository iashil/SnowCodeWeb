import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";

export const LOCAL_ADMIN_COOKIE = "snow_local_admin";
const LOCAL_ADMIN_EMAIL = "ashil@gmail.com";
const LOCAL_ADMIN_PASSWORD_HASH = "30cd0a443ef3817886684e5e5dca5c7b:41d38f4587db1c7367d2f2103aa90ffd157e614eda8b5c6ff66cf9c1852f4424dc21f69c26d437b38796300aee509b9bc905700b25fdec9acd4f63f5aafdf5d8";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_SECRET = ENV.cookieSecret || "snow-code-local-session-fallback";

const localAdminUser: User = {
  id: 0,
  openId: "local-admin",
  name: "Ashil",
  email: LOCAL_ADMIN_EMAIL,
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(0),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function sign(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function verifyPassword(password: string) {
  const [saltHex, hashHex] = LOCAL_ADMIN_PASSWORD_HASH.split(":");
  if (!saltHex || !hashHex) return false;
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function parseCookies(request: Request) {
  const header = request.headers.cookie ?? "";
  return Object.fromEntries(header.split(";").filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return index === -1 ? [part.trim(), ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function authenticateLocalAdmin(email: string, password: string) {
  if (email.trim().toLowerCase() !== LOCAL_ADMIN_EMAIL || !verifyPassword(password)) return null;
  return localAdminUser;
}

export function createLocalAdminSession() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${LOCAL_ADMIN_EMAIL}.${expiresAt}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function getLocalAdminFromRequest(request: Request) {
  const token = parseCookies(request)[LOCAL_ADMIN_COOKIE];
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (sign(payload) !== signature) return null;
  const [email, expiry] = payload.split(".");
  if (email !== LOCAL_ADMIN_EMAIL || !expiry || Number(expiry) < Date.now()) return null;
  return localAdminUser;
}
