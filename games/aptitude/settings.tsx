'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import type {QuizCategory,QuizDifficulty,QuizSettings} from '../general-quiz/types';
export function AptitudeSettings({busy,host,help,onStart}:{busy:boolean;host:boolean;help:boolean;onStart:(settings:QuizSettings)=>Promise<boolean>}){
 const [difficulty,setDifficulty]=useState<QuizDifficulty>('high'),[category,setCategory]=useState<QuizCategory>('all'),[count,setCount]=useState<5|10>(10);
 if(!host)return <p className="game-menu-note">방장이 설정하고 시작할 수 있습니다.</p>;
 return <><p className="game-menu-note">언어·수리·추리 적성 연습 · 자체 제작 150문항</p>
 <label className="setting-row">영역<select value={category} disabled={busy} onChange={event=>setCategory(event.target.value as QuizCategory)}><option value="all">혼합</option><option value="culture">언어·명제 이해</option><option value="science">수리·자료해석</option><option value="society">추리·수열</option></select></label>
 <label className="setting-row">난이도<select value={difficulty} disabled={busy} onChange={event=>setDifficulty(event.target.value as QuizDifficulty)}><option value="middle">기본</option><option value="high">실전</option><option value="university">심화</option></select></label>
 <label className="setting-row">문제 수<select value={count} disabled={busy} onChange={event=>setCount(Number(event.target.value) as 5|10)}><option value={5}>5문제</option><option value={10}>10문제</option></select></label>
 <Button className="full" variant="outline" disabled={busy} onClick={()=>onStart({difficulty,category,questionCount:count,source:'aptitude'})}>{busy?'준비 중…':'연습 시작'}</Button>
 {help&&<div className="rules">싱글·멀티 모두 가능 · 정답 직접 입력<br/>7초 풀이 방향 · 15초 추가 힌트 · 60초 정답·해설 공개<br/>참여자 과반수가 스킵하면 정답·해설을 공개합니다.<br/>상식퀴즈와 별도 문제 은행을 사용합니다.<br/>실제 기업 기출·인성검사·합격 예측은 포함하지 않습니다.</div>}</>;
}
