/**
 * 홈 화면 "빠른 추가" 재료 칩. 웹/앱이 공유한다.
 *
 * 예전에는 20여 개가 분류 없이 한 줄에 쏟아졌다. 육류·채소처럼 묶어두면
 * 눈으로 훑기 쉽고, "밀키트" 묶음은 냉동실에 쌓아둔 밀키트를 꺼내 집에 있는
 * 재료로 푸짐하게 만드는 흐름을 겨냥한다.
 *
 * 칩 라벨은 모두 정규화된 표준어(= recipes.json 의 coreIngredients, 또는
 * ingredients.ts 의 SYNONYMS 로 흡수되는 말)라서, 토글하면 그대로 매칭에 쓰인다.
 */

export interface IngredientGroup {
  /** 안정적인 키 (React key, 저장용) */
  key: string;
  /** 칩 그룹 제목 */
  label: string;
  emoji: string;
  /** 이 그룹 안내 문구 (선택) */
  hint?: string;
  items: string[];
}

export const INGREDIENT_GROUPS: IngredientGroup[] = [
  {
    key: "meat",
    label: "육류 · 계란",
    emoji: "🥩",
    items: ["계란", "돼지고기", "소고기", "닭", "스팸"],
  },
  {
    key: "seafood",
    label: "어류 · 해산물",
    emoji: "🐟",
    items: ["참치캔", "어묵", "미역", "오징어", "새우"],
  },
  {
    key: "veggie",
    label: "채소 · 버섯",
    emoji: "🥬",
    items: [
      "대파",
      "양파",
      "감자",
      "당근",
      "애호박",
      "양배추",
      "부추",
      "콩나물",
      "버섯",
      "청양고추",
    ],
  },
  {
    key: "fruit",
    label: "과일",
    emoji: "🍎",
    items: ["사과", "바나나", "토마토", "아보카도"],
  },
  {
    key: "staple",
    label: "김치 · 장 · 밥 · 떡",
    emoji: "🍚",
    items: ["김치", "두부", "밥", "떡볶이떡", "된장", "고추장"],
  },
  {
    key: "mealkit",
    label: "밀키트에 곁들이기",
    emoji: "🧊",
    hint: "냉동실에 쟁여둔 밀키트에 이 재료를 더하면 푸짐해져요",
    items: [
      "만두",
      "라면사리",
      "우동사리",
      "쫄면",
      "슬라이스치즈",
      "숙주",
      "팽이버섯",
      "청경채",
    ],
  },
];

/** 모든 그룹의 칩을 평평하게 (중복 제거). 기존 QUICK_ADD 대체용. */
export const QUICK_ADD_ITEMS: string[] = Array.from(
  new Set(INGREDIENT_GROUPS.flatMap((g) => g.items)),
);

export const QUICK_ADD_SET: ReadonlySet<string> = new Set(QUICK_ADD_ITEMS);
