# FoodPlay 큐레이션 파이프라인

앱은 **런타임에 유튜브 API 나 LLM 을 호출하지 않는다.** 대신 이 폴더의
스크립트가 빌드 타임에 한 번 돌아 `packages/core/src/data/recipes.json` 을 만든다.
웹과 앱은 그 정적 JSON 만 읽는다.

## 왜 큐레이션 JSON + Claude 파이프라인인가

| 대안 | 문제 |
| --- | --- |
| 런타임 YouTube Data API 검색 | 일 할당량, API 키 노출, 검색 결과 품질 편차, 오프라인 데모 불가 |
| 런타임 LLM 호출 | 화면 열 때마다 비용·지연, 결과 비결정적 |
| **빌드 타임 큐레이션 (채택)** | 사람이 영상 1개를 고르고, Claude 가 자막→구조화, 검증 후 커밋. 앱은 그냥 JSON 읽기 |

핵심은 **사람이 좋은 영상을 고르고**, Claude 는 반복 노동(자막에서 스텝·
타임스탬프·재료 추출)만 맡는다는 점이다.

## 흐름

```
sources.json              사람이 고른 영상 목록 (dish + youtubeId)
   │
   ├─ transcripts/<id>.txt   "[초] 텍스트" 형식 자막 (수동 또는 스크립트 수집)
   ├─ comments/<id>.json     상위 댓글 (fetch-comments.mjs 가 수집)
   │
   ▼
build.mjs  ──▶  Claude (claude-sonnet-5)  ──▶  Recipe JSON
   │                                              │  · steps + 타임스탬프
   │                                              │  · coreIngredients / extraIngredients
   │                                              │  · vibes (기분·상황 태그)
   │                                              │  · reception (댓글 요약 + 대표 인용)
   │                                     validate.mjs (스키마 + 타임스탬프 단조성)
   ▼
packages/core/src/data/recipes.json
```

## 댓글 반응 (`reception`)

`fetch-comments.mjs` 가 유튜브 공개 댓글을 가져온다. Data API 키가 필요 없는
비공식 innertube 엔드포인트를 쓴다(운영 시 YouTube Data API `commentThreads`
로 교체 권장).

```bash
npm run pipeline:comments          # sources.json 전체 → pipeline/comments/<id>.json
node pipeline/fetch-comments.mjs aDQIZDk1hAM   # 특정 영상만
```

`build.mjs` 는 이 댓글을 Claude 에 넘겨 `reception: { summary, quotes }` 를
만든다. 인용문은 원문 그대로 짧게, "유튜브 공개 댓글에서 발췌"로 표기한다.

## 명령

```bash
# 자막 없이 스키마만 검증 (CI 용)
node pipeline/validate.mjs

# 전체 재생성 (자막이 있는 항목만 Claude 호출, 나머지는 기존 항목 유지)
ANTHROPIC_API_KEY=sk-... node pipeline/build.mjs

# 특정 레시피만
ANTHROPIC_API_KEY=sk-... node pipeline/build.mjs kimchi-fried-rice

# 호출 없이 증분 검증
node pipeline/build.mjs --dry-run
```

## 자막 (`transcripts/`)

- 파일명은 `sources.json` 의 `id` 와 일치 (`kimchi-fried-rice.txt`).
- 형식: 한 줄에 `[초] 발화 텍스트`.
- `*.sample.txt` 는 형식 예시이며 빌드에서 무시된다 (실제 파일은 `<id>.txt`).
- 자막이 없는 항목은 `build.mjs` 가 기존 `recipes.json` 항목을 그대로
  유지하므로, 시드 데이터에서 점진적으로 교체할 수 있다.

## 타임스탬프 정확도

`validate.mjs` 는 `steps[].start` 가 **단조 증가**하고 정수인지까지만 본다.
"이 초가 정말 그 장면인가"는 Claude 가 자막 타임코드를 근거로 배치하고,
최종적으로 사람이 앱에서 스텝을 눌러보며 확인한다. 현재 커밋된
`recipes.json` 의 타임스탬프는 **시드 값**이며, 자막을 넣고 파이프라인을
돌리면 실제 값으로 교체된다.
