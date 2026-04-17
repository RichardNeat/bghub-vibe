"use client";

import { useRef } from "react";

export function DateTimeInput({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const min = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <input
      ref={ref}
      type="datetime-local"
      name={name}
      required
      min={min}
      className={className}
      style={{ cursor: "pointer", ...style }}
      onClick={() => ref.current?.showPicker?.()}
    />
  );
}
