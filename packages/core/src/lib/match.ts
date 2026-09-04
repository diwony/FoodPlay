/**
 * 냉장고 재료 (+ 기분/상황 vibe) → 레시피 매칭 & 랭킹. 웹/앱 공유, 순수 함수.
 */

import type { Recipe, RecipeDatabase, Vibe } from "../data/types";
import db from "../data/recipes.json";
import { PANTRY_STAPLES } from "./ingredients";

const database = db as unknown as RecipeDatabase;

export interface RecipeMatch {
  recipe: Recipe;
  /** 사용자가 가진 핵심 재료 */
  have: string[];
  /** 사용자가 없는 핵심 재료 */
  missing: string[];
  /** 0~1. 핵심 재료 충족 비율 */
  score: number;
  /** 선택한 기분/상황 중 이 레시피와 맞는 것 */
  matchedVibes: Vibe[];
}

export interface MatchOptions {
  /** 이 점수 미만은 제외. 기본 0 = 핵심 재료 1개만 겹쳐도 포함 */
  minScore?: number;
  /** 사용자가 고른 기분/상황 키워드 */
  vibes?: Vibe[];
}

/**
 * 한 채널이 목록 상단을 독식하지 않도록 재배열한다.
 * 이미 점수순으로 정렬된 배열을 받아, 같은 채널이 연달아 나올 때마다
 * 커지는 감점을 매겨 다시 고른다. 점수 차가 크면 그대로 두고, 비슷한
 * 후보들 사이에서만 채널을 번갈아 준다. (그리디, 후보 수가 적어 O(n²) OK)
 *
 * @param baseScore  0~1 스케일 권장. 채널 감점(0.12/회)과 비교 가능해야 한다.
 */
function spreadByChannel<T>(
  ranked: T[],
  channelOf: (item: T) => string,
  baseScore: (item: T) => number,
  penaltyPerRepeat = 0.12,
): T[] {
  const pool = ranked.map((item, i) => ({ item, i }));
  const out: T[] = [];
  const seen = new Map<string, number>();

  while (pool.length > 0) {
    let bestIdx = 0;
    let bestValue = -Infinity;
    for (let k = 0; k < pool.length; k++) {
      const { item } = pool[k];
      const repeats = seen.get(channelOf(item)) ?? 0;
      const value = baseScore(item) - repeats * penaltyPerRepeat;
      // 동점이면 원래 순위(pool 은 순위순)를 유지한다.
      if (value > bestValue) {
        bestValue = value;
        bestIdx = k;
      }
    }
    const [chosen] = pool.splice(bestIdx, 1);
    out.push(chosen.item);
    const ch = channelOf(chosen.item);
    seen.set(ch, (seen.get(ch) ?? 0) + 1);
  }
  return out;
}

const viewsOf = (m: RecipeMatch) => m.recipe.long.views ?? 0;
/** 조회수를 0~1 로 눌러 정렬 보조 신호로 쓴다. (100만회 ≈ 1.0) */
const viewSignal = (m: RecipeMatch) =>
  Math.min(1, Math.log10(viewsOf(m) + 1) / 6);

/**
 * 사용자 재료로 만들 수 있는 레시피를 점수순으로 반환한다.
 *
 * - 재료 점수 = (가진 핵심 재료 수) / (전체 핵심 재료 수). 팬트리 양념 제외.
 * - 핵심 재료가 1개라도 겹치면 후보. (`minScore` 기본 0)
 * - `vibes` 를 고르면, 겹치는 vibe 1개당 정렬 가산점(0.15)을 준다.
 *   재료가 우선, vibe 는 동점 상황을 가르는 보정.
 */
