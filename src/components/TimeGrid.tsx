import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DateStr, MemberGridState } from '../types';
import { HOUR_START, HOUR_END, shortDateLabel, weekdayLabel } from '../lib/dates';
import { cellKey, hourToSlot, type Rect } from '../lib/grid';
import { useAppStore } from '../store/useAppStore';

const CELL = 40; // one full-hour row height
const HEADER_H = 40; // weekday row + date row, pinned to exactly one CELL unit
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const SLOTS = (HOUR_END - HOUR_START) * 2;
const COL_GAP = 4; // gap-1 (4px) — used both between day columns AND between
// hour capsules within a column, so the horizontal and vertical gaps read as
// the same size. Capsule height is CELL - COL_GAP so height+gap still sums
// to one full CELL of vertical pitch, keeping the hour labels aligned.
const MAX_COL_WIDTH = 53; // each day column stretches to fill the card, capped at this width

interface TimeGridProps {
  columns: DateStr[];
  gridState: MemberGridState;
  mode: 'exclude' | 'flexible';
}

// Coordinates are measured against the grid-cells element itself (not the
// scrollable wrapper), so the weekday/date label rows above the cells never
// need to be manually subtracted. Column width mirrors the CSS: columns
// stretch evenly to fill the card but are capped at MAX_COL_WIDTH (see the
// `max-w-[53px]` on each day column below), so hit-testing has to reproduce
// that same clamp instead of naively dividing the rendered width by the
// column count.
function colHourFromPoint(
  gridBody: HTMLDivElement,
  clientX: number,
  clientY: number,
  columnCount: number
): { col: number; slot: number; colWidth: number; pitch: number } {
  const rect = gridBody.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const evenWidth = (rect.width - COL_GAP * (columnCount - 1)) / columnCount;
  const colWidth = Math.min(evenWidth, MAX_COL_WIDTH);
  const pitch = colWidth + COL_GAP;
  const col = Math.floor(x / pitch);
  const slot = Math.floor(y / (CELL / 2));
  return {
    col: Math.max(0, Math.min(columnCount - 1, col)),
    slot: Math.max(0, Math.min(SLOTS - 1, slot)),
    colWidth,
    pitch,
  };
}

// exclude mode: gray80 = excluded, gray10 = default.
// flexible mode: green = excluded+marked yieldable, gray80 = excluded but not
// yet marked (carried over from screen 3), gray10 = never excluded (inert —
// flexible mode can't mark cells that weren't already excluded).
function halfSlotFill(mode: 'exclude' | 'flexible', gridState: MemberGridState, key: string): string {
  const excluded = gridState.excluded.has(key);
  if (mode === 'exclude') return excluded ? 'bg-gray-80' : 'bg-gray-10';
  if (!excluded) return 'bg-gray-10';
  return gridState.flexible.has(key) ? 'bg-green-point' : 'bg-gray-80';
}

