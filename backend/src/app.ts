import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.js";
import { adminLimiter, apiLimiter, authLimiter } from "./middleware/rateLimits.js";
import adminRouter from "./routes/admin/index.js";
import publicRouter from "./routes/public/catalog.routes.js";
import accountRouter from "./routes/user/account.routes.js";
import authRouter from "./routes/user/auth.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use("/api", apiLimiter);
  // Only the profile update carries an avatar image; every other endpoint keeps the small body limit.
  const smallJson = express.json({ limit: "20kb" });
  const profileJson = express.json({ limit: "200kb" });
  app.use((request, response, next) => (
    request.path === "/api/account/profile" ? profileJson : smallJson
  )(request, response, next));
  app.use("/api/auth", authLimiter);
  app.use("/api/admin", adminLimiter);

  app.use("/api", publicRouter);       // public: health, catalog, mock retailers
  app.use("/api/auth", authRouter);    // user: register, login, me
  app.use("/api/account", accountRouter); // signed-in user: own profile, change password
  app.use("/api/admin", adminRouter);  // admin only

  app.use(errorHandler);
  return app;
}
