import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { toggleAttendance, removeAttendance } from "@/lib/actions";
import { DeleteEventButton } from "./DeleteEventButton";
import { GamesSection } from "./GamesSection";
import { FindGameModal } from "./FindGameModal";
import Link from "next/link";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id!;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      attendances: {
        include: { user: { select: { id: true, name: true, bggUsername: true } } },
        orderBy: { id: "asc" },
      },
      games: {
        include: {
          user: { select: { id: true, name: true } },
          votes: { select: { userId: true } },
          wants: { select: { userId: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!event) notFound();

  const isPast = event.date < new Date();
  const isCreator = event.creatorId === userId;
  const isAttending = event.attendances.some((a) => a.userId === userId);
  const mapEnabled = !!process.env.GOOGLE_MAPS_KEY;
  const userIsAdmin = session?.user?.email === process.env.ADMIN_EMAIL && !!process.env.ADMIN_EMAIL;

  const toggleAttendanceWithId = toggleAttendance.bind(null, id);

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm transition-colors hover:underline"
        style={{ color: "var(--accent)" }}
      >
        ← Events
      </Link>

      {/* Hero card */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="h-2"
          style={{
            background: isPast
              ? "var(--border)"
              : "linear-gradient(90deg, var(--bg-nav-dark), var(--bg-nav))",
          }}
        />
        <div className="px-6 py-5" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {event.name}
                </h1>
                {isPast && (
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}
                  >
                    Past event
                  </span>
                )}
              </div>
              {event.description && (
                <p style={{ color: "var(--text-secondary)" }}>{event.description}</p>
              )}
            </div>
            {(isCreator || userIsAdmin) && !isPast && (
              <div className="flex items-center gap-2">
                {isCreator && (
                  <Link
                    href={`/events/${id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  >
                    Edit
                  </Link>
                )}
                <DeleteEventButton eventId={id} />
              </div>
            )}
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              {
                icon: "📅",
                text: event.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
              },
              {
                icon: "🕐",
                text: event.date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                }),
              },
              {
                icon: "👤",
                text: event.creator ? `Hosted by ${event.creator.name}` : "Host deleted",
              },
              ...(event.location ? [{ icon: "📍", text: event.location }] : []),
            ].map(({ icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--border-light)",
                  color: "var(--text-secondary)",
                }}
              >
                {icon} {text}
              </span>
            ))}
          </div>

          {/* RSVP — hidden for past events */}
          {!isPast && (
            <form action={toggleAttendanceWithId} className="mt-5">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
                style={
                  isAttending
                    ? {
                        backgroundColor: "var(--success-light)",
                        color: "var(--success)",
                        border: "1px solid var(--success)",
                      }
                    : {
                        backgroundColor: "var(--accent)",
                        color: "#fff",
                        border: "1px solid var(--accent-hover)",
                      }
                }
              >
                {isAttending ? "✓ I'm attending — click to cancel" : "RSVP — I'll be there"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Map card */}
      {event.location && (
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        >
          {mapEnabled && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/map-image?address=${encodeURIComponent(event.location)}`}
              alt={`Map of ${event.location}`}
              className="w-full object-cover"
              style={{ height: "200px" }}
            />
          )}
          <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              📍 {event.location}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              Get directions
            </a>
          </div>
        </div>
      )}

      {/* Two-column lower section */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Attendees */}
        <section
          className="rounded-xl shadow-sm"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between gap-4"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <div>
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {isPast ? "Attended" : "Attendees"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Click a name to view their BGG collection
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: "var(--purple-light)", color: "var(--purple)" }}
            >
              {event.attendances.length}
            </span>
          </div>
          <div className="px-5 py-4">
            {event.attendances.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                {isPast ? "Nobody attended this event." : "No one yet — be the first!"}
              </p>
            ) : (
              <ul className="space-y-3">
                {event.attendances.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    {a.user.bggUsername ? (
                      <a
                        href={`https://boardgamegeek.com/collection/user/${a.user.bggUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium flex-1 hover:underline"
                        style={{ color: "var(--accent)" }}
                      >
                        {a.user.name}
                      </a>
                    ) : (
                      <span className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
                        {a.user.name}
                      </span>
                    )}
                    {a.userId === userId && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}
                      >
                        you
                      </span>
                    )}
                    {userIsAdmin && !isPast && (
                      <form action={removeAttendance.bind(null, a.id, id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium hover:underline"
                          style={{ color: "var(--danger)" }}
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Games — client component for filtering */}
        <GamesSection
          eventId={id}
          games={event.games.map((g) => ({
            ...g,
            voteCount: g.votes.length,
            hasVoted: g.votes.some((v) => v.userId === userId),
            hasWanted: g.wants.some((w) => w.userId === userId),
          }))}
          userId={userId}
          isPast={isPast}
          isAdmin={userIsAdmin}
          findGameTrigger={
            !isPast && event.attendances.length > 0 && event.games.length > 0 ? (
              <FindGameModal
                attendees={event.attendances.map((a) => a.user)}
                games={event.games.map((g) => ({
                  id: g.id,
                  name: g.name,
                  wantedBy: g.wants.map((w) => w.userId),
                }))}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
