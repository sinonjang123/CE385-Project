export type Category =
  | "เมาส์"
  | "คีย์บอร์ด"
  | "หูฟัง"
  | "โน้ตบุ๊ก"
  | "รองเท้า"
  | "สมาร์ทวอทช์"
  | "พาวเวอร์แบงก์"
  | "สายชาร์จ"
  | "จอคอมพิวเตอร์";

export type StoreName = "Shopee" | "Lazada" | "Amazon";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  description: string;
  image_url: string;
  emoji: string;
  specs: string[];
  created_at: string;
};

export type StoreOffer = {
  id: string;
  product_id: string;
  store: StoreName;
  price: number;
  original_price: number;
  shipping_info: string;
  product_url: string;
  updated_at: string;
  /** false = สินค้าหมด at this store (mock data). */
  in_stock: boolean;
  /** Last day of the promotion (YYYY-MM-DD) or null. */
  promo_ends_at: string | null;
  /** Computed by the backend; the frontend only displays it. */
  promo_ended: boolean;
};

export type AppUser = {
  id: string;
  display_name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "pending";
  created_at: string;
};

export type CatalogData = {
  products: Product[];
  offers: StoreOffer[];
};

export type AdminData = CatalogData & {
  users: AppUser[];
};

export type AuthUser = Pick<AppUser, "id" | "display_name" | "email" | "role">;

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
  demo: boolean;
};

/** The signed-in user's own profile (GET/PATCH /api/account/profile). */
export type UserProfile = AuthUser & { avatar_url: string | null };

export type Favorite = { product_id: string; created_at: string };

export type RecentSearch = { id: string; keyword: string; searched_at: string };

/** Mock price history (GET /api/account/price-history/:productId) — not real past prices. */
export type PriceHistory = {
  mode: "mock";
  product_id: string;
  days: number;
  series: Array<{ store: StoreName; points: Array<{ date: string; price: number }> }>;
};
