# 앱을 QR 로 (앱스토어 출시 없이)

앱스토어/플레이스토어 등록 없이도 **QR 로 실제 폰에서 FoodPlay 앱을 실행**할 수
있다. 3가지 방법이 있고, 아래로 갈수록 "설정은 더 하지만 QR 이 오래간다".

| 방법 | QR 유효 기간 | 서버 필요 | 계정 |
| --- | --- | --- | --- |
| 1. `expo start` | 개발 서버 켜진 동안만 | 내 컴퓨터 | 없음 |
| 2. EAS Update → Expo Go | 계속 유효 (JS 업데이트 push) | 없음 (Expo 호스팅) | 무료 Expo 계정 |
| 3. EAS Build → APK | 계속 유효 (설치 파일) | 없음 | 무료 Expo 계정 |

이 앱은 Expo Go 에 포함된 모듈(`react-native-webview` 등)만 쓰므로 **Expo Go
로 바로 실행된다.** 커스텀 네이티브 코드가 없어서 개발 빌드가 필요 없다.

---

## 방법 1 — 지금 바로 (개발 서버 QR)

```bash
npm run app:tunnel          # 또는 npm run app:start (같은 와이파이일 때)
```

- 터미널에 QR 이 뜬다.
- 폰에 **Expo Go** 앱 설치 (iOS: App Store / Android: Play Store — FoodPlay 를
  올리는 게 아니라 Expo Go 를 받는 것).
- Android 는 Expo Go 로 QR 스캔, iOS 는 기본 카메라로 스캔.
- `--tunnel` 이면 다른 네트워크(LTE)에서도 열린다. 내 컴퓨터의 `npm run
  app:tunnel` 이 켜져 있는 동안만 유효.

포트폴리오 시연 영상 찍기엔 이걸로 충분하다.

## 방법 2 — 계속 살아있는 QR (EAS Update)

한 번만 로그인하면, 이후 `eas update` 할 때마다 **고정 QR** 로 최신 JS 가 반영된다.

```bash
npm i -g eas-cli
eas login                   # 무료 Expo 계정 (한 번만)
eas init                    # 프로젝트 생성 → app.json 에 projectId 기록
eas update:configure        # updates.url 자동 설정
npm run app:update          # branch "preview" 로 첫 업데이트 publish
```

publish 하면 CLI 가 **Expo Go 용 QR/링크**를 출력한다. 그 QR 은 계속 유효하고,
코드 고친 뒤 `npm run app:update` 만 다시 하면 같은 QR 로 갱신된다.
(`eas.json` 에 `preview` 채널이 이미 설정돼 있다.)

## 방법 3 — 설치되는 APK (Android)

```bash
eas login
eas build --platform android --profile preview     # = npm run app:build:android
```

빌드가 끝나면 EAS 가 **APK 다운로드 페이지 + QR** 을 준다. 그 QR 로 폰에서
APK 를 받아 설치하면 Expo Go 없이 독립 앱으로 돌아간다.
iOS 는 무료 계정으로는 기기 등록(ad-hoc)이 필요해 Android 만 권장.

---

## 참고

- iOS 시뮬레이터 빌드는 macOS 필요. 위 방법 1·2 는 Windows + 실제 아이폰으로 OK.
- 앱 UI 는 `app/`·`src/components/` (React Native), 매칭·데이터는 웹과 공유
  (`@foodplay/core`).
