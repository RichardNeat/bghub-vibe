"use client";

import { useState } from "react";

type Attendee = { id: string; name: string | null };
type Game = { id: string; name: string; wantedBy: string[] };

export function FindGameModal({
  attendees,
  games,
}: {
  attendees: Attendee[];
  games: Game[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Game[] | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResults(null);
  }

  function find() {
    if (selected.size === 0) return;
    const ids = [...selected];
    setResults(
      games.filter((g) => ids.every((uid) => g.wantedBy.includes(uid)))
    );
  }

  function close() {
    setOpen(false);
    setSelected(new Set());
    setResults(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
      >
        🎲 Find a game
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div>
                <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Find a game to play
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Select attendees to find games everyone wants to play
                </p>
              </div>
              <button
                onClick={close}
                className="text-lg leading-none hover:opacity-60 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Attendee picker */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                  Who&apos;s playing?
                </p>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((a) => {
                    const on = selected.has(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggle(a.id)}
                        className="text-sm font-medium px-3 py-1.5 rounded-full border transition-all"
                        style={
                          on
                            ? { backgroundColor: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                            : { backgroundColor: "transparent", color: "var(--text-secondary)", borderColor: "var(--border)" }
                        }
                      >
                        {a.name ?? "Unknown"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Find button */}
              <button
                onClick={find}
                disabled={selected.size === 0}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Find a game to play
              </button>

              {/* Results */}
              {results !== null && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                    {results.length === 0 ? "No matches" : `${results.length} game${results.length !== 1 ? "s" : ""} everyone wants`}
                  </p>
                  {results.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                      None of the selected people have all marked the same game as wanted. Try a different group or add more wants!
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {results.map((g) => (
                        <li
                          key={g.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                        >
                          🎲 {g.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
