import { useCallback, useEffect, useState } from "react";
import { redeemAdminHandoff } from "./api/auth.api";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import type { AuthUser } from "./types/models";
import { clearSession, readAuthUser, saveSession } from "./utils/session";

const siteUrl = import.meta.env.VITE_SITE_URL ?? "http://localhost:5173";

/** Reads a one-time code left by the user site (#handoff=...) and removes it from the address bar and history. */
function takeHandoffCode(): string | null {
  const code = new URLSearchParams(window.location.hash.slice(1)).get("handoff");
  if (code !== null) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return code;
}

// Started once per page load: the code is single-use, so it must not be redeemed again by a re-run effect.
const handoffCode = takeHandoffCode();
const handoffRequest = handoffCode === null ? null : redeemAdminHandoff(handoffCode);

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
  const [redeemingHandoff, setRedeemingHandoff] = useState(handoffRequest !== null);

  // Admin signed in on the user site: exchange the one-time code so the dashboard opens without a second login.
  useEffect(() => {
    if (handoffRequest === null) return;
    let active = true;
    handoffRequest.then((result) => {
      if (!active) return;
      if (result.user.role !== "admin") {
        setNotice("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ");
        return;
      }
      saveSession(result.user, result.accessToken);
      setAuthUser(result.user);
    }).catch(() => {
      if (active) setNotice("ลิงก์เข้าสู่ Dashboard หมดอายุแล้ว กรุณาเข้าสู่ระบบ");
    }).finally(() => {
      if (active) setRedeemingHandoff(false);
    });
    return () => { active = false; };
  }, []);

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
      {redeemingHandoff ? (
        <main className="handoff-loading" aria-live="polite">กำลังเปิด Dashboard…</main>
      ) : authUser ? (
        <DashboardPage
          adminUser={authUser}
          // View as User: the public site in a new tab, so the dashboard stays open and signed in.
          onExit={() => window.open(siteUrl, "_blank", "noopener")}
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
