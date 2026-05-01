"use client";

import { startTransition, useEffect, useOptimistic, useRef, useState } from "react";
import { addGame, deleteGamePlay, logGamePlay, removeGame, toggleGameVote, toggleGameWant, updateGame, updateGamePlay } from "@/lib/actions";

type GamePlay = {
  id: string;
  winner: string | null;
  notes: string | null;
  createdAt: Date;
  players: string[];
};

type Game = {
  id: string;
  name: string;
  userId: string;
  user: { id: string; name: string | null };
  voteCount: number;
  hasVoted: boolean;
  voters: string[];
  wantCount: number;
  hasWanted: boolean;
  wanters: string[];
  plays: GamePlay[];
};

type Props = {
  eventId: string;
  games: Game[];
  userId: string;
  isPast: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isAttending: boolean;
  attendees: { id: string; name: string | null }[];
  findGameTrigger?: React.ReactNode;
};

type BggResult = { id: string; name: string; year: string | null };

function EditPlayForm({
  play, eventId, attendees, onClose,
}: {
  play: GamePlay; eventId: string;
  attendees: { id: string; name: string | null }[];
  onClose: () => void;
}) {
  const existingWinners = play.winner ? play.winner.split(" & ") : [];
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(play.players);
  const [winners, setWinners] = useState<string[]>(existingWinners);
  const [notes, setNotes] = useState(play.notes ?? "");

  function togglePlayer(name: string) {
    const next = selectedPlayers.includes(name)
      ? selectedPlayers.filter((p) => p !== name)
      : [...selectedPlayers, name];
    setSelectedPlayers(next);
    if (!next.includes(name)) setWinners((w) => w.filter((wn) => wn !== name));
  }

  function toggleWinner(name: string) {
    if (name === "The Game") {
      setWinners((w) => (w.includes("The Game") ? [] : ["The Game"]));
    } else {
      setWinners((w) => {
        const without = w.filter((wn) => wn !== "The Game");
        return without.includes(name) ? without.filter((wn) => wn !== name) : [...without, name];
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    selectedPlayers.forEach((p) => fd.append("players", p));
    if (winners.length > 0) fd.append("winner", winners.join(" & "));
    if (notes.trim()) fd.append("notes", notes.trim());
    await updateGamePlay(play.id, eventId, fd);
    onClose();
  }

  return (
    <div className="mt-1 rounded-lg p-2.5 space-y-2" style={{ backgroundColor: "var(--bg-page)", border: "1px solid var(--border)" }}>
      <form onSubmit={handleSubmit} className="space-y-2">
        {attendees.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Who played?</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {attendees.map((a) => {
                const name = a.name ?? "";
                return (
                  <label key={a.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={selectedPlayers.includes(name)} onChange={() => togglePlayer(name)} className="rounded" />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {selectedPlayers.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Winner(s) <span className="font-normal">(optional)</span></p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {selectedPlayers.map((name) => (
                <label key={name} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={winners.includes(name)} onChange={() => toggleWinner(name)} className="rounded" />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{name}</span>
                </label>
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={winners.includes("The Game")} onChange={() => toggleWinner("The Game")} className="rounded" />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>🎮 The Game (co-op)</span>
              </label>
              {winners.length > 0 && (
                <button type="button" onClick={() => setWinners([])} className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>Clear</button>
              )}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes <span className="font-normal">(optional)</span></p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How did it go?"
            className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none resize-none"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: "var(--accent)" }}>
            Save changes
          </button>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium hover:underline" style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function LogPlayForm({
  gameId, gameName, eventId, attendees, plays, isCreator, isAdmin, onClose,
}: {
  gameId: string; gameName: string; eventId: string;
  attendees: { id: string; name: string | null }[];
  plays: GamePlay[]; isCreator: boolean; isAdmin: boolean;
  onClose: () => void;
}) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [winners, setWinners] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);

  function togglePlayer(name: string) {
    const next = selectedPlayers.includes(name)
      ? selectedPlayers.filter((p) => p !== name)
      : [...selectedPlayers, name];
    setSelectedPlayers(next);
    if (!next.includes(name)) setWinners((w) => w.filter((wn) => wn !== name));
  }

  function toggleWinner(name: string) {
    if (name === "The Game") {
      setWinners((w) => (w.includes("The Game") ? [] : ["The Game"]));
    } else {
      setWinners((w) => {
        const without = w.filter((wn) => wn !== "The Game");
        return without.includes(name) ? without.filter((wn) => wn !== name) : [...without, name];
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    selectedPlayers.forEach((p) => fd.append("players", p));
    if (winners.length > 0) fd.append("winner", winners.join(" & "));
    if (notes.trim()) fd.append("notes", notes.trim());
    await logGamePlay(gameId, eventId, fd);
    onClose();
  }

  return (
    <div className="mt-2 rounded-lg p-3 space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Log a play of {gameName}</p>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {attendees.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Who played?</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {attendees.map((a) => {
                const name = a.name ?? "";
                return (
                  <label key={a.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(name)}
                      onChange={() => togglePlayer(name)}
                      className="rounded"
                    />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {selectedPlayers.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Winner(s) <span className="font-normal">(optional)</span></p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {selectedPlayers.map((name) => (
                <label key={name} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={winners.includes(name)}
                    onChange={() => toggleWinner(name)}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{name}</span>
                </label>
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={winners.includes("The Game")}
                  onChange={() => toggleWinner("The Game")}
                  className="rounded"
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>🎮 The Game (co-op)</span>
              </label>
              {winners.length > 0 && (
                <button type="button" onClick={() => setWinners([])} className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes <span className="font-normal">(optional)</span></p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How did it go?"
            className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none resize-none"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: "var(--accent)" }}>
            Save play
          </button>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium hover:underline" style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      </form>

      {plays.length > 0 && (
        <div className="space-y-1.5 pt-1" style={{ borderTop: "1px solid var(--border-light)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Previous plays</p>
          {plays.map((play) => (
            <div key={play.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {play.players.length > 0 && <span>{play.players.join(", ")}</span>}
                  {play.winner && <span className="ml-1.5 font-semibold" style={{ color: "var(--success)" }}>🏆 {play.winner}</span>}
                  {play.notes && <div className="mt-0.5 italic" style={{ color: "var(--text-muted)" }}>{play.notes}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingPlayId(editingPlayId === play.id ? null : play.id)}
                    className="text-xs hover:underline"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {editingPlayId === play.id ? "Cancel" : "Edit"}
                  </button>
                  {(isCreator || isAdmin) && (
                    <form action={deleteGamePlay.bind(null, play.id, eventId)} className="shrink-0">
                      <button type="submit" className="text-xs hover:underline" style={{ color: "var(--danger)" }}>Delete</button>
                    </form>
                  )}
                </div>
              </div>
              {editingPlayId === play.id && (
                <EditPlayForm
                  play={play}
                  eventId={eventId}
                  attendees={attendees}
                  onClose={() => setEditingPlayId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GamesSection({ eventId, games, userId, isPast, isAdmin, isCreator, isAttending, attendees, findGameTrigger }: Props) {
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [sortBy, setSortBy] = useState<"added" | "game" | "user" | "votes" | "wants">("added");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loggingPlayId, setLoggingPlayId] = useState<string | null>(null);
  const [askOnAdd, setAskOnAdd] = useState(true);
  const [popup, setPopup] = useState<{ gameId: string; gameName: string } | null>(null);
  const [namesPanel, setNamesPanel] = useState<string | null>(null);
  const [gameInput, setGameInput] = useState("");
  const [bggResults, setBggResults] = useState<BggResult[]>([]);
  const [showBggDropdown, setShowBggDropdown] = useState(false);
  const addFormRef = useRef<HTMLFormElement>(null);
  const bggDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [optimisticGames, applyOptimistic] = useOptimistic(
    games,
    (state: Game[], { gameId, action }: { gameId: string; action: "vote" | "want" }) =>
      state.map((g) => {
        if (g.id !== gameId) return g;
        if (action === "vote") {
          const toggled = !g.hasVoted;
          return {
            ...g,
            hasVoted: toggled,
            voteCount: toggled ? g.voteCount + 1 : g.voteCount - 1,
            hasWanted: toggled ? g.hasWanted : false,
            wantCount: !toggled && g.hasWanted ? g.wantCount - 1 : g.wantCount,
          };
        } else {
          const toggled = !g.hasWanted;
          return {
            ...g,
            hasWanted: toggled,
            wantCount: toggled ? g.wantCount + 1 : g.wantCount - 1,
            hasVoted: toggled ? true : g.hasVoted,
            voteCount: toggled && !g.hasVoted ? g.voteCount + 1 : g.voteCount,
          };
        }
      })
  );

  useEffect(() => {
    if (!namesPanel) return;
    function close() { setNamesPanel(null); }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [namesPanel]);

  function toggleNames(e: React.MouseEvent, key: string) {
    e.stopPropagation();
    setNamesPanel((prev) => (prev === key ? null : key));
  }

  function handleGameInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setGameInput(val);
    if (bggDebounceRef.current) clearTimeout(bggDebounceRef.current);
    if (val.length < 2) { setBggResults([]); setShowBggDropdown(false); return; }
    bggDebounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/bgg-search?q=${encodeURIComponent(val)}`);
      const data: BggResult[] = await res.json();
      setBggResults(data);
      setShowBggDropdown(data.length > 0);
    }, 350);
  }

  function selectBggGame(name: string) {
    setGameInput(name);
    setShowBggDropdown(false);
    setBggResults([]);
  }

  const addGameWithId = addGame.bind(null, eventId);

  async function handleAddGame(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await addGameWithId(formData);
    setGameInput("");
    setBggResults([]);
    setShowBggDropdown(false);
    addFormRef.current?.reset();
    if (result && askOnAdd) setPopup(result);
  }

  async function handleVote(gameId: string) {
    startTransition(async () => {
      applyOptimistic({ gameId, action: "vote" });
      await toggleGameVote(gameId, eventId);
    });
  }

  async function handleWant(gameId: string) {
    startTransition(async () => {
      applyOptimistic({ gameId, action: "want" });
      await toggleGameWant(gameId, eventId);
    });
  }

  const displayed = [...optimisticGames]
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
          {isAttending && (
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <span className="font-bold" style={{ color: "var(--accent)" }}>▲</span> I&apos;m interested
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <span className="font-bold" style={{ color: "#ca8a04" }}>★</span> I really want to play this
              </span>
            </div>
          )}
        </div>

        {games.length > 0 && isAttending && (
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
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="underline font-medium"
              style={{ color: "var(--accent)" }}
            >
              Register your attendance first!
            </button>
          </p>
        )}

        {!isPast && isAttending && (
          <form ref={addFormRef} onSubmit={handleAddGame} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="name"
                  value={gameInput}
                  onChange={handleGameInputChange}
                  onBlur={() => setTimeout(() => setShowBggDropdown(false), 150)}
                  onFocus={() => bggResults.length > 0 && setShowBggDropdown(true)}
                  required
                  placeholder="Add a game…"
                  autoComplete="off"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                  style={{ border: "1px solid var(--border)" }}
                />
                {showBggDropdown && bggResults.length > 0 && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg shadow-lg overflow-hidden"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                  >
                    {bggResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onMouseDown={() => selectBggGame(r.name)}
                        className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
                        style={{ color: "var(--text-primary)", borderTop: "1px solid var(--border-light)" }}
                      >
                        <span>🎲 {r.name}</span>
                        {r.year && <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{r.year}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                      <div className="flex flex-col gap-1 shrink-0 relative">
                        {/* Vote button */}
                        <div className="flex rounded-full overflow-hidden text-xs font-semibold" style={{ height: "1.75rem" }}>
                          <button
                            type="button"
                            title="I might be interested"
                            onClick={() => handleVote(g.id)}
                            className="flex items-center justify-center px-2 h-full transition-all hover:opacity-80"
                            style={g.hasVoted
                              ? { backgroundColor: "var(--accent)", color: "#fff" }
                              : { backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}
                          >
                            ▲
                          </button>
                          {g.voteCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => toggleNames(e, `${g.id}-votes`)}
                              className="flex items-center justify-center px-2 h-full transition-all hover:opacity-80"
                              style={g.hasVoted
                                ? { backgroundColor: "var(--accent-light)", color: "var(--accent)" }
                                : { backgroundColor: "var(--border-light)", color: "var(--text-muted)", borderLeft: "1px solid var(--border)" }}
                            >
                              {g.voteCount}
                            </button>
                          )}
                        </div>
                        {/* Want button */}
                        <div className="flex rounded-full overflow-hidden text-xs font-semibold" style={{ height: "1.75rem" }}>
                          <button
                            type="button"
                            title="I want to play this"
                            onClick={() => handleWant(g.id)}
                            className="flex items-center justify-center px-2 h-full transition-all hover:opacity-80"
                            style={g.hasWanted
                              ? { backgroundColor: "#ca8a04", color: "#fff" }
                              : { backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}
                          >
                            ★
                          </button>
                          {g.wantCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => toggleNames(e, `${g.id}-wants`)}
                              className="flex items-center justify-center px-2 h-full transition-all hover:opacity-80"
                              style={g.hasWanted
                                ? { backgroundColor: "color-mix(in srgb, #ca8a04 15%, transparent)", color: "#ca8a04" }
                                : { backgroundColor: "var(--border-light)", color: "var(--text-muted)", borderLeft: "1px solid var(--border)" }}
                            >
                              {g.wantCount}
                            </button>
                          )}
                        </div>
                        {/* Floating names popup — positioned below button column */}
                        {(namesPanel === `${g.id}-votes` || namesPanel === `${g.id}-wants`) && (
                          <div
                            className="absolute top-full left-0 mt-1 z-50 rounded-lg shadow-lg p-3 min-w-[140px] max-w-[200px]"
                            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                              {namesPanel === `${g.id}-votes` ? "▲ Interested" : "★ Wants to play"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(namesPanel === `${g.id}-votes` ? g.voters : g.wanters).map((name) => (
                                <span
                                  key={name}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: "var(--border-light)", color: "var(--text-secondary)" }}
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isPast && g.voteCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}>
                        ▲ {g.voteCount}
                      </span>
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium break-words" style={{ color: "var(--text-primary)" }}>
                          🎲 {g.name}
                        </span>
                        {g.plays.length > 0 && (
                          <span
                            className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}
                          >
                            ✓ Played {g.plays.length}×
                          </span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        by {g.user.name}
                        {g.userId === userId && (
                          <span className="ml-1 font-semibold" style={{ color: "var(--accent)" }}>(you)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(isCreator || isAdmin || isAttending) && (
                        <button
                          type="button"
                          onClick={() => setLoggingPlayId(loggingPlayId === g.id ? null : g.id)}
                          className="text-xs font-medium hover:underline transition-colors"
                          style={{ color: "var(--accent)" }}
                        >
                          {g.plays.length > 0 ? `+${g.plays.length} play${g.plays.length > 1 ? "s" : ""}` : "+ Log a play"}
                        </button>
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
                  {/* Log play form */}
                  {loggingPlayId === g.id && (
                    <LogPlayForm
                      gameId={g.id}
                      gameName={g.name}
                      eventId={eventId}
                      attendees={attendees}
                      plays={g.plays}
                      isCreator={isCreator}
                      isAdmin={isAdmin}
                      onClose={() => setLoggingPlayId(null)}
                    />
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
