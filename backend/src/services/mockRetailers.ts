import type { ProductDto, StoreOfferDto, StoreName } from "../types/index.js";

export const mockRetailers: Array<{
  name: StoreName;
  url: string;
  description: string;
}> = [
  {
    name: "Shopee",
    url: "https://shopee.co.th/",
    description: "ตลาดออนไลน์และร้านค้าหลากหลายหมวดหมู่",
  },
  {
    name: "Lazada",
    url: "https://www.lazada.co.th/",
    description: "ตลาดออนไลน์และร้านค้าแบรนด์ชั้นนำ",
  },
  {
    name: "Amazon",
    url: "https://www.amazon.com/",
    description: "ตลาดออนไลน์และร้านค้าจากต่างประเทศ",
  },
];

const generatedOffers = new Map<string, {
  referencePrice: number;
  offers: StoreOfferDto[];
}>();
const categoryReferencePrices: Record<string, number> = {
  เมาส์: 2500,
  คีย์บอร์ด: 4000,
  หูฟัง: 5000,
  โน้ตบุ๊ก: 40000,
  รองเท้า: 3500,
  สมาร์ทวอทช์: 10000,
};

function roundedPrice(value: number): number {
  return Math.max(10, Math.round(value / 10) * 10);
}

function mockPrice(referencePrice: number): number {
  return roundedPrice(referencePrice * (0.95 + Math.random() * 0.1));
}

export function fetchMockRetailerOffers(
  products: ProductDto[],
  offers: StoreOfferDto[],
): StoreOfferDto[] {
  const activeProductIds = new Set(products.map((product) => product.id));
  for (const productId of generatedOffers.keys()) {
    if (!activeProductIds.has(productId)) generatedOffers.delete(productId);
  }

  return products.flatMap((product) => {
    const productOffers = offers.filter((offer) => offer.product_id === product.id);
    const referencePrice = productOffers.length
      ? productOffers.reduce((sum, offer) => sum + offer.price, 0) / productOffers.length
      : categoryReferencePrices[product.category] ?? 2500;
    let cached = generatedOffers.get(product.id);
    if (!cached || cached.referencePrice !== referencePrice) {
      const generated = mockRetailers.map(({ name }) => {
        const price = mockPrice(referencePrice);
        return {
          id: `mock-${product.id}-${name.toLowerCase()}`,
          product_id: product.id,
          store: name,
          price,
          original_price: roundedPrice(price * 1.08),
          shipping_info: name === "Amazon" ? "ค่าจัดส่งจำลอง" : "ส่งฟรี (จำลอง)",
          product_url: "#",
          updated_at: new Date().toISOString(),
        };
      });
      cached = { referencePrice, offers: generated };
      generatedOffers.set(product.id, cached);
    }
    return cached.offers.map((offer) => ({ ...offer }));
  });
}

export function getMockRetailerPayload(offers: StoreOfferDto[]) {
  return {
    mode: "mock" as const,
    retailers: mockRetailers.map((retailer) => ({
      ...retailer,
      offers: offers.filter((offer) => offer.store === retailer.name),
    })),
  };
}
