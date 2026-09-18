'use client';
import {useState} from 'react';
import {providers,type ProviderId} from '@/ai/config';
import {questionSets,type QuestionSet} from './questions';
import type {Settings} from './types';
import {Button} from '@/components/ui/button';
export function InfiltratorSettings({secret,setSecret,busy,host,help,onTest,onStart}:{secret:string;setSecret:(key:string)=>void;busy:boolean;host:boolean;help:boolean;onTest:(provider:string,model:string)=>Promise<boolean>;onStart:(settings:Settings)=>Promise<boolean>}){
 const [provider,setProvider]=useState<ProviderId>('openai'),[model,setModel]=useState<string>(providers[0].models[0].id),[rounds,setRounds]=useState(5),[seconds,setSeconds]=useState(20),[participants,setParticipants]=useState(3),[questionSet,setQuestionSet]=useState<QuestionSet>('daily'),[tested,setTested]=useState('');
 const signature=JSON.stringify([provider,model,secret]),connected=tested===signature;
 if(!host)return <p className="game-menu-note">방장이 설정하고 시작할 수 있습니다.</p>;
 return <>
  <label className="setting-row">참가 인원<select value={participants} disabled={busy} onChange={e=>setParticipants(Number(e.target.value))}>{[3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}명</option>)}</select></label>
  <label className="setting-row">라운드<select value={rounds} disabled={busy} onChange={e=>setRounds(Number(e.target.value))}>{[3,5,7].map(n=><option key={n} value={n}>{n}회</option>)}</select></label>
  <label className="setting-row">답변 시간<select value={seconds} disabled={busy} onChange={e=>setSeconds(Number(e.target.value))}>{[20,30,45].map(n=><option key={n} value={n}>{n}초</option>)}</select></label>
  <label className="setting-row">질문 세트<select value={questionSet} disabled={busy} onChange={e=>setQuestionSet(e.target.value as QuestionSet)}>{Object.entries(questionSets).map(([id,set])=><option key={id} value={id}>{set.name}</option>)}</select></label>
  <label className="setting-row">AI 제공자<select value={provider} disabled={busy} onChange={e=>{const next=providers.find(p=>p.id===e.target.value)!;setProvider(next.id);setModel(next.models[0].id);setSecret('');setTested('');}}>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
  <label className="ai-key-label">모델<select value={model} disabled={busy} onChange={e=>{setModel(e.target.value);setTested('');}}>{providers.find(p=>p.id===provider)!.models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
  <label className="ai-key-label">API Key<input type="password" autoComplete="off" maxLength={512} value={secret} disabled={busy} onChange={e=>{setSecret(e.target.value);setTested('');}}/></label>
  <p className="game-menu-note">키는 화면 메모리에만 유지됩니다. 새로고침하면 다시 입력해 주세요.</p>
  <Button className="full" variant="outline" disabled={busy||!secret} onClick={async()=>{if(await onTest(provider,model))setTested(signature);}}>{busy?'처리 중…':'연결 테스트'}</Button>
  {connected&&<p className="game-menu-note" role="status">연결되었습니다.</p>}
  <p className="game-menu-note">예상 생성 {rounds}회 · 연결 테스트 1회 별도<br/>실패 시 라운드당 재시도 최대 1회<br/>접속 인원이 설정과 일치해야 합니다.</p>
  <Button className="full" variant="outline" disabled={busy||!connected} onClick={()=>onStart({provider,model,rounds,seconds,participants,questionSet})}>게임 시작</Button>
  {help&&<div className="rules">한 명의 답변을 AI가 대신 작성합니다. 본인에게만 역할이 표시됩니다.<br/>나머지는 입력창으로 답변하며 모두 제출한 뒤 공개됩니다.<br/>라운드마다 30초 대화 후 마지막에 투표합니다.<br/>잠입자를 맞히면 +1점, 잠입자는 틀린 시민 수만큼 점수를 얻습니다.<br/>과반수가 맞히면 시민 승, 그 외에는 잠입자 승입니다.</div>}
 </>;
}
