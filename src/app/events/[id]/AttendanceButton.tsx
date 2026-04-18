"use client";

import { useState } from "react";

export function AttendanceButton({
  isAttending,
  hasGames,
  action,
}: {
  isAttending: boolean;
  hasGames: boolean;
  action: () => Promise<void>;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  async function submit() {
    await action();
    setShowConfirm(false);
  }

  if (isAttending && showConfirm) {
    return (
      <div
        className="mt-5 rounded-xl p-4 space-y-3"
        style={{ backgroundColor: "var(--bg-page)", border: "1px solid var(--danger)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Are you sure you want to cancel?
          </p>
          {hasGames && (
            <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>
              All the games you&apos;ve added to this event will be removed from the list.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <form action={submit}>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--danger)" }}
            >
              Yes, cancel my attendance
            </button>
          </form>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
            style={{ backgroundColor: "var(--border-light)", color: "var(--text-secondary)" }}
          >
            Keep my spot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => (isAttending ? setShowConfirm(true) : submit())}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
        style={
          isAttending
            ? { backgroundColor: "var(--success-light)", color: "var(--success)" }
            : { backgroundColor: "var(--accent)", color: "#fff" }
        }
      >
        {isAttending ? "✓ I'm attending — click to cancel" : "RSVP — I'll be there"}
      </button>
    </div>
  );
}
