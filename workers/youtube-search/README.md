# foodplay-yt-search — 실시간 유튜브 검색 프록시

FoodPlay 앱은 GitHub Pages 정적 사이트라 API 키를 가질 수 없다. 이 Cloudflare
Worker 가 키를 **시크릿으로** 들고 대신 YouTube Data API v3 를 호출하며, 결과를
KV 에 24시간 캐시해 무료 할당량(하루 10,000유닛)을 아낀다.

앱의 "유튜브에서 더 찾기" / "같이 보는 먹방" 칸은 이 Worker 가 있으면 미리 모아둔
정적 풀(1층) **위에** 실시간 결과를 얹고, 없거나 할당량이 소진되면 조용히 1층만
보여준다.

## 배포 (한 번만)

```bash
cd workers/youtube-search
npm install
npx wrangler login                       # Cloudflare 계정 연결 (무료)

npx wrangler kv namespace create CACHE   # 출력된 id 를 wrangler.toml 의 id="" 에 채운다
npx wrangler secret put YT_API_KEY       # 프롬프트에 YouTube Data API 키 붙여넣기

npx wrangler deploy                      # 배포 → https://foodplay-yt-search.<서브도메인>.workers.dev
```

배포가 알려준 URL 을 앱에 연결한다 — `apps/web/.env` (gitignore 됨):

```
VITE_YT_PROXY_URL=https://foodplay-yt-search.<서브도메인>.workers.dev
```

그다음 웹을 다시 빌드·배포하면(`bash scripts/deploy-web.sh`) 실시간 칸이 켜진다.
`VITE_YT_PROXY_URL` 이 없으면 앱은 아무 일 없이 1층(정적 풀)만 쓴다.

## 로컬 개발

```bash
cp .dev.vars.example .dev.vars     # .dev.vars 에 키 넣기 (gitignore)
npm run dev                        # http://localhost:8787/search?q=김치찌개
```

## 엔드포인트

`GET /search?q=<검색어>&max=<1~20>` →
`{ videos: [{ id, title, channel, views }], cached?: true, quota?: true }`

오류·할당량 소진 시에도 `200` + `videos: []` 로 응답한다(앱이 폴백하도록).

## 남용 방어 (Rate Limiting)

`wrangler.toml` 의 `[[unsafe.bindings]]` `RATE_LIMITER` — Cloudflare 무료 내장
기능이고 시크릿·추가 비용이 없다. **캐시에 없어서 YouTube 를 실제로 호출할
때만** 카운트하며, 한 IP 가 60초에 20회를 넘기면 그 IP 만 잠깐 빈 결과
(`rateLimited: true`)를 받는다. 목적은 봇이 서로 다른 검색어로 하루 할당량
(10,000유닛, `search.list` 는 1회 100유닛)을 태우는 걸 막는 것.

`*.workers.dev` 도메인이라 대시보드 WAF Rate Limiting 규칙은 적용되지 않으므로
이 방식(코드 내 바인딩)을 쓴다. 값 조정은 `wrangler.toml` 의 `limit`/`period`
(`period` 는 10 또는 60만 허용) 를 고치고 `npx wrangler deploy`.

## CORS 출처 제한

브라우저에서 이 프록시를 부를 수 있는 출처는 `src/index.js` 의 `ALLOWED_ORIGINS`
로 제한된다 — FoodPlay 사이트(`https://diwony.github.io`)와 로컬 개발 포트만.
다른 웹사이트가 우리 API 를 자기 페이지에 임베드하는 걸 막는다. 브라우저 밖
(스크립트·직접 접속)은 CORS 와 무관하므로 그대로 응답하며, 그쪽 남용은 위의
Rate Limiting 이 담당한다. 사이트 도메인이 바뀌면 `ALLOWED_ORIGINS` 를 고친다.

## 키는 어디에도 커밋되지 않는다

- 운영: `wrangler secret` (Cloudflare 에만 저장)
- 로컬: `.dev.vars` (gitignore)
- `wrangler.toml` 에는 키가 없다
