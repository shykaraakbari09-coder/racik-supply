import { clearCookie, getToken, verifyToken, sameOrigin } from "../lib/auth.js";
import { deleteSession } from "../lib/sessions.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: "Permintaan tidak valid." });
  try {
    const payload = verifyToken(getToken(req));
    if (payload) await deleteSession(payload.sid);
  } catch (err) {
    console.error("logout error:", err);
  }
  res.setHeader("Set-Cookie", clearCookie());
  return res.status(200).json({ ok: true });
}
