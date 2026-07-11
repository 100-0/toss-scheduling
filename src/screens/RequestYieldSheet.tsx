import { useState } from 'react';
import BottomSheet, { Grabber, SheetHeader } from '../components/BottomSheet';
import Avatar from '../components/Avatar';
import { useAppStore } from '../store/useAppStore';
import { MEMBERS } from '../data/seed';

export default function RequestYieldSheet() {
  const closeSheet = useAppStore((s) => s.closeSheet);
  const openSheet = useAppStore((s) => s.openSheet);
  const selectedSlot = useAppStore((s) => s.selectedSlot);
  const setYieldRequestSent = useAppStore((s) => s.setYieldRequestSent);
  const requiredIds = useAppStore((s) => s.requiredIds);

  const yielders = selectedSlot ? MEMBERS.filter((m) => selectedSlot.statuses[m.id] === 'yield') : [];
  const [checked, setChecked] = useState<Set<string>>(new Set(yielders.map((m) => m.id)));
  const hasRequiredYielder = yielders.some((m) => requiredIds.has(m.id));

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const proceed = (sent: boolean) => {
    setYieldRequestSent(sent);
    openSheet('confirmTime');
  };

  return (
    <BottomSheet onDismiss={closeSheet}>
      <div className="bg-gray-00 rounded-t-[24px] flex flex-col gap-2 items-center pb-9 w-full">
        <Grabber />
        <SheetHeader title="양보 요청하기" onClose={closeSheet} />
        <div className="flex flex-col gap-5 items-start pb-5 px-4 w-full">
          <div className="flex flex-col gap-1 items-start">
            <div className="text-[17px] font-semibold text-gray-95 leading-[1.5]">
              양보할 수 있는 인원이 있어요.
              <br />
              양보를 요청할까요?
            </div>
            <div className="text-[13px] text-gray-60">
              {hasRequiredYielder
                ? '필수 참석 인원이 포함되어 있어요. 요청을 보내는 걸 권장해요.'
                : '필수 인원이 아니라면 요청 없이 진행해도 괜찮아요.'}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 items-start w-full">
            {yielders.map((m) => (
              <div key={m.id} className="flex gap-3 h-11 items-center py-2 w-full">
                <button
                  onClick={() => toggle(m.id)}
                  className={`size-4 rounded flex items-center justify-center shrink-0 cursor-pointer ${
                    checked.has(m.id) ? 'bg-gray-100' : 'bg-gray-10'
                  }`}
                >
                  {checked.has(m.id) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex gap-0.5 items-center">
                    <Avatar id={m.id} size={28} />
                    <span className="text-[17px] font-medium text-gray-95">{m.name}</span>
                  </div>
                  <span className="text-[13px] text-green-30">{requiredIds.has(m.id) ? '필수 참석' : '선택 참석'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-start px-4 w-full">
          <button
            onClick={() => proceed(true)}
            className="bg-green-00 flex-1 h-[52px] rounded-full flex items-center justify-center text-[17px] font-semibold text-gray-95 cursor-pointer"
          >
            요청 보내기
          </button>
          <button
            onClick={() => proceed(false)}
            className="bg-gray-100 flex-1 h-[52px] rounded-full flex items-center justify-center text-[17px] font-semibold text-white cursor-pointer"
          >
            아뇨, 괜찮아요.
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
