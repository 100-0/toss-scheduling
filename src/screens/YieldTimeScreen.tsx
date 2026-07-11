import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import ButtonDock from '../components/ButtonDock';
import CompactExcludedView from '../components/CompactExcludedView';
import { useAppStore } from '../store/useAppStore';
import { weekdaysInRange } from '../lib/dates';
import { HOST_ID } from '../data/seed';

export default function YieldTimeScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const meetingRange = useAppStore((s) => s.meetingRange);
  const gridState = useAppStore((s) => s.gridStates[currentUser]);
  const setScreen = useAppStore((s) => s.setScreen);
  const setYieldReceivedFlag = useAppStore((s) => s.setYieldRequestSent);

  const columns = weekdaysInRange(meetingRange.start, meetingRange.end);
  const isHost = currentUser === HOST_ID;

  const handleNext = () => {
    if (isHost) {
      setScreen('suggestTime');
    } else {
      // guest submits and flow ends here
      setYieldReceivedFlag(true);
      setScreen('guestDone');
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-gray-05 to-[#e6e7ea]">
      <StatusBar />
      <div className="flex flex-col items-start w-full shrink-0">
        <Header title="" onBack={() => setScreen('avoidTime')} />
        <div className="flex flex-col items-start overflow-clip pb-5 px-5 w-full">
          <div className="flex gap-1 items-center w-full">
            <div className="flex-1 h-1 rounded-full bg-gray-40/30" />
            <div className="flex-1 h-1 rounded-full bg-gray-70" />
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start px-5 w-full">
          <div className="text-[24px] font-bold text-gray-95 leading-[1.35]">양보할 수 있는 시간이 있나요?</div>
          <div className="text-[15px] text-gray-70 leading-[1.55] w-[290px]">
            선택하지 않고 넘어가도 괜찮아요. 양보할 수 있는 시간을 표시해주시면, 추천 일정의 합의 가능성이 더 정확해져요.
          </div>
        </div>
        <div className="flex flex-col items-start pb-1 pt-4 px-4 w-full">
          <div className="bg-gray-20 rounded-lg px-4 py-3 shadow-[0_-2px_24px_rgba(0,0,0,0.04)] w-full">
            <p className="text-[13px] text-gray-95 leading-[1.5]">
              앞에서 참석이 어렵다고 표시한 시간은 여기서 제외했어요.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-[120px]">
        <CompactExcludedView columns={columns} gridState={gridState} />
      </div>
      <ButtonDock label={isHost ? '추천 시간 보기' : '일정 요청 보내기'} onClick={handleNext} />
    </div>
  );
}
