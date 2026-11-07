-- =====================================================================
-- find THIS — ข้อมูลตัวอย่าง (sample data) สำหรับงาน SQL
-- =====================================================================
-- * ข้อมูลทั้งหมดเป็นข้อมูลจำลอง (MOCK DATA) ราคาไม่ใช่ราคาจริงจากร้านค้า
--   และไม่ได้เชื่อมต่อ API ของ Shopee / Lazada / Amazon
-- * ทุกตารางมีอย่างน้อย 10 แถว
-- * สินค้า 11 ชิ้นและราคาของ Shopee / Lazada / Amazon ตรงกับข้อมูลเดโมบนเว็บ
-- * ร้านค้าที่มีคำว่า "(จำลอง)" เป็นร้านสมมติสำหรับงาน SQL เท่านั้น
--   (เว็บ find THIS แสดงเฉพาะ Shopee, Lazada, Amazon)
-- * password_hash เป็นค่าตัวอย่างที่ไม่ตรงกับรหัสผ่านใด ใช้เข้าสู่ระบบไม่ได้
--
-- วิธีใช้ (แนะนำให้ใช้ฐานข้อมูลแยก ไม่ใช่ฐานข้อมูลที่แอปใช้อยู่):
--   createdb findthis_sql_demo
--   psql -d findthis_sql_demo -f docs/schema-reference.sql
--   psql -d findthis_sql_demo -f docs/sample-data.sql
--   psql -d findthis_sql_demo -f docs/sample-queries.sql
-- =====================================================================

BEGIN;

-- 1) categories — 10 แถว ("แท็บเล็ต" ยังไม่มีสินค้า ใช้สาธิต LEFT JOIN)
INSERT INTO categories (id, name) VALUES
  (1, 'เมาส์'),
  (2, 'คีย์บอร์ด'),
  (3, 'โน้ตบุ๊ก'),
  (4, 'หูฟัง'),
  (5, 'สมาร์ทวอทช์'),
  (6, 'รองเท้า'),
  (7, 'พาวเวอร์แบงก์'),
  (8, 'สายชาร์จ'),
  (9, 'จอคอมพิวเตอร์'),
  (10, 'แท็บเล็ต');

-- 2) products — 11 แถว
INSERT INTO products (id, name, brand, category_id, description, emoji, created_at) VALUES
  (1,  'Razer DeathAdder V3 เมาส์เกมมิ่ง', 'Razer', 1, 'เมาส์เกมมิ่งแบบมีสาย น้ำหนักเบา เซนเซอร์ Focus Pro 30K', '🖱️', '2026-10-12'),
  (2,  'Keychron K2 Pro คีย์บอร์ดกลไกไร้สาย', 'Keychron', 2, 'คีย์บอร์ดกลไกไร้สาย 75% รองรับ QMK/VIA', '⌨️', '2026-10-10'),
  (3,  'Logitech MX Master 3S เมาส์ไร้สาย', 'Logitech', 1, 'เมาส์ไร้สาย Quiet Clicks ล้อ MagSpeed', '🖱️', '2026-10-08'),
  (4,  'ASUS ROG Zephyrus G14 โน้ตบุ๊กเกมมิ่ง', 'ASUS', 3, 'โน้ตบุ๊กเกมมิ่ง 14 นิ้ว จอ OLED 3K 120 Hz', '💻', '2026-10-04'),
  (5,  'Sony WH-1000XM5 หูฟังไร้สาย', 'Sony', 4, 'หูฟังครอบหูไร้สาย ตัดเสียงรบกวนแบบปรับได้', '🎧', '2026-10-02'),
  (6,  'Apple Watch Series 9 สมาร์ทวอทช์', 'Apple', 5, 'สมาร์ทวอทช์ชิป S9 หน้าจอ Always-On', '⌚', '2026-09-29'),
  (7,  'Nike Air Zoom Pegasus 42 รองเท้าวิ่ง', 'Nike', 6, 'รองเท้าวิ่งถนน โฟม ReactX และ Air Zoom', '👟', '2026-09-27'),
  (8,  'AirPods Pro 2 หูฟังไร้สาย', 'Apple', 4, 'หูฟังไร้สายชิป H2 พร้อม ANC', '🎵', '2026-09-23'),
  (9,  'Xiaomi 22.5W Power Bank 10000mAh พาวเวอร์แบงก์ชาร์จเร็ว', 'Xiaomi', 7, 'พาวเวอร์แบงก์ 10,000 mAh ชาร์จเร็ว 22.5W', '🔋', '2026-11-06'),
  (10, 'UGREEN สายชาร์จ USB-C to USB-C 100W ยาว 2 เมตร', 'UGREEN', 8, 'สาย Type-C รองรับ PD 100W สายถักไนลอน', '🔌', '2026-11-05'),
  (11, 'Dell S2721DS จอคอมพิวเตอร์ 27 นิ้ว QHD', 'Dell', 9, 'จอ 27 นิ้ว QHD IPS 75Hz AMD FreeSync', '🖥️', '2026-11-04');

