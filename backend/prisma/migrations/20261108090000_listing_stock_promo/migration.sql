-- Stock and promotion status per store listing (mock data). Existing rows stay in stock with no promotion end date.
ALTER TABLE "listings" ADD COLUMN "in_stock" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "listings" ADD COLUMN "promo_ends_at" DATE;
