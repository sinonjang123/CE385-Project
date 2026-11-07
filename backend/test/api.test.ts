import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.PORT = "0";
process.env.DATABASE_URL = "";
process.env.DEMO_ADMIN_EMAIL = "admin@test.findthis";
process.env.DEMO_ADMIN_PASSWORD = "AdminPassword123";

const api = await import("../src/server.js");
let baseUrl = "";

before(async () => {
  if (!api.server.listening) {
    await new Promise<void>((resolve) => api.server.once("listening", resolve));
  }
  const address = api.server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    api.server.close((error) => error ? reject(error) : resolve());
    api.server.closeAllConnections();
  });
});

async function request(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
}

async function login(email: string, password: string) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return await response.json() as { accessToken: string; user: { id: string; role: string } };
}

test("registration, authorization, catalog CRUD, and admin safeguards", async () => {
  const health = await request("/api/health");
  assert.deepEqual(await health.json(), { status: "ok", mode: "demo", persistence: "memory" });
  assert.ok(health.headers.has("ratelimit"));

  const catalogResponse = await request("/api/catalog");
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json() as {
    products: Array<{ id: string }>;
    offers: Array<{ product_id: string; store: string; price: number; promo_ended: boolean }>;
  };
  assert.equal(catalog.products.length, 11);
  for (const product of catalog.products) {
    const productOffers = catalog.offers.filter((offer) => offer.product_id === product.id);
    assert.deepEqual(productOffers.map((offer) => offer.store).sort(), ["Amazon", "Lazada", "Shopee"]);
    // An ended promotion shows the regular price (about 8% higher), so it is left out of the spread check.
    const prices = productOffers.filter((offer) => !offer.promo_ended).map((offer) => offer.price);
    assert.ok(Math.max(...prices) - Math.min(...prices) <= Math.max(...prices) * 0.11);
  }
  assert.deepEqual(
    (await (await request("/api/catalog")).json() as typeof catalog).offers,
    catalog.offers,
    "mock prices remain stable while the API process is running",
  );
  const mockRetailers = await request("/api/mock/retailers");
  assert.equal(mockRetailers.status, 200);
  const retailerPayload = await mockRetailers.json() as {
    mode: string;
    retailers: Array<{ offers: Array<{ product_id: string }> }>;
  };
  assert.equal(retailerPayload.mode, "mock");
  assert.deepEqual(retailerPayload.retailers.map((retailer) => retailer.offers.length), [11, 11, 11]);

  const anonymousAdminData = await request("/api/admin/data");
  assert.equal(anonymousAdminData.status, 401);
  assert.equal((await request("/api/admin/audit")).status, 401);

  const registration = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Test User", email: " TEST@example.test ", password: "TestPassword123" }),
  });
  assert.equal(registration.status, 201);
  const registered = await registration.json() as {
    accessToken: string;
    user: { id: string; email: string; role: string };
  };
  assert.equal(registered.user.email, "test@example.test");
  assert.equal(registered.user.role, "user");
  assert.ok(!("password" in registered.user));

  const duplicate = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Duplicate User", email: "test@example.test", password: "TestPassword123" }),
  });
  assert.equal(duplicate.status, 409);

  const userAdminData = await request("/api/admin/data", {
    headers: { Authorization: `Bearer ${registered.accessToken}` },
  });
  assert.equal(userAdminData.status, 403);

  const userLogin = await login("TEST@example.test", "TestPassword123");
  assert.equal(userLogin.user.role, "user");

  const admin = await login("admin@test.findthis", "AdminPassword123");
  const adminHeaders = { Authorization: `Bearer ${admin.accessToken}` };
  const adminDataResponse = await request("/api/admin/data", { headers: adminHeaders });
  assert.equal(adminDataResponse.status, 200);
  const adminData = await adminDataResponse.json() as { products: Array<{ id: string }>; users: Array<Record<string, unknown>> };
  assert.ok(adminData.products.length > 0);
  assert.ok(adminData.users.every((user) => !("password_hash" in user)));

  const createdProductResponse = await request("/api/admin/products", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      name: "Test Product",
      brand: "Test",
      category: "เมาส์",
      description: "",
      image_url: "",
      emoji: "📦",
      specs: ["Test spec"],
    }),
  });
  assert.equal(createdProductResponse.status, 201);
  const createdProduct = await createdProductResponse.json() as { id: string; name: string };
  assert.equal(createdProduct.name, "Test Product");
  const updatedCatalog = await request("/api/catalog");
  const catalogAfterProductCreate = await updatedCatalog.json() as {
    products: Array<{ id: string }>;
    offers: Array<{ product_id: string; store: string }>;
  };
  assert.ok(catalogAfterProductCreate.products.some((product) => product.id === createdProduct.id));
  assert.deepEqual(
    catalogAfterProductCreate.offers
      .filter((offer) => offer.product_id === createdProduct.id)
      .map((offer) => offer.store)
      .sort(),
    ["Amazon", "Lazada", "Shopee"],
  );

  const updatedProductResponse = await request(`/api/admin/products/${createdProduct.id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({ ...createdProduct, brand: "Updated" }),
  });
  assert.equal(updatedProductResponse.status, 200);
  assert.equal((await updatedProductResponse.json() as { brand: string }).brand, "Updated");

  const adminUserCreateResponse = await request("/api/admin/users", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      display_name: "Admin Created User",
      email: "admin-created@example.test",
      password: "CreatedPassword123",
    }),
  });
  assert.equal(adminUserCreateResponse.status, 404);

  const promoteUserResponse = await request(`/api/admin/users/${registered.user.id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      display_name: "Test User",
      email: registered.user.email,
      role: "admin",
      status: "active",
    }),
  });
  assert.equal(promoteUserResponse.status, 400);

  const updatedUserResponse = await request(`/api/admin/users/${registered.user.id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      display_name: "Updated Test User",
      email: registered.user.email,
      status: "active",
    }),
  });
  assert.equal(updatedUserResponse.status, 200);
  const updatedUser = await updatedUserResponse.json() as { display_name: string; role: string };
  assert.equal(updatedUser.display_name, "Updated Test User");
  assert.equal(updatedUser.role, "user");

  const disableSelfResponse = await request(`/api/admin/users/${admin.user.id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      display_name: "คุณแอดมิน",
      email: "admin@test.findthis",
      status: "pending",
    }),
  });
  assert.equal(disableSelfResponse.status, 409);
  assert.equal(
    (await disableSelfResponse.json() as { message: string }).message,
    "ไม่สามารถปิดใช้งานบัญชีแอดมินที่กำลังเข้าสู่ระบบได้",
  );
  assert.equal((await request(`/api/admin/users/${registered.user.id}`, { method: "DELETE", headers: adminHeaders })).status, 204);

  const unsupportedOffer = await request("/api/admin/offers", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      product_id: "p-001",
      store: "Power Buy",
      price: 1800,
      original_price: 2000,
      shipping_info: "ส่งฟรี",
      product_url: "#",
    }),
  });
  assert.equal(unsupportedOffer.status, 400);

  const createdOffer = await request("/api/admin/offers", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      product_id: "p-001",
      store: "Amazon",
      price: 1800,
      original_price: 2000,
      shipping_info: "ส่งฟรี",
      product_url: "#",
    }),
  });
  assert.equal(createdOffer.status, 201);

  const deletedOffer = await createdOffer.json() as { id: string };
  assert.equal((await request(`/api/admin/offers/${deletedOffer.id}`, { method: "DELETE", headers: adminHeaders })).status, 204);
  assert.equal((await request(`/api/admin/products/${createdProduct.id}`, { method: "DELETE", headers: adminHeaders })).status, 204);

  const expiredStyleToken = await request("/api/admin/data", {
    headers: { Authorization: "Bearer not-a-jwt" },
  });
  assert.equal(expiredStyleToken.status, 401);

  const auditResponse = await request("/api/admin/audit", { headers: adminHeaders });
  assert.equal(auditResponse.status, 200);
  const auditEntries = await auditResponse.json() as Array<{
    actor_user_id: string | null;
    action: string;
    entity: string;
    entity_id: string;
  }>;
  assert.ok(auditEntries.some((entry) => (
    entry.actor_user_id === admin.user.id
    && entry.action === "create"
    && entry.entity === "product"
    && entry.entity_id === createdProduct.id
  )));
  assert.ok(auditEntries.some((entry) => (
    entry.action === "delete"
    && entry.entity === "user"
    && entry.entity_id === registered.user.id
  )));
});