-- 3) product_specs — 33 แถว (สินค้าละ 3 ข้อ)
INSERT INTO product_specs (product_id, spec_text, sort_order) VALUES
  (1, 'น้ำหนัก 59 กรัม', 0), (1, 'เซนเซอร์ Focus Pro 30K', 1), (1, 'Polling rate สูงสุด 8,000 Hz', 2),
  (2, 'Layout 75% พร้อม QMK/VIA', 0), (2, 'Bluetooth และ USB-C', 1), (2, 'แบตเตอรี่ 4,000 mAh', 2),
  (3, 'ติดตามการเคลื่อนไหวสูงสุด 8,000 DPI', 0), (3, 'Quiet Clicks', 1), (3, 'ล้อ MagSpeed', 2),
  (4, 'จอ OLED 3K 120 Hz (ขึ้นกับรุ่นย่อย)', 0), (4, 'ตัวเลือกสูงสุด Ryzen 9 8945HS / RTX 4070', 1), (4, 'RAM สูงสุด 32 GB / SSD 1 TB', 2),
  (5, 'ตัดเสียงรบกวนแบบปรับได้', 0), (5, 'แบตเตอรี่สูงสุด 30 ชั่วโมง', 1), (5, 'Bluetooth พร้อม multipoint', 2),
  (6, 'ชิป S9 SiP', 0), (6, 'หน้าจอ Retina แบบ Always-On', 1), (6, 'ตรวจวัดอัตราการเต้นหัวใจและ ECG', 2),
  (7, 'พื้นโฟม ReactX', 0), (7, 'Air Zoom ที่ส้นและปลายเท้า', 1), (7, 'อัปเปอร์ engineered mesh', 2),
  (8, 'ชิป H2 และ Active Noise Cancellation', 0), (8, 'เคสชาร์จ USB-C พร้อม MagSafe', 1), (8, 'ทนน้ำและเหงื่อระดับ IP54', 2),
  (9, 'ความจุ 10,000 mAh', 0), (9, 'ชาร์จเร็วสองทาง 22.5W', 1), (9, 'พอร์ต USB-C และ USB-A', 2),
  (10, 'รองรับ PD สูงสุด 100W', 0), (10, 'ความยาว 2 เมตร', 1), (10, 'สายถักไนลอน ทนการหักงอ', 2),
  (11, '27 นิ้ว QHD 2560 × 1440 IPS', 0), (11, 'รีเฟรชเรต 75Hz + AMD FreeSync', 1), (11, 'HDMI 1.4 × 2, DisplayPort 1.2', 2);

-- 4) stores — 10 แถว (3 ร้านที่เว็บรองรับ + 7 ร้านสมมติสำหรับงาน SQL)
INSERT INTO stores (id, name, base_url) VALUES
  (1,  'Shopee', 'https://shopee.co.th/'),
  (2,  'Lazada', 'https://www.lazada.co.th/'),
  (3,  'Amazon', 'https://www.amazon.com/'),
  (4,  'TechMart (จำลอง)', 'https://techmart.example.com/'),
  (5,  'GadgetHub (จำลอง)', 'https://gadgethub.example.com/'),
  (6,  'BuyDee (จำลอง)', 'https://buydee.example.com/'),
  (7,  'NextShop (จำลอง)', 'https://nextshop.example.com/'),
  (8,  'PriceBox (จำลอง)', 'https://pricebox.example.com/'),
  (9,  'MegaDeal (จำลอง)', 'https://megadeal.example.com/'),
  (10, 'SmartCart (จำลอง)', 'https://smartcart.example.com/');

