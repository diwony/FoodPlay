/**
 * 홈 히어로의 "오늘은 이거 어때요?" — 접속할 때마다 조금씩 다르게.
 *
 * 실시간 날씨 API 는 부르지 않는다(서비스 원칙). 대신 **달(月) → 계절/절기**
 * 시나리오 풀을 만들고, 접속 시각 + 세션 난수로 회전시킨다. 문구는 "비가
 * 오니까"처럼 단정하지 않고 "장마철이죠"처럼 계절에 기대어 자연스럽게 쓴다.
 */

import type { Vibe } from "../data/types";

export interface DailyPick {
  emoji: string;
  /** 큰 문구 — "장마철엔 역시 파전이죠" */
  headline: string;
  /** 보조 문구 — "부침개 한 장에 막걸리 한 잔 어때요?" */
  sub: string;
  /** 클릭 시 냉장고 모드로 넘길 기분 */
  vibes: Vibe[];
  /** 영상·탐색에 쓸 키워드 */
  query: string;
}

/** 달마다 어울리는 시나리오. 1~12. */
function seasonPicks(month: number): DailyPick[] {
  const winter: DailyPick[] = [
    {
      emoji: "🍲",
      headline: "추운 날엔 뜨끈한 국물",
      sub: "김치찌개 한 냄비, 밥 말아 먹기 좋은 날이에요.",
      vibes: ["warm", "hearty"],
      query: "얼큰한 국물 찌개",
    },
    {
      emoji: "🥘",
      headline: "손 시릴 땐 부대찌개",
      sub: "라면사리까지 넣어서 푸짐하게.",
      vibes: ["warm", "hearty", "guests"],
      query: "부대찌개",
    },
    {
      emoji: "🍜",
      headline: "칼바람엔 칼국수·수제비",
      sub: "멸치육수 우려서 뜨끈하게 후루룩.",
      vibes: ["warm", "homey"],
      query: "칼국수 수제비",
    },
  ];
  const springFall: DailyPick[] = [
    {
      emoji: "🌸",
      headline: "날 좋을 때 도시락 반찬",
      sub: "소풍 가듯, 만들어서 통에 담기 좋은 요리.",
      vibes: ["homey", "light"],
      query: "도시락 반찬",
    },
    {
      emoji: "🍳",
      headline: "환절기엔 속 편한 집밥",
      sub: "된장찌개에 계란말이 하나면 충분하죠.",
      vibes: ["homey", "light"],
      query: "속 편한 집밥",
    },
  ];
  const summer: DailyPick[] = [
    {
      emoji: "🐔",
      headline: "이 더위엔 이열치열, 삼계탕",
      sub: "푹 곤 국물로 여름을 이겨봐요.",
      vibes: ["warm", "hearty", "homey"],
      query: "삼계탕 보양식",
    },
    {
      emoji: "🥗",
      headline: "더울 땐 불 안 쓰는 한 끼",
      sub: "냉파스타·비빔국수·오이무침처럼 시원하게.",
      vibes: ["light", "quick"],
      query: "불 안 쓰는 여름 요리",
    },
    {
      emoji: "🍧",
      headline: "폭염엔 냉면 아니면 콩국수",
      sub: "얼음 동동, 후루룩 넘어가는 걸로.",
      vibes: ["light", "quick"],
      query: "냉면 콩국수",
    },
  ];
  const rainy: DailyPick[] = [
    {
      emoji: "🫓",
      headline: "장마철엔 역시 파전이죠",
      sub: "부침개 한 장에 막걸리 한 잔 어때요?",
      vibes: ["warm", "homey", "guests"],
      query: "파전 부침개",
    },
    {
      emoji: "🍲",
      headline: "꿉꿉한 날엔 얼큰한 국물",
      sub: "짬뽕이나 김치찌개로 개운하게.",
      vibes: ["warm", "spicy"],
      query: "얼큰한 국물",
    },
  ];

  if (month === 12 || month <= 2) return winter;
  if (month === 6 || month === 7) return [...rainy, ...summer]; // 장마 + 초여름
  if (month === 8) return summer;
  if (month === 9) return [...springFall, ...summer];
  return springFall; // 3~5, 10~11
}

/** 계절 안 타는 상시 시나리오 */
const ALLSEASON: DailyPick[] = [
  {
    emoji: "🌶️",
    headline: "스트레스엔 매운 거",
    sub: "제육볶음이나 매운 어묵볶음으로 확 풀어요.",
    vibes: ["spicy", "hearty"],
    query: "매운 요리",
  },
  {
    emoji: "🍚",
    headline: "귀찮은 날의 한 그릇",
    sub: "김치볶음밥·계란간장밥처럼 후딱 되는 걸로.",
    vibes: ["quick", "convenience"],
    query: "한 그릇 요리",
  },
  {
    emoji: "🌙",
    headline: "출출한 밤, 야식 한 접시",
    sub: "떡볶이나 간장계란밥이면 딱이죠.",
    vibes: ["convenience", "spicy"],
    query: "야식",
  },
  {
    emoji: "🍳",
    headline: "냉장고 털어 만드는 저녁",
    sub: "남은 재료 몇 개면 요리 하나 나와요.",
    vibes: ["quick", "homey"],
    query: "냉장고 털기",
  },
];

/** 지금 시점에 어울리는 시나리오 목록 (계절 + 상시). */
export function dailyPicks(now: Date = new Date()): DailyPick[] {
  return [...seasonPicks(now.getMonth() + 1), ...ALLSEASON];
}

/**
 * 접속 순간의 추천 한 개. `salt`(0~1)로 접속마다 다르게 돈다.
 * 시각까지 섞어, 같은 방문 안에서도 새로고침하면 조금씩 바뀐다.
 */
export function pickOfTheMoment(
  now: Date = new Date(),
  salt: number = Math.random(),
): DailyPick {
  const picks = dailyPicks(now);
  const seed = (now.getHours() * 60 + now.getMinutes()) / 1440 + salt;
  return picks[Math.floor(seed * picks.length) % picks.length];
}
