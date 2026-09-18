'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {enhancementLevels,settings,shop} from './config';
import {describeSword} from './engine';
import type {SwordState,SwordAction} from './types';
export default function SwordPanel({state,busy,paused,error,onAction}:{state:SwordState;busy:boolean;paused:boolean;error:string;onAction:(action:SwordAction,item?:string)=>Promise<boolean>}){
 const [tab,setTab]=useState<'equipment'|'shop'|'records'>('equipment');
 const rule=enhancementLevels[state.level],disabled=busy||paused;
 const success=Math.min(100-rule.downgradeChance-rule.destroyChance,rule.successRate+(state.boost?settings.boostBonus:0));
 return <section className="sword-card" aria-label="장비 관리">
  <header><strong>장비 관리</strong><span>{state.gold.toLocaleString()} G</span><button disabled={busy} onClick={()=>void onAction('stop')}>종료</button></header>
  <nav aria-label="장비 메뉴">{([['equipment','장비'],['shop','상점'],['records','기록']] as const).map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  {paused&&<p role="status">끝말잇기 진행 중 · 장비 처리는 잠시 쉽니다.</p>}
  {tab==='equipment'&&<><strong>{describeSword(state.level)}</strong><div className="sword-facts"><span>장비 점수 {rule.power.toLocaleString()}</span><span>성공 {state.level>=settings.maxLevel?'최대 단계':`${success}%`}</span><span>강화 비용 {rule.cost.toLocaleString()} G</span><span>판매가 {rule.sellValue.toLocaleString()} G</span></div><small>하락 {rule.downgradeChance}% · 파괴 {rule.destroyChance}% · 보조권 {state.boost} · 방지권 {state.shield}</small><div className="sword-buttons"><Button variant="outline" size="sm" disabled={disabled||state.level>=settings.maxLevel||state.gold<rule.cost} onClick={()=>void onAction('enhance')}>강화</Button><Button variant="outline" size="sm" disabled={disabled||state.level===0} onClick={()=>void onAction('sell')}>판매</Button></div></>}
  {tab==='shop'&&<div className="sword-shop">{shop.map(item=><div key={item.id}><span>{item.name}<small>{item.price.toLocaleString()} G</small></span><Button variant="outline" size="sm" disabled={disabled||state.gold<item.price||(item.id==='starter'&&state.level!==0)} onClick={()=>void onAction('buy',item.id)}>구매</Button></div>)}<small>보조권은 다음 강화에 자동 사용됩니다. 방지권은 파괴 판정 때 단계를 유지합니다.</small></div>}
  {tab==='records'&&<div className="sword-records"><p>최고 강화 +{state.best} · 최고 판매 {state.bestSale.toLocaleString()} G</p><p>총 {state.attempts}회 · 성공 {state.successes} · 실패 {state.failures} · 파괴 {state.destroyed}</p><details><summary>발견한 장비 ({state.discovered.length})</summary>{[...state.discovered].sort((a,b)=>a-b).map(level=><div key={level}>{describeSword(level)}</div>)}</details><details><summary>최근 처리 기록</summary>{state.history.map((text,i)=><div key={i}>{text}</div>)}</details></div>}
  <p className="sword-result" role="status">{busy?'처리 중…':state.result}</p>{error&&<p className="error" role="alert">{error}</p>}
 </section>;
}
