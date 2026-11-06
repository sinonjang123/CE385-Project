import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { databaseUrl } from "../config/env.js";

/** When DATABASE_URL is not set the API runs in in-memory demo mode and `prisma` is null. */
export const isDatabaseEnabled = Boolean(databaseUrl);

export const prisma = databaseUrl
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })
  : null;
