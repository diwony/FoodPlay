/**
 * FoodPlay 큐레이션 데이터 모델.
 *
 * 이 타입들은 웹/앱 양쪽에서 공유된다. 실제 데이터(`recipes.json`)는
 * `pipeline/`의 Claude 파이프라인이 생성·검수한다. 앱은 런타임에 유튜브
 * API를 호출하지 않고, 이 정적 JSON만 읽는다.
 */

export type Difficulty = "easy" | "medium" | "hard";

/** 조리 스텝. 특정 영상 구간과 1:1로 연결된다. */
export interface RecipeStep {
  /** 1부터 시작하는 스텝 번호 */
  order: number;
  /** 스텝 설명 (한국어) */
  text: string;
  /** 이 스텝이 시작되는 영상 시각(초). 클릭 시 여기로 seek 한다. */
  start: number;
}

export interface Recipe {
  id: string;
  title: string;
  /** 유튜브 영상 ID (watch?v= 뒤의 11자리) */
  youtubeId: string;
  channel: string;
  /** 총 조리 시간(분) */
  cookMinutes: number;
  difficulty: Difficulty;
  /**
   * 사용자가 냉장고에 갖고 있다고 가정하는 핵심 재료들.
   * 매칭은 이 배열을 기준으로 한다. 모두 정규화된 소문자 한국어 명사.
   */
  coreIngredients: string[];
  /** 레시피에 필요하지만 냉장고에 없을 가능성이 큰 추가 재료 */
  extraIngredients: string[];
  steps: RecipeStep[];
}

export interface RecipeDatabase {
  /** 파이프라인이 이 파일을 만든 날짜 (ISO) */
  generatedAt: string;
  recipes: Recipe[];
}
