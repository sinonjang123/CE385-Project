import type { Category, StoreName } from "../types/models";

export const categories: Array<Category | "ทั้งหมด"> = ["ทั้งหมด", "เมาส์", "คีย์บอร์ด", "หูฟัง", "โน้ตบุ๊ก", "รองเท้า", "สมาร์ทวอทช์"];
export const stores: StoreName[] = ["Shopee", "Lazada", "Amazon"];

export const money = (amount: number) => `฿${amount.toLocaleString("th-TH")}`;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
export const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("");

export function storeMark(store: StoreName) {
  if (store === "Amazon") return "a";
  return store[0];
}

export function storeClass(store: StoreName) {
  return store.toLowerCase().replace(/\s+/g, "");
}

export function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}
