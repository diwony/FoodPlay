# 🍳 FoodPlay

냉장고에 있는 재료를 입력하면, 만들 수 있는 **유튜브 요리 영상**을 찾아주고
조리 스텝마다 붙은 **타임스탬프를 누르면 영상의 그 장면으로 바로 이동**하는 앱.

- 영상은 화면 위, 조리 스텝 텍스트는 그 아래 — 스크롤하면 영상이 **우상단 미니
  플레이어(PiP)** 로 축소·고정되어 계속 보임
- 레시피마다 **롱폼(자세히·타임스탬프) / 숏폼(빠르게)** 을 토글로 선택.
  롱폼은 유튜브 고정(타임스탬프 seek), 숏폼은 유튜브 쇼츠 기본 + **네이버TV** 도 섞음
- 영상과 별개로 **블로그 레시피**(만개의레시피·우리의식탁·브런치 등) 추천
- 각 레시피의 **추가 재료 · 조리 시간 · 난이도**, **유튜브 댓글 반응 요약**,
  **추천 영상 캐러셀** 표시
- 시작을 **3가지 모드**로 나눔 — ① 냉장고 재료로 만들기(재료 없이 **오늘 기분·
  상황만 골라도** 추천) ② 밀키트 푸짐하게 보충(곁들일 반찬 + 더 넣을 재료)
  ③ 장보기 추천(예산·날씨·땡기는 맛 → 오늘 저녁 + 장 볼 목록)
- 기분·상황은 칩 선택 + 자유 입력("비 와서 으슬으슬해" → 키워드 자동 인식)
- 결과 아래 **"유튜브에서 더 찾기"** 칸이 미리 수집한 1,000+ 관련 영상(274개
  채널)을 조회수 순으로 보여줌 — 런타임에 외부 API 를 안 부른다
- **웹**은 별도 React(Vite) 앱, **모바일 앱**은 Expo(React Native). 매칭·데이터
  로직은 `@foodplay/core` 패키지로 100% 공유

`prjsingle` 포트폴리오의 개인 프로젝트(PERSONAL PROJECT 카드, 슬롯 04·05 통합).

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
| 데이터 | 빌드 타임 큐레이션 (`packages/core/src/data/recipes.json`) + 유튜브 관련영상 풀 (`apps/web/public/youtube-pool.json`) |

## 구조

```
packages/core/     웹·앱 공유 순수 로직 — 재료 파싱 · 매칭/랭킹 · vibe · 예산 · 포맷 · recipes.json
apps/web/          Vite React 웹 (주력)
  src/pages/       Landing(3모드) · Fridge · MealKit · Shop · Recipe · Watch(/yt/:id)
  src/components/  RecipeCard · ResultList · IngredientField · VibeField · YouTubeRail · …
  src/lib/         useYouTube(IFrame) · useMiniPlayer(PiP) · youtubePool · curated
  public/          youtube-pool.json (관련 영상 풀)
app/  src/  (루트)  Expo Router 모바일 앱 (+ RN-web 프리뷰)
pipeline/          영상 큐레이션 · 댓글 · 유튜브 풀 수집 스크립트
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
