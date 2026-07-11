export default function StatusBar() {
  return (
    // Hidden below 480px — a real phone already shows its own OS status bar,
    // so this fake mockup one (used for the desktop phone-frame illustration)
    // would just duplicate it.
    <div className="hidden min-[480px]:flex items-center justify-between w-full px-[24px] pt-[16px] pb-[4px] text-[15px] font-semibold text-gray-95 shrink-0">
      <span>9:41</span>
      <div className="flex items-center gap-[6px]">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="5" y="6" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path
            d="M8 10.5C8.6 10.5 9.1 10 9.1 9.4C9.1 8.8 8.6 8.3 8 8.3C7.4 8.3 6.9 8.8 6.9 9.4C6.9 10 7.4 10.5 8 10.5Z"
            fill="currentColor"
          />
          <path
            d="M8 6.2C9.3 6.2 10.5 6.7 11.4 7.5L12.4 6.3C11.2 5.3 9.7 4.7 8 4.7C6.3 4.7 4.8 5.3 3.6 6.3L4.6 7.5C5.5 6.7 6.7 6.2 8 6.2Z"
            fill="currentColor"
          />
          <path
            d="M8 2.1C10.4 2.1 12.6 3 14.3 4.5L15.3 3.3C13.3 1.5 10.8 0.4 8 0.4C5.2 0.4 2.7 1.5 0.7 3.3L1.7 4.5C3.4 3 5.6 2.1 8 2.1Z"
            fill="currentColor"
          />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" />
          <rect x="22.5" y="4" width="1.5" height="4" rx="0.7" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
