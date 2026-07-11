import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import ButtonDock from '../components/ButtonDock';
import Avatar from '../components/Avatar';
import { useAppStore } from '../store/useAppStore';
import { MEMBERS, MEETING_TITLE } from '../data/seed';
import { longDateLabel, formatHourRange } from '../lib/dates';

const CARD_GRADIENT =
  'url("data:image/svg+xml;utf8,<svg viewBox=\'0 0 333 250\' xmlns=\'http://www.w3.org/2000/svg\' preserveAspectRatio=\'none\'><rect x=\'0\' y=\'0\' height=\'100%25\' width=\'100%25\' fill=\'url(%23grad)\' opacity=\'1\'/><defs><radialGradient id=\'grad\' gradientUnits=\'userSpaceOnUse\' cx=\'0\' cy=\'0\' r=\'10\' gradientTransform=\'matrix(28.7 35.3 -47.703 38.784 46 46.5)\'><stop stop-color=\'rgba(15,16,16,1)\' offset=\'0\'/><stop stop-color=\'rgba(27,28,28,1)\' offset=\'0.0625\'/><stop stop-color=\'rgba(39,41,39,1)\' offset=\'0.125\'/><stop stop-color=\'rgba(64,66,63,1)\' offset=\'0.25\'/><stop stop-color=\'rgba(88,92,86,1)\' offset=\'0.375\'/><stop stop-color=\'rgba(113,117,109,1)\' offset=\'0.5\'/><stop stop-color=\'rgba(137,143,133,1)\' offset=\'0.625\'/><stop stop-color=\'rgba(162,168,156,1)\' offset=\'0.75\'/><stop stop-color=\'rgba(211,219,203,1)\' offset=\'1\'/></radialGradient></defs></svg>")';

export default function CompleteScreen() {
  const selectedSlot = useAppStore((s) => s.selectedSlot);
  const setScreen = useAppStore((s) => s.setScreen);
  const requiredIds = useAppStore((s) => s.requiredIds);

  if (!selectedSlot) return null;

  return (
    <div className="relative flex flex-col h-full bg-gray-03">
      <StatusBar />
      <Header title="회의 일정 확정 완료" onBack={() => setScreen('home')} />
      <div className="flex flex-col gap-4 items-center px-5 w-full">
        <div className="flex flex-col gap-4 items-center pb-4 pt-8 w-full">
          <div className="bg-green-00 shadow-[0_4px_25px_rgba(230,242,217,0.6)] rounded-full p-2.5 size-12 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12L10 17L19 7" stroke="#3E522A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-[19px] font-bold text-gray-90">일정이 확정됐어요</div>
        </div>
        <div
          className="relative border border-gray-00 rounded-[40px] shadow-[0_48px_90px_rgba(230,242,217,0.35),0_2px_20px_rgba(0,0,0,0.12)] overflow-hidden p-6 w-[333px] flex flex-col gap-9 items-start"
          style={{ backgroundImage: CARD_GRADIENT }}
        >
          <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0_0_30px_0_rgba(255,255,255,0.4)]" />
          <div className="flex flex-col gap-4 items-start w-full">
            <div className="text-[17px] font-semibold text-gray-10">{MEETING_TITLE}</div>
            <div className="text-[24px] font-bold text-white leading-[1.35]">
              {longDateLabel(selectedSlot.date)}
              <br />
              {formatHourRange(selectedSlot.startHour, selectedSlot.endHour)}
            </div>
          </div>
          <div className="flex flex-col gap-1 items-start w-full">
            <div className="text-[13px] font-medium text-gray-10">참석자</div>
            <div className="flex items-start">
              {MEMBERS.map((m, i) => (
                <div key={m.id} style={{ marginRight: i === MEMBERS.length - 1 ? 0 : -12 }}>
                  <Avatar id={m.id} size={36} required={requiredIds.has(m.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-[15px] text-gray-80">확정된 회의 일정을 전원에게 보냈어요.</div>
      </div>
      <div className="absolute bottom-[102px] left-0 flex flex-col items-center w-full">
        <button
          onClick={() => setScreen('home')}
          className="flex items-center text-[15px] font-medium text-gray-60 cursor-pointer"
        >
          일정 다시 선택하기
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 4L11 9L7 14" stroke="#5D6060" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <ButtonDock label="확인" onClick={() => setScreen('home')} />
    </div>
  );
}
