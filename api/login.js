import crypto from "node:crypto";
import {
  checkPassword, createToken, sessionCookie, readBody, clientIp, sameOrigin, ROLES
} from "../lib/auth.js";
import { createSession } from "../lib/sessions.js";
import {
  countFailures, countGlobalFailures, recordFailure, clearFailures,
  MAX_FAILURES, MAX_GLOBAL_FAILURES
} from "../lib/rate-limit.js";
import { ensureSchema } from "../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: "Permintaan tidak valid." });
  try {
    await ensureSchema();
    const ip = clientIp(req);

    if (
      (await countFailures(ip)) >= MAX_FAILURES ||
      (await countGlobalFailures()) >= MAX_GLOBAL_FAILURES
    ) {
      res.setHeader("Retry-After", "900");
      return res.status(429).json({
        error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit."
      });
    }

    const { role, password } = readBody(req);
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: "Role tidak valid" });
    }
    if (typeof password !== "string" || password.length > 200 || !checkPassword(role, password)) {
      await recordFailure(ip);
      const left = MAX_FAILURES - (await countFailures(ip));
      return res.status(401).json({
        error: left > 0
          ? `Password salah. Sisa ${left} percobaan.`
          : "Terlalu banyak percobaan login. Coba lagi dalam 15 menit."
      });
    }

    await clearFailures(ip);
    const sid = crypto.randomUUID();
    await createSession(sid, role, ip, req.headers["user-agent"]);
    const { token, maxAge } = createToken(sid, role);
    res.setHeader("Set-Cookie", sessionCookie(token, maxAge));
    return res.status(200).json({ ok: true, role });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Terjadi kesalahan server." });
  }
}
