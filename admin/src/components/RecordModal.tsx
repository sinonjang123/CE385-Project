import { useState, type FormEvent, type ReactNode } from "react";
import type { AppUser, Category, Product, StoreOffer } from "../types/models";
import type { DataKind, RecordToEdit } from "../types/admin";
import { categories, newId, stores } from "../utils/format";

export default function RecordModal({ kind, record, products, onClose, onSave }: {
  kind: DataKind;
  record: RecordToEdit;
  products: Product[];
  onClose: () => void;
  onSave: (kind: DataKind, record: RecordToEdit, isNew: boolean) => void;
}) {
  const title = `${record ? "แก้ไข" : "เพิ่ม"}${kind === "users" ? "ผู้ใช้" : kind === "products" ? "สินค้า" : "ข้อเสนอราคา"}`;
  const [form, setForm] = useState<Record<string, string>>(() => record ? Object.fromEntries(Object.entries(record).map(([key, value]) => [key, String(value)])) : {});
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  if (kind === "users" && !record) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (kind === "users") {
      if (!record) return;
      const user = record as AppUser;
      onSave(kind, { id: user.id, display_name: form.display_name ?? "", email: form.email ?? "", role: user.role, status: form.status === "pending" ? "pending" : "active", created_at: user.created_at }, false);
      return;
    }
    if (kind === "products") {
      onSave(kind, { id: form.id || newId("p"), name: form.name ?? "", brand: form.brand ?? "", category: (form.category || "เมาส์") as Category, description: form.description ?? "", image_url: form.image_url ?? "", emoji: form.emoji || "📦", specs: (form.specs ?? "").split(",").map((item) => item.trim()).filter(Boolean), created_at: form.created_at || new Date().toISOString().slice(0, 10) }, !record);
      return;
    }
    onSave(kind, { id: form.id || newId("o"), product_id: form.product_id || products[0]?.id || "", store: (form.store || "Shopee") as StoreOffer["store"], price: Number(form.price || 0), original_price: Number(form.original_price || form.price || 0), shipping_info: form.shipping_info ?? "ส่งฟรี", product_url: form.product_url || "#", updated_at: form.updated_at || "วันนี้" }, !record);
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> ADMIN DATA</div><h2 id="modal-title">{title}</h2></div><button className="modal-close" onClick={onClose} aria-label="ปิด">×</button></div>
    <form onSubmit={submit}><div className="form-grid">
      {kind === "users" ? <>
        <FormField label="ชื่อที่แสดง" required><input required value={form.display_name ?? ""} onChange={(event) => set("display_name", event.target.value)} placeholder="เช่น กานต์ ใจดี" /></FormField>
        <FormField label="อีเมล" required><input required type="email" value={form.email ?? ""} onChange={(event) => set("email", event.target.value)} placeholder="name@example.com" /></FormField>
        <FormField label="สิทธิ์บัญชี"><input value={form.role === "admin" ? "Admin — ผู้ดูแลระบบ" : "User — ผู้ใช้งาน"} readOnly /></FormField>
        <FormField label="สถานะ"><select value={form.status || "active"} onChange={(event) => set("status", event.target.value)}><option value="active">ใช้งาน</option><option value="pending">รอยืนยัน</option></select></FormField>
      </> : kind === "products" ? <>
        <FormField label="ชื่อสินค้า" required><input required value={form.name ?? ""} onChange={(event) => set("name", event.target.value)} /></FormField>
        <FormField label="แบรนด์" required><input required value={form.brand ?? ""} onChange={(event) => set("brand", event.target.value)} /></FormField>
        <FormField label="หมวดหมู่"><select value={form.category || "เมาส์"} onChange={(event) => set("category", event.target.value)}>{categories.filter((item): item is Category => item !== "ทั้งหมด").map((item) => <option key={item}>{item}</option>)}</select></FormField>
        <FormField label="อีโมจิ / ไอคอน"><input value={form.emoji || "📦"} onChange={(event) => set("emoji", event.target.value)} /></FormField>
        <FormField label="รายละเอียด" wide><textarea value={form.description ?? ""} onChange={(event) => set("description", event.target.value)} rows={2} /></FormField>
        <FormField label="สเปก (คั่นด้วย ,)" wide><input value={form.specs ?? ""} onChange={(event) => set("specs", event.target.value)} placeholder="เชื่อมต่อ Bluetooth, น้ำหนักเบา" /></FormField>
        <FormField label="Image URL" wide><input value={form.image_url ?? ""} onChange={(event) => set("image_url", event.target.value)} placeholder="https://..." /></FormField>
      </> : <>
        <FormField label="สินค้า" required><select required value={form.product_id || products[0]?.id || ""} onChange={(event) => set("product_id", event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></FormField>
        <FormField label="ร้านค้า"><select value={form.store || "Shopee"} onChange={(event) => set("store", event.target.value)}>{stores.map((store) => <option key={store}>{store}</option>)}</select></FormField>
        <FormField label="ราคาปัจจุบัน (บาท)" required><input required type="number" min="0" step="0.01" value={form.price ?? ""} onChange={(event) => set("price", event.target.value)} /></FormField>
        <FormField label="ราคาปกติ (บาท)"><input type="number" min="0" step="0.01" value={form.original_price ?? ""} onChange={(event) => set("original_price", event.target.value)} /></FormField>
        <FormField label="ข้อมูลจัดส่ง"><input value={form.shipping_info ?? "ส่งฟรี"} onChange={(event) => set("shipping_info", event.target.value)} /></FormField>
        <FormField label="Product URL"><input value={form.product_url ?? ""} onChange={(event) => set("product_url", event.target.value)} placeholder="https://..." /></FormField>
      </>}
    </div><div className="modal-footer"><span>บันทึกผ่าน API {kind === "users" ? "ข้อมูลผู้ใช้" : "ข้อมูลร้านค้า"}</span><button type="button" className="button button-outline" onClick={onClose}>ยกเลิก</button><button className="button button-dark" type="submit">บันทึกข้อมูล</button></div></form>
  </section></div>;
}
function FormField({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: ReactNode }) {
  return <label className={`form-field ${wide ? "wide-field" : ""}`}><span>{label}{required && <i> *</i>}</span>{children}</label>;
}
