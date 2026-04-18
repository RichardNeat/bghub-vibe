"use client";

import { useRef, useState } from "react";
import { addGame, removeGame, toggleGameVote, toggleGameWant, updateGame } from "@/lib/actions";

type Game = {
  id: string;
  name: string;
  userId: string;
  user: { id: string; name: string | null };
  voteCount: number;
  hasVoted: boolean;
  wantCount: number;
  hasWanted: boolean;
};

type Props = {
  eventId: string;
  games: Game[];
  userId: string;
  isPast: boolean;
  isAdmin: boolean;
  isAttending: boolean;
  findGameTrigger?: React.ReactNode;
};

export function GamesSection({ eventId, games, userId, isPast, isAdmin, isAttending, findGameTrigger }: Props) {
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [sortBy, setSortBy] = useState<"added" | "game" | "user" | "votes" | "wants">("added");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [askOnAdd, setAskOnAdd] = useState(true);
  const [popup, setPopup] = useState<{ gameId: string; gameName: string } | null>(null);
  const addFormRef = useRef<HTMLFormElement>(null);

  const addGameWithId = addGame.bind(null, eventId);

  async function handleAddGame(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await addGameWithId(formData);
    addFormRef.current?.reset();
    if (result && askOnAdd) setPopup(result);
  }

  const displayed = [...games]
    .filter((g) => filter === "all" || g.userId === userId)
    .sort((a, b) => {
      if (sortBy === "game") return a.name.localeCompare(b.name);
      if (sortBy === "user") return (a.user.name ?? "").localeCompare(b.user.name ?? "");
      if (sortBy === "votes") return b.voteCount - a.voteCount;
      if (sortBy === "wants") return b.wantCount - a.wantCount;
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
        <div>
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
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <span className="font-bold" style={{ color: "var(--accent)" }}>▲</span> I&apos;m interested
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <span className="font-bold" style={{ color: "#ca8a04" }}>★</span> I really want to play this
            </span>
          </div>
        </div>

        {games.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {findGameTrigger}
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
              <option value="wants">Most wanted</option>
              <option value="game">Sort A–Z</option>
              <option value="user">Sort by person</option>
            </select>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {!isPast && !isAttending && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Want to bring a game to this event?{" "}
            <a href="#rsvp" className="underline font-medium" style={{ color: "var(--accent)" }}>
              Register your attendance first!
            </a>
          </p>
        )}

        {!isPast && isAttending && (
          <form ref={addFormRef} onSubmit={handleAddGame} className="space-y-2">
            <div className="flex gap-2">
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
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={askOnAdd}
                onChange={(e) => setAskOnAdd(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Ask me if I want to play each game I add
              </span>
            </label>
          </form>
        )}

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
                    {!isPast && isAttending && (
                      <div className="flex flex-col gap-1 shrink-0" style={{ width: "2.5rem" }}>
                        <form action={toggleGameVote.bind(null, g.id, eventId)}>
                          <button
                            type="submit"
                            title="I might be interested"
                            className="flex items-center justify-center gap-1 text-xs font-semibold rounded-full transition-all hover:opacity-80 w-full"
                            style={{
                              height: "1.75rem",
                              ...(g.hasVoted
                                ? { backgroundColor: "var(--accent)", color: "#fff" }
                                : { backgroundColor: "var(--border-light)", color: "var(--text-muted)" })
                            }}
                          >
                            ▲{g.voteCount > 0 ? ` ${g.voteCount}` : ""}
                          </button>
                        </form>
                        <form action={toggleGameWant.bind(null, g.id, eventId)}>
                          <button
                            type="submit"
                            title="I want to play this"
                            className="flex items-center justify-center text-xs font-semibold rounded-full transition-all hover:opacity-80 w-full"
                            style={{
                              height: "1.75rem",
                              ...(g.hasWanted
                                ? { backgroundColor: "#ca8a04", color: "#fff" }
                                : { backgroundColor: "var(--border-light)", color: "var(--text-muted)" })
                            }}
                          >
                            ★{g.wantCount > 0 ? ` ${g.wantCount}` : ""}
                          </button>
                        </form>
                      </div>
                    )}
                    {isPast && g.voteCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}>
                        ▲ {g.voteCount}
                      </span>
                    )}
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
                    {!isPast && (g.userId === userId || isAdmin) && (
                      <div className="flex items-center gap-2 shrink-0">
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
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

      </div>

      {/* Want to play popup */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Do you want to play this?
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  🎲 {popup.gameName}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await toggleGameWant(popup.gameId, eventId);
                    setPopup(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#ca8a04" }}
                >
                  ★ Yes, I want to play it
                </button>
                <button
                  onClick={() => setPopup(null)}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                  style={{ backgroundColor: "var(--border-light)", color: "var(--text-secondary)" }}
                >
                  Not for me
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
