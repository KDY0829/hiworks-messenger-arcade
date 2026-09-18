# 단어 목록과 출처

사전 명사: 32,589개. 확장 단어: 211,277개. 중복을 제거하고 한글 2~100글자 표제어만 수록했습니다.

사전 명사 목록은 hunspell-dict-ko의 명사·대명사·수사·관명사와 기존 기본 목록을 합쳤습니다. 국립국어원 전체 사전이 아니며, 사전의 모든 표제어를 인정한다는 뜻은 아닙니다.

확장 목록에는 Open Korean Text의 명사, 위키백과 제목, 인명·지명·브랜드·게임 관련 명칭과 KKuTu Dictionary with Python3의 긴 단어가 포함됩니다. 일반 국어사전 명사 규칙과 다를 수 있습니다. 각 자료의 수록 시점 기준으로 동결한 목록입니다.

## 다운로드

- [사전 명사 목록](/words-basic.txt)
- [확장 단어 목록](/words-extended.txt)
- [통합 사전 데이터 라이선스 (GPL 3 또는 이후)](/dictionary-license.txt)
- [Open Korean Text 라이선스 (Apache 2.0)](/open-korean-text-license.txt)

## 원본 자료

- hunspell-dict-ko contributors / National Institute of Korean Language: https://github.com/spellcheck-ko/hunspell-dict-ko — combined dict-ko-data.yaml is GPL-3.0-or-later.
- Open Korean Text contributors (Twitter Korean Text의 후속 프로젝트): https://github.com/open-korean-text/open-korean-text — Apache-2.0. noun 디렉터리의 명사 목록 사용; profane/spam/slangs/twitter 목록 제외.
- ShapeLayer / KKuTu Dictionary with Python3: https://github.com/ShapeLayer/KKuTu-Dictionary-Python — GPL-3.0. data/long.txt의 주석 및 게임 구분 표기를 제거했습니다.

표제어 추출, 한글 및 길이 필터, 중복 제거, 사전/확장 목록 분리 및 재포장을 적용했습니다. 추출된 통합 데이터는 GPL-3.0-or-later로 제공합니다. 앱 실행 파일은 사전 데이터를 직접 내장하지 않고 서버의 단어 검사를 이용합니다.

## 고정한 원본 식별자

```json
{
  "hunspell": {
    "sha": "784e618873b650e692d7bb0cab5cfa103193e0c2",
    "url": "https://github.com/spellcheck-ko/hunspell-dict-ko/blob/master/dict-ko-data.yaml"
  },
  "okt": [
    {
      "name": "bible.txt",
      "sha": "3a6b5912b830d6242e529b12384955340d5d059a",
      "count": 199
    },
    {
      "name": "brand.txt",
      "sha": "a271525c65ae10fc9c64f6b1fd55dc2283d53f52",
      "count": 41
    },
    {
      "name": "company_names.txt",
      "sha": "433e659359b55041a5c7cc79ebe6f09b6314a1c7",
      "count": 155
    },
    {
      "name": "congress.txt",
      "sha": "f4a6dbce9b3a09108aaba75ceb6dbb19ae4db735",
      "count": 2647
    },
    {
      "name": "entities.txt",
      "sha": "34f3b582034e5a1ff5d6266a1501614d03176adf",
      "count": 9622
    },
    {
      "name": "fashion.txt",
      "sha": "70545d343b31ceba56e1e55451332c2bc582122d",
      "count": 133
    },
    {
      "name": "foreign.txt",
      "sha": "1227ed0c9ee72c8c0934cf302a6cc42389b738ae",
      "count": 985
    },
    {
      "name": "geolocations.txt",
      "sha": "edc8d24b47513d3bf0b5e925650432922a7b0045",
      "count": 516
    },
    {
      "name": "kpop.txt",
      "sha": "a7b8746a1c00a0351a417a3e1816a76906102bb1",
      "count": 554
    },
    {
      "name": "lol.txt",
      "sha": "1d2dc4159b7071693e3088d1045676b369b04f23",
      "count": 137
    },
    {
      "name": "names.txt",
      "sha": "4b0e4b84d7e6ba392b95e275af913ebc504699d9",
      "count": 97
    },
    {
      "name": "neologism.txt",
      "sha": "d011d9667842584a6755c7586d6f9e693c580a84",
      "count": 16
    },
    {
      "name": "nouns.txt",
      "sha": "3f57c2d3ec6d20319e23385edb33402b409153ca",
      "count": 25844
    },
    {
      "name": "pokemon.txt",
      "sha": "99b7898dd0b814bd8fccddf66e4c9c67a5960301",
      "count": 160
    },
    {
      "name": "wikipedia_title_nouns.txt",
      "sha": "fb004b6f63ae9f0d2525f398421434667f277570",
      "count": 158509
    }
  ],
  "kkutu": {
    "sha": "1a212c05a5e8382e4b9d03aa64c21e0cfda4ee3d",
    "url": "https://github.com/ShapeLayer/KKuTu-Dictionary-Python/blob/master/data/long.txt"
  }
}
```
