-- AlterTable Tournament
ALTER TABLE "Tournament" ADD COLUMN "fantasyActivePredictions" TEXT;

-- AlterTable Match
ALTER TABLE "Match" ADD COLUMN "mvpPlayerId" TEXT;
ALTER TABLE "Match" ADD COLUMN "firstKillPlayerId" TEXT;

-- AlterTable FantasyTeam
ALTER TABLE "FantasyTeam" ADD COLUMN "rosterPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "FantasyTeam" ADD COLUMN "fantasyPredictionPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "FantasyTeam" ADD COLUMN "fantasyBonusPoints" INTEGER NOT NULL DEFAULT 0;

UPDATE "FantasyTeam" SET "rosterPoints" = "points" WHERE "rosterPoints" = 0;

-- CreateTable FantasyMatchPrediction
CREATE TABLE "FantasyMatchPrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fantasyTeamId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "predictedWinnerTeamId" TEXT,
    "predictedMvpPlayerId" TEXT,
    "predictedFirstKillPlayerId" TEXT,
    "predictedHighestScoreTeamId" TEXT,
    "predictedScoreA" INTEGER,
    "predictedScoreB" INTEGER,
    "ptsWinner" INTEGER NOT NULL DEFAULT 0,
    "ptsMvp" INTEGER NOT NULL DEFAULT 0,
    "ptsFirstKill" INTEGER NOT NULL DEFAULT 0,
    "ptsHighestScore" INTEGER NOT NULL DEFAULT 0,
    "ptsExactScore" INTEGER NOT NULL DEFAULT 0,
    "bonusPts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FantasyMatchPrediction_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FantasyMatchPrediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FantasyMatchPrediction_predictedWinnerTeamId_fkey" FOREIGN KEY ("predictedWinnerTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FantasyMatchPrediction_predictedMvpPlayerId_fkey" FOREIGN KEY ("predictedMvpPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FantasyMatchPrediction_predictedFirstKillPlayerId_fkey" FOREIGN KEY ("predictedFirstKillPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FantasyMatchPrediction_predictedHighestScoreTeamId_fkey" FOREIGN KEY ("predictedHighestScoreTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FantasyMatchPrediction_fantasyTeamId_matchId_key" ON "FantasyMatchPrediction"("fantasyTeamId", "matchId");
CREATE INDEX "FantasyMatchPrediction_matchId_idx" ON "FantasyMatchPrediction"("matchId");
CREATE INDEX "FantasyMatchPrediction_fantasyTeamId_idx" ON "FantasyMatchPrediction"("fantasyTeamId");

CREATE INDEX "Match_mvpPlayerId_idx" ON "Match"("mvpPlayerId");
CREATE INDEX "Match_firstKillPlayerId_idx" ON "Match"("firstKillPlayerId");
