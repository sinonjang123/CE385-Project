export type AppRole = "admin" | "user";
export type AppStatus = "active" | "pending";
export type StoreName = "Shopee" | "Lazada" | "Amazon";
export type AdminAuditAction = "create" | "update" | "delete";
export type AdminAuditEntity = "product" | "offer" | "user";

export type AdminAuditEntry = {
  id: string;
  actor_user_id: string | null;
  action: AdminAuditAction;
  entity: AdminAuditEntity;
  entity_id: string;
  created_at: string;
};

export type ProductDto = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  image_url: string;
  emoji: string;
  specs: string[];
  created_at: string;
};

export type StoreOfferDto = {
  id: string;
  product_id: string;
  store: StoreName;
  price: number;
  original_price: number;
  shipping_info: string;
  product_url: string;
  updated_at: string;
};

export type AppUserDto = {
  id: string;
  display_name: string;
  email: string;
  role: AppRole;
  status: AppStatus;
  created_at: string;
};

export type CatalogData = {
  products: ProductDto[];
  offers: StoreOfferDto[];
};

export type AdminData = CatalogData & {
  users: AppUserDto[];
};

export type AuthPrincipal = {
  id: string;
  display_name: string;
  email: string;
  role: AppRole;
};

export type AppUserRecord = AppUserDto & { password_hash: string };

/** The signed-in user's own profile. Never includes the password hash. */
export type UserProfileDto = AuthPrincipal & { avatar_url: string | null };
