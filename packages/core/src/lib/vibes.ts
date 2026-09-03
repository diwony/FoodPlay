import type { Vibe } from "../data/types";

export interface VibeChip {
  vibe: Vibe;
  /** 칩에 보이는 라벨 (기분/상황 표현) */
  label: string;
  emoji: string;
}

/**
 * 홈 화면의 "오늘 기분/상황" 칩. 한 표현이 한 vibe 로 매핑된다.
 * 날씨 연동 시 기온·강수로 여기서 자동 선택하도록 확장할 수 있다
 * (예: 기온<5 또는 비 → "warm", 폭염 → "light").
 */
export const VIBE_CHIPS: VibeChip[] = [
  { vibe: "quick", label: "간단하게", emoji: "⚡" },
  { vibe: "hearty", label: "배고픔", emoji: "🍚" },
  { vibe: "warm", label: "꿉꿉·으슬으슬", emoji: "🌧️" },
  { vibe: "spicy", label: "스트레스·매운거", emoji: "🌶️" },
  { vibe: "guests", label: "집들이·손님상", emoji: "🎉" },
  { vibe: "homey", label: "엄마밥 생각", emoji: "🏠" },
  { vibe: "light", label: "가볍게", emoji: "🥗" },
];

const LABEL: Record<Vibe, string> = Object.fromEntries(
  VIBE_CHIPS.map((c) => [c.vibe, c.label]),
) as Record<Vibe, string>;

export function vibeLabel(v: Vibe): string {
  return LABEL[v] ?? v;
}
