import type { AdminData } from "../types/index.js";
import { isPromoEnded } from "../utils/promo.js";

/** Mock stock / promotion examples so both statuses show up in demo mode. */
const demoOfferStatus: Record<string, { in_stock?: boolean; promo_ends_at?: string }> = {
  "o-005": { in_stock: false },
  "o-012": { promo_ends_at: "2026-11-01" },
  "o-018": { promo_ends_at: "2026-12-31" },
  "o-021": { in_stock: false },
};

export const demoData: AdminData = {
  products: [
    { id: "p-001", name: "Razer DeathAdder V3 เมาส์เกมมิ่ง", brand: "Razer", category: "เมาส์", description: "เมาส์เกมมิ่งแบบมีสาย น้ำหนักเบา พร้อมเซนเซอร์ Focus Pro 30K และรองรับ polling rate สูงสุด 8,000 Hz", image_url: "https://assets2.razerzone.com/images/pnx.assets/b993b88204244288b62d053375f5be2e/razer-deathadder-v3-og-image.webp", emoji: "🖱️", specs: ["น้ำหนัก 59 กรัม", "เซนเซอร์ Focus Pro 30K", "Polling rate สูงสุด 8,000 Hz"], created_at: "2026-10-12" },
    { id: "p-002", name: "Keychron K2 Pro คีย์บอร์ดกลไกไร้สาย", brand: "Keychron", category: "คีย์บอร์ด", description: "คีย์บอร์ดกลไกไร้สายขนาด 75% รองรับ QMK/VIA และเชื่อมต่อได้ทั้ง Bluetooth กับ USB-C", image_url: "https://www.keychron.com/cdn/shop/products/Keychron-K2-Pro-QMK-VIA-Wireless-Mechanical-Keyboard-for-Mac-Windows-PBT-keycaps-PCB-screw-in-stabilizer-hot-swappable-red-switch_7f3edd88-59f3-4516-b953-05cdc3d3bece.jpg?crop=center&height=1200&v=1671268326&width=1200", emoji: "⌨️", specs: ["Layout 75% พร้อม QMK/VIA", "Bluetooth และ USB-C", "แบตเตอรี่ 4,000 mAh"], created_at: "2026-10-10" },
    { id: "p-003", name: "Logitech MX Master 3S เมาส์ไร้สาย", brand: "Logitech", category: "เมาส์", description: "เมาส์ไร้สายพร้อม Quiet Clicks, ล้อเลื่อน MagSpeed และเซนเซอร์ที่ติดตามได้บนพื้นผิวกระจก", image_url: "https://resource.logitech.com/w_1440,h_660,ar_24:11,c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/mx-master-3s-graphite-ident.jpg", emoji: "🖱️", specs: ["ติดตามการเคลื่อนไหวสูงสุด 8,000 DPI", "Quiet Clicks", "ล้อ MagSpeed"], created_at: "2026-10-08" },
    { id: "p-004", name: "ASUS ROG Zephyrus G14 โน้ตบุ๊กเกมมิ่ง", brand: "ASUS", category: "โน้ตบุ๊ก", description: "โน้ตบุ๊กเกมมิ่งขนาด 14 นิ้ว รุ่นปี 2024 มีตัวเลือกจอ OLED 3K 120 Hz และสเปกสูงสุด Ryzen 9 8945HS กับ RTX 4070", image_url: "https://dlcdnwebimgs.asus.com/gain/E0275281-F18B-42C3-A025-3331C35A888F", emoji: "💻", specs: ["จอ OLED 3K 120 Hz (ขึ้นกับรุ่นย่อย)", "ตัวเลือกสูงสุด Ryzen 9 8945HS / RTX 4070", "RAM สูงสุด 32 GB / SSD 1 TB"], created_at: "2026-10-04" },
    { id: "p-005", name: "Sony WH-1000XM5 หูฟังไร้สาย", brand: "Sony", category: "หูฟัง", description: "หูฟังครอบหูไร้สายพร้อมระบบตัดเสียงรบกวนแบบปรับได้ ไมโครโฟนสนทนา และแบตเตอรี่ใช้งานได้นาน", image_url: "https://www.sony.jp/products/picture/WH-1000XM5.jpg", emoji: "🎧", specs: ["ตัดเสียงรบกวนแบบปรับได้", "แบตเตอรี่สูงสุด 30 ชั่วโมง", "Bluetooth พร้อม multipoint"], created_at: "2026-10-02" },
    { id: "p-006", name: "Apple Watch Series 9 สมาร์ทวอทช์", brand: "Apple", category: "สมาร์ทวอทช์", description: "สมาร์ทวอทช์พร้อมชิป S9, หน้าจอ Retina แบบ Always-On และฟีเจอร์ Double Tap", image_url: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png", emoji: "⌚", specs: ["ชิป S9 SiP", "หน้าจอ Retina แบบ Always-On", "ตรวจวัดอัตราการเต้นหัวใจและ ECG"], created_at: "2026-09-29" },
    { id: "p-007", name: "Nike Air Zoom Pegasus 42 รองเท้าวิ่ง", brand: "Nike", category: "รองเท้า", description: "รองเท้าวิ่งถนนสำหรับผู้ใหญ่ ใช้โฟม ReactX และ Air Zoom เพื่อรองรับแรงส่งและการวิ่งในชีวิตประจำวัน", image_url: "https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/4e0808c8-d910-47eb-91d1-d0dc3902114c/AIR+ZOOM+PEGASUS+42.png", emoji: "👟", specs: ["พื้นโฟม ReactX", "Air Zoom ที่ส้นและปลายเท้า", "อัปเปอร์ engineered mesh"], created_at: "2026-09-27" },
    { id: "p-008", name: "AirPods Pro 2 หูฟังไร้สาย", brand: "Apple", category: "หูฟัง", description: "หูฟังไร้สายพร้อมชิป H2, ระบบตัดเสียงรบกวนแบบแอ็กทีฟ และเคสชาร์จ MagSafe แบบ USB-C", image_url: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111851_sp880-airpods-Pro-2nd-gen.png", emoji: "🎵", specs: ["ชิป H2 และ Active Noise Cancellation", "เคสชาร์จ USB-C พร้อม MagSafe", "ทนน้ำและเหงื่อระดับ IP54"], created_at: "2026-09-23" },
    { id: "p-009", name: "Xiaomi 22.5W Power Bank 10000mAh พาวเวอร์แบงก์ชาร์จเร็ว", brand: "Xiaomi", category: "พาวเวอร์แบงก์", description: "พาวเวอร์แบงก์ขนาดพกพา ความจุ 10,000 mAh รองรับชาร์จเร็ว 22.5W มีพอร์ต USB-C และ USB-A ชาร์จได้พร้อมกันหลายเครื่อง", image_url: "https://i02.appmifile.com/mi-com-product/fly-birds/xiaomi-22-5w-power-bank-10000/74ff53fbcd4ec9eb1b4105cff282def0.png", emoji: "🔋", specs: ["ความจุ 10,000 mAh", "ชาร์จเร็วสองทาง 22.5W", "พอร์ต USB-C และ USB-A"], created_at: "2026-11-06" },
    { id: "p-010", name: "UGREEN สายชาร์จ USB-C to USB-C 100W ยาว 2 เมตร", brand: "UGREEN", category: "สายชาร์จ", description: "สายชาร์จ Type-C ทั้งสองฝั่ง หุ้มด้วยไนลอนถัก รองรับ Power Delivery สูงสุด 100W ใช้ได้กับโน้ตบุ๊ก แท็บเล็ต และสมาร์ทโฟน", image_url: "https://cdn.shopify.com/s/files/1/0785/4181/6027/files/5ff90aec33a64ae6ff24a68e0b37ae1b.webp?v=1793957418&width=800", emoji: "🔌", specs: ["รองรับ PD สูงสุด 100W", "ความยาว 2 เมตร", "สายถักไนลอน ทนการหักงอ"], created_at: "2026-11-05" },
    { id: "p-011", name: "Dell S2721DS จอคอมพิวเตอร์ 27 นิ้ว QHD", brand: "Dell", category: "จอคอมพิวเตอร์", description: "จอคอมพิวเตอร์ 27 นิ้ว ความละเอียด QHD 2560 × 1440 พาเนล IPS รีเฟรชเรต 75Hz รองรับ AMD FreeSync พร้อมลำโพงในตัว", image_url: "https://i.dell.com/is/image/DellContent//content/dam/ss2/product-images/peripherals/output-devices/dell/monitors/s-series/s2721ds/pdp/73402-s2721ds-monitor-pdp-hero.jpg?fmt=jpg&wid=800&hei=556", emoji: "🖥️", specs: ["27 นิ้ว QHD 2560 × 1440 IPS", "รีเฟรชเรต 75Hz + AMD FreeSync", "HDMI 1.4 × 2, DisplayPort 1.2"], created_at: "2026-11-04" },
  ],
  offers: [
    ["o-001", "p-001", "Shopee", 2190, 2590, "ส่งฟรี"], ["o-002", "p-001", "Lazada", 2290, 2590, "ส่งฟรี"], ["o-003", "p-001", "Amazon", 2450, 2790, "ส่ง ฿45"],
    ["o-004", "p-002", "Shopee", 3690, 3990, "ส่งฟรี"], ["o-005", "p-002", "Lazada", 3790, 3990, "ส่ง ฿35"],
    ["o-006", "p-003", "Shopee", 3290, 3990, "ส่งฟรี"], ["o-007", "p-003", "Lazada", 3490, 3990, "ส่งฟรี"], ["o-008", "p-003", "Amazon", 3590, 3990, "ส่ง ฿60"],
    ["o-009", "p-004", "Shopee", 45900, 49900, "ส่งฟรี"], ["o-010", "p-004", "Lazada", 46900, 49900, "ส่งฟรี"],
    ["o-011", "p-005", "Shopee", 9990, 11990, "ส่งฟรี"], ["o-012", "p-005", "Lazada", 10490, 11990, "ส่งฟรี"],
    ["o-013", "p-006", "Shopee", 13900, 14900, "ส่งฟรี"], ["o-014", "p-006", "Lazada", 14290, 14900, "ส่งฟรี"],
    ["o-015", "p-007", "Shopee", 4290, 4990, "ส่งฟรี"], ["o-016", "p-007", "Lazada", 4490, 4990, "ส่ง ฿30"],
    ["o-017", "p-008", "Shopee", 7490, 8990, "ส่งฟรี"], ["o-018", "p-008", "Lazada", 7790, 8990, "ส่งฟรี"],
    ["o-019", "p-009", "Shopee", 590, 790, "ส่งฟรี"], ["o-020", "p-009", "Lazada", 629, 790, "ส่งฟรี"], ["o-021", "p-009", "Amazon", 690, 850, "ส่ง ฿45"],
    ["o-022", "p-010", "Shopee", 349, 459, "ส่งฟรี"], ["o-023", "p-010", "Lazada", 369, 459, "ส่ง ฿25"],
    ["o-024", "p-011", "Shopee", 8490, 9990, "ส่งฟรี"], ["o-025", "p-011", "Lazada", 8690, 9990, "ส่งฟรี"],
  ].map(([id, product_id, store, price, original_price, shipping_info]) => ({
    id: String(id),
    product_id: String(product_id),
    store: String(store) as AdminData["offers"][number]["store"],
    price: Number(price),
    original_price: Number(original_price),
    shipping_info: String(shipping_info),
    product_url: "#",
    updated_at: "วันนี้",
    in_stock: demoOfferStatus[String(id)]?.in_stock ?? true,
    promo_ends_at: demoOfferStatus[String(id)]?.promo_ends_at ?? null,
    promo_ended: isPromoEnded(demoOfferStatus[String(id)]?.promo_ends_at ?? null),
  })),
  users: [],
};
