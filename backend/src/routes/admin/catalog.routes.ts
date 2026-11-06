import express from "express";
import { recordAdminAudit } from "../../repositories/audit.repository.js";
import {
  deleteOffer,
  deleteProduct,
  getAdminData,
  saveOffer,
  saveProduct,
} from "../../repositories/catalog.repository.js";
import { principal, routeId, validationError } from "../../utils/http.js";
import { offerSchema, productSchema } from "../../validators/admin.schema.js";

/** Admin product & offer management. Auth is enforced by routes/admin/index.ts. */
const router = express.Router();

function isProductNotFound(error: unknown): boolean {
  return error instanceof Error && error.message === "PRODUCT_NOT_FOUND";
}

router.get("/data", async (_request, response) => {
  response.json(await getAdminData());
});

// ---------- Products ----------

router.post("/products", async (request, response) => {
  const parsed = productSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "ข้อมูลสินค้าไม่ถูกต้อง", response);
    return;
  }
  const { id: _id, ...input } = parsed.data;
  const product = await saveProduct(input);
  await recordAdminAudit({ actorUserId: principal(request).id, action: "create", entity: "product", entityId: product.id });
  response.status(201).json(product);
});

router.put("/products/:id", async (request, response) => {
  const parsed = productSchema.safeParse({ ...request.body, id: request.params.id });
  if (!parsed.success) {
    validationError(parsed.error, "ข้อมูลสินค้าไม่ถูกต้อง", response);
    return;
  }
  const product = await saveProduct(parsed.data);
  await recordAdminAudit({ actorUserId: principal(request).id, action: "update", entity: "product", entityId: product.id });
  response.json(product);
});

router.delete("/products/:id", async (request, response) => {
  const id = routeId(request);
  if (!await deleteProduct(id)) {
    response.status(404).json({ message: "ไม่พบสินค้า" });
    return;
  }
  await recordAdminAudit({ actorUserId: principal(request).id, action: "delete", entity: "product", entityId: id });
  response.status(204).end();
});

// ---------- Offers ----------

router.post("/offers", async (request, response) => {
  const parsed = offerSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "ข้อมูลข้อเสนอราคาไม่ถูกต้อง", response);
    return;
  }
  const { id: _id, ...input } = parsed.data;
  try {
    const offer = await saveOffer(input);
    await recordAdminAudit({ actorUserId: principal(request).id, action: "create", entity: "offer", entityId: offer.id });
    response.status(201).json(offer);
  } catch (error) {
    if (isProductNotFound(error)) {
      response.status(400).json({ message: "ไม่พบสินค้าที่เลือก" });
      return;
    }
    throw error;
  }
});

router.put("/offers/:id", async (request, response) => {
  const parsed = offerSchema.safeParse({ ...request.body, id: request.params.id });
  if (!parsed.success) {
    validationError(parsed.error, "ข้อมูลข้อเสนอราคาไม่ถูกต้อง", response);
    return;
  }
  try {
    const offer = await saveOffer(parsed.data);
    await recordAdminAudit({ actorUserId: principal(request).id, action: "update", entity: "offer", entityId: offer.id });
    response.json(offer);
  } catch (error) {
    if (isProductNotFound(error)) {
      response.status(400).json({ message: "ไม่พบสินค้าที่เลือก" });
      return;
    }
    throw error;
  }
});

router.delete("/offers/:id", async (request, response) => {
  const id = routeId(request);
  if (!await deleteOffer(id)) {
    response.status(404).json({ message: "ไม่พบข้อเสนอราคา" });
    return;
  }
  await recordAdminAudit({ actorUserId: principal(request).id, action: "delete", entity: "offer", entityId: id });
  response.status(204).end();
});

export default router;
