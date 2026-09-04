# 🍳 FoodPlay

냉장고에 있는 재료를 넣으면 만들 수 있는 **유튜브 요리 영상**을 찾아주고,
조리 스텝의 **타임스탬프를 누르면 영상의 그 장면으로 바로 이동**하는 앱.

1인 개인 프로젝트 — 기획 · 디자인 · 프론트엔드 · 데이터 파이프라인.

<img src="docs/screenshots/landing-home.jpg" alt="FoodPlay 홈 화면" width="820" />

**웹 데모: https://diwony.github.io/FoodPlay/**
&nbsp;·&nbsp; 프로젝트 소개서: [`docs/CASE-STUDY.md`](docs/CASE-STUDY.md) · [PDF](docs/FoodPlay-소개서.pdf)

<img src="docs/qr.png" alt="FoodPlay 웹 데모 QR" width="150" />

---

## 기능

### 🎬 레시피 재생
- 영상은 화면 위, 조리 스텝은 그 아래 — 스크롤하면 영상이 **우상단 미니 플레이어(PiP)** 로 축소·고정
- **롱폼(자세히·타임스탬프) / 숏폼(빠르게)** 토글. 숏폼은 유튜브 쇼츠 + **네이버TV**도 섞음
- 레시피마다 추가 재료 · 조리 시간 · 난이도 · 인분, **댓글 반응 요약**, **블로그 레시피** 추천
- **사 먹으면 얼마 vs 만들면 얼마**를 추정해 절약 금액 표시

### 🥬 4가지 시작 모드
재료 없이 기분만 골라도 되는 **냉장고 재료** · 있는 밀키트에 더할 재료를 찾는 **밀키트** ·
예산·날씨로 오늘 저녁 + 장 볼 목록을 뽑는 **장보기** · **디저트·베이킹**.
재료·기분은 칩 선택뿐 아니라 자유 입력도 되고, 실제로 결과가 좁혀진다.

### 🔍 홈 — 검색 없이 훑어보다 발견
- **오늘은 이거 어때요?** — 계절 추천이 접속마다 회전. 그 자리에서 바로 영상 재생
- **실시간 인기 요리** — 유튜버가 아니라 **메뉴 단위** 랭킹, 실검처럼 넘어감
- **요즘 뜨는** / **이번 달 제철** / **이런 것도 있어요**(탐색 그리드) 레일
- **어떤 분이세요?** — 자취생·1인가구·직장인·커플·주부·다이어터를 고르면 홈 전체가 그 사람 맞춤으로

### 📺 유튜브 검색 결과 재생 (`/yt/:id`)
큐레이션 안 된 영상도 **설명글 + 자막(CC) + 수집 태그**를 합쳐 "냉장고에 이런 게 있어야 해요" 재료
체크리스트를 보여주고, 아래에 "이어서 볼 만한 영상"을 이어 붙인다.

### 🌐 2층 데이터 (실시간 + 정적 폴백)
"유튜브에서 더 찾기" · "같이 보는 먹방"은 **미리 수집한 11,000+ 영상 풀(1층)** 위에
**실시간 유튜브 결과(2층)**를 얹는다. 실시간은 API 키를 숨긴 Cloudflare Workers 프록시를 거치며,
프록시가 없거나 할당량이 소진돼도 1층으로 조용히 폴백해 화면이 비지 않는다.

---

## 스택

| 영역 | 선택 |
| --- | --- |
| 공유 로직 | `@foodplay/core` — 재료 정규화 · 매칭/랭킹 · vibe · 페르소나 · 절약 추정 · 계절/트렌드 추천 · `recipes.json` (순수 TS, 의존성 0) |
| 웹 | **Vite + React 19 + React Router + Tailwind v4** (`apps/web`) |
| 모바일 앱 | **Expo + React Native 0.86 + Expo Router** (루트) |
| 영상 | 웹: YouTube IFrame Player API + 네이버TV iframe / 앱: `react-native-youtube-iframe` (동일한 `seekTo`·`pause` 계약) |
| 데이터 (1층) | 빌드 타임 큐레이션(`recipes.json`) + 유튜브 영상 풀(11,000+, `pipeline/collect-youtube.mjs`가 공식 Data API v3로 수집) |
| 실시간 (2층) | `workers/youtube-search/` — Cloudflare Workers 프록시. `/search` · `/video` · `/transcript`(자막) |
| 사용자 입력 저장 | 재료·페르소나 등은 `localStorage` (기기별, 계정 없음) |

## 구조

```
packages/core/     웹·앱 공유 순수 로직 — 매칭/랭킹 · vibe · 페르소나 · 절약 · 계절/트렌드 · recipes.json
apps/web/          Vite React 웹 (주력)
  src/pages/       Landing(발견 홈) · Fridge · MealKit · Shop · Dessert · Recipe · Watch(/yt/:id)
  src/components/  DailyHero · PopularTicker · SeasonalPicks · TrendingRail · ExploreGrid ·
                    PersonaChips · RecipeCard · ResultList · …
  src/lib/         useYouTube(IFrame) · useMiniPlayer(PiP) · useDragScroll · usePersona ·
                    youtubePool(1층) · youtubeLive(2층+자막)
app/  src/  (루트)  Expo Router 모바일 앱 (+ RN-web 프리뷰)
pipeline/          영상 큐레이션 · 댓글 · 유튜브 풀 수집 스크립트
workers/           Cloudflare Workers — 실시간 검색·영상 상세·자막 프록시
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

> iOS 시뮬레이터는 macOS 필요. Windows에서는 Android 에뮬레이터 + 웹 + Expo Go(실기기)로
> 전체 기능 확인 가능.

## 라이선스

**모든 권리 보유 (All Rights Reserved)** — [`LICENSE`](LICENSE) 참고.
이 저장소는 포트폴리오 열람·평가 목적으로만 공개됩니다. 코드 열람과 GitHub 포크는 자유지만,
사전 서면 허가 없이 사용·실행·복제·수정·재배포할 수 없습니다.
문의: gjiwon566@gmail.com
