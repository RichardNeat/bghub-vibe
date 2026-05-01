-- Remove play data logged against events that have not yet started.

DELETE FROM "GamePlayPlayer"
WHERE "gamePlayId" IN (
  SELECT gp."id" FROM "GamePlay" gp
  INNER JOIN "Event" e ON gp."eventId" = e."id"
  WHERE e."date" > CURRENT_TIMESTAMP
);

DELETE FROM "GamePlay"
WHERE "eventId" IN (
  SELECT "id" FROM "Event" WHERE "date" > CURRENT_TIMESTAMP
);