-- 5) listings — 33 แถว (ราคาจำลอง)
--    id 1-25 ตรงกับข้อเสนอราคา o-001 ถึง o-025 บนเว็บ, id 26-33 เป็นร้านสมมติ
INSERT INTO listings (id, product_id, store_id, price, original_price, rating, reviews_count, shipping_info, product_url) VALUES
  (1,  1, 1,  2190.00,  2590.00, 4.8, 1520, 'ส่งฟรี', '#'),
  (2,  1, 2,  2290.00,  2590.00, 4.7,  860, 'ส่งฟรี', '#'),
  (3,  1, 3,  2450.00,  2790.00, 4.6,  310, 'ส่ง ฿45', '#'),
  (4,  2, 1,  3690.00,  3990.00, 4.8,  640, 'ส่งฟรี', '#'),
  (5,  2, 2,  3790.00,  3990.00, 4.7,  415, 'ส่ง ฿35', '#'),
  (6,  3, 1,  3290.00,  3990.00, 4.9, 2210, 'ส่งฟรี', '#'),
  (7,  3, 2,  3490.00,  3990.00, 4.8, 1180, 'ส่งฟรี', '#'),
  (8,  3, 3,  3590.00,  3990.00, 4.7,  540, 'ส่ง ฿60', '#'),
  (9,  4, 1, 45900.00, 49900.00, 4.7,  120, 'ส่งฟรี', '#'),
  (10, 4, 2, 46900.00, 49900.00, 4.6,   95, 'ส่งฟรี', '#'),
  (11, 5, 1,  9990.00, 11990.00, 4.9, 1730, 'ส่งฟรี', '#'),
  (12, 5, 2, 10490.00, 11990.00, 4.8,  920, 'ส่งฟรี', '#'),
  (13, 6, 1, 13900.00, 14900.00, 4.8,  780, 'ส่งฟรี', '#'),
  (14, 6, 2, 14290.00, 14900.00, 4.7,  455, 'ส่งฟรี', '#'),
  (15, 7, 1,  4290.00,  4990.00, 4.6,  690, 'ส่งฟรี', '#'),
  (16, 7, 2,  4490.00,  4990.00, 4.5,  330, 'ส่ง ฿30', '#'),
  (17, 8, 1,  7490.00,  8990.00, 4.9, 3050, 'ส่งฟรี', '#'),
  (18, 8, 2,  7790.00,  8990.00, 4.8, 1640, 'ส่งฟรี', '#'),
  (19, 9, 1,   590.00,   790.00, 4.7, 4120, 'ส่งฟรี', '#'),
  (20, 9, 2,   629.00,   790.00, 4.6, 2380, 'ส่งฟรี', '#'),
  (21, 9, 3,   690.00,   850.00, 4.5,  410, 'ส่ง ฿45', '#'),
  (22, 10, 1,  349.00,   459.00, 4.8, 2960, 'ส่งฟรี', '#'),
  (23, 10, 2,  369.00,   459.00, 4.7, 1270, 'ส่ง ฿25', '#'),
  (24, 11, 1, 8490.00,  9990.00, 4.7,  380, 'ส่งฟรี', '#'),
  (25, 11, 2, 8690.00,  9990.00, 4.6,  210, 'ส่งฟรี', '#'),
  (26, 3, 4,  3390.00,  3990.00, 4.5,   88, 'ส่ง ฿40', '#'),
  (27, 5, 5, 10290.00, 11990.00, 4.4,   64, 'ส่งฟรี', '#'),
  (28, 8, 6,  7590.00,  8990.00, 4.6,  150, 'ส่งฟรี', '#'),
  (29, 9, 7,   579.00,   790.00, 4.3,   72, 'ส่ง ฿30', '#'),
  (30, 10, 8,  339.00,   459.00, 4.2,   41, 'ส่ง ฿20', '#'),
  (31, 4, 9, 47500.00, 49900.00, 4.5,   23, 'ส่งฟรี', '#'),
  (32, 11, 10, 8790.00, 9990.00, 4.4,   37, 'ส่งฟรี', '#'),
  (33, 1, 4,  2350.00,  2590.00, 4.4,   56, 'ส่ง ฿40', '#');

-- 6) price_history — 18 แถว (ราคาย้อนหลังจำลอง 3 จุดต่อ listing)
-- สถานะสินค้าหมด / โปรโมชั่น (ตรงกับตัวอย่างบนเว็บ: o-005, o-021 หมด, o-012 หมดโปรแล้ว, o-018 โปรถึงสิ้นปี)
UPDATE listings SET in_stock = false WHERE id IN (5, 21, 31);
UPDATE listings SET promo_ends_at = '2026-11-01' WHERE id IN (12, 27);
UPDATE listings SET promo_ends_at = '2026-12-31' WHERE id IN (18, 28);

INSERT INTO price_history (listing_id, price, recorded_at) VALUES
  (1,  2390.00, '2026-10-08'), (1,  2290.00, '2026-10-22'), (1,  2190.00, '2026-11-05'),
  (6,  3590.00, '2026-10-08'), (6,  3390.00, '2026-10-22'), (6,  3290.00, '2026-11-05'),
  (9, 47900.00, '2026-10-08'), (9, 46900.00, '2026-10-22'), (9, 45900.00, '2026-11-05'),
  (11, 10990.00, '2026-10-08'), (11, 10490.00, '2026-10-22'), (11, 9990.00, '2026-11-05'),
  (17, 7990.00, '2026-10-08'), (17, 7690.00, '2026-10-22'), (17, 7490.00, '2026-11-05'),
  (19,  690.00, '2026-10-08'), (19,  629.00, '2026-10-22'), (19,  590.00, '2026-11-05');

