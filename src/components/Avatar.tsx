import { useState } from 'react';
import type { MemberId } from '../types';
import { MEMBER_MAP } from '../data/seed';

interface AvatarProps {
  id: MemberId;
  size?: number;
  /** Shows the small dark "필수" badge in the corner — the single marker
   * convention for required attendees, shared by every screen that lists
   * members (suggestion cards, participant rows, the explore-times sheet).
   * Kept as a badge rather than a colored ring so it stays legible when an
   * avatar sits on a colored zone/heatmap background. */
  required?: boolean;
  className?: string;
}

export default function Avatar({ id, size = 28, required = false, className = '' }: AvatarProps) {
  const member = MEMBER_MAP[id];
  const [imgFailed, setImgFailed] = useState(false);
  const badgeSize = Math.max(size * 0.34, 9);

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="rounded-full border-2 border-gray-00 flex items-center justify-center overflow-hidden w-full h-full"
        style={{ backgroundColor: member.avatarSeed }}
        title={member.name}
      >
        {!imgFailed ? (
          <img
            src={`/avatars/${id}.jpg`}
            alt={member.name}
            className="size-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="font-medium text-gray-95/70" style={{ fontSize: Math.max(size * 0.38, 9) }}>
            {member.name.slice(-2)}
          </span>
        )}
      </div>
      {required && (
        <span
          aria-label="필수 참석"
          className="absolute rounded-full bg-gray-90 border-2 border-gray-00"
          style={{ width: badgeSize, height: badgeSize, left: -1, bottom: -1 }}
        />
      )}
    </div>
  );
}
