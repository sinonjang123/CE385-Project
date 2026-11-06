import type { StoreName, StoreOffer } from "../types/models";

// Public search pages only. Nothing is fetched from the retailers; prices on find THIS stay mock data.
const searchUrls: Record<StoreName, (query: string) => string> = {
  Shopee: (query) => `https://shopee.co.th/search?keyword=${query}`,
  Lazada: (query) => `https://www.lazada.co.th/catalog/?q=${query}`,
  Amazon: (query) => `https://www.amazon.com/s?k=${query}`,
};

export type StoreLink = { href: string; label: string; kind: "product" | "search" };

/** Uses the product/affiliate link set in admin when there is one, otherwise a search on the retailer site. */
export function storeLink(offer: StoreOffer, productName: string): StoreLink {
  if (/^https?:\/\//.test(offer.product_url)) {
    return { href: offer.product_url, label: "ไปที่ร้าน", kind: "product" };
  }
  return { href: searchUrls[offer.store](encodeURIComponent(productName)), label: `ค้นหาใน ${offer.store}`, kind: "search" };
}
