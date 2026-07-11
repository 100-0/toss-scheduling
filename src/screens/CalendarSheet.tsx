import { useState } from 'react';
import BottomSheet, { Grabber } from '../components/BottomSheet';
import { useAppStore } from '../store/useAppStore';
import { formatDate, parseDate, shortDateLabel, DEMO_TODAY } from '../lib/dates';

const YEAR = 2026;
const MONTH = 7; // July — the only month this demo's seed data supports, so
// the prev/next chevrons are shown for visual parity with the design but
// don't actually navigate.

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 5L8 12L15 19" stroke="#5D6060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 5L16 12L9 19" stroke="#5D6060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CalendarSheet() {
  const closeSheet = useAppStore((s) => s.closeSheet);
  const meetingRange = useAppStore((s) => s.meetingRange);
  // Pre-select today as the start date so it shows as already active — the
  // very next tap is then treated as picking the end date, same as if the
  // user had tapped today themselves first.
  const [start, setStart] = useState<string | null>(meetingRange.start || DEMO_TODAY);
  const [end, setEnd] = useState<string | null>(meetingRange.end || null);

  const setRange = useAppStore.setState;

  const totalDays = daysInMonth(YEAR, MONTH);
  const startWeekday = firstWeekday(YEAR, MONTH);
  const totalCells = Math.ceil((startWeekday + totalDays) / 7) * 7;
  // Spills into the adjacent months to fill out the grid (matches the Figma
  // calendar) — `Date` rolls negative/overflowing days into the previous or
  // next month automatically, so this needs no separate leading/trailing math.
  const gridStart = new Date(YEAR, MONTH - 1, 1 - startWeekday);
  const cells: string[] = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return formatDate(d);
  });
  const inCurrentMonth = (d: string) => {
    const dt = parseDate(d);
    return dt.getFullYear() === YEAR && dt.getMonth() === MONTH - 1;
  };

  const handlePick = (d: string) => {
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
    } else if (d < start) {
      setStart(d);
      setEnd(null);
    } else {
      setEnd(d);
    }
  };

  const confirm = () => {
    if (start && end) {
      setRange({ meetingRange: { start, end } });
      closeSheet();
    }
  };

  const inRange = (d: string) => start && end && d >= start && d <= end;

  return (
    <BottomSheet onDismiss={closeSheet} floating>
      <div className="bg-gray-00 rounded-[40px] shadow-[0_-6px_12px_rgba(0,0,0,0.1)] flex flex-col gap-2 items-center pb-4 w-[359px]">
        <Grabber />
        <div className="flex flex-col gap-0.5 items-start px-4 py-3 w-full">
          <div className="text-[17px] font-semibold text-gray-95">회의 기간 선택</div>
          <div className="text-[13px] text-gray-40">시작일을 먼저 선택한 뒤, 종료일을 선택해주세요</div>
        </div>
        <div className="flex flex-col items-start pb-4 px-4 w-full">
          <div className="flex items-center justify-center gap-6 w-full text-[17px] font-semibold text-gray-80 py-1.5">
            <ChevronLeft />
            <span>2026년 7월</span>
            <ChevronRight />
          </div>
          <div className="flex flex-col items-start pt-4 w-full">
            <div className="flex w-full">
              {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
                <div
                  key={w}
                  className={`flex-1 text-center text-[12px] font-medium ${i === 0 ? 'text-red-05' : 'text-gray-40'}`}
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0.5 items-start pt-2 w-full">
              {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
                <div key={row} className="flex gap-0.5 items-center w-full">
                  {cells.slice(row * 7, row * 7 + 7).map((d) => {
                    if (!inCurrentMonth(d)) {
                      return (
                        <div
                          key={d}
                          className="flex-1 aspect-square rounded-lg flex items-center justify-center text-[15px] text-gray-30"
                        >
                          {Number(d.slice(-2))}
                        </div>
                      );
                    }
                    const isStart = d === start;
                    const isEnd = d === end;
                    const active = isStart || isEnd;
                    const ranged = inRange(d) && !active;
                    return (
                      <button
                        key={d}
                        onClick={() => handlePick(d)}
                        className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-[15px] cursor-pointer ${
                          active ? 'bg-gray-90 text-gray-03 font-semibold' : ranged ? 'bg-gray-05 text-gray-95' : 'text-gray-95'
                        }`}
                      >
                        {Number(d.slice(-2))}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start px-4 w-full">
          <button
            onClick={confirm}
            disabled={!start || !end}
            className={`w-full h-[52px] rounded-full flex items-center justify-center text-[17px] font-semibold text-white cursor-pointer ${
              start && end ? 'bg-gray-100' : 'bg-gray-30 cursor-not-allowed'
            }`}
          >
            {start && end
              ? `${shortDateLabel(start)} ~ ${shortDateLabel(end)} 선택`
              : '날짜를 선택해주세요'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
