import { useEffect, useMemo, useRef, useState } from "react";
import StatusBar from "../components/StatusBar";
import Header from "../components/Header";
import ButtonDock from "../components/ButtonDock";
import SuggestCard from "../components/SuggestCard";
import Avatar from "../components/Avatar";
import { useAppStore } from "../store/useAppStore";
import { generateSuggestions } from "../lib/suggest";
import { MEMBERS, MEETING_TITLE, MEETING_DURATION_HOURS } from "../data/seed";
import { monthDayLabel } from "../lib/dates";
import type { SuggestedSlot } from "../types";

type Filter = "all" | "noYield" | "allPossible";
const MAX_CARDS = 5;

function yieldCount(slot: SuggestedSlot) {
  return MEMBERS.filter((m) => slot.statuses[m.id] === "yield").length;
}
function impossibleCount(slot: SuggestedSlot) {
  return MEMBERS.filter((m) => slot.statuses[m.id] === "impossible").length;
}

export default function SuggestTimeScreen() {
  const gridStates = useAppStore((s) => s.gridStates);
  const requiredIds = useAppStore((s) => s.requiredIds);
  const meetingRange = useAppStore((s) => s.meetingRange);
  const setScreen = useAppStore((s) => s.setScreen);
  const openSheet = useAppStore((s) => s.openSheet);
  const selectSuggestedSlot = useAppStore((s) => s.selectSuggestedSlot);
  const activeIndex = useAppStore((s) => s.suggestActiveIndex);
  const setActiveIndex = useAppStore((s) => s.setSuggestActiveIndex);

  const [filter, setFilter] = useState<Filter>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const allSuggestions = useMemo(
    () =>
      generateSuggestions(
        gridStates,
        requiredIds,
        meetingRange,
        MEETING_DURATION_HOURS,
      ),
    [gridStates, requiredIds, meetingRange],
  );
  const topPick = allSuggestions[0];
  const top5 = useMemo(
    () => allSuggestions.slice(0, MAX_CARDS),
    [allSuggestions],
  );
  const suggestions = useMemo(() => {
    // Filters apply on top of the already-ranked top-5 "전체" list.
    if (filter === "noYield") return top5.filter((s) => yieldCount(s) === 0);
    if (filter === "allPossible")
      return top5.filter(
        (s) => yieldCount(s) === 0 && impossibleCount(s) === 0,
      );
    return top5;
  }, [top5, filter]);

  const active = suggestions[Math.min(activeIndex, suggestions.length - 1)];

  const CARD_STEP = 359; // 343 card + 16 gap

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / CARD_STEP);
    setActiveIndex(Math.max(0, Math.min(idx, suggestions.length - 1)));
  };

  const goToIndex = (i: number) => {
    setActiveIndex(i);
    scrollRef.current?.scrollTo({ left: i * CARD_STEP, behavior: "smooth" });
  };

  // Restores scroll position instantly on (re)mount — e.g. coming back from
  // "전체 시간 탐색" — since the carousel's scrollLeft itself isn't preserved
  // across the unmount even though activeIndex now lives in the store.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      left: activeIndex * CARD_STEP,
      behavior: "auto",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    if (!active) return;
    selectSuggestedSlot(active);
    const hasYielders = yieldCount(active) > 0;
    openSheet(hasYielders ? "requestYield" : "confirmTime");
  };

  return (
    <div className="relative flex flex-col h-full bg-gray-03">
      <StatusBar />
      <Header title="추천 시간" onBack={() => setScreen("yieldTime")} />

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-[90px] flex flex-col">
        <div className="flex flex-col gap-2 items-start px-6 py-3 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="text-[19px] font-bold text-gray-95 truncate max-w-[180px] break-words">
              {MEETING_TITLE}
            </div>
            <div className="flex items-start">
              {MEMBERS.map((m, i) => (
                <div
                  key={m.id}
                  style={{ marginRight: i === MEMBERS.length - 1 ? 0 : -12 }}
                >
                  <Avatar
                    id={m.id}
                    size={28}
                    required={requiredIds.has(m.id)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between w-full text-[15px] text-gray-60">
            <div className="flex gap-1 items-start">
              <span>총 시간</span>
              <span className="font-semibold">
                {MEETING_DURATION_HOURS}시간
              </span>
            </div>
            <div className="flex gap-1 items-start">
              <span>회의 기한</span>
              <span className="font-semibold break-words">
                {monthDayLabel(meetingRange.start)} ~{" "}
                {monthDayLabel(meetingRange.end)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 items-start pb-2 pt-3 px-4 w-full">
          {(
            [
              ["all", "전체"],
              ["noYield", "양보 없음"],
              ["allPossible", "전원 가능"],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setFilter(id);
                setActiveIndex(0);
                scrollRef.current?.scrollTo({ left: 0 });
              }}
              className={`border border-gray-20 rounded-full px-3 py-1 text-[13px] font-medium cursor-pointer whitespace-nowrap ${
                filter === id ? "bg-gray-20 text-gray-95" : "text-gray-95"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {suggestions.length === 0 ? (
          <div className="py-16 flex items-center justify-center text-[14px] text-gray-40 px-8 text-center break-words">
            조건에 맞는 추천 시간이 없어요. 필터를 바꿔보세요.
          </div>
        ) : (
          <>
            {/* pt-2/pb-6 live on the scrollable row itself (not a wrapping div) —
                overflow-x-auto forces overflow-y to clip too, so the card's
                shadow only has room to render within this element's own
                padding. The dots are pulled up into that same padded band
                (-mt-4) so they read as sitting inside the fading shadow
                rather than in a separate block below it. */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-4 items-center px-4 pt-2 pb-6 overflow-x-auto no-scrollbar snap-x snap-mandatory"
            >
              {suggestions.map((s) => (
                <div key={`${s.date}-${s.startHour}`} className="snap-center">
                  <SuggestCard
                    slot={s}
                    isTopPick={
                      topPick
                        ? s.date === topPick.date &&
                          s.startHour === topPick.startHour
                        : false
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center px-2.5 pt-2 -mt-4 w-full">
              <div className="bg-gray-10 flex gap-2 items-center px-3 py-1 rounded-full">
                {suggestions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToIndex(i)}
                    aria-label={`${i + 1}번째 추천 시간으로 이동`}
                    className="p-1.5 -m-1.5 cursor-pointer"
                  >
                    <div
                      className={`rounded-full size-2 ${i === activeIndex ? "bg-gray-100" : "bg-gray-40"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col items-center py-0.5 w-full mt-auto">
          <button
            className="flex items-center text-[17px] font-medium text-gray-60 cursor-pointer"
            onClick={() => setScreen("exploreTimes")}
          >
            전체 시간 탐색
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M7 4L11 9L7 14"
                stroke="#5D6060"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <ButtonDock
        label="이 시간으로 확정하기"
        disabled={!active}
        onClick={handleConfirm}
      />
    </div>
  );
}