export default function TimeGrid({ columns, gridState, mode }: TimeGridProps) {
  const commitRect = useAppStore((s) => s.commitRect);
  const toggleHourCell = useAppStore((s) => s.toggleHourCell);
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{
    startCol: number;
    startSlot: number;
    curCol: number;
    curSlot: number;
    moved: boolean;
    pointerX: number;
    pointerY: number;
    colWidth: number;
    pitch: number;
  } | null>(null);

  // Tooltip position relative to the TimeGrid's own root (not the viewport),
  // since fixed-position descendants inside the phone frame are now scoped to
  // it (see MobileFrame's `will-change: transform`) rather than to the window.
  const pointerRelativeToRoot = (clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) return { x: clientX, y: clientY };
    const rect = root.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>, colIdx: number) => {
    const date = columns[colIdx];
    if (gridState.dayoff.has(date)) return;
    const gridBody = gridBodyRef.current;
    if (!gridBody) return;
    const { slot, colWidth, pitch } = colHourFromPoint(gridBody, e.clientX, e.clientY, columns.length);
    const p = pointerRelativeToRoot(e.clientX, e.clientY);
    setDrag({
      startCol: colIdx,
      startSlot: slot,
      curCol: colIdx,
      curSlot: slot + 1,
      moved: false,
      pointerX: p.x,
      pointerY: p.y,
      colWidth,
      pitch,
    });
    // No setPointerCapture here on purpose — capturing the pointer suppresses
    // the browser's native touch scrolling, which would make it impossible to
    // scroll the page vertically while a finger is down on the grid.
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const gridBody = gridBodyRef.current;
    if (!gridBody) return;
    const { col, slot, colWidth, pitch } = colHourFromPoint(gridBody, e.clientX, e.clientY, columns.length);
    const moved = col !== drag.startCol || Math.abs(slot - drag.startSlot) >= 1;
    const p = pointerRelativeToRoot(e.clientX, e.clientY);
    setDrag({ ...drag, curCol: col, curSlot: slot + 1, moved, pointerX: p.x, pointerY: p.y, colWidth, pitch });
  };

  const handlePointerUp = () => {
    if (!drag) return;
    if (!drag.moved) {
      // tap: toggle whole hour at start cell
      const hour = HOUR_START + Math.floor(drag.startSlot / 2);
      toggleHourCell(mode, columns[drag.startCol], hour);
    } else {
      const rect: Rect = {
        dateStart: drag.startCol,
        dateEnd: drag.curCol,
        slotStart: drag.startSlot,
        slotEnd: drag.curSlot,
      };
      commitRect(mode, rect, columns);
    }
    setDrag(null);
  };

  // Without pointer capture, a release outside the grid's own bounds
  // wouldn't fire our onPointerUp. This window-level fallback guarantees the
  // in-progress drag always gets committed/cleared even then.
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

  const tooltipText = (() => {
    if (!drag || !drag.moved) return null;
    const c0 = Math.min(drag.startCol, drag.curCol);
    const c1 = Math.max(drag.startCol, drag.curCol);
    const s0 = Math.min(drag.startSlot, drag.curSlot);
    const s1 = Math.max(drag.startSlot, drag.curSlot);
    const startH = HOUR_START + s0 * 0.5;
    const endH = HOUR_START + s1 * 0.5;
    const fmt = (h: number) => {
      const hh = Math.floor(h);
      const mm = h % 1 === 0.5 ? '30' : '00';
      return `${hh}:${mm}`;
    };
    if (c0 === c1) return `${fmt(startH)}-${fmt(endH)}`;
    return `${weekdayLabel(columns[c0])}~${weekdayLabel(columns[c1])} ${fmt(startH)}-${fmt(endH)}`;
  })();

  // left/width are derived from the same colWidth/pitch captured at drag
  // start, so the overlay lines up with the (possibly max-width-clamped)
  // rendered columns instead of naively splitting the row into equal shares.
  const previewRect = drag && {
    left: Math.min(drag.startCol, drag.curCol) * drag.pitch,
    top: Math.min(drag.startSlot, drag.curSlot) * (CELL / 2),
    width: (Math.abs(drag.curCol - drag.startCol) + 1) * drag.colWidth + Math.abs(drag.curCol - drag.startCol) * COL_GAP,
    height: Math.max(Math.abs(drag.curSlot - drag.startSlot), 1) * (CELL / 2),
  };
  const previewColorClass = mode === 'flexible' ? 'bg-green-point/60' : 'bg-gray-80/60';

  return (
    <div ref={rootRef} className="w-full px-4 relative">
      <div className="bg-gray-00 rounded-[24px] shadow-[0_-2px_24px_rgba(0,0,0,0.04)] overflow-hidden py-4">
        <div className="flex relative select-none" style={{ userSelect: 'none' }}>
          {/* hour label column — each label is absolutely positioned at the
              exact same boundary y-offset (HEADER_H + i*CELL) used by the
              cell grid below, so it can never drift out of sync with it. */}
          <div
            className="relative pl-[13px] pr-1 shrink-0 bg-gray-00 z-10"
            style={{ width: 44, height: HEADER_H + SLOTS * (CELL / 2) }}
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

          <div
            className="relative flex-1 min-w-0"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* weekday header row */}
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
            {/* date number row */}
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

            {/* columns body */}
            <div className="flex gap-1 relative" ref={gridBodyRef}>
              {previewRect && (
                <div
                  className={`absolute rounded-[2px] pointer-events-none z-10 ${previewColorClass}`}
                  style={previewRect}
                />
              )}
              {columns.map((date, colIdx) => {
                const isDayoff = gridState.dayoff.has(date);
                return (
                  <div
                    key={date}
                    className="flex-1 min-w-0 flex flex-col gap-1 cursor-pointer"
                    style={{ maxWidth: MAX_COL_WIDTH }}
                    onPointerDown={(e) => handlePointerDown(e, colIdx)}
                  >
                    {isDayoff ? (
                      <div
                        className="bg-gray-40 rounded-[2px] flex items-start justify-center pt-5 w-full relative"
                        style={{ height: (CELL / 2) * SLOTS }}
                      >
                        <span className="text-[13px] font-semibold text-gray-03 whitespace-nowrap">
                          {gridState.dayoff.get(date)}
                        </span>
                      </div>
                    ) : (
                      HOURS.slice(0, -1).map((h) => {
                        const key1 = cellKey(date, hourToSlot(h));
                        const key2 = cellKey(date, hourToSlot(h + 0.5));
                        return (
                          <div key={h} className="flex flex-col overflow-hidden rounded-[2px] w-full" style={{ height: CELL - COL_GAP }}>
                            <div className={`flex-1 ${halfSlotFill(mode, gridState, key1)}`} />
                            <div className={`flex-1 ${halfSlotFill(mode, gridState, key2)}`} />
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
