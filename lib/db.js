import { neon } from "@neondatabase/serverless";

let _sql;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    _sql = neon(url);
  }
  return _sql;
}

const DEFAULT_PRODUCTS = [
  { name: "Matcha Culinary", cat: "Matcha", supplier: "Nusa Tea Supply", tier: "Essential", price: 78000, unit: "100 g", img: "assets/matcha.jpg", description: "Matcha blend untuk latte dan minuman harian.", origin: "Blend Jepang–lokal", grade: "Culinary", taste: "Umami ringan, earthy", use_case: "Matcha latte, frappe", moq: "1 pack", stock: "Ready stock" },
  { name: "Matcha Uji Select", cat: "Matcha", supplier: "Kyoto Leaf Partner", tier: "Select", price: 185000, unit: "100 g", img: "assets/matcha-uji.jpg", description: "Warna hijau pekat dan rasa lebih halus.", origin: "Uji, Kyoto · Jepang", grade: "Premium culinary", taste: "Umami kuat, pahit lembut", use_case: "Signature matcha", moq: "2 pack", stock: "Pre-order 3–5 hari" },
  { name: "House Blend Espresso", cat: "Coffee", supplier: "Kopi Lintas", tier: "Standard", price: 138000, unit: "1 kg", img: "assets/coffee-house.jpg", description: "Blend untuk espresso dan kopi susu.", origin: "Aceh & Toraja", grade: "Arabika–robusta blend", taste: "Cokelat, kacang, karamel", use_case: "Espresso, kopi susu", moq: "1 kg", stock: "Ready stock" },
  { name: "Robusta House Roast", cat: "Coffee", supplier: "Gayo Roastworks", tier: "Essential", price: 92000, unit: "1 kg", img: "assets/robusta.jpg", description: "Body tebal untuk kopi susu dan tubruk.", origin: "Gayo, Aceh", grade: "Robusta", taste: "Dark chocolate, bold", use_case: "Kopi susu, tubruk", moq: "1 kg", stock: "Ready stock" },
  { name: "Taro Premium Powder", cat: "Taro", supplier: "Rasa Bahan Co.", tier: "Standard", price: 69000, unit: "1 kg", img: "assets/taro.jpg", description: "Bubuk taro untuk minuman creamy.", origin: "Formulasi lokal", grade: "Minuman powder", taste: "Manis creamy, taro", use_case: "Taro latte, frappe", moq: "1 kg", stock: "Ready stock" },
  { name: "Vanilla Syrup", cat: "Syrup", supplier: "Pour & Co.", tier: "Essential", price: 58000, unit: "1 L", img: "assets/vanilla-syrup.jpg", description: "Sirup vanilla untuk menu kopi dan non-kopi.", origin: "Produksi Indonesia", grade: "Café syrup", taste: "Vanilla manis", use_case: "Latte, soda, tea", moq: "1 botol", stock: "Ready stock" },
  { name: "Barista Oat Milk", cat: "Dairy", supplier: "Daily Plant", tier: "Select", price: 39000, unit: "1 L", img: "assets/oat-milk.jpg", description: "Alternatif susu untuk menu plant-based.", origin: "Produksi Indonesia", grade: "Barista blend", taste: "Creamy, ringan", use_case: "Latte, matcha", moq: "6 kotak", stock: "Ready stock" }
];

let _ready;

export function ensureSchema() {
  if (!_ready) {
    _ready = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          cat TEXT NOT NULL,
          supplier TEXT NOT NULL,
          tier TEXT NOT NULL,
          price INTEGER NOT NULL,
          unit TEXT NOT NULL,
          img TEXT DEFAULT '',
          description TEXT DEFAULT '',
          origin TEXT DEFAULT '',
          grade TEXT DEFAULT '',
          taste TEXT DEFAULT '',
          use_case TEXT DEFAULT '',
          moq TEXT DEFAULT '',
          stock TEXT DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      const [{ count }] = await sql`SELECT count(*)::int AS count FROM products`;
      if (count === 0) {
        for (const p of DEFAULT_PRODUCTS) {
          await sql`
            INSERT INTO products (name, cat, supplier, tier, price, unit, img, description, origin, grade, taste, use_case, moq, stock)
            VALUES (${p.name}, ${p.cat}, ${p.supplier}, ${p.tier}, ${p.price}, ${p.unit}, ${p.img}, ${p.description}, ${p.origin}, ${p.grade}, ${p.taste}, ${p.use_case}, ${p.moq}, ${p.stock})
          `;
        }
      }
    })();
  }
  return _ready;
}

export function rowToProduct(r) {
  return {
    id: r.id,
    name: r.name,
    cat: r.cat,
    supplier: r.supplier,
    tier: r.tier,
    price: r.price,
    unit: r.unit,
    img: r.img || "",
    desc: r.description || "",
    origin: r.origin || "",
    grade: r.grade || "",
    taste: r.taste || "",
    use: r.use_case || "",
    moq: r.moq || "",
    stock: r.stock || ""
  };
}

export function sanitize(body) {
  const str = (v, max = 500) => (v == null ? "" : String(v).trim().slice(0, max));
  const price = Math.max(0, Math.min(1_000_000_000, Math.round(Number(body.price) || 0)));
  return {
    name: str(body.name, 120),
    cat: str(body.cat, 60),
    supplier: str(body.supplier, 120),
    tier: str(body.tier, 40),
    price,
    unit: str(body.unit, 40),
    img: str(body.img, 300),
    description: str(body.desc, 1000),
    origin: str(body.origin, 120),
    grade: str(body.grade, 120),
    taste: str(body.taste, 200),
    use_case: str(body.use, 200),
    moq: str(body.moq, 120),
    stock: str(body.stock, 120)
  };
}
