# 상식 퀴즈 문제 출처

확인일: 2026-10-08

## 현재 기본 문제: 단답형 160개

`games/general-quiz/fallback.ts` 48문항과 `games/general-quiz/short-bank.ts` 112문항을 사용합니다. 초등·중등·고등·대학 난이도와 분야별 자체 작성 문제입니다. 모든 답은 직접 입력하며 7초 후 초성, 15초 후 추가 힌트, 60초 후 정답을 공개합니다. 기본·AI 모두 같은 방식으로 진행합니다. 참여자 과반수가 스킵에 투표하면 즉시 정답을 공개하고 다음 문제로 넘어갑니다. 스킵으로 점수나 오답 수는 추가되지 않습니다.

아래 KorNAT 객관식 묶음은 과거 자료와 라이선스 고지를 보존하기 위해 남겼으며 현재 게임에서는 불러오지 않습니다.

## 과거 객관식 자료 4,000개: KorNAT (사용하지 않음)

- 출처: [KorNAT dataset](https://huggingface.co/datasets/jiyounglee0523/KorNAT)
- 고정 원본 revision: `1753e2f5a3a83e2294766361b2faff7f9804f0bf`
- 논문: *KorNAT: LLM Alignment Benchmark for Korean Social Values and Common Knowledge*
- 라이선스: [CC BY-NC 2.0](https://creativecommons.org/licenses/by-nc/2.0/)
- 사용 범위: 원본의 한국어·한국사·과학·사회·상식 객관식 중 4,000문항을 선별해 `games/general-quiz/builtin/`에 포함합니다.
- 품질 처리: 정답이 없는 행, 알 수 없음 보기, 감독·작가·저자·통화·원자번호·시사성 질문, 비정상 길이와 중복을 제외합니다. 분야별 문제를 난이도 4단계에 고르게 배분합니다.
- 재현: 원본 revision의 `Common Knowledge (Kor)` Parquet을 받은 뒤 `python scripts/build-quiz-bank.py <parquet>`를 실행합니다. 생성물은 서버에서만 읽으며 실행 중 원본 서비스에 접속하지 않습니다.

KorNAT의 비영리 조건은 이 저장소의 자체 라이선스와 별개입니다. 상업적 서비스에 사용하려면 데이터셋 권리자에게 별도 허락을 받거나 내장 문제를 교체해야 합니다. 자세한 고지는 `public/kornat-license.txt`에 있습니다.

## API Key로 새 문제

방장이 OpenAI, Google Gemini 또는 Anthropic API Key를 직접 입력하면 선택한 문제 수를 게임 시작 시 한 번의 요청으로 생성합니다. 모델 목록은 `ai/config.ts`에서 관리합니다.

- Key는 브라우저 화면 메모리와 해당 HTTPS 요청에만 존재하며 D1, 방 상태, 채팅, localStorage 또는 로그에 저장하지 않습니다.
- AI에는 난이도·분야·문항 수와 짧은 생성 규칙만 보냅니다. 참가자 이름과 기존 채팅은 보내지 않습니다.
- 생성 결과는 감독·작가·저자·통화·원자번호·날짜·현재 인물 유형, 숫자/영문뿐인 답, 정답 노출, 중복과 형식 오류를 서버에서 다시 검사합니다.
- AI가 만든 문제는 현재 게임 상태에만 보관하며 내장 문제 은행이나 공용 D1 문제표에 추가하지 않습니다.

## 비상 문제와 중복 방지

현재 기본 선택은 자체 작성 단답형 160문항입니다. 각 질문에는 안정적인 식별자가 있으며 참가자별 최근 30일 이력과 현재 게임의 사용 이력을 기준으로 반복을 줄입니다.

## 사용하지 않는 기존 어댑터

OpenTDB, The Trivia API, Wikidata 어댑터는 확장 예제와 기존 데이터 정리를 위해 코드에 남아 있지만 기본 문제 수집에는 사용하지 않습니다. 영어 번역 품질, 질문 유형 반복과 사용자가 지적한 작품·인물 관계형 문제를 피하기 위해 Wikidata 캐시 문항은 삭제 대상으로 처리합니다.
