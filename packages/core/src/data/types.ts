/**
 * FoodPlay 큐레이션 데이터 모델.
 *
 * 이 타입들은 웹/앱 양쪽에서 공유된다. 실제 데이터(`recipes.json`)는
 * `pipeline/`의 Claude 파이프라인이 생성·검수한다. 앱은 런타임에 유튜브
 * API를 호출하지 않고, 이 정적 JSON만 읽는다.
 */

export type Difficulty = "easy" | "medium" | "hard";

/**
 * 기분·상황·날씨 키워드. 냉장고 재료와 별개로 사용자가 추가 선택하면
 * 매칭 점수에 가중치를 준다.
 */
export type Vibe =
  | "quick" // 간단하게
  | "hearty" // 든든하게 / 배고픔
  | "warm" // 뜨끈하게 / 꿉꿉·찌뿌둥·추운 날
  | "spicy" // 매콤하게 / 스트레스
  | "guests" // 집들이 / 손님상
  | "homey" // 엄마밥 / 집밥
  | "light"; // 가볍게

/** 조리 스텝. 특정 영상 구간과 1:1로 연결된다. */
export interface RecipeStep {
  /** 1부터 시작하는 스텝 번호 */
  order: number;
  /** 스텝 설명 (한국어) */
  text: string;
  /** 이 스텝이 시작되는 영상 시각(초). 클릭 시 여기로 seek 한다. */
  start: number;
}

/** 유튜브 댓글 반응 요약. 파이프라인이 상위 댓글을 읽어 정리한다. */
export interface Reception {
  /** 한 줄 총평 (예: "간 조절만 주의하면 대체로 성공했다는 평") */
  summary: string;
  /** 대표 댓글 몇 개 (원문 인용, 짧게) */
  quotes: { text: string; likes?: number }[];
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
  /** 유튜브 댓글 반응 요약 (선택) */
  reception?: Reception;
  /** 기분·상황 키워드 */
  vibes?: Vibe[];
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
