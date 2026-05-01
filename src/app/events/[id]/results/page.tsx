import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EventResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      name: true,
      date: true,
      games: {
        select: {
          name: true,
          plays: {
            include: { players: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!event) notFound();

  // Build per-player stats
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
        const s = stats.get(play.winner);
        if (s) s.won++;
      }
    }
  }

  const players = [...stats.entries()]
    .map(([name, s]) => ({ name, ...s, winRate: s.played > 0 ? s.won / s.played : 0 }))
    .sort((a, b) => b.won - a.won || b.played - a.played);

  // Compute trophies
  type Trophy = { emoji: string; title: string; subtitle: string; winners: string[] };
  const trophies: Trophy[] = [];

  if (players.length > 0) {
    const maxWins = Math.max(...players.map((p) => p.won));
    if (maxWins > 0) {
      trophies.push({
        emoji: "🏆",
        title: "Champion",
        subtitle: `${maxWins} win${maxWins > 1 ? "s" : ""}`,
        winners: players.filter((p) => p.won === maxWins).map((p) => p.name),
      });
    }

    const maxPlayed = Math.max(...players.map((p) => p.played));
    const addicts = players.filter((p) => p.played === maxPlayed);
    trophies.push({
      emoji: "🎲",
      title: "Game Addict",
      subtitle: `${maxPlayed} game${maxPlayed > 1 ? "s" : ""} played`,
      winners: addicts.map((p) => p.name),
    });

    const zeroWins = players.filter((p) => p.played > 0 && p.won === 0);
    if (zeroWins.length > 0) {
      const maxPlayedNoWin = Math.max(...zeroWins.map((p) => p.played));
      trophies.push({
        emoji: "😢",
        title: "Unlucky",
        subtitle: `${maxPlayedNoWin} game${maxPlayedNoWin > 1 ? "s" : ""}, 0 wins`,
        winners: zeroWins.filter((p) => p.played === maxPlayedNoWin).map((p) => p.name),
      });
    }

    const undefeated = players.filter((p) => p.played >= 2 && p.won === p.played);
    if (undefeated.length > 0) {
      trophies.push({
        emoji: "🛡️",
        title: "Undefeated",
        subtitle: `Won every game`,
        winners: undefeated.map((p) => p.name),
      });
    }

    if (allPlays.length > 0) {
      const gameCounts = new Map<string, number>();
      for (const { gameName } of allPlays) gameCounts.set(gameName, (gameCounts.get(gameName) ?? 0) + 1);
      const topGameCount = Math.max(...gameCounts.values());
      if (topGameCount > 1) {
        const topGames = [...gameCounts.entries()].filter(([, c]) => c === topGameCount).map(([n]) => n);
        trophies.push({
          emoji: "🔁",
          title: "Fan Favourite",
          subtitle: `Played ${topGameCount}×`,
          winners: topGames,
        });
      }
    }
  }

  const hasData = allPlays.length > 0;

  return (
    <div className="space-y-6">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-1 text-sm transition-colors hover:underline" style={{ color: "var(--accent)" }}>
        ← Back to event
      </Link>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Results</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{event.name}</p>
      </div>

      {!hasData ? (
        <div className="text-center py-16 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="text-4xl mb-3">🎲</div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No plays logged yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Log game plays from the event page to see results here.</p>
        </div>
      ) : (
        <>
          {/* Trophies */}
          {trophies.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Trophies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trophies.map((t) => (
                  <div
                    key={t.title}
                    className="rounded-xl p-4 text-center space-y-1"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  >
                    <div className="text-3xl">{t.emoji}</div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.subtitle}</p>
                    <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                      {t.winners.join(" & ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Standings */}
          {players.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Standings</h2>
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

          {/* Game by game */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Game Log</h2>
            <div className="space-y-2">
              {allPlays.map((play, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>🎲 {play.gameName}</p>
                      {play.players.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {play.players.join(", ")}
                        </p>
                      )}
                      {play.notes && <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>{play.notes}</p>}
                    </div>
                    {play.winner && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
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
