"use client";

import { useState } from "react";
import { clubs, REGIONS } from "@/data/clubs";

export default function ClubsPage() {
  const [region, setRegion] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = clubs.filter((c) => {
    const matchesRegion = region === "All" || c.region === region;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);
    return matchesRegion && matchesSearch;
  });

  const grouped = REGIONS.filter((r) => region === "All" || r === region)
    .map((r) => ({ region: r, clubs: filtered.filter((c) => c.region === r) }))
    .filter((g) => g.clubs.length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          UK Board Game Clubs
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {clubs.length} clubs across the UK
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl px-5 py-4 flex flex-col sm:flex-row gap-3"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clubs…"
          className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ border: "1px solid var(--border)" }}
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ border: "1px solid var(--border)" }}
        >
          <option value="All">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No clubs found</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Try a different search or region</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ region: r, clubs: regionClubs }) => (
            <section key={r} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {r}
                </h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--purple-light)", color: "var(--purple)" }}
                >
                  {regionClubs.length}
                </span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-3">
                {regionClubs.map((club) => (
                  <li
                    key={club.name}
                    className="rounded-xl px-5 py-4 shadow-sm flex flex-col gap-2"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  >
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {club.name}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        📍 {club.city}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {club.description}
                    </p>
                    {(club.website || club.meetup || club.facebook || club.instagram) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {club.website && (
                          <a
                            href={club.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-all hover:opacity-80"
                            style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                          >
                            Website
                          </a>
                        )}
                        {club.meetup && (
                          <a
                            href={club.meetup}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-all hover:opacity-80"
                            style={{ backgroundColor: "var(--purple-light)", color: "var(--purple)" }}
                          >
                            Meetup
                          </a>
                        )}
                        {club.facebook && (
                          <a
                            href={club.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-all hover:opacity-80"
                            style={{ backgroundColor: "color-mix(in srgb, #1877f2 15%, transparent)", color: "#1877f2" }}
                          >
                            Facebook
                          </a>
                        )}
                        {club.instagram && (
                          <a
                            href={club.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-all hover:opacity-80"
                            style={{ backgroundColor: "color-mix(in srgb, #e1306c 15%, transparent)", color: "#e1306c" }}
                          >
                            Instagram
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Attribution */}
      <p className="text-xs text-center pb-2" style={{ color: "var(--text-muted)" }}>
        Know a club that&apos;s missing?{" "}
        <a href="https://boardgameclubs.uk" target="_blank" rel="noopener noreferrer" className="underline">
          boardgameclubs.uk
        </a>{" "}
        maintains a comprehensive interactive map of 280+ UK clubs.
      </p>
    </div>
  );
}
