export type Category =
  | "เมาส์"
  | "คีย์บอร์ด"
  | "หูฟัง"
  | "โน้ตบุ๊ก"
  | "รองเท้า"
  | "สมาร์ทวอทช์";

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
