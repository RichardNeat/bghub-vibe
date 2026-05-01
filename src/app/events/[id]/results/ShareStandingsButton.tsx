"use client";

import { useState } from "react";

type Player = { name: string; won: number; played: number };
type Trophy = { emoji: string; label: string; winners: string[] };

const C = {
  bg: "#111827", card: "#1f2937", accent: "#60a5fa",
  success: "#4ade80", muted: "#9ca3af", text: "#f9fafb",
  border: "#374151", gold: "#fbbf24", silver: "#e5e7eb", bronze: "#d97706",
};

function hline(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, stroke = false) {
  const rad = Math.min(r, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
  if (stroke) ctx.stroke(); else ctx.fill();
}

function clip(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function buildCard(
  eventName: string,
  dateStr: string,
  isPast: boolean,
  players: Player[],
  trophies: Trophy[],
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1080, H = 1080, PAD = 60;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("No canvas context")); return; }

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Gradient top bar
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "#1a1730");
    g.addColorStop(0.5, "#3b3080");
    g.addColorStop(1, "#2563eb");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 10);

    let y = 10 + 52;
    ctx.textBaseline = "top";

    // Header: BGHub + date
    ctx.font = "bold 26px system-ui, sans-serif";
    ctx.fillStyle = C.accent;
    ctx.fillText("🎲 BGHub", PAD, y);
    if (dateStr) {
      ctx.font = "20px system-ui, sans-serif";
      ctx.fillStyle = C.muted;
      ctx.textAlign = "right";
      ctx.fillText(dateStr, W - PAD, y + 3);
      ctx.textAlign = "left";
    }
    y += 46;

    // Event name
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.fillStyle = C.text;
    ctx.fillText(clip(ctx, eventName, W - PAD * 2), PAD, y);
    y += 54;

    // Subtitle
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillStyle = C.muted;
    ctx.fillText(isPast ? "Final Standings" : "Live Standings", PAD, y);
    y += 38;

    hline(ctx, PAD, W - PAD, y);
    y += 28;

    if (players.length > 0) {
      const RW = W - PAD * 2;
      const COL_WON = 80, COL_PL = 90, COL_PCT = 88;
      const nameW = RW - 52 - COL_WON - COL_PL - COL_PCT;
      const xName = PAD + 52;
      const xWon = xName + nameW + COL_WON;
      const xPl = xWon + COL_PL;
      const xPct = PAD + RW;

      // Column headers
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillStyle = C.muted;
      ctx.textBaseline = "top";
      ctx.fillText("PLAYER", xName, y);
      ctx.textAlign = "right";
      ctx.fillText("WINS", xWon, y);
      ctx.fillText("PLAYED", xPl, y);
      ctx.fillText("WIN %", xPct, y);
      ctx.textAlign = "left";
      y += 20;

      hline(ctx, PAD, W - PAD, y);
      y += 10;

      const MEDALS = ["🥇", "🥈", "🥉"];
      const MEDAL_COLORS = [C.gold, C.silver, C.bronze];
      const ROW_H = 56;

      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const my = y + ROW_H / 2;

        ctx.fillStyle = i === 0 ? "rgba(96,165,250,0.08)" : C.card;
        rrect(ctx, PAD, y, RW, ROW_H, 10);

        // Rank / medal
        if (i < 3) {
          ctx.font = "22px sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = C.text;
          ctx.fillText(MEDALS[i], PAD + 8, my);
        } else {
          ctx.font = "bold 16px system-ui, sans-serif";
          ctx.fillStyle = C.muted;
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.fillText(String(i + 1), PAD + 26, my);
          ctx.textAlign = "left";
        }

        // Name
        ctx.textBaseline = "middle";
        ctx.font = i < 3 ? "bold 21px system-ui, sans-serif" : "21px system-ui, sans-serif";
        ctx.fillStyle = i === 0 ? C.text : i < 3 ? MEDAL_COLORS[i] : C.text;
        ctx.fillText(clip(ctx, p.name, nameW - 12), xName, my);

        // Stats
        ctx.textAlign = "right";
        ctx.font = "bold 24px system-ui, sans-serif";
        ctx.fillStyle = p.won > 0 ? C.success : C.muted;
        ctx.fillText(String(p.won), xWon, my);

        ctx.font = "19px system-ui, sans-serif";
        ctx.fillStyle = C.muted;
        ctx.fillText(String(p.played), xPl, my);
        ctx.fillText(p.played > 0 ? `${Math.round((p.won / p.played) * 100)}%` : "—", xPct, my);
        ctx.textAlign = "left";

        y += ROW_H + 4;
      }

      y += 8;
    }

    // Trophies
    if (trophies.length > 0) {
      y += 20;
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillStyle = C.muted;
      ctx.textBaseline = "top";
      ctx.fillText("TROPHIES", PAD, y);
      y += 22;

      let tx = PAD;
      const PILL_H = 34;

      for (const t of trophies.slice(0, 8)) {
        ctx.font = "14px system-ui, sans-serif";
        const lw = ctx.measureText(`${t.emoji} ${t.label}`).width;
        ctx.font = "bold 14px system-ui, sans-serif";
        const ww = ctx.measureText(`  ${t.winners.join(" & ")}`).width;
        const pillW = 26 + lw + ww;

        if (tx + pillW > W - PAD) { tx = PAD; y += PILL_H + 8; }

        ctx.fillStyle = C.card;
        rrect(ctx, tx, y, pillW, PILL_H, 999);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        rrect(ctx, tx, y, pillW, PILL_H, 999, true);

        ctx.textBaseline = "middle";
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillStyle = C.muted;
        ctx.fillText(`${t.emoji} ${t.label}`, tx + 12, y + PILL_H / 2);
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.fillStyle = C.accent;
        ctx.fillText(`  ${t.winners.join(" & ")}`, tx + 12 + lw, y + PILL_H / 2);

        tx += pillW + 8;
      }
    }

    // Footer
    hline(ctx, PAD, W - PAD, H - 52);
    ctx.font = "15px system-ui, sans-serif";
    ctx.fillStyle = C.muted;
    ctx.textBaseline = "top";
    ctx.textAlign = "right";
    ctx.fillText("Generated by BGHub", W - PAD, H - 42);
    ctx.textAlign = "left";

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, "image/png");
  });
}

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

  async function handleShare() {
    setLoading(true);
    try {
      const blob = await buildCard(eventName, dateStr, isPast, players, trophies);
      const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const file = new File([blob], `${slug}-standings.png`, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({ title: `${eventName} – Final Standings`, files: [file] });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-standings.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") console.error(e);
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
