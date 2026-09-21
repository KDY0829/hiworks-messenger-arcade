# 상식 퀴즈 문제 출처

확인일: 2026-09-21

## Wikidata

- 출처: https://www.wikidata.org/
- 라이선스: CC0 1.0
- 사용 방식: 한국어 label이 있는 국가·수도·통화와 원소·기호·원자 번호의 구조화된 관계만 작은 SPARQL 템플릿으로 요청합니다.
- 운영: 식별 가능한 User-Agent, 12초 요청 제한, 하루 단위 lazy refresh를 사용합니다. 전체 데이터 덤프나 검색성 쿼리를 실행하지 않습니다.

## Open Trivia Database

- 출처: https://opentdb.com/
- 라이선스: CC BY-SA 4.0
- API 제한: 요청당 최대 50문제, IP당 5초에 1회, session token은 6시간 동안 사용하지 않으면 만료됩니다.
- 사용 방식: token을 `quiz_provider_state`에 저장해 다음 refresh에서 재사용하고 provider ID와 별도로 SHA-256 fingerprint 및 사용자 이력을 적용합니다. OpenTDB는 한국어를 제공하지 않으므로 번역 함수가 없는 기본 배포에서는 token·adapter 동작만 유지하고 영문 문제를 게임 풀에 넣지 않습니다.

## The Trivia API

- 출처: https://the-trivia-api.com/
- 라이선스: 무료 데이터는 CC BY-NC 4.0이며 상업적 이용에는 유료 권한이 필요합니다.
- 확인 결과: 공개 v2 endpoint는 동작하지만 현재 안내된 번역 언어에 한국어가 포함되지 않습니다.
- 적용 상태: 확장용 adapter는 포함하지만 기본 수집은 비활성입니다. 운영자가 비상업 또는 유료 사용 권한과 한국어 번역기를 준비한 경우에만 registry 설정을 변경해야 합니다.

## 캐시와 비상 문제

외부 데이터는 D1의 `quiz_questions`에 원본 ID, 출처, 난이도, 카테고리와 fingerprint를 함께 저장합니다. 외부 서비스가 모두 실패해도 앱이 시작되도록 프로젝트가 직접 작성한 작은 비상 문제 묶음을 포함합니다. 이 묶음은 대규모 내장 문제 은행을 대신하지 않습니다.
