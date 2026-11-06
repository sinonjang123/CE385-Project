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
├── docs/                # ข้อกำหนด, ERD (DDL.pgerd), PDF, SQL reference
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
│       ├── api/         # http.ts, schemas.ts, auth.api.ts (login อย่างเดียว), admin.api.ts, health.api.ts
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
        │   ├── user/    # POST /api/auth/register, /login, GET /me
        │   │            # GET/PATCH /api/account/profile (ชื่อ + รูปโปรไฟล์), POST /api/account/password
        │   │            # สมาชิก: /api/account/favorites, /api/account/searches, GET /api/account/price-history/:productId
        │   └── admin/   # /api/admin/*  (ตรวจสิทธิ์ admin ใน index.ts)
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
| Session | `sessionStorage` ของเว็บผู้ใช้ | `sessionStorage` แยกของหลังบ้าน (ต้องล็อกอินแยก) |
| API ที่เรียก | `/api/catalog`, `/api/auth/*`, `/api/account/*` | `/api/auth/login`, `/api/admin/*` |

- ทั้งสองแอปเรียก backend ตัวเดียวกันผ่าน Vite proxy `/api` → `localhost:3001`
- หน้าโปรไฟล์ (เว็บผู้ใช้): แก้ชื่อที่แสดง, เปลี่ยน/ลบรูปโปรไฟล์ (ย่อเป็น 256×256 JPEG ก่อนส่ง, backend รับเฉพาะ PNG/JPEG/WebP data URL ≤ 150,000 ตัวอักษร) และเปลี่ยนรหัสผ่านโดยต้องกรอกรหัสผ่านเดิม (ยังไม่มีการยืนยันทางอีเมล) `/api/account/*` แก้ได้เฉพาะบัญชีของ token ที่ล็อกอิน แก้ email/role/status ไม่ได้ ในโหมด in-memory ข้อมูลรูปและรหัสผ่านใหม่หายเมื่อรีสตาร์ต API
- ฟีเจอร์สมาชิก (ต้องล็อกอิน ข้อมูลแยกตามบัญชีจาก token):
  - **รายการโปรด** — ปุ่ม ♡ ที่การ์ดสินค้า/หน้าเทียบราคา ดูรวมในหน้าโปรไฟล์ (ตาราง `favorites`)
  - **ค้นหาล่าสุด** — บันทึกเมื่อกดค้นหา (ไม่ใช่ทุกตัวอักษร) เก็บ 10 คำล่าสุด ลบทีละคำหรือล้างทั้งหมดได้ (ตาราง `search_history`)
  - **ประวัติราคา 30 วัน** — **ข้อมูลจำลอง** สร้างจาก `services/mockPriceHistory.ts` ให้จุดสุดท้ายตรงกับราคาจำลองปัจจุบัน ไม่ได้อ่านจาก `price_history` เพราะตารางนั้นเก็บราคาที่ admin ตั้ง ไม่ใช่ราคาที่แสดงบนเว็บ (ราคาบนเว็บสุ่มจาก `services/mockRetailers.ts`) ผู้ที่ไม่ได้ล็อกอินจะเห็นการ์ดชวนสมัครแทน
  - ใช้ฐานข้อมูลต้องรัน migration `20261107120000_member_features` (`npx prisma migrate deploy` ใน `backend/`)
- สิทธิ์ admin ตรวจที่ backend ทุกคำขอ (`middleware/auth.ts`) การเช็ก role ในหน้า admin login มีไว้แค่แสดงข้อความให้ผู้ใช้
- ปุ่ม "จัดการระบบ" ในเว็บผู้ใช้ลิงก์ไปที่ `VITE_ADMIN_URL` (ค่าเริ่มต้น `http://localhost:5174`) และปุ่ม "ดูหน้าเว็บไซต์" ในหลังบ้านลิงก์ไปที่ `VITE_SITE_URL` (ค่าเริ่มต้น `http://localhost:5173`)

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

## งานที่ต้องทำก่อน production

1. ตั้ง PostgreSQL จริงและเก็บ secrets (`DATABASE_URL`, `JWT_SECRET`, รหัสแอดมิน) ใน secret manager
2. เพิ่มการยืนยันอีเมล / รีเซ็ตรหัสผ่าน
3. Token อยู่ใน `sessionStorage` — ควรเปลี่ยนเป็น HttpOnly cookie และมีระบบ revoke/refresh
4. ราคายังเป็นข้อมูลจำลอง ต้องได้สิทธิ์ใช้งาน feed/API ร้านค้าจริงก่อน
5. Deploy หลังบ้านแยกโดเมน/จำกัดการเข้าถึง (เช่น VPN หรือ IP allowlist) และตั้ง `VITE_ADMIN_URL` / `VITE_SITE_URL`
