import type { DateStr } from '../types';

export const HOUR_START = 9;
export const HOUR_END = 20;
export const SLOT_COUNT = (HOUR_END - HOUR_START) * 2; // 22 half-hour slots

export const MEETING_START: DateStr = '2026-07-13';
export const MEETING_END: DateStr = '2026-07-24';

// The demo's calendar is fixed to July 2026 to match the seed data, so
// "today" must be a fixed point inside that window too — the real system
// clock (`new Date()`) would rarely land in July 2026 and silently break the
// "pre-select today" default (nothing to highlight in the rendered month).
export const DEMO_TODAY: DateStr = '2026-07-10';

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export function parseDate(d: DateStr): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function formatDate(date: Date): DateStr {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(d: DateStr, days: number): DateStr {
  const date = parseDate(d);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function weekdayLabel(d: DateStr): string {
  return WEEKDAY_LABEL[parseDate(d).getDay()];
}

export function isWeekend(d: DateStr): boolean {
  const day = parseDate(d).getDay();
  return day === 0 || day === 6;
}

/** e.g. "7/14" */
export function shortDateLabel(d: DateStr): string {
  const date = parseDate(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** e.g. "7월 14일 화" */
export function longDateLabel(d: DateStr): string {
  const date = parseDate(d);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdayLabel(d)}`;
}

/** e.g. "7월 14일" — same 월/일 notation as longDateLabel, without the weekday. */
export function monthDayLabel(d: DateStr): string {
  const date = parseDate(d);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function weekdaysInRange(start: DateStr, end: DateStr): DateStr[] {
  const result: DateStr[] = [];
  let cur = start;
  while (cur <= end) {
    if (!isWeekend(cur)) result.push(cur);
    cur = addDays(cur, 1);
  }
  return result;
}

/** Splits a flat weekday list into per-week chunks, grouped by each date's
 * Monday — robust to a range that doesn't start on a Monday, unlike a plain
 * chunk-by-5. */
export function groupByWeek(dates: DateStr[]): DateStr[][] {
  const weeks = new Map<DateStr, DateStr[]>();
  for (const d of dates) {
    const monday = addDays(d, 1 - parseDate(d).getDay());
    if (!weeks.has(monday)) weeks.set(monday, []);
    weeks.get(monday)!.push(d);
  }
  return Array.from(weeks.values());
}

/** e.g. "7월 13일 주" — the week-tab label, keyed off a week's first date. */
export function weekOfLabel(d: DateStr): string {
  const date = parseDate(d);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 주`;
}

export function formatHour12(hourDecimal: number): { period: '오전' | '오후'; label: string } {
  const h = Math.floor(hourDecimal);
  const m = hourDecimal % 1 === 0.5 ? 30 : 0;
  const period: '오전' | '오후' = h < 12 ? '오전' : '오후';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  const label = m === 0 ? `${h12}:00` : `${h12}:${m}`;
  return { period, label };
}

/** e.g. "오전 11:00 - 12:00" — 오전/오후 is only ever shown on the start time,
 * even when the end time crosses into the other period. */
export function formatHourRange(startHour: number, endHour: number): string {
  const s = formatHour12(startHour);
  const e = formatHour12(endHour);
  return `${s.period} ${s.label} - ${e.label}`;
}
