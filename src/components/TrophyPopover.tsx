"use client";

import { useState } from "react";
import { TrophyKey, TROPHY_META } from "@/lib/trophyUtils";

export function TrophyPopover({
  trophyKey,
  count,
  className,
  children,
}: {
  trophyKey: TrophyKey;
  count?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const meta = TROPHY_META[trophyKey];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full space-y-3 shadow-xl"
            style={{ backgroundColor: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-4xl leading-none">{meta.emoji}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xl font-bold leading-none mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                ×
              </button>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                {meta.label}
              </h3>
              {count !== undefined && count > 0 && (
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  Earned ×{count}
                </p>
              )}
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {meta.description}
            </p>

            <div
              className="rounded-lg px-3 py-2 text-xs"
              style={{ backgroundColor: "var(--border-light)", color: "var(--text-muted)" }}
            >
              🏁 {meta.criteria}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
