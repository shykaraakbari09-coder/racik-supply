const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let products = [];
let currentRole = null;
let timer;

function toast(t) {
  const e = $("toast"); e.textContent = t; e.classList.add("show");
  clearTimeout(timer); timer = setTimeout(() => e.classList.remove("show"), 2200);
}

async function api(path, opts = {}) {
  const res = await fetch("/api/" + path, {
    credentials: "same-origin",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    ...opts
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (res.status === 401 || res.status === 403) {
    if (res.status === 401) showLogin();
    throw new Error(data.error || "Akses ditolak");
  }
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}

function applyRole(role) {
  currentRole = role;
  const isAdmin = role === "admin";
  $("addBtn").hidden = !isAdmin;
  $("roleBadge").hidden = !role;
  $("roleBadge").textContent = role ? role.toUpperCase() : "";
  $("roleBadge").style.background = isAdmin ? "#e6efe4" : "#f3ecdf";
  $("roleBadge").style.color = isAdmin ? "#3f6b45" : "#8a755f";
  $("dashSub").textContent = isAdmin
    ? "Tambah, ubah, dan hapus produk. Perubahan langsung tampil di halaman toko."
    : "Mode staff: hanya bisa mengubah produk. Perubahan langsung tampil di halaman toko.";
}

function showDash(role) {
  $("loginView").hidden = true;
  $("dashView").hidden = false;
  $("logoutBtn").hidden = false;
  applyRole(role);
  render();
}
function showLogin() {
  currentRole = null;
  $("loginView").hidden = false;
  $("dashView").hidden = true;
  $("logoutBtn").hidden = true;
  $("roleBadge").hidden = true;
  $("password").value = "";
  $("password").focus();
}

async function load() {
  const { products: list } = await api("products");
  products = list;
  render();
}

function render() {
  const q = $("adminSearch").value.toLowerCase();
  const list = products.filter((p) => [p.name, p.supplier, p.cat, p.tier].join(" ").toLowerCase().includes(q));
  $("rows").innerHTML = list.map((p) => `
    <tr>
      <td>${p.img ? `<img class="thumb" src="${esc(p.img)}" alt="" loading="lazy">` : `<div class="thumb"></div>`}</td>
      <td><b>${esc(p.name)}</b><div style="color:#81877d;font-size:11px">${esc(p.unit)}</div></td>
      <td class="hide-sm">${esc(p.cat)}</td>
      <td class="hide-sm">${esc(p.supplier)}</td>
      <td><span class="pill">${esc(p.tier)}</span></td>
      <td>${rupiah(p.price)}</td>
      <td><div class="row-actions">
        <button class="btn ghost sm" data-edit="${p.id}">Edit</button>
        ${currentRole === "admin" ? `<button class="btn danger sm" data-del="${p.id}">Hapus</button>` : ""}
      </div></td>
    </tr>`).join("");
  $("tableEmpty").hidden = list.length > 0;

  $("statTotal").textContent = products.length;
  $("statCats").textContent = new Set(products.map((p) => p.cat)).size;
  $("statSuppliers").textContent = new Set(products.map((p) => p.supplier)).size;
  const avg = products.length ? Math.round(products.reduce((s, p) => s + Number(p.price || 0), 0) / products.length) : 0;
  $("statAvg").textContent = rupiah(avg);
}

function openForm(p) {
  $("formMsg").textContent = "";
  $("formTitle").textContent = p ? "Edit produk" : "Produk baru";
  $("f_id").value = p?.id ?? "";
  $("f_name").value = p?.name ?? "";
  $("f_cat").value = p?.cat ?? "";
  $("f_tier").value = p?.tier ?? "Essential";
  $("f_supplier").value = p?.supplier ?? "";
  $("f_price").value = p?.price ?? "";
  $("f_unit").value = p?.unit ?? "";
  $("f_stock").value = p?.stock ?? "";
  $("f_img").value = p?.img ?? "";
  $("f_desc").value = p?.desc ?? "";
  $("f_origin").value = p?.origin ?? "";
  $("f_grade").value = p?.grade ?? "";
  $("f_taste").value = p?.taste ?? "";
  $("f_use").value = p?.use ?? "";
  $("f_moq").value = p?.moq ?? "";
  $("overlay").classList.add("open");
}
function closeForm() { $("overlay").classList.remove("open"); }

async function save(e) {
  e.preventDefault();
  const id = $("f_id").value;
  const payload = {
    id: id || undefined,
    name: $("f_name").value, cat: $("f_cat").value, supplier: $("f_supplier").value,
    tier: $("f_tier").value, price: Number($("f_price").value || 0), unit: $("f_unit").value,
    stock: $("f_stock").value, img: $("f_img").value, desc: $("f_desc").value,
    origin: $("f_origin").value, grade: $("f_grade").value, taste: $("f_taste").value,
    use: $("f_use").value, moq: $("f_moq").value
  };
  $("saveBtn").disabled = true;
  try {
    if (id) await api("products", { method: "PUT", body: JSON.stringify(payload) });
    else await api("products", { method: "POST", body: JSON.stringify(payload) });
    closeForm();
    await load();
    toast(id ? "Produk diperbarui" : "Produk ditambahkan");
  } catch (err) {
    $("formMsg").textContent = err.message;
  } finally {
    $("saveBtn").disabled = false;
  }
}

async function del(id) {
  const p = products.find((x) => x.id === id);
  if (!confirm(`Hapus "${p?.name}"?`)) return;
  try {
    await api("products?id=" + id, { method: "DELETE" });
    await load();
    toast("Produk dihapus");
  } catch (err) {
    toast(err.message);
  }
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginMsg").textContent = "";
  try {
    const { role } = await api("login", { method: "POST", body: JSON.stringify({ role: $("role").value, password: $("password").value }) });
    showDash(role);
    await load();
  } catch (err) {
    $("loginMsg").textContent = err.message;
    if (!$("dashView").hidden) toast("Gagal memuat produk: " + err.message);
  }
});
$("logoutBtn").addEventListener("click", async () => {
  try { await api("logout", { method: "POST" }); } catch {}
  showLogin();
});
function csvCell(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop Excel/Sheets from executing injected formulas
  return '"' + s.replace(/"/g, '""') + '"';
}
function exportCsv() {
  const cols = ["id", "name", "cat", "supplier", "tier", "price", "unit", "stock", "moq", "origin", "grade", "taste", "use", "desc", "img"];
  const rowsCsv = [cols.join(",")].concat(products.map((p) => cols.map((c) => csvCell(p[c])).join(",")));
  const blob = new Blob(["\ufeff" + rowsCsv.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "racik-produk-" + new Date().toISOString().slice(0, 10) + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
$("exportBtn").addEventListener("click", exportCsv);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeForm(); });
$("addBtn").addEventListener("click", () => openForm(null));
$("closeForm").addEventListener("click", closeForm);
$("cancelForm").addEventListener("click", closeForm);
$("productForm").addEventListener("submit", save);
$("adminSearch").addEventListener("input", render);
$("rows").addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-del]");
  if (edit) openForm(products.find((p) => p.id === Number(edit.dataset.edit)));
  if (delBtn) del(Number(delBtn.dataset.del));
});
$("overlay").addEventListener("click", (e) => { if (e.target === $("overlay")) closeForm(); });

(async function init() {
  try {
    const { authed, role } = await api("session");
    if (authed) { showDash(role); await load(); } else showLogin();
  } catch { showLogin(); }
})();
