import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateBggUsername, joinClub, leaveClub } from "@/lib/actions";
import { DeleteAccountButton } from "./DeleteAccountButton";
import Link from "next/link";
import Image from "next/image";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [user, allClubs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        clubs: { include: { club: true } },
        _count: {
          select: {
            events: { where: { date: { gt: new Date() } } },
            attendances: true,
            games: true,
          },
        },
      },
    }),
    prisma.club.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) redirect("/");

  const joinedClubIds = new Set(user.clubs.map((uc) => uc.clubId));
  const availableClubs = allClubs.filter((c) => !joinedClubIds.has(c.id));

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm hover:underline"
        style={{ color: "var(--accent)" }}
      >
        ← Events
      </Link>

      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Account
      </h1>

      {/* Profile card */}
      <div
        className="rounded-xl shadow-sm p-6 flex items-center gap-4"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        {user.image && (
          <Image
            src={user.image}
            alt={user.name ?? ""}
            width={56}
            height={56}
            className="rounded-full ring-2"
            style={{ ringColor: "var(--border)" } as React.CSSProperties}
          />
        )}
        <div>
          <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            {user.name}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {user.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Future events created", value: user._count.events },
          { label: "Events attending", value: user._count.attendances },
          { label: "Games listed", value: user._count.games },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center shadow-sm"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
              {value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* BGG Username */}
      <div
        className="rounded-xl shadow-sm p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        <div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>BoardGameGeek</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Your BGG username will be linked from the attendees list on events.
          </p>
        </div>
        <form action={updateBggUsername} className="flex gap-2">
          <input
            name="bggUsername"
            defaultValue={user.bggUsername ?? ""}
            placeholder="Your BGG username"
            className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ border: "1px solid var(--border)" }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Save
          </button>
        </form>
        {user.bggUsername && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Collection:{" "}
            <a
              href={`https://boardgamegeek.com/collection/user/${user.bggUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--accent)" }}
            >
              boardgamegeek.com/collection/user/{user.bggUsername}
            </a>
          </p>
        )}
      </div>

      {/* Clubs */}
      <div
        className="rounded-xl shadow-sm p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        <div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>My clubs</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Events from clubs you&apos;re in will appear on your events page.
          </p>
        </div>

        {user.clubs.length > 0 && (
          <ul className="space-y-2">
            {user.clubs.map(({ club }) => (
              <li key={club.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--bg-page)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{club.name}</span>
                <form action={leaveClub.bind(null, club.id)}>
                  <button type="submit" className="text-xs font-medium hover:underline" style={{ color: "var(--danger)" }}>
                    Leave
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {availableClubs.length > 0 && (
          <form action={async (fd) => { "use server"; await joinClub(fd.get("clubId") as string); }} className="flex gap-2">
            <select
              name="clubId"
              required
              className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: "1px solid var(--border)" }}
            >
              <option value="">Join a club…</option>
              {availableClubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Join
            </button>
          </form>
        )}

        {user.clubs.length === 0 && availableClubs.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No clubs available.</p>
        )}
      </div>

      {/* Danger zone */}
      <div
        className="rounded-xl p-6 space-y-3"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--danger)",
        }}
      >
        <h2 className="font-semibold" style={{ color: "var(--danger)" }}>
          Danger zone
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Deleting your account will permanently remove your profile, cancel your
          attendance at all events, remove all games you&apos;ve added, and delete
          any future events you created. Past events you hosted will remain but
          show as &ldquo;Host deleted&rdquo;.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
