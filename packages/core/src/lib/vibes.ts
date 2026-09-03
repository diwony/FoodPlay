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

/** 자유 입력 문장에서 vibe 키워드를 감지한다. 예: "비 오고 으슬으슬해" → ["warm"] */
const VIBE_KEYWORDS: Record<Vibe, string[]> = {
  quick: ["간단", "빨리", "후딱", "귀찮", "초간단", "자취", "10분", "5분", "간편"],
  hearty: ["배고", "든든", "배부", "헛헛", "허기", "많이", "폭식"],
  warm: [
    "추", "쌀쌀", "꿉꿉", "으슬", "찌뿌", "뜨끈", "따뜻", "국물", "비 ", "비와", "비온",
    "장마", "감기", "몸살", "쌀쌀",
  ],
  spicy: ["스트레스", "매운", "매콤", "얼큰", "화나", "빡", "열받", "짜증", "칼칼"],
  guests: ["집들이", "손님", "대접", "모임", "파티", "안주", "한상", "초대"],
  homey: ["엄마", "집밥", "그리운", "고향", "어릴", "옛날", "할머니", "위로"],
  light: ["가볍", "다이어트", "담백", "산뜻", "느끼", "깔끔", "속이"],
};

export function parseVibes(text: string): Vibe[] {
  if (!text.trim()) return [];
  const t = text.toLowerCase();
  const hits = (Object.keys(VIBE_KEYWORDS) as Vibe[]).filter((v) =>
    VIBE_KEYWORDS[v].some((kw) => t.includes(kw)),
  );
  return hits;
}
