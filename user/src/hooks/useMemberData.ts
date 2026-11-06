import { useCallback, useEffect, useState } from "react";
import { addFavorite, clearSearches, deleteSearch, getFavorites, getRecentSearches, recordSearch, removeFavorite } from "../api/member.api";
import type { RecentSearch } from "../types/models";
import { apiErrorMessage } from "../utils/errors";

const recentSearchLimit = 10;

/** Favorites and recent searches of the signed-in member. Empty (and no API calls) for guests. */
export function useMemberData(userId: string | undefined, notify: (message: string) => void) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setFavoriteIds([]);
    setRecentSearches([]);
    if (!userId) return;
    let active = true;
    Promise.all([getFavorites(), getRecentSearches()]).then(([favorites, searches]) => {
      if (!active) return;
      setFavoriteIds(favorites.map((favorite) => favorite.product_id));
      setRecentSearches(searches);
    }).catch((error: unknown) => {
      if (active) notify(apiErrorMessage(error, "โหลดรายการโปรดและประวัติการค้นหาไม่สำเร็จ"));
    });
    return () => { active = false; };
  }, [userId, notify]);

  const toggleFavorite = useCallback(async (productId: string) => {
    const wasFavorite = favoriteIds.includes(productId);
    // Optimistic update, reverted if the API call fails.
    setFavoriteIds((ids) => wasFavorite ? ids.filter((id) => id !== productId) : [productId, ...ids]);
    try {
      if (wasFavorite) await removeFavorite(productId);
      else await addFavorite(productId);
      notify(wasFavorite ? "นำออกจากรายการโปรดแล้ว" : "เพิ่มในรายการโปรดแล้ว");
    } catch (error) {
      setFavoriteIds((ids) => wasFavorite ? [productId, ...ids.filter((id) => id !== productId)] : ids.filter((id) => id !== productId));
      notify(apiErrorMessage(error, "บันทึกรายการโปรดไม่สำเร็จ"));
    }
  }, [favoriteIds, notify]);

  const saveSearch = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!userId || !trimmed) return;
    try {
      const saved = await recordSearch(trimmed);
      const normalized = saved.keyword.toLocaleLowerCase();
      setRecentSearches((items) => [saved, ...items.filter((item) => item.keyword.toLocaleLowerCase() !== normalized)].slice(0, recentSearchLimit));
    } catch (error) {
      notify(apiErrorMessage(error, "บันทึกประวัติการค้นหาไม่สำเร็จ"));
    }
  }, [userId, notify]);

  const removeSearch = useCallback(async (searchId: string) => {
    try {
      await deleteSearch(searchId);
      setRecentSearches((items) => items.filter((item) => item.id !== searchId));
    } catch (error) {
      notify(apiErrorMessage(error, "ลบประวัติการค้นหาไม่สำเร็จ"));
    }
  }, [notify]);

  const clearAllSearches = useCallback(async () => {
    try {
      await clearSearches();
      setRecentSearches([]);
      notify("ล้างประวัติการค้นหาแล้ว");
    } catch (error) {
      notify(apiErrorMessage(error, "ล้างประวัติการค้นหาไม่สำเร็จ"));
    }
  }, [notify]);

  return { favoriteIds, recentSearches, toggleFavorite, saveSearch, removeSearch, clearAllSearches };
}
