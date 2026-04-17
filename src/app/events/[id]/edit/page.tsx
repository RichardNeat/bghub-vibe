import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { updateEvent } from "@/lib/actions";
import { DateTimeInput } from "@/components/DateTimeInput";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import Link from "next/link";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();
  if (event.creatorId !== userId || event.date < new Date()) redirect(`/events/${id}`);

  const pad = (n: number) => String(n).padStart(2, "0");
  const d = event.date;
  const defaultDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const updateEventWithId = updateEvent.bind(null, id);

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm transition-colors hover:underline"
        style={{ color: "var(--accent)" }}
      >
        ← Back to event
      </Link>

      <div
        className="rounded-xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <h1 className="font-semibold" style={{ color: "var(--text-primary)" }}>Edit event</h1>
        </div>

        <form action={updateEventWithId} className="px-5 py-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                Event name
              </label>
              <input
                name="name"
                required
                defaultValue={event.name}
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
                defaultValue={defaultDate}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              Location <span className="normal-case font-normal">(optional)</span>
            </label>
            <LocationAutocomplete
              name="location"
              placeholder="123 Main St, London"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition"
              style={{ border: "1px solid var(--border)" }}
            />
            {event.location && (
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Current: {event.location}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              Description <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={event.description ?? ""}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition resize-none"
              style={{ border: "1px solid var(--border)" }}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href={`/events/${id}`}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
