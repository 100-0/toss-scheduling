import type { AttendanceStatus, MemberGridState, MemberId, SuggestedSlot, DateStr, RankTier } from '../types';
import { MEMBERS, MEMBER_MAP } from '../data/seed';
import { weekdaysInRange, HOUR_START, HOUR_END } from './dates';
import { cellKey, hourToSlot } from './grid';

function memberStatusAt(state: MemberGridState, date: DateStr, startHour: number, endHour: number): AttendanceStatus {
  if (state.dayoff.has(date)) return 'impossible';
  let anyExcluded = false;
  let allFlexible = true;
  for (let h = startHour; h < endHour; h += 0.5) {
    const key = cellKey(date, hourToSlot(h));
    if (state.excluded.has(key)) {
      anyExcluded = true;
      if (!state.flexible.has(key)) allFlexible = false;
    }
  }
  if (!anyExcluded) return 'possible';
  return allFlexible ? 'yield' : 'impossible';
}

export function computeStatuses(
  gridStates: Record<MemberId, MemberGridState>,
  date: DateStr,
  startHour: number,
  endHour: number
): Record<MemberId, AttendanceStatus> {
  const result = {} as Record<MemberId, AttendanceStatus>;
  for (const m of MEMBERS) {
    result[m.id] = memberStatusAt(gridStates[m.id], date, startHour, endHour);
  }
  return result;
}

/**
 * 6-tier ranking (see spec 6-0):
 *   0단계 자격 필터 — any required member 'impossible' disqualifies the slot outright.
 *     (required 'yield' does NOT disqualify — they still attend.)
 *   1단계 — tier = base(1 or 4, by whether any required member yields) + optLevel,
 *     where optLevel: 0 = optional all possible, 1 = optional only yields (no
 *     one fully unavailable), 2 = some optional fully unavailable.
 *   2단계 — within the same tier, fewer affected people (yield+impossible,
 *     required+optional combined) ranks first; then earliest date/time.
 */
function rankOf(
  statuses: Record<MemberId, AttendanceStatus>,
  requiredIds: ReadonlySet<MemberId>
): { tier: RankTier; totalAffected: number } | null {
  const required = MEMBERS.filter((m) => requiredIds.has(m.id));
  const optional = MEMBERS.filter((m) => !requiredIds.has(m.id));

  if (required.some((m) => statuses[m.id] === 'impossible')) return null; // not a candidate at all

  const requiredFlexibleCount = required.filter((m) => statuses[m.id] === 'yield').length;
  const optExcluded = optional.filter((m) => statuses[m.id] === 'impossible').length;
  const optFlexible = optional.filter((m) => statuses[m.id] === 'yield').length;

  const optLevel = optExcluded === 0 && optFlexible === 0 ? 0 : optExcluded === 0 ? 1 : 2;
  const tier = ((requiredFlexibleCount > 0 ? 3 : 0) + optLevel + 1) as RankTier;
  const totalAffected = optExcluded + optFlexible + requiredFlexibleCount;

  return { tier, totalAffected };
}

export function generateSuggestions(
  gridStates: Record<MemberId, MemberGridState>,
  requiredIds: ReadonlySet<MemberId>,
  meetingRange: { start: DateStr; end: DateStr },
  durationHours = 1
): SuggestedSlot[] {
  const weekdays = weekdaysInRange(meetingRange.start, meetingRange.end);
  const slots: SuggestedSlot[] = [];

  for (const date of weekdays) {
    for (let start = HOUR_START; start + durationHours <= HOUR_END; start += 0.5) {
      const end = start + durationHours;
      const statuses = computeStatuses(gridStates, date, start, end);
      const rank = rankOf(statuses, requiredIds);
      if (!rank) continue;
      slots.push({ date, startHour: start, endHour: end, statuses, ...rank });
    }
  }

  slots.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.totalAffected !== b.totalAffected) return a.totalAffected - b.totalAffected;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.startHour - b.startHour;
  });

  return slots;
}

export interface ExploreCell {
  date: DateStr;
  hour: number;
  /** true when a required member is fully unavailable — excluded from
   * recommendations outright, rendered as a hatched "필수 불가" cell. */
  dead: boolean;
  /** name of the (first) blocking required member, only set when dead. */
  deadByName?: string;
  /** the underlying ranked slot — reused as-is when confirming, so this
   * screen's picks flow through the exact same yield/confirm sheets as the
   * suggestion cards. */
  slot?: SuggestedSlot;
  /** how many of all members (required + optional) are fully free — the
   * heatmap's density axis. */
  possibleCount?: number;
  /** 1-based position within this week's own best-first ranking, only set
   * for the top `maxRank` non-dead cells. */
  rank?: number;
}

/**
 * One-hour-resolution slot quality for a single week, used by the "다른 시간
 * 탐색" heatmap. Reuses generateSuggestions (same tier/totalAffected ranking
 * that powers the suggestion cards) filtered down to whole-hour starts, then
 * ranks *within this week only* — so a week that has no overlap with the
 * globally-best slots still gets its own top picks and rank badges, instead
 * of always losing out to an earlier week under a single global ranking.
 */
export function computeExploreWeekCells(
  gridStates: Record<MemberId, MemberGridState>,
  requiredIds: ReadonlySet<MemberId>,
  weekDates: DateStr[],
  hours: number[],
  maxRank = 5
): ExploreCell[] {
  if (weekDates.length === 0) return [];

  const key = (date: DateStr, hour: number) => `${date}|${hour}`;
  const allSlots = generateSuggestions(
    gridStates,
    requiredIds,
    { start: weekDates[0], end: weekDates[weekDates.length - 1] },
    1
  );
  const hourly = allSlots.filter((s) => hours.includes(s.startHour));
  const viableMap = new Map(hourly.map((s) => [key(s.date, s.startHour), s]));
  const rankMap = new Map<string, number>();
  hourly.slice(0, maxRank).forEach((s, i) => rankMap.set(key(s.date, s.startHour), i + 1));

  const required = MEMBERS.filter((m) => requiredIds.has(m.id));
  const cells: ExploreCell[] = [];
  for (const date of weekDates) {
    for (const hour of hours) {
      const slot = viableMap.get(key(date, hour));
      if (!slot) {
        const statuses = computeStatuses(gridStates, date, hour, hour + 1);
        const blocking = required.find((m) => statuses[m.id] === 'impossible');
        cells.push({ date, hour, dead: true, deadByName: blocking ? MEMBER_MAP[blocking.id].name : undefined });
        continue;
      }
      const possibleCount = MEMBERS.filter((m) => slot.statuses[m.id] === 'possible').length;
      cells.push({
        date,
        hour,
        dead: false,
        slot,
        possibleCount,
        rank: rankMap.get(key(date, hour)),
      });
    }
  }
  return cells;
}

/** Buckets "how many of all members are fully free" into the heatmap's 5
 * density steps (5 = everyone free, 1 = only a few) — a scale wide enough to
 * cover the full member count even though, for a given seed dataset, the
 * worst viable slots may never reach the lowest steps. */
export function densityLevel(possibleCount: number, totalMembers: number): 1 | 2 | 3 | 4 | 5 {
  const gap = totalMembers - possibleCount;
  if (gap <= 0) return 5;
  if (gap === 1) return 4;
  if (gap === 2) return 3;
  if (gap === 3) return 2;
  return 1;
}
