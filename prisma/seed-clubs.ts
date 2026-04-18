import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: `file:${path.resolve(__dirname, "../dev.db")}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const bgc = await prisma.club.upsert({ where: { name: "BGC" }, update: {}, create: { name: "BGC" } });
  const soggycon = await prisma.club.upsert({ where: { name: "Soggycon" }, update: {}, create: { name: "Soggycon" } });

  const r1 = await prisma.event.updateMany({ where: { name: { contains: "Test BGC" } }, data: { clubId: bgc.id } });
  const r2 = await prisma.event.updateMany({ where: { name: { contains: "Test Soggy" } }, data: { clubId: soggycon.id } });

  console.log(`✅ BGC id: ${bgc.id} — linked ${r1.count} event(s)`);
  console.log(`✅ Soggycon id: ${soggycon.id} — linked ${r2.count} event(s)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
