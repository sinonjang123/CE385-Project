import { prisma } from "../db/prisma.js";
import { fetchMockRetailerOffers } from "../services/mockRetailers.js";
import type { AdminData, CatalogData, ProductDto, StoreOfferDto } from "../types/index.js";
import { integerId, toOffer, toProduct, toUser } from "./mappers.js";
import { memory, removeMemoryProductData } from "./memoryStore.js";

const categoryDefaults = ["เมาส์", "คีย์บอร์ด", "หูฟัง", "โน้ตบุ๊ก", "รองเท้า", "สมาร์ทวอทช์", "พาวเวอร์แบงก์", "สายชาร์จ", "จอคอมพิวเตอร์"];
const supportedStores = ["Shopee", "Lazada", "Amazon"];
const storeUrls: Record<string, string> = {
  Shopee: "https://shopee.co.th/",
  Lazada: "https://www.lazada.co.th/",
  Amazon: "https://www.amazon.com/",
};

async function loadProductsAndOffers() {
  if (!prisma) throw new Error("Database is not configured.");
  const [products, offers] = await Promise.all([
    prisma.product.findMany({ include: { category: true, specs: true }, orderBy: { createdAt: "desc" } }),
    prisma.listing.findMany({
      where: { store: { name: { in: supportedStores } } },
      include: { store: true },
      orderBy: { price: "asc" },
    }),
  ]);
  return { products: products.map(toProduct), offers: offers.map(toOffer) };
}

/** Public catalog: stored products with mock retailer prices (not live data). */
export async function getCatalog(): Promise<CatalogData> {
  if (prisma) {
    const { products, offers } = await loadProductsAndOffers();
    return { products, offers: fetchMockRetailerOffers(products, offers) };
  }
  const products = structuredClone(memory.products);
  return { products, offers: fetchMockRetailerOffers(products, memory.offers) };
}

/** Admin view: the raw stored products, offers and users. */
export async function getAdminData(): Promise<AdminData> {
  if (prisma) {
    const [{ products, offers }, users] = await Promise.all([
      loadProductsAndOffers(),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, omit: { avatarUrl: true } }),
    ]);
    return { products, offers, users: users.map((user) => toUser(user)) };
  }
  return structuredClone(memory);
}

export async function saveProduct(input: Omit<ProductDto, "id" | "created_at"> & { id?: string }): Promise<ProductDto> {
  if (!prisma) {
    const id = input.id || `p-${crypto.randomUUID()}`;
    const product: ProductDto = { ...input, id, created_at: new Date().toISOString().slice(0, 10) };
    const index = memory.products.findIndex((item) => item.id === id);
    if (index >= 0) memory.products[index] = product;
    else memory.products.unshift(product);
    return product;
  }
  const id = input.id ? integerId(input.id) : null;
  const category = await prisma.category.upsert({
    where: { name: input.category },
    create: { name: input.category },
    update: {},
  });
  const data = {
    name: input.name,
    brand: input.brand,
    description: input.description || null,
    imageUrl: input.image_url || null,
    emoji: input.emoji || null,
    categoryId: category.id,
    specs: {
      deleteMany: {},
      create: input.specs.map((specText, sortOrder) => ({ specText, sortOrder })),
    },
  };
  const row = id === null
    ? await prisma.product.create({ data, include: { category: true, specs: true } })
    : await prisma.product.update({ where: { id }, data, include: { category: true, specs: true } });
  return toProduct(row);
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!prisma) {
    const exists = memory.products.some((product) => product.id === id);
    memory.products = memory.products.filter((product) => product.id !== id);
    memory.offers = memory.offers.filter((offer) => offer.product_id !== id);
    removeMemoryProductData(id);
    return exists;
  }
  const parsedId = integerId(id);
  if (parsedId === null) return false;
  await prisma.product.delete({ where: { id: parsedId } });
  return true;
}

export async function saveOffer(input: Omit<StoreOfferDto, "id" | "updated_at"> & { id?: string }): Promise<StoreOfferDto> {
  if (!prisma) {
    if (!memory.products.some((product) => product.id === input.product_id)) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    const id = input.id || `o-${crypto.randomUUID()}`;
    const offer: StoreOfferDto = { ...input, id, updated_at: new Date().toISOString() };
    const index = memory.offers.findIndex((item) => item.id === id);
    if (index >= 0) memory.offers[index] = offer;
    else memory.offers.unshift(offer);
    return offer;
  }
  const productId = integerId(input.product_id);
  const id = input.id ? integerId(input.id) : null;
  if (productId === null) throw new Error("PRODUCT_NOT_FOUND");
  if (!await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })) {
    throw new Error("PRODUCT_NOT_FOUND");
  }
  const store = await prisma.store.upsert({
    where: { name: input.store },
    create: { name: input.store, baseUrl: storeUrls[input.store] ?? "#" },
    update: {},
  });
  const data = {
    productId,
    storeId: store.id,
    price: input.price,
    originalPrice: input.original_price,
    shippingInfo: input.shipping_info,
    productUrl: input.product_url,
  };
  const row = await prisma.$transaction(async (transaction) => {
    const existing = id === null
      ? await transaction.listing.findUnique({ where: { productId_storeId: { productId, storeId: store.id } } })
      : await transaction.listing.findUnique({ where: { id } });
    const listing = existing
      ? await transaction.listing.update({ where: { id: existing.id }, data, include: { store: true } })
      : await transaction.listing.create({ data, include: { store: true } });
    if (!existing || Number(existing.price) !== input.price) {
      await transaction.priceHistory.create({
        data: { listingId: listing.id, price: input.price },
      });
    }
    return listing;
  });
  return toOffer(row);
}

export async function deleteOffer(id: string): Promise<boolean> {
  if (!prisma) {
    const exists = memory.offers.some((offer) => offer.id === id);
    memory.offers = memory.offers.filter((offer) => offer.id !== id);
    return exists;
  }
  const parsedId = integerId(id);
  if (parsedId === null) return false;
  await prisma.listing.delete({ where: { id: parsedId } });
  return true;
}

/** Ensure the default categories exist (PostgreSQL mode only). */
export async function seedDefaultCategories(): Promise<void> {
  if (!prisma) return;
  for (const name of categoryDefaults) {
    await prisma.category.upsert({ where: { name }, create: { name }, update: {} });
  }
}
