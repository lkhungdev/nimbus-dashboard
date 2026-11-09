/* Dữ liệu mẫu dùng chung cho Tổng quan và Sản phẩm (toàn bộ là dữ liệu giả). */
(() => {
  "use strict";

  // Danh mục: khóa → { tên hiển thị, biểu tượng, tông màu }
  const CATEGORIES = {
    ultrabook: { name: "Ultrabook", icon: "laptop", tone: "blue" },
    gaming: { name: "Gaming", icon: "gamepad", tone: "red" },
    office: { name: "Văn phòng", icon: "briefcase", tone: "green" },
    creator: { name: "Đồ họa", icon: "palette", tone: "violet" },
    flip: { name: "2 trong 1", icon: "flip", tone: "amber" },
    acc: { name: "Phụ kiện", icon: "plug", tone: "teal" },
  };

  // [mã, tên, danh mục, kích thước/loại, cấu hình, giá bán, giá vốn, tồn kho, mức đặt lại, đã bán 30 ngày, trạng thái]
  const ROWS = [
    ["NB-101", "Aero Air 14", "ultrabook", "14″ OLED", "Core Ultra 7 · 16 GB · 512 GB SSD", 1099, 780, 210, 60, 115, "active"],
    ["NB-102", "Core Work 14", "office", "14″ FHD", "Core i5 · 16 GB · 512 GB SSD", 749, 540, 186, 50, 98, "active"],
    ["NB-103", "Aero Air 13", "ultrabook", "13.3″ 2.8K", "Core Ultra 5 · 16 GB · 512 GB SSD", 949, 690, 142, 40, 77, "active"],
    ["NB-104", "Forge 15 RTX", "gaming", "15.6″ 165 Hz", "Ryzen 7 · RTX 4060 · 16 GB · 1 TB SSD", 1399, 1040, 18, 30, 77, "active"],
    ["NB-105", "Aero Slim 15", "ultrabook", "15.6″ FHD", "Core Ultra 7 · 16 GB · 1 TB SSD", 1249, 910, 154, 40, 72, "active"],
    ["NB-106", "Core Work 15", "office", "15.6″ FHD", "Core i5 · 8 GB · 512 GB SSD", 699, 510, 96, 40, 70, "active"],
    ["NB-107", "Forge 16 RTX", "gaming", "16″ 240 Hz", "Core i9 · RTX 4070 · 32 GB · 1 TB SSD", 1899, 1420, 0, 20, 65, "active"],
    ["NB-108", "Core Business 14", "office", "14″ 2K", "Core i7 · 16 GB · 512 GB SSD", 999, 720, 128, 40, 63, "active"],
    ["NB-109", "Aero Pro 16", "ultrabook", "16″ 3K", "Core Ultra 9 · 32 GB · 1 TB SSD", 1599, 1180, 41, 25, 62, "active"],
    ["NB-110", "Core Edu 11", "office", "11.6″ HD", "Celeron · 8 GB · 128 GB eMMC", 399, 290, 77, 40, 57, "active"],
    ["NB-111", "Forge 14 Lite", "gaming", "14″ 144 Hz", "Ryzen 5 · RTX 4050 · 16 GB · 512 GB SSD", 1099, 820, 64, 25, 52, "active"],
    ["NB-112", "Studio 16 OLED", "creator", "16″ OLED 4K", "Core i9 · RTX 4070 · 32 GB · 2 TB SSD", 2199, 1650, 38, 15, 50, "active"],
    ["NB-113", "Forge 17 Titan", "gaming", "17.3″ 240 Hz", "Core i9 · RTX 4080 · 32 GB · 2 TB SSD", 2599, 1960, 9, 15, 48, "active"],
    ["NB-114", "Flip 13", "flip", "13.3″ cảm ứng", "Core i5 · 16 GB · 512 GB SSD", 1049, 760, 64, 25, 37, "active"],
    ["NB-115", "Flip 14 Pro", "flip", "14″ OLED cảm ứng", "Core Ultra 7 · 16 GB · 1 TB SSD", 1299, 960, 11, 20, 33, "active"],
    ["NB-116", "Studio Mini 14", "creator", "14.2″ mini-LED", "Ryzen 9 · 32 GB · 1 TB SSD", 1799, 1340, 27, 15, 27, "active"],
    ["NB-117", "Studio Pro 16", "creator", "16″ mini-LED", "Core i9 · RTX 4090 · 64 GB · 4 TB SSD", 2899, 2200, 14, 10, 22, "active"],
    ["AC-201", "Sạc GaN 100 W", "acc", "100 W", "2 cổng USB-C + 1 cổng USB-A", 59, 24, 300, 80, 31, "active"],
    ["AC-202", "Hub USB-C 8 trong 1", "acc", "8 cổng", "HDMI 4K, LAN, thẻ nhớ, USB 3.0", 49, 19, 120, 40, 29, "active"],
    ["AC-203", "Balo laptop 15.6″", "acc", "15.6″", "Chống nước, ngăn đệm êm", 69, 28, 88, 30, 25, "active"],
    ["AC-204", "Chuột không dây Aero", "acc", "Bluetooth", "Pin 90 ngày, cảm biến 4000 DPI", 39, 14, 150, 50, 24, "active"],
    ["AC-205", "Giá đỡ nhôm gập", "acc", "10–17″", "Nhôm nguyên khối, gập gọn", 45, 16, 17, 30, 20, "active"],
    ["AC-206", "SSD di động 1 TB", "acc", "1 TB", "USB 3.2, tốc độ đọc 1.050 MB/s", 119, 78, 46, 20, 18, "active"],
    ["NB-118", "Aero Fold 17 (bản nháp)", "flip", "17.3″ gập", "Core Ultra 9 · 32 GB · 1 TB SSD", 2399, 1800, 0, 10, 0, "draft"],
    ["NB-090", "Aero Air 12 (đời cũ)", "ultrabook", "12.5″ FHD", "Core i5 · 8 GB · 256 GB SSD", 599, 430, 4, 10, 0, "archived"],
  ];

  const PRODUCTS = ROWS.map(([id, name, cat, size, spec, price, cost, stock, reorder, sold, status]) => ({
    id, name, cat, size, spec, price, cost, stock, reorder, sold, status,
  }));

  // Doanh số cả đời (xác định theo mã để số liệu ổn định giữa các lần tải).
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  PRODUCTS.forEach((p) => {
    p.lifetimeUnits = p.sold === 0 ? (p.status === "archived" ? 140 : 0) : Math.round(p.sold * (2.4 + (hash(p.id) % 18) / 10));
  });

  const isLow = (p) => p.status !== "draft" && p.status !== "archived" && p.stock <= p.reorder;

  window.NIMBUS = { CATEGORIES, PRODUCTS, isLow };
})();
