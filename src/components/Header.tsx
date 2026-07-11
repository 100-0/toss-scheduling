interface HeaderProps {
  title: string;
  onBack?: () => void;
  /** Shows the back chevron as an inert placeholder even without onBack —
   * for screens that are the first step in this demo but whose real product
   * would still show the icon (e.g. Home). */
  showBackPlaceholder?: boolean;
}

function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 5L8 12L15 19" stroke="#161616" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Header({ title, onBack, showBackPlaceholder }: HeaderProps) {
  const showIcon = !!onBack || showBackPlaceholder;
  return (
    <div className="flex items-center gap-1 px-4 py-3 w-full shrink-0">
      <button
        onClick={onBack}
        disabled={!onBack}
        className={`size-6 flex items-center justify-center ${
          !showIcon ? 'invisible' : onBack ? 'cursor-pointer' : 'cursor-default'
        }`}
        aria-label="뒤로가기"
      >
        <ChevronLeft />
      </button>
      <div className="flex-1 text-[17px] font-semibold text-gray-95 truncate">{title}</div>
    </div>
  );
}
