import { getSql, ensureSchema, rowToProduct, sanitize } from "../lib/db.js";
import { isAuthed, readBody } from "../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM products ORDER BY id ASC`;
      return res.status(200).json({ products: rows.map(rowToProduct) });
    }

    if (!isAuthed(req)) {
      return res.status(401).json({ error: "Tidak diotorisasi. Silakan login ulang." });
    }

    const body = readBody(req);

    if (req.method === "POST") {
      const p = sanitize(body);
      if (!p.name || !p.cat || !p.supplier || !p.tier || !p.unit) {
        return res.status(400).json({ error: "Nama, kategori, supplier, tier, dan satuan wajib diisi." });
      }
      const [row] = await sql`
        INSERT INTO products (name, cat, supplier, tier, price, unit, img, description, origin, grade, taste, use_case, moq, stock)
        VALUES (${p.name}, ${p.cat}, ${p.supplier}, ${p.tier}, ${p.price}, ${p.unit}, ${p.img}, ${p.description}, ${p.origin}, ${p.grade}, ${p.taste}, ${p.use_case}, ${p.moq}, ${p.stock})
        RETURNING *
      `;
      return res.status(201).json({ product: rowToProduct(row) });
    }

    if (req.method === "PUT") {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "ID tidak valid." });
      const p = sanitize(body);
      if (!p.name || !p.cat || !p.supplier || !p.tier || !p.unit) {
        return res.status(400).json({ error: "Nama, kategori, supplier, tier, dan satuan wajib diisi." });
      }
      const [row] = await sql`
        UPDATE products SET
          name = ${p.name}, cat = ${p.cat}, supplier = ${p.supplier}, tier = ${p.tier},
          price = ${p.price}, unit = ${p.unit}, img = ${p.img}, description = ${p.description},
          origin = ${p.origin}, grade = ${p.grade}, taste = ${p.taste}, use_case = ${p.use_case},
          moq = ${p.moq}, stock = ${p.stock}, updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan." });
      return res.status(200).json({ product: rowToProduct(row) });
    }

    if (req.method === "DELETE") {
      const id = Number(req.query.id ?? body.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "ID tidak valid." });
      const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: "Produk tidak ditemukan." });
      return res.status(200).json({ ok: true, id });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
