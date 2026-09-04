/**
 * FoodPlay 큐레이션 데이터 모델.
 *
 * 이 타입들은 웹/앱 양쪽에서 공유된다. 실제 데이터(`recipes.json`)는
 * `pipeline/`의 Claude 파이프라인이 생성·검수한다. 앱은 런타임에 유튜브
 * API를 호출하지 않고, 이 정적 JSON만 읽는다.
 */

export type Difficulty = "easy" | "medium" | "hard";

/**
 * 몇 인분인지 / 누구랑 먹는 그림인지. 카드·상세에 표시한다.
 * - solo: 혼밥 (1인)
 * - couple: 연인·둘이 (2인)
 * - family: 가족 (3~4인)
 * - party: 여럿이·손님상 (4인 이상)
 */
export type Serves = "solo" | "couple" | "family" | "party";

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
  | "light" // 가볍게
  | "convenience" // 편의점·간단 한끼 / 혼밥 / 편의점 정찬 (편스토랑 감성)
  | "side"; // 밀키트·배달에 곁들일 반찬 한 접시

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

export type VideoFormat = "long" | "short";

/**
 * 영상 출처. 기본 베이스는 유튜브이고, 네이버TV는 비중을 적게 두어
 * 숏폼(쇼츠) 슬롯에서만 쓴다. 롱폼은 스텝별 타임스탬프 seek 계약
 * (YouTube IFrame Player API) 때문에 유튜브로 고정한다.
 */
export type VideoProvider = "youtube" | "naver";

/** 상세 영상 — 스텝별 타임스탬프가 붙는다. 유튜브 전용. */
export interface LongVideo {
  /** 유튜브 영상 ID (watch?v= 뒤의 11자리) */
  youtubeId: string;
  channel: string;
  /**
   * 큐레이션 시점의 유튜브 조회수. 홈 목록을 "조회수 순"으로 정렬하고
   * 카드에 노출하는 데 쓴다. 큐레이터가 `sources.json` 에 직접 넣는다.
   * 없으면 정렬에서 뒤로 밀리고 카드에도 표시하지 않는다.
   */
  views?: number;
  steps: RecipeStep[];
}

/**
 * 숏폼(유튜브 쇼츠 세로 9:16 또는 네이버TV 짧은 클립) — 타임스탬프 없이
 * 빠르게 훑는 용도. `provider` 를 생략하면 유튜브로 본다.
 */
export interface ShortVideo {
  /** 생략 시 "youtube" */
  provider?: VideoProvider;
  /** provider 가 "youtube"(또는 생략)일 때: 영상 ID 11자리 */
  youtubeId?: string;
  /** provider 가 "naver"일 때: tv.naver.com/v/{id} 의 숫자 clip ID */
  naverClipId?: string;
  channel?: string;
}

/**
 * 블로그·웹 레시피 글 추천. 영상과 별개로 상세 화면에 독립된 칸으로 노출한다.
 * 유튜브 외 소스(네이버 블로그, 티스토리, 만개의레시피, 우리의식탁 등)를
 * 글 형태로 곁들이는 용도.
 */
export interface BlogLink {
  /** 글 제목 */
  title: string;
  /** 글쓴이 또는 매체 이름 */
  author: string;
  /** 출처 태그: "naver" | "tistory" | "brunch" | "10000recipe" | "wtable" | "etc" */
  source: string;
  /** 글 URL (http/https) */
  url: string;
}

export interface Recipe {
  id: string;
  title: string;
  /** 총 조리 시간(분) */
  cookMinutes: number;
  difficulty: Difficulty;
  /** 몇 인분 / 누구랑 먹는 그림인지 */
  serves?: Serves;
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
  /** 롱폼(상세) 영상 + 스텝 */
  long: LongVideo;
  /** 숏폼(요약) 영상. 없을 수도 있다. */
  short?: ShortVideo;
  /** 블로그·웹 레시피 글 추천. 없을 수도 있다. */
  blogs?: BlogLink[];
}

export interface RecipeDatabase {
  /** 파이프라인이 이 파일을 만든 날짜 (ISO) */
  generatedAt: string;
  recipes: Recipe[];
}
