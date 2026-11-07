import type { StoreOffer } from "../types/models";

/** Out-of-stock offers are still listed, but never count as the lowest / best price. */
export function lowestInStockPrice(offers: StoreOffer[]): number | null {
  const prices = offers.filter((offer) => offer.in_stock).map((offer) => offer.price);
  return prices.length ? Math.min(...prices) : null;
}

/** In-stock offers first (cheapest first), then out-of-stock ones. */
export function sortOffersForDisplay(offers: StoreOffer[]): StoreOffer[] {
  return [...offers].sort((a, b) => Number(b.in_stock) - Number(a.in_stock) || a.price - b.price);
}
