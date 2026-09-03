/**
 * 재료 입력 파싱과 정규화. 웹/앱 공유.
 *
 * 사용자는 "김치, 계란 대파/두부" 처럼 자유롭게 입력한다. 이를 표준 명사
 * 리스트로 바꾸고, 흔한 동의어를 하나로 합친다.
 */

/** 동의어 → 표준어 매핑. 표준어는 recipes.json 의 coreIngredients 와 맞춘다. */
const SYNONYMS: Record<string, string> = {
  달걀: "계란",
  계란후라이: "계란",
  파: "대파",
  쪽파: "대파",
  대파흰부분: "대파",
  돼지고기앞다리: "돼지고기",
  돈육: "돼지고기",
  삼겹살: "돼지고기",
  목살: "돼지고기",
  소고기양지: "소고기",
  쇠고기: "소고기",
  우육: "소고기",
  두부한모: "두부",
  찬밥: "밥",
  즉석밥: "밥",
  햇반: "밥",
  묵은지: "김치",
  신김치: "김치",
  배추김치: "김치",
  양파반개: "양파",
  당근채: "당근",
  애호박한개: "애호박",
  호박: "애호박",
  된장국된장: "된장",
  재래된장: "된장",
  고추장양념: "고추장",
  청양: "청양고추",
  콩나물한봉지: "콩나물",
  오뎅: "어묵",
  사각어묵: "어묵",
};

/** 매칭에서 무시할 흔한 양념 (거의 모든 집에 있다고 가정) */
export const PANTRY_STAPLES = new Set([
  "소금",
  "설탕",
  "간장",
  "식용유",
  "참기름",
  "후추",
  "물",
  "물엿",
  "깨소금",
  "고춧가루",
  "다진마늘",
  "맛술",
]);

/** 한 토큰을 정규화한다. 공백 제거 + 동의어 치환. */
export function normalizeIngredient(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, "").toLowerCase();
  return SYNONYMS[cleaned] ?? cleaned;
}

/** 자유 입력 문자열을 표준 재료 배열로 바꾼다. 쉼표/슬래시/줄바꿈/공백 구분. */
export function parseIngredients(input: string): string[] {
  const tokens = input
    .split(/[,\n/·]| {2,}/)
    .map(normalizeIngredient)
    .filter(Boolean);
  return Array.from(new Set(tokens));
}
