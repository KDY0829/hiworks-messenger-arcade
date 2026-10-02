'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {providers,type ProviderId} from '@/ai/config';
import {quizConfig} from './config';
import type {QuizCategory,QuizDifficulty,QuizSettings,QuizSource} from './types';
export function QuizSettings({secret,setSecret,busy,host,help,onTest,onStart}:{secret:string;setSecret:(key:string)=>void;busy:boolean;host:boolean;help:boolean;onTest:(provider:string,model:string)=>Promise<boolean>;onStart:(settings:QuizSettings)=>Promise<boolean>}){
 const [source,setSource]=useState<QuizSource>('builtin'),[difficulty,setDifficulty]=useState<QuizDifficulty>('middle'),[category,setCategory]=useState<QuizCategory>('all'),[questionCount,setQuestionCount]=useState<5|10|20|0>(10),[provider,setProvider]=useState<ProviderId>('openai'),[model,setModel]=useState(providers[0].models[0].id as string),[tested,setTested]=useState('');
 const signature=JSON.stringify([provider,model,secret]),connected=tested===signature;
 if(!host)return <p className="game-menu-note">방장이 설정하고 시작할 수 있습니다.</p>;
 return <>
  <label className="setting-row">문제 방식<select value={source} disabled={busy} onChange={event=>{const next=event.target.value as QuizSource;setSource(next);if(next==='ai'&&questionCount===0)setQuestionCount(10);}}><option value="builtin">기본 문제 4,000개</option><option value="ai">API Key로 새 문제</option></select></label>
  <label className="setting-row">난이도<select value={difficulty} disabled={busy} onChange={event=>setDifficulty(event.target.value as QuizDifficulty)}>{quizConfig.difficulties.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  <label className="setting-row">분야<select value={category} disabled={busy} onChange={event=>setCategory(event.target.value as QuizCategory)}>{quizConfig.categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  <label className="setting-row">문제 수<select value={questionCount} disabled={busy} onChange={event=>setQuestionCount(Number(event.target.value) as 5|10|20|0)}>{quizConfig.questionCounts.filter(count=>source==='builtin'||count!==0).map(count=><option key={count} value={count}>{count||'무한'}</option>)}</select></label>
  {source==='ai'&&<>
   <label className="setting-row">AI 제공자<select value={provider} disabled={busy} onChange={event=>{const next=providers.find(item=>item.id===event.target.value)!;setProvider(next.id);setModel(next.models[0].id);setSecret('');setTested('');}}>{providers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
   <label className="ai-key-label">모델<select value={model} disabled={busy} onChange={event=>{setModel(event.target.value);setTested('');}}>{providers.find(item=>item.id===provider)!.models.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
   <label className="ai-key-label">API Key<input type="password" autoComplete="off" maxLength={512} value={secret} disabled={busy} onChange={event=>{setSecret(event.target.value);setTested('');}}/></label>
   <p className="game-menu-note">키는 화면 메모리에만 유지되며 서버·대화·DB에 저장하지 않습니다.</p>
   <Button className="full" variant="outline" disabled={busy||!secret} onClick={async()=>{if(await onTest(provider,model))setTested(signature);}}>{busy?'처리 중…':'연결 테스트'}</Button>
   {connected&&<p className="game-menu-note" role="status">연결되었습니다.</p>}
   <p className="game-menu-note">게임 시작 시 선택한 문항 수를 1회 생성합니다.</p>
  </>}
  <Button className="full" variant="outline" disabled={busy||(source==='ai'&&!connected)} onClick={()=>onStart({difficulty,category,questionCount,source,...(source==='ai'?{provider,model}:{})})}>{busy?'문제 준비 중…':'게임 시작'}</Button>
  {help&&<div className="rules">기본 모드는 사람 검수 한국어 객관식 4,000문항이며 정답 번호를 입력합니다.<br/>문제가 화면에 표시된 뒤 제한시간이 시작됩니다.<br/>AI 모드는 짧은 한국어 주관식 문제를 한 번에 생성하며 입력한 키는 저장하지 않습니다.<br/>힌트 전 3점 · 첫 힌트 뒤 2점 · 추가 힌트 뒤 1점<br/>틀리면 1.5초 뒤 다시 답할 수 있으며 문제당 최대 4회입니다.</div>}
 </>;
}
