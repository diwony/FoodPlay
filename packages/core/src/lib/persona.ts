/**
 * "어떤 분이세요?" — 홈에서 고르는 대상(페르소나).
 *
 * 로그인이 없으므로 고른 값은 기기(localStorage)에 저장하고, 추천 랭킹의
 * 기본 기분(vibe)·인분(serves)을 슬쩍 당기는 데 쓴다. 하드 필터는 아니다 —
 * 고르지 않아도 서비스는 그대로 돌아간다.
 */

import type { Serves, Vibe } from "../data/types";

export type Persona =
  | "student"
  | "solo"
  | "worker"
  | "couple"
  | "homemaker"
  | "diet";

/** 홈의 4가지 시작 모드 키 (경로에서 앞부분만) */
export type ModeKey = "fridge" | "mealkit" | "shop" | "dessert";

export interface PersonaMeta {
  persona: Persona;
  emoji: string;
  label: string;
  /** 칩 아래 한 줄 설명 */
  blurb: string;
  /** 이 페르소나가 기본으로 당기는 기분 */
  vibes: Vibe[];
  /** 기본 인분 */
  serves: Serves;
  /** 이 페르소나에게 보여줄 시작 모드 우선순위(앞이 먼저) */
  modes: ModeKey[];
}

export const PERSONAS: PersonaMeta[] = [
  {
    persona: "student",
    emoji: "🎒",
    label: "자취생",
    blurb: "10분 안에, 설거지 적게",
    vibes: ["quick", "convenience"],
    serves: "solo",
    modes: ["fridge", "mealkit", "shop", "dessert"],
  },
  {
    persona: "solo",
    emoji: "🧑",
    label: "1인가구",
    blurb: "한 끼 딱 알맞게",
    vibes: ["convenience", "light"],
    serves: "solo",
    modes: ["fridge", "shop", "dessert", "mealkit"],
  },
  {
    persona: "worker",
    emoji: "💼",
    label: "직장인",
    blurb: "퇴근하고 후딱, 든든하게",
    vibes: ["quick", "hearty"],
    serves: "solo",
    modes: ["mealkit", "fridge", "shop", "dessert"],
  },
  {
    persona: "couple",
    emoji: "🧑‍🤝‍🧑",
    label: "커플 · 신혼",
    blurb: "둘이 먹기 좋은",
    vibes: ["homey", "guests"],
    serves: "couple",
    modes: ["shop", "fridge", "mealkit", "dessert"],
  },
  {
    persona: "homemaker",
    emoji: "🏠",
    label: "주부",
    blurb: "가족 반찬 · 한상 차림",
    vibes: ["homey", "hearty"],
    serves: "family",
    modes: ["shop", "fridge", "dessert", "mealkit"],
  },
  {
    persona: "diet",
    emoji: "🥗",
    label: "다이어터",
    blurb: "가볍고 담백하게",
    vibes: ["light"],
    serves: "solo",
    modes: ["fridge", "shop", "dessert", "mealkit"],
  },
];

export function personaMeta(p: Persona): PersonaMeta | undefined {
  return PERSONAS.find((x) => x.persona === p);
}

/** 고른 페르소나가 당기는 기분·인분. 없으면 빈 값. */
export function personaBias(p: Persona | null): {
  vibes: Vibe[];
  serves?: Serves;
} {
  const meta = p ? personaMeta(p) : undefined;
  return meta ? { vibes: meta.vibes, serves: meta.serves } : { vibes: [] };
}
