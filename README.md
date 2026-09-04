# 🍳 FoodPlay

냉장고에 있는 재료를 입력하면, 만들 수 있는 **유튜브 요리 영상**을 찾아주고
조리 스텝마다 붙은 **타임스탬프를 누르면 영상의 그 장면으로 바로 이동**하는 앱.

- 영상은 화면 위, 조리 스텝 텍스트는 그 아래 — 스크롤하면 영상이 **우상단 미니
  플레이어(PiP)** 로 축소·고정되어 계속 보임
- 레시피마다 **롱폼(자세히·타임스탬프) / 숏폼(빠르게)** 을 토글로 선택.
  롱폼은 유튜브 고정(타임스탬프 seek), 숏폼은 유튜브 쇼츠 기본 + **네이버TV** 도 섞음
- 영상과 별개로 **블로그 레시피**(만개의레시피·우리의식탁·브런치 등) 추천
- 각 레시피의 **추가 재료 · 조리 시간 · 난이도 · 인분**(혼밥 / 둘이 / 가족 /
  여럿이), **유튜브 댓글 반응 요약**, **추천 영상 캐러셀** 표시
- 시작을 **4가지 모드**로 나눔 — ① 냉장고 재료로 만들기(재료 없이 **오늘 기분·
  상황만 골라도** 추천) ② 밀키트, 뭐 더해서 먹어요(**이미 있는 밀키트 + 집에
  있는 재료 → 더 푸짐하게·다른 요리로**, 예: 불닭볶음면+크림소스→크림불닭볶음면)
  ③ 장보기 추천(예산·날씨·땡기는 맛 → 오늘 저녁 + 장 볼 목록) ④ 디저트·베이킹
  (**본격 베이킹 / 간단 베이킹 / 음료·아이스크림** + 집에 있는 재료 · 요즘 뜨는 디저트)
- 재료·밀키트 종류·베이킹 재료는 칩 선택뿐 아니라 **직접 입력**해 추가할 수
  있음(기기별 저장) — "가진 재료로 만든다"가 핵심이라 목록에 없는 것도 넣는다
- 재료·기분·밀키트 종류를 고르면 **결과 레시피와 유튜브 영상이 실제로 좁혀짐**.
  기분·상황은 칩 선택 + 자유 입력("비 와서 으슬으슬해" → 키워드 자동 인식)
- 결과 아래 **"유튜브에서 더 찾기"** + **"같이 보는 먹방"** 칸이 **2층**으로 뜸 —
  ① 미리 수집한 11,000+ 관련 영상 풀(조회수 순) 위에 ② 검색 순간의 **실시간
  유튜브 결과**를 얹고 "실시간" 배지를 붙인다. 실시간은 API 키를 숨긴 서버리스
  프록시(Cloudflare Workers, 24h 캐시)를 거치며, 프록시가 없거나 할당량이 소진돼도
  1층 풀로 조용히 폴백해 화면이 비지 않는다. 요즘 뜨는 재료·디저트도 계속 수집해 넓힘
- **웹**은 별도 React(Vite) 앱, **모바일 앱**은 Expo(React Native). 매칭·데이터
  로직은 `@foodplay/core` 패키지로 100% 공유

1인 개인 프로젝트 — 기획 · 디자인 · 프론트엔드 · 데이터 파이프라인.

## 바로 실행 (설치 불필요)

**웹 데모: https://diwony.github.io/FoodPlay/**

<img src="docs/qr.png" alt="FoodPlay 웹 데모 QR" width="220" />

## 스택

| 영역 | 선택 |
| --- | --- |
| 공유 로직 | `@foodplay/core` — 재료 정규화 · 매칭/랭킹 · vibe · 예산 추정 · 포맷 · `recipes.json` (순수 TS, 의존성 0) |
| 웹 | **Vite + React 19 + React Router + Tailwind v4** (`apps/web`) |
| 모바일 앱 | **Expo + React Native 0.86 + Expo Router** (루트) |
| 영상 | 웹: YouTube IFrame Player API + 네이버TV `tv.naver.com/embed` iframe / 앱: `react-native-youtube-iframe` (동일한 `seekTo`·`pause` 계약) |
| 데이터 (1층) | 빌드 타임 큐레이션 (`packages/core/src/data/recipes.json`) + 유튜브 관련영상·먹방·디저트 풀 (`apps/web/public/youtube-pool.json`, 11,000+ 영상). 풀은 `pipeline/collect-youtube.mjs` 가 **공식 YouTube Data API v3** 로 수집(로컬, 키는 `.env`) |
| 실시간 (2층) | `workers/youtube-search/` — API 키를 시크릿으로 숨긴 **Cloudflare Workers** 검색 프록시(24h KV 캐시). 앱은 풀 위에 실시간 결과를 얹고 "실시간" 배지를 붙이며, 프록시·할당량이 없으면 1층으로 폴백 |
| 사용자 입력 저장 | 직접 추가한 재료·밀키트는 `localStorage` (기기별, 계정 없음) |

## 구조

```
packages/core/     웹·앱 공유 순수 로직 — 재료 파싱 · 매칭/랭킹 · vibe · 예산 · 포맷 · recipes.json
apps/web/          Vite React 웹 (주력)
  src/pages/       Landing(4모드) · Fridge · MealKit · Shop · Dessert · Recipe · Watch(/yt/:id)
  src/components/  RecipeCard · ResultList · IngredientField · VibeField · YouTubeRail · MukbangRail · AddChipInput · …
  src/lib/         useYouTube(IFrame) · useMiniPlayer(PiP) · youtubePool(1층) · youtubeLive(2층 실시간) · useLocalList · curated
  public/          youtube-pool.json (관련 영상·먹방·디저트 풀)
app/  src/  (루트)  Expo Router 모바일 앱 (+ RN-web 프리뷰)
pipeline/          영상 큐레이션 · 댓글 · 유튜브 풀 수집(공식 Data API) 스크립트
workers/           Cloudflare Workers — 실시간 유튜브 검색 프록시(키 은닉·캐시)
```

## 실행

```bash
# 웹 (Vite React) — 주력
npm install --prefix apps/web
npm run dev --prefix apps/web            # http://localhost:5173

# 모바일 앱 (Expo)
npm install
npm run android                          # Android 에뮬레이터 / 실기기
npm start                                # QR → Expo Go
```

> iOS 시뮬레이터는 macOS 필요. Windows 에서는 Android 에뮬레이터 + 웹 +
> Expo Go(실기기) 로 전체 기능 확인 가능.

## 라이선스

**모든 권리 보유 (All Rights Reserved)** — [`LICENSE`](LICENSE) 참고.
이 저장소는 포트폴리오 열람·평가 목적으로만 공개됩니다. 코드 열람과 GitHub
포크는 자유지만, 사전 서면 허가 없이 사용·실행·복제·수정·재배포할 수 없습니다.
문의: gjiwon566@gmail.com
