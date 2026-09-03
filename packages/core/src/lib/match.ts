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

  const rank = (m: RecipeMatch) => m.score + m.matchedVibes.length * 0.15;

  return matches
    .filter((m) => m.have.length > 0 && m.score >= minScore)
    .sort(
      (a, b) =>
        rank(b) - rank(a) ||
        a.missing.length - b.missing.length ||
        a.recipe.cookMinutes - b.recipe.cookMinutes,
    );
}

export function getRecipe(id: string): Recipe | undefined {
  return database.recipes.find((r) => r.id === id);
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
  return database.recipes
    .map((recipe): RecipeMatch => {
      const matchedVibes = (recipe.vibes ?? []).filter((v) => wanted.has(v));
      return { recipe, have: [], missing: [], score: 0, matchedVibes };
    })
    .sort(
      (a, b) =>
        b.matchedVibes.length - a.matchedVibes.length ||
        a.recipe.cookMinutes - b.recipe.cookMinutes,
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
