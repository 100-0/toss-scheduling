import type { ReactNode } from 'react';

interface BottomSheetProps {
  onDismiss?: () => void;
  children: ReactNode;
  floating?: boolean; // true = calendar-style floating card, false = full-width sheet
}

export default function BottomSheet({ onDismiss, children, floating }: BottomSheetProps) {
  return (
    <div className="absolute inset-0 z-30">
      <div className="absolute inset-0 bg-black/40" onClick={onDismiss} />
      {/* `fixed bottom-0` (scoped to the phone frame via its `will-change:
          transform` containing block) so the sheet stays pinned to the frame's
          bottom edge and grows upward with its content — no internal scroll. */}
      <div className={`fixed inset-x-0 bottom-0 ${floating ? 'flex justify-center pb-6' : ''}`}>{children}</div>
    </div>
  );
}

export function Grabber() {
  return (
    <div className="flex flex-col h-3 items-center justify-end w-full shrink-0">
      <div className="bg-gray-10 h-1 rounded-full w-12" />
    </div>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5L15 15M15 5L5 15" stroke="#161616" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SheetHeader({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <div className="flex gap-2 h-[50px] items-start justify-center w-full shrink-0">
      <div className="size-12" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3">
        <div className="text-[17px] font-semibold text-gray-100">{title}</div>
      </div>
      <div className="size-12 flex items-center justify-center">
        <button onClick={onClose} className="p-[14px] cursor-pointer" aria-label="닫기">
          <XIcon />
        </button>
      </div>
    </div>
  );
}
