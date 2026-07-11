import type { Member, MemberGridState, MemberId, DateStr, CellSource } from '../types';
import { MEETING_START, MEETING_END, weekdaysInRange, weekdayLabel } from '../lib/dates';
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

  // 이가영(나, 필수): 7/15(수) 외근 14-17 (특정 1회), 7/17(금) 연차 (특정 1회)
  addExcluded(states.gayoung, '2026-07-15', 14, 17, 'calendar');
  states.gayoung.dayoff.set('2026-07-17', '연차');

  // 윤지은(필수): 매주 월 9-11 외부미팅 (불가) + 매주 금 14-17 외부강의 (불가)
  for (const d of byWeekday('월')) addExcluded(states.jieun, d, 9, 11, 'calendar');
  for (const d of byWeekday('금')) addExcluded(states.jieun, d, 14, 17, 'calendar');

  // 박은주(필수): 매주 화 12-15 고객사 미팅 (불가) + 매주 수 15-18 외부출장 (불가)
  for (const d of byWeekday('화')) addExcluded(states.eunju, d, 12, 15, 'calendar');
  for (const d of byWeekday('수')) addExcluded(states.eunju, d, 15, 18, 'calendar');

  // 정지훈(선택): 매주 화 9-12 외부미팅 (불가) + 매주 목 13-17 외근 (불가)
  //   + 매주 수 11-12 개인선호 회피 (양보가능)
  for (const d of byWeekday('화')) addExcluded(states.jihoon, d, 9, 12, 'calendar');
  for (const d of byWeekday('목')) addExcluded(states.jihoon, d, 13, 17, 'calendar');
  for (const d of byWeekday('수')) addExcluded(states.jihoon, d, 11, 12, 'calendar', true);

  // 한유진(선택): 매주 월 14-18 오후 외부교육 (불가) + 매주 수 9-11 업무 집중시간 (불가)
  //   + 매주 목 13-17 외근 공유 (불가) + 매주 수 11-12 개인선호 회피 (양보가능)
  for (const d of byWeekday('월')) addExcluded(states.yujin, d, 14, 18, 'calendar');
  for (const d of byWeekday('수')) addExcluded(states.yujin, d, 9, 11, 'calendar');
  for (const d of byWeekday('목')) addExcluded(states.yujin, d, 13, 17, 'calendar');
  for (const d of byWeekday('수')) addExcluded(states.yujin, d, 11, 12, 'calendar', true);

  // 최영주(선택): 매주 목 9-13 오전 집중업무 (불가) + 매주 화 16-19 저녁 약속 (불가)
  //   + 매주 월/화 9-12 재택 회피 (양보가능)
  for (const d of byWeekday('목')) addExcluded(states.youngju, d, 9, 13, 'calendar');
  for (const d of byWeekday('화')) addExcluded(states.youngju, d, 16, 19, 'calendar');
  for (const d of byWeekday('월')) addExcluded(states.youngju, d, 9, 12, 'calendar', true);
  for (const d of byWeekday('화')) addExcluded(states.youngju, d, 9, 12, 'calendar', true);

  return states;
}

export const MEETING_TITLE = '디자인팀 회의';
export const MEETING_DURATION_HOURS = 1;
