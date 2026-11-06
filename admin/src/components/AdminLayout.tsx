import type { ReactNode } from "react";
import type { AdminData, AuthUser } from "../types/models";
import { initials } from "../utils/format";
import type { AdminPage, DataKind } from "../types/admin";
import Icon from "./Icon";

export const pageTitles: Record<AdminPage, string> = { overview: "Dashboard", users: "App Users", products: "Product", offers: "StoreOffer" };

/** Admin shell: sidebar + top bar. Page content is passed as children. */
export default function AdminLayout({ activePage, data, adminUser, demoMode, onPageChange, onAdd, onExit, onLogout, children }: {
  activePage: AdminPage;
  data: AdminData;
  adminUser: AuthUser;
  demoMode: boolean;
  onPageChange: (page: AdminPage) => void;
  onAdd?: (kind: DataKind) => void;
  onExit: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const pageKind: Partial<Record<AdminPage, DataKind>> = { products: "products", offers: "offers" };
  const addKind = pageKind[activePage];
  const avatar = initials(adminUser.display_name) || "A";
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button className="brand-lockup admin-brand" onClick={onExit}><span className="brand-mark">f.</span><span>find <strong>THIS</strong><small>ADMIN STUDIO</small></span></button>
        <label className="sidebar-search"><span><Icon name="search" /></span><input placeholder="ค้นหาเมนู..." /></label>
        <div className="sidebar-label">WORKSPACE</div>
        <button className={`sidebar-link ${activePage === "overview" ? "selected" : ""}`} onClick={() => onPageChange("overview")}><span><Icon name="grid" /></span> Dashboard</button>
        <button className={`sidebar-link ${activePage === "users" ? "selected" : ""}`} onClick={() => onPageChange("users")}><span><Icon name="user" /></span> App Users <b>{data.users.length}</b></button>
        <div className="sidebar-label data-label">DATA <span>⌄</span></div>
        <button className={`sidebar-link nested ${activePage === "products" ? "selected" : ""}`} onClick={() => onPageChange("products")}><span><Icon name="box" /></span> Product <b>{data.products.length}</b></button>
        <button className={`sidebar-link nested ${activePage === "offers" ? "selected" : ""}`} onClick={() => onPageChange("offers")}><span><Icon name="tag" /></span> StoreOffer <b>{data.offers.length}</b></button>
        <div className="sidebar-label">MANAGE</div>
        <button className="sidebar-link muted-link"><span><Icon name="chart" /></span> Analytics <small>เร็ว ๆ นี้</small></button>
        <button className="sidebar-link muted-link"><span>◎</span> Settings</button>
        <div className="sidebar-profile"><div className="profile-avatar">{avatar}</div><div><strong>{adminUser.display_name}</strong><span>ผู้ดูแลระบบ</span></div><span className="profile-menu">···</span></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-breadcrumb">Workspace</span><span className="crumb-divider">/</span><strong>{pageTitles[activePage]}</strong></div>
          <div className="admin-top-actions">
            <span className="demo-badge"><span /> {demoMode ? "DEMO DATA" : "POSTGRESQL"}</span>
            <button className="button button-outline preview-button" onClick={onExit}><Icon name="external" /> ดูหน้าเว็บไซต์</button>
            <button className="button button-outline preview-button" onClick={onLogout}>ออกจากระบบ</button>
            <div className="profile-avatar top-avatar">{avatar}</div>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> ADMIN WORKSPACE</div>
              <h1>{activePage === "overview" ? "Dashboard" : pageTitles[activePage]}</h1>
              <p>{activePage === "overview" ? "ภาพรวมสินค้า ราคา ผู้ใช้ และกิจกรรมล่าสุดของ find THIS" : `จัดการ${activePage === "users" ? "ข้อมูลบัญชีผู้ใช้" : activePage === "products" ? "รายการสินค้า" : "ราคาและข้อเสนอจากร้านค้า"} · ข้อมูลจำลอง`}</p>
            </div>
            {addKind && onAdd && <button className="button button-dark add-button" onClick={() => onAdd(addKind)}><span>＋</span> เพิ่มรายการ</button>}
          </div>
          {children}
          <div className="database-note"><span>ⓘ</span><div><strong>{demoMode ? "โหมดข้อมูลจำลอง" : "เชื่อมต่อ PostgreSQL แล้ว"}</strong><p>{demoMode ? "ข้อมูลอยู่ในหน่วยความจำ backend และจะถูกรีเซ็ตเมื่อปิดเซิร์ฟเวอร์" : "แค็ตตาล็อก ผู้ใช้ และข้อเสนอราคาบันทึกผ่าน API ลงฐานข้อมูล"}</p></div><span className="local-storage-label">{demoMode ? "IN-MEMORY" : "POSTGRESQL"}</span></div>
        </main>
      </div>
    </div>
  );
}
