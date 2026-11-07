-- =====================================================================
-- find THIS — ตัวอย่าง query 5 ตัว (ใช้กับ docs/sample-data.sql)
-- ราคาทั้งหมดเป็นข้อมูลจำลอง (MOCK DATA)
--
-- เงื่อนไขที่ต้องมี และ query ที่ใช้
--   GROUP BY      : Q1, Q2, Q4, Q5
--   MIN/MAX/AVG   : Q2 (MIN, MAX, AVG), Q4 (MIN, AVG), Q5 (MIN)
--   Subquery      : Q3 (correlated subquery), Q4 (subquery ใน HAVING)
--   JOIN          : Q1 (LEFT JOIN), Q2, Q3, Q4, Q5 (INNER JOIN หลายตาราง)
-- =====================================================================


-- Q1) จำนวนสินค้าในแต่ละหมวดหมู่ รวมหมวดที่ยังไม่มีสินค้า
--     LEFT JOIN + GROUP BY + COUNT
SELECT c.name        AS category,
       COUNT(p.id)   AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY product_count DESC, c.name;


-- Q2) ราคาต่ำสุด / สูงสุด / เฉลี่ย ของสินค้าแต่ละชิ้นจากทุกร้าน
--     JOIN + GROUP BY + MIN / MAX / AVG
SELECT p.name                       AS product,
       COUNT(l.id)                  AS store_count,
       MIN(l.price)                 AS min_price,
       MAX(l.price)                 AS max_price,
       ROUND(AVG(l.price), 2)       AS avg_price,
       MAX(l.price) - MIN(l.price)  AS price_gap
FROM products p
JOIN listings l ON l.product_id = p.id
GROUP BY p.id, p.name
ORDER BY price_gap DESC;


-- Q3) ร้านที่ขายถูกที่สุดของสินค้าแต่ละชิ้น
--     JOIN + correlated subquery (หา MIN ของสินค้าชิ้นเดียวกัน)
SELECT p.name         AS product,
       s.name         AS cheapest_store,
       l.price        AS price,
       l.shipping_info
FROM listings l
JOIN products p ON p.id = l.product_id
JOIN stores   s ON s.id = l.store_id
WHERE l.price = (
    SELECT MIN(l2.price)
    FROM listings l2
    WHERE l2.product_id = l.product_id
)
ORDER BY p.name;


-- Q4) หมวดหมู่ที่ราคาเฉลี่ยสูงกว่าราคาเฉลี่ยของทุก listing
--     JOIN + GROUP BY + AVG / MIN + subquery ใน HAVING
SELECT c.name                   AS category,
       COUNT(l.id)              AS listing_count,
       MIN(l.price)             AS min_price,
       ROUND(AVG(l.price), 2)   AS avg_price
FROM categories c
JOIN products p ON p.category_id = c.id
JOIN listings l ON l.product_id = p.id
GROUP BY c.id, c.name
HAVING AVG(l.price) > (SELECT AVG(price) FROM listings)
ORDER BY avg_price DESC;


-- Q5) รายการโปรดของสมาชิก พร้อมหมวดหมู่และราคาถูกที่สุดของสินค้านั้น
--     JOIN 4 ตาราง + GROUP BY + MIN (เฉพาะบัญชีที่ active)
SELECT u.display_name   AS member,
       p.name           AS favorite_product,
       c.name           AS category,
       MIN(l.price)     AS lowest_price,
       f.created_at::date AS saved_on
FROM favorites f
JOIN users      u ON u.id = f.user_id
JOIN products   p ON p.id = f.product_id
JOIN categories c ON c.id = p.category_id
JOIN listings   l ON l.product_id = p.id
WHERE u.status = 'active'
GROUP BY u.id, u.display_name, p.id, p.name, c.name, f.created_at
ORDER BY u.display_name, lowest_price;
