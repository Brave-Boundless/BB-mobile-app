// Calendar dates as 'YYYY-MM-DD' strings in the device's local time zone.
// Drill days are calendar days, not 24-hour windows, so all scheduling
// compares these strings rather than timestamps.

export type LocalDate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number);
  // Noon avoids DST edges shifting the date.
  return toLocalDate(new Date(y, m - 1, d + days, 12));
}

/** Local Date at hh:mm on the given calendar date. */
export function atTime(date: LocalDate, hhmm: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}