test("signed-in users can update their own profile and change password with the current password", async () => {
  const registration = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Profile User", email: "profile@example.test", password: "OldPassword123" }),
  });
  assert.equal(registration.status, 201);
  const { accessToken, user } = await registration.json() as { accessToken: string; user: { id: string } };
  const headers = { Authorization: `Bearer ${accessToken}` };

  assert.equal((await request("/api/account/profile")).status, 401);
  assert.equal((await request("/api/account/password", { method: "POST", body: "{}" })).status, 401);

  const initial = await request("/api/account/profile", { headers });
  assert.equal(initial.status, 200);
  assert.deepEqual(await initial.json(), {
    user: { id: user.id, display_name: "Profile User", email: "profile@example.test", role: "user", avatar_url: null },
  });

  const avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==";
  const updated = await request("/api/account/profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ displayName: "  Renamed User  ", avatarUrl: avatar }),
  });
  assert.equal(updated.status, 200);
  const updatedBody = await updated.json() as { user: { display_name: string; avatar_url: string; role: string } };
  assert.equal(updatedBody.user.display_name, "Renamed User");
  assert.equal(updatedBody.user.avatar_url, avatar);
  assert.equal(updatedBody.user.role, "user");

  const svgAvatar = await request("/api/account/profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ displayName: "Renamed User", avatarUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" }),
  });
  assert.equal(svgAvatar.status, 400);

  const roleEscalation = await request("/api/account/profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ displayName: "Renamed User", avatarUrl: null, role: "admin" }),
  });
  assert.equal(roleEscalation.status, 400);

  const oversized = await request("/api/account/profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ displayName: "Renamed User", avatarUrl: `data:image/png;base64,${"A".repeat(300_000)}` }),
  });
  assert.equal(oversized.status, 413);

  const removedAvatar = await request("/api/account/profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ displayName: "Renamed User", avatarUrl: null }),
  });
  assert.equal((await removedAvatar.json() as { user: { avatar_url: string | null } }).user.avatar_url, null);

  const wrongCurrent = await request("/api/account/password", {
    method: "POST",
    headers,
    body: JSON.stringify({ currentPassword: "WrongPassword123", newPassword: "NewPassword123" }),
  });
  assert.equal(wrongCurrent.status, 400);
  assert.equal((await wrongCurrent.json() as { message: string }).message, "รหัสผ่านปัจจุบันไม่ถูกต้อง");

  const samePassword = await request("/api/account/password", {
    method: "POST",
    headers,
    body: JSON.stringify({ currentPassword: "OldPassword123", newPassword: "OldPassword123" }),
  });
  assert.equal(samePassword.status, 400);

  const changed = await request("/api/account/password", {
    method: "POST",
    headers,
    body: JSON.stringify({ currentPassword: "OldPassword123", newPassword: "NewPassword123" }),
  });
  assert.equal(changed.status, 204);

  const oldLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "profile@example.test", password: "OldPassword123" }),
  });
  assert.equal(oldLogin.status, 401);
  const newLogin = await login("profile@example.test", "NewPassword123");
  assert.equal(newLogin.user.role, "user");
});

