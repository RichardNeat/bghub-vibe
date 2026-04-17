import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: `file:${path.resolve(__dirname, "../dev.db")}` });
const prisma = new PrismaClient({ adapter });

async function attend(userId: string, eventId: string) {
  const existing = await prisma.attendance.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (!existing) await prisma.attendance.create({ data: { userId, eventId } });
}

async function addGame(name: string, userId: string, eventId: string) {
  await prisma.game.create({ data: { name, userId, eventId } });
}

async function main() {
  const realUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!realUser) {
    console.log("No users found — sign in to the app first, then run the seed.");
    return;
  }

  const alice = await prisma.user.upsert({
    where: { email: "alice.seed@bghub.dev" },
    update: {},
    create: { email: "alice.seed@bghub.dev", name: "Alice (test)" },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob.seed@bghub.dev" },
    update: {},
    create: { email: "bob.seed@bghub.dev", name: "Bob (test)" },
  });

  // Guard: skip if already seeded
  const existing = await prisma.event.findFirst({
    where: { name: "Board Game Bonanza" },
  });
  if (existing) {
    console.log("Already seeded — skipping.");
    return;
  }

  // --- Past event 1 ---
  const event1 = await prisma.event.create({
    data: {
      name: "Board Game Bonanza",
      description: "Epic 6-hour session. Legends were made.",
      date: new Date("2025-11-15T18:00:00"),
      creatorId: realUser.id,
    },
  });
  await attend(realUser.id, event1.id);
  await attend(alice.id, event1.id);
  await attend(bob.id, event1.id);
  await addGame("Wingspan", realUser.id, event1.id);
  await addGame("Root", alice.id, event1.id);
  await addGame("Terraforming Mars", alice.id, event1.id);
  await addGame("Ticket to Ride", bob.id, event1.id);

  // --- Past event 2 ---
  const event2 = await prisma.event.create({
    data: {
      name: "New Year's Eve Game Night",
      description: "Rang in the new year with dice and cards.",
      date: new Date("2025-12-31T20:00:00"),
      creatorId: alice.id,
    },
  });
  await attend(realUser.id, event2.id);
  await attend(alice.id, event2.id);
  await addGame("Codenames", realUser.id, event2.id);
  await addGame("Catan", alice.id, event2.id);
  await addGame("Azul", realUser.id, event2.id);

  // --- Past event 3 ---
  const event3 = await prisma.event.create({
    data: {
      name: "Quick Lunch Games",
      description: "Short lunch break filler games.",
      date: new Date("2026-01-20T12:00:00"),
      creatorId: bob.id,
    },
  });
  await attend(bob.id, event3.id);
  await addGame("Sushi Go", bob.id, event3.id);
  await addGame("Coup", bob.id, event3.id);

  console.log(`✅ Seeded 3 past events for: ${realUser.name ?? realUser.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
