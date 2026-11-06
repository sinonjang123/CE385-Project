import "dotenv/config";
import { createApp } from "./app.js";
import { adminBootstrap, isProduction, port } from "./config/env.js";
import { isDatabaseEnabled, prisma } from "./db/prisma.js";
import { seedDefaultCategories } from "./repositories/catalog.repository.js";
import { initializeMemoryAdmin } from "./repositories/user.repository.js";

await seedDefaultCategories();
if (adminBootstrap) {
  await initializeMemoryAdmin(adminBootstrap.email, adminBootstrap.password);
} else if (!isProduction) {
  console.warn("Admin bootstrap is disabled; set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD to enable it.");
}

export const server = createApp().listen(port, () => {
  console.info(`find THIS API listening on http://localhost:${port} (${isDatabaseEnabled ? "PostgreSQL" : "in-memory demo"})`);
});

async function shutdown() {
  server.close();
  await prisma?.$disconnect();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