test("member features: favorites, recent searches and mock price history are per-user and sign-in only", async () => {
  async function member(email: string) {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ displayName: "Member", email, password: "MemberPassword123" }),
    });
    assert.equal(response.status, 201);
    const body = await response.json() as { accessToken: string };
    return { Authorization: `Bearer ${body.accessToken}` };
  }
  const alice = await member("alice@example.test");
  const bob = await member("bob@example.test");

  for (const path of ["/api/account/favorites", "/api/account/searches", "/api/account/price-history/p-001"]) {
    assert.equal((await request(path)).status, 401, `${path} requires sign-in`);
  }

  // Favorites
  assert.equal((await request("/api/account/favorites/p-001", { method: "PUT", headers: alice })).status, 204);
  assert.equal((await request("/api/account/favorites/p-001", { method: "PUT", headers: alice })).status, 204, "idempotent");
  assert.equal((await request("/api/account/favorites/p-002", { method: "PUT", headers: alice })).status, 204);
  assert.equal((await request("/api/account/favorites/no-such-product", { method: "PUT", headers: alice })).status, 404);
  const aliceFavorites = await (await request("/api/account/favorites", { headers: alice })).json() as { favorites: Array<{ product_id: string }> };
  assert.deepEqual(aliceFavorites.favorites.map((item) => item.product_id).sort(), ["p-001", "p-002"]);
  const bobFavorites = await (await request("/api/account/favorites", { headers: bob })).json() as { favorites: unknown[] };
  assert.equal(bobFavorites.favorites.length, 0, "favorites are not shared between users");
  assert.equal((await request("/api/account/favorites/p-001", { method: "DELETE", headers: alice })).status, 204);
  const afterRemove = await (await request("/api/account/favorites", { headers: alice })).json() as { favorites: Array<{ product_id: string }> };
  assert.deepEqual(afterRemove.favorites.map((item) => item.product_id), ["p-002"]);

  // Recent searches
  for (const keyword of ["เมาส์", "หูฟัง", "เมาส์"]) {
    const recorded = await request("/api/account/searches", { method: "POST", headers: alice, body: JSON.stringify({ keyword }) });
    assert.equal(recorded.status, 201);
  }
  assert.equal((await request("/api/account/searches", { method: "POST", headers: alice, body: JSON.stringify({ keyword: "   " }) })).status, 400);
  const searches = await (await request("/api/account/searches", { headers: alice })).json() as { searches: Array<{ id: string; keyword: string }> };
  assert.deepEqual(searches.searches.map((item) => item.keyword), ["เมาส์", "หูฟัง"], "newest first, repeated keyword moved to the top");
  for (let index = 0; index < 12; index += 1) {
    await request("/api/account/searches", { method: "POST", headers: alice, body: JSON.stringify({ keyword: `คำค้น ${index}` }) });
  }
  const capped = await (await request("/api/account/searches", { headers: alice })).json() as { searches: Array<{ id: string; keyword: string }> };
  assert.equal(capped.searches.length, 10);
  assert.equal(capped.searches[0]?.keyword, "คำค้น 11");

  const firstSearch = capped.searches[0];
  assert.ok(firstSearch);
  assert.equal((await request(`/api/account/searches/${firstSearch.id}`, { method: "DELETE", headers: bob })).status, 404, "cannot delete another user's search");
  assert.equal((await request(`/api/account/searches/${firstSearch.id}`, { method: "DELETE", headers: alice })).status, 204);
  assert.equal((await request("/api/account/searches", { method: "DELETE", headers: alice })).status, 204);
  const cleared = await (await request("/api/account/searches", { headers: alice })).json() as { searches: unknown[] };
  assert.equal(cleared.searches.length, 0);

  // Mock price history ends at the price shown in the public catalog
  const historyResponse = await request("/api/account/price-history/p-001", { headers: alice });
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json() as {
    mode: string;
    days: number;
    series: Array<{ store: string; points: Array<{ date: string; price: number }> }>;
  };
  assert.equal(history.mode, "mock");
  assert.deepEqual(history.series.map((item) => item.store).sort(), ["Amazon", "Lazada", "Shopee"]);
  const catalog = await (await request("/api/catalog")).json() as { offers: Array<{ product_id: string; store: string; price: number }> };
  for (const item of history.series) {
    assert.equal(item.points.length, history.days);
    const current = catalog.offers.find((offer) => offer.product_id === "p-001" && offer.store === item.store);
    assert.equal(item.points.at(-1)?.price, current?.price);
  }
  assert.deepEqual(
    await (await request("/api/account/price-history/p-001", { headers: alice })).json(),
    history,
    "history is stable between requests",
  );
  assert.equal((await request("/api/account/price-history/no-such-product", { headers: alice })).status, 404);
});

