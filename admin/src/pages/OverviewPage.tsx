import type { ReactNode } from "react";
import type { AdminData, AuditEntry } from "../types/models";
import type { AdminPage } from "../types/admin";
import Icon from "../components/Icon";
import { initials, stores, storeClass } from "../utils/format";

const actionLabels: Record<AuditEntry["action"], string> = { create: "เพิ่ม", update: "แก้ไข", delete: "ลบ", view: "เปิดดูในมุมมอง" };
const entityLabels: Record<AuditEntry["entity"], string> = { product: "สินค้า", offer: "ข้อเสนอราคา", user: "ผู้ใช้" };

const relativeTime = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(minutes)) return iso;
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} ชม.ที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

/** Admin landing page: catalog/user KPIs, breakdowns, newest users (with View as User) and recent audit activity. */
export default function OverviewPage({ data, audit, auditError, onPageChange, onViewAsUser }: {
  data: AdminData;
  audit: AuditEntry[] | null;
  auditError: string;
  onPageChange: (page: AdminPage) => void;
  onViewAsUser: (userId: string) => void;
}) {
  const activeUsers = data.users.filter((user) => user.status === "active").length;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "2-digit" }).toUpperCase();

  const discounts = data.offers.filter((offer) => offer.original_price > offer.price)
    .map((offer) => (offer.original_price - offer.price) / offer.original_price);
  const averageDiscount = discounts.length ? Math.round((discounts.reduce((sum, value) => sum + value, 0) / discounts.length) * 100) : 0;

  const categoryCounts = Object.entries(data.products.reduce<Record<string, number>>((counts, product) => {
    counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryCounts.map(([, count]) => count));

  const cheapestWins = stores.map((store) => ({
    store,
    wins: data.products.filter((product) => {
      const productOffers = data.offers.filter((offer) => offer.product_id === product.id);
      if (!productOffers.length) return false;
      const lowest = Math.min(...productOffers.map((offer) => offer.price));
      return productOffers.some((offer) => offer.store === store && offer.price === lowest);
    }).length,
  }));
  const maxWins = Math.max(1, ...cheapestWins.map((item) => item.wins));

  const newestUsers = [...data.users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const userName = (id: string | null) => data.users.find((user) => user.id === id)?.display_name ?? (id ? `ผู้ใช้ #${id}` : "ระบบ");
  const entityName = (entry: AuditEntry) => entry.entity === "product"
    ? data.products.find((product) => product.id === entry.entity_id)?.name ?? `#${entry.entity_id}`
    : entry.entity === "user" ? userName(entry.entity_id) : `#${entry.entity_id}`;

  return (
    <div className="overview-content">
      <div className="welcome-panel"><div><span className="welcome-label">{today}</span><h2>ยินดีต้อนรับกลับ 👋</h2><p>ภาพรวมข้อมูลและกิจกรรมในระบบของคุณ · ราคาเป็นข้อมูลจำลอง</p></div><div className="welcome-graphic">f<span>.</span></div></div>

      <div className="stats-grid dashboard-stats">
        <StatCard label="สินค้าทั้งหมด" value={data.products.length.toString().padStart(2, "0")} icon={<Icon name="box" />} detail="รายการในแค็ตตาล็อก" onClick={() => onPageChange("products")} />
        <StatCard label="ข้อเสนอราคา" value={data.offers.length.toString().padStart(2, "0")} icon={<Icon name="tag" />} detail="ราคาจากร้านค้า" onClick={() => onPageChange("offers")} />
        <StatCard label="ผู้ใช้งาน" value={data.users.length.toString().padStart(2, "0")} icon={<Icon name="user" />} detail={`${activeUsers} บัญชีกำลังใช้งาน`} onClick={() => onPageChange("users")} />
        <StatCard label="ส่วนลดเฉลี่ย" value={`${averageDiscount}%`} icon={<Icon name="chart" />} detail="เทียบราคาเต็ม" onClick={() => onPageChange("offers")} />
      </div>

      <div className="dashboard-grid">
        <section className="admin-panel">
          <div className="panel-heading"><div><h3>สินค้าตามหมวดหมู่</h3><p>จำนวนสินค้าในแต่ละหมวด</p></div><button onClick={() => onPageChange("products")}>ดูสินค้า <Icon name="arrow-right" /></button></div>
          <ul className="bar-list">
            {categoryCounts.map(([category, count]) => (
              <li key={category}><span>{category}</span><div className="bar-track"><i style={{ width: `${(count / maxCategory) * 100}%` }} /></div><b>{count}</b></li>
            ))}
          </ul>
        </section>
        <section className="admin-panel">
          <div className="panel-heading"><div><h3>ร้านที่ให้ราคาต่ำสุด</h3><p>จำนวนสินค้าที่แต่ละร้านถูกที่สุด (รวมราคาเท่ากัน)</p></div><button onClick={() => onPageChange("offers")}>ดูราคา <Icon name="arrow-right" /></button></div>
          <ul className="bar-list store-bars">
            {cheapestWins.map(({ store, wins }) => (
              <li key={store}><span className={`store-pill store-pill-${storeClass(store)}`}>{store}</span><div className="bar-track"><i className={`bar-${storeClass(store)}`} style={{ width: `${(wins / maxWins) * 100}%` }} /></div><b>{wins}</b></li>
            ))}
          </ul>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="admin-panel">
          <div className="panel-heading"><div><h3>ผู้ใช้ล่าสุด</h3><p>กด <Icon name="eye" /> เพื่อดูในมุมมองผู้ใช้ (อ่านอย่างเดียว)</p></div><button onClick={() => onPageChange("users")}>ดูทั้งหมด <Icon name="arrow-right" /></button></div>
          {newestUsers.length === 0 && <p className="panel-empty">ยังไม่มีผู้ใช้</p>}
          {newestUsers.map((user) => (
            <div className="recent-item" key={user.id}>
              <span className="user-avatar">{initials(user.display_name) || "U"}</span>
              <div><strong>{user.display_name}</strong><span>{user.email} · {user.created_at}</span></div>
              {user.role === "user"
                ? <button type="button" className="view-as-button" onClick={() => onViewAsUser(user.id)}><Icon name="eye" /> View as User</button>
                : <span className="role-chip admin">Admin</span>}
            </div>
          ))}
        </section>
        <section className="admin-panel">
          <div className="panel-heading"><div><h3>กิจกรรมล่าสุด</h3><p>จาก audit log ของผู้ดูแลระบบ</p></div></div>
          {auditError ? <p className="panel-empty" role="alert">{auditError}</p>
            : !audit ? <p className="panel-empty">กำลังโหลด...</p>
            : audit.length === 0 ? <p className="panel-empty">ยังไม่มีกิจกรรม</p>
            : audit.map((entry) => (
              <div className="recent-item" key={entry.id}>
                <span className={`activity-dot activity-${entry.action}`}><Icon name={entry.action === "view" ? "eye" : entry.action === "delete" ? "trash" : "edit"} /></span>
                <div><strong>{userName(entry.actor_user_id)} {actionLabels[entry.action]}{entityLabels[entry.entity]}</strong><span>{entityName(entry)}</span></div>
                <span className="item-time">{relativeTime(entry.created_at)}</span>
              </div>
            ))}
        </section>
      </div>

      <div className="overview-bottom">
        <section className="admin-panel recent-panel"><div className="panel-heading"><div><h3>สินค้าที่เพิ่มล่าสุด</h3><p>รายการล่าสุดในแค็ตตาล็อก</p></div><button onClick={() => onPageChange("products")}>ดูทั้งหมด <Icon name="arrow-right" /></button></div>
          {data.products.slice(0, 4).map((product, index) => <div className="recent-item" key={product.id}><span className={`mini-product mini-${index}`}>{product.emoji}</span><div><strong>{product.name}</strong><span>{product.brand} · {product.category}</span></div><span className="item-time">สินค้า</span></div>)}
        </section>
        <section className="admin-panel quick-panel"><div className="panel-heading"><div><h3>ทางลัด</h3><p>จัดการข้อมูลที่ใช้บ่อย</p></div><span><Icon name="arrow-right" /></span></div>
          <button className="quick-action" onClick={() => onPageChange("products")}><span><Icon name="box" /></span><div><strong>จัดการสินค้า</strong><small>แก้ไขแค็ตตาล็อกและรายละเอียด</small></div><b><Icon name="arrow-right" /></b></button>
          <button className="quick-action" onClick={() => onPageChange("offers")}><span><Icon name="tag" /></span><div><strong>อัปเดตราคา</strong><small>ดูข้อเสนอจากร้านค้าทั้งหมด</small></div><b><Icon name="arrow-right" /></b></button>
          <button className="quick-action" onClick={() => onPageChange("users")}><span><Icon name="user" /></span><div><strong>จัดการผู้ใช้</strong><small>แก้ไขข้อมูลและสถานะบัญชี · View as User</small></div><b><Icon name="arrow-right" /></b></button>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, detail, onClick }: { label: string; value: string; icon: ReactNode; detail: string; onClick: () => void }) {
  return <button className="stat-card" onClick={onClick}><div className="stat-card-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><strong>{value}</strong><span className="stat-detail">{detail}<span><Icon name="arrow-right" /></span></span></button>;
}
