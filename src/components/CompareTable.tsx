import type { SuggestedSlot } from '../types';
import { MEMBERS } from '../data/seed';
import { shortDateLabel, weekdayLabel, formatHourRange } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';

const STATUS_LABEL = { possible: '가능', yield: '양보', impossible: '불가능' } as const;
const STATUS_STYLE = {
  possible: 'bg-green-00 text-green-90',
  yield: 'bg-orange-03 text-orange-05',
  impossible: 'bg-red-03 text-red-05',
} as const;

export default function CompareTable({ options }: { options: SuggestedSlot[] }) {
  const requiredIds = useAppStore((s) => s.requiredIds);
  return (
    <div className="border border-gray-05 rounded-xl overflow-hidden w-full">
      <div className="bg-gray-03 flex gap-1 items-start px-2.5 py-[7px]">
        <div className="w-16 shrink-0" />
        {options.map((opt) => (
          <div key={`${opt.date}-${opt.startHour}`} className="flex-1 flex flex-col items-center text-[12px] text-center">
            <span className="text-gray-60">{shortDateLabel(opt.date)} {weekdayLabel(opt.date)}</span>
            <span className="font-medium text-gray-90">{formatHourRange(opt.startHour, opt.endHour).replace(/^오전 |^오후 /, '')}</span>
          </div>
        ))}
      </div>
      {MEMBERS.map((m) => (
        <div key={m.id} className="border-t border-gray-05 flex gap-1 items-center px-2 py-[5px]">
          <div className="w-16 shrink-0 flex items-center gap-1 text-[12px]">
            <span className="font-medium text-gray-90">{m.name}</span>
            {requiredIds.has(m.id) && <span className="text-green-30">필수</span>}
          </div>
          {options.map((opt) => {
            const status = opt.statuses[m.id];
            return (
              <div
                key={`${opt.date}-${opt.startHour}-${m.id}`}
                className={`flex-1 h-7 rounded-[5px] flex items-center justify-center text-[10px] font-semibold ${STATUS_STYLE[status]}`}
              >
                {STATUS_LABEL[status]}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
