'use client';
import {useState} from 'react';
import type {InfiltratorView} from './types';
import {Button} from '@/components/ui/button';
export function InfiltratorPanel({state,busy,error,now,keyValue,setKey,onAction,creator}:{state:InfiltratorView;busy:boolean;error:string;now:number;keyValue:string;setKey:(key:string)=>void;onAction:(action:string,extra?:Record<string,unknown>)=>Promise<boolean>;creator:boolean}){
 const [target,setTarget]=useState('');
 if(state.stage==='finished')return null;
 const remaining=Math.max(0,Math.ceil((state.deadline-now)/1000));
 return <div className="infiltrator-panel">
  <div className="infiltrator-heading"><span>{state.round+1}/{state.rounds} · {state.stage==='generating'?'준비 중':state.stage==='answering'?'답변 접수':state.stage==='discussion'?'자유 대화':'투표'} · {remaining}초</span>{creator&&<button disabled={busy} onClick={()=>onAction('stop')}>종료</button>}</div>
  {state.participating&&state.isTarget?<p>본인의 답변은 AI가 대신 작성합니다. 일반 채팅은 계속 가능합니다.</p>:state.stage==='answering'&&state.participating?<p>{state.answered?'답변을 제출했습니다.':'아래 입력창에서 답변해 주세요. 일반 채팅은 말풍선 버튼으로 전환합니다.'}</p>:!state.participating?<p>이번 게임은 관전 중입니다.</p>:null}
  {state.stage==='voting'&&state.participating&&!state.isTarget&&(state.voted?<p>투표를 제출했습니다.</p>:<><label>AI라고 생각하는 사람<select aria-label="AI 잠입자 선택" value={target} onChange={e=>setTarget(e.target.value)}><option value="">선택</option>{state.players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><Button size="sm" variant="outline" disabled={busy||!target} onClick={()=>onAction('vote',{target})}>투표</Button></>)}
  {creator&&state.stage==='generating'&&<><label className="ai-key-label">API Key<input type="password" autoComplete="off" maxLength={512} value={keyValue} disabled={busy} onChange={e=>setKey(e.target.value)}/></label>{!keyValue&&<p>다음 답변 생성을 위해 키를 다시 입력해 주세요.</p>}{state.error&&<><p role="alert">{state.error}</p><Button size="sm" variant="outline" disabled={busy||!keyValue} onClick={()=>onAction('retry')}>다시 시도 (최대 1회)</Button></>}</>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
