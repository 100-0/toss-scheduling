import type { SuggestedSlot } from '../types';
import { MEMBERS } from '../data/seed';
import { longDateLabel, formatHourRange } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';
import Avatar from './Avatar';

// Tier 1's table label is "최적의 시간대", but that badge is reserved for the
// single overall best-ranked slot only (see isTopPick below) — other tier-1
// cards ("everyone fully possible" but not THE best) fall back to this label.
const TIER_LABEL: Record<SuggestedSlot['tier'], string> = {
  1: '전원 참석 가능',
  2: '양보 요청 필요',
  3: '필수 인원 가능',
  4: '필수 인원 양보 필요',
  5: '필수 인원 양보 필요',
  6: '필수 인원 양보 필요',
};

const MAX_AVATAR_SIZE = 48;
const MIN_AVATAR_SIZE = 26;
const AVATAR_GAP = 6;
const INSET_GLOW = 'inset 0px 4px 60px 0px rgba(230,242,217,0.6)';

/** Deterministic PRNG so a given slot+zone always scatters the same way (no reshuffling on re-render). */
function seededRandom(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return h;
}

/** All the hex-grid slots a circle of this size can occupy in the box
 * without any two centers ending up closer than `size + gap` apart. Shared
 * by pickAvatarSize (to count capacity) and scatterPositions (to place
 * avatars), so the two can never disagree about what fits. */
function buildHexSlots(size: number, gap: number, width: number, height: number) {
  const r = size / 2;
  const xStep = size + gap;
  const yStep = xStep * 0.87; // hex row height for tangent-circle packing
  const cols = Math.max(1, Math.floor((width - size) / xStep) + 1);
  const maxRows = Math.max(1, Math.ceil(height / yStep) + 1);
  const slots: { x: number; y: number }[] = [];
  for (let row = 0; row < maxRows; row++) {
    const xOffset = row % 2 === 1 ? xStep / 2 : 0;
    const y = r + row * yStep;
    if (y > height - r + 0.01) continue;
    for (let col = 0; col < cols; col++) {
      const x = r + xOffset + col * xStep;
      if (x > width - r + 0.01) continue;
      slots.push({ x, y });
    }
  }
  return slots;
}

/** Shrinks the avatar size (down to MIN_AVATAR_SIZE) until the box has room
 * for `n` non-overlapping circles at that size. Previously the size was
 * fixed and a zone that couldn't fit everyone at 48px just dropped the
 * overflow avatars on top of each other (a duplicate slot at the box's
 * center) — this makes the whole cluster shrink together instead. */
function pickAvatarSize(n: number, width: number, height: number) {
  for (let size = MAX_AVATAR_SIZE; size >= MIN_AVATAR_SIZE; size -= 2) {
    if (buildHexSlots(size, AVATAR_GAP, width, height).length >= n) return size;
  }
  return MIN_AVATAR_SIZE;
}

/** Assigns avatars to a seeded-shuffled subset of the hex slots and nudges
 * each one by a small bounded jitter. The jitter is capped well under
 * AVATAR_GAP so two circles can never close in past their true diameter —
 * random-looking, but overlap is mathematically impossible, not just
 * unlikely (as long as pickAvatarSize found enough slots for `n`). */
function scatterPositions(n: number, size: number, width: number, height: number, seedKey: string) {
  const rng = seededRandom(hashKey(seedKey));
  const r = size / 2;
  const jitter = 2.5; // worst-case mutual closing = 2*jitter, kept < AVATAR_GAP
  const slots = buildHexSlots(size, AVATAR_GAP, width, height);
  // Defensive fallback only — pickAvatarSize should already guarantee enough
  // slots for `n` before this ever runs.
  while (slots.length < n) slots.push({ x: width / 2, y: height / 2 });

  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  return slots.slice(0, n).map((p) => ({
    x: Math.min(width - r, Math.max(r, p.x + (rng() - 0.5) * 2 * jitter)),
    y: Math.min(height - r, Math.max(r, p.y + (rng() - 0.5) * 2 * jitter)),
  }));
}

