"use client";

import { deleteEvent } from "@/lib/actions";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm("Delete this event? This cannot be undone.")) return;
    await deleteEvent(eventId);
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-90"
        style={{
          color: "var(--danger)",
          backgroundColor: "var(--danger-light)",
          border: "1px solid #fca5a5",
        }}
      >
        Delete event
      </button>
    </form>
  );
}
