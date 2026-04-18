"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user;
}

function isAdmin(email: string | null | undefined) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function createEvent(formData: FormData) {
  const user = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  const date = formData.get("date") as string;
  const description = (formData.get("description") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();
  const clubId = (formData.get("clubId") as string)?.trim();

  if (!name || !date || !clubId) return;

  const eventDate = new Date(date);
  if (eventDate <= new Date()) return;

  const event = await prisma.event.create({
    data: {
      name,
      date: eventDate,
      description: description || null,
      location: location || null,
      clubId,
      creatorId: user.id!,
    },
  });

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const user = await requireUser();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.creatorId !== user.id || event.date < new Date()) return;

  const name = (formData.get("name") as string)?.trim();
  const date = formData.get("date") as string;
  const description = (formData.get("description") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();

  if (!name || !date) return;
  const eventDate = new Date(date);
  if (eventDate <= new Date()) return;

  await prisma.event.update({
    where: { id: eventId },
    data: { name, date: eventDate, description: description || null, location: location || null },
  });

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const user = await requireUser();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || (event.creatorId !== user.id && !isAdmin(user.email))) return;

  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/events");
  redirect("/events");
}

export async function toggleAttendance(eventId: string) {
  const user = await requireUser();

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return;

  const existing = await prisma.attendance.findUnique({
    where: { userId_eventId: { userId: user.id!, eventId } },
  });

  if (existing) {
    await prisma.attendance.delete({ where: { id: existing.id } });
    await prisma.game.deleteMany({ where: { userId: user.id!, eventId } });
    const eventGameIds = (await prisma.game.findMany({ where: { eventId }, select: { id: true } })).map((g) => g.id);
    await prisma.gameVote.deleteMany({ where: { userId: user.id!, gameId: { in: eventGameIds } } });
    await prisma.gameWant.deleteMany({ where: { userId: user.id!, gameId: { in: eventGameIds } } });
  } else {
    await prisma.attendance.create({ data: { userId: user.id!, eventId } });
  }

  revalidatePath(`/events/${eventId}`);
}

export async function addGame(eventId: string, formData: FormData): Promise<{ gameId: string; gameName: string } | null> {
  const user = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return null;

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return null;

  const game = await prisma.game.create({ data: { name, userId: user.id!, eventId } });
  revalidatePath(`/events/${eventId}`);
  return { gameId: game.id, gameName: game.name };
}

export async function removeAttendance(attendanceId: string, eventId: string) {
  const user = await requireUser();
  if (!isAdmin(user.email)) return;
  await prisma.attendance.delete({ where: { id: attendanceId } });
  revalidatePath(`/events/${eventId}`);
}

export async function toggleGameVote(gameId: string, eventId: string) {
  const user = await requireUser();

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return;

  const existing = await prisma.gameVote.findUnique({
    where: { userId_gameId: { userId: user.id!, gameId } },
  });

  if (existing) {
    await prisma.gameVote.delete({ where: { id: existing.id } });
    // Unvoting also removes the star
    await prisma.gameWant.deleteMany({ where: { userId: user.id!, gameId } });
  } else {
    await prisma.gameVote.create({ data: { userId: user.id!, gameId } });
  }

  revalidatePath(`/events/${eventId}`);
}

export async function updateGame(gameId: string, eventId: string, formData: FormData) {
  const user = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.userId !== user.id) return;

  await prisma.game.update({ where: { id: gameId }, data: { name } });
  revalidatePath(`/events/${eventId}`);
}

export async function removeGame(gameId: string, eventId: string) {
  const user = await requireUser();

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || (game.userId !== user.id && !isAdmin(user.email))) return;

  await prisma.game.delete({ where: { id: gameId } });
  revalidatePath(`/events/${eventId}`);
}

export async function deleteAccount() {
  const user = await requireUser();

  await prisma.$transaction([
    // Delete future events this user created (past events keep their record, creatorId → null via SetNull)
    prisma.event.deleteMany({
      where: { creatorId: user.id!, date: { gt: new Date() } },
    }),
    // Remove all their attendance and game records
    prisma.attendance.deleteMany({ where: { userId: user.id! } }),
    prisma.game.deleteMany({ where: { userId: user.id! } }),
  ]);

  // Delete the user (cascades to Account + Session rows)
  await prisma.user.delete({ where: { id: user.id! } });

  redirect("/");
}

export async function updateBggUsername(formData: FormData) {
  const user = await requireUser();
  const bggUsername = (formData.get("bggUsername") as string)?.trim() || null;
  await prisma.user.update({ where: { id: user.id! }, data: { bggUsername } });
  revalidatePath("/account");
}

export async function joinClub(clubId: string) {
  const user = await requireUser();
  await prisma.userClub.upsert({
    where: { userId_clubId: { userId: user.id!, clubId } },
    update: {},
    create: { userId: user.id!, clubId },
  });
  revalidatePath("/account");
  revalidatePath("/events");
}

export async function leaveClub(clubId: string) {
  const user = await requireUser();
  await prisma.userClub.deleteMany({ where: { userId: user.id!, clubId } });
  revalidatePath("/account");
  revalidatePath("/events");
}

export async function joinClubByName(name: string) {
  const user = await requireUser();
  const club = await prisma.club.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  await prisma.userClub.upsert({
    where: { userId_clubId: { userId: user.id!, clubId: club.id } },
    update: {},
    create: { userId: user.id!, clubId: club.id },
  });
  revalidatePath("/account");
  revalidatePath("/events");
  revalidatePath("/clubs");
}

export async function toggleGameWant(gameId: string, eventId: string) {
  const user = await requireUser();

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return;

  const existing = await prisma.gameWant.findUnique({
    where: { userId_gameId: { userId: user.id!, gameId } },
  });

  if (existing) {
    await prisma.gameWant.delete({ where: { id: existing.id } });
    // Unstarring does NOT remove the vote
  } else {
    await prisma.gameWant.create({ data: { userId: user.id!, gameId } });
    // Starring also votes
    await prisma.gameVote.upsert({
      where: { userId_gameId: { userId: user.id!, gameId } },
      update: {},
      create: { userId: user.id!, gameId },
    });
  }

  revalidatePath(`/events/${eventId}`);
}
