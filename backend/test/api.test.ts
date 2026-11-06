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
    offers: Array<{ product_id: string; store: string; price: number }>;
  };
  assert.equal(catalog.products.length, 8);
  for (const product of catalog.products) {
    const productOffers = catalog.offers.filter((offer) => offer.product_id === product.id);
    assert.deepEqual(productOffers.map((offer) => offer.store).sort(), ["Amazon", "Lazada", "Shopee"]);
    const prices = productOffers.map((offer) => offer.price);
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
  assert.deepEqual(retailerPayload.retailers.map((retailer) => retailer.offers.length), [8, 8, 8]);

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
