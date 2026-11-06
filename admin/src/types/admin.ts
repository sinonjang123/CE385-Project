import type { AppUser, Product, StoreOffer } from "../types/models";

export type AdminPage = "overview" | "users" | "products" | "offers";
export type DataKind = "users" | "products" | "offers";
export type RecordToEdit = AppUser | Product | StoreOffer | null;