-- 7) users — 10 แถว (แอดมิน 1 + ผู้ใช้ 9, รหัสผ่านใช้ไม่ได้จริง)
INSERT INTO users (id, email, password_hash, display_name, role, status, created_at) VALUES
  (1,  'admin@sample.findthis.test',  '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'คุณแอดมิน (ตัวอย่าง)', 'admin', 'active',  '2026-10-01'),
  (2,  'somchai@sample.findthis.test', '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'สมชาย',  'user', 'active',  '2026-10-03'),
  (3,  'suda@sample.findthis.test',    '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'สุดา',   'user', 'active',  '2026-10-05'),
  (4,  'anan@sample.findthis.test',    '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'อนันต์', 'user', 'active',  '2026-10-09'),
  (5,  'pim@sample.findthis.test',     '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'พิมพ์',  'user', 'active',  '2026-10-12'),
  (6,  'krit@sample.findthis.test',    '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'กฤต',    'user', 'active',  '2026-10-15'),
  (7,  'nok@sample.findthis.test',     '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'นก',     'user', 'pending', '2026-10-20'),
  (8,  'ploy@sample.findthis.test',    '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'พลอย',   'user', 'active',  '2026-10-24'),
  (9,  'tee@sample.findthis.test',     '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'ตี๋',     'user', 'active',  '2026-10-30'),
  (10, 'mint@sample.findthis.test',    '$2a$12$SampleOnlyNotARealPasswordHashCannotBeUsedToSignIn000', 'มิ้นท์',  'user', 'active',  '2026-11-02');

-- 8) search_history — 12 แถว
INSERT INTO search_history (user_id, keyword, searched_at) VALUES
  (2, 'เมาส์', '2026-11-01 09:15+07'),
  (2, 'logitech', '2026-11-01 09:17+07'),
  (3, 'หูฟัง', '2026-11-02 20:05+07'),
  (3, 'airpods', '2026-11-02 20:08+07'),
  (4, 'โน้ตบุ๊ก', '2026-11-03 12:30+07'),
  (5, 'power bank', '2026-11-03 18:42+07'),
  (6, 'คีย์บอร์ด', '2026-11-04 10:11+07'),
  (6, 'keychron', '2026-11-04 10:13+07'),
  (8, 'รองเท้าวิ่ง', '2026-11-05 07:55+07'),
  (9, 'จอคอม', '2026-11-05 21:20+07'),
  (10, 'สายชาร์จ', '2026-11-06 14:02+07'),
  (10, 'apple watch', '2026-11-06 14:06+07');

-- 9) favorites — 12 แถว
INSERT INTO favorites (user_id, product_id, created_at) VALUES
  (2, 3, '2026-11-01'), (2, 1, '2026-11-01'),
  (3, 5, '2026-11-02'), (3, 8, '2026-11-02'),
  (4, 4, '2026-11-03'),
  (5, 9, '2026-11-03'), (5, 10, '2026-11-03'),
  (6, 2, '2026-11-04'),
  (8, 7, '2026-11-05'),
  (9, 11, '2026-11-05'),
  (10, 6, '2026-11-06'), (10, 8, '2026-11-06');

-- 10) admin_audit_logs — 10 แถว (การกระทำของแอดมิน id 1)
INSERT INTO admin_audit_logs (actor_user_id, action, entity, entity_id, created_at) VALUES
  (1, 'create', 'product', '9',  '2026-11-04 10:00+07'),
  (1, 'create', 'product', '10', '2026-11-04 10:05+07'),
  (1, 'create', 'product', '11', '2026-11-04 10:10+07'),
  (1, 'create', 'offer',   '19', '2026-11-04 10:20+07'),
  (1, 'update', 'offer',   '1',  '2026-11-05 09:00+07'),
  (1, 'update', 'offer',   '6',  '2026-11-05 09:05+07'),
  (1, 'update', 'user',    '7',  '2026-11-05 15:30+07'),
  (1, 'view',   'user',    '2',  '2026-11-06 11:00+07'),
  (1, 'view',   'user',    '10', '2026-11-06 11:10+07'),
  (1, 'delete', 'offer',   '34', '2026-11-06 16:45+07');

-- ตั้งค่า sequence ให้ต่อจาก id ที่ใส่เอง เพื่อให้ INSERT ครั้งถัดไปไม่ชน
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores));
SELECT setval('listings_id_seq', (SELECT MAX(id) FROM listings));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

COMMIT;
