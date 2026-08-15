-- Adds the owner/admin role split: every existing account defaults to
-- "owner" (its current behavior is unchanged); "admin" accounts additionally
-- unlock the worker performance-analytics and AI database-Q&A pages.
ALTER TABLE "Owner" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'owner';
