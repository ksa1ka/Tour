-- DropTable
DROP TABLE IF EXISTS "TournamentRegistration";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "tournamentId" TEXT NOT NULL,
    "captainId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Team_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("id", "name", "logo", "tournamentId", "createdAt", "updatedAt")
SELECT "id", "name", "logo", "tournamentId", "createdAt", "updatedAt" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_tournamentId_name_key" ON "Team"("tournamentId", "name");
CREATE UNIQUE INDEX "Team_captainId_tournamentId_key" ON "Team"("captainId", "tournamentId");
CREATE INDEX "Team_tournamentId_idx" ON "Team"("tournamentId");
CREATE INDEX "Team_captainId_idx" ON "Team"("captainId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
