(() => {
  "use strict";
  const { PRODUCTS, CATEGORIES, isLow } = window.NIMBUS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const icon = (name, cls = "") => `<svg class="ic ${cls}"><use href="#i-${name}"/></svg>`;
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  PRODUCTS.forEach((p, i) => { p.seq = PRODUCTS.length - i; });

  const DESC = {
    ultrabook: "Mỏng, nhẹ, pin cả ngày — dành cho người hay di chuyển.",
    gaming: "Hiệu năng đồ họa mạnh, tản nhiệt tốt cho những trận đấu dài.",
    office: "Bền bỉ, ổn định và giá hợp lý cho công việc hằng ngày.",
    creator: "Màn hình chuẩn màu và sức mạnh dựng hình cho dân sáng tạo.",
    flip: "Gập xoay linh hoạt, dùng như laptop hoặc máy tính bảng.",
    acc: "Phụ kiện đi kèm giúp bộ máy gọn gàng và tiện dụng hơn.",
  };
  const COLLECTIONS = [
    { name: "Mỏng nhẹ di chuyển", desc: "Ultrabook và máy 2 trong 1 cho người hay đi.", cats: ["ultrabook", "flip"] },
    { name: "Chiến game", desc: "Card đồ họa rời, màn hình tần số quét cao.", cats: ["gaming"] },
    { name: "Học tập & văn phòng", desc: "Giá dễ chịu, bền bỉ cho việc hằng ngày.", cats: ["office"] },
    { name: "Sáng tạo nội dung", desc: "Màn hình chuẩn màu, dựng hình mạnh mẽ.", cats: ["creator"] },
    { name: "Phụ kiện thiết yếu", desc: "Sạc, hub, balo và ổ cứng di động.", cats: ["acc"] },
  ];
  const STATUS_OPTS = [["all", "Đang bán & nháp"], ["active", "Đang bán"], ["draft", "Nháp"], ["archived", "Lưu trữ"]];
  const SORT_OPTS = [["sold", "Bán chạy nhất"], ["newest", "Mới nhất"], ["priceDesc", "Giá cao → thấp"], ["priceAsc", "Giá thấp → cao"], ["name", "Tên A–Z"]];

  const state = { tab: "catalog", q: "", status: "all", sort: "sold", cat: "all", view: "grid", openId: null, built: false };
  const root = $("#viewProducts");

  /* ---------- Tiện ích ---------- */
  const tone = (p) => CATEGORIES[p.cat].tone;
  const daysLeft = (p) => (p.sold > 0 ? p.stock / (p.sold / 30) : null);
  const stockInfo = (p) => {
    if (p.status === "draft") return { cls: "sb-draft", label: "Nháp" };
    if (p.status === "archived") return { cls: "sb-draft", label: "Lưu trữ" };
    if (p.stock === 0) return { cls: "sb-out", label: "Hết hàng" };
    if (isLow(p)) return { cls: "sb-low", label: "Sắp hết" };
    return { cls: "sb-ok", label: `${p.stock} trong kho` };
  };
  const find = (id) => PRODUCTS.find((p) => p.id === id);
  let toastTimer;
  const toast = (msg) => {
    const t = $("#toast", root);
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  };
  const goto = (hash) => { if (location.hash !== hash) location.hash = hash; else window.Products.show(hash.replace(/^#\/?/, "").split("/").filter(Boolean)); };

  /* ---------- Khung trang ---------- */
  function build() {
    root.innerHTML = `
      <div class="p-head">
        <div><h2>Sản phẩm</h2><p id="pSub"></p></div>
        <button class="btn primary pill add" id="addBtn">${icon("plus")}<span>Thêm sản phẩm</span></button>
      </div>
      <div class="tabs" role="tablist" id="pTabs">
        <button role="tab" data-tab="catalog">Danh mục</button>
        <button role="tab" data-tab="stock">Kho<span class="badge" id="lowBadge"></span></button>
        <button role="tab" data-tab="collections">Bộ sưu tập</button>
      </div>
      <div id="pBody"></div>

      <div class="drawer-wrap" id="drawer" hidden>
        <div class="scrim" data-close></div>
        <aside class="drawer glass" role="dialog" aria-modal="true" aria-labelledby="dTitle" id="drawerPanel"></aside>
      </div>

      <dialog id="addDlg">
        <form method="dialog" id="addForm" novalidate>
          <h3>Thêm sản phẩm mới</h3>
          <div class="fgrid">
            <label class="f full">Tên sản phẩm<input name="name" required maxlength="60" placeholder="Ví dụ: Aero Air 14 Plus" /></label>
            <label class="f">Danh mục<select name="cat">${Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}">${c.name}</option>`).join("")}</select></label>
            <label class="f">Kích thước / loại<input name="size" maxlength="24" placeholder="14″ OLED" /></label>
            <label class="f full">Cấu hình<input name="spec" maxlength="80" placeholder="Core Ultra 7 · 16 GB · 512 GB SSD" /></label>
            <label class="f">Giá bán ($)<input name="price" type="number" min="1" step="1" required placeholder="1099" /></label>
            <label class="f">Giá vốn ($)<input name="cost" type="number" min="0" step="1" placeholder="780" /></label>
            <label class="f">Tồn kho<input name="stock" type="number" min="0" step="1" value="0" /></label>
            <label class="f">Mức đặt lại<input name="reorder" type="number" min="0" step="1" value="20" /></label>
          </div>
          <p class="form-err" id="formErr" role="alert"></p>
          <div class="dlg-foot">
            <button type="button" class="btn ghost" id="addCancel">Hủy</button>
            <button type="submit" class="btn primary">Lưu bản nháp</button>
          </div>
        </form>
      </dialog>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

    $("#addBtn", root).addEventListener("click", () => { $("#addForm", root).reset(); $("#formErr", root).textContent = ""; $("#addDlg", root).showModal(); });
    $("#addCancel", root).addEventListener("click", () => $("#addDlg", root).close());
    $("#addForm", root).addEventListener("submit", onAdd);
    $("#pTabs", root).addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) goto(`#/products/${b.dataset.tab}`); });
    $("#drawer", root).addEventListener("click", onDrawerClick);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.openId && !root.hidden) closeDrawer(); });
    state.built = true;
  }

  function onAdd(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), name = String(f.get("name")).trim(), price = Number(f.get("price"));
    if (!name) { $("#formErr", root).textContent = "Vui lòng nhập tên sản phẩm."; return; }
    if (!(price > 0)) { $("#formErr", root).textContent = "Giá bán phải lớn hơn 0."; return; }
    const cat = String(f.get("cat")), n = PRODUCTS.length + 300;
    PRODUCTS.unshift({
      id: `${cat === "acc" ? "AC" : "NB"}-${n}`, name, cat, size: String(f.get("size")).trim(), spec: String(f.get("spec")).trim() || "Chưa có cấu hình",
      price, cost: Number(f.get("cost")) || Math.round(price * 0.72), stock: Math.max(0, Number(f.get("stock")) || 0), reorder: Math.max(0, Number(f.get("reorder")) || 0),
      sold: 0, status: "draft", lifetimeUnits: 0, seq: Math.max(...PRODUCTS.map((p) => p.seq)) + 1,
    });
    $("#addDlg", root).close();
    Object.assign(state, { q: "", cat: "all", status: "all", sort: "newest" });
    refresh(); toast(`Đã thêm “${name}” vào bản nháp`);
  }

  /* ---------- Cập nhật chung ---------- */
  function refreshHeader() {
    const active = PRODUCTS.filter((p) => p.status === "active").length, low = PRODUCTS.filter(isLow).length;
    $("#pSub", root).textContent = `${active} sản phẩm đang bán · laptop chính hãng và phụ kiện đi kèm.`;
    const b = $("#lowBadge", root); b.textContent = low; b.hidden = low === 0;
    const nav = $('.nav-item[href="#/products"] .count'); if (nav) nav.textContent = low;
    $$("#pTabs button", root).forEach((t) => { const on = t.dataset.tab === state.tab; t.classList.toggle("on", on); t.setAttribute("aria-selected", on); });
  }
  function refresh() {
    refreshHeader(); renderBody();
    if (state.openId) renderDrawer();
  }

  /* ---------- Thân trang theo tab ---------- */
  function renderBody() {
    const body = $("#pBody", root);
    if (state.tab === "catalog") renderCatalogShell(body);
    else if (state.tab === "stock") renderStock(body);
    else renderCollections(body);
  }

  function renderCatalogShell(body) {
    body.innerHTML = `
      <div class="toolbar">
        <label class="field grow">${icon("search")}<input id="pSearch" type="search" placeholder="Tìm sản phẩm…" value="${esc(state.q)}" aria-label="Tìm sản phẩm" /></label>
        <div class="select"><select id="pStatus" aria-label="Trạng thái">${STATUS_OPTS.map(([v, l]) => `<option value="${v}" ${state.status === v ? "selected" : ""}>${l}</option>`).join("")}</select>${icon("chevron")}</div>
        <div class="select"><select id="pSort" aria-label="Sắp xếp">${SORT_OPTS.map(([v, l]) => `<option value="${v}" ${state.sort === v ? "selected" : ""}>${l}</option>`).join("")}</select>${icon("chevron")}</div>
        <div class="view-toggle" role="group" aria-label="Kiểu hiển thị">
          <button data-view="grid" aria-label="Dạng lưới" class="${state.view === "grid" ? "on" : ""}">${icon("grid")}</button>
          <button data-view="list" aria-label="Dạng danh sách" class="${state.view === "list" ? "on" : ""}">${icon("list")}</button>
        </div>
      </div>
      <div class="chips" id="pChips">
        <button class="chip-btn ${state.cat === "all" ? "on" : ""}" data-cat="all">Tất cả</button>
        ${Object.entries(CATEGORIES).map(([k, c]) => `<button class="chip-btn ${state.cat === k ? "on" : ""}" data-cat="${k}">${icon(c.icon)}${c.name}</button>`).join("")}
      </div>
      <div id="pResults"></div>`;
    $("#pSearch", body).addEventListener("input", (e) => { state.q = e.target.value; renderResults(); });
    $("#pStatus", body).addEventListener("change", (e) => { state.status = e.target.value; renderResults(); });
    $("#pSort", body).addEventListener("change", (e) => { state.sort = e.target.value; renderResults(); });
    $(".view-toggle", body).addEventListener("click", (e) => {
      const b = e.target.closest("[data-view]"); if (!b) return;
      state.view = b.dataset.view; $$(".view-toggle button", body).forEach((x) => x.classList.toggle("on", x === b)); renderResults();
    });
    $("#pChips", body).addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]"); if (!b) return;
      state.cat = b.dataset.cat; $$("#pChips .chip-btn", body).forEach((x) => x.classList.toggle("on", x === b)); renderResults();
    });
    renderResults();
  }

  function filtered() {
    const q = norm(state.q.trim());
    const list = PRODUCTS.filter((p) => {
      if (state.cat !== "all" && p.cat !== state.cat) return false;
      if (state.status === "all" ? p.status === "archived" : p.status !== state.status) return false;
      return !q || norm(`${p.name} ${p.id} ${CATEGORIES[p.cat].name} ${p.spec} ${p.size}`).includes(q);
    });
    const by = {
      sold: (a, b) => b.sold - a.sold || b.price - a.price,
      newest: (a, b) => b.seq - a.seq,
      priceDesc: (a, b) => b.price - a.price,
      priceAsc: (a, b) => a.price - b.price,
      name: (a, b) => a.name.localeCompare(b.name, "vi"),
    };
    return list.sort(by[state.sort]);
  }

  function renderResults() {
    const box = $("#pResults", root), list = filtered();
    if (!list.length) { box.innerHTML = `<div class="empty glass card"><strong>Không tìm thấy sản phẩm</strong>Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc.</div>`; return; }
    if (state.view === "list") {
      box.innerHTML = `<div class="card glass plist"><div class="table-wrap"><table>
        <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th class="r">Giá</th><th class="r">Tồn kho</th><th class="r">Đã bán 30 ngày</th><th>Trạng thái</th></tr></thead>
        <tbody>${list.map((p) => {
          const s = stockInfo(p), pill = { "sb-ok": "s-done", "sb-low": "s-wait", "sb-out": "s-out", "sb-draft": "s-draft" }[s.cls];
          return `<tr tabindex="0" data-id="${p.id}"><td><div class="pname"><span class="glyph g-${tone(p)}">${icon(CATEGORIES[p.cat].icon)}</span><div><strong>${esc(p.name)}</strong><small>${p.id}</small></div></div></td>
            <td class="when">${CATEGORIES[p.cat].name}</td><td class="r price">${money(p.price)}</td><td class="r">${p.stock}</td><td class="r">${p.sold}</td>
            <td><span class="status ${pill}">${s.label}</span></td></tr>`;
        }).join("")}</tbody></table></div></div>`;
      $$("tbody tr", box).forEach((tr) => { tr.addEventListener("click", () => openProduct(tr.dataset.id)); tr.addEventListener("keydown", (e) => { if (e.key === "Enter") openProduct(tr.dataset.id); }); });
      return;
    }
    box.innerHTML = `<div class="pgrid">${list.map((p, i) => {
      const s = stockInfo(p), c = CATEGORIES[p.cat];
      return `<button class="pcard glass" data-id="${p.id}" style="animation-delay:${Math.min(i, 12) * 25}ms" aria-label="${esc(p.name)}">
        <div class="media tone-${c.tone}"><span class="stock-badge ${s.cls}">${s.label}</span>${icon(c.icon)}</div>
        <div class="info"><span class="meta">${c.name}${p.size ? " · " + esc(p.size) : ""}</span><span class="name">${esc(p.name)}</span>
          <span class="row"><span class="price">${money(p.price)}</span><small>${p.sold} đã bán · 30 ng</small></span></div></button>`;
    }).join("")}</div>`;
    $$(".pcard", box).forEach((c) => c.addEventListener("click", () => openProduct(c.dataset.id)));
  }

  function renderStock(body) {
    const live = PRODUCTS.filter((p) => p.status === "active"), low = PRODUCTS.filter(isLow);
    const units = live.reduce((a, p) => a + p.stock, 0), value = live.reduce((a, p) => a + p.stock * p.cost, 0);
    const rows = [...low].sort((a, b) => (daysLeft(a) ?? 1e9) - (daysLeft(b) ?? 1e9));
    body.innerHTML = `
      <div class="kpis">
        <div class="kpi card glass"><p class="eyebrow">Tổng tồn kho</p><strong>${units.toLocaleString("en-US")}</strong> <span class="muted">sản phẩm</span></div>
        <div class="kpi card glass"><p class="eyebrow">Giá trị tồn kho (giá vốn)</p><strong>${money(value)}</strong></div>
        <div class="kpi card glass"><p class="eyebrow">Cần nhập thêm</p><strong>${low.length}</strong> <span class="muted">mã sắp hết hoặc đã hết</span></div>
      </div>
      <div class="card glass plist">
        <div class="card-head"><div><h3>Cần nhập hàng</h3><p class="muted">Sắp xếp theo số ngày còn bán được</p></div></div>
        ${rows.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Sản phẩm</th><th class="r">Tồn kho</th><th class="r">Mức đặt lại</th><th class="r">Ước tính còn</th><th></th></tr></thead>
          <tbody>${rows.map((p) => {
            const d = daysLeft(p), txt = p.stock === 0 ? "Đã hết" : d === null ? "—" : `${Math.floor(d)} ngày`, cls = p.stock === 0 || (d !== null && d <= 7) ? "bad" : d !== null && d <= 14 ? "warn" : "";
            return `<tr tabindex="0" data-id="${p.id}"><td><div class="pname"><span class="glyph g-${tone(p)}">${icon(CATEGORIES[p.cat].icon)}</span><div><strong>${esc(p.name)}</strong><small>${p.id}</small></div></div></td>
              <td class="r">${p.stock}</td><td class="r">${p.reorder}</td><td class="r"><span class="days ${cls}">${txt}</span></td>
              <td class="r"><button class="pill-btn" data-restock="${p.id}">Nhập hàng</button></td></tr>`;
          }).join("")}</tbody></table></div>` : `<div class="empty"><strong>Kho ổn định</strong>Không có sản phẩm nào dưới mức đặt lại.</div>`}
      </div>`;
    $$("tbody tr", body).forEach((tr) => tr.addEventListener("click", (e) => { if (!e.target.closest("[data-restock]")) openProduct(tr.dataset.id); }));
    $$("[data-restock]", body).forEach((b) => b.addEventListener("click", () => restock(b.dataset.restock)));
  }

  function renderCollections(body) {
    body.innerHTML = `<div class="colls">${COLLECTIONS.map((c, i) => {
      const items = PRODUCTS.filter((p) => c.cats.includes(p.cat) && p.status === "active"), first = CATEGORIES[c.cats[0]];
      return `<button class="coll card glass pcard" data-i="${i}" style="text-align:left;animation-delay:${i * 40}ms">
        <div class="top"><span class="glyph tone-${first.tone}">${icon(first.icon)}</span><div><h3>${c.name}</h3><p>${items.length} sản phẩm đang bán</p></div></div>
        <p>${c.desc}</p>
        <div class="stackrow"><span class="mini">${items.slice(0, 4).map((p) => `<span class="glyph g-${tone(p)}">${icon(CATEGORIES[p.cat].icon)}</span>`).join("")}</span><span class="link">Xem danh mục ${icon("arrow-right", "sm")}</span></div></button>`;
    }).join("")}</div>`;
    $$(".coll", body).forEach((b) => b.addEventListener("click", () => {
      Object.assign(state, { cat: COLLECTIONS[+b.dataset.i].cats[0], q: "", status: "all" }); goto("#/products/catalog");
    }));
  }

  /* ---------- Hành động ---------- */
  function restock(id) {
    const p = find(id); if (!p) return;
    const add = Math.max(20, p.reorder * 2); p.stock += add;
    refresh(); toast(`Đã nhập thêm ${add} “${p.name}”`);
  }
  function toggleStatus(id) {
    const p = find(id); if (!p) return;
    p.status = p.status === "active" ? "draft" : "active";
    refresh(); toast(p.status === "active" ? `“${p.name}” đã được đăng bán` : `“${p.name}” đã chuyển về nháp`);
  }

  /* ---------- Ngăn chi tiết ---------- */
  function openProduct(id) { goto(`#/products/${state.tab}/${id}`); }
  function closeDrawer() { goto(`#/products/${state.tab}`); }

  function renderDrawer() {
    const p = find(state.openId); if (!p) return;
    const c = CATEGORIES[p.cat], s = stockInfo(p), d = daysLeft(p);
    const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
    const pill = { "sb-ok": "s-done", "sb-low": "s-wait", "sb-out": "s-out", "sb-draft": "s-draft" }[s.cls];
    let note = "Tồn kho ổn định so với tốc độ bán hiện tại.";
    if (p.status !== "active") note = p.status === "draft" ? "Sản phẩm đang ở dạng nháp nên chưa hiển thị trên cửa hàng." : "Sản phẩm đã được lưu trữ.";
    else if (p.stock === 0) note = `Đã hết hàng — nên nhập thêm (mức đặt lại ${p.reorder}).`;
    else if (isLow(p)) note = `Còn khoảng ${Math.max(1, Math.floor(d ?? 0))} ngày ở tốc độ bán hiện tại · mức đặt lại ${p.reorder}.`;
    else if (d !== null) note = `Đủ bán khoảng ${Math.floor(d)} ngày ở tốc độ hiện tại · mức đặt lại ${p.reorder}.`;
    $("#drawerPanel", root).innerHTML = `
      <div class="drawer-head"><div><h3 id="dTitle">${esc(p.name)}</h3><small>${p.id} · ${c.name}</small></div>
        <button class="icon-btn ghost" data-close aria-label="Đóng">${icon("close")}</button></div>
      <div class="drawer-body">
        <div class="d-top"><div class="media tone-${c.tone}">${icon(c.icon)}</div>
          <div><div class="d-price">${money(p.price)}</div><div class="d-sub">${esc(p.size)}${p.size && p.spec ? " · " : ""}${esc(p.spec)}</div><span class="status ${pill}">${s.label}</span></div></div>
        <p class="quote">“${DESC[p.cat]}”</p>
        <div class="stat3"><div><small>Tồn kho</small><strong>${p.stock}</strong></div><div><small>Bán 30 ngày</small><strong>${p.sold}</strong></div><div><small>Biên lợi nhuận</small><strong>${margin}%</strong></div></div>
        <div><p class="sec-label">Kho hàng</p><p class="d-note">${note}</p></div>
        <div><p class="sec-label">Toàn thời gian</p><dl class="kvs">
          <div><dt>Đã bán</dt><dd>${p.lifetimeUnits}</dd></div>
          <div><dt>Doanh thu</dt><dd>${money(p.lifetimeUnits * p.price)}</dd></div>
          <div><dt>Giá vốn mỗi sản phẩm</dt><dd>${money(p.cost)}</dd></div></dl></div>
      </div>
      <div class="drawer-foot">
        <button class="btn ghost" data-close>Đóng</button>
        <button class="btn ghost" data-restock="${p.id}">Nhập hàng</button>
        <button class="btn primary" data-toggle="${p.id}">${p.status === "active" ? "Chuyển nháp" : "Đăng bán"}</button>
      </div>`;
  }
  function onDrawerClick(e) {
    if (e.target.closest("[data-close]")) return closeDrawer();
    const r = e.target.closest("[data-restock]"); if (r) return restock(r.dataset.restock);
    const t = e.target.closest("[data-toggle]"); if (t) return toggleStatus(t.dataset.toggle);
  }
  let lastFocus = null;
  function showDrawer(id) {
    const wasOpen = !!state.openId; state.openId = id; renderDrawer();
    $("#drawer", root).hidden = false;
    if (!wasOpen) { lastFocus = document.activeElement; $("[data-close]", $("#drawerPanel", root))?.focus(); }
  }
  function hideDrawer() {
    if (!state.openId) return;
    state.openId = null; $("#drawer", root).hidden = true;
    lastFocus?.focus?.(); lastFocus = null;
  }

  /* ---------- Giao diện công khai cho router ---------- */
  window.Products = {
    show(parts) {
      if (!state.built) build();
      const tab = ["catalog", "stock", "collections"].includes(parts[1]) ? parts[1] : "catalog";
      const id = parts[2] && find(parts[2]) ? parts[2] : null;
      const tabChanged = tab !== state.tab || !$("#pBody", root).children.length;
      state.tab = tab;
      if (tabChanged) refresh(); else refreshHeader();
      if (id) showDrawer(id); else hideDrawer();
    },
    leave() { hideDrawer(); },
    refreshBadge() {
      const nav = $('.nav-item[href="#/products"] .count'); if (nav) nav.textContent = PRODUCTS.filter(isLow).length;
    },
  };
  window.Products.refreshBadge();
})();
