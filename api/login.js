import { checkPassword, createToken, sessionCookie, readBody } from "../lib/auth.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { password } = readBody(req);
    if (!checkPassword(password)) {
      return res.status(401).json({ error: "Password salah" });
    }
    const token = createToken();
    res.setHeader("Set-Cookie", sessionCookie(token));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
