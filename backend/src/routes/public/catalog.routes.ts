import express from "express";
import { isDatabaseEnabled } from "../../db/prisma.js";
import { getCatalog } from "../../repositories/catalog.repository.js";
import { getMockRetailerPayload } from "../../services/mockRetailers.js";

/** Public endpoints: no login required. */
const router = express.Router();

router.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    mode: isDatabaseEnabled ? "postgres" : "demo",
    persistence: isDatabaseEnabled ? "postgresql" : "memory",
  });
});

router.get("/catalog", async (_request, response) => {
  response.json(await getCatalog());
});

router.get("/mock/retailers", async (_request, response) => {
  const catalog = await getCatalog();
  response.json(getMockRetailerPayload(catalog.offers));
});

export default router;
