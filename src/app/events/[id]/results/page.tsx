import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isEventOver } from "@/lib/eventUtils";
import { computeEventTrophies, TROPHY_META, TrophyKey, PlayForTrophy } from "@/lib/trophyUtils";
import { ShareStandingsButton } from "./ShareStandingsButton";

export default async function EventResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      name: true,
      date: true,
      endDate: true,
      games: {
        select: {
          name: true,
          plays: {
            select: {
              winner: true,
              notes: true,
              createdAt: true,
              players: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const isPast = isEventOver(event);

  // Build per-player stats and play log
  type PlayerStats = { played: number; won: number };
  const stats = new Map<string, PlayerStats>();
  const allPlays: { gameName: string; players: string[]; winner: string | null; notes: string | null }[] = [];

  for (const game of event.games) {
    for (const play of game.plays) {
      const players = play.players.map((p) => p.name);
      allPlays.push({ gameName: game.name, players, winner: play.winner, notes: play.notes });
      for (const name of players) {
        const s = stats.get(name) ?? { played: 0, won: 0 };
        s.played++;
        stats.set(name, s);
      }
      if (play.winner) {
        for (const wName of play.winner.split(" & ")) {
          if (wName === "The Game") continue;
          const s = stats.get(wName);
          if (s) s.won++;
        }
      }
    }
  }

  const players = [...stats.entries()]
    .map(([name, s]) => ({ name, ...s, winRate: s.played > 0 ? s.won / s.played : 0 }))
    .sort((a, b) => b.won - a.won || b.played - a.played);

  // Compute trophies — only finalised once the event is over
  type AwardedTrophy = { key: TrophyKey; winners: string[] };
  let awardedTrophies: AwardedTrophy[] = [];

  if (isPast && allPlays.length > 0) {
    const playsForTrophy: PlayForTrophy[] = event.games.flatMap((game) =>
      game.plays.map((play) => ({
        eventId: id,
        winner: play.winner,
        players: play.players,
        createdAt: play.createdAt,
        gameName: game.name,
      }))
    );

    const trophyMap = computeEventTrophies(playsForTrophy);

    // Invert: player→trophies  to  trophy→players, preserving TROPHY_META order
    const trophyToWinners = new Map<TrophyKey, string[]>();
    for (const [player, trophies] of trophyMap) {
      for (const trophy of trophies) {
        const list = trophyToWinners.get(trophy) ?? [];
        list.push(player);
        trophyToWinners.set(trophy, list);
      }
    }
    for (const key of Object.keys(TROPHY_META) as TrophyKey[]) {
      const winners = trophyToWinners.get(key);
      if (winners) awardedTrophies.push({ key, winners });
    }
  }

  const hasData = allPlays.length > 0;

  const shareDateStr = event.date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const shareTrophies = awardedTrophies.map(({ key, winners }) => ({
    emoji: TROPHY_META[key].emoji,
    label: TROPHY_META[key].label,
    winners,
  }));

  return (
    <div className="space-y-6">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-1 text-sm transition-colors hover:underline" style={{ color: "var(--accent)" }}>
        ← Back to event
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Standings</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{event.name}</p>
        </div>
        {isPast && hasData && (
          <ShareStandingsButton
            eventName={event.name}
            dateStr={shareDateStr}
            isPast={isPast}
            players={players.slice(0, 6).map((p) => ({ name: p.name, won: p.won, played: p.played }))}
            trophies={shareTrophies}
          />
        )}
      </div>

      {!hasData ? (
        <div className="text-center py-16 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="text-4xl mb-3">🎲</div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No plays logged yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Log game plays from the event page to see standings here.</p>
        </div>
      ) : (
        <>
          {/* Leaderboard table */}
          {players.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Leaderboard</h2>
              <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      {["Player", "Played", "Won", "Win %"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, i) => (
                      <tr key={p.name} style={{ borderBottom: i < players.length - 1 ? "1px solid var(--border-light)" : undefined }}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{p.played}</td>
                        <td className="px-4 py-2.5 font-semibold" style={{ color: p.won > 0 ? "var(--success)" : "var(--text-muted)" }}>{p.won}</td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                          {p.played > 0 ? `${Math.round(p.winRate * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Trophies — only shown once the event has ended */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Trophies</h2>
            {!isPast ? (
              <div
                className="rounded-xl px-5 py-4 text-sm text-center"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}
              >
                🏆 Trophies will be awarded when the event ends
              </div>
            ) : awardedTrophies.length === 0 ? (
              <div
                className="rounded-xl px-5 py-4 text-sm text-center"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}
              >
                No trophies awarded
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {awardedTrophies.map(({ key, winners }) => {
                  const { emoji, label, criteria } = TROPHY_META[key];
                  return (
                    <div
                      key={key}
                      className="rounded-xl p-4 text-center space-y-1"
                      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                    >
                      <div className="text-3xl">{emoji}</div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{criteria}</p>
                      <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                        {winners.join(" & ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Game log */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Game Log</h2>
            <div className="space-y-2">
              {allPlays.map((play, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                >
                  <div className="space-y-1.5">
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>🎲 {play.gameName}</p>
                    {play.players.length > 0 && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {play.players.join(", ")}
                      </p>
                    )}
                    {play.notes && <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>{play.notes}</p>}
                    {play.winner && (
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                        🏆 {play.winner}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
