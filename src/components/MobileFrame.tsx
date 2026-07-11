import type { ReactNode } from 'react';

export default function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative bg-gray-00 rounded-[44px] shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden shrink-0"
      // `will-change: transform` establishes a new containing block, so any
      // `position: fixed` bottom sheet inside is pinned to *this* phone frame
      // instead of escaping to the real browser viewport.
      style={{ width: 375, height: 812, willChange: 'transform' }}
    >
      <div className="relative w-full h-full overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
