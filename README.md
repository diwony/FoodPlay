# 🍳 FoodPlay

냉장고에 있는 재료를 입력하면, 만들 수 있는 **유튜브 요리 영상**을 찾아주고
조리 스텝마다 붙은 **타임스탬프를 누르면 영상의 그 장면으로 바로 이동**하는 앱.

- 영상은 화면 위, 조리 스텝 텍스트는 그 아래 — 스크롤하면 영상이 **우상단 미니
  플레이어(PiP)** 로 축소·고정되어 계속 보임
- 각 레시피의 **추가로 필요한 재료 · 조리 시간 · 난이도**, **유튜브 댓글 반응
  요약**, **추천 영상 가로 캐러셀** 표시
- 냉장고 재료(1개만 골라도 매칭) + **오늘 기분·상황 키워드**(간단하게 / 배고픔 /
  꿉꿉·으슬으슬 / 스트레스·매운거 / 집들이 / 엄마밥 …)로 맞춤 추천
- **웹 + 모바일 앱을 한 코드베이스**에서 (Expo Router). 로직은 100% 공유
- 데이터는 **큐레이션 JSON + Claude 파이프라인** — 앱은 런타임에 외부 API 를 안 부른다

`prjsingle` 포트폴리오의 개인 프로젝트(PERSONAL PROJECT 카드, 슬롯 04·05 통합).

## 바로 실행 (설치 불필요)

**웹 데모: https://diwony.github.io/FoodPlay/** — 폰 브라우저에서 바로 열림. Expo Go 안 받아도 됨.

<img src="docs/qr.png" alt="FoodPlay 웹 데모 QR" width="220" />

재배포: `npm run deploy:web` (웹 빌드 → `gh-pages` 브랜치 push).

## 스택

| 영역 | 선택 |
| --- | --- |
| 런타임 | React 19 + React Native 0.86 (New Architecture) |
| 라우팅/공유 | Expo Router — `app/` 파일 라우팅이 웹·iOS·Android 동시 타깃 |
| 웹 | react-native-web, 정적 렌더링(`output: "static"`) |
| 영상 | 웹: YouTube IFrame Player API / 네이티브: `react-native-youtube-iframe` (동일한 `seekTo` 인터페이스) |
| 데이터 | 정적 `src/data/recipes.json` + `pipeline/` (빌드 타임 Claude 큐레이션) |

## 구조

```
app/                     Expo Router 화면 (웹/앱 공용)
  _layout.tsx            스택 네비게이터
  index.tsx              재료 입력 + 매칭 결과
  recipe/[id].tsx        영상(위) + 스텝·타임스탬프(아래) + 재료/시간/난이도
src/
  data/                  recipes.json + 타입 (Recipe · Vibe · Reception)
  lib/                   ingredients(정규화) · match(재료+vibe 랭킹, relatedRecipes) · vibes · format — 순수 함수, 공유
  components/            YouTubePlayer(.tsx=웹 / .native.tsx=앱) · RecipeCard · RelatedVideos · Reception · Chip · MetaRow
  theme/                 디자인 토큰 (모바일 우선)
pipeline/                sources.json + 자막 + 댓글 → Claude → recipes.json (README 참고)
```

### 화면 로직 공유 방식

`app/recipe/[id].tsx` 는 `YouTubePlayer` 컴포넌트에 `ref.seekTo(seconds)` 만
호출한다. Metro 가 플랫폼에 따라 `YouTubePlayer.tsx`(웹, iframe API) 또는
`YouTubePlayer.native.tsx`(앱, WebView 기반)를 선택한다. 매칭·정규화·포맷은
`src/lib/` 의 순수 함수라 두 타깃이 그대로 쓴다.

## 실행

```bash
npm install

# 웹 (개발) — 대부분 모바일 브라우저에서 열린다고 가정한 모바일 우선 레이아웃
npm run web

# 웹 정적 빌드 → dist/
npm run build:web

# 앱 (앱스토어 출시 없이 컴퓨터에서 확인)
npm run android          # Android 에뮬레이터 또는 USB 연결 기기
npm start                # QR → 본인 휴대폰 Expo Go 앱
```

> iOS 시뮬레이터는 macOS 가 필요하다. Windows 개발 환경에서는
> Android 에뮬레이터 + 웹 + Expo Go(실기기) 로 전체 기능을 확인할 수 있다.

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
npm run typecheck        # tsc --noEmit
npm run pipeline:check    # 데이터 스키마
npm run build:web         # 웹 번들 성공 여부
```
