import type { AdminData } from "../types/models";
import type { AdminPage } from "../types/admin";

export default function OverviewPage({ data, onPageChange }: { data: AdminData; onPageChange: (page: AdminPage) => void }) {
  const activeUsers = data.users.filter((user) => user.status === "active").length;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "2-digit" }).toUpperCase();
  return (
    <div className="overview-content">
      <div className="welcome-panel"><div><span className="welcome-label">{today}</span><h2>ยินดีต้อนรับกลับ 👋</h2><p>ภาพรวมข้อมูลและกิจกรรมในระบบของคุณ</p></div><div className="welcome-graphic">f<span>.</span></div></div>
      <div className="stats-grid">
        <StatCard label="สินค้าทั้งหมด" value={data.products.length} icon="▧" detail="รายการในแค็ตตาล็อก" onClick={() => onPageChange("products")} />
        <StatCard label="ข้อเสนอราคา" value={data.offers.length} icon="฿" detail="ราคาจากร้านค้า" onClick={() => onPageChange("offers")} />
        <StatCard label="ผู้ใช้งาน" value={data.users.length} icon="♙" detail={`${activeUsers} บัญชีกำลังใช้งาน`} onClick={() => onPageChange("users")} />
      </div>
      <div className="overview-bottom">
        <section className="admin-panel recent-panel"><div className="panel-heading"><div><h3>สินค้าที่เพิ่มล่าสุด</h3><p>รายการล่าสุดในแค็ตตาล็อก</p></div><button onClick={() => onPageChange("products")}>ดูทั้งหมด ↗</button></div>
          {data.products.slice(0, 4).map((product, index) => <div className="recent-item" key={product.id}><span className={`mini-product mini-${index}`}>{product.emoji}</span><div><strong>{product.name}</strong><span>{product.brand} · {product.category}</span></div><span className="item-time">สินค้า</span></div>)}
        </section>
        <section className="admin-panel quick-panel"><div className="panel-heading"><div><h3>ทางลัด</h3><p>จัดการข้อมูลที่ใช้บ่อย</p></div><span>↗</span></div>
          <button className="quick-action" onClick={() => onPageChange("products")}><span>▧</span><div><strong>จัดการสินค้า</strong><small>แก้ไขแค็ตตาล็อกและรายละเอียด</small></div><b>→</b></button>
          <button className="quick-action" onClick={() => onPageChange("offers")}><span>฿</span><div><strong>อัปเดตราคา</strong><small>ดูข้อเสนอจากร้านค้าทั้งหมด</small></div><b>→</b></button>
          <button className="quick-action" onClick={() => onPageChange("users")}><span>♙</span><div><strong>จัดการผู้ใช้</strong><small>แก้ไขข้อมูลและสถานะบัญชี</small></div><b>→</b></button>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, detail, onClick }: { label: string; value: number; icon: string; detail: string; onClick: () => void }) {
  return <button className="stat-card" onClick={onClick}><div className="stat-card-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><strong>{value.toString().padStart(2, "0")}</strong><span className="stat-detail">{detail}<span>↗</span></span></button>;
}
