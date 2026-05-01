"use client";

import { useEffect, useState } from "react";

export function EndDateInput({
  name,
  className,
  style,
  defaultValue,
  startDateInputName,
  initialMin,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  defaultValue?: string;
  startDateInputName: string;
  initialMin?: string; // YYYY-MM-DD
}) {
  const [min, setMin] = useState(initialMin ?? "");

  useEffect(() => {
    const startInput = document.querySelector<HTMLInputElement>(
      `input[name="${startDateInputName}"]`
    );
    if (!startInput) return;
    function onStartChange() {
      const val = startInput!.value; // "2026-05-03T19:00"
      setMin(val ? val.split("T")[0] : "");
    }
    startInput.addEventListener("change", onStartChange);
    return () => startInput.removeEventListener("change", onStartChange);
  }, [startDateInputName]);

  return (
    <input
      type="date"
      name={name}
      min={min || undefined}
      defaultValue={defaultValue}
      className={className}
      style={{ cursor: "pointer", ...style }}
    />
  );
}
