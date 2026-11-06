import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/db/prisma.js";
import { demoData } from "../src/data/demoData.js";

if (!prisma) {
  throw new Error("DATABASE_URL is required to seed PostgreSQL.");
}

for (const name of [...new Set(demoData.products.map((product) => product.category))]) {
  await prisma.category.upsert({ where: { name }, create: { name }, update: {} });
}

const categoryByName = new Map(
  (await prisma.category.findMany()).map((category) => [category.name, category.id]),
);

for (const product of [...demoData.products].reverse()) {
  const categoryId = categoryByName.get(product.category);
  if (!categoryId) throw new Error(`Missing category ${product.category}.`);
  const legacyName = product.id === "p-007" ? "Nike Air Zoom Pegasus รองเท้าวิ่ง" : null;
  const existing = await prisma.product.findFirst({ where: { name: product.name } })
    ?? (legacyName ? await prisma.product.findFirst({ where: { name: legacyName } }) : null);
  const data = {
    name: product.name,
    brand: product.brand,
    categoryId,
    description: product.description,
    imageUrl: product.image_url || null,
    emoji: product.emoji,
  };
  const specs = product.specs.map((specText, sortOrder) => ({ specText, sortOrder }));
  if (existing) {
    // Replace the existing specs on re-seed.
    await prisma.product.update({
      where: { id: existing.id },
      data: { ...data, specs: { deleteMany: {}, create: specs } },
    });
  } else {
    // `deleteMany` is not allowed in a create; a new product has no specs yet.
    await prisma.product.create({ data: { ...data, specs: { create: specs } } });
  }
}

const products = await prisma.product.findMany();
const productByName = new Map(products.map((product) => [product.name, product.id]));
const productBySeedId = new Map(demoData.products.map((product) => [product.id, productByName.get(product.name)]));
const storeUrls: Record<string, string> = {
  Shopee: "https://shopee.co.th/",
  Lazada: "https://www.lazada.co.th/",
  Amazon: "https://www.amazon.com/",
};
const stores = new Map<string, number>();
for (const offer of demoData.offers) {
  const seedProduct = demoData.products.find((product) => product.id === offer.product_id);
  const productId = seedProduct ? productBySeedId.get(seedProduct.id) : undefined;
  if (!productId) throw new Error(`Missing seeded product for offer ${offer.id}.`);
  let storeId = stores.get(offer.store);
  if (!storeId) {
    const store = await prisma.store.upsert({
      where: { name: offer.store },
      create: { name: offer.store, baseUrl: storeUrls[offer.store] ?? "#" },
      update: {},
    });
    storeId = store.id;
    stores.set(offer.store, storeId);
  }
  await prisma.listing.upsert({
    where: { productId_storeId: { productId, storeId } },
    create: {
      productId,
      storeId,
      price: offer.price,
      originalPrice: offer.original_price,
      shippingInfo: offer.shipping_info,
      productUrl: offer.product_url,
    },
    update: {
      price: offer.price,
      originalPrice: offer.original_price,
      shippingInfo: offer.shipping_info,
      productUrl: offer.product_url,
    },
  });
}

const adminEmail = (process.env.DEMO_ADMIN_EMAIL ?? "").trim().toLowerCase();
const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
const parsedAdminEmail = z.string().trim().max(255).email().safeParse(adminEmail);
const parsedAdminPassword = z.string().min(12).refine(
  (password) => Buffer.byteLength(password, "utf8") <= 72,
).safeParse(adminPassword);
if (!parsedAdminEmail.success || !parsedAdminPassword.success) {
  throw new Error("Set a valid DEMO_ADMIN_EMAIL and a DEMO_ADMIN_PASSWORD of 12-72 bytes before seeding.");
}
const adminPasswordHash = await bcrypt.hash(parsedAdminPassword.data, 12);
await prisma.user.upsert({
  where: { email: parsedAdminEmail.data },
  create: {
    email: parsedAdminEmail.data,
    passwordHash: adminPasswordHash,
    displayName: "คุณแอดมิน",
    role: "admin",
    status: "active",
  },
  update: { passwordHash: adminPasswordHash, role: "admin", status: "active" },
});

console.info("Seeded Find THIS products, store offers, and demo users.");
await prisma.$disconnect();
