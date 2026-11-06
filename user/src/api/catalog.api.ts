import { http } from "./http";
import { catalogSchema } from "./schemas";

/** Public endpoints — no login needed. */
export async function getCatalog() {
  const response = await http.get("/catalog");
  return catalogSchema.parse(response.data);
}
