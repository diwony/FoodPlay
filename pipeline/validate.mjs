/**
 * recipes.json 스키마 검증. 의존성 없이 순수 JS.
 * build.mjs 와 `npm run pipeline:check` 에서 사용한다.
 */

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

/** @returns {string[]} 오류 메시지 목록 (빈 배열이면 통과) */
export function validateRecipe(r, index = 0) {
  const e = [];
  const at = `recipes[${index}]`;
  const str = (k) =>
    typeof r[k] === "string" && r[k].trim().length > 0 ||
    e.push(`${at}.${k}: 비어있지 않은 문자열이어야 함`);
  const arr = (k) =>
    Array.isArray(r[k]) && r[k].length > 0 ||
    e.push(`${at}.${k}: 최소 1개 원소의 배열이어야 함`);

  str("id");
  str("title");
  str("channel");
  if (!/^[\w-]{11}$/.test(r.youtubeId ?? ""))
    e.push(`${at}.youtubeId: 유튜브 ID 11자리여야 함 (받은 값: ${r.youtubeId})`);
  if (!Number.isInteger(r.cookMinutes) || r.cookMinutes <= 0)
    e.push(`${at}.cookMinutes: 양의 정수여야 함`);
  if (!DIFFICULTIES.has(r.difficulty))
    e.push(`${at}.difficulty: easy|medium|hard 중 하나여야 함`);
  arr("coreIngredients");
  arr("extraIngredients");

  if (!Array.isArray(r.steps) || r.steps.length < 3) {
    e.push(`${at}.steps: 최소 3개여야 함`);
  } else {
    let prev = -1;
    r.steps.forEach((s, i) => {
      if (!Number.isInteger(s.order) || s.order !== i + 1)
        e.push(`${at}.steps[${i}].order: ${i + 1} 이어야 함`);
      if (typeof s.text !== "string" || !s.text.trim())
        e.push(`${at}.steps[${i}].text: 비어있지 않은 문자열이어야 함`);
      if (!Number.isInteger(s.start) || s.start < 0)
        e.push(`${at}.steps[${i}].start: 0 이상 정수여야 함`);
      else if (s.start <= prev)
        e.push(`${at}.steps[${i}].start: 이전 스텝(${prev}s)보다 커야 함`);
      prev = s.start;
    });
  }
  return e;
}

export function validateDatabase(db) {
  const errors = [];
  if (typeof db.generatedAt !== "string")
    errors.push("generatedAt: 문자열이어야 함");
  if (!Array.isArray(db.recipes) || db.recipes.length === 0)
    errors.push("recipes: 비어있지 않은 배열이어야 함");
  else {
    const ids = new Set();
    db.recipes.forEach((r, i) => {
      errors.push(...validateRecipe(r, i));
      if (ids.has(r.id)) errors.push(`recipes[${i}].id: 중복된 id "${r.id}"`);
      ids.add(r.id);
    });
  }
  return errors;
}

// `node pipeline/validate.mjs` 로 직접 실행 시 현재 데이터 검사
const { fileURLToPath } = await import("node:url");
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { readFileSync } = await import("node:fs");
  const path = new URL("../src/data/recipes.json", import.meta.url);
  const db = JSON.parse(readFileSync(path, "utf8"));
  const errors = validateDatabase(db);
  if (errors.length) {
    console.error(`✗ ${errors.length}개 오류:\n` + errors.map((x) => "  - " + x).join("\n"));
    process.exit(1);
  }
  console.log(`✓ recipes.json 통과 (${db.recipes.length}개 레시피)`);
}
