import type { AuthUser } from "../types/models";
import { initials } from "../utils/format";

export default function ProfilePage({ authUser, onHome, onLogin, onLogout }: {
  authUser: AuthUser | null;
  onHome: () => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <main className="profile-page">
      <div className="eyebrow"><span className="eyebrow-dot" /> MY ACCOUNT</div>
      <h1>โปรไฟล์</h1>
      {authUser ? (
        <section className="profile-card" aria-label="ข้อมูลโปรไฟล์">
          <div className="profile-card-heading">
            <div className="profile-large-avatar">{initials(authUser.display_name)}</div>
            <div><h2>{authUser.display_name}</h2><p>{authUser.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}</p></div>
          </div>
          <dl className="profile-details">
            <div><dt>ชื่อที่แสดง</dt><dd>{authUser.display_name}</dd></div>
            <div><dt>อีเมล</dt><dd>{authUser.email}</dd></div>
            <div><dt>ประเภทบัญชี</dt><dd>{authUser.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"}</dd></div>
          </dl>
          <div className="profile-actions">
            {authUser.role === "admin" && <button className="button button-outline" onClick={onHome}>กลับไปหน้าเว็บไซต์</button>}
            <button className="button button-dark" onClick={onLogout}>ออกจากระบบ</button>
          </div>
        </section>
      ) : (
        <section className="profile-card profile-guest">
          <div className="profile-large-avatar">?</div>
          <h2>เข้าสู่ระบบเพื่อดูโปรไฟล์</h2>
          <p>เข้าสู่ระบบหรือสมัครสมาชิกเพื่อจัดการบัญชีของคุณ</p>
          <button className="button button-dark" onClick={onLogin}>เข้าสู่ระบบ / สมัครสมาชิก <span>↗</span></button>
        </section>
      )}
      <button className="back-link" onClick={onHome}>← กลับไปหน้าหลัก</button>
    </main>
  );
}
