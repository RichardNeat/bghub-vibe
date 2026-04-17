"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  name: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LocationAutocomplete({ name, placeholder, className, style }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
      const data: string[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
      setActiveIdx(-1);
    } catch {
      setSuggestions([]);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  }

  function pick(address: string) {
    setQuery(address);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        name={name}
        value={query}
        placeholder={placeholder}
        className={className}
        style={style}
        autoComplete="off"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((address, idx) => (
            <li key={address}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(address); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{
                  backgroundColor: idx === activeIdx ? "var(--accent-light)" : "transparent",
                  color: "var(--text-primary)",
                }}
              >
                📍 {address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
