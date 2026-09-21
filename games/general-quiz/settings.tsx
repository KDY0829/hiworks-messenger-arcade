'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {quizConfig} from './config';
import type {QuizCategory,QuizDifficulty,QuizSettings} from './types';
export function QuizSettings({busy,host,help,onStart}:{busy:boolean;host:boolean;help:boolean;onStart:(settings:QuizSettings)=>Promise<boolean>}){
 const [difficulty,setDifficulty]=useState<QuizDifficulty>('middle'),[category,setCategory]=useState<QuizCategory>('all'),[questionCount,setQuestionCount]=useState<5|10|20|0>(10);
 if(!host)return <p className="game-menu-note">방장이 설정하고 시작할 수 있습니다.</p>;
 return <>
  <label className="setting-row">난이도<select value={difficulty} disabled={busy} onChange={event=>setDifficulty(event.target.value as QuizDifficulty)}>{quizConfig.difficulties.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  <label className="setting-row">분야<select value={category} disabled={busy} onChange={event=>setCategory(event.target.value as QuizCategory)}>{quizConfig.categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  <label className="setting-row">문제 수<select value={questionCount} disabled={busy} onChange={event=>setQuestionCount(Number(event.target.value) as 5|10|20|0)}>{quizConfig.questionCounts.map(count=><option key={count} value={count}>{count||'무한'}</option>)}</select></label>
  <Button className="full" variant="outline" disabled={busy} onClick={()=>onStart({difficulty,category,questionCount})}>{busy?'문제 준비 중…':'게임 시작'}</Button>
  {help&&<div className="rules">혼자 또는 함께 주관식 문제를 풉니다.<br/>문제가 화면에 표시된 뒤 5초에 초성, 10초에 추가 힌트, 15초에 정답이 공개됩니다.<br/>힌트 전 3점 · 초성 뒤 2점 · 추가 힌트 뒤 1점<br/>틀리면 1.5초 뒤 다시 답할 수 있으며 문제당 최대 4회입니다.<br/>외부 문제는 서버 캐시에 저장되어 장애 중에도 기존 문제로 진행됩니다.</div>}
 </>;
}
