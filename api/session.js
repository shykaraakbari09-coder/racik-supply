import { getAuth } from "../lib/sessions.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const auth = await getAuth(req);
    return res.status(200).json({ authed: !!auth, role: auth ? auth.role : null });
  } catch (err) {
    console.error("session error:", err);
    return res.status(200).json({ authed: false, role: null });
  }
}
