import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEventOver } from "@/lib/eventUtils";
import { computeEventTrophies, TROPHY_META, TrophyKey, PlayForTrophy } from "@/lib/trophyUtils";

const BG = "#111827";
const CARD = "#1f2937";
const ACCENT = "#60a5fa";
const SUCCESS = "#4ade80";
const MUTED = "#9ca3af";
const TEXT = "#f9fafb";
const BORDER = "#374151";
const GOLD = "#fbbf24";
const SILVER = "#e5e7eb";
const BRONZE = "#d97706";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
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
                createdAt: true,
                players: { select: { name: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!event) return new Response("Not found", { status: 404 });

    const isPast = isEventOver(event);

    // Build standings
    const stats = new Map<string, { played: number; won: number }>();
    const allPlaysForTrophy: PlayForTrophy[] = [];

    for (const game of event.games) {
      for (const play of game.plays) {
        allPlaysForTrophy.push({
          eventId: id,
          winner: play.winner,
          players: play.players,
          createdAt: play.createdAt,
          gameName: game.name,
        });
        for (const { name } of play.players) {
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
      .sort((a, b) => b.won - a.won || b.played - a.played)
      .slice(0, 6);

    // Awarded trophies
    type AwardedTrophy = { key: TrophyKey; emoji: string; label: string; winners: string[] };
    let awardedTrophies: AwardedTrophy[] = [];

    if (isPast && allPlaysForTrophy.length > 0) {
      const trophyMap = computeEventTrophies(allPlaysForTrophy);
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
        if (winners) {
          const { emoji, label } = TROPHY_META[key];
          awardedTrophies.push({ key, emoji, label, winners });
        }
      }
    }

    const dateStr = event.date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const medals = ["🥇", "🥈", "🥉"];
    const medalColors = [GOLD, SILVER, BRONZE];

    const hasData = players.length > 0;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1080px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: BG,
            fontFamily: "sans-serif",
          }}
        >
          {/* Top gradient bar */}
          <div
            style={{
              width: "100%",
              height: "10px",
              background: "linear-gradient(90deg, #1a1730, #3b3080, #2563eb)",
              flexShrink: 0,
            }}
          />

          {/* Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "52px 60px 48px",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>🎲</span>
                <span style={{ fontSize: "26px", fontWeight: "bold", color: ACCENT, letterSpacing: "-0.5px" }}>
                  BGHub
                </span>
              </div>
              <span style={{ fontSize: "20px", color: MUTED }}>{dateStr}</span>
            </div>

            {/* Event name */}
            <div style={{ marginBottom: "6px" }}>
              <span style={{ fontSize: "44px", fontWeight: "bold", color: TEXT, lineHeight: 1.1 }}>
                {event.name}
              </span>
            </div>
            <div style={{ marginBottom: "36px" }}>
              <span style={{ fontSize: "20px", color: MUTED }}>
                {isPast ? "Final Standings" : "Live Standings"}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: "100%", height: "1px", backgroundColor: BORDER, marginBottom: "32px" }} />

            {!hasData ? (
              <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "28px", color: MUTED }}>No plays logged yet</span>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingBottom: "12px",
                    marginBottom: "8px",
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  <span style={{ width: "52px", fontSize: "14px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>#</span>
                  <span style={{ flex: 1, fontSize: "14px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>Player</span>
                  <span style={{ width: "80px", textAlign: "right", fontSize: "14px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>Wins</span>
                  <span style={{ width: "96px", textAlign: "right", fontSize: "14px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>Played</span>
                  <span style={{ width: "88px", textAlign: "right", fontSize: "14px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>Win %</span>
                </div>

                {/* Player rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {players.map((p, i) => (
                    <div
                      key={p.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        backgroundColor: i === 0 ? "rgba(96,165,250,0.08)" : CARD,
                      }}
                    >
                      <div style={{ width: "36px", display: "flex", alignItems: "center" }}>
                        {i < 3 ? (
                          <span style={{ fontSize: "24px" }}>{medals[i]}</span>
                        ) : (
                          <span style={{ fontSize: "18px", color: MUTED, fontWeight: "bold" }}>{i + 1}</span>
                        )}
                      </div>
                      <span
                        style={{
                          flex: 1,
                          fontSize: "22px",
                          fontWeight: i < 3 ? "bold" : "normal",
                          color: i === 0 ? TEXT : i < 3 ? medalColors[i] : TEXT,
                          marginLeft: "16px",
                          overflow: "hidden",
                        }}
                      >
                        {p.name}
                      </span>
                      <span style={{ width: "80px", textAlign: "right", fontSize: "26px", fontWeight: "bold", color: p.won > 0 ? SUCCESS : MUTED }}>
                        {p.won}
                      </span>
                      <span style={{ width: "96px", textAlign: "right", fontSize: "20px", color: MUTED }}>
                        {p.played}
                      </span>
                      <span style={{ width: "88px", textAlign: "right", fontSize: "20px", color: MUTED }}>
                        {p.played > 0 ? `${Math.round(p.winRate * 100)}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Trophies */}
                {awardedTrophies.length > 0 && (
                  <div style={{ marginTop: "auto", paddingTop: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                      <span style={{ fontSize: "14px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>
                        Trophies
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {awardedTrophies.slice(0, 8).map(({ key, emoji, label, winners }) => (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: CARD,
                            borderRadius: "999px",
                            padding: "6px 14px 6px 10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>{emoji}</span>
                          <span style={{ fontSize: "14px", color: MUTED }}>{label}</span>
                          <span style={{ fontSize: "14px", color: ACCENT, marginLeft: "4px" }}>
                            {winners.join(" & ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <div
              style={{
                marginTop: hasData && awardedTrophies.length > 0 ? "24px" : "auto",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                paddingTop: "20px",
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <span style={{ fontSize: "16px", color: MUTED }}>Generated by BGHub</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
        emoji: "twemoji",
      }
    );
  } catch (e) {
    console.error(e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
