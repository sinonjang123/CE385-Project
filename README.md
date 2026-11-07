# find THIS

เว็บต้นแบบสำหรับค้นหาและเปรียบเทียบราคาสินค้าจาก Shopee, Lazada และ Amazon แยกเป็น 3 แอป: **เว็บผู้ใช้ (user)**, **หลังบ้าน (admin)** และ **API (backend)**

> **ราคาทั้งหมดเป็นข้อมูลจำลอง (Mock API)** ไม่ได้เชื่อมต่อร้านค้าจริง ห้ามใช้เป็นราคาซื้อขายจริง
>
> ปุ่มในหน้าเทียบราคา: ถ้า admin ใส่ `product_url` (ลิงก์สินค้า/affiliate) ของ offer ไว้ จะแสดง "ไปที่ร้าน" ถ้ายังไม่มีจะแสดง "ค้นหาใน Shopee/Lazada/Amazon" ซึ่งเปิดหน้าค้นหาชื่อสินค้าบนเว็บร้าน (`user/src/utils/storeLinks.ts`) ระบบไม่ได้ดึงข้อมูลจากเว็บร้านค้า การดึงลิงก์ affiliate อัตโนมัติต้องใช้ Affiliate API และ credentials ของแต่ละร้าน

## Tech stack

| แอป | Framework / Library |
| --- | --- |
| `user/` เว็บผู้ใช้ | React 19, TypeScript, Vite, Tailwind CSS 4, Axios, Zod |
| `admin/` หลังบ้าน | React 19, TypeScript, Vite, Tailwind CSS 4, Axios, Zod |
| `backend/` API | Node.js, Express 5, TypeScript, Zod, Prisma 7 + PostgreSQL, jose (JWT), bcryptjs, helmet, express-rate-limit |

## โครงสร้างโปรเจกต์

```
Project 385 new/
├── package.json         # npm workspaces: user, admin, backend
├── docs/                # ข้อกำหนด, ERD (DDL.pgerd สำหรับ pgAdmin, erd.svg / erd.png สำหรับสไลด์ ตรงกับฐานข้อมูลปัจจุบัน), PDF, SQL reference, sample-data.sql, sample-queries.sql
│
├── user/                # ── เว็บผู้ใช้  http://localhost:5173 ──
│   └── src/
│       ├── App.tsx      # session + สลับหน้า
│       ├── api/         # http.ts (Axios), schemas.ts (Zod), auth.api.ts, catalog.api.ts
│       ├── pages/       # Home, Compare, PriceSources, Profile, Login (สมัคร/เข้าสู่ระบบ)
│       ├── components/  # SiteHeader, Toast
│       ├── types/ utils/ data/
│       └── styles.css
│
├── admin/               # ── หลังบ้าน  http://localhost:5174 ──
│   └── src/
│       ├── App.tsx      # ยังไม่ล็อกอิน → LoginPage, เป็น admin → DashboardPage
│       ├── api/         # http.ts, schemas.ts, auth.api.ts (login + แลกรหัสส่งต่อจากเว็บผู้ใช้), admin.api.ts, health.api.ts
│       ├── pages/       # LoginPage, DashboardPage, OverviewPage
│       ├── components/  # AdminLayout, DataTable, RecordModal, Toast
│       ├── types/ utils/
│       └── styles.css
│
└── backend/             # ── API  http://localhost:3001 ──
    ├── prisma/          # schema.prisma, migrations/, seed.ts
    ├── test/
    └── src/
        ├── server.ts, app.ts, config/env.ts, db/prisma.ts
        ├── routes/
        │   ├── public/  # GET /api/health, /api/catalog, /api/mock/retailers
        │   ├── user/    # POST /api/auth/register, /login, GET /me, POST /api/auth/admin-handoff(/redeem)
        │   │            # GET/PATCH /api/account/profile (ชื่อ + รูปโปรไฟล์), POST /api/account/password
        │   │            # สมาชิก: /api/account/favorites, /api/account/searches, GET /api/account/price-history/:productId
        │   └── admin/   # /api/admin/*  (ตรวจสิทธิ์ admin ใน index.ts)
        │                # GET /api/admin/users/:id/view (View as User แบบอ่านอย่างเดียว)
        ├── middleware/  # requireUser / requireAdmin, rate limit, error handler
        ├── validators/  # Zod schemas
        ├── repositories/# user, catalog, audit
        └── services/ data/ types/ utils/
```

### การแยก user / admin

