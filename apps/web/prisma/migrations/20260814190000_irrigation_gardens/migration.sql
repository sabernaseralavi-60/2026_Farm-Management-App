-- Irrigation module redesign: the 200 "آبریز" checkbox grid is replaced by
-- 43 named gardens spread across 4 map zones. The underlying column keeps
-- its Int[] type (no data loss) and is just renamed to reflect the new
-- meaning; values recorded under the old scheme are historical only.
ALTER TABLE "Irrigation" RENAME COLUMN "state" TO "gardens";
