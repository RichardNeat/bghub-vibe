"use client";

import { useState } from "react";
import { addGame, removeGame } from "@/lib/actions";

type Game = {
  id: string;
  name: string;
  userId: string;
  user: { id: string; name: string | null };
};

type Props = {
  eventId: string;
  games: Game[];
  userId: string;
  isPast: boolean;
};

export function GamesSection({ eventId, games, userId, isPast }: Props) {
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [sortBy, setSortBy] = useState<"added" | "game" | "user">("added");

  const addGameWithId = addGame.bind(null, eventId);

  const displayed = [...games]
    .filter((g) => filter === "all" || g.userId === userId)
    .sort((a, b) => {
      if (sortBy === "game") return a.name.localeCompare(b.name);
      if (sortBy === "user") return (a.user.name ?? "").localeCompare(b.user.name ?? "");
      return 0;
    });

  return (
    <section
      className="rounded-xl shadow-sm"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between gap-2 flex-wrap"
        style={{ borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-2">
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Games
          </h2>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--purple-light)", color: "var(--purple)" }}
          >
            {games.length}
          </span>
        </div>

        {games.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter(filter === "mine" ? "all" : "mine")}
              className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
              style={
                filter === "mine"
                  ? { backgroundColor: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                  : { backgroundColor: "transparent", color: "var(--text-secondary)", borderColor: "var(--border)" }
              }
            >
              🎒 My games
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs rounded-md px-2 py-1 focus:outline-none"
              style={{ border: "1px solid var(--border)" }}
            >
              <option value="added">Order added</option>
              <option value="game">Sort A–Z</option>
              <option value="user">Sort by person</option>
            </select>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {displayed.length === 0 ? (
          <p className="text-sm text-center py-2" style={{ color: "var(--text-muted)" }}>
            {filter === "mine"
              ? "You haven't added any games yet."
              : isPast
              ? "No games were listed for this event."
              : "No games listed yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayed.map((g) => (
              <li
                key={g.id}
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--bg-page)" }}
              >
                {/* Stacked layout so the game name is never truncated */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium break-words" style={{ color: "var(--text-primary)" }}>
                    🎲 {g.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    by {g.user.name}
                    {g.userId === userId && (
                      <span className="ml-1 font-semibold" style={{ color: "var(--accent)" }}>
                        (you)
                      </span>
                    )}
                  </span>
                </div>
                {!isPast && g.userId === userId && (
                  <form action={removeGame.bind(null, g.id, eventId)} className="shrink-0">
                    <button
                      type="submit"
                      className="text-xs font-medium transition-colors hover:underline"
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

        {!isPast && (
          <form action={addGameWithId} className="flex gap-2 pt-1">
            <input
              type="text"
              name="name"
              required
              placeholder="Add a game…"
              autoComplete="off"
              className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
              style={{ border: "1px solid var(--border)" }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shrink-0 shadow-sm"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Add
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
