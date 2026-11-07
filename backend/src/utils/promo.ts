/** Today's date (YYYY-MM-DD) in Thailand, used to decide whether a promotion has ended. */
export function todayInBangkok(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
}

/** A promotion runs through its end date (inclusive) and has ended from the next day. */
export function isPromoEnded(promoEndsAt: string | null, today = todayInBangkok()): boolean {
  return promoEndsAt !== null && promoEndsAt < today;
}
