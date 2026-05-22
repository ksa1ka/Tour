-- AlterTable
ALTER TABLE "User" ADD COLUMN "fantasyPointsBalance" INTEGER NOT NULL DEFAULT 2000;

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Reward_sortOrder_idx" ON "Reward"("sortOrder");

-- CreateIndex
CREATE INDEX "Reward_price_idx" ON "Reward"("price");

-- CreateIndex
CREATE INDEX "UserReward_userId_idx" ON "UserReward"("userId");

-- CreateIndex
CREATE INDEX "UserReward_rewardId_idx" ON "UserReward"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReward_userId_rewardId_key" ON "UserReward"("userId", "rewardId");
