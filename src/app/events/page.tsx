import { prisma } from "@/lib/prisma";
import { createEvent } from "@/lib/actions";
import { DateTimeInput } from "@/components/DateTimeInput";
import Link from "next/link";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      creator: { select: { name: true } },
      _count: { select: { attendances: true } },
    },
  });

  const upcoming = events.filter((e) => e.date >= new Date());
  const past = events.filter((e) => e.date < new Date());

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Events
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {upcoming.length} upcoming
          </p>
        </div>
      </div>

      {/* Create event form */}
      <details
        className="group rounded-xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <summary
          className="px-5 py-3.5 cursor-pointer list-none flex items-center justify-between select-none"
          style={{ borderBottom: "1px solid transparent" }}
        >
          <span className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--accent)" }}>
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: "var(--accent)" }}
            >
              +
            </span>
            Create new event
          </span>
          <span className="text-lg group-open:rotate-180 transition-transform duration-200" style={{ color: "var(--text-muted)" }}>
            ‹
          </span>
        </summary>
        <div style={{ borderTop: "1px solid var(--border-light)" }}>
          <form action={createEvent} className="px-5 py-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Event name
                </label>
                <input
                  name="name"
                  required
                  placeholder="Friday Game Night"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                  style={{ border: "1px solid var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Date &amp; time
                </label>
                <DateTimeInput
                  name="date"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                  style={{ border: "1px solid var(--border)" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                Description <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Bring snacks! BYO drinks."
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition resize-none"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Create event
              </button>
            </div>
          </form>
        </div>
      </details>

      {/* Upcoming events */}
      {upcoming.length === 0 && past.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="text-4xl mb-3">🎲</div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No events yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Create one above to get started!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Upcoming
              </h2>
              <EventList events={upcoming} />
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Past events
              </h2>
              <EventList events={past} muted />
            </section>
          )}
        </>
      )}
    </div>
  );
}

type EventItem = {
  id: string;
  name: string;
  description: string | null;
  date: Date;
  creator: { name: string | null } | null;
  _count: { attendances: number };
};

function EventList({ events, muted = false }: { events: EventItem[]; muted?: boolean }) {
  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={`/events/${event.id}`}
            className="group flex items-center gap-4 rounded-xl px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-px"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              opacity: muted ? 0.7 : 1,
            }}
          >
            {/* Date badge */}
            <div
              className="shrink-0 w-14 text-center rounded-lg py-1.5"
              style={{
                backgroundColor: muted ? "var(--border-light)" : "var(--accent-light)",
              }}
            >
              <div
                className="text-xs font-bold uppercase"
                style={{ color: muted ? "var(--text-muted)" : "var(--accent)" }}
              >
                {event.date.toLocaleDateString("en-US", { month: "short" })}
              </div>
              <div
                className="text-2xl font-bold leading-none"
                style={{ color: muted ? "var(--text-secondary)" : "var(--accent)" }}
              >
                {event.date.getDate()}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h2
                className="font-semibold truncate group-hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                {event.name}
              </h2>
              {event.description && (
                <p className="text-sm truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {event.description}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                by {event.creator?.name ?? "Deleted user"} ·{" "}
                {event.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>

            {/* Attendee count */}
            <div className="shrink-0 text-right">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--border-light)",
                  color: "var(--text-secondary)",
                }}
              >
                {event._count.attendances} going
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
