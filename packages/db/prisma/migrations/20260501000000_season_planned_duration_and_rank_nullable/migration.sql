-- AlterTable: add plannedDurationWeeks to Season
ALTER TABLE "Season" ADD COLUMN "plannedDurationWeeks" INTEGER;

-- AlterTable: make rank nullable in SeasonRanking and add default 0 for points
ALTER TABLE "SeasonRanking" ALTER COLUMN "rank" DROP NOT NULL;
ALTER TABLE "SeasonRanking" ALTER COLUMN "points" SET DEFAULT 0;
