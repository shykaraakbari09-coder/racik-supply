"use strict";
// Ganti nomor ini dengan nomor WhatsApp bisnis/admin dalam format internasional tanpa + atau spasi.
const WHATSAPP_NUMBER = "6298653922882";
// Untuk asisten AI sungguhan, arahkan nomor ini ke WhatsApp Business Platform + backend chatbot.
const AI_WHATSAPP_NUMBER = "6298653922882";
const CART_KEY = "racik_cart_v1";
const MAX_QTY = 999;
const PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='900' height='600'><rect width='100%' height='100%' fill='#edf0e8'/><text x='50%' y='50%' fill='#8b8d84' font-family='Georgia,serif' font-size='32' text-anchor='middle'>racik.</text></svg>"
);

// Katalog cadangan, dipakai hanya bila API tidak bisa dijangkau.
let products = [
{id:1,name:"Matcha Culinary",cat:"Matcha",supplier:"Nusa Tea Supply",tier:"Essential",price:78000,unit:"100 g",img:"assets/matcha.jpg",desc:"Matcha blend untuk latte dan minuman harian.",origin:"Blend Jepang–lokal",grade:"Culinary",taste:"Umami ringan, earthy",use:"Matcha latte, frappe",moq:"1 pack",stock:"Ready stock"},
{id:2,name:"Matcha Uji Select",cat:"Matcha",supplier:"Kyoto Leaf Partner",tier:"Select",price:185000,unit:"100 g",img:"assets/matcha-uji.jpg",desc:"Warna hijau pekat dan rasa lebih halus.",origin:"Uji, Kyoto · Jepang",grade:"Premium culinary",taste:"Umami kuat, pahit lembut",use:"Signature matcha",moq:"2 pack",stock:"Pre-order 3–5 hari"},
{id:3,name:"House Blend Espresso",cat:"Coffee",supplier:"Kopi Lintas",tier:"Standard",price:138000,unit:"1 kg",img:"assets/coffee-house.jpg",desc:"Blend untuk espresso dan kopi susu.",origin:"Aceh & Toraja",grade:"Arabika–robusta blend",taste:"Cokelat, kacang, karamel",use:"Espresso, kopi susu",moq:"1 kg",stock:"Ready stock"},
{id:4,name:"Robusta House Roast",cat:"Coffee",supplier:"Gayo Roastworks",tier:"Essential",price:92000,unit:"1 kg",img:"assets/robusta.jpg",desc:"Body tebal untuk kopi susu dan tubruk.",origin:"Gayo, Aceh",grade:"Robusta",taste:"Dark chocolate, bold",use:"Kopi susu, tubruk",moq:"1 kg",stock:"Ready stock"},
{id:5,name:"Taro Premium Powder",cat:"Taro",supplier:"Rasa Bahan Co.",tier:"Standard",price:69000,unit:"1 kg",img:"assets/taro.jpg",desc:"Bubuk taro untuk minuman creamy.",origin:"Formulasi lokal",grade:"Minuman powder",taste:"Manis creamy, taro",use:"Taro latte, frappe",moq:"1 kg",stock:"Ready stock"},
{id:6,name:"Vanilla Syrup",cat:"Syrup",supplier:"Pour & Co.",tier:"Essential",price:58000,unit:"1 L",img:"assets/vanilla-syrup.jpg",desc:"Sirup vanilla untuk menu kopi dan non-kopi.",origin:"Produksi Indonesia",grade:"Café syrup",taste:"Vanilla manis",use:"Latte, soda, tea",moq:"1 botol",stock:"Ready stock"},
{id:7,name:"Barista Oat Milk",cat:"Dairy",supplier:"Daily Plant",tier:"Select",price:39000,unit:"1 L",img:"assets/oat-milk.jpg",desc:"Alternatif susu untuk menu plant-based.",origin:"Produksi Indonesia",grade:"Barista blend",taste:"Creamy, ringan",use:"Latte, matcha",moq:"6 kotak",stock:"Ready stock"}
];

let category = "Semua";
let cart = loadCart();
let toastTimer;
const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const byId = (id) => products.find((p) => p.id === id);

/* ---------- cart (persisted as id + qty only, so prices always come from the catalog) ---------- */
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter((i) => Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty > 0).map((i) => ({ id: i.id, qty: Math.min(i.qty, MAX_QTY) }))
      : [];
  } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* storage blocked: cart stays in memory */ }
}
function cartLines() {
  return cart.map((i) => ({ ...byId(i.id), qty: i.qty })).filter((l) => l.name);
}
function syncCart() {
  cart = cart.filter((i) => byId(i.id));
  saveCart();
  updateCart();
}