test("admin View as User is read-only, admin-only, limited to user accounts and audited", async () => {
  const registration = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Viewed Member", email: "viewed@example.test", password: "MemberPassword123" }),
  });
  assert.equal(registration.status, 201);
  const member = await registration.json() as { accessToken: string; user: { id: string } };
  const memberHeaders = { Authorization: `Bearer ${member.accessToken}` };
  assert.equal((await request("/api/account/favorites/p-003", { method: "PUT", headers: memberHeaders })).status, 204);
  assert.equal((await request("/api/account/searches", { method: "POST", headers: memberHeaders, body: JSON.stringify({ keyword: "จอคอม" }) })).status, 201);

  const viewPath = `/api/admin/users/${member.user.id}/view`;
  assert.equal((await request(viewPath)).status, 401, "requires sign-in");
  assert.equal((await request(viewPath, { headers: memberHeaders })).status, 403, "members cannot view other accounts");

  const admin = await login("admin@test.findthis", "AdminPassword123");
  const adminHeaders = { Authorization: `Bearer ${admin.accessToken}` };
  const viewResponse = await request(viewPath, { headers: adminHeaders });
  assert.equal(viewResponse.status, 200);
  assert.equal(viewResponse.headers.get("cache-control"), "no-store");
  const view = await viewResponse.json() as Record<string, unknown> & {
    mode: string;
    user: Record<string, unknown>;
    favorites: Array<{ product_id: string }>;
    searches: Array<{ keyword: string }>;
  };
  assert.equal(view.mode, "read-only");
  assert.equal(view.user.email, "viewed@example.test");
  assert.equal("password_hash" in view.user, false, "never exposes the password hash");
  assert.equal("accessToken" in view, false, "does not issue a token for the viewed user");
  assert.deepEqual(view.favorites.map((item) => item.product_id), ["p-003"]);
  assert.deepEqual(view.searches.map((item) => item.keyword), ["จอคอม"]);

  assert.equal((await request(`/api/admin/users/${admin.user.id}/view`, { headers: adminHeaders })).status, 403, "admin accounts cannot be viewed");
  assert.equal((await request("/api/admin/users/no-such-user/view", { headers: adminHeaders })).status, 404);

  const audit = await (await request("/api/admin/audit", { headers: adminHeaders })).json() as Array<{
    actor_user_id: string; action: string; entity: string; entity_id: string;
  }>;
  assert.ok(audit.some((entry) => entry.action === "view" && entry.entity === "user"
    && entry.entity_id === member.user.id && entry.actor_user_id === admin.user.id));
  assert.equal(audit.filter((entry) => entry.action === "view").length, 1, "rejected views are not logged as views");
});

