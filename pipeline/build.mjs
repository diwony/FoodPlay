/**
 * 큐레이션 파이프라인.
 *
 *   sources.json  +  transcripts/<id>.txt  ──▶  Claude  ──▶  packages/core/src/data/recipes.json
 *
 * 실행:
 *   ANTHROPIC_API_KEY=... node pipeline/build.mjs            # 전체
 *   ANTHROPIC_API_KEY=... node pipeline/build.mjs kimchi-fried-rice   # 일부
 *   node pipeline/build.mjs --dry-run                         # 호출 없이 검증만
 *
 * 설계 메모: 앱은 런타임에 유튜브/LLM 을 호출하지 않는다. 이 스크립트가
 * 빌드 타임에 한 번 돌아 정적 JSON 을 만든다. 이유는 pipeline/README.md 참고.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateRecipe, validateDatabase } from "./validate.mjs";

const ROOT = new URL("..", import.meta.url);
const MODEL = "claude-sonnet-5";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.filter((a) => !a.startsWith("--"));

const { sources } = JSON.parse(
  readFileSync(new URL("pipeline/sources.json", ROOT), "utf8"),
);
const promptDoc = readFileSync(new URL("pipeline/prompt.md", ROOT), "utf8");
const SYSTEM = promptDoc
  .split("## System")[1]
  .split("## User")[0]
  .trim();

const targets = only.length
  ? sources.filter((s) => only.includes(s.id))
  : sources;

/** transcripts/<id>.txt 를 읽는다. 없으면 null. */
function loadTranscript(id) {
  const p = new URL(`pipeline/transcripts/${id}.txt`, ROOT);
  return existsSync(p) ? readFileSync(p, "utf8").trim() : null;
}

async function callClaude(source, transcript) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const user =
    `dish: ${source.dish}\nyoutubeId: ${source.youtubeId}\n\n` +
    `아래는 자막입니다. 형식은 "[초] 텍스트" 입니다.\n\n${transcript}`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content.find((c) => c.type === "text")?.text ?? "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

const recipes = [];
let failed = 0;

for (const source of targets) {
  const transcript = loadTranscript(source.id);

  if (dryRun || !transcript) {
    // 자막이 없으면 기존 recipes.json 의 항목을 그대로 유지 (증분 빌드)
    const existing = JSON.parse(
      readFileSync(new URL("packages/core/src/data/recipes.json", ROOT), "utf8"),
    ).recipes.find((r) => r.id === source.id);
    if (existing) {
      recipes.push(existing);
      console.log(`· ${source.id}: 자막 없음 → 기존 항목 유지`);
    } else {
      console.warn(`! ${source.id}: 자막도 기존 항목도 없음 → 건너뜀`);
    }
    continue;
  }

  try {
    const recipe = await callClaude(source, transcript);
    // 큐레이터가 sources.json 에 직접 고른 필드는 모델 출력보다 우선한다.
    if (source.short) recipe.short = source.short;
    if (source.blogs) recipe.blogs = source.blogs;
    const errors = validateRecipe(recipe, recipes.length);
    if (errors.length) {
      failed++;
      console.error(`✗ ${source.id}: 검증 실패\n` + errors.map((e) => "    " + e).join("\n"));
      continue;
    }
    recipes.push(recipe);
    console.log(`✓ ${source.id}: ${recipe.long.steps.length} 스텝`);
  } catch (err) {
    failed++;
    console.error(`✗ ${source.id}: ${err.message}`);
  }
}

const db = { generatedAt: new Date().toISOString().slice(0, 10), recipes };
const dbErrors = validateDatabase(db);
if (dbErrors.length) {
  console.error("✗ 최종 DB 검증 실패:\n" + dbErrors.map((e) => "  " + e).join("\n"));
  process.exit(1);
}

if (!dryRun) {
  const out = fileURLToPath(new URL("packages/core/src/data/recipes.json", ROOT));
  writeFileSync(out, JSON.stringify(db, null, 2) + "\n");
  console.log(`\n📝 ${out} (${recipes.length}개 레시피)`);
}
if (failed) process.exit(1);
