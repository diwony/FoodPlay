# prjsingle 포트폴리오 — PERSONAL PROJECT 카드

FoodPlay 는 `prjsingle` 포트폴리오에서 기존 **슬롯 04 · 05 를 하나로 합친**
가로로 넓은 "PERSONAL PROJECT" 카드로 들어간다.

## 카드 카피

| 항목 | 내용 |
| --- | --- |
| 라벨 | `PERSONAL PROJECT` |
| 타이틀 | **FoodPlay** |
| 한 줄 | 냉장고 재료로 만들 수 있는 유튜브 요리 영상을 찾고, 스텝 타임스탬프로 영상 구간을 바로 여는 앱 |
| 역할 | 기획 · 디자인 · 프론트엔드 · 데이터 파이프라인 (1인) |
| 스택 | React Native · Expo Router · React Native Web · TypeScript · Claude API |
| 포인트 | ① 웹/앱 한 코드베이스, 화면·로직 공유 ② 런타임 API 의존 없는 큐레이션 JSON + Claude 빌드 파이프라인 ③ 웹·네이티브 공통 `seekTo` 추상화 |
| 링크 | GitHub · 웹 데모(정적 배포) · 시연 영상(Android) |

## 배치

```
기존:  [ 04 프로젝트 ]  [ 05 프로젝트 ]
변경:  [ 04+05  PERSONAL PROJECT — FoodPlay          ]   ← 2칸 병합, 가로 와이드 카드
```

## 마크업 스니펫 (prjsingle 스타일에 맞춰 조정)

```html
<article class="project-card project-card--wide project-card--personal">
  <p class="project-card__label">PERSONAL PROJECT</p>
  <h3 class="project-card__title">FoodPlay</h3>
  <p class="project-card__desc">
    냉장고 재료로 만들 수 있는 유튜브 요리 영상을 찾고,
    조리 스텝의 타임스탬프를 눌러 영상 구간으로 바로 이동하는 앱.
  </p>
  <ul class="project-card__meta">
    <li>1인 · 기획/디자인/개발/데이터</li>
    <li>React Native · Expo Router · RN Web · TypeScript</li>
    <li>큐레이션 JSON + Claude 파이프라인</li>
  </ul>
  <div class="project-card__links">
    <a href="https://github.com/…/foodplay">GitHub</a>
    <a href="https://…/foodplay-web">Web Demo</a>
    <a href="https://…/foodplay-demo.mp4">시연 영상</a>
  </div>
</article>
```

```css
/* 슬롯 2칸 병합 */
.project-card--wide { grid-column: span 2; }
.project-card--personal { /* prjsingle 의 강조 색/보더 토큰 적용 */ }
```

## 스크린샷 / 영상 소스

- 웹: `npm run build:web` → `dist/` 배포 후 캡처
- 앱: Android 에뮬레이터 화면 녹화 (재료 입력 → 결과 → 타임스탬프 점프)
- 카드 썸네일 권장: 앱 상세 화면(영상 위 / 스텝·타임스탬프 아래)이 한눈에 보이는 컷
