import { getSql } from "./db.js";
import { getToken, verifyToken, SESSION_TTL_MS } from "./auth.js";

export async function createSession(sid, role, ip, userAgent) {
  const sql = getSql();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await sql`
    INSERT INTO sessions (sid, role, expires_at, ip, user_agent)
    VALUES (${sid}, ${role}, ${expiresAt}, ${ip}, ${String(userAgent || "").slice(0, 300)})
  `;
  await sql`DELETE FROM sessions WHERE expires_at < now()`;
}

export async function getSession(sid) {
  const sql = getSql();
  const rows = await sql`
    SELECT sid, role, expires_at FROM sessions WHERE sid = ${sid} LIMIT 1
  `;
  const s = rows[0];
  if (!s) return null;
  if (new Date(s.expires_at).getTime() < Date.now()) return null;
  return s;
}

export async function deleteSession(sid) {
  if (!sid) return;
  const sql = getSql();
  await sql`DELETE FROM sessions WHERE sid = ${sid}`;
}

export async function getAuth(req) {
  const payload = verifyToken(getToken(req));
  if (!payload) return null;
  const session = await getSession(payload.sid);
  if (!session || session.role !== payload.role) return null;
  return { role: session.role, sid: session.sid };
}

export async function deleteExpiredSessions() {
  await getSql()`DELETE FROM sessions WHERE expires_at < now()`;
}
