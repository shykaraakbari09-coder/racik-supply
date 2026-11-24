import test from "node:test";
import assert from "node:assert/strict";

process.env.ADMIN_SECRET = "x".repeat(40);
process.env.ADMIN_PASSWORD = "admin-pass";
process.env.STAFF_PASSWORD = "staff-pass";
process.env.DATABASE_URL = "postgres://user:pass@localhost/db"; // never connected in these tests

const auth = await import("../lib/auth.js");
const { sanitize, safeImage } = await import("../lib/db.js");

const makeRes = () => {
  const res = { headers: {}, statusCode: 200, body: null };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};

test("every API handler loads (catches bad imports/exports)", async () => {
  for (const name of ["login", "logout", "session", "products"]) {
    const mod = await import(`../api/${name}.js`);
    assert.equal(typeof mod.default, "function", name);
  }
});

test("token round-trip, tampering and expiry", () => {
  const { token } = auth.createToken("sid-1", "admin");
  assert.equal(auth.verifyToken(token).role, "admin");
  assert.equal(auth.verifyToken(token.slice(0, -2) + "xx"), null);
  const [payload, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ sid: "sid-1", role: "admin", exp: Date.now() + 1e9 })).toString("base64url");
  assert.equal(auth.verifyToken(`${forged}.${sig}`), null);
  const expired = Buffer.from(JSON.stringify({ sid: "a", role: "admin", exp: Date.now() - 1 })).toString("base64url");
  assert.equal(auth.verifyToken(`${expired}.${sig}`), null);
  assert.equal(auth.verifyToken(`${payload}`), null);
});

test("weak ADMIN_SECRET is refused", () => {
  const old = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "short";
  assert.throws(() => auth.createToken("s", "admin"));
  assert.equal(auth.verifyToken("a.b"), null);
  process.env.ADMIN_SECRET = old;
});

test("password check per role", () => {
  assert.equal(auth.checkPassword("admin", "admin-pass"), true);
  assert.equal(auth.checkPassword("admin", "staff-pass"), false);
  assert.equal(auth.checkPassword("staff", "staff-pass"), true);
  assert.equal(auth.checkPassword("root", "admin-pass"), false);
  assert.equal(auth.checkPassword("admin", undefined), false);
});

test("malformed cookie does not throw", () => {
  assert.deepEqual(auth.parseCookies("racik_admin=%E0%A4%A; ok=1"), { ok: "1" });
});

test("sameOrigin", () => {
  assert.equal(auth.sameOrigin({ headers: { origin: "https://a.com", host: "a.com" } }), true);
  assert.equal(auth.sameOrigin({ headers: { origin: "https://evil.com", host: "a.com" } }), false);
  assert.equal(auth.sameOrigin({ headers: { origin: "not a url", host: "a.com" } }), false);
  assert.equal(auth.sameOrigin({ headers: { "sec-fetch-site": "cross-site", host: "a.com" } }), false);
  assert.equal(auth.sameOrigin({ headers: { host: "a.com" } }), true);
});

test("image validation blocks XSS and traversal", () => {
  assert.equal(safeImage("assets/matcha.jpg"), "assets/matcha.jpg");
  assert.equal(safeImage("https://cdn.example.com/a.jpg"), "https://cdn.example.com/a.jpg");
  for (const bad of ['x" onerror="alert(1)', "javascript:alert(1)", "data:text/html,<script>", "assets/../secret", "http://insecure.com/a.jpg", "//evil.com/a.jpg"]) {
    assert.equal(safeImage(bad), "", bad);
  }
});

test("sanitize clamps and validates", () => {
  const p = sanitize({ name: " A ", tier: "Hacker", price: -5, img: "javascript:1", desc: "x".repeat(5000) });
  assert.equal(p.name, "A");
  assert.equal(p.tier, "");
  assert.equal(p.price, 0);
  assert.equal(p.img, "");
  assert.equal(p.description.length, 1000);
});

test("login/logout/products reject bad requests before touching the DB", async () => {
  const login = (await import("../api/login.js")).default;
  const logout = (await import("../api/logout.js")).default;
  const products = (await import("../api/products.js")).default;

  let res = makeRes(); await login({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 405);
  res = makeRes(); await login({ method: "POST", headers: { origin: "https://evil.com", host: "a.com" }, body: {} }, res);
  assert.equal(res.statusCode, 403);
  res = makeRes(); await logout({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 405);
  res = makeRes(); await logout({ method: "POST", headers: { origin: "https://evil.com", host: "a.com" } }, res);
  assert.equal(res.statusCode, 403);
  res = makeRes(); await products({ method: "DELETE", headers: { origin: "https://evil.com", host: "a.com" }, query: {} }, res);
  assert.equal(res.statusCode, 403);
});