test("admin handoff codes are admin-only, single-use and re-checked on redeem", async () => {
  const handoffPath = "/api/auth/admin-handoff";
  assert.equal((await request(handoffPath, { method: "POST" })).status, 401, "requires sign-in");

  const registration = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Handoff Member", email: "handoff@example.test", password: "MemberPassword123" }),
  });
  assert.equal(registration.status, 201);
  const member = await registration.json() as { accessToken: string };
  assert.equal((await request(handoffPath, { method: "POST", headers: { Authorization: `Bearer ${member.accessToken}` } })).status, 403, "members cannot get a code");

  const admin = await login("admin@test.findthis", "AdminPassword123");
  const issued = await request(handoffPath, { method: "POST", headers: { Authorization: `Bearer ${admin.accessToken}` } });
  assert.equal(issued.status, 200);
  assert.equal(issued.headers.get("cache-control"), "no-store");
  const { code } = await issued.json() as { code: string };
  assert.match(code, /^[A-Za-z0-9_-]{43}$/);

  const redeem = (body: unknown) => request(`${handoffPath}/redeem`, { method: "POST", body: JSON.stringify(body) });
  const redeemed = await redeem({ code });
  assert.equal(redeemed.status, 200);
  const session = await redeemed.json() as { accessToken: string; user: { id: string; role: string } };
  assert.equal(session.user.id, admin.user.id);
  assert.equal(session.user.role, "admin");
  assert.equal((await request("/api/admin/data", { headers: { Authorization: `Bearer ${session.accessToken}` } })).status, 200);

  assert.equal((await redeem({ code })).status, 401, "a code works only once");
  assert.equal((await redeem({ code: "x".repeat(43) })).status, 401, "unknown codes are rejected");
  assert.equal((await redeem({ code: "short" })).status, 400, "malformed codes fail validation");
  assert.equal((await redeem({ code, role: "admin" })).status, 400, "extra fields are rejected");
});

