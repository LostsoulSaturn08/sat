/*
  Warnings:

  - You are about to drop the column `taskId` on the `Streak` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JournalEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "reason" TEXT NOT NULL,
    "mitigation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_JournalEntry" ("createdAt", "id", "mitigation", "reason", "taskId", "userId") SELECT "createdAt", "id", "mitigation", "reason", "taskId", "userId" FROM "JournalEntry";
DROP TABLE "JournalEntry";
ALTER TABLE "new_JournalEntry" RENAME TO "JournalEntry";
CREATE TABLE "new_Streak" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "prevCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL,
    CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Streak" ("count", "id", "lastUpdated", "userId") SELECT "count", "id", "lastUpdated", "userId" FROM "Streak";
DROP TABLE "Streak";
ALTER TABLE "new_Streak" RENAME TO "Streak";
CREATE UNIQUE INDEX "Streak_userId_key" ON "Streak"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
