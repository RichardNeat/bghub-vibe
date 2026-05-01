"use client";

import { useState } from "react";

type Player = { name: string; won: number; played: number };
type Trophy = { emoji: string; label: string; winners: string[] };

export function ShareStandingsButton({
  eventName,
  dateStr,
  isPast,
  players,
  trophies,
}: {
  eventName: string;
  dateStr: string;
  isPast: boolean;
  players: Player[];
  trophies: Trophy[];
}) {
  const [loading, setLoading] = useState(false);

  function buildImageUrl() {
    const params = new URLSearchParams({
      name: eventName,
      date: dateStr,
      isPast: isPast ? "1" : "0",
      players: JSON.stringify(players.slice(0, 6)),
      trophies: JSON.stringify(trophies.slice(0, 8)),
    });
    return `/api/og?${params}`;
  }

  async function handleShare() {
    setLoading(true);
    try {
      const res = await fetch(buildImageUrl());
      if (!res.ok) throw new Error("Failed to generate image");
      const blob = await res.blob();

      const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const file = new File([blob], `${slug}-standings.png`, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          title: `${eventName} – Final Standings`,
          files: [file],
        });
        return;
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-standings.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: "var(--accent)", color: "#fff" }}
    >
      {loading ? "Generating…" : "📤 Share standings"}
    </button>
  );
}
