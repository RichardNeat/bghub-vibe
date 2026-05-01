-- DropColumn (SQLite requires table recreation)
PRAGMA foreign_keys=OFF;

CREATE TABLE "Game_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Game_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Game_new" ("id", "name", "userId", "eventId") SELECT "id", "name", "userId", "eventId" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "Game_new" RENAME TO "Game";

-- CreateTable GamePlay
CREATE TABLE "GamePlay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "winner" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GamePlay_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GamePlay_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable GamePlayPlayer
CREATE TABLE "GamePlayPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gamePlayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "GamePlayPlayer_gamePlayId_fkey" FOREIGN KEY ("gamePlayId") REFERENCES "GamePlay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

PRAGMA foreign_keys=ON;
