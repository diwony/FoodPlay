/**
 * "장보기 추천" 모드용 보조 로직 — 예산 추정과 날씨→상황 매핑.
 *
 * 예산은 레시피마다 따로 입력하지 않고 재료 구성에서 추정한다(데모 수준).
 * 날씨는 실시간 API 없이 사용자가 고른 값(더움/추움/비/보통)을 vibe 로 옮긴다.
 */

import type { Recipe, Vibe } from "../data/types";
import { PANTRY_STAPLES } from "./ingredients";

export type Budget = "low" | "mid" | "high";

export const BUDGET_LABEL: Record<Budget, string> = {
  low: "1만원 안쪽",
  mid: "1~2만원",
  high: "넉넉히",
};

/** 장바구니를 크게 키우는 재료 (고기·해산물). */
const PROTEIN = new Set([
  "소고기",
  "돼지고기",
  "닭",
  "오징어",
  "새우",
  "바지락",
]);
/** 그중에서도 특히 비싼 것. */
const EXPENSIVE = new Set(["소고기", "오징어", "새우"]);
/** 중간 단가. */
const MIDCOST = new Set(["버섯", "두부", "스팸", "참치캔", "어묵", "미역"]);

/**
 * 재료 구성으로 대략의 장바구니 예산을 매긴다(데모 수준).
 * 팬트리 양념(집에 있다고 가정)은 계산에서 뺀다.
 */
export function estimateBudget(recipe: Recipe): Budget {
  const all = [...recipe.coreIngredients, ...shoppingItems(recipe)];
  let score = recipe.coreIngredients.length + shoppingItems(recipe).length * 1.5;
  let hasExpensive = false;
  for (const it of all) {
    if (EXPENSIVE.has(it)) {
      score += 6;
      hasExpensive = true;
    } else if (PROTEIN.has(it)) score += 3.5;
    else if (MIDCOST.has(it)) score += 1.5;
  }
  if (hasExpensive || score >= 16) return "high";
  if (score >= 10) return "mid";
  return "low";
}

/** 이 레시피를 만들려고 장 볼 재료(팬트리 양념 제외). */
export function shoppingItems(recipe: Recipe): string[] {
  return recipe.extraIngredients.filter((i) => !PANTRY_STAPLES.has(i));
}

export type Weather = "hot" | "cold" | "rain" | "mild";

export interface WeatherChip {
  weather: Weather;
  label: string;
  emoji: string;
}

export const WEATHER_CHIPS: WeatherChip[] = [
  { weather: "hot", label: "더운 날", emoji: "☀️" },
  { weather: "cold", label: "추운 날", emoji: "❄️" },
  { weather: "rain", label: "비 · 꿉꿉", emoji: "🌧️" },
  { weather: "mild", label: "보통", emoji: "⛅" },
];

/** 날씨 한 개를 어울리는 vibe 들로 옮긴다. */
export function weatherVibes(weather: Weather): Vibe[] {
  switch (weather) {
    case "hot":
      return ["light", "quick"];
    case "cold":
      return ["warm", "hearty"];
    case "rain":
      return ["warm"];
    case "mild":
      return [];
  }
}

/** "장보기 추천" 에서 고르는 "땡기는 맛" 칩 (vibe 하위 집합). */
export const CRAVING_VIBES: Vibe[] = [
  "spicy",
  "hearty",
  "warm",
  "light",
  "quick",
  "homey",
  "guests",
];
