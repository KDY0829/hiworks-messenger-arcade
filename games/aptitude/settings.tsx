'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import type {QuizCategory,QuizDifficulty,QuizSettings} from '../general-quiz/types';
export function AptitudeSettings({busy,host,help,onStart}:{busy:boolean;host:boolean;help:boolean;onStart:(settings:QuizSettings)=>Promise<boolean>}){
 const [difficulty,setDifficulty]=useState<QuizDifficulty>('high'),[category,setCategory]=useState<QuizCategory>('all'),[count,setCount]=useState<5|10>(10);
 if(!host)return <p className="game-menu-note">방장이 설정하고 시작할 수 있습니다.</p>;
 return <><p className="game-menu-note">새로 작성한 30문항 · 표·지문·복합 조건 · 5지선다</p>
 <label className="setting-row">영역<select value={category} disabled={busy} onChange={event=>{const value=event.target.value as QuizCategory;setCategory(value);if(value!=='all')setCount(5);}}><option value="all">혼합</option><option value="culture">장문 독해·논증</option><option value="science">수리·자료해석</option><option value="society">조건 추리·명제</option></select></label>
 <label className="setting-row">난이도<select value={difficulty} disabled={busy} onChange={event=>setDifficulty(event.target.value as QuizDifficulty)}><option value="high">실전</option><option value="university">고난도</option></select></label>
 <label className="setting-row">문제 수<select value={count} disabled={busy} onChange={event=>setCount(Number(event.target.value) as 5|10)}><option value={5}>5문제</option>{category==='all'&&<option value={10}>10문제</option>}</select></label>
 <Button className="full" variant="outline" disabled={busy} onClick={()=>onStart({difficulty,category,questionCount:count,source:'aptitude'})}>{busy?'준비 중…':'연습 시작'}</Button>
 {help&&<div className="rules">싱글·멀티 · 선지 선택 또는 번호 입력 · 문제당 답변 1회<br/>제한시간 60초 · 자동 힌트 없음<br/>풀이 힌트는 버튼을 눌러 열며 모든 참여자에게 공개됩니다.<br/>과반수 스킵 시 정답 공개 · 해설 확인 후 방장이 다음 문제로 이동<br/>정답 근거·빠른 풀이·오답 근거를 함께 제공합니다.<br/><a href="/aptitude-sources.md" target="_blank" rel="noreferrer">유형 참고 자료·검증 기준</a></div>}</>;
}
