-- Profile picture stored as a validated data URL (png/jpeg/webp, size-limited by the API).
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
