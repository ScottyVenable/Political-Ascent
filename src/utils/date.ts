import type { GameDate } from '@/types';

/** Days per month — ignores leap years for simulation simplicity. */
const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Advances a GameDate by `days`. Handles month/year rollover. */
export function addDays(date: GameDate, days: number): GameDate {
  let { year, month, day } = date;
  day += days;
  while (day > DAYS_PER_MONTH[month - 1]) {
    day -= DAYS_PER_MONTH[month - 1];
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += DAYS_PER_MONTH[month - 1];
  }
  return { year, month, day };
}

/** Day-of-week (0 = Sun, 6 = Sat) using Zeller-style calc. */
export function dayOfWeek(date: GameDate): number {
  const { year, month, day } = date;
  const y = month < 3 ? year - 1 : year;
  const m = month < 3 ? month + 12 : month;
  return ((day + Math.floor((13 * (m + 1)) / 5) + y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) + 6) % 7;
}

/** True if the given date is the first of the month. */
export function isMonthStart(date: GameDate): boolean {
  return date.day === 1;
}

/** True if the date is January 1st. */
export function isYearStart(date: GameDate): boolean {
  return date.month === 1 && date.day === 1;
}

/** Converts the date to a days-since-epoch integer for comparisons. */
export function toEpochDays(date: GameDate): number {
  let days = date.year * 365 + (date.month - 1) * 30 + date.day;
  for (let i = 0; i < date.month - 1; i++) days += DAYS_PER_MONTH[i] - 30;
  return days;
}

/** Compares two dates. Returns negative if a < b, zero if equal, positive otherwise. */
export function compareDates(a: GameDate, b: GameDate): number {
  return toEpochDays(a) - toEpochDays(b);
}
