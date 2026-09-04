/**
 * "지금 많이 보는 요리" · "요즘 뜨는" — 발견용 목록.
 *
 * 특정 유튜버(백종원 등)에 쏠리지 않도록, 홈의 인기 순위는 개별 레시피가 아니라
 * **요리(메뉴) 단위**로 센다. 웹은 이 목록의 키워드를 미리 모아둔 영상 풀
 * (11,000+개) 제목에 매칭해 조회수 합으로 재정렬하고, 프록시가 있으면 실시간
 * 유튜브 결과를 얹는다. (youtubeLive.ts 참고)
 */

export interface TrendItem {
  name: string;
  emoji: string;
  /** 영상 제목 매칭용 별칭들 (name 도 자동 포함) */
  aliases: string[];
  /** 유튜브 검색어 */
  query: string;
  kind: "dish" | "dessert";
  /** 요즘 급상승 — "요즘 뜨는" 칸에 노출 */
  rising: boolean;
}

/** 매칭에 쓸 키워드 (name + aliases, 중복 제거) */
export function trendKeywords(t: TrendItem): string[] {
  return Array.from(new Set([t.name, ...t.aliases]));
}

export const TREND_ITEMS: TrendItem[] = [
  // ── 꾸준히 많이 보는 요리 ───────────────────────────────
  { name: "김치볶음밥", emoji: "🍚", aliases: [], query: "김치볶음밥 레시피", kind: "dish", rising: false },
  { name: "제육볶음", emoji: "🥘", aliases: ["제육", "돼지불백"], query: "제육볶음 레시피", kind: "dish", rising: false },
  { name: "된장찌개", emoji: "🍲", aliases: [], query: "된장찌개 레시피", kind: "dish", rising: false },
  { name: "부대찌개", emoji: "🍜", aliases: [], query: "부대찌개 레시피", kind: "dish", rising: false },
  { name: "계란찜", emoji: "🥚", aliases: ["뚝배기 계란찜"], query: "계란찜 만들기", kind: "dish", rising: false },
  { name: "간장계란밥", emoji: "🍳", aliases: ["계란간장밥"], query: "간장계란밥", kind: "dish", rising: false },
  { name: "떡볶이", emoji: "🌶️", aliases: ["즉석떡볶이"], query: "떡볶이 레시피", kind: "dish", rising: false },
  { name: "김밥", emoji: "🍙", aliases: ["충무김밥", "키토김밥"], query: "김밥 싸는 법", kind: "dish", rising: false },
  { name: "잡채", emoji: "🍝", aliases: [], query: "잡채 만들기", kind: "dish", rising: false },
  { name: "김치찌개", emoji: "🍲", aliases: ["돼지고기 김치찌개"], query: "김치찌개 레시피", kind: "dish", rising: false },

  // ── 요즘 뜨는 (rising) ─────────────────────────────────
  { name: "마라탕", emoji: "🌶️", aliases: ["마라", "마라샹궈", "로제마라"], query: "마라탕 만들기", kind: "dish", rising: true },
  { name: "로제파스타", emoji: "🍝", aliases: ["로제", "로제떡볶이", "로제소스"], query: "로제 파스타 레시피", kind: "dish", rising: true },
  { name: "생새우 요리", emoji: "🦐", aliases: ["생새우", "새우장", "간장새우장", "오븐새우"], query: "생새우 요리", kind: "dish", rising: true },
  { name: "두바이 초콜릿", emoji: "🍫", aliases: ["두바이", "두바이초콜릿", "카다이프"], query: "두바이 초콜릿 만들기", kind: "dessert", rising: true },
  { name: "크로플", emoji: "🧇", aliases: ["크로와플", "와플"], query: "크로플 만들기", kind: "dessert", rising: true },
  { name: "탕후루", emoji: "🍡", aliases: [], query: "탕후루 만들기", kind: "dessert", rising: true },
  { name: "요거트 아이스크림", emoji: "🍦", aliases: ["요거트아이스크림", "그릭요거트", "프로틴 아이스크림", "프요"], query: "요거트 아이스크림 만들기", kind: "dessert", rising: true },
  { name: "바스크 치즈케이크", emoji: "🧀", aliases: ["바스크", "치즈케이크", "바스크치즈케이크"], query: "바스크 치즈케이크", kind: "dessert", rising: true },
  { name: "약과", emoji: "🍪", aliases: ["미니약과", "약켓팅"], query: "약과 만들기", kind: "dessert", rising: true },
  { name: "하이볼", emoji: "🥃", aliases: ["레몬 하이볼", "자몽 하이볼"], query: "하이볼 만들기", kind: "dessert", rising: true },
];

export const RISING_TRENDS = TREND_ITEMS.filter((t) => t.rising);
