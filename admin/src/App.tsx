import { useCallback, useState } from "react";
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

  const signOut = useCallback(() => {
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
          notify={notify}
        />
      ) : (
        <LoginPage siteUrl={siteUrl} onSuccess={handleLoginSuccess} />
      )}
      <Toast message={notice} onDone={clearNotice} />
    </div>
  );
}
