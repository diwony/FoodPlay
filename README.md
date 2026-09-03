# 🍳 FoodPlay

냉장고에 있는 재료를 입력하면, 만들 수 있는 **유튜브 요리 영상**을 찾아주고
조리 스텝마다 붙은 **타임스탬프를 누르면 영상의 그 장면으로 바로 이동**하는 앱.

- 영상은 화면 위, 조리 스텝 텍스트는 그 아래 — 스크롤하면 영상이 **우상단 미니
  플레이어(PiP)** 로 축소·고정되어 계속 보임
- 레시피마다 **롱폼(자세히·타임스탬프) / 숏폼(빠르게)** 을 토글로 선택.
  롱폼은 유튜브 고정(타임스탬프 seek), 숏폼은 유튜브 쇼츠가 기본이고
  **네이버TV** 도 비중 적게 섞음
- 영상과 별개로 **블로그 레시피**(만개의레시피·우리의식탁·브런치 등)를
  상세 화면 별도 칸에 추천
- 각 레시피의 **추가로 필요한 재료 · 조리 시간 · 난이도**, **유튜브 댓글 반응
  요약**, **추천 영상 가로 캐러셀** 표시
- 시작을 **3가지 모드**로 나눔 — ① 냉장고 재료로 만들기(재료 없이 **오늘 기분·
  상황만 골라도** 추천) ② 밀키트 푸짐하게 보충(곁들일 반찬 + 더 넣을 재료)
  ③ 장보기 추천(예산·날씨·땡기는 맛 → 오늘 저녁 + 장 볼 목록)
- 기분·상황은 칩 선택 + 자유 입력("비 와서 으슬으슬해" → 키워드 자동 인식)
- 레시피는 **여러 유튜버**에서 큐레이션 (백종원 · 이 남자의 cook · 자취요리신 ·
  성시경 · 김대석 셰프 · 딸을 위한 레시피 · 정호영 · 하루한끼 …)
- **웹**은 별도 React(Vite) 앱, **모바일 앱**은 Expo(React Native). 매칭·데이터
  로직은 `@foodplay/core` 패키지로 100% 공유
- 데이터는 **큐레이션 JSON + Claude 파이프라인**이 본체. 그 아래 **"유튜브에서
  더 찾기"** 칸이 큐레이션 밖의 관련 영상을 유튜브 전체에서 끌어옴 (웹, 선택적
  YouTube Data API 키 — 없으면 유튜브 검색 링크로 대체)

`prjsingle` 포트폴리오의 개인 프로젝트(PERSONAL PROJECT 카드, 슬롯 04·05 통합).

## 바로 실행 (설치 불필요)

**웹 데모: https://diwony.github.io/FoodPlay/** — `apps/web` (Vite React) 빌드가 GitHub Pages 로 배포됨

<img src="docs/qr.png" alt="FoodPlay 웹 데모 QR" width="220" />

재배포: `npm run deploy:web` (`apps/web` 빌드 → `gh-pages` 브랜치 push).

## 스택

| 영역 | 선택 |
| --- | --- |
| 공유 로직 | `@foodplay/core` — 재료 정규화 · 매칭/랭킹 · vibe · 포맷 · `recipes.json` (순수 TS, 의존성 0) |
| 웹 | **Vite + React 19 + React Router + Tailwind v4** (`apps/web`) |
| 모바일 앱 | **Expo + React Native 0.86 + Expo Router** (루트) |
| 영상 | 웹: YouTube IFrame Player API + 네이버TV `tv.naver.com/embed` iframe / 앱: `react-native-youtube-iframe`, 네이버TV 는 외부 링크 (동일한 `seekTo`·`pause` 계약) |
| 데이터 | `packages/core/src/data/recipes.json` + `pipeline/` (빌드 타임 Claude 큐레이션) |

## 구조

```
packages/core/           웹·앱 공유. UI·플랫폼 의존성 없음
  index.ts               배럴 export (@foodplay/core)
  src/data/              recipes.json + 타입 (Recipe · Vibe · Reception)
  src/lib/               ingredients · match (재료+vibe 랭킹, relatedRecipes) · vibes (parseVibes) · format

apps/web/                Vite React 웹 (주력 화면)
  src/pages/             Landing(3모드) · Fridge(재료·기분) · MealKit(밀키트 곁들임)
                         · Shop(장보기: 예산·날씨·맛) · Recipe · Watch(/yt/:id) · NotFound
  src/components/        RecipeCard · ResultList · IngredientField · VibeField · RelatedRail
                         · ReceptionBlock · YouTubeRail
  src/lib/               useYouTube (IFrame API) · useMiniPlayer (스크롤 시 PiP) · youtube / useYouTubeSearch

app/  src/  (루트)       Expo Router 모바일 앱 (+ RN-web 프리뷰)
  app/index.tsx          재료·기분 입력 + 결과
  app/recipe/[id].tsx    영상(위) + 스텝·타임스탬프(아래) + 댓글 반응 + 추천 캐러셀
  src/components/         YouTubePlayer(.tsx=웹 / .native.tsx=앱) 등

pipeline/                sources.json + 자막 + 댓글 → Claude → recipes.json
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

## 유튜브에서 더 찾기 (선택)

큐레이션 레시피(스텝 타임스탬프)가 본체다. 홈 결과 아래 **"유튜브에서 더 찾기"**
칸은 큐레이션에 없는 채널까지 유튜브 전체에서 관련 영상을 끌어온다.

- **키 없이 배포된 상태**: 유튜브 검색 결과 페이지로 보내는 링크로 동작한다.
- **`VITE_YT_API_KEY` 를 넣으면**: 앱 안에서 바로 결과 그리드를 띄우고,
  누르면 `/yt/:id` 에서 재생한다. 검색 1회 = 쿼터 100units 라 자동 호출은
  안 하고 버튼을 눌러야 돈다(세션 캐시).

설정: `apps/web/.env.example` 참고 → `apps/web/.env.local` 에 키 저장
(git 제외). 정적 사이트라 키는 번들에 노출되므로 Google Cloud Console 에서
HTTP 리퍼러를 `https://diwony.github.io/*` 로 잠근다.

## 데이터 파이프라인

`pipeline/README.md` 참고. 요약:

```
sources.json (사람이 고른 영상)  +  자막  ──▶  Claude  ──▶  recipes.json
                                                     └ validate.mjs (스키마·타임스탬프 검증)
```

```bash
npm run pipeline:check                       # 스키마 검증 (CI)
ANTHROPIC_API_KEY=sk-... npm run pipeline     # 재생성
```

## 품질 체크

```bash
npm run pipeline:check                    # recipes.json 스키마·타임스탬프 검증
npm run typecheck                         # 모바일(Expo) 타입체크
npm run typecheck --prefix apps/web       # 웹 타입체크
npm run build --prefix apps/web           # 웹 프로덕션 번들
```

## 라이선스

**모든 권리 보유 (All Rights Reserved)** — [`LICENSE`](LICENSE) 참고.
이 저장소는 포트폴리오 열람·평가 목적으로만 공개됩니다. 코드 열람과 GitHub
포크는 자유지만, 사전 서면 허가 없이 사용·실행·복제·수정·재배포할 수 없습니다.
문의: gjiwon566@gmail.com
