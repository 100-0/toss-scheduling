import type { Member, MemberGridState, MemberId, DateStr, CellSource } from '../types';
import { MEETING_START, MEETING_END, weekdaysInRange, weekdayLabel, HOUR_START, HOUR_END } from '../lib/dates';
import { cellKey, hourToSlot } from '../lib/grid';

export const MEMBERS: Member[] = [
  { id: 'gayoung', name: '이가영', role: 'required', avatarSeed: '#F4A6A0' },
  { id: 'jieun', name: '윤지은', role: 'required', avatarSeed: '#F6C6D0' },
  { id: 'eunju', name: '박은주', role: 'required', avatarSeed: '#C9A6E0' },
  { id: 'jihoon', name: '정지훈', role: 'optional', avatarSeed: '#9AB7D8' },
  { id: 'yujin', name: '한유진', role: 'optional', avatarSeed: '#E0B98A' },
  { id: 'youngju', name: '최영주', role: 'optional', avatarSeed: '#B7D8A0' },
];

export const MEMBER_MAP: Record<MemberId, Member> = Object.fromEntries(
  MEMBERS.map((m) => [m.id, m])
) as Record<MemberId, Member>;

export const HOST_ID: MemberId = 'gayoung';

function emptyState(): MemberGridState {
  return { excluded: new Map(), flexible: new Set(), dayoff: new Map() };
}

function addExcluded(
  state: MemberGridState,
  date: DateStr,
  startHour: number,
  endHour: number,
  source: CellSource,
  flexible = false
) {
  for (let h = startHour; h < endHour; h += 0.5) {
    const key = cellKey(date, hourToSlot(h));
    state.excluded.set(key, source);
    if (flexible) state.flexible.add(key);
  }
}

export function buildInitialGridStates(): Record<MemberId, MemberGridState> {
  const weekdays = weekdaysInRange(MEETING_START, MEETING_END);
  const byWeekday = (label: string) => weekdays.filter((d) => weekdayLabel(d) === label);

  const states: Record<MemberId, MemberGridState> = {
    gayoung: emptyState(),
    jieun: emptyState(),
    eunju: emptyState(),
    jihoon: emptyState(),
    yujin: emptyState(),
    youngju: emptyState(),
  };

  // 이가영(나): 7/15(수) 외근 14-17 (특정 1회), 7/17(금) 연차 (특정 1회)
  addExcluded(states.gayoung, '2026-07-15', 14, 17, 'calendar');
  states.gayoung.dayoff.set('2026-07-17', '연차');

  // 박은주(필수): 매주 화요일 종일 세미나로 완전 블록
  for (const d of byWeekday('화')) states.eunju.dayoff.set(d, '세미나');

  // 윤지은(필수): 매주 금요일 종일 워크숍으로 완전 블록
  for (const d of byWeekday('금')) states.jieun.dayoff.set(d, '워크숍');

  // 정지훈(선택): 매주 목요일 종일 외근 + 매주 월요일 9-11 블록
  for (const d of byWeekday('목')) states.jihoon.dayoff.set(d, '외근');
  for (const d of byWeekday('월')) addExcluded(states.jihoon, d, 9, 11, 'calendar');

  // 한유진(선택): 매주 목요일 종일 외근 + 매주 월요일 14-18 블록
  for (const d of byWeekday('목')) states.yujin.dayoff.set(d, '외근');
  for (const d of byWeekday('월')) addExcluded(states.yujin, d, 14, 18, 'calendar');

  // 최영주(선택): 매주 수요일 종일 외근 (처음부터 끝까지 불가능, 양보 불가)
  for (const d of byWeekday('수')) addExcluded(states.youngju, d, HOUR_START, HOUR_END, 'calendar');

  return states;
}

export const MEETING_TITLE = '디자인팀 회의';
export const MEETING_DURATION_HOURS = 1;
