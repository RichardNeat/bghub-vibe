"use client";

import { useState } from "react";
import { addGame, removeGame, toggleGameVote, updateGame } from "@/lib/actions";

type Game = {
  id: string;
  name: string;
  userId: string;
  user: { id: string; name: string | null };
  voteCount: number;
  hasVoted: boolean;
};

type Props = {
  eventId: string;
  games: Game[];
  userId: string;
  isPast: boolean;
  isAdmin: boolean;
};

export function GamesSection({ eventId, games, userId, isPast, isAdmin }: Props) {
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [sortBy, setSortBy] = useState<"added" | "game" | "user" | "votes">("added");
  const [editingId, setEditingId] = useState<string | null>(null);

  const addGameWithId = addGame.bind(null, eventId);

  const displayed = [...games]
    .filter((g) => filter === "all" || g.userId === userId)
    .sort((a, b) => {
      if (sortBy === "game") return a.name.localeCompare(b.name);
      if (sortBy === "user") return (a.user.name ?? "").localeCompare(b.user.name ?? "");
      if (sortBy === "votes") return b.voteCount - a.voteCount;
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
              <option value="votes">Most voted</option>
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
                {editingId === g.id ? (
                  <form
                    action={updateGame.bind(null, g.id, eventId)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                    onSubmit={() => setEditingId(null)}
                  >
                    <input
                      name="name"
                      defaultValue={g.name}
                      autoFocus
                      required
                      className="flex-1 rounded-lg px-2 py-1 text-sm focus:outline-none min-w-0"
                      style={{ border: "1px solid var(--accent)" }}
                    />
                    <button
                      type="submit"
                      className="text-xs font-semibold px-2 py-1 rounded-lg text-white shrink-0"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs font-medium hover:underline shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-medium break-words" style={{ color: "var(--text-primary)" }}>
                        🎲 {g.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        by {g.user.name}
                        {g.userId === userId && (
                          <span className="ml-1 font-semibold" style={{ color: "var(--accent)" }}>(you)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isPast && (
                        <form action={toggleGameVote.bind(null, g.id, eventId)}>
                          <button
                            type="submit"
                            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all hover:opacity-80"
                            style={
                              g.hasVoted
                                ? { backgroundColor: "var(--accent)", color: "#fff" }
                                : { backgroundColor: "var(--border-light)", color: "var(--text-muted)" }
                            }
                          >
                            ▲ {g.voteCount > 0 ? g.voteCount : ""}
                          </button>
                        </form>
                      )}
                      {isPast && g.voteCount > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}>
                          ▲ {g.voteCount}
                        </span>
                      )}
                      {!isPast && (g.userId === userId || isAdmin) && (
                        <>
                          {g.userId === userId && (
                            <button
                              type="button"
                              onClick={() => setEditingId(g.id)}
                              className="text-xs font-medium hover:underline"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Edit
                            </button>
                          )}
                          <form action={removeGame.bind(null, g.id, eventId)}>
                            <button
                              type="submit"
                              className="text-xs font-medium transition-colors hover:underline"
                              style={{ color: "var(--danger)" }}
                            >
                              Remove
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </>
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
