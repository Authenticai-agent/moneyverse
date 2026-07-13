-- Add age integer column
ALTER TABLE "child_profiles" ADD COLUMN "age" INTEGER;

-- Map existing age bands to a representative age
UPDATE "child_profiles" SET "age" = 5 WHERE "age_band" = 'under_6';
UPDATE "child_profiles" SET "age" = 6 WHERE "age_band" = 'age_6_8';
UPDATE "child_profiles" SET "age" = 9 WHERE "age_band" = 'age_9_12';
UPDATE "child_profiles" SET "age" = 13 WHERE "age_band" = 'age_13_15';
UPDATE "child_profiles" SET "age" = 16 WHERE "age_band" = 'age_16_17';

-- Make age required
ALTER TABLE "child_profiles" ALTER COLUMN "age" SET NOT NULL;

-- Remove the old age band column and enum
ALTER TABLE "child_profiles" DROP COLUMN "age_band";
DROP TYPE "AgeBand";