test("offers carry stock and promotion status; an ended promotion shows the regular price", async () => {
  type Offer = { id: string; product_id: string; store: string; price: number; original_price: number; in_stock: boolean; promo_ends_at: string | null; promo_ended: boolean };
  const catalog = await (await request("/api/catalog")).json() as { offers: Offer[] };
  const find = (productId: string, store: string) => catalog.offers.find((offer) => offer.product_id === productId && offer.store === store);

  // Demo examples: o-005 (p-002 Lazada) out of stock, o-012 (p-005 Lazada) promotion ended on 2026-11-01.
  assert.equal(find("p-002", "Lazada")?.in_stock, false);
  assert.equal(find("p-002", "Shopee")?.in_stock, true);
  const ended = find("p-005", "Lazada");
  assert.equal(ended?.promo_ended, true);
  assert.equal(ended?.price, ended?.original_price, "no discount after the promotion ends");

  const admin = await login("admin@test.findthis", "AdminPassword123");
  const headers = { Authorization: `Bearer ${admin.accessToken}` };
  const base = { product_id: "p-003", store: "Amazon", price: 3000, original_price: 3990, shipping_info: "ส่งฟรี", product_url: "#" };
  const save = (body: unknown) => request("/api/admin/offers", { method: "POST", headers, body: JSON.stringify(body) });

  const defaults = await (await save(base)).json() as Offer;
  assert.equal(defaults.in_stock, true);
  assert.equal(defaults.promo_ends_at, null);
  assert.equal(defaults.promo_ended, false);

  const ignoredClientFlag = await (await save({ ...base, in_stock: false, promo_ends_at: "2099-12-31", promo_ended: true })).json() as Offer;
  assert.equal(ignoredClientFlag.in_stock, false);
  assert.equal(ignoredClientFlag.promo_ended, false, "promo_ended is computed by the backend, not taken from the client");

  const past = await (await save({ ...base, promo_ends_at: "2020-01-31" })).json() as Offer;
  assert.equal(past.promo_ended, true);

  assert.equal((await save({ ...base, promo_ends_at: "2026-02-30" })).status, 400, "impossible dates are rejected");
  assert.equal((await save({ ...base, promo_ends_at: "31/01/2026" })).status, 400, "only YYYY-MM-DD is accepted");
  assert.equal((await save({ ...base, in_stock: "no" })).status, 400);

  const adminData = await (await request("/api/admin/data", { headers })).json() as { offers: Offer[] };
  assert.equal(adminData.offers.find((offer) => offer.id === "o-005")?.in_stock, false);
  assert.equal(adminData.offers.find((offer) => offer.id === "o-012")?.promo_ended, true);
});
