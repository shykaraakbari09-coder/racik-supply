import { clearCookie, getToken, verifyToken } from "../lib/auth.js";
import { deleteSession } from "../lib/sessions.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const payload = verifyToken(getToken(req));
    if (payload) await deleteSession(payload.sid);
  } catch (err) {
    console.error("logout error:", err);
  }
  res.setHeader("Set-Cookie", clearCookie());
  return res.status(200).json({ ok: true });
}
