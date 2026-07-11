import StatusBar from '../components/StatusBar';
import { MEMBER_MAP } from '../data/seed';
import { useAppStore } from '../store/useAppStore';

export default function GuestDoneScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const name = MEMBER_MAP[currentUser].name;

  return (
    <div className="flex flex-col h-full items-center justify-center gap-4 bg-gray-03 px-8 text-center">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="bg-green-00 rounded-full size-12 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12L10 17L19 7" stroke="#3E522A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-[19px] font-bold text-gray-90">제출이 완료됐어요</div>
        <div className="text-[14px] text-gray-60 leading-[1.6]">{name}님이 입력한 시간이 주최자에게 전달됐어요.</div>
      </div>
    </div>
  );
}
