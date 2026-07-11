import { useAppStore } from '../store/useAppStore';
import { MEMBER_MAP } from '../data/seed';
import Avatar from './Avatar';

const SWITCHABLE = ['gayoung', 'jieun', 'youngju'] as const;

export default function DemoControls() {
  const currentUser = useAppStore((s) => s.currentUser);
  const switchUser = useAppStore((s) => s.switchUser);
  const resetAll = useAppStore((s) => s.resetAll);

  return (
    <div className="flex flex-col gap-3 items-start w-[220px] shrink-0">
      <div className="text-[13px] font-semibold text-gray-50 uppercase tracking-wide">유저 컨트롤</div>
      <div className="flex flex-col gap-2 w-full">
        {SWITCHABLE.map((id) => {
          const m = MEMBER_MAP[id];
          const active = currentUser === id;
          return (
            <button
              key={id}
              onClick={() => switchUser(id)}
              className={`flex items-center gap-2 w-full rounded-xl px-3 py-2.5 border cursor-pointer transition-colors ${
                active ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-20 text-gray-90'
              }`}
              style={active ? { backgroundColor: '#161616', borderColor: '#161616' } : undefined}
            >
              <Avatar id={id} size={24} />
              <span className="text-[14px] font-medium">{m.name}로 전환</span>
              {active && <span className="ml-auto text-[11px] opacity-70">보는 중</span>}
            </button>
          );
        })}
      </div>
      <button
        onClick={resetAll}
        className="flex items-center gap-1.5 w-full rounded-xl px-3 py-2.5 border border-gray-20 text-gray-60 text-[14px] font-medium cursor-pointer hover:bg-gray-05"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M12 7A5 5 0 1 1 10.5 3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path d="M12 2V5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        초기화
      </button>
    </div>
  );
}
