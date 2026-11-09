(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mq = matchMedia("(max-width: 720px)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const body = document.body;
  const sidebar = $("#sidebar"), scrim = $("#menuScrim"), menuBtn = $("#menuBtn"), moreTab = $("#moreTab");
  const tabbar = $("#tabbar"), pill = $("#tabPill"), tabs = $$(".tab", tabbar);
  const TAB_ROUTES = ["dashboard", "orders", "products", "chats"];
  scrim.hidden = false;

  /* ---------- Ngăn kéo menu ---------- */
  function setMenu(open) {
    if (!mq.matches) open = false;
    body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    sidebar.inert = mq.matches && !open; // không cho Tab/đọc màn hình vào ngăn kéo đang ẩn
    if (open) $(".search input", sidebar)?.blur();
  }
  menuBtn.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  moreTab.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  scrim.addEventListener("click", () => setMenu(false));
  sidebar.addEventListener("click", (e) => { if (e.target.closest("a.nav-item")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // Vuốt sang trái trên ngăn kéo để đóng
  let sx = null, sy = 0;
  sidebar.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  sidebar.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = Math.abs(e.changedTouches[0].clientY - sy);
    if (dx < -60 && dy < 50) setMenu(false);
    sx = null;
  }, { passive: true });

  /* ---------- Thanh xanh trượt ở thanh tab ---------- */
  let placed = false;
  function movePill() {
    const active = $(".tab.active", tabbar);
    if (!mq.matches || !active || !active.offsetWidth) { pill.style.opacity = "0"; return; }
    const instant = !placed || reduce.matches;
    if (instant) pill.style.transition = "none";
    pill.style.opacity = "1";
    pill.style.width = active.offsetWidth + "px";
    pill.style.translate = `${active.offsetLeft}px ${active.offsetTop}px`;
    if (instant) { void pill.offsetWidth; pill.style.transition = ""; }
    placed = true;
  }

  /* ---------- Đồng bộ với trang hiện tại ---------- */
  const labelOf = (name) => $(`.nav-item[href="#/${name}"] span`)?.textContent ?? "Tổng quan";
  function sync() {
    const name = location.hash.replace(/^#\/?/, "").split("/")[0] || "dashboard";
    const key = TAB_ROUTES.includes(name) ? name : "more";
    tabs.forEach((t) => { const on = t.dataset.route === key; t.classList.toggle("active", on); if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
    $("#mTitle").textContent = labelOf(name);
    setMenu(false);
    movePill();
  }

  /* ---------- Lời chào + đường sparkline cho giao diện điện thoại ---------- */
  $("#mGreeting").textContent = $("#greeting").textContent;
  $("#mDate").textContent = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
  const spark = $("#spark"), firstStat = $(".stat");
  if (spark && firstStat) {
    const clone = spark.cloneNode(true);
    clone.removeAttribute("id"); clone.classList.add("spark-m");
    firstStat.appendChild(clone);
  }

  /* ---------- Ẩn thanh tab khi bảng chi tiết sản phẩm đang mở ---------- */
  const updateSheet = () => { const d = $("#drawer"); body.classList.toggle("sheet-open", !!d && !d.hidden); };
  new MutationObserver(updateSheet).observe(body, { attributes: true, subtree: true, attributeFilter: ["hidden"] });

  /* ---------- Khởi động ---------- */
  window.addEventListener("hashchange", sync);
  if ("ResizeObserver" in window) new ResizeObserver(() => movePill()).observe(tabbar);
  document.fonts?.ready.then(movePill);
  const onChange = () => { if (!mq.matches) { body.classList.remove("menu-open"); sidebar.inert = false; } else { body.classList.remove("rail"); setMenu(false); } placed = false; movePill(); };
  mq.addEventListener?.("change", onChange);
  if (mq.matches) body.classList.remove("rail");
  sidebar.inert = mq.matches;
  sync();
})();
