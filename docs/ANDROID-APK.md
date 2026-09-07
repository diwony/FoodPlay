# Android APK 만들기 (무료)

FoodPlay 웹앱은 **PWA**(설치형 웹앱)다. 이 PWA를 그대로 감싸 **Android APK**를 만든다 —
[PWABuilder](https://www.pwabuilder.com/) 의 TWA(Trusted Web Activity) 패키지를 쓰면 무료이고
Google Play 계정도, 서명 인증서 구매도 필요 없다.

iOS는 이런 자유 배포가 불가능하므로(App Store 연 $99 필요) **iOS 사용자는 Safari에서
"홈 화면에 추가"** 로 같은 PWA를 설치한다. README의 왼쪽 QR이 그 경로다.

---

## 1. PWABuilder로 패키지 생성

1. 웹 데모를 먼저 배포해 매니페스트를 살아있게 한다: `npm run deploy:web`
2. <https://www.pwabuilder.com/> 접속 → `https://diwony.github.io/FoodPlay/` 입력 → **Start**
3. 매니페스트·서비스워커·아이콘 점수 확인 (초록불이면 통과)
4. **Package For Stores → Android → Generate Package**
   - Package ID: `io.github.diwony.foodplay` (한 번 정하면 고정)
   - Signing key: **"Create new"** 선택 → PWABuilder가 서명 키를 만들어 zip에 넣어준다.
     이 zip 안의 `signing.keystore` 와 비밀번호 메모는 **잃어버리면 업데이트 배포가 불가**하므로
     따로 안전하게 보관한다 (저장소에 커밋 금지 — `.gitignore` 에 이미 `*.keystore` 있음).
5. 받은 zip 안에는:
   - `app-release-signed.apk` ← 배포용 (사이드로딩)
   - `app-release-bundle.aab` ← Play Store 업로드용 (지금은 불필요)
   - `assetlinks.json` ← 다음 단계

## 2. 주소창 없애기 — Digital Asset Links

APK를 Play Store 밖에서 설치하면 기본적으로 상단에 **Chrome 주소창**이 뜬다.
없애려면 도메인 루트에 `assetlinks.json` 을 올려 앱과 사이트를 서로 인증해야 한다.

GitHub Pages **프로젝트 사이트**(`diwony.github.io/FoodPlay/`)는 `/.well-known/` 을
프로젝트 저장소에서 못 내보낸다. 도메인 루트(`diwony.github.io`)에서 서빙해야 한다.

**이미 설정 완료됨** — `diwony/diwony.github.io` 저장소가 `.well-known/assetlinks.json`
(+ `.nojekyll`) 을 서빙한다. Google 검증 API 결과 `"linked": true`.

- 파일: <https://diwony.github.io/.well-known/assetlinks.json>
- 새 서명 키로 APK를 다시 만들면 이 파일의 `sha256_cert_fingerprints` 를 갱신해야 한다.
- 검증: `https://digitalassetlinks.googleapis.com/v1/assetlinks:check?source.web.site=https://diwony.github.io&relation=delegate_permission/common.handle_all_urls&target.android_app.package_name=io.github.diwony.foodplay&target.android_app.certificate.sha256_fingerprint=<지문>`

> 폰에서 주소창이 계속 보이면 앱을 **삭제 후 재설치**(또는 설정 → 앱 → FoodPlay → 저장공간 →
> 데이터 삭제). TWA는 첫 실행 때 assetlinks 를 확인하는데, 그 시점에 파일이 없었으면 캐시된다.

## 3. 배포 — GitHub Releases

1. `app-release-signed.apk` 를 `FoodPlay-<버전>.apk` 로 이름 변경
2. GitHub 저장소 → **Releases → Draft a new release**
   - Tag: `v1.0.0` (앱 버전과 맞춤)
   - APK 파일 첨부 → **Publish release**
3. README의 오른쪽 QR(`docs/qr-apk.png`)은 항상 `releases/latest` 를 가리키므로
   새 버전을 올릴 때마다 QR을 바꿀 필요가 없다.

## 업데이트할 때

- 웹 내용만 바뀌면: `npm run deploy:web` 만 하면 APK 안에서도 최신 웹이 뜬다 (TWA는 껍데기).
- 앱 아이콘·이름·Package ID·매니페스트가 바뀌면: PWABuilder에서 **같은 서명 키로** 다시
  패키지를 만들어 새 Release로 올린다.

---

## 대안: 진짜 네이티브 빌드 (Expo EAS)

저장소 루트의 Expo 앱(`app/`)을 EAS로 빌드하면 TWA 껍데기가 아닌 실제 RN 앱 APK가 나온다.

```bash
npm run app:build:android   # eas build --platform android --profile preview
```

무료 티어는 월 빌드 횟수 제한이 있고 Expo 계정 로그인이 필요하다. 현재 Expo 앱은 웹앱보다
화면 수가 적으므로, **전체 기능을 보여주는 데는 위의 PWA→TWA 경로가 낫다.**
