"use client";

import { useState } from "react";

export function ShareStandingsButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/og`);
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
