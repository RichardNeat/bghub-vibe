export function isEventOver(event: { date: Date; endDate: Date | null }): boolean {
  const end = event.endDate ?? event.date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  return today > endDay;
}

export function formatDateRange(date: Date, endDate: Date | null): string {
  const startStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (!endDate) return startStr;
  const startDay = new Date(date);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endDate);
  endDay.setHours(0, 0, 0, 0);
  if (startDay.getTime() === endDay.getTime()) return startStr;
  const endStr = endDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}
