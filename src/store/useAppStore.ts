import { create } from 'zustand';
import type {
  MemberId,
  MemberGridState,
  ScreenId,
  SheetId,
  SuggestedSlot,
  DateStr,
} from '../types';
import { buildInitialGridStates, HOST_ID, MEETING_TITLE, MEMBERS } from '../data/seed';
import { cellKey, hourToSlot, normalizeRect, type Rect } from '../lib/grid';
import { weekdaysInRange } from '../lib/dates';

export type GridMode = 'exclude' | 'flexible';

interface QuickExcludePreset {
  id: string;
  label: string;
  displayHasTime: boolean;
  timeLabel: string;
  apply: (weekdays: DateStr[]) => { date: DateStr; startHour: number; endHour: number }[];
}

export const QUICK_EXCLUDE_PRESETS: QuickExcludePreset[] = [
  {
    id: 'after17',
    label: '평일 17시 이후',
    displayHasTime: false,
    timeLabel: '',
    apply: (weekdays) => weekdays.map((d) => ({ date: d, startHour: 17, endHour: 20 })),
  },
  {
    id: 'after18',
    label: '평일 18시 이후',
    displayHasTime: false,
    timeLabel: '',
    apply: (weekdays) => weekdays.map((d) => ({ date: d, startHour: 18, endHour: 20 })),
  },
  {
    id: 'morning',
    label: '평일 오전',
    displayHasTime: true,
    timeLabel: '9-12시',
    apply: (weekdays) => weekdays.map((d) => ({ date: d, startHour: 9, endHour: 12 })),
  },
  {
    id: 'lunch',
    label: '점심 시간',
    displayHasTime: true,
    timeLabel: '12-13시',
    apply: (weekdays) => weekdays.map((d) => ({ date: d, startHour: 12, endHour: 13 })),
  },
  {
    id: 'justArrived',
    label: '출근 직후',
    displayHasTime: true,
    timeLabel: '9-10시',
    apply: (weekdays) => weekdays.map((d) => ({ date: d, startHour: 9, endHour: 10 })),
  },
  {
    id: 'fridayAfter17',
    label: '금요일 17시 이후',
    displayHasTime: false,
    timeLabel: '',
    apply: (weekdays) =>
      weekdays
        .filter((d) => new Date(d).getDay() === 5)
        .map((d) => ({ date: d, startHour: 17, endHour: 20 })),
  },
];

interface AppState {
  currentUser: MemberId;
  gridStates: Record<MemberId, MemberGridState>;
  meetingRange: { start: DateStr; end: DateStr };
  screenByUser: Record<MemberId, ScreenId>;
  activeSheet: SheetId;
  selectedSlot: SuggestedSlot | null;
  yieldRequestSent: boolean;
  dragRect: Rect | null;
  // Carousel scroll position on the suggestions screen — lifted out of that
  // screen's local state so it survives navigating to "전체 시간 탐색" and back
  // (that screen unmounts/remounts on navigation, which would otherwise reset
  // a plain useState to 0).
  suggestActiveIndex: number;
  // Who counts as a required attendee — editable on the Home screen, not a
  // fixed property of the member, so it drives suggestion ranking, avatar
  // ring colors, and the compare table live.
  requiredIds: Set<MemberId>;

  screen: () => ScreenId;
  setScreen: (s: ScreenId) => void;
  openSheet: (s: SheetId) => void;
  closeSheet: () => void;

  switchUser: (id: MemberId) => void;
  resetAll: () => void;
  toggleRequired: (id: MemberId) => void;

  toggleHourCell: (mode: GridMode, date: DateStr, hour: number) => void;
  commitRect: (mode: GridMode, rect: Rect, columns: DateStr[]) => void;
  removeBlock: (mode: GridMode, date: DateStr, startHour: number, endHour: number) => void;
  setDragRect: (r: Rect | null) => void;
  applyQuickExclude: (presetIds: string[]) => void;

  selectSuggestedSlot: (slot: SuggestedSlot) => void;
  setYieldRequestSent: (v: boolean) => void;
  setSuggestActiveIndex: (i: number) => void;
}

const initialScreenByUser: Record<MemberId, ScreenId> = {
  gayoung: 'home',
  jieun: 'avoidTime',
  eunju: 'home',
  jihoon: 'home',
  yujin: 'home',
  youngju: 'avoidTime',
};

