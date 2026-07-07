/** True when another sparring can still be declared this week (spec 01 §9.1.2). */
export function isWithinSparringCap(
  validatedSparringThisWeek: number,
  weeklyCap: number,
): boolean {
  return validatedSparringThisWeek < weeklyCap;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * ISO week bounds (Monday 00:00:00.000 → Sunday 23:59:59.999) in local time.
 * Implemented without date-fns to keep the engine dependency-free.
 */
export function getIsoWeekBounds(at: Date): { start: Date; end: Date } {
  const start = new Date(at);
  start.setHours(0, 0, 0, 0);
  const daysFromMonday = (start.getDay() + 6) % 7;
  start.setTime(start.getTime() - daysFromMonday * MS_PER_DAY);

  const end = new Date(start.getTime() + 7 * MS_PER_DAY - 1);
  return { start, end };
}
