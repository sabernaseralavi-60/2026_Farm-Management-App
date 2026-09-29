-- Public Vercel Blob URLs for evidence photos (compressed client-side
-- before upload) on the four modules where a photo is most useful:
-- machinery (breakdowns), orchard (tasks/damage), harvest (produce),
-- security (incidents).
ALTER TABLE "Machinery" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Orchard" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Harvest" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Security" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
