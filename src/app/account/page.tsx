import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateBggUsername } from "@/lib/actions";
import { DeleteAccountButton } from "./DeleteAccountButton";
import Link from "next/link";
import Image from "next/image";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          events: { where: { date: { gt: new Date() } } },
          attendances: true,
          games: true,
        },
      },
    },
  });

  if (!user) redirect("/");

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
