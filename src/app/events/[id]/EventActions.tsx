"use client";

import { useState } from "react";

type Props = {
  calendarUrl: string;
};

export function EventActions({ calendarUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        {copied ? "✓ Copied!" : "🔗 Share"}
      </button>
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
        style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        📅 Add to calendar
      </a>
    </div>
  );
}
