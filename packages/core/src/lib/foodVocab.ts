/**
 * 식재료 사전 — 영상 설명글·자막처럼 자유 텍스트에서 "이 요리에 쓰이는 재료"를
 * 뽑아낼 때 쓴다. 큐레이션 레시피가 아닌 유튜브 검색 영상(/yt/:id)에서
 * "내 냉장고에 있어야 할 재료"를 보여주기 위한 것.
 *
 * recipes.json 의 재료 + 홈 칩 + 흔한 재료를 합쳐 만든다.
 */

import db from "../data/recipes.json";
import type { RecipeDatabase } from "../data/types";
import { INGREDIENT_GROUPS } from "./quickAdd";
import { normalizeIngredient, PANTRY_STAPLES } from "./ingredients";

const database = db as unknown as RecipeDatabase;

/** 추가로 흔히 나오는 재료(사전에 없으면 자막에서 못 잡으므로 넉넉히). */
const COMMON = [
  "돼지고기", "소고기", "닭고기", "닭", "삼겹살", "목살", "다짐육", "베이컨",
  "소시지", "햄", "스팸", "어묵", "참치", "명란", "새우", "오징어", "낙지",
  "바지락", "조개", "홍합", "게맛살", "훈제오리", "차돌박이", "대패삼겹살", "우삼겹",
  "계란", "달걀", "메추리알", "두부", "순두부", "유부", "콩나물", "숙주",
  "대파", "쪽파", "양파", "마늘", "생강", "감자", "고구마", "당근", "애호박",
  "호박", "오이", "가지", "고추", "청양고추", "피망", "파프리카", "양배추",
  "배추", "알배추", "부추", "미나리", "깻잎", "상추", "시금치", "브로콜리",
  "버섯", "표고버섯", "느타리버섯", "팽이버섯", "새송이버섯", "양송이",
  "토마토", "방울토마토", "옥수수", "완두콩", "김치", "묵은지", "깍두기",
  "밥", "찬밥", "쌀", "떡", "가래떡", "떡볶이떡", "라면", "라면사리", "당면",
  "쫄면", "국수", "소면", "우동", "파스타면", "스파게티", "만두", "냉동만두",
  "김", "김가루", "미역", "다시마", "멸치", "가쓰오부시",
  "고추장", "된장", "쌈장", "간장", "진간장", "국간장", "소금", "설탕", "물엿",
  "올리고당", "꿀", "식초", "맛술", "미림", "참기름", "들기름", "식용유",
  "올리브유", "고춧가루", "후추", "깨", "통깨", "다진마늘", "카레", "케첩",
  "마요네즈", "돈까스소스", "굴소스", "액젓", "멸치액젓", "새우젓",
  "치즈", "모짜렐라", "체다치즈", "슬라이스치즈", "크림치즈", "리코타치즈",
  "부라타치즈", "버터", "우유", "생크림", "연유", "요거트", "그릭요거트",
  "밀가루", "박력분", "강력분", "부침가루", "튀김가루", "빵가루", "전분",
  "베이킹파우더", "이스트", "초콜릿", "코코아가루", "바나나", "사과", "딸기",
  "레몬", "블루베리", "아보카도", "견과류", "아몬드", "호두", "땅콩",
  "카다이프", "피스타치오", "생새우", "곤약", "두부면", "분모자",
];

/** 정규화된 재료 사전 (중복 제거). */
export const FOOD_VOCAB: string[] = Array.from(
  new Set(
    [
      ...database.recipes.flatMap((r) => [
        ...r.coreIngredients,
        ...r.extraIngredients,
      ]),
      ...INGREDIENT_GROUPS.flatMap((g) => g.items),
      ...COMMON,
    ].map(normalizeIngredient),
  ),
).filter((w) => w.length >= 2);

// 긴 재료명을 먼저 매칭(예: "청양고추" 를 "고추" 보다 우선)
const VOCAB_SORTED = [...FOOD_VOCAB].sort((a, b) => b.length - a.length);

export interface FoundIngredient {
  name: string;
  /** 텍스트에 나온 횟수 */
  hits: number;
  /** 양념류(거의 모든 집에 있다고 가정) */
  pantry: boolean;
}

/**
 * 자유 텍스트(설명글 + 자막)에서 재료를 뽑아 자주 나온 순으로 돌려준다.
 * - 최소 등장 횟수(minHits) 이상만.
 * - 양념은 뒤로 밀되 버리지 않는다.
 */
export function findIngredients(
  text: string,
  { limit = 14, minHits = 1 }: { limit?: number; minHits?: number } = {},
): FoundIngredient[] {
  if (!text) return [];
  const hay = text.replace(/\s+/g, "").toLowerCase();
  const found: FoundIngredient[] = [];

  for (const name of VOCAB_SORTED) {
    let idx = hay.indexOf(name);
    if (idx === -1) continue;
    let hits = 0;
    while (idx !== -1) {
      hits += 1;
      idx = hay.indexOf(name, idx + name.length);
    }
    if (hits >= minHits) {
      found.push({ name, hits, pantry: PANTRY_STAPLES.has(name) });
    }
  }

  return found
    .sort(
      (a, b) =>
        Number(a.pantry) - Number(b.pantry) ||
        b.hits - a.hits ||
        b.name.length - a.name.length,
    )
    .slice(0, limit);
}
