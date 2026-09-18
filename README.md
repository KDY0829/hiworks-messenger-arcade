# Hiworks Messenger Arcade

하이웍스 메신저 스타일의 한국어 멀티플레이어 끝말잇기 앱입니다.

- 최근 대화·친구·파일 탭, 친구 코드 추가와 개인 대화
- 사진·이름·상태 메시지를 수정하는 개인 프로필
- 실시간 대화방, 초대 링크, 방장 설정, 두음법칙, 제한시간
- 기본 사전 명사 32,589개 / 확장 단어 211,277개
- Esc로 대화창 접기·복원, 읽던 채팅 위치 유지
- 이미지 미리 보기·파일 다운로드, 파일당 512KB / 방당 100개
- Windows 앱 창과 트레이 지원

## 사용하기

서비스: https://office-word-chat.i970829.chatgpt.site

Windows 다운로드는 이 저장소의 **Releases**에서 `OfficeChat-Windows.zip`을 받아 압축을 풀고 `OfficeChat.exe`를 실행합니다. Windows 10/11 x64, Microsoft Edge, 인터넷 연결이 필요합니다. 데스크톱 실행 파일은 Edge의 독립 앱 창으로 온라인 서비스에 접속하는 실행기이며 오프라인 게임 서버를 포함하지 않습니다.

## 함께 개발하기

저장소의 쓰기 권한을 받은 팀원은 clone한 뒤 별도 브랜치에서 수정하고 push하여 Pull Request를 만듭니다.

```sh
git clone https://github.com/KDY0829/hiworks-messenger-arcade.git
cd hiworks-messenger-arcade
git switch -c fix/my-change
# 소스 수정 후
git add .
git commit -m "Describe the change"
git push -u origin fix/my-change
```

다른 사람의 변경은 `git switch main` 후 `git pull --ff-only`로 받습니다.

## 프로젝트 구조

- `app/`: 화면과 대화방 API
- `components/messenger-home.tsx`: 메인 목록, 친구, 프로필 편집
- `lib/`: 게임 규칙과 서버 전용 사전
- `drizzle/`: D1 데이터베이스 마이그레이션
- `desktop/`: Windows 실행기 C 소스, 아이콘, 빌드 스크립트
- `.github/workflows/release-windows.yml`: 버전 태그를 push하면 Windows 실행 파일·ZIP을 빌드해 GitHub Releases에 게시

로컬 개발·데이터베이스 설정은 [DEVELOPMENT.md](DEVELOPMENT.md)를 확인합니다. GitHub에 소스를 push하는 것과 현재 온라인 서비스에 배포하는 것은 별개입니다. Windows 릴리스 작업은 온라인 서버를 자동 배포하지 않습니다.

## Windows 릴리스 만들기

```sh
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions가 켜져 있고 Actions의 저장소 쓰기 권한이 허용되어 있어야 합니다. GitHub에서 실제 첫 릴리스 실행은 아직 검증하지 않았습니다. Windows에서 직접 빌드하려면 Zig를 설치하고 `desktop/build.cmd`를 실행합니다. Linux 크로스 빌드는 `ZIG=/path/to/zig bash desktop/build-linux.sh`입니다.

## 데이터와 라이선스

Windows 실행기 라이선스: [desktop/LICENSE.txt](desktop/LICENSE.txt).
사전은 여러 공개 단어 목록에서 정리했으며 GPL/Apache 등 출처별 라이선스가 적용됩니다. 출처·가공 방법·라이선스·단어 목록은 [public/dictionary-sources.md](public/dictionary-sources.md)를 확인합니다.

## 프로필과 대화 목록

첫 실행에서 이름을 등록한 후 친구 탭의 내 코드로 친구를 추가합니다. 친구 옆 대화 버튼은 개인 대화를 만들고 상대방의 대화 목록에도 표시합니다. 그룹 대화는 새 대화 버튼으로 만들거나 방 코드로 참여합니다. 채팅방의 왼쪽 화살표는 방을 나가지 않고 목록으로 돌아갑니다. 서버에는 프로필, 친구, 참여한 방과 읽음 상태가 저장됩니다. 기기의 접속 토큰으로 식별하므로 다른 기기에서 같은 프로필로 로그인하는 기능은 아직 없습니다.

프로필 사진은 최대 10MB의 이미지를 선택할 수 있으며 브라우저에서 정사각형 256px JPEG로 변환합니다. 새 첨부파일과 사진은 R2 `FILES`에, 메타데이터는 D1 `DB`에 저장합니다. 이전 버전의 D1 첨부는 계속 읽을 수 있습니다. 대화 목록에는 최근 100개 방이 표시됩니다.

## 검증

```sh
node scripts/test-messenger.mjs
node node_modules/typescript/bin/tsc --noEmit
```

API 검증은 실제 핸들러와 SQLite를 사용하고 R2에는 메모리 어댑터를 사용합니다. Windows 실행 파일은 크로스 빌드되며 실제 Windows 실행은 별도로 확인해야 합니다. GitHub Actions의 첫 실행은 GitHub에 저장소 업로드 후 확인합니다.