function AvatarCluster({
  members,
  seedKey,
  box,
}: {
  members: typeof MEMBERS;
  seedKey: string;
  box: { top: number; left: number; width: number; height: number };
}) {
  const requiredIds = useAppStore((s) => s.requiredIds);
  if (members.length === 0) return null;
  const size = pickAvatarSize(members.length, box.width, box.height);
  const positions = scatterPositions(members.length, size, box.width, box.height, seedKey);

  return (
    <div className="absolute" style={{ top: box.top, left: box.left, width: box.width, height: box.height }}>
      {members.map((m, i) => (
        <div
          key={m.id}
          className="absolute"
          style={{ left: positions[i].x - size / 2, top: positions[i].y - size / 2 }}
        >
          <Avatar id={m.id} size={size} required={requiredIds.has(m.id)} />
        </div>
      ))}
    </div>
  );
}

export default function SuggestCard({ slot, isTopPick }: { slot: SuggestedSlot; isTopPick: boolean }) {
  const possible = MEMBERS.filter((m) => slot.statuses[m.id] === 'possible');
  const yielders = MEMBERS.filter((m) => slot.statuses[m.id] === 'yield');
  const impossible = MEMBERS.filter((m) => slot.statuses[m.id] === 'impossible');
  const badgeLabel = isTopPick ? '최적의 시간대' : TIER_LABEL[slot.tier];
  const seedBase = `${slot.date}-${slot.startHour}`;

  return (
    <div
      className="flex flex-col items-center gap-4 p-1 w-[343px] shrink-0 rounded-[40px] border border-gray-00 bg-gray-100"
      style={{ boxShadow: '0 2px 20px 0 rgba(0,0,0,0.12), inset 0 0 30px 0 rgba(255,255,255,0.40)' }}
    >
      <div className="flex flex-col gap-4 items-start pt-5 px-5 w-full">
        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col text-white">
            <p className="text-[22px] font-bold leading-[1.35]">{longDateLabel(slot.date)}</p>
            <p className="text-[22px] font-bold leading-[1.35]">
              {formatHourRange(slot.startHour, slot.endHour)}
            </p>
          </div>
          <div className="bg-gray-80 rounded-lg px-2 py-1 shrink-0">
            <p className="text-[13px] font-medium text-green-00 whitespace-nowrap">{badgeLabel}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center text-[13px] flex-wrap">
          <span className="text-gray-20">필수 인원 <b className="text-gray-03 font-semibold">전원 가능</b></span>
          <span className="text-gray-20">양보 <b className="text-gray-03 font-semibold">{yielders.length > 0 ? `${yielders.length}명` : '없음'}</b></span>
          <span className="text-gray-20">불가능 <b className="text-gray-03 font-semibold">{impossible.length > 0 ? `${impossible.length}명` : '없음'}</b></span>
        </div>
      </div>

      <div className="flex flex-col h-[250px] items-start overflow-hidden relative rounded-[36px] shrink-0 w-full">
        <div className="flex h-[120px] items-center justify-between relative shrink-0 w-full">
          <div
            className="flex-1 h-full min-w-0 overflow-hidden relative"
            style={{
              backgroundImage: 'linear-gradient(127deg, #D0D2D2 0%, #F5F5F5 100%)',
              boxShadow: INSET_GLOW,
            }}
          >
            <span className="absolute left-4 top-3 bg-gray-95 rounded-full px-2 py-0.5 text-[12px] font-medium text-white whitespace-nowrap">
              양보 가능
            </span>
            <AvatarCluster
              members={yielders}
              seedKey={`${seedBase}-yield`}
              box={{ top: 36, left: 14, width: 139, height: 78 }}
            />
          </div>
          <div
            className="flex-1 h-full min-w-0 overflow-hidden relative"
            style={{
              backgroundImage: 'linear-gradient(53deg, #D0D2D2 0%, #939595 100%)',
              boxShadow: INSET_GLOW,
            }}
          >
            <span className="absolute right-4 top-3 bg-gray-95 rounded-full px-2 py-0.5 text-[12px] font-medium text-white whitespace-nowrap">
              참석 불가능
            </span>
            <AvatarCluster
              members={impossible}
              seedKey={`${seedBase}-impossible`}
              box={{ top: 36, left: 14, width: 139, height: 78 }}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden relative w-full bg-white" style={{ boxShadow: INSET_GLOW }}>
          <AvatarCluster
            members={possible}
            seedKey={`${seedBase}-possible`}
            box={{ top: 8, left: 16, width: 303, height: 84 }}
          />
          <span className="absolute left-1/2 -translate-x-1/2 bottom-3 bg-green-20 rounded-full px-2 py-0.5 text-[12px] font-medium text-gray-95 whitespace-nowrap">
            참석 가능
          </span>
        </div>
      </div>
    </div>
  );
}
