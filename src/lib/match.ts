/**
 * 냉장고 재료 → 레시피 매칭 & 랭킹. 웹/앱 공유, 순수 함수.
 */

import type { Recipe, RecipeDatabase } from "../data/types";
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
}

/**
 * 사용자 재료로 만들 수 있는 레시피를 점수순으로 반환한다.
 *
 * - score = (가진 핵심 재료 수) / (전체 핵심 재료 수)
 * - 팬트리 양념(소금·간장 등)은 "없는 재료"로 세지 않는다.
 * - minScore 미만은 제외 (기본 0.34 = 핵심의 1/3 이상)
 */
export function matchRecipes(
  userIngredients: string[],
  minScore = 0.34,
): RecipeMatch[] {
  const owned = new Set(userIngredients);

  const matches = database.recipes.map((recipe): RecipeMatch => {
    const have: string[] = [];
    const missing: string[] = [];

    for (const ing of recipe.coreIngredients) {
      if (owned.has(ing)) have.push(ing);
      else if (!PANTRY_STAPLES.has(ing)) missing.push(ing);
    }

    const denom = have.length + missing.length || 1;
    return { recipe, have, missing, score: have.length / denom };
  });

  return matches
    .filter((m) => m.have.length > 0 && m.score >= minScore)
    .sort(
      (a, b) =>
        b.score - a.score ||
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
