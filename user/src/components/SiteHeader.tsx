import type { AuthUser } from "../types/models";
import Avatar from "./Avatar";
import Icon from "./Icon";

export default function SiteHeader({ onHome, onSources, onProfile, authUser, avatarUrl, onLogin, onAdminDashboard, showHowItWorks }: {
  showHowItWorks: boolean;
  onHome: () => void;
  onSources: () => void;
  onProfile: () => void;
  authUser: AuthUser | null;
  avatarUrl: string | null;
  onLogin: () => void;
  onAdminDashboard: () => void;
}) {
  return (
    <header className="site-header">
      <button className="brand-lockup" onClick={onHome} aria-label="กลับหน้าหลัก">
        <span className="brand-mark">f.</span><span>find <strong>THIS</strong><small>PRICE, FOUND.</small></span>
      </button>
      <nav className="site-nav" aria-label="เมนูหลัก">
        <button onClick={onHome}>สินค้าทั้งหมด</button>
        <button onClick={onSources}>แหล่งอ้างอิงราคา</button>
        {/* The "how it works" section only exists on the home page. */}
        {showHowItWorks && <a href="#how-it-works">วิธีใช้งาน</a>}
      </nav>
      <div className="header-actions">
        <button className="profile-entry" onClick={onProfile} aria-label="เปิดโปรไฟล์">
          {authUser ? <Avatar className="header-profile-avatar" name={authUser.display_name} src={avatarUrl} /> : <span className="header-profile-avatar">?</span>}
          <span>โปรไฟล์</span>
        </button>
        <button className="login-entry" onClick={onLogin}>{authUser ? "ออกจากระบบ" : "เข้าสู่ระบบ"}</button>
        {authUser?.role === "admin" && (
          <button className="button button-outline admin-entry" onClick={onAdminDashboard}><span><Icon name="grid" /></span> จัดการระบบ</button>
        )}
      </div>
    </header>
  );
}
