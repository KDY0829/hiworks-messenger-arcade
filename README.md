# Hiworks Messenger Arcade

하이웍스 메신저 스타일의 한국어 채팅방 미니게임 앱입니다.

- 최근 대화·친구·파일 탭, 친구 코드 추가와 개인 대화
- 사진·이름·상태 메시지를 수정하는 개인 프로필
- 실시간 대화방, 초대 링크, 방장 설정, 두음법칙, 제한시간
- 기본 사전 명사 32,589개 / 확장 단어 211,277개
- Esc로 대화창 접기·복원, 읽던 채팅 위치 유지
- 이미지 미리 보기·파일 다운로드, 파일당 512KB / 방당 100개
- Windows 앱 창과 트레이 지원
- 채팅방에서 검 강화·판매·상점·장비 기록, 사용자별 진행 저장

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
- `.github/workflows/release-windows.yml`: main push 시 latest 개발 릴리스를 갱신하고, 버전 태그 push 시 정식 릴리스를 게시

로컬 개발·데이터베이스 설정은 [DEVELOPMENT.md](DEVELOPMENT.md)를 확인합니다. GitHub에 소스를 push하는 것과 현재 온라인 서비스에 배포하는 것은 별개입니다. Windows 릴리스 작업은 온라인 서버를 자동 배포하지 않습니다.

## Windows 릴리스 만들기

```sh
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions가 켜져 있고 Actions의 저장소 쓰기 권한이 허용되어 있어야 합니다. 릴리스의 실행 상태와 다운로드 파일은 Actions 및 Releases에서 확인합니다. Windows에서 직접 빌드하려면 Zig를 설치하고 `desktop/build.cmd`를 실행합니다. Linux 크로스 빌드는 `ZIG=/path/to/zig bash desktop/build-linux.sh`입니다.

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

API 검증은 실제 핸들러와 SQLite를 사용하고 R2에는 메모리 어댑터를 사용합니다. Windows 실행 파일은 크로스 빌드되며 실제 Windows 실행은 별도로 확인해야 합니다. GitHub Actions 실행 여부는 push 후 별도로 확인합니다.

## 검 강화하기

대화방의 메뉴 → 검 강화하기를 선택합니다. 장비 카드에서 강화·판매·상점·기록을 사용하고 종료하면 일반 대화만 남습니다. Esc와 목록으로 돌아가기는 장비를 삭제하지 않습니다. 다시 같은 방을 열거나 다른 방에서 시작하면 사용자 토큰에 연결된 D1 기록을 이어갑니다. 끝말잇기 진행 중에는 장비 처리가 일시 정지되며 일반 채팅은 계속 사용할 수 있습니다.

`games/sword-enhancement/config.ts`에서 최대 단계, 이름/등급, 절대 확률(%), 비용/판매가/점수, 아이템 가격 및 공유 기준을 변경합니다. 확률 합계는 100 이하를 유지하고 tiers에는 +0 이름을 포함합니다. 보조권은 다음 강화에 자동 소비되고, 파괴 방지권은 파괴 판정 때만 소비됩니다. +0 판매는 불가능하며 파괴 후 골드가 부족하면 재시작 지원금을 지급합니다. 구입한 시작 단계는 강화 최고 기록에 바로 포함되지 않습니다. 기존 저장 데이터가 있는 서비스에서 최대 단계를 낮추려면 데이터 호환 정책도 함께 변경해야 합니다.

## 새로운 게임 추가 방법

1. `games/<game-id>/` 폴더에 설정, 상태/액션 타입, 순수 규칙 엔진을 작성합니다.
2. `games/registry.ts`에 클라이언트에서 안전한 메타데이터를 등록합니다. 사전/서버 모듈은 이 파일에 import하지 않습니다.
3. 기존 Button과 채팅 스타일로 작은 UI와 요청 훅을 작성합니다.
4. `app/page.tsx`의 대화방 활동 트리거와 인라인 패널에 연결합니다. registry의 등록만으로 서버와 UI가 자동 연결되지는 않습니다.
5. 필요한 서버 핸들러를 `app/api/games/<id>/route.ts`에 추가하고 현재 토큰·대화방 참여 권한을 검사합니다. 상태 변경은 서버에서 판정하고 버전 검사로 중복 요청을 막습니다.
6. 개인 진행은 D1에 저장합니다. 공유 이벤트는 `game_events`에 기록하면 기존 rooms API의 1초 polling, 방 목록·읽음 처리에 반영됩니다. 새 테이블은 Drizzle 마이그레이션으로 추가합니다.

검 강화 폴더와 API를 두 번째 예제로 참고합니다. 기존 끝말잇기는 `lib/game.ts`와 rooms API를 유지하며 별도 실시간 서버나 플러그인 SDK는 사용하지 않습니다.
