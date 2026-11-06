import { http } from "./http";
import { healthSchema } from "./schemas";

export async function getApiHealth() {
  const response = await http.get("/health");
  return healthSchema.parse(response.data);
}
