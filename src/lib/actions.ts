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

export async function createEvent(formData: FormData) {
  const user = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  const date = formData.get("date") as string;
  const description = (formData.get("description") as string)?.trim();

  if (!name || !date) return;

  const eventDate = new Date(date);
  if (eventDate <= new Date()) return;

  const event = await prisma.event.create({
    data: {
      name,
      date: eventDate,
      description: description || null,
      creatorId: user.id!,
    },
  });

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function deleteEvent(eventId: string) {
  const user = await requireUser();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.creatorId !== user.id) return;

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
  } else {
    await prisma.attendance.create({ data: { userId: user.id!, eventId } });
  }

  revalidatePath(`/events/${eventId}`);
}

export async function addGame(eventId: string, formData: FormData) {
  const user = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return;

  await prisma.game.create({ data: { name, userId: user.id!, eventId } });
  revalidatePath(`/events/${eventId}`);
}

export async function removeGame(gameId: string, eventId: string) {
  const user = await requireUser();

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
  if (!event || event.date < new Date()) return;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.userId !== user.id) return;

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
