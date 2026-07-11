import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DateStr, MemberGridState } from '../types';
import { HOUR_START, HOUR_END, shortDateLabel, weekdayLabel } from '../lib/dates';
import { cellKey, hourToSlot, slotToHour } from '../lib/grid';
import { useAppStore } from '../store/useAppStore';

const SQUARE = 40;
const HALF = SQUARE / 2;

interface Block {
  date: DateStr;
  startHour: number;
  hours: number[];
  startSlot: number;
  endSlot: number; // exclusive
}

function groupBlocks(gridState: MemberGridState, date: DateStr): Block[] {
  const hours: number[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    const k1 = cellKey(date, hourToSlot(h));
    const k2 = cellKey(date, hourToSlot(h + 0.5));
    if (gridState.excluded.has(k1) || gridState.excluded.has(k2)) hours.push(h);
  }
  const blocks: Block[] = [];
  for (const h of hours) {
    const last = blocks[blocks.length - 1];
    if (last && last.hours[last.hours.length - 1] === h - 1) {
      last.hours.push(h);
      last.endSlot = hourToSlot(h + 1);
    } else {
      blocks.push({ date, startHour: h, hours: [h], startSlot: hourToSlot(h), endSlot: hourToSlot(h + 1) });
    }
  }
  return blocks;
}

function slotFill(gridState: MemberGridState, key: string): string {
  if (!gridState.excluded.has(key)) return 'bg-gray-10';
  return gridState.flexible.has(key) ? 'bg-green-point' : 'bg-gray-80';
}

function fmtSlot(slot: number) {
  const h = slotToHour(slot);
  const hh = Math.floor(h);
  const mm = h % 1 === 0.5 ? '30' : '00';
  return `${hh}:${mm}`;
}

