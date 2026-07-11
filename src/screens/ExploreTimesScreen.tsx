import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import WeekTabs from '../components/WeekTabs';
import Avatar from '../components/Avatar';
import { useAppStore } from '../store/useAppStore';
import { weekdaysInRange, groupByWeek, shortDateLabel, weekdayLabel, longDateLabel, formatHourRange } from '../lib/dates';
import { computeExploreWeekCells, densityLevel } from '../lib/suggest';
import type { ExploreCell } from '../lib/suggest';
import { MEMBERS } from '../data/seed';

const CELL = 40; // matches TimeGrid's one-hour row height exactly
const HEADER_H = 40;
const GAP = 4; // gap-1 — same value used both horizontally and vertically so the
// grid's gaps read as equal; cell height is CELL - GAP to keep row pitch at CELL.
const MAX_COL_WIDTH = 53; // matches TimeGrid's per-column cap
const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i); // 9..18, ten rows
const MAX_RANK = 5;

const DENSITY_BG: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'bg-[#F2F7EA]',
  2: 'bg-green-00',
  3: 'bg-green-10',
  4: 'bg-green-20',
  5: 'bg-green-30',
};

const DEAD_STYLE: CSSProperties = {
  backgroundColor: 'var(--color-gray-05)',
  backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 4px, var(--color-gray-20) 4px 5px)',
};

const STATUS_TAG: Record<'clear' | 'yield' | 'impossible', string> = {
  clear: 'bg-green-00 text-green-90',
  yield: 'bg-orange-03 text-orange-05',
  impossible: 'bg-red-03 text-red-05',
};

function cellKey(date: string, hour: number) {
  return `${date}|${hour}`;
}

