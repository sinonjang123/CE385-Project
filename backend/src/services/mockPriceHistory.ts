import type { PriceHistoryDto, StoreOfferDto } from "../types/index.js";

/**
 * MOCK price history. find THIS has no real retailer data, so this builds a plausible 30-day series per store
 * that ends at the store's current mock price. It is stable for the same product, current price and day
 * (no storage needed); it changes when the mock price changes, e.g. after an API restart.
 *
 * The `price_history` table records admin-entered listing prices, which are not what the site shows
 * (see services/mockRetailers.ts). When real retailer prices are connected, read the series from that table instead.
 */
export const priceHistoryDays = 30;
const maxDailyChange = 0.025; // ±2.5% per day
const maxDrift = 0.12;        // stays within ±12% of today's price

/** FNV-1a hash → [0, 1). Deterministic stand-in for randomness. */
function unitHash(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0x100000000;
}

const roundedPrice = (value: number) => Math.max(10, Math.round(value / 10) * 10);

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildMockPriceHistory(productId: string, offers: StoreOfferDto[], today = new Date()): PriceHistoryDto {
  const series = offers.map((offer) => {
    // Walk backwards from today's price so the last point always matches what the compare page shows.
    const ratios = [1];
    for (let daysAgo = 1; daysAgo < priceHistoryDays; daysAgo += 1) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - daysAgo);
      const step = (unitHash(`${productId}|${offer.store}|${isoDay(day)}`) - 0.5) * 2 * maxDailyChange;
      const previous = ratios[ratios.length - 1] ?? 1;
      ratios.push(Math.min(1 + maxDrift, Math.max(1 - maxDrift, previous * (1 + step))));
    }
    const points = ratios.map((ratio, daysAgo) => {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - daysAgo);
      return { date: isoDay(day), price: daysAgo === 0 ? offer.price : roundedPrice(offer.price * ratio) };
    }).reverse();
    return { store: offer.store, points };
  });
  return { mode: "mock", product_id: productId, days: priceHistoryDays, series };
}
