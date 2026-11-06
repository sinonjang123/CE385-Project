import express from "express";
import { getCatalog } from "../../repositories/catalog.repository.js";
import {
  addFavorite,
  clearSearches,
  deleteSearch,
  listFavorites,
  listRecentSearches,
  recordSearch,
  removeFavorite,
} from "../../repositories/member.repository.js";
import { buildMockPriceHistory } from "../../services/mockPriceHistory.js";
import { principal, validationError } from "../../utils/http.js";
import { productIdParamSchema, recordSearchSchema, searchIdParamSchema } from "../../validators/member.schema.js";

/**
 * Member-only features: favorites, recent searches and (mock) price history.
 * Mounted inside the account router, which has already run requireUser.
 * Every query is scoped to the id from the verified token.
 */
const router = express.Router();

function param(request: express.Request, name: string): string {
  const value = request.params[name];
  return typeof value === "string" ? value : "";
}

// ---------- Favorites ----------

router.get("/favorites", async (request, response) => {
  response.json({ favorites: await listFavorites(principal(request).id) });
});

router.put("/favorites/:productId", async (request, response) => {
  const productId = productIdParamSchema.safeParse(param(request, "productId"));
  if (!productId.success || !await addFavorite(principal(request).id, productId.data)) {
    response.status(404).json({ message: "ไม่พบสินค้า" });
    return;
  }
  response.status(204).end();
});

router.delete("/favorites/:productId", async (request, response) => {
  const productId = productIdParamSchema.safeParse(param(request, "productId"));
  if (productId.success) await removeFavorite(principal(request).id, productId.data);
  response.status(204).end();
});

// ---------- Recent searches ----------

router.get("/searches", async (request, response) => {
  response.json({ searches: await listRecentSearches(principal(request).id) });
});

router.post("/searches", async (request, response) => {
  const parsed = recordSearchSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "คำค้นหาไม่ถูกต้อง", response);
    return;
  }
  const search = await recordSearch(principal(request).id, parsed.data.keyword);
  if (!search) {
    response.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });
    return;
  }
  response.status(201).json({ search });
});

router.delete("/searches/:searchId", async (request, response) => {
  const searchId = searchIdParamSchema.safeParse(param(request, "searchId"));
  if (!searchId.success || !await deleteSearch(principal(request).id, searchId.data)) {
    response.status(404).json({ message: "ไม่พบประวัติการค้นหานี้" });
    return;
  }
  response.status(204).end();
});

router.delete("/searches", async (request, response) => {
  await clearSearches(principal(request).id);
  response.status(204).end();
});

// ---------- Price history (mock) ----------

router.get("/price-history/:productId", async (request, response) => {
  const productId = productIdParamSchema.safeParse(param(request, "productId"));
  const catalog = await getCatalog();
  if (!productId.success || !catalog.products.some((product) => product.id === productId.data)) {
    response.status(404).json({ message: "ไม่พบสินค้า" });
    return;
  }
  const offers = catalog.offers.filter((offer) => offer.product_id === productId.data);
  response.json(buildMockPriceHistory(productId.data, offers));
});

export default router;
