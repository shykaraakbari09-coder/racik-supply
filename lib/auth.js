import crypto from "node:crypto";

export const COOKIE_NAME = "racik_admin";
export const ROLES = ["admin", "staff"];
export const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const ROLE_ENV = { admin: "ADMIN_PASSWORD", staff: "STAFF_PASSWORD" };

function secret() {
  return process.env.ADMIN_SECRET || "";
}

function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function createToken(sid, role) {
  if (!secret()) throw new Error("ADMIN_SECRET is not configured");
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sid, role, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, maxAge };
}

export function verifyToken(token) {
  if (!token || !secret()) return null;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || Date.now() >= data.exp) return null;
    if (typeof data.sid !== "string" || !ROLES.includes(data.role)) return null;
    return data;
  } catch {
    return null;
  }
}

export function checkPassword(role, input) {
  const env = ROLE_ENV[role];
  if (!env) return false;
  const expected = process.env[env];
  if (!expected) throw new Error(`${env} is not configured`);
  return safeEqual(input || "", expected);
}

export function parseCookies(header) {
  const out = {};
  (header || "").split(";").forEach((pair) => {
    const i = pair.indexOf("=");
    if (i > -1) out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
  });
  return out;
}

export function getToken(req) {
  return parseCookies(req.headers.cookie)[COOKIE_NAME];
}

export function sessionCookie(token, maxAge) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict; Secure`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`;
}

export function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export function clientIp(req) {
  const raw = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "";
  const first = String(raw).split(",")[0].trim();
  return first || "unknown";
}
