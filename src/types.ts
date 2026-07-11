export type MemberId = 'gayoung' | 'jieun' | 'eunju' | 'jihoon' | 'yujin' | 'youngju';

export type AttendanceRole = 'required' | 'optional';

export interface Member {
  id: MemberId;
  name: string;
  role: AttendanceRole;
  avatarSeed: string;
}

/** date string format: 'YYYY-MM-DD' */
export type DateStr = string;

/** half-hour slot index from HOUR_START (9:00) to HOUR_END (20:00) → 22 slots */
export type SlotIndex = number;

export type CellSource = 'calendar' | 'manual' | 'quickExclude';

export interface MemberGridState {
  /** hard-unavailable half-hour slots, keyed by `${date}|${slot}` */
  excluded: Map<string, CellSource>;
  /** subset of excluded slots the member has marked as yieldable */
  flexible: Set<string>;
  /** whole-day off columns (dayoff), never interactable — value is the short
   * reason label shown in the grid (e.g. "연차", "세미나", "워크숍", "외근"). */
  dayoff: Map<DateStr, string>;
}

export type AttendanceStatus = 'possible' | 'yield' | 'impossible';

/** 1 = best (everyone fully available) through 6 = worst viable slot (some
 * required member must yield AND some optional member is fully unavailable). */
export type RankTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface SuggestedSlot {
  date: DateStr;
  startHour: number; // decimal hour, e.g. 15.5
  endHour: number;
  tier: RankTier;
  /** total members (required + optional) who yield or are impossible — the tie-breaker within a tier. */
  totalAffected: number;
  statuses: Record<MemberId, AttendanceStatus>;
}

export type ScreenId =
  | 'home'
  | 'avoidTime'
  | 'yieldTime'
  | 'suggestTime'
  | 'exploreTimes'
  | 'complete'
  | 'guestDone';

export type SheetId = 'calendar' | 'quickExclude' | 'requestYield' | 'confirmTime' | null;
