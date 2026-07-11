import type { ReactNode } from 'react';

export default function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div
      // Below 480px this is a real phone's viewport, so it fills the screen
      // edge-to-edge with no mockup chrome; at 480px and up it becomes the
      // fixed 375x812 phone-mockup card for desktop viewing.
      className="relative bg-gray-00 overflow-hidden shrink-0 w-full h-svh min-[480px]:w-[375px] min-[480px]:h-[812px] rounded-none shadow-none min-[480px]:rounded-[44px] min-[480px]:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      // `will-change: transform` establishes a new containing block, so any
      // `position: fixed` bottom sheet inside is pinned to *this* phone frame
      // instead of escaping to the real browser viewport.
      style={{ willChange: 'transform' }}
    >
      <div className="relative w-full h-full overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
