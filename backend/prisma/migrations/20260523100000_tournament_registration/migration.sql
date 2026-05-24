-- CreateTable
CREATE TABLE "TournamentRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRegistration_userId_tournamentId_key" ON "TournamentRegistration"("userId", "tournamentId");

-- CreateIndex
CREATE INDEX "TournamentRegistration_tournamentId_idx" ON "TournamentRegistration"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentRegistration_userId_idx" ON "TournamentRegistration"("userId");
