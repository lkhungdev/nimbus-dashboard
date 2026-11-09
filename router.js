(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Các trang đã có nội dung thật; các mục menu còn lại hiện trang giữ chỗ.
  const REAL = {
    dashboard: { el: "#viewDashboard", title: "Bảng điều khiển", crumb: "Tổng quan" },
    products: { el: "#viewProducts", title: "Sản phẩm", crumb: "Sản phẩm" },
  };
  const links = $$(".nav-item[href^='#/']");
  const order = links.map((a) => a.getAttribute("href").slice(2));
  const labelOf = (key) => $(`.nav-item[href="#/${key}"] span`)?.textContent ?? key;
  const iconOf = (key) => $(`.nav-item[href="#/${key}"] use`)?.getAttribute("href") ?? "#i-grid";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const date = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

  const nav = $(".nav"), pill = $("#navPill");
  let lastName = null, lastIndex = 0;

  /* ---------- Thanh trượt đánh dấu mục menu ---------- */
  function movePill(animate = true) {
    const active = $(".nav .nav-item.active");
    if (!active) { pill.style.opacity = "0"; return; }
    if (!animate || reduce.matches) pill.style.transition = "none";
    pill.style.opacity = "1";
    pill.style.width = active.offsetWidth + "px";
    pill.style.height = active.offsetHeight + "px";
    pill.style.translate = `${active.offsetLeft}px ${active.offsetTop}px`;
    if (!animate || reduce.matches) { void pill.offsetWidth; pill.style.transition = ""; }
    else { pill.classList.remove("squish"); void pill.offsetWidth; pill.classList.add("squish"); }
  }

  /* ---------- Trang giữ chỗ cho các mục chưa dựng ---------- */
  function renderStub(key) {
    $("#viewStub").innerHTML = `
      <div class="stub card glass">
        <span class="stub-ic"><svg class="ic"><use href="${iconOf(key)}"/></svg></span>
        <h2>${labelOf(key)}</h2>
        <p>Trang này chưa được dựng trong bản sao. Bạn có thể quay lại Tổng quan hoặc mở trang Sản phẩm.</p>
        <div class="stub-actions"><a class="btn primary pill" href="#/dashboard"><span>Về Tổng quan</span></a><a class="btn ghost pill" href="#/products"><span>Mở Sản phẩm</span></a></div>
      </div>`;
  }

  /* ---------- Hiệu ứng vào trang ---------- */
  function enter(el, dir) {
    el.style.setProperty("--dir", dir);
    let i = 0;
    $$(".card, .p-head, .tabs, .stub, .toolbar, .chips", el).forEach((c) => { if (!c.closest(".drawer-wrap")) c.style.setProperty("--i", Math.min(i++, 9)); });
    el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter");
  }

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    let name = order.includes(parts[0]) ? parts[0] : "dashboard";
    const real = REAL[name];
    const viewSel = real ? real.el : "#viewStub";
    const changed = name !== lastName;

    if (!real) renderStub(name);
    ["#viewDashboard", "#viewProducts", "#viewStub"].forEach((s) => { $(s).hidden = s !== viewSel; });

    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#/${name}`));
    const title = real ? real.title : labelOf(name);
    document.title = `${title} — Nimbus`;
    const sub = name === "products" ? { catalog: "Danh mục", stock: "Kho", collections: "Bộ sưu tập" }[parts[1] || "catalog"] : null;
    $("#today").textContent = `${date} · ${real ? real.crumb : labelOf(name)}${sub ? " › " + sub : ""}`;

    if (name === "products") window.Products.show(parts); else window.Products.leave();
    if (parts[0] && !order.includes(parts[0])) history.replaceState(null, "", "#/dashboard");

    if (changed) {
      const idx = order.indexOf(name), dir = idx >= lastIndex ? 1 : -1;
      movePill(lastName !== null);
      if (lastName !== null && !reduce.matches) enter($(viewSel), dir);
      window.scrollTo({ top: 0 });
      lastIndex = idx;
    }
    lastName = name;
  }

  window.addEventListener("hashchange", route);
  if ("ResizeObserver" in window) new ResizeObserver(() => movePill(false)).observe(nav);
  window.addEventListener("resize", () => movePill(false));
  document.fonts?.ready.then(() => movePill(false));
  route();
  movePill(false);
})();