| | User (`user/`) | Admin (`admin/`) |
| --- | --- | --- |
| พอร์ต dev | 5173 | 5174 |
| บัญชี | สมัครเองได้ ได้ role `user` เสมอ | สร้างจาก env (`DEMO_ADMIN_*`) หรือ `db:seed` เท่านั้น ไม่มีหน้าสมัคร |
| Session | `sessionStorage` ของเว็บผู้ใช้ | `sessionStorage` แยกของหลังบ้าน (ส่งต่อจากเว็บผู้ใช้ได้ด้วยรหัสใช้ครั้งเดียว) |
| API ที่เรียก | `/api/catalog`, `/api/auth/*`, `/api/account/*` | `/api/auth/login`, `/api/auth/admin-handoff/redeem`, `/api/admin/*` |

- ทั้งสองแอปเรียก backend ตัวเดียวกันผ่าน Vite proxy `/api` → `localhost:3001`
- หน้าโปรไฟล์ (เว็บผู้ใช้): แก้ชื่อที่แสดง, เปลี่ยน/ลบรูปโปรไฟล์ (ย่อเป็น 256×256 JPEG ก่อนส่ง, backend รับเฉพาะ PNG/JPEG/WebP data URL ≤ 150,000 ตัวอักษร) และเปลี่ยนรหัสผ่านโดยต้องกรอกรหัสผ่านเดิม (ยังไม่มีการยืนยันทางอีเมล) `/api/account/*` แก้ได้เฉพาะบัญชีของ token ที่ล็อกอิน แก้ email/role/status ไม่ได้ ในโหมด in-memory ข้อมูลรูปและรหัสผ่านใหม่หายเมื่อรีสตาร์ต API
- ฟีเจอร์สมาชิก (ต้องล็อกอิน ข้อมูลแยกตามบัญชีจาก token):
  - **รายการโปรด** — ปุ่ม ♡ ที่การ์ดสินค้า/หน้าเทียบราคา ดูรวมในหน้าโปรไฟล์ (ตาราง `favorites`)
  - **ค้นหาล่าสุด** — บันทึกเมื่อกดค้นหา (ไม่ใช่ทุกตัวอักษร) เก็บ 10 คำล่าสุด ลบทีละคำหรือล้างทั้งหมดได้ (ตาราง `search_history`)
  - **ประวัติราคา 30 วัน** — **ข้อมูลจำลอง** สร้างจาก `services/mockPriceHistory.ts` ให้จุดสุดท้ายตรงกับราคาจำลองปัจจุบัน ไม่ได้อ่านจาก `price_history` เพราะตารางนั้นเก็บราคาที่ admin ตั้ง ไม่ใช่ราคาที่แสดงบนเว็บ (ราคาบนเว็บสุ่มจาก `services/mockRetailers.ts`) ผู้ที่ไม่ได้ล็อกอินจะเห็นการ์ดชวนสมัครแทน
  - ใช้ฐานข้อมูลต้องรัน migration `20261107120000_member_features` (`npx prisma migrate deploy` ใน `backend/`)
- หลังบ้านเปิดมาที่หน้า **Dashboard**: จำนวนสินค้า/ข้อเสนอ/ผู้ใช้ ส่วนลดเฉลี่ย สินค้าตามหมวด ร้านที่ราคาต่ำสุด ผู้ใช้ล่าสุด และกิจกรรมล่าสุดจาก audit log (ราคาเป็นข้อมูลจำลอง)
- **View as User** (ปุ่มรูปตาในตาราง App Users และในการ์ดผู้ใช้ล่าสุด): แสดงโปรไฟล์ รายการโปรด และคำค้นล่าสุดของผู้ใช้แบบ**อ่านอย่างเดียว** ไม่ได้ออก token ในนามผู้ใช้และแก้ไขแทนผู้ใช้ไม่ได้ ดูได้เฉพาะบัญชี role `user` ทุกครั้งที่เปิดดูบันทึก audit action `view` และตอบกลับด้วย `Cache-Control: no-store`
- **สินค้าหมด / หมดโปรโมชั่น** (ข้อมูลจำลอง): ข้อเสนอราคาแต่ละร้านมี `in_stock` และ `promo_ends_at` (วันสุดท้ายของโปร, ไม่บังคับ) ตั้งได้ในฟอร์มข้อเสนอราคาของหลังบ้าน backend คำนวณ `promo_ended` เองจากวันที่ปัจจุบันตามเวลาไทย (ไม่รับค่าจาก client) เมื่อหมดโปรแล้ว หน้าเว็บแสดงราคาปกติแทนราคาโปร ส่วนร้านที่สินค้าหมดยังแสดงในรายการ แต่ไม่นับเป็นราคาต่ำสุด/BEST ต้องรัน migration `20261108090000_listing_stock_promo` เมื่อใช้ฐานข้อมูล
- ตารางหลังบ้าน: ปุ่ม **ตัวกรอง** กรองตามหมวดหมู่ แบรนด์ ร้านค้า สถานะ (พร้อมขาย / มีโปรโมชั่น / หมดโปรโมชั่น / สินค้าหมด) บทบาท และสถานะบัญชี พร้อมจำนวนในแต่ละตัวเลือก ปุ่ม **คอลัมน์** ซ่อน/แสดงคอลัมน์ (จำไว้ใน `localStorage` ของเบราว์เซอร์นั้น)
- สิทธิ์ admin ตรวจที่ backend ทุกคำขอ (`middleware/auth.ts`) การเช็ก role ในหน้า admin login มีไว้แค่แสดงข้อความให้ผู้ใช้
- **แอดมินเข้าสู่ระบบจากเว็บผู้ใช้ → เปิด Dashboard ทันที** ไม่ต้องล็อกอินซ้ำ: เว็บผู้ใช้ขอรหัสส่งต่อจาก `POST /api/auth/admin-handoff` (ต้องเป็น admin ตรวจที่ backend) แล้วเปิด `VITE_ADMIN_URL/#handoff=<code>` หลังบ้านแลกรหัสที่ `POST /api/auth/admin-handoff/redeem` เป็น session ของตัวเอง รหัสสุ่ม ใช้ได้ครั้งเดียว หมดอายุใน 60 วินาที อยู่ใน fragment (ไม่ถูกส่งไปเซิร์ฟเวอร์) และถูกลบออกจาก URL ทันที JWT ไม่เคยอยู่ใน URL ปุ่ม "จัดการระบบ" ใช้วิธีเดียวกัน รหัสเก็บใน memory ของ API จึงใช้ได้กับ API instance เดียว
- ปุ่ม **View as User** ด้านบนของหลังบ้านเปิดเว็บผู้ใช้ (`VITE_SITE_URL` ค่าเริ่มต้น `http://localhost:5173`) ในแท็บใหม่ในมุมมองผู้เยี่ยมชม โดย Dashboard ยังเปิดและล็อกอินอยู่

