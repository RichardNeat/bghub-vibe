import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClubsClient } from "./ClubsClient";

export default async function ClubsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [dbClubs, userClubs] = await Promise.all([
    prisma.club.findMany({ select: { id: true, name: true } }),
    userId
      ? prisma.userClub.findMany({ where: { userId }, select: { clubId: true } })
      : Promise.resolve([]),
  ]);

  const joinedClubIds = userClubs.map((uc) => uc.clubId);

  return <ClubsClient dbClubs={dbClubs} joinedClubIds={joinedClubIds} />;
}