export default function ExploreTimesScreen() {
  const gridStates = useAppStore((s) => s.gridStates);
  const requiredIds = useAppStore((s) => s.requiredIds);
  const meetingRange = useAppStore((s) => s.meetingRange);
  const setScreen = useAppStore((s) => s.setScreen);
  const openSheet = useAppStore((s) => s.openSheet);
  const selectSuggestedSlot = useAppStore((s) => s.selectSuggestedSlot);

  const weeks = useMemo(
    () => groupByWeek(weekdaysInRange(meetingRange.start, meetingRange.end)),
    [meetingRange]
  );
  const [activeWeek, setActiveWeek] = useState(0);
  const weekIdx = Math.min(activeWeek, Math.max(weeks.length - 1, 0));
  const columns = weeks[weekIdx] ?? [];

  const cells = useMemo(
    () => computeExploreWeekCells(gridStates, requiredIds, columns, HOURS, MAX_RANK),
    [gridStates, requiredIds, columns]
  );
  const cellMap = useMemo(() => new Map(cells.map((c) => [cellKey(c.date, c.hour), c])), [cells]);

  const [selected, setSelected] = useState<ExploreCell | null>(null);

  const yielders = selected?.slot ? MEMBERS.filter((m) => selected.slot!.statuses[m.id] === 'yield') : [];
  const impossible = selected?.slot ? MEMBERS.filter((m) => selected.slot!.statuses[m.id] === 'impossible') : [];
  const possible = selected?.slot ? MEMBERS.filter((m) => selected.slot!.statuses[m.id] === 'possible') : [];
  const statusKind: 'clear' | 'yield' | 'impossible' =
    impossible.length > 0 ? 'impossible' : yielders.length > 0 ? 'yield' : 'clear';
  const statusLabel =
    statusKind === 'clear' ? '전원 참석 가능' : statusKind === 'yield' ? `양보 ${yielders.length}명 필요` : `불가 ${impossible.length}명`;

  const handleConfirm = () => {
    if (!selected?.slot) return;
    selectSuggestedSlot(selected.slot);
    openSheet(yielders.length > 0 ? 'requestYield' : 'confirmTime');
  };

  return (
    <div className="relative flex flex-col h-full bg-gray-03" onClick={() => setSelected(null)}>
      <StatusBar />
      <Header title="다른 시간 탐색" onBack={() => setScreen('suggestTime')} />

      <div className="px-5 pb-3 w-full shrink-0 text-[13px] text-gray-60 leading-[1.5]">
        참석 가능 인원이 많을수록 진하게 표시돼요
      </div>

      {weeks.length > 1 && (
        <div className="px-4 pb-3 w-full shrink-0">
          <WeekTabs weeks={weeks} activeIndex={weekIdx} onChange={setActiveWeek} />
        </div>
      )}

      <div className="flex items-center gap-3 px-5 pb-2 w-full shrink-0 text-[12px] text-gray-60">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2.5 w-9 rounded-full overflow-hidden shrink-0">
            <span className="flex-1 bg-[#F2F7EA]" />
            <span className="flex-1 bg-green-00" />
            <span className="flex-1 bg-green-10" />
            <span className="flex-1 bg-green-20" />
            <span className="flex-1 bg-green-30" />
          </span>
          참석 가능 인원
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] shrink-0" style={DEAD_STYLE} />
          필수 인원 불가
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] shrink-0 outline outline-1 outline-offset-[-1px] outline-gray-80" />
          추천
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="w-full px-4 py-3 relative">
          <div className="bg-gray-00 rounded-[24px] shadow-[0_-2px_24px_rgba(0,0,0,0.04)] overflow-hidden py-4">
            <div className="flex relative">
              <div
                className="relative pl-[13px] pr-1 shrink-0 bg-gray-00"
                style={{ width: 44, height: HEADER_H + HOURS.length * CELL }}
              >
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="absolute right-1 text-right text-[12px] text-gray-60 font-medium"
                    style={{ top: HEADER_H + i * CELL, transform: 'translateY(-50%)' }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div className="relative flex-1 min-w-0">
                <div className="flex gap-1" style={{ height: 16 }}>
                  {columns.map((d) => (
                    <div
                      key={d}
                      className="flex-1 min-w-0 text-center text-[12px] text-gray-60"
                      style={{ maxWidth: MAX_COL_WIDTH }}
                    >
                      {weekdayLabel(d)}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1" style={{ height: 24 }}>
                  {columns.map((d) => (
                    <div
                      key={d}
                      className="flex-1 min-w-0 text-center text-[13px] font-medium text-gray-90"
                      style={{ maxWidth: MAX_COL_WIDTH }}
                    >
                      {shortDateLabel(d)}
                    </div>
                  ))}
                </div>

                <div className="flex gap-1">
                  {columns.map((date) => (
                    <div
                      key={date}
                      className="flex-1 min-w-0 flex flex-col gap-1"
                      style={{ maxWidth: MAX_COL_WIDTH }}
                    >
                      {HOURS.map((h) => {
                        const cell = cellMap.get(cellKey(date, h));
                        if (!cell) return <div key={h} style={{ height: CELL - GAP }} />;
                        const isSelected = !!selected && selected.date === date && selected.hour === h;
                        if (cell.dead) {
                          return (
                            <button
                              key={h}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(cell);
                              }}
                              style={{ height: CELL - GAP, ...DEAD_STYLE }}
                              className={`w-full rounded-[2px] cursor-pointer ${
                                isSelected ? 'ring-2 ring-inset ring-gray-60' : ''
                              }`}
                              aria-label="필수 인원 불가"
                            />
                          );
                        }
                        const level = densityLevel(cell.possibleCount ?? 0, MEMBERS.length);
                        return (
                          <button
                            key={h}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(cell);
                            }}
                            style={{ height: CELL - GAP }}
                            className={`w-full rounded-[2px] cursor-pointer ${DENSITY_BG[level]} ${
                              cell.rank ? 'outline outline-1 outline-offset-[-1px] outline-gray-80' : ''
                            } ${isSelected ? 'ring-2 ring-inset ring-gray-60' : ''}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="shrink-0 rounded-t-[24px] bg-gray-00 px-5 pt-4 pb-6 shadow-[0_-6px_24px_0_rgba(0,0,0,0.10)]"
        onClick={(e) => e.stopPropagation()}
      >
        {!selected ? (
          <div className="text-[13px] text-gray-60 text-center py-6">
            시간을 탭하면 참석 현황을 볼 수 있어요
          </div>
        ) : selected.dead ? (
          <>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="text-[19px] font-bold text-gray-95 leading-[1.35]">
                {longDateLabel(selected.date)}
                <br />
                {formatHourRange(selected.hour, selected.hour + 1)}
              </div>
              <span className="bg-gray-05 text-gray-60 rounded-md px-2 py-1 text-[12px] font-semibold shrink-0">
                확정 불가
              </span>
            </div>
            <div className="bg-gray-20 rounded-lg px-4 py-3 mb-4">
              <p className="text-[13px] text-gray-95 leading-[1.5]">
                <b>{selected.deadByName}</b>(필수)님이 참석할 수 없는 시간이에요.
                <br />이 시간은 추천에서 제외했어요.
              </p>
            </div>
            <button disabled className="w-full h-[52px] rounded-full flex items-center justify-center text-[17px] font-semibold bg-gray-30 text-gray-00 cursor-not-allowed">
              이 시간으로 확정하기
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="text-[19px] font-bold text-gray-95 leading-[1.35]">
                {longDateLabel(selected.date)}
                <br />
                {formatHourRange(selected.hour, selected.hour + 1)}
              </div>
              <span className={`rounded-md px-2 py-1 text-[12px] font-semibold shrink-0 ${STATUS_TAG[statusKind]}`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex gap-2 w-full mb-4">
              {(
                [
                  ['참석 가능', possible],
                  ['양보 가능', yielders],
                  ['참석 불가능', impossible],
                ] as const
              ).map(([label, list]) => {
                const empty = list.length === 0;
                return (
                  <div
                    key={label}
                    className={`flex-1 min-w-0 border border-gray-10 rounded-xl p-2.5 flex flex-col gap-2 ${
                      empty ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="text-[12px] text-gray-60 whitespace-nowrap">
                      {label} <span className="font-semibold">{list.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 min-h-[24px]">
                      {list.map((m) => (
                        <Avatar key={m.id} id={m.id} size={24} required={requiredIds.has(m.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleConfirm}
              className="w-full h-[52px] rounded-full flex items-center justify-center text-[17px] font-semibold bg-gray-100 text-gray-00 cursor-pointer"
            >
              이 시간으로 확정하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
