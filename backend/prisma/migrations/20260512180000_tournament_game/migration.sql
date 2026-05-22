-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "game" TEXT NOT NULL DEFAULT 'VALORANT';

-- CreateIndex
CREATE INDEX "Tournament_game_idx" ON "Tournament"("game");