## เริ่มใช้งาน

```bash
npm install
cp backend/.env.example backend/.env   # ใส่ DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD (≥ 12 ตัวอักษร)
npm run dev                            # รัน API + user + admin พร้อมกัน
```

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev:user` | รันเฉพาะเว็บผู้ใช้ (5173) |
| `npm run dev:admin` | รันเฉพาะหลังบ้าน (5174) |
| `npm run dev:api` | รันเฉพาะ backend (3001) |
| `npm run build` | build user → admin → backend |
| `npm test` | รัน backend tests (in-memory mode) |

ยังไม่มี lint script

## PostgreSQL (ไม่บังคับ)

ถ้าไม่ตั้ง `DATABASE_URL` ข้อมูลจะอยู่ใน memory และหายเมื่อรีสตาร์ต API ถ้าต้องการเก็บถาวร ให้ใส่ใน `backend/.env` ในรูปแบบ

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/findTHIS?schema=public"
JWT_SECRET=อย่างน้อย-32-ตัวอักษร
```

แล้วรัน:

```bash
npm run --workspace @find-this/api prisma:generate
npm run --workspace @find-this/api db:migrate
npm run --workspace @find-this/api db:seed
```

## SQL ตัวอย่าง (งาน SQL)

`docs/sample-data.sql` ใส่ข้อมูลจำลองอย่างน้อย 10 แถวทุกตาราง และ `docs/sample-queries.sql` มี query 5 ตัวที่ใช้ GROUP BY, MIN/MAX/AVG, subquery และ JOIN ร้านที่มีคำว่า "(จำลอง)" เป็นร้านสมมติสำหรับงาน SQL เท่านั้น เว็บยังแสดงแค่ Shopee, Lazada, Amazon แนะนำให้รันในฐานข้อมูลแยก:

```bash
createdb findthis_sql_demo
psql -d findthis_sql_demo -f docs/schema-reference.sql
psql -d findthis_sql_demo -f docs/sample-data.sql
psql -d findthis_sql_demo -f docs/sample-queries.sql
```

## งานที่ต้องทำก่อน production

1. ตั้ง PostgreSQL จริงและเก็บ secrets (`DATABASE_URL`, `JWT_SECRET`, รหัสแอดมิน) ใน secret manager
2. เพิ่มการยืนยันอีเมล / รีเซ็ตรหัสผ่าน
3. Token อยู่ใน `sessionStorage` — ควรเปลี่ยนเป็น HttpOnly cookie และมีระบบ revoke/refresh
4. ราคายังเป็นข้อมูลจำลอง ต้องได้สิทธิ์ใช้งาน feed/API ร้านค้าจริงก่อน
5. Deploy หลังบ้านแยกโดเมน/จำกัดการเข้าถึง (เช่น VPN หรือ IP allowlist) และตั้ง `VITE_ADMIN_URL` / `VITE_SITE_URL`
