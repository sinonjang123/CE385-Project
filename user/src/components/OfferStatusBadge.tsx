import type { StoreOffer } from "../types/models";

/** Stock / promotion label for one store offer (mock data). Nothing is shown for a normal in-stock offer. */
export default function OfferStatusBadge({ offer }: { offer: StoreOffer }) {
  if (!offer.in_stock) return <span className="offer-badge offer-badge-out">สินค้าหมด</span>;
  if (offer.promo_ended) return <span className="offer-badge offer-badge-ended">หมดโปรโมชั่น</span>;
  if (offer.promo_ends_at) return <span className="offer-badge offer-badge-promo">โปรถึง {offer.promo_ends_at}</span>;
  return null;
}
