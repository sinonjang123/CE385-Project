import rateLimit from "express-rate-limit";

const windowMs = 15 * 60 * 1000;
const common = { windowMs, standardHeaders: "draft-8", legacyHeaders: false } as const;

export const apiLimiter = rateLimit({ ...common, limit: 600 });
export const authLimiter = rateLimit({ ...common, limit: 30 });
export const adminLimiter = rateLimit({ ...common, limit: 120 });
