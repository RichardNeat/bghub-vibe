"use client";

import { useRef } from "react";

export function DateTimeInput({
  name,
  className,
  style,
  defaultValue,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  defaultValue?: string;
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
      defaultValue={defaultValue}
      className={className}
      style={{ cursor: "pointer", ...style }}
      onClick={() => ref.current?.showPicker?.()}
    />
  );
}
