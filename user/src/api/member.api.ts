import type { Favorite, PriceHistory, RecentSearch } from "../types/models";
import { http } from "./http";
import {
  favoritesResponseSchema,
  priceHistorySchema,
  recordSearchResponseSchema,
  searchesResponseSchema,
  searchKeywordSchema,
} from "./schemas";

// Member-only endpoints. The backend scopes every call to the signed-in account from the token.

export async function getFavorites(): Promise<Favorite[]> {
  const response = await http.get("/account/favorites");
  return favoritesResponseSchema.parse(response.data).favorites;
}

export async function addFavorite(productId: string): Promise<void> {
  await http.put(`/account/favorites/${encodeURIComponent(productId)}`);
}

export async function removeFavorite(productId: string): Promise<void> {
  await http.delete(`/account/favorites/${encodeURIComponent(productId)}`);
}

export async function getRecentSearches(): Promise<RecentSearch[]> {
  const response = await http.get("/account/searches");
  return searchesResponseSchema.parse(response.data).searches;
}

export async function recordSearch(keyword: string): Promise<RecentSearch> {
  const response = await http.post("/account/searches", { keyword: searchKeywordSchema.parse(keyword) });
  return recordSearchResponseSchema.parse(response.data).search;
}

export async function deleteSearch(searchId: string): Promise<void> {
  await http.delete(`/account/searches/${encodeURIComponent(searchId)}`);
}

export async function clearSearches(): Promise<void> {
  await http.delete("/account/searches");
}

export async function getPriceHistory(productId: string): Promise<PriceHistory> {
  const response = await http.get(`/account/price-history/${encodeURIComponent(productId)}`);
  return priceHistorySchema.parse(response.data);
}
