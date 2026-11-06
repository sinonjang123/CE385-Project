import { useCallback, useState } from "react";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import type { AuthUser } from "./types/models";
import { clearSession, readAuthUser, saveSession } from "./utils/session";

const siteUrl = import.meta.env.VITE_SITE_URL ?? "http://localhost:5173";

/** Admin app root: show the admin login until an admin session exists, then the dashboard. */
export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = readAuthUser();
    return saved?.role === "admin" ? saved : null;
  });
  const [notice, setNotice] = useState("");
  const notify = useCallback((message: string) => setNotice(message), []);
  const clearNotice = useCallback(() => setNotice(""), []);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const cancelSignOut = useCallback(() => setConfirmingLogout(false), []);

  // Used directly for an expired session (401); the sign-out button goes through the confirmation first.
  const signOut = useCallback(() => {
    setConfirmingLogout(false);
    clearSession();
    setAuthUser(null);
    setNotice("ออกจากระบบแล้ว");
  }, []);

  function handleLoginSuccess(user: AuthUser, token: string) {
    saveSession(user, token);
    setAuthUser(user);
  }

  return (
    <div className="app-shell">
      {authUser ? (
        <DashboardPage
          adminUser={authUser}
          onExit={() => window.location.assign(siteUrl)}
          onLogout={signOut}
          onLogoutRequest={() => setConfirmingLogout(true)}
          notify={notify}
        />
      ) : (
        <LoginPage siteUrl={siteUrl} onSuccess={handleLoginSuccess} />
      )}
      {confirmingLogout && authUser && (
        <ConfirmDialog
          title="ออกจากระบบหลังบ้าน?"
          message={`คุณกำลังจะออกจากระบบบัญชีผู้ดูแล ${authUser.display_name} ต้องเข้าสู่ระบบใหม่เพื่อจัดการข้อมูลอีกครั้ง`}
          confirmLabel="ออกจากระบบ"
          onConfirm={signOut}
          onCancel={cancelSignOut}
        />
      )}
      <Toast message={notice} onDone={clearNotice} />
    </div>
  );
}
