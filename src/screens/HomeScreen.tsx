import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import ButtonDock from '../components/ButtonDock';
import Avatar from '../components/Avatar';
import { MEMBERS, MEETING_TITLE, MEETING_DURATION_HOURS, HOST_ID } from '../data/seed';
import { longDateLabel } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';

export default function HomeScreen() {
  const meetingRange = useAppStore((s) => s.meetingRange);
  const openSheet = useAppStore((s) => s.openSheet);
  const setScreen = useAppStore((s) => s.setScreen);
  const requiredIds = useAppStore((s) => s.requiredIds);
  const toggleRequired = useAppStore((s) => s.toggleRequired);

  const rangeChosen = meetingRange.start !== '' ;

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-white to-gray-05">
      <StatusBar />
      <Header title="새 회의 만들기" showBackPlaceholder />
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-[140px]">
        <div className="flex flex-col gap-3 items-start px-5 py-3.5 rounded-2xl w-full">
          <div className="flex flex-col gap-1 items-start w-full">
            <div className="text-[13px] font-semibold text-gray-60 w-full">회의 이름</div>
            <div className="border-b border-gray-10 pb-[7px] w-full text-[15px] text-gray-95">{MEETING_TITLE}</div>
          </div>
          <div className="flex flex-col gap-1 items-start w-full">
            <div className="text-[13px] font-semibold text-gray-60 w-full">소요 시간</div>
            <div className="border-b border-gray-10 pb-[7px] w-full text-[15px] text-gray-95">{MEETING_DURATION_HOURS}시간</div>
          </div>
          <div className="flex flex-col gap-1 items-start w-full">
            <div className="text-[13px] font-semibold text-gray-60 w-full">회의 기간</div>
            <button
              onClick={() => openSheet('calendar')}
              className="border-b border-gray-10 pb-[7px] flex items-center justify-between w-full cursor-pointer"
            >
              <span className={`text-[15px] ${rangeChosen ? 'text-gray-95' : 'text-gray-40'}`}>
                {rangeChosen
                  ? `${longDateLabel(meetingRange.start).replace(/ .$/, '')} - ${longDateLabel(meetingRange.end).replace(/ .$/, '')}`
                  : '날짜 범위를 선택해주세요'}
              </span>
              {rangeChosen && <span className="text-[15px] font-semibold text-green-30">변경</span>}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-start px-5 py-3.5 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="text-[15px]">
              <span className="font-semibold text-gray-60">참석자</span>{' '}
              <span className="font-medium text-green-30">{MEMBERS.length}명</span>
            </div>
          </div>
          <div className="flex flex-col items-start w-full">
            {MEMBERS.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 w-full">
                <div className="flex items-center gap-2">
                  <Avatar id={m.id} size={28} />
                  <div className="flex items-center gap-1.5 text-[17px]">
                    <span className="font-medium text-gray-95">{m.name}</span>
                    {m.id === 'gayoung' && <span className="font-normal text-green-30">나</span>}
                  </div>
                </div>
                {(() => {
                  const isRequired = requiredIds.has(m.id);
                  const locked = m.id === HOST_ID; // host is always required
                  return (
                    <button
                      onClick={() => !locked && toggleRequired(m.id)}
                      disabled={locked}
                      aria-label={`${m.name} 필수 참석 ${isRequired ? '해제' : '설정'}`}
                      className={`flex items-center gap-1 ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`size-4 rounded flex items-center justify-center ${
                          isRequired ? 'bg-gray-100' : 'bg-gray-10'
                        }`}
                      >
                        {isRequired && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[13px] font-medium ${isRequired ? 'text-gray-95' : 'text-gray-70'}`}>
                        필수
                      </span>
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ButtonDock
        label="일정 요청 보내기"
        disabled={!rangeChosen}
        onClick={() => setScreen('avoidTime')}
      />
    </div>
  );
}
