import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "./api/account.api";
import { getCatalog } from "./api/catalog.api";
import ConfirmDialog from "./components/ConfirmDialog";
import SiteHeader from "./components/SiteHeader";
import Toast from "./components/Toast";
import { seedData } from "./data/seed";
import { useMemberData } from "./hooks/useMemberData";
import ComparePage from "./pages/ComparePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PriceSourcesPage from "./pages/PriceSourcesPage";
import ProfilePage from "./pages/ProfilePage";
import type { AuthUser, CatalogData, Category, UserProfile } from "./types/models";
import { apiErrorMessage, isUnauthorized } from "./utils/errors";
import { clearSession, readAuthUser, saveSession, updateSessionUser } from "./utils/session";

type Screen = "home" | "compare" | "sources" | "profile" | "login";

/** User website: browse, compare prices, register / login. The admin back office is a separate app in /admin. */
export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(readAuthUser);
  // Seed data is shown until the API responds (and if the API is unreachable).
  const [catalog, setCatalog] = useState<CatalogData>(() => ({
    products: structuredClone(seedData.products),
    offers: structuredClone(seedData.offers),
  }));
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedProductId, setSelectedProductId] = useState("p-003");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "ทั้งหมด">("ทั้งหมด");
  const [notice, setNotice] = useState("");
  const clearNotice = useCallback(() => setNotice(""), []);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const cancelSignOut = useCallback(() => setConfirmingLogout(false), []);

  useEffect(() => {
    let active = true;
    getCatalog().then((data) => {
      if (active) setCatalog(data);
    }).catch((error: unknown) => {
      if (active) setNotice(apiErrorMessage(error, "โหลดข้อมูลจาก API ไม่สำเร็จ"));
    });
    return () => { active = false; };
  }, []);

  // The profile (with avatar) is loaded from the API for whoever the session token belongs to.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const sessionUserId = authUser?.id;
  useEffect(() => {
    setProfile(null);
    setProfileError("");
    if (!sessionUserId) return;
    let active = true;
    getProfile().then((loaded) => {
      if (active) setProfile(loaded);
    }).catch((error: unknown) => {
      if (!active) return;
      if (isUnauthorized(error)) {
        clearSession();
        setAuthUser(null);
        setNotice("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        return;
      }
      setProfileError(apiErrorMessage(error, "โหลดโปรไฟล์ไม่สำเร็จ"));
    });
    return () => { active = false; };
  }, [sessionUserId]);

  const member = useMemberData(sessionUserId, setNotice);

  function requireLogin(message: string) {
    setNotice(message);
    setScreen("login");
  }

  function toggleFavorite(productId: string) {
    if (!authUser) {
      requireLogin("เข้าสู่ระบบเพื่อบันทึกรายการโปรด");
      return;
    }
    void member.toggleFavorite(productId);
  }

  const favoriteProducts = useMemo(() => member.favoriteIds.flatMap((id) => {
    const product = catalog.products.find((item) => item.id === id);
    if (!product) return [];
    const prices = catalog.offers.filter((offer) => offer.product_id === id).map((offer) => offer.price);
    return [{ product, lowestPrice: prices.length ? Math.min(...prices) : null }];
  }), [catalog, member.favoriteIds]);

  function handleProfileSaved(saved: UserProfile) {
    const user: AuthUser = { id: saved.id, display_name: saved.display_name, email: saved.email, role: saved.role };
    setProfile(saved);
    setAuthUser(user);
    updateSessionUser(user);
  }

  const selectedProduct = catalog.products.find((product) => product.id === selectedProductId) ?? catalog.products[0];
  const filteredProducts = useMemo(() => catalog.products.filter((product) => {
    const matchesText = `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesText && (category === "ทั้งหมด" || product.category === category);
  }), [category, catalog.products, search]);

  function showCompare(productId: string) {
    setSelectedProductId(productId);
    setScreen("compare");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function signOut() {
    setConfirmingLogout(false);
    clearSession();
    setAuthUser(null);
    setScreen("home");
    setNotice("ออกจากระบบแล้ว");
  }

  // Sign-out buttons ask first; an expired session (401) still signs out immediately.
  const requestSignOut = () => setConfirmingLogout(true);

  function handleLoginSuccess(user: AuthUser, token: string) {
    saveSession(user, token);
    setAuthUser(user);
    setScreen("home");
    setNotice(`ยินดีต้อนรับ ${user.display_name}`);
  }

  if (screen === "login") {
    return (
      <div className="app-shell">
        <LoginPage onCancel={() => setScreen("home")} onSuccess={handleLoginSuccess} />
        <Toast message={notice} onDone={clearNotice} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader
        onHome={() => setScreen("home")}
        onSources={() => setScreen("sources")}
        onProfile={() => setScreen("profile")}
        authUser={authUser}
        avatarUrl={profile?.avatar_url ?? null}
        showHowItWorks={screen === "home"}
        onLogin={() => authUser ? requestSignOut() : setScreen("login")}
      />
      {screen === "home" ? (
        <HomePage
          products={filteredProducts}
          search={search}
          category={category}
          onSearch={setSearch}
          onCategory={setCategory}
          offers={catalog.offers}
          onCompare={showCompare}
          favoriteIds={member.favoriteIds}
          onToggleFavorite={toggleFavorite}
          isMember={Boolean(authUser)}
          recentSearches={member.recentSearches}
          onSubmitSearch={(keyword) => void member.saveSearch(keyword)}
          onRemoveSearch={(id) => void member.removeSearch(id)}
          onClearSearches={() => void member.clearAllSearches()}
        />
      ) : screen === "sources" ? (
        <PriceSourcesPage data={catalog} onCompare={showCompare} />
      ) : screen === "profile" ? (
        <ProfilePage
          authUser={authUser}
          profile={profile}
          profileError={profileError}
          onHome={() => setScreen("home")}
          onLogin={() => setScreen("login")}
          onLogout={requestSignOut}
          onProfileSaved={handleProfileSaved}
          onNotice={setNotice}
          favorites={favoriteProducts}
          onCompare={showCompare}
          onToggleFavorite={toggleFavorite}
        />
      ) : selectedProduct ? (
        <ComparePage
          product={selectedProduct}
          offers={catalog.offers.filter((offer) => offer.product_id === selectedProduct.id)}
          onBack={() => setScreen("home")}
          isMember={Boolean(authUser)}
          isFavorite={member.favoriteIds.includes(selectedProduct.id)}
          onToggleFavorite={() => toggleFavorite(selectedProduct.id)}
          onLogin={() => setScreen("login")}
        />
      ) : (
        <main className="empty-state">
          <h2>ยังไม่มีสินค้าให้แสดง</h2>
          <button className="button button-dark" onClick={() => setScreen("home")}>กลับหน้าสินค้า</button>
        </main>
      )}
      {confirmingLogout && authUser && (
        <ConfirmDialog
          title="ออกจากระบบ?"
          message={`คุณกำลังจะออกจากระบบบัญชี ${authUser.display_name} รายการโปรดและประวัติการค้นหายังถูกเก็บไว้ในบัญชี`}
          confirmLabel="ออกจากระบบ"
          onConfirm={signOut}
          onCancel={cancelSignOut}
        />
      )}
      <Toast message={notice} onDone={clearNotice} />
    </div>
  );
}
