import type { DateStr } from '../types';
import { weekOfLabel } from '../lib/dates';

interface WeekTabsProps {
  weeks: DateStr[][];
  activeIndex: number;
  onChange: (index: number) => void;
  containerClassName?: string;
}

export default function WeekTabs({ weeks, activeIndex, onChange, containerClassName = 'bg-gray-05' }: WeekTabsProps) {
  return (
    <div className={`flex gap-2 items-center p-1 rounded-xl w-full ${containerClassName}`}>
      {weeks.map((week, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={week[0]}
            onClick={() => onChange(i)}
            className={`flex-1 min-w-0 flex items-center justify-center px-3 py-1.5 rounded-lg text-[15px] whitespace-nowrap cursor-pointer ${
              active
                ? 'bg-gray-90 text-gray-00 font-semibold shadow-[0_2px_2px_rgba(0,0,0,0.12)]'
                : 'text-gray-60 font-normal'
            }`}
          >
            {weekOfLabel(week[0])}
          </button>
        );
      })}
    </div>
  );
}
