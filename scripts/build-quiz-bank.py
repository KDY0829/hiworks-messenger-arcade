#!/usr/bin/env python3
"""Build the bundled Korean multiple-choice bank from the reviewed KorNAT data.

Usage: python scripts/build-quiz-bank.py /path/to/common-knowledge-kor.parquet
Requires pandas and pyarrow. The pinned source revision is documented in
public/quiz-sources.md; the generated JSON is committed so production does not
download or parse the source dataset.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import pandas as pd

TARGET = 4_000
SOURCE_REVISION = "1753e2f5a3a83e2294766361b2faff7f9804f0bf"
SOURCE = f"https://huggingface.co/datasets/jiyounglee0523/KorNAT/tree/{SOURCE_REVISION}"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "games/general-quiz/builtin"
CHUNK_SIZE = 200

BLOCKED = re.compile(
    r"감독|작가|저자|원자\s*번호|통화 이름|현재 대통령|현직|최근|올해|지난해|\*"
)
UNKNOWN = re.compile(
    r"모르겠|모릅|모르는|알 수 없|확인할 수 없|설명할 수 없|이해하지 못|"
    r"학습하지|정보.{0,10}없|데이터가? (?:존재하지|없)|관련 (?:없|되지 않)|불가능|unconfirm",
    re.I,
)
SUBJECTS = {"Korean", "Korean History", "Science", "Social Studies", "Common Sense"}
CIRCLED = ["①", "②", "③", "④"]


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value)).strip()


def category(subject: str, text: str) -> str:
    if subject == "Korean History":
        return "history"
    if subject == "Science":
        if re.search(r"기후|대륙|해류|지형|지층|화산|지진|위도|경도|바다|해양", text):
            return "geography"
        return "science"
    if subject == "Social Studies":
        if re.search(r"기후|지도|지형|지역|대륙|해양|국토|도시|촌락|인구 분포", text):
            return "geography"
        return "society"
    if subject == "Korean":
        if re.search(r"시조|소설|수필|희곡|문학|운문|산문|화자|서술자|갈래", text):
            return "literature"
        if re.search(r"한글|맞춤법|표준어|품사|문장|음운|형태소|어휘|속담", text):
            return "culture"
        return "general"
    if re.search(r"축구|야구|농구|배구|올림픽|운동 경기|스포츠", text):
        return "sports"
    if re.search(r"음식|조리|영양소|식품|발효|요리", text):
        return "food"
    if re.search(r"컴퓨터|인터넷|통신|반도체|소프트웨어|기계|전기|전자", text):
        return "technology"
    if re.search(r"음악|미술|회화|조각|건축|예술|공예", text):
        return "art"
    return "general"


def polish_question(value: str) -> str:
    replacements = (
        (r"에 대해 기술하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"을 기술하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"를 기술하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"에 대해 설명하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"을 설명하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"를 설명하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"에 대하여 기술하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"에 대하여 설명하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"의 (원인|특징|의미)을 서술하시오\.?$", r"의 \1으로 알맞은 것은?"),
        (r"에 대해 서술하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"을 서술하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
        (r"를 서술하시오\.?$", "에 대한 설명으로 알맞은 것은?"),
    )
    for pattern, replacement in replacements:
        updated = re.sub(pattern, replacement, value)
        if updated != value:
            return updated
    return value


def complexity(item: dict[str, object]) -> int:
    return len(str(item["question"])) + sum(len(choice) for choice in item["choices"]) // 3


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("parquet 원본 경로를 인자로 지정해 주세요.")
    frame = pd.read_parquet(sys.argv[1])
    candidates: list[dict[str, object]] = []
    seen: set[str] = set()
    for source_index, row in frame.iterrows():
        subject = clean(row["SubCategory"])
        if subject not in SUBJECTS:
            continue
        question = polish_question(clean(row["Question"]))
        choices = [clean(row[key]) for key in ("A", "B", "C", "D")]
        answer_letter = clean(row["Answer"])
        if answer_letter not in "ABCD":
            continue
        answer_index = ord(answer_letter) - ord("A")
        if BLOCKED.search(" ".join([question, *choices])) or not 12 <= len(question) <= 110:
            continue
        if any(not choice or len(choice) > 105 for choice in choices) or UNKNOWN.search(choices[answer_index]):
            continue
        kept = [(index, choice) for index, choice in enumerate(choices) if not UNKNOWN.search(choice)]
        if len(kept) < 3:
            continue
        new_answer = next((index for index, (old, _) in enumerate(kept) if old == answer_index), -1)
        if new_answer < 0:
            continue
        choices = [choice for _, choice in kept]
        fingerprint = hashlib.sha256(question.encode()).hexdigest()
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        game_category = category(subject, " ".join([question, *choices]))
        candidates.append(
            {
                "id": f"kornat:{source_index}",
                "question": question + "\n" + "\n".join(
                    f"{number + 1}. {choice}" for number, choice in enumerate(choices)
                ),
                "answer": str(new_answer + 1),
                "accepted": [CIRCLED[new_answer]],
                "displayAnswer": f"{new_answer + 1}. {choices[new_answer]}",
                "category": game_category,
                "source": SOURCE,
                "fingerprint": fingerprint,
                "choices": choices,
            }
        )

    buckets: dict[str, list[dict[str, object]]] = defaultdict(list)
    for item in candidates:
        buckets[str(item["category"])].append(item)
    for values in buckets.values():
        values.sort(key=complexity)

    selected: list[dict[str, object]] = []
    while len(selected) < TARGET and any(buckets.values()):
        for values in buckets.values():
            if values:
                selected.append(values.pop(0))
            if len(selected) == TARGET:
                break
    if len(selected) < TARGET:
        raise SystemExit(f"품질 필터를 통과한 문항이 {len(selected)}개뿐입니다.")

    difficulty_order = ["elementary", "middle", "high", "university"]
    grouped: dict[str, list[dict[str, object]]] = defaultdict(list)
    for item in selected:
        grouped[str(item["category"])].append(item)
    for values in grouped.values():
        values.sort(key=complexity)
        for index, item in enumerate(values):
            item["difficulty"] = difficulty_order[min(3, index * 4 // len(values))]
            item.pop("choices")

    selected.sort(key=lambda item: str(item["id"]))
    compact = [
        {
            "i": int(str(item["id"]).split(":", 1)[1]),
            "q": item["question"],
            "a": item["answer"],
            "c": item["category"],
            "l": item["difficulty"],
        }
        for item in selected
    ]
    OUTPUT.mkdir(exist_ok=True)
    for old in OUTPUT.glob("*.json"):
        old.unlink()
    imports: list[str] = []
    names: list[str] = []
    for start in range(0, len(compact), CHUNK_SIZE):
        name = f"bank{start // CHUNK_SIZE:02d}"
        filename = f"{start // CHUNK_SIZE:02d}.json"
        (OUTPUT / filename).write_text(
            json.dumps(compact[start : start + CHUNK_SIZE], ensure_ascii=False, separators=(",", ":")) + "\n"
        )
        imports.append(f"import {name} from './{filename}';")
        names.append(f"...{name}")
    (OUTPUT / "index.ts").write_text("\n".join([*imports, f"export default [{','.join(names)}];", ""]))
    counts = defaultdict(int)
    for item in selected:
        counts[(str(item["category"]), str(item["difficulty"]))] += 1
    print(json.dumps({"candidates": len(candidates), "written": len(selected), "distribution": {f"{key[0]}/{key[1]}": value for key, value in sorted(counts.items())}}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
