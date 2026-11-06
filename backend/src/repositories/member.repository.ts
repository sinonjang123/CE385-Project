import { prisma } from "../db/prisma.js";
import type { FavoriteDto, RecentSearchDto } from "../types/index.js";
import { integerId } from "./mappers.js";
import { memory, memoryFavorites, memorySearches, removeWhere } from "./memoryStore.js";

/** Recent searches shown to a member; older entries beyond this are deleted. */
export const recentSearchLimit = 10;

// ---------- Favorites (wishlist) ----------

export async function listFavorites(userId: string): Promise<FavoriteDto[]> {
  if (prisma) {
    const parsedUserId = integerId(userId);
    if (parsedUserId === null) return [];
    const rows = await prisma.favorite.findMany({ where: { userId: parsedUserId }, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ product_id: String(row.productId), created_at: row.createdAt.toISOString() }));
  }
  return memoryFavorites
    .filter((row) => row.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ product_id, created_at }) => ({ product_id, created_at }));
}

/** Idempotent. Returns false when the product does not exist. */
export async function addFavorite(userId: string, productId: string): Promise<boolean> {
  if (prisma) {
    const parsedUserId = integerId(userId);
    const parsedProductId = integerId(productId);
    if (parsedUserId === null || parsedProductId === null) return false;
    if (!await prisma.product.findUnique({ where: { id: parsedProductId }, select: { id: true } })) return false;
    await prisma.favorite.upsert({
      where: { userId_productId: { userId: parsedUserId, productId: parsedProductId } },
      create: { userId: parsedUserId, productId: parsedProductId },
      update: {},
    });
    return true;
  }
  if (!memory.products.some((product) => product.id === productId)) return false;
  if (!memoryFavorites.some((row) => row.user_id === userId && row.product_id === productId)) {
    memoryFavorites.push({ user_id: userId, product_id: productId, created_at: new Date().toISOString() });
  }
  return true;
}

/** Idempotent: removing a product that is not a favorite is not an error. */
export async function removeFavorite(userId: string, productId: string): Promise<void> {
  if (prisma) {
    const parsedUserId = integerId(userId);
    const parsedProductId = integerId(productId);
    if (parsedUserId === null || parsedProductId === null) return;
    await prisma.favorite.deleteMany({ where: { userId: parsedUserId, productId: parsedProductId } });
    return;
  }
  removeWhere(memoryFavorites, (row) => row.user_id === userId && row.product_id === productId);
}

// ---------- Recent searches ----------

/** Newest first. Entries are appended, so array order is insertion order (timestamps can tie). */
function memoryUserSearches(userId: string) {
  return memorySearches.filter((row) => row.user_id === userId).reverse();
}

export async function listRecentSearches(userId: string): Promise<RecentSearchDto[]> {
  if (prisma) {
    const parsedUserId = integerId(userId);
    if (parsedUserId === null) return [];
    const rows = await prisma.searchHistory.findMany({
      where: { userId: parsedUserId },
      orderBy: { searchedAt: "desc" },
      take: recentSearchLimit,
    });
    return rows.map((row) => ({ id: String(row.id), keyword: row.keyword, searched_at: row.searchedAt.toISOString() }));
  }
  return memoryUserSearches(userId)
    .slice(0, recentSearchLimit)
    .map(({ id, keyword, searched_at }) => ({ id, keyword, searched_at }));
}

/** Stores a search, moving a repeated keyword to the top and keeping only the latest entries. */
export async function recordSearch(userId: string, keyword: string): Promise<RecentSearchDto | null> {
  if (prisma) {
    const parsedUserId = integerId(userId);
    if (parsedUserId === null) return null;
    const row = await prisma.$transaction(async (transaction) => {
      await transaction.searchHistory.deleteMany({
        where: { userId: parsedUserId, keyword: { equals: keyword, mode: "insensitive" } },
      });
      const created = await transaction.searchHistory.create({ data: { userId: parsedUserId, keyword } });
      const stale = await transaction.searchHistory.findMany({
        where: { userId: parsedUserId },
        orderBy: { searchedAt: "desc" },
        skip: recentSearchLimit,
        select: { id: true },
      });
      if (stale.length) await transaction.searchHistory.deleteMany({ where: { id: { in: stale.map((item) => item.id) } } });
      return created;
    });
    return { id: String(row.id), keyword: row.keyword, searched_at: row.searchedAt.toISOString() };
  }
  const normalized = keyword.toLocaleLowerCase();
  removeWhere(memorySearches, (row) => row.user_id === userId && row.keyword.toLocaleLowerCase() === normalized);
  const entry = { id: `s-${crypto.randomUUID()}`, user_id: userId, keyword, searched_at: new Date().toISOString() };
  memorySearches.push(entry);
  const stale = memoryUserSearches(userId)
    .slice(recentSearchLimit)
    .map((row) => row.id);
  removeWhere(memorySearches, (row) => stale.includes(row.id));
  return { id: entry.id, keyword, searched_at: entry.searched_at };
}

/** Deletes one of the user's own searches. Returns false if it does not exist or belongs to someone else. */
export async function deleteSearch(userId: string, searchId: string): Promise<boolean> {
  if (prisma) {
    const parsedUserId = integerId(userId);
    if (parsedUserId === null || !/^\d+$/.test(searchId)) return false;
    const result = await prisma.searchHistory.deleteMany({ where: { id: BigInt(searchId), userId: parsedUserId } });
    return result.count > 0;
  }
  const before = memorySearches.length;
  removeWhere(memorySearches, (row) => row.id === searchId && row.user_id === userId);
  return memorySearches.length < before;
}

export async function clearSearches(userId: string): Promise<void> {
  if (prisma) {
    const parsedUserId = integerId(userId);
    if (parsedUserId === null) return;
    await prisma.searchHistory.deleteMany({ where: { userId: parsedUserId } });
    return;
  }
  removeWhere(memorySearches, (row) => row.user_id === userId);
}
