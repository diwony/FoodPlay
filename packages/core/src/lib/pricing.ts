/**
 * "사 먹는 것보다 얼마 아끼나" — 만들어 먹기의 값을 보여주기 위한 대략 추정.
 *
 * 레시피마다 실제 가격을 입력하지 않고 재료 구성·계열·난이도에서 뽑는다(데모 수준).
 * 정확한 시세가 아니라 "대충 이 정도 아낀다"는 감을 주는 게 목적이다.
 */

import type { Cuisine, Recipe } from "../data/types";
import { PANTRY_STAPLES } from "./ingredients";

/** 재료별 대략 단가(원) — 마트에서 한 번 살 때 가격이 아니라 1인분에 쓰는 양 기준. */
const UNIT_PRICE: Record<string, number> = {
  // 육류·해산물
  소고기: 4500,
  돼지고기: 2500,
  닭: 2200,
  오징어: 3500,
  새우: 3500,
  바지락: 2500,
  스팸: 1800,
  참치캔: 1500,
  어묵: 1200,
  미역: 500,
  훈제오리: 3000,
  명란: 2800,
  대패삼겹살: 2800,
  우삼겹: 3200,
  차돌박이: 3800,
  // 채소·버섯
  대파: 400,
  양파: 400,
  감자: 500,
  당근: 400,
  애호박: 700,
  양배추: 700,
  부추: 600,
  콩나물: 500,
  버섯: 900,
  청양고추: 300,
  숙주: 500,
  청경채: 600,
  팽이버섯: 500,
  // 과일
  사과: 1200,
  바나나: 500,
  토마토: 800,
  아보카도: 2000,
  // 김치·장·밥·떡·기타
  김치: 700,
  두부: 1200,
  밥: 600,
  떡볶이떡: 1500,
  된장: 400,
  고추장: 400,
  계란: 400,
  냉동만두: 2000,
  라면사리: 700,
  분모자: 1500,
  두부면: 1800,
  곤약: 1500,
  쫄면: 1200,
  부라타치즈: 4000,
};

const DEFAULT_ITEM_PRICE = 1000;
/** 양념(집에 있다고 가정) 은 1인분에 이만큼만 잡는다. */
const PANTRY_PRICE = 150;

/**
 * 만들어 먹을 때 드는 대략 재료비(원, 1인분 환산).
 * 재료는 보통 2인분어치씩 사므로 절반으로 눌러 잡고, 최소 1,500원.
 */
export function estimateMakeCost(recipe: Recipe): number {
  const items = [...recipe.coreIngredients, ...recipe.extraIngredients];
  let sum = 0;
  for (const it of items) {
    sum += PANTRY_STAPLES.has(it)
      ? PANTRY_PRICE
      : (UNIT_PRICE[it] ?? DEFAULT_ITEM_PRICE);
  }
  return Math.max(1500, Math.round(sum / 2 / 100) * 100);
}

/** 같은 메뉴를 밖에서 사 먹을 때 대략 가격(원, 1인분). 계열·난이도로 잡는다. */
const EATOUT_BASE: Record<Cuisine, number> = {
  korean: 9000,
  japanese: 11000,
  western: 13000,
  chinese: 9500,
};

export function estimateEatOutPrice(recipe: Recipe): number {
  const base = recipe.cuisine ? EATOUT_BASE[recipe.cuisine] : 9000;
  const diff =
    recipe.difficulty === "hard"
      ? 4000
      : recipe.difficulty === "medium"
        ? 1500
        : 0;
  return Math.round((base + diff) / 500) * 500;
}

export interface CostBreakdown {
  /** 만들면 (1인분 재료비) */
  make: number;
  /** 사 먹으면 (1인분) */
  eatOut: number;
  /** 아끼는 금액 */
  save: number;
}

export function estimateCost(recipe: Recipe): CostBreakdown {
  const make = estimateMakeCost(recipe);
  const eatOut = estimateEatOutPrice(recipe);
  return { make, eatOut, save: Math.max(0, eatOut - make) };
}

/** 12345 → "12,345원" */
export function formatWon(won: number): string {
  return `${Math.round(won).toLocaleString("ko-KR")}원`;
}

/** 여러 레시피의 평균 절약액 — 모드 카드에 "평균 N원 아껴요" 같은 문구용. */
export function averageSaving(recipes: Recipe[]): number {
  if (recipes.length === 0) return 0;
  const total = recipes.reduce((s, r) => s + estimateCost(r).save, 0);
  return Math.round(total / recipes.length / 500) * 500;
}