export function matchRecipes(
  userIngredients: string[],
  options: MatchOptions = {},
): RecipeMatch[] {
  const { minScore = 0, vibes = [] } = options;
  const owned = new Set(userIngredients);
  const wantedVibes = new Set(vibes);

  const matches = database.recipes.map((recipe): RecipeMatch => {
    const have: string[] = [];
    const missing: string[] = [];

    for (const ing of recipe.coreIngredients) {
      if (owned.has(ing)) have.push(ing);
      else if (!PANTRY_STAPLES.has(ing)) missing.push(ing);
    }

    const denom = have.length + missing.length || 1;
    const ingredientScore = have.length / denom;
    const matchedVibes = (recipe.vibes ?? []).filter((v) => wantedVibes.has(v));

    return {
      recipe,
      have,
      missing,
      score: ingredientScore,
      matchedVibes,
    };
  });

  // 재료 충족도가 1순위, 기분 가산점이 2순위, 조회수는 그 다음 — 비슷한 후보
  // 사이에서는 "많이 본 영상"을 확실히 위로 올린다.
  const rank = (m: RecipeMatch) =>
    m.score + m.matchedVibes.length * 0.15 + viewSignal(m) * 0.3;

  let ranked = matches
    .filter((m) => m.have.length > 0 && m.score >= minScore)
    .sort(
      (a, b) =>
        rank(b) - rank(a) ||
        a.missing.length - b.missing.length ||
        viewsOf(b) - viewsOf(a) ||
        a.recipe.cookMinutes - b.recipe.cookMinutes,
    );

  // 기분/상황을 골랐으면 결과가 눈에 띄게 바뀌어야 한다: 고른 기분에 맞는
  // 레시피를 앞으로 당긴다(재료 매칭은 유지, 하드 필터는 하지 않아 결과가
  // 사라지지 않는다). 맞는 게 하나도 없으면 순서 그대로 둔다.
  if (wantedVibes.size > 0) {
    const hit = ranked.filter((m) => m.matchedVibes.length > 0);
    const rest = ranked.filter((m) => m.matchedVibes.length === 0);
    if (hit.length > 0) ranked = [...hit, ...rest];
  }

  // 같은 채널(예: 백종원)이 상단을 독식하지 않도록 번갈아 배치한다.
  return spreadByChannel(
    ranked,
    (m) => m.recipe.long.channel,
    (m) => rank(m) + (m.matchedVibes.length > 0 ? 0.3 : 0),
  );
}

export function getRecipe(id: string): Recipe | undefined {
  return database.recipes.find((r) => r.id === id);
}

/**
 * 조회수 상위 레시피 — 홈의 "지금 인기" 순위(실검처럼 넘어가는 목록)용.
 * 조회수가 없는 항목은 뒤로 민다.
 */
export function popularRecipes(limit = 10): Recipe[] {
  return [...database.recipes]
    .sort((a, b) => (b.long.views ?? 0) - (a.long.views ?? 0))
    .slice(0, limit);
}

export function allRecipes(): Recipe[] {
  return database.recipes;
}

/**
 * 재료 입력이 없을 때 홈에서 보여줄 "둘러보기" 목록.
 * 고른 기분(vibe)이 있으면 그에 맞는 순으로, 없으면 전체를 조리시간 순으로.
 */
export function browseRecipes(vibes: Vibe[] = []): RecipeMatch[] {
  const wanted = new Set(vibes);
  // 재료 점수가 없으므로 기분 일치 → 조회수 순으로 정렬한 뒤 채널을 흩뿌린다.
  const ranked = database.recipes
    .map((recipe): RecipeMatch => {
      const matchedVibes = (recipe.vibes ?? []).filter((v) => wanted.has(v));
      return { recipe, have: [], missing: [], score: 0, matchedVibes };
    })
    .sort(
      (a, b) =>
        b.matchedVibes.length - a.matchedVibes.length ||
        viewsOf(b) - viewsOf(a) ||
        a.recipe.cookMinutes - b.recipe.cookMinutes,
    );

  // 기분을 골랐으면 그 기분에 맞는 레시피만 보여준다. 재료를 안 골라도
  // "오늘 기분·상황"만으로 결과가 확 바뀌어야 하기 때문. 맞는 게 너무
  // 적으면(3개 미만) 나머지도 뒤에 붙여 빈 화면을 피한다.
  const scoped =
    wanted.size > 0
      ? (() => {
          const hit = ranked.filter((m) => m.matchedVibes.length > 0);
          const rest = ranked.filter((m) => m.matchedVibes.length === 0);
          return hit.length >= 3 ? hit : [...hit, ...rest];
        })()
      : ranked;

  return spreadByChannel(
    scoped,
    (m) => m.recipe.long.channel,
    (m) => m.matchedVibes.length * 0.5 + viewSignal(m),
    0.35,
  );
}

/** 상세 화면의 "추천 영상" — 현재 레시피와 vibe·재료가 겹치는 순으로 */
export function relatedRecipes(id: string, limit = 10): Recipe[] {
  const current = getRecipe(id);
  if (!current) return database.recipes.slice(0, limit);

  const curVibes = new Set(current.vibes ?? []);
  const curCore = new Set(current.coreIngredients);

  return database.recipes
    .filter((r) => r.id !== id)
    .map((r) => {
      const vibeOverlap = (r.vibes ?? []).filter((v) => curVibes.has(v)).length;
      const ingOverlap = r.coreIngredients.filter((i) => curCore.has(i)).length;
      return { r, weight: vibeOverlap * 2 + ingOverlap };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((x) => x.r);
}
