import crypto from "node:crypto";

export const COOKIE_NAME = "racik_admin";
export const ROLES = ["admin", "staff"];
export const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const ROLE_ENV = { admin: "ADMIN_PASSWORD", staff: "STAFF_PASSWORD" };

function secret() {
  const value = process.env.ADMIN_SECRET || "";
  // Weak secrets make HMAC tokens forgeable; refuse to run with them.
  return value.length >= 32 ? value : "";
}

function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

// Hash both sides first so comparison time never leaks the secret's length.
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function createToken(sid, role) {
  if (!secret()) throw new Error("ADMIN_SECRET is missing or shorter than 32 characters");
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
    if (i < 0) return;
    try {
      out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
    } catch {
      /* malformed cookie value: ignore it instead of crashing the request */
    }
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

// On Vercel the platform sets these headers itself, so clients cannot spoof them.
export function clientIp(req) {
  const raw =
    req.headers["x-vercel-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    "";
  const first = String(raw).split(",")[0].trim().slice(0, 64);
  return first || "unknown";
}

// CSRF defence in depth on top of SameSite=Strict: reject cross-origin writes.
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      return new URL(origin).host === String(req.headers.host || "");
    } catch {
      return false;
    }
  }
  const site = req.headers["sec-fetch-site"];
  return !site || site === "same-origin" || site === "none";
}
