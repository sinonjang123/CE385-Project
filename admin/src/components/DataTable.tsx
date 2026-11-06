import { useState } from "react";
import type { AdminData, AppUser, Product, StoreOffer } from "../types/models";
import { initials, money, storeClass } from "../utils/format";
import type { DataKind, RecordToEdit } from "../types/admin";

/** Shared table used by the Users, Products and Offers admin pages. */
export default function DataTable({ kind, data, onEdit, onDelete }: {
  kind: DataKind;
  data: AdminData;
  onEdit: (kind: DataKind, record: RecordToEdit) => void;
  onDelete: (kind: DataKind, id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const rows = kind === "users" ? data.users : kind === "products" ? data.products : data.offers;
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="admin-table-panel">
      <div className="table-toolbar"><label className="table-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={kind === "offers" ? "ค้นหาจากสินค้า ร้านค้า หรือ URL" : kind === "products" ? "ค้นหาจากชื่อสินค้า แบรนด์ หรือหมวดหมู่" : "ค้นหาจากชื่อหรืออีเมล"} /></label><button className="button button-outline filter-button">☷ <span>ตัวกรอง</span></button><button className="button button-outline columns-button">☷ คอลัมน์</button></div>
      <div className="table-scroll"><table><thead><tr>{kind === "users" ? <><th><input type="checkbox" aria-label="เลือกทั้งหมด" /></th><th>ชื่อผู้ใช้</th><th>อีเมล</th><th>บทบาท</th><th>สถานะ</th><th>วันที่สมัคร</th><th></th></> : kind === "products" ? <><th><input type="checkbox" aria-label="เลือกทั้งหมด" /></th><th>สินค้า</th><th>แบรนด์</th><th>หมวดหมู่</th><th>สเปก</th><th>วันที่สร้าง</th><th></th></> : <><th><input type="checkbox" aria-label="เลือกทั้งหมด" /></th><th>product_id</th><th>ร้านค้า</th><th>price</th><th>original_price</th><th>shipping_info</th><th>updated_at</th><th></th></>}</tr></thead>
        <tbody>
          {filtered.map((row) => kind === "users" ? <UserRow key={row.id} user={row as AppUser} onEdit={() => onEdit(kind, row)} onDelete={() => onDelete(kind, row.id)} /> : kind === "products" ? <ProductRow key={row.id} product={row as Product} onEdit={() => onEdit(kind, row)} onDelete={() => onDelete(kind, row.id)} /> : <OfferRow key={row.id} offer={row as StoreOffer} products={data.products} onEdit={() => onEdit(kind, row)} onDelete={() => onDelete(kind, row.id)} />)}
        </tbody>
      </table></div>
      {filtered.length === 0 && <div className="table-empty">ไม่พบข้อมูลที่ค้นหา</div>}
      <div className="table-footer"><span>แสดง {filtered.length} จาก {rows.length} รายการ</span><div><button disabled>← ก่อนหน้า</button><button className="current-page">1</button><button disabled>ถัดไป →</button></div></div>
    </section>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="row-actions"><button title="แก้ไข" onClick={onEdit}>✎</button><button title="ลบ" onClick={onDelete}>⋯</button></div>;
}

function UserRow({ user, onEdit, onDelete }: { user: AppUser; onEdit: () => void; onDelete: () => void }) {
  return <tr><td><input type="checkbox" aria-label={`เลือก ${user.display_name}`} /></td><td><div className="table-primary"><span className="user-avatar">{initials(user.display_name)}</span><strong>{user.display_name}</strong></div></td><td>{user.email}</td><td><span className={`role-chip ${user.role}`}>{user.role === "admin" ? "Admin" : "User"}</span></td><td><span className={`status-chip ${user.status}`}><i />{user.status === "active" ? "ใช้งาน" : "รอยืนยัน"}</span></td><td>{user.created_at}</td><td><RowActions onEdit={onEdit} onDelete={onDelete} /></td></tr>;
}

function ProductRow({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  return <tr><td><input type="checkbox" aria-label={`เลือก ${product.name}`} /></td><td><div className="table-primary"><span className="table-product-emoji">{product.emoji}</span><strong>{product.name}</strong></div></td><td>{product.brand}</td><td><span className="category-pill">{product.category}</span></td><td>{product.specs.length} รายการ</td><td>{product.created_at}</td><td><RowActions onEdit={onEdit} onDelete={onDelete} /></td></tr>;
}

function OfferRow({ offer, products, onEdit, onDelete }: { offer: StoreOffer; products: Product[]; onEdit: () => void; onDelete: () => void }) {
  const product = products.find((item) => item.id === offer.product_id);
  return <tr><td><input type="checkbox" aria-label={`เลือกข้อเสนอ ${offer.id}`} /></td><td className="truncate-cell" title={product?.name ?? offer.product_id}>{product?.name ?? offer.product_id}</td><td><span className={`store-pill store-pill-${storeClass(offer.store)}`}>{offer.store}</span></td><td>{money(offer.price)}</td><td>{money(offer.original_price)}</td><td>{offer.shipping_info}</td><td>{offer.updated_at}</td><td><RowActions onEdit={onEdit} onDelete={onDelete} /></td></tr>;
}