export default function CompactExcludedView({
  columns,
  gridState,
}: {
  columns: DateStr[];
  gridState: MemberGridState;
}) {
  const commitRect = useAppStore((s) => s.commitRect);
  const removeBlock = useAppStore((s) => s.removeBlock);
  const toggleHourCell = useAppStore((s) => s.toggleHourCell);
  const rootRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{
    date: DateStr;
    blockTop: number; // block's top offset relative to viewport, in px, captured at pointerdown
    minSlot: number;
    maxSlot: number; // inclusive bound (block.endSlot - 1)
    startSlot: number;
    curSlot: number;
    moved: boolean;
    pointerX: number;
    pointerY: number;
  } | null>(null);

  const dateColumns = columns.filter((d) => !gridState.dayoff.has(d) && groupBlocks(gridState, d).length > 0);

  const pointerRelativeToRoot = (clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) return { x: clientX, y: clientY };
    const rect = root.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const slotAt = (clientY: number, blockTopClientY: number, minSlot: number, maxSlot: number) => {
    const offset = Math.floor((clientY - blockTopClientY) / HALF);
    return Math.min(maxSlot, Math.max(minSlot, minSlot + offset));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>, block: Block, slot: number) => {
    const blockEl = e.currentTarget.closest('[data-block]') as HTMLElement | null;
    if (!blockEl) return;
    const blockTopClientY = blockEl.getBoundingClientRect().top;
    const p = pointerRelativeToRoot(e.clientX, e.clientY);
    setDrag({
      date: block.date,
      blockTop: blockTopClientY,
      minSlot: block.startSlot,
      maxSlot: block.endSlot - 1,
      startSlot: slot,
      curSlot: slot,
      moved: false,
      pointerX: p.x,
      pointerY: p.y,
    });
    // No setPointerCapture — it would suppress native vertical scroll of the
    // screen while a finger is down on a block square.
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const slot = slotAt(e.clientY, drag.blockTop, drag.minSlot, drag.maxSlot);
    const moved = slot !== drag.startSlot;
    const p = pointerRelativeToRoot(e.clientX, e.clientY);
    setDrag({ ...drag, curSlot: slot, moved, pointerX: p.x, pointerY: p.y });
  };

  const allFlexibleInRange = (date: DateStr, loSlot: number, hiSlotExclusive: number) => {
    for (let s = loSlot; s < hiSlotExclusive; s++) {
      const key = cellKey(date, s);
      if (gridState.excluded.has(key) && !gridState.flexible.has(key)) return false;
    }
    return true;
  };

  const handlePointerUp = () => {
    if (!drag) return;
    const colIdx = columns.indexOf(drag.date);
    let loSlot: number;
    let hiSlotExclusive: number;
    if (!drag.moved) {
      // tap: whole hour containing the tapped slot
      const hour = HOUR_START + Math.floor(drag.startSlot / 2);
      loSlot = hourToSlot(hour);
      hiSlotExclusive = hourToSlot(hour + 1);
    } else {
      loSlot = Math.min(drag.startSlot, drag.curSlot);
      hiSlotExclusive = Math.max(drag.startSlot, drag.curSlot) + 1;
    }

    if (allFlexibleInRange(drag.date, loSlot, hiSlotExclusive)) {
      // everything in range is already marked yieldable — toggle back off
      removeBlock('flexible', drag.date, slotToHour(loSlot), slotToHour(hiSlotExclusive));
    } else if (!drag.moved) {
      toggleHourCell('flexible', drag.date, HOUR_START + Math.floor(drag.startSlot / 2));
    } else {
      commitRect('flexible', { dateStart: colIdx, dateEnd: colIdx, slotStart: loSlot, slotEnd: hiSlotExclusive }, columns);
    }
    setDrag(null);
  };

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  const tooltipText = drag && drag.moved
    ? `${fmtSlot(Math.min(drag.startSlot, drag.curSlot))}-${fmtSlot(Math.max(drag.startSlot, drag.curSlot) + 1)}`
    : null;

  if (dateColumns.length === 0) {
    return (
      <div className="w-full px-4 py-8 text-center text-[14px] text-gray-50">
        표시할 제외된 시간이 없어요.
      </div>
    );
  }

  return (
    <div ref={rootRef} className="w-full px-4 py-2 relative">
      <div className="bg-gray-00 rounded-[24px] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] px-3 py-4 flex flex-wrap items-start gap-x-2 gap-y-4">
        {dateColumns.map((date) => {
          const blocks = groupBlocks(gridState, date);
          return (
            <div key={date} className="flex flex-col gap-0.5 items-start justify-start">
              <div className="flex flex-col items-center pl-4 w-full whitespace-nowrap">
                <div className="text-[12px] text-gray-60">{weekdayLabel(date)}</div>
                <div className="text-[13px] font-semibold text-gray-90">{shortDateLabel(date)}</div>
              </div>
              <div className="flex flex-col gap-1.5 items-start">
                {blocks.map((block) => {
                  const isDraggingThisBlock = drag && drag.date === date && drag.minSlot === block.startSlot;
                  const dragLo = isDraggingThisBlock ? Math.min(drag!.startSlot, drag!.curSlot) : null;
                  const dragHi = isDraggingThisBlock ? Math.max(drag!.startSlot, drag!.curSlot) : null;
                  return (
                    <div key={block.startHour} className="flex gap-1 items-center">
                      {/* Boundary labels — one at the top of the first square and one at
                          the bottom of every square after it, so a block always shows both
                          its start and end time (e.g. a single-hour block shows 9 AND 10). */}
                      <div className="relative w-5" style={{ height: block.hours.length * SQUARE }}>
                        {block.hours.concat(block.startHour + block.hours.length).map((h, i) => (
                          <div
                            key={h}
                            className="absolute right-0 text-[12px] text-gray-40 font-medium text-right"
                            style={{ top: i * SQUARE, transform: 'translateY(-50%)' }}
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                      <div
                        data-block
                        // touch-none: see TimeGrid.tsx — without it, a
                        // vertical drag here scrolls the page on real touch
                        // devices instead of extending the yield selection.
                        className="flex flex-col items-start justify-center py-[9px] relative touch-none"
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                      >
                        {isDraggingThisBlock && dragLo !== null && dragHi !== null && (
                          <div
                            className="absolute bg-green-point/60 rounded-[2px] pointer-events-none z-10 left-0"
                            style={{
                              top: (dragLo - block.startSlot) * HALF,
                              height: (dragHi - dragLo + 1) * HALF,
                              width: SQUARE,
                            }}
                          />
                        )}
                        {block.hours.map((h) => {
                          const key1 = cellKey(date, hourToSlot(h));
                          const key2 = cellKey(date, hourToSlot(h + 0.5));
                          return (
                            <div key={h} className="flex flex-col overflow-hidden rounded-[2px]" style={{ width: SQUARE, height: SQUARE }}>
                              <div
                                className={`flex-1 cursor-pointer select-none ${slotFill(gridState, key1)}`}
                                onPointerDown={(e) => handlePointerDown(e, block, hourToSlot(h))}
                              />
                              <div
                                className={`flex-1 cursor-pointer select-none ${slotFill(gridState, key2)}`}
                                onPointerDown={(e) => handlePointerDown(e, block, hourToSlot(h + 0.5))}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {tooltipText && drag && (
        <div
          className="absolute z-10 flex flex-col items-center pointer-events-none"
          style={{ left: drag.pointerX, top: drag.pointerY - 56, transform: 'translateX(-50%)' }}
        >
          <div className="bg-green-00 rounded-lg px-3 py-1.5">
            <p className="text-[13px] font-medium text-gray-95 whitespace-nowrap">{tooltipText}</p>
          </div>
          <div className="w-0 h-0 border-x-[8px] border-x-transparent border-t-[8px] border-t-green-00" />
        </div>
      )}
    </div>
  );
}
