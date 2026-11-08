/**
 * Integration tests against a real PostgreSQL database (not run by `npm test`).
 *
 * Run with `npm run test:db` and TEST_DATABASE_URL pointing at a SEPARATE, migrated and seeded
 * test database whose name contains "test". The admin account must have been seeded with the
 * DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD values below. Rows created here are removed at the end.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "";
const testDatabaseName = testDatabaseUrl ? new URL(testDatabaseUrl).pathname.slice(1) : "";
if (!testDatabaseName.toLowerCase().includes("test")) {
  throw new Error("Set TEST_DATABASE_URL to a separate database whose name contains \"test\".");
}

process.env.PORT = "0";
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || "admin@test.findthis";
process.env.DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || "AdminPassword123";

const api = await import("../src/server.js");
const { prisma } = await import("../src/db/prisma.js");
assert.ok(prisma, "PostgreSQL mode must be enabled");
const db = prisma;

const run = randomBytes(4).toString("hex");
const emailFor = (name: string) => `db-${run}-${name}@example.test`;
const createdProductIds: number[] = [];
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
  if (createdProductIds.length) await db.product.deleteMany({ where: { id: { in: createdProductIds } } });
  await db.user.deleteMany({ where: { email: { startsWith: `db-${run}-` } } });
  await new Promise<void>((resolve, reject) => {
    api.server.close((error) => error ? reject(error) : resolve());
    api.server.closeAllConnections();
  });
  await db.$disconnect();
});

async function request(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
}

async function register(name: string) {
  const response = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: `DB ${name}`, email: emailFor(name), password: "MemberPassword123" }),
  });
  assert.equal(response.status, 201);
  const body = await response.json() as { accessToken: string; user: { id: string; role: string } };
  return { ...body, headers: { Authorization: `Bearer ${body.accessToken}` } };
}

async function adminHeaders() {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: process.env.DEMO_ADMIN_EMAIL, password: process.env.DEMO_ADMIN_PASSWORD }),
  });
  assert.equal(response.status, 200, "seeded admin can sign in");
  const body = await response.json() as { accessToken: string; user: { id: string; role: string } };
  assert.equal(body.user.role, "admin");
  return { id: body.user.id, headers: { Authorization: `Bearer ${body.accessToken}` } };
}

type Catalog = {
  products: Array<{ id: string }>;
  offers: Array<{ id: string; product_id: string; store: string; in_stock: boolean; promo_ended: boolean }>;
};

async function catalog() {
  const response = await request("/api/catalog");
  assert.equal(response.status, 200);
  return await response.json() as Catalog;
}

test("health reports PostgreSQL and the catalog comes from seeded tables", async () => {
  assert.deepEqual(await (await request("/api/health")).json(), { status: "ok", mode: "postgres", persistence: "postgresql" });
  const { products, offers } = await catalog();
  assert.equal(products.length, await db.product.count());
  assert.ok(products.length > 0, "seeded products are returned");
  for (const product of products) {
    assert.match(product.id, /^\d+$/, "ids are database ids");
  }
  assert.ok(offers.some((offer) => !offer.in_stock), "seeded out-of-stock offer");
  assert.ok(offers.some((offer) => offer.promo_ended), "seeded ended promotion is computed by the backend");
});

test("registration stores a bcrypt hash and the user role; duplicates hit the unique index", async () => {
  const user = await register("reg");
  const row = await db.user.findUnique({ where: { email: emailFor("reg") } });
  assert.ok(row);
  assert.equal(row.role, "user");
  assert.match(row.passwordHash, /^\$2[aby]\$12\$/);
  assert.notEqual(row.passwordHash, "MemberPassword123");

  const duplicate = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Dup", email: emailFor("reg").toUpperCase(), password: "MemberPassword123" }),
  });
  assert.equal(duplicate.status, 409);
  assert.equal(await db.user.count({ where: { email: emailFor("reg") } }), 1);

  assert.equal((await request("/api/admin/data", { headers: user.headers })).status, 403);
  const roleEscalation = await request("/api/account/profile", {
    method: "PATCH",
    headers: user.headers,
    body: JSON.stringify({ displayName: "DB reg", avatarUrl: null, role: "admin" }),
  });
  assert.equal(roleEscalation.status, 400);
  assert.equal((await db.user.findUnique({ where: { email: emailFor("reg") } }))?.role, "user");
});

test("admin product and offer CRUD is persisted, unique per store, and audited", async () => {
  const admin = await adminHeaders();
  const created = await request("/api/admin/products", {
    method: "POST",
    headers: admin.headers,
    body: JSON.stringify({ name: `DB Test Product ${run}`, brand: "Test", category: "เมาส์", description: "", image_url: "", emoji: "📦", specs: ["spec A", "spec B"] }),
  });
  assert.equal(created.status, 201);
  const product = await created.json() as { id: string };
  createdProductIds.push(Number(product.id));
  const productRow = await db.product.findUnique({ where: { id: Number(product.id) }, include: { specs: true } });
  assert.equal(productRow?.specs.length, 2);

  const offer = { product_id: product.id, store: "Shopee", price: 1500, original_price: 1990, shipping_info: "ส่งฟรี", product_url: "#" };
  const first = await request("/api/admin/offers", { method: "POST", headers: admin.headers, body: JSON.stringify(offer) });
  assert.equal(first.status, 201);
  const second = await request("/api/admin/offers", { method: "POST", headers: admin.headers, body: JSON.stringify({ ...offer, price: 1400 }) });
  assert.equal(second.status, 201);
  const listings = await db.listing.findMany({ where: { productId: Number(product.id) }, include: { store: true } });
  assert.equal(listings.length, 1, "one listing per product and store");
  assert.equal(Number(listings[0]?.price), 1400);
  assert.equal(listings[0]?.store.name, "Shopee");

  const badPrice = await request("/api/admin/offers", {
    method: "POST", headers: admin.headers, body: JSON.stringify({ ...offer, price: 2500 }),
  });
  assert.equal(badPrice.status, 400, "original price must be >= price");

  const audit = await db.adminAuditLog.findMany({ where: { entity: "product", entityId: product.id } });
  assert.ok(audit.some((entry) => entry.action === "create" && String(entry.actorUserId) === admin.id));

  assert.equal((await request(`/api/admin/products/${product.id}`, { method: "DELETE", headers: admin.headers })).status, 204);
  assert.equal(await db.listing.count({ where: { productId: Number(product.id) } }), 0, "listings cascade with the product");
  assert.equal(await db.productSpec.count({ where: { productId: Number(product.id) } }), 0, "specs cascade with the product");
  assert.equal((await request(`/api/admin/products/${product.id}`, { method: "DELETE", headers: admin.headers })).status, 404);
});

test("favorites and recent searches are stored per user in PostgreSQL", async () => {
  const alice = await register("alice");
  const bob = await register("bob");
  const [first, second] = (await catalog()).products;
  assert.ok(first && second);

  assert.equal((await request(`/api/account/favorites/${first.id}`, { method: "PUT", headers: alice.headers })).status, 204);
  assert.equal((await request(`/api/account/favorites/${first.id}`, { method: "PUT", headers: alice.headers })).status, 204);
  assert.equal((await request(`/api/account/favorites/${second.id}`, { method: "PUT", headers: alice.headers })).status, 204);
  assert.equal((await request("/api/account/favorites/999999999", { method: "PUT", headers: alice.headers })).status, 404);
  const aliceRow = await db.user.findUniqueOrThrow({ where: { email: emailFor("alice") } });
  assert.equal(await db.favorite.count({ where: { userId: aliceRow.id } }), 2, "idempotent: no duplicate rows");
  const bobFavorites = await (await request("/api/account/favorites", { headers: bob.headers })).json() as { favorites: unknown[] };
  assert.equal(bobFavorites.favorites.length, 0);

  for (let index = 0; index < 12; index += 1) {
    const saved = await request("/api/account/searches", { method: "POST", headers: alice.headers, body: JSON.stringify({ keyword: `คำค้น ${index}` }) });
    assert.equal(saved.status, 201);
  }
  assert.equal(await db.searchHistory.count({ where: { userId: aliceRow.id } }), 10, "only the 10 newest searches are kept");
  const searches = await (await request("/api/account/searches", { headers: alice.headers })).json() as { searches: Array<{ id: string; keyword: string }> };
  assert.equal(searches.searches[0]?.keyword, "คำค้น 11");
  const target = searches.searches[0];
  assert.ok(target);
  assert.equal((await request(`/api/account/searches/${target.id}`, { method: "DELETE", headers: bob.headers })).status, 404, "cannot delete another user's search");
  assert.equal(await db.searchHistory.count({ where: { userId: aliceRow.id } }), 10);

  const admin = await adminHeaders();
  const view = await request(`/api/admin/users/${alice.user.id}/view`, { headers: admin.headers });
  assert.equal(view.status, 200);
  assert.equal(await db.adminAuditLog.count({ where: { action: "view", entity: "user", entityId: alice.user.id } }), 1);

  await db.user.delete({ where: { id: aliceRow.id } });
  assert.equal(await db.favorite.count({ where: { userId: aliceRow.id } }), 0, "favorites cascade with the user");
  assert.equal(await db.searchHistory.count({ where: { userId: aliceRow.id } }), 0, "searches cascade with the user");
  assert.equal((await request("/api/account/favorites", { headers: alice.headers })).status, 401, "a deleted user's token stops working");
});
