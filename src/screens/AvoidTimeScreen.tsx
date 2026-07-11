import { useEffect, useState } from 'react';
import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import ButtonDock from '../components/ButtonDock';
import TimeGrid from '../components/TimeGrid';
import WeekTabs from '../components/WeekTabs';
import { useAppStore } from '../store/useAppStore';
import { weekdaysInRange, groupByWeek } from '../lib/dates';
import { MEMBER_MAP, HOST_ID } from '../data/seed';

export default function AvoidTimeScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const meetingRange = useAppStore((s) => s.meetingRange);
  const gridState = useAppStore((s) => s.gridStates[currentUser]);
  const setScreen = useAppStore((s) => s.setScreen);
  const openSheet = useAppStore((s) => s.openSheet);

  const weeks = groupByWeek(weekdaysInRange(meetingRange.start, meetingRange.end));
  const [activeWeek, setActiveWeek] = useState(0);
  const columns = weeks[Math.min(activeWeek, weeks.length - 1)] ?? [];
  const isHost = currentUser === HOST_ID;
  const name = MEMBER_MAP[currentUser].name;

  useEffect(() => {
    openSheet('quickExclude');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-gray-05 to-[#e6e7ea]">
      <StatusBar />
      <div className="flex flex-col items-start w-full shrink-0">
        <Header title="" onBack={isHost ? () => setScreen('home') : undefined} />
        <div className="flex flex-col items-start overflow-clip pb-5 px-4 w-full">
          <div className="flex gap-1 items-center w-full">
            <div className="flex-1 h-1 rounded-full bg-gray-70" />
            <div className="flex-1 h-1 rounded-full bg-gray-40/30" />
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start px-5 w-full">
          <div className="text-[24px] font-bold text-gray-95 leading-[1.35]">참석이 어려운 시간이 있나요?</div>
          <div className="text-[15px] text-gray-70 leading-[1.55] w-full">
            {name}님의 캘린더에서 일정을 불러와 미리 입력해두었어요. 터치하거나 드래그해서 시간을 제외해주세요.
          </div>
        </div>
      </div>
      {weeks.length > 1 && (
        <div className="px-4 pt-4 pb-3 w-full shrink-0">
          <WeekTabs
            weeks={weeks}
            activeIndex={Math.min(activeWeek, weeks.length - 1)}
            onChange={setActiveWeek}
            containerClassName="bg-gray-03"
          />
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-[120px]">
        <TimeGrid columns={columns} gridState={gridState} mode="exclude" />
      </div>
      <ButtonDock
        label={isHost ? '다음' : '다음'}
        onClick={() => setScreen('yieldTime')}
      />
    </div>
  );
}
