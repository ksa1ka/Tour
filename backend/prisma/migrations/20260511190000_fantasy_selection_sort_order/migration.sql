-- AlterTable
ALTER TABLE "FantasyTeamSelection" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve insertion order (createdAt, then id)
UPDATE "FantasyTeamSelection" AS fts
SET "sortOrder" = (
  SELECT COUNT(*)
  FROM "FantasyTeamSelection" AS p
  WHERE p."fantasyTeamId" = fts."fantasyTeamId"
    AND (
      p."createdAt" < fts."createdAt"
      OR (p."createdAt" = fts."createdAt" AND p."id" < fts."id")
    )
);

-- CreateIndex
CREATE INDEX "FantasyTeamSelection_fantasyTeamId_sortOrder_idx" ON "FantasyTeamSelection"("fantasyTeamId", "sortOrder");
