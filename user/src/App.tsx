import { useCallback, useEffect, useMemo, useState } from "react";
import { getCatalog } from "./api/catalog.api";
import SiteHeader from "./components/SiteHeader";
import Toast from "./components/Toast";
import { seedData } from "./data/seed";
import ComparePage from "./pages/ComparePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PriceSourcesPage from "./pages/PriceSourcesPage";
import ProfilePage from "./pages/ProfilePage";
import type { AuthUser, CatalogData, Category } from "./types/models";
import { apiErrorMessage } from "./utils/errors";
import { clearSession, readAuthUser, saveSession } from "./utils/session";

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

  useEffect(() => {
    let active = true;
    getCatalog().then((data) => {
      if (active) setCatalog(data);
    }).catch((error: unknown) => {
      if (active) setNotice(apiErrorMessage(error, "โหลดข้อมูลจาก API ไม่สำเร็จ"));
    });
    return () => { active = false; };
  }, []);

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
    clearSession();
    setAuthUser(null);
    setScreen("home");
    setNotice("ออกจากระบบแล้ว");
  }

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
        onLogin={() => authUser ? signOut() : setScreen("login")}
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
        />
      ) : screen === "sources" ? (
        <PriceSourcesPage data={catalog} onCompare={showCompare} />
      ) : screen === "profile" ? (
        <ProfilePage authUser={authUser} onHome={() => setScreen("home")} onLogin={() => setScreen("login")} onLogout={signOut} />
      ) : selectedProduct ? (
        <ComparePage
          product={selectedProduct}
          offers={catalog.offers.filter((offer) => offer.product_id === selectedProduct.id)}
          onBack={() => setScreen("home")}
        />
      ) : (
        <main className="empty-state">
          <h2>ยังไม่มีสินค้าให้แสดง</h2>
          <button className="button button-dark" onClick={() => setScreen("home")}>กลับหน้าสินค้า</button>
        </main>
      )}
      <Toast message={notice} onDone={clearNotice} />
    </div>
  );
}
