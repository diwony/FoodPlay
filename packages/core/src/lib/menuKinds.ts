/**
 * "장보기 추천"에서 고르는 메뉴 종류 · 조리 스타일 칩.
 *
 * 요리 계열(`Cuisine`: 한/일/양/중식)이 큐레이션 데이터에 하드로 박혀 있는
 * 것과 달리, 여기 값들은 **부드러운 신호**다. 큐레이션 레시피를 걸러내지
 * 않고(아직 한식 위주라 걸러내면 화면이 빈다) 유튜브 검색어와 제목 매칭에만
 * 쓴다. 새 종류를 추가할 때 데이터 마이그레이션이 필요 없다.
 */

export interface MenuKind {
  /** 안정적인 키 (React key, 저장용) */
  id: string;
  label: string;
  emoji: string;
  /** 유튜브 검색어 · 레시피 제목 매칭에 쓸 키워드 */
  keywords: string[];
}

export const MENU_KINDS: MenuKind[] = [
  { id: "rice", label: "밥 · 덮밥", emoji: "🍚", keywords: ["덮밥", "볶음밥", "비빔밥", "주먹밥"] },
  { id: "noodle", label: "면 · 파스타", emoji: "🍜", keywords: ["국수", "파스타", "라면", "우동", "쌀국수"] },
  { id: "soup", label: "국 · 탕 · 찌개", emoji: "🍲", keywords: ["찌개", "국", "탕", "전골"] },
  { id: "grill", label: "구이 · 조림", emoji: "🍖", keywords: ["구이", "조림", "스테이크"] },
  { id: "stirfry", label: "볶음", emoji: "🥘", keywords: ["볶음", "제육", "잡채"] },
  { id: "fried", label: "튀김 · 전", emoji: "🍤", keywords: ["튀김", "전", "부침개", "돈까스"] },
  { id: "steam", label: "찜", emoji: "♨️", keywords: ["찜", "수육", "보쌈"] },
  { id: "salad", label: "샐러드 · 샌드위치", emoji: "🥗", keywords: ["샐러드", "샌드위치", "포케", "랩"] },
  { id: "bunsik", label: "분식", emoji: "🍢", keywords: ["떡볶이", "분식", "김밥", "순대"] },
  { id: "anju", label: "술안주", emoji: "🍻", keywords: ["안주", "술안주"] },
  { id: "soupless", label: "죽 · 스프", emoji: "🥣", keywords: ["죽", "스프", "리조또"] },
  { id: "onepan", label: "한 그릇 · 원팬", emoji: "🍳", keywords: ["원팬", "한그릇", "간단"] },
];

const BY_ID: Record<string, MenuKind> = Object.fromEntries(
  MENU_KINDS.map((m) => [m.id, m]),
);

export function menuKind(id: string): MenuKind | undefined {
  return BY_ID[id];
}

/** 고른 메뉴 종류들의 대표 키워드(각 종류의 첫 키워드) — 검색어 조합용. */
export function menuKeywords(ids: Iterable<string>): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const k = BY_ID[id]?.keywords[0];
    if (k) out.push(k);
  }
  return out;
}
