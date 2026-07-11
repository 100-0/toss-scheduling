import { useMemo } from 'react';
import BottomSheet, { Grabber, SheetHeader } from '../components/BottomSheet';
import CompareTable from '../components/CompareTable';
import { useAppStore } from '../store/useAppStore';
import { generateSuggestions } from '../lib/suggest';
import { MEMBERS, MEETING_DURATION_HOURS } from '../data/seed';
import { longDateLabel, formatHourRange } from '../lib/dates';

export default function ConfirmTimeSheet() {
  const closeSheet = useAppStore((s) => s.closeSheet);
  const gridStates = useAppStore((s) => s.gridStates);
  const requiredIds = useAppStore((s) => s.requiredIds);
  const meetingRange = useAppStore((s) => s.meetingRange);
  const selectedSlot = useAppStore((s) => s.selectedSlot);
  const setScreen = useAppStore((s) => s.setScreen);

  const allSuggestions = useMemo(
    () => generateSuggestions(gridStates, requiredIds, meetingRange, MEETING_DURATION_HOURS),
    [gridStates, requiredIds, meetingRange]
  );
  const compareOptions = useMemo(() => {
    if (!selectedSlot) return [];
    const others = allSuggestions.filter((s) => !(s.date === selectedSlot.date && s.startHour === selectedSlot.startHour));
    return [selectedSlot, ...others.slice(0, 2)];
  }, [allSuggestions, selectedSlot]);

  if (!selectedSlot) return null;

  const yielders = MEMBERS.filter((m) => selectedSlot.statuses[m.id] === 'yield');
  const impossible = MEMBERS.filter((m) => selectedSlot.statuses[m.id] === 'impossible');
  const topPick = allSuggestions[0];
  // "가장 빠른 시간대" only describes the single #1-ranked slot, not every card.
  const isFastest = !!topPick && topPick.date === selectedSlot.date && topPick.startHour === selectedSlot.startHour;

  const reasons = [
    isFastest && '가장 빠른 시간대',
    impossible.length === 0 && '전원 참석 가능',
    yielders.length === 0 ? '양보 없음' : `${yielders.length}명 양보`,
  ].filter(Boolean) as string[];

  const confirm = () => {
    closeSheet();
    setScreen('complete');
  };

  return (
    <BottomSheet onDismiss={closeSheet}>
      <div className="bg-gray-00 rounded-t-[24px] flex flex-col gap-2 items-center pb-9 w-full">
        <Grabber />
        <SheetHeader title="시간 확정하기" onClose={closeSheet} />
        <div className="flex flex-col gap-0.5 items-start px-4 w-full">
          <div className="text-[19px] font-bold text-gray-95">
            {longDateLabel(selectedSlot.date)}
            <br />
            {formatHourRange(selectedSlot.startHour, selectedSlot.endHour)}
          </div>
          <div className="flex flex-col gap-0.5 items-start py-2">
            {reasons.map((r) => (
              <div key={r} className="flex gap-1 items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L4.5 8.5L10 3" stroke="#4B4E4E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[13px] text-gray-70">{r}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 items-start px-4 w-full">
          <div className="text-[13px] font-semibold text-gray-60">참석자별 상태 비교</div>
          <CompareTable options={compareOptions} />
        </div>
        <div className="flex flex-col items-start px-4 pt-4 w-full">
          <button
            onClick={confirm}
            className="bg-gray-100 w-full h-[52px] rounded-full flex items-center justify-center text-[17px] font-semibold text-white cursor-pointer"
          >
            확정 완료하기
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