function add(id) {
  const p = byId(id); if (!p) return;
  const line = cart.find((i) => i.id === id);
  if (line) line.qty = Math.min(line.qty + 1, MAX_QTY); else cart.push({ id, qty: 1 });
  saveCart(); updateCart(); toast(p.name + " ditambahkan");
}
function changeQty(id, delta) {
  const line = cart.find((i) => i.id === id); if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((i) => i.id !== id);
  line.qty = Math.min(line.qty, MAX_QTY);
  saveCart(); updateCart();
}
function removeItem(id) { cart = cart.filter((i) => i.id !== id); saveCart(); updateCart(); }

function updateCart() {
  const lines = cartLines();
  const badge = $("cartCount"), count = String(lines.reduce((s, l) => s + l.qty, 0));
  if (badge.textContent !== count) { badge.textContent = count; badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump"); }
  $("cartItems").innerHTML = lines.length ? lines.map((l) => `
    <div class="cart-item">
      <div><b>${esc(l.name)}</b><small>${esc(l.supplier)}<br>${rupiah(l.price)} per ${esc(l.unit)}</small>
        <div class="qty" role="group" aria-label="Jumlah ${esc(l.name)}">
          <button type="button" data-action="dec" data-id="${l.id}" aria-label="Kurangi">−</button>
          <span>${l.qty}</span>
          <button type="button" data-action="inc" data-id="${l.id}" aria-label="Tambah">+</button>
        </div></div>
      <div style="text-align:right">${rupiah(l.price * l.qty)}<br><button type="button" class="linkbtn" data-action="remove" data-id="${l.id}" aria-label="Hapus ${esc(l.name)}">Hapus</button></div>
    </div>`).join("") : '<div class="empty">Keranjang masih kosong.</div>';
  $("cartTotal").textContent = rupiah(lines.reduce((s, l) => s + l.price * l.qty, 0));
}

let lastFocus = null;
function openCart() { lastFocus = document.activeElement; $("overlay").classList.add("open"); updateCart(); $("closeCartBtn").focus(); }
function closeCart() { $("overlay").classList.remove("open"); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

/* ---------- catalog ---------- */
function render() {
  const q = $("searchInput").value.toLowerCase().trim();
  const sort = $("sortSelect").value;
  const list = products.filter((p) => (category === "Semua" || p.cat === category) && [p.name, p.cat, p.supplier, p.desc, p.tier].join(" ").toLowerCase().includes(q));
  if (sort === "low") list.sort((a, b) => a.price - b.price);
  if (sort === "high") list.sort((a, b) => b.price - a.price);
  $("products").innerHTML = list.length ? list.map((p) => `<article class="product"><div class="photo"><img src="${esc(p.img || PLACEHOLDER)}" alt="${esc(p.name)}" width="900" height="600" loading="lazy"><span class="stamp">${esc(p.cat)}</span></div><div class="product-info"><div class="meta"><span>${esc(p.supplier)}</span><span class="tier">${esc(p.tier)}</span></div><h3>${esc(p.name)}</h3><div class="supplier">${esc(p.desc)}</div><div class="price">${rupiah(p.price)} <span class="unit">/ ${esc(p.unit)}</span></div><div class="card-actions"><button type="button" class="details" data-action="spec" data-id="${p.id}">Detail</button><button type="button" class="add" data-action="add" data-id="${p.id}">Tambah</button><button type="button" class="order" data-action="order" data-id="${p.id}">Tanya ↗</button></div><details class="spec" id="spec-${p.id}"><summary>Spesifikasi &amp; kualitas</summary><div class="spec-content"><b>Asal:</b> ${esc(p.origin)}<br><b>Grade:</b> ${esc(p.grade)}<br><b>Profil rasa:</b> ${esc(p.taste)}<br><b>Rekomendasi:</b> ${esc(p.use)}<br><b>Minimum order:</b> ${esc(p.moq)}<br><b>Ketersediaan:</b> ${esc(p.stock)}</div></details></div></article>`).join("")
    : '<div class="empty">Tidak ada produk yang cocok. Coba kata kunci atau kategori lain.</div>';
  $("products").querySelectorAll(".product").forEach((c, i) => c.style.setProperty("--i", Math.min(i, 8)));
}

// Hero receipt: shows the first three catalog items; only re-renders (and re-animates) if they changed.
let notaKey = "";
function renderNota() {
  const picks = products.slice(0, 3);
  const key = picks.map((p) => p.id + p.name + p.price).join("|");
  if (key === notaKey) return;
  notaKey = key;
  $("notaLines").innerHTML = picks.map((p, i) => `<div class="nota-line" style="--i:${i}"><span>${esc(p.name)}<small>${esc(p.unit)}</small></span><b>${rupiah(p.price)}</b></div>`).join("");
  $("notaTotal").textContent = rupiah(picks.reduce((s, p) => s + p.price, 0));
}
function toggleSpec(id) {
  const d = $("spec-" + id); if (!d) return;
  d.open = !d.open;
  if (d.open) d.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function setCategory(c, el) {
  category = c;
  document.querySelectorAll(".filter").forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
  el.classList.add("active"); el.setAttribute("aria-pressed", "true");
  render();
}

/* ---------- WhatsApp ---------- */
function wa(text, number = WHATSAPP_NUMBER) {
  window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(text), "_blank", "noopener");
}
function orderOne(id) {
  const p = byId(id); if (!p) return;
  wa(`Halo Racik, saya tertarik dengan produk ini:\n\n${p.name}\nSupplier: ${p.supplier}\nTier: ${p.tier}\nHarga listing: ${rupiah(p.price)} / ${p.unit}\n\nBoleh minta info stok, ongkir, dan harga grosir?`);
}
function checkout() {
  const lines = cartLines();
  if (!lines.length) { toast("Keranjang masih kosong"); return; }
  const text = lines.map((l) => `• ${l.name} — ${l.qty} × ${rupiah(l.price)} (${l.supplier})`).join("\n");
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  wa(`Halo Racik, saya ingin konsultasi dan order:\n\n${text}\n\nEstimasi total listing: ${rupiah(total)}\n\nMohon konfirmasi stok, ongkir, dan langkah pemesanan.`);
  closeCart();
}
// "0812-3456-789" / "+62 812..." / "62812..." -> "62812..."; returns "" when it cannot be a phone number.
function normalizePhone(input) {
  let d = String(input).replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d.length >= 9 && d.length <= 15 ? d : "";
}
function toast(t) {
  const e = $("toast"); e.textContent = t; e.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => e.classList.remove("show"), 2200);
}

/* ---------- events (no inline handlers, so CSP can forbid inline scripts) ---------- */
document.addEventListener("click", (e) => {
  if (e.target === $("overlay")) return closeCart();
  const el = e.target.closest("[data-action]"); if (!el) return;
  const id = Number(el.dataset.id);
  switch (el.dataset.action) {
    case "open-cart": openCart(); break;
    case "close-cart": closeCart(); break;
    case "category": setCategory(el.dataset.cat, el); break;
    case "spec": toggleSpec(id); break;
    case "add": add(id); break;
    case "order": orderOne(id); break;
    case "inc": changeQty(id, 1); break;
    case "dec": changeQty(id, -1); break;
    case "remove": removeItem(id); break;
    case "checkout": checkout(); break;
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("overlay").classList.contains("open")) closeCart(); });
// Broken image (deleted file, bad URL): swap in a placeholder instead of a broken icon.
document.addEventListener("error", (e) => {
  const img = e.target;
  if (img && img.tagName === "IMG" && !img.dataset.failed) { img.dataset.failed = "1"; img.src = PLACEHOLDER; }
}, true);
$("searchInput").addEventListener("input", render);
$("sortSelect").addEventListener("change", render);
$("assistantLink").href = "https://wa.me/" + AI_WHATSAPP_NUMBER + "?text=" + encodeURIComponent("Halo Racik Assistant, bantu saya memilih bahan baku untuk warkop. Budget dan jenis menu saya: ");
$("partnerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const phone = normalizePhone(f.supplierWa.value);
  if (!phone) { toast("Nomor WhatsApp tidak valid"); f.supplierWa.focus(); return; }
  wa(`Halo Racik, saya ingin mendaftar sebagai supplier.\nNama: ${f.supplierName.value.trim()}\nWhatsApp: ${phone}\nKategori: ${f.supplierCategory.value}\nDetail: ${f.supplierDesc.value.trim() || "-"}`);
});

/* ---------- boot ---------- */
render(); syncCart(); renderNota();
// Muat katalog dari API (sumber: admin dashboard). Fallback ke data statis bila gagal.
fetch("/api/products")
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then((d) => { if (Array.isArray(d.products) && d.products.length) { products = d.products; render(); syncCart(); renderNota(); } })
  .catch(() => {});
