-- Seed BGC and Soggycon clubs
INSERT OR IGNORE INTO "Club" ("id", "name") VALUES ('club_bgc', 'BGC');
INSERT OR IGNORE INTO "Club" ("id", "name") VALUES ('club_soggycon', 'Soggycon');

-- Link existing events to their clubs by name
UPDATE "Event" SET "clubId" = 'club_bgc' WHERE "name" = 'Test BGC';
UPDATE "Event" SET "clubId" = 'club_soggycon' WHERE "name" = 'Test Soggy';