(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const icon = (name, cls = "") => `<svg class="ic ${cls}"><use href="#i-${name}"/></svg>`;
  const safe = (fn) => { try { return fn(); } catch { return null; } };

  /* ---------- Deterministic pseudo-random ---------- */
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  /* ---------- Header text ---------- */
  const now = new Date();
  const hour = now.getHours();
  $("#greeting").textContent = `Chào buổi ${hour < 12 ? "sáng" : hour < 18 ? "chiều" : "tối"}, Alex`;
  $("#today").textContent = `${now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })} · Tổng quan`;
  $("#footDate").textContent = now.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });

  /* ---------- Count-up numbers ---------- */
  $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count, prefix = el.dataset.prefix || "";
    const t0 = performance.now(), dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(end * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* ---------- Sparkline (orders today) ---------- */
  (() => {
    const r = rng(7), pts = Array.from({ length: 16 }, (_, i) => 18 + Math.sin(i / 1.9) * 7 + r() * 8 - i * 0.1);
    const w = 120, h = 36, max = Math.max(...pts), min = Math.min(...pts);
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * w, h - 4 - ((v - min) / (max - min)) * (h - 10)]);
    const d = smooth(xy);
    $("#spark").innerHTML = `<path class="fill" d="${d} L${w},${h} L0,${h}Z"/><path class="line" d="${d}"/>`;
  })();

  /* ---------- Smooth path (Catmull-Rom → Bézier) ---------- */
  function smooth(p) {
    if (p.length < 2) return "";
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, k = 0.18;
      d += ` C${p1[0] + (p2[0] - p0[0]) * k},${p1[1] + (p2[1] - p0[1]) * k} ${p2[0] - (p3[0] - p1[0]) * k},${p2[1] - (p3[1] - p1[1]) * k} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  /* ---------- Sales chart ---------- */
  const months = ["Th11", "Th12", "Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10"];
  const build = (n, base, amp, trend, seed, labeler) => {
    const r = rng(seed);
    const cur = Array.from({ length: n }, (_, i) => Math.max(0, base + trend * i + Math.sin(i * 0.9 + seed) * amp + (r() - 0.5) * amp * 0.9));
    const prev = cur.map((v, i) => Math.max(0, v * (0.78 + Math.sin(i * 0.6 + seed) * 0.08) - amp * 0.25));
    return { cur, prev, labels: Array.from({ length: n }, (_, i) => labeler(i, n)) };
  };
  const dayLabel = (i, n) => { const d = new Date(now); d.setDate(d.getDate() - (n - 1 - i)); return d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }); };
  const DATA = {
    "12M": { ...build(12, 15000, 3500, 700, 3, (i) => months[i]), unit: "month", tick: (i) => i % 2 === 0 },
    "6M": { ...build(26, 18000, 3000, 220, 5, dayLabel), unit: "week", tick: (i, n) => i % 5 === 0 || i === n - 1 },
    "30D": { ...build(30, 700, 220, 6, 9, dayLabel), unit: "day", tick: (i, n) => i % 5 === 0 || i === n - 1 },
    "7D": { ...build(7, 760, 200, 20, 12, dayLabel), unit: "day", tick: () => true },
  };
  let range = "12M", compare = true;

  const chartEl = $("#chart"), tip = $("#tip");
  function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 4 ? 4 : f <= 5 ? 5 : 10) * p; }
  const short = (v) => (v >= 1000 ? "$" + +(v / 1000).toFixed(1) + "k" : "$" + Math.round(v));

  function renderChart() {
    const d = DATA[range], W = Math.max(320, chartEl.clientWidth), H = Math.max(260, chartEl.clientHeight);
    const m = { l: 38, r: 8, t: 10, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const top = niceMax(Math.max(...d.cur, ...(compare ? d.prev : [0])) * 1.05), steps = 4;
    const x = (i) => m.l + (i / (d.cur.length - 1)) * iw, y = (v) => m.t + ih - (v / top) * ih;
    const pts = d.cur.map((v, i) => [x(i), y(v)]), prevPts = d.prev.map((v, i) => [x(i), y(v)]);
    const line = smooth(pts);
    let g = "";
    for (let i = 0; i <= steps; i++) {
      const v = (top / steps) * i, yy = y(v);
      g += `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/><text class="axis" x="0" y="${yy + 4}">${short(v)}</text>`;
    }
    const xs = d.labels.map((l, i) => (d.tick(i, d.labels.length) ? `<text class="axis" x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === d.labels.length - 1 ? "end" : "middle"}">${l}</text>` : "")).join("");
    chartEl.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Biểu đồ doanh số">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7bff" stop-opacity=".42"/><stop offset="1" stop-color="#2f7bff" stop-opacity="0"/></linearGradient>
        </defs>
        ${g}${xs}
        ${compare ? `<path class="prev" d="${smooth(prevPts)}"/>` : ""}
        <path d="${line} L${x(d.cur.length - 1)},${m.t + ih} L${m.l},${m.t + ih}Z" fill="url(#area)"/>
        <path class="line" d="${line}"/>
        <line class="cursor" id="cur" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" style="display:none"/>
        <circle class="pt" id="dot" r="5" style="display:none"/>
        <rect class="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}"/>
      </svg>`;
    const svg = $("svg", chartEl), hit = $(".hit", svg), cur = $("#cur", svg), dot = $("#dot", svg);
    const show = (e) => {
      const b = svg.getBoundingClientRect(), px = ((e.clientX - b.left) / b.width) * W;
      const i = Math.max(0, Math.min(d.cur.length - 1, Math.round(((px - m.l) / iw) * (d.cur.length - 1))));
      cur.setAttribute("x1", x(i)); cur.setAttribute("x2", x(i)); cur.style.display = "";
      dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(d.cur[i])); dot.style.display = "";
      tip.innerHTML = `<b>${money(d.cur[i])}</b><span>${d.labels[i]}${compare ? ` · năm ngoái ${money(d.prev[i])}` : ""}</span>`;
      tip.style.left = Math.min(innerWidth - 180, e.clientX + 14) + "px";
      tip.style.top = e.clientY - 56 + "px";
      tip.classList.add("show");
    };
    hit.addEventListener("pointermove", show);
    hit.addEventListener("pointerleave", () => { cur.style.display = dot.style.display = "none"; tip.classList.remove("show"); });
    const total = d.cur.reduce((a, b) => a + b, 0), prevTotal = d.prev.reduce((a, b) => a + b, 0);
    $("#rangeSummary").innerHTML = `${money(total)} trong khoảng này · <span style="color:var(--green);font-weight:700">+${Math.round((total / prevTotal - 1) * 100)}%</span> so với giai đoạn trước`;
  }
  $$("#rangeSeg button").forEach((b) => b.addEventListener("click", () => {
    range = b.dataset.range;
    $$("#rangeSeg button").forEach((x) => x.classList.toggle("on", x === b));
    renderChart();
  }));
  $("#compareBtn").addEventListener("click", (e) => {
    compare = !compare;
    e.currentTarget.classList.toggle("on", compare);
    e.currentTarget.setAttribute("aria-pressed", compare);
    renderChart();
  });
  if ("ResizeObserver" in window) { let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(renderChart, 60); }).observe(chartEl); }
  renderChart();

  /* ---------- Goal ring ---------- */
  requestAnimationFrame(() => setTimeout(() => {
    const pct = 3420 / 24000, c = 2 * Math.PI * 46;
    $("#ringVal").style.strokeDasharray = c;
    $("#ringVal").style.strokeDashoffset = c * (1 - Math.max(pct, 0.02));
    $("#ringPct").textContent = Math.round(pct * 100) + "%";
  }, 120));

  /* ---------- Live visitors ---------- */
  (() => {
    const bars = $("#bars"), r = rng(21), n = 32;
    const vals = Array.from({ length: n }, () => 35 + r() * 65);
    bars.innerHTML = vals.map((v) => `<i style="height:${v}%"></i>`).join("");
    let count = 45;
    setInterval(() => {
      vals.shift(); vals.push(30 + Math.random() * 70);
      $$("i", bars).forEach((el, i) => (el.style.height = vals[i] + "%"));
      count = Math.max(28, Math.min(70, count + Math.round(Math.random() * 4 - 2)));
      $("#visitors").textContent = count;
    }, 2600);
  })();

  /* ---------- Lists ---------- */
  const { PRODUCTS, CATEGORIES, isLow } = window.NIMBUS;
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const toneClass = { blue: "g-blue", red: "g-red", green: "g-green", violet: "g-blue", amber: "g-amber", teal: "g-green" };
  const catIcon = (p) => CATEGORIES[p.cat].icon;
  const catTone = (p) => toneClass[CATEGORIES[p.cat].tone];

  const QUEUE = [
    { i: "SM", c: "a1", n: "Sofia Marin", o: "HC-20418", items: ["NB-101", "AC-201"], t: 1158 },
    { i: "DR", c: "a2", n: "Dev Rao", o: "HC-20417", items: ["NB-104", "AC-204", "AC-203"], t: 1507 },
    { i: "LB", c: "a3", n: "Lena Brandt", o: "HC-20416", items: ["NB-110"], t: 399 },
  ];
  $("#queueList").innerHTML = QUEUE.map((q) => `
    <li><span class="avatar ${q.c}">${q.i}</span>
      <div class="meta"><strong>${q.n}</strong><small>${q.o} · ${q.items.length} sản phẩm</small></div>
      <span class="price">${money(q.t)}</span>
      <button class="pill-btn" data-pack>${icon("box")}<span>Đóng gói</span></button></li>`).join("");
  $("#queueList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pack]"); if (!b) return;
    b.querySelector("span").textContent = "Đã đóng gói"; b.style.color = "var(--green)";
  });

  const LOW = PRODUCTS.filter(isLow).sort((a, b) => a.stock / a.reorder - b.stock / b.reorder).slice(0, 4);
  $("#lowList").innerHTML = LOW.map((p) => `
    <li><span class="glyph ${catTone(p)}">${icon(catIcon(p))}</span>
      <div class="meta"><strong>${p.name}</strong><small>Còn ${p.stock} · mức đặt ${p.reorder}</small></div>
      <span class="meter"><i class="${p.stock === 0 ? "low" : ""}" style="width:${Math.max(6, (p.stock / p.reorder) * 100)}%"></i></span>
      <button class="pill-btn" data-restock>Nhập hàng</button></li>`).join("");
  $("#lowList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-restock]"); if (!b) return;
    b.textContent = "Đã đặt"; b.style.color = "var(--green)"; b.disabled = true;
  });

  const SRC = [
    { n: "Cửa hàng web", p: 61, a: 16110, c: "#2f7bff" },
    { n: "Instagram", p: 17, a: 4490, c: "#f5b53d" },
    { n: "Showroom", p: 5, a: 1320, c: "#31d6a2" },
    { n: "Bán sỉ", p: 17, a: 4490, c: "#aab3c8" },
  ];
  $("#stack").innerHTML = SRC.map((s) => `<i style="flex:${s.p};background:${s.c}"></i>`).join("");
  $("#legend").innerHTML = SRC.map((s) => `<li><i class="sw" style="background:${s.c}"></i><span>${s.n}</span><span class="pct">${s.p}%</span><span class="amt">${money(s.a)}</span></li>`).join("");

  const ORDERS = [
    { id: "HC-20421", c: "a4", i: "EB", n: "Elena Brooks", loc: "Portland, OR", it: ["NB-102", "AC-204"], w: "28 phút trước", t: 788, s: ["wait", "Chờ thanh toán"] },
    { id: "HC-20420", c: "a5", i: "RI", n: "Rahul Iyer", loc: "Austin, TX", it: ["NB-106"], w: "44 phút trước", t: 699, s: ["wait", "Chờ thanh toán"] },
    { id: "HC-20418", c: "a1", i: "SM", n: "Sofia Marin", loc: "Oakland, CA", it: ["NB-101", "AC-201"], w: "1 giờ trước", t: 1158, s: ["pack", "Cần đóng gói"] },
    { id: "HC-20417", c: "a2", i: "DR", n: "Dev Rao", loc: "Seattle, WA", it: ["NB-104", "AC-204", "AC-203"], w: "2 giờ trước", t: 1507, s: ["pack", "Cần đóng gói"] },
    { id: "HC-20416", c: "a3", i: "LB", n: "Lena Brandt", loc: "Boise, ID", it: ["NB-110"], w: "3 giờ trước", t: 399, s: ["pack", "Cần đóng gói"] },
    { id: "HC-20415", c: "a6", i: "TN", n: "Tomas Novak", loc: "Brooklyn, NY", it: ["NB-112", "AC-206", "AC-202"], w: "3 giờ trước", t: 2367, s: ["done", "Đã đóng gói"] },
  ];
  $("#ordersBody").innerHTML = ORDERS.map((o) => `
    <tr tabindex="0"><td><span class="id">${o.id}</span></td>
      <td><div class="cust"><span class="avatar ${o.c}">${o.i}</span><div><strong>${o.n}</strong><small>${o.loc}</small></div></div></td>
      <td><span class="items">${o.it.map((id) => { const p = byId(id); return `<span class="glyph ${catTone(p)}" title="${p.name}">${icon(catIcon(p))}</span>`; }).join("")}</span></td>
      <td class="when">${o.w}</td><td class="r price">${money(o.t)}</td>
      <td><span class="status s-${o.s[0]}">${o.s[1]}</span></td></tr>`).join("");
  $("#ordersBody").addEventListener("click", (e) => {
    const tr = e.target.closest("tr"); if (!tr) return;
    $$("tr", $("#ordersBody")).forEach((r) => (r.style.background = ""));
    tr.style.background = "var(--field-hover)";
  });

  const BEST = [...PRODUCTS].filter((p) => p.status === "active").sort((a, b) => b.sold - a.sold).slice(0, 5);
  const maxU = Math.max(...BEST.map((b) => b.sold));
  $("#rank").innerHTML = BEST.map((b, i) => `
    <li><span class="n">${i + 1}</span><span class="glyph ${catTone(b)}">${icon(catIcon(b))}</span>
      <div><strong>${b.name}</strong><small>${money(b.lifetimeUnits * b.price)} tổng cộng</small><div class="bar"><i style="width:0" data-w="${(b.sold / maxU) * 100}"></i></div></div>
      <span class="units">${b.sold}</span></li>`).join("");
  setTimeout(() => $$("#rank .bar i").forEach((el) => (el.style.width = el.dataset.w + "%")), 150);

  /* ---------- Theme + sidebar ---------- */
  const root = document.documentElement, sw = $("#themeSwitch");
  const setTheme = (t) => {
    root.dataset.theme = t; sw.setAttribute("aria-checked", t === "dark");
    safe(() => localStorage.setItem("nimbus-theme", t));
  };
  setTheme(safe(() => localStorage.getItem("nimbus-theme")) || "dark");
  sw.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  $("#collapseBtn").addEventListener("click", () => { document.body.classList.toggle("rail"); setTimeout(renderChart, 80); });

})();
