import { useState } from 'react';
import BottomSheet, { Grabber, SheetHeader } from './BottomSheet';
import { QUICK_EXCLUDE_PRESETS, useAppStore } from '../store/useAppStore';

export default function QuickExcludeModal() {
  const closeSheet = useAppStore((s) => s.closeSheet);
  const applyQuickExclude = useAppStore((s) => s.applyQuickExclude);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirm = () => {
    applyQuickExclude(Array.from(selected));
    closeSheet();
  };

  return (
    <BottomSheet onDismiss={closeSheet}>
      <div className="bg-gray-00 rounded-t-[24px] flex flex-col gap-2 items-center pb-9 px-2 w-full">
        <Grabber />
        <SheetHeader title="빠르게 제외하기" onClose={closeSheet} />
        <div className="flex flex-col gap-1 items-start pb-3 px-2 w-full">
          <div className="text-[13px] text-gray-70 px-1">
            <p>대부분의 사람들이 꺼리는 시간이에요.</p>
            <p>아래 버튼을 눌러서 빠르게 제외할 수 있어요</p>
          </div>
          <div className="flex flex-wrap gap-2 items-start py-4 w-full">
            {QUICK_EXCLUDE_PRESETS.map((p) => {
              const active = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`border border-gray-20 rounded-full px-3 py-1 text-[13px] font-medium cursor-pointer transition-colors ${
                    active ? 'bg-gray-20 text-gray-95' : 'text-gray-95'
                  }`}
                >
                  {p.label}
                  {p.displayHasTime && <span className="text-gray-50"> ({p.timeLabel})</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2 items-start px-2 w-full">
          <button
            onClick={() => setSelected(new Set())}
            className="h-[52px] px-4 flex items-center justify-center rounded-full text-[17px] font-medium text-gray-60 cursor-pointer"
          >
            전체 취소
          </button>
          <button
            onClick={confirm}
            className="bg-gray-100 flex-1 h-[52px] flex items-center justify-center rounded-full text-[17px] font-semibold text-gray-00 cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