const defaultRequiredIds = (): Set<MemberId> =>
  new Set(MEMBERS.filter((m) => m.role === 'required').map((m) => m.id));

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: HOST_ID,
  gridStates: buildInitialGridStates(),
  // Empty until the host picks a period on the Home screen (matches the
  // Figma "Home" state — no range pre-selected).
  meetingRange: { start: '', end: '' },
  screenByUser: { ...initialScreenByUser },
  activeSheet: null,
  selectedSlot: null,
  yieldRequestSent: false,
  dragRect: null,
  suggestActiveIndex: 0,
  requiredIds: defaultRequiredIds(),

  screen: () => get().screenByUser[get().currentUser],
  setScreen: (s) =>
    set((state) => ({
      screenByUser: { ...state.screenByUser, [state.currentUser]: s },
    })),
  openSheet: (s) => set({ activeSheet: s }),
  closeSheet: () => set({ activeSheet: null }),

  switchUser: (id) =>
    set((state) => {
      // Demo scenario: once the host has reached Complete, switching back to
      // the host should land directly on the (possibly updated) suggestions
      // screen rather than re-showing the stale Complete screen.
      const nextScreenByUser =
        state.screenByUser[id] === 'complete'
          ? { ...state.screenByUser, [id]: 'suggestTime' as const }
          : state.screenByUser;
      return { currentUser: id, activeSheet: null, screenByUser: nextScreenByUser };
    }),

  toggleRequired: (id) =>
    set((state) => {
      if (id === HOST_ID) return state; // host is always required, can't be unchecked
      const next = new Set(state.requiredIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { requiredIds: next };
    }),

  resetAll: () =>
    set({
      gridStates: buildInitialGridStates(),
      meetingRange: { start: '', end: '' },
      screenByUser: { ...initialScreenByUser },
      activeSheet: null,
      selectedSlot: null,
      yieldRequestSent: false,
      dragRect: null,
      suggestActiveIndex: 0,
      requiredIds: defaultRequiredIds(),
      currentUser: HOST_ID,
    }),

  toggleHourCell: (mode, date, hour) =>
    set((state) => {
      const user = state.currentUser;
      const prev = state.gridStates[user];
      const next: MemberGridState = {
        excluded: new Map(prev.excluded),
        flexible: new Set(prev.flexible),
        dayoff: prev.dayoff,
      };
      if (prev.dayoff.has(date)) return state;

      const keys = [cellKey(date, hourToSlot(hour)), cellKey(date, hourToSlot(hour + 0.5))];

      if (mode === 'exclude') {
        const allExcluded = keys.every((k) => next.excluded.has(k));
        if (allExcluded) {
          keys.forEach((k) => {
            next.excluded.delete(k);
            next.flexible.delete(k);
          });
        } else {
          keys.forEach((k) => next.excluded.set(k, 'manual'));
        }
      } else {
        // flexible mode: only toggle within already-excluded cells
        const relevantKeys = keys.filter((k) => next.excluded.has(k));
        if (relevantKeys.length === 0) return state;
        const allFlexible = relevantKeys.every((k) => next.flexible.has(k));
        relevantKeys.forEach((k) => {
          if (allFlexible) next.flexible.delete(k);
          else next.flexible.add(k);
        });
      }

      return { gridStates: { ...state.gridStates, [user]: next } };
    }),

  commitRect: (mode, rect, columns) =>
    set((state) => {
      const user = state.currentUser;
      const prev = state.gridStates[user];
      const next: MemberGridState = {
        excluded: new Map(prev.excluded),
        flexible: new Set(prev.flexible),
        dayoff: prev.dayoff,
      };
      const norm = normalizeRect(rect);
      const dates = columns.slice(norm.dateStart, norm.dateEnd + 1).filter((d) => !next.dayoff.has(d));

      for (const date of dates) {
        for (let slot = norm.slotStart; slot < norm.slotEnd; slot++) {
          const key = cellKey(date, slot);
          if (mode === 'exclude') {
            next.excluded.set(key, 'manual');
          } else if (next.excluded.has(key)) {
            next.flexible.add(key);
          }
        }
      }

      return { gridStates: { ...state.gridStates, [user]: next }, dragRect: null };
    }),

  removeBlock: (mode, date, startHour, endHour) =>
    set((state) => {
      const user = state.currentUser;
      const prev = state.gridStates[user];
      const next: MemberGridState = {
        excluded: new Map(prev.excluded),
        flexible: new Set(prev.flexible),
        dayoff: prev.dayoff,
      };
      for (let h = startHour; h < endHour; h += 0.5) {
        const key = cellKey(date, hourToSlot(h));
        if (mode === 'exclude') {
          next.excluded.delete(key);
          next.flexible.delete(key);
        } else {
          next.flexible.delete(key);
        }
      }
      return { gridStates: { ...state.gridStates, [user]: next } };
    }),

  setDragRect: (r) => set({ dragRect: r }),

  applyQuickExclude: (presetIds) =>
    set((state) => {
      const user = state.currentUser;
      const prev = state.gridStates[user];
      const next: MemberGridState = {
        excluded: new Map(prev.excluded),
        flexible: new Set(prev.flexible),
        dayoff: prev.dayoff,
      };
      const weekdays = weekdaysInRange(state.meetingRange.start, state.meetingRange.end);
      for (const id of presetIds) {
        const preset = QUICK_EXCLUDE_PRESETS.find((p) => p.id === id);
        if (!preset) continue;
        for (const { date, startHour, endHour } of preset.apply(weekdays)) {
          if (next.dayoff.has(date)) continue;
          for (let h = startHour; h < endHour; h += 0.5) {
            next.excluded.set(cellKey(date, hourToSlot(h)), 'quickExclude');
          }
        }
      }
      return { gridStates: { ...state.gridStates, [user]: next } };
    }),

  selectSuggestedSlot: (slot) => set({ selectedSlot: slot }),
  setYieldRequestSent: (v) => set({ yieldRequestSent: v }),
  setSuggestActiveIndex: (i) => set({ suggestActiveIndex: i }),
}));

export { MEETING_TITLE };
