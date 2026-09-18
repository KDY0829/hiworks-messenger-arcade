import {enhancementLevels,settings,tiers,shop} from './config';
import type {SwordState,SwordAction} from './types';
export const getSwordTier=(level:number)=>tiers.filter(t=>t.level<=level).at(-1)!.name;
export const describeSword=(level:number)=>`${getSwordTier(level)} +${level}`;
export function initialState():SwordState{return {level:0,gold:settings.initialGold,boost:0,shield:0,best:0,bestSale:0,attempts:0,successes:0,failures:0,destroyed:0,discovered:[0],activeRoom:null,result:'기본 장비가 지급되었습니다.',history:[]};}
export function calculateEnhancementResult(level:number,boost:boolean,roll:number){
 const rule=enhancementLevels[level];
 if(!rule||level>=settings.maxLevel)throw new Error('최대 강화 단계입니다.');
 const success=Math.min(100-rule.downgradeChance-rule.destroyChance,rule.successRate+(boost?settings.boostBonus:0));
 return roll<success?'success':roll<success+rule.destroyChance?'destroy':roll<success+rule.destroyChance+rule.downgradeChance?'downgrade':'maintain';
}
export function handleAction(current:SwordState,action:SwordAction,room:string,item?:string,roll=0){
 const state: SwordState=structuredClone(current);let shared=false;
 const before=describeSword(state.level);
 if(action==='start'){state.activeRoom=room;state.result='검 강화하기를 시작했습니다. 저장된 장비를 이어갑니다.';shared=current.activeRoom!==room;}
 else if(action==='stop'){state.activeRoom=null;state.result='장비 기록을 저장하고 종료했습니다.';}
 else{
  if(state.activeRoom!==room)throw new Error('이 대화방에서 검 강화하기를 먼저 시작해 주세요.');
  if(action==='enhance'){
   const cost=enhancementLevels[state.level]?.cost;if(state.level>=settings.maxLevel)throw new Error('최대 강화 단계입니다. 판매하거나 기록을 확인해 주세요.');
   if(state.gold<cost)throw new Error('골드가 부족합니다. 장비를 판매해 주세요.');
   state.gold-=cost;state.attempts++;
   const result=calculateEnhancementResult(state.level,state.boost>0,roll);if(state.boost>0)state.boost--;
   if(result==='success'){state.level++;state.successes++;state.result=`강화 성공: ${before} → ${describeSword(state.level)}`;shared=state.level>state.best||state.level>=settings.shareLevel;}
   else{state.failures++;
    if(result==='destroy'&&state.shield>0){state.shield--;state.result=`파괴 방지권 사용: ${before} 유지`;}
    else if(result==='destroy'){state.level=0;state.destroyed++;state.result=`장비 파괴: ${before} · 기본 검 재지급`;shared=true;}
    else if(result==='downgrade'){state.level=Math.max(0,state.level-1);state.result=`강화 실패·단계 하락: ${before} → ${describeSword(state.level)}`;}
    else state.result=`강화 실패·단계 유지: ${before}`;
   }
  }else if(action==='sell'){
   if(state.level===0)throw new Error('기본 검은 판매할 수 없습니다.');
   const value=enhancementLevels[state.level].sellValue;state.gold+=value;state.bestSale=Math.max(state.bestSale,value);state.level=0;state.result=`${before} 판매 완료: +${value.toLocaleString()} G · 기본 검 재지급`;shared=value>=settings.shareSale;
  }else if(action==='buy'){
   const product=shop.find(p=>p.id===item);if(!product)throw new Error('상품을 확인해 주세요.');
   if(item==='starter'&&state.level!==0)throw new Error('시작 검은 기본 검 +0일 때 구매할 수 있습니다.');
   if(state.gold<product.price)throw new Error('골드가 부족합니다.');
   state.gold-=product.price;if(item==='starter')state.level=6;else if(item==='boost')state.boost++;else state.shield++;
   state.result=`${product.name} 구매 완료: -${product.price.toLocaleString()} G`;
  }else throw new Error('지원하지 않는 요청입니다.');
  if(state.level===0&&state.gold<enhancementLevels[0].cost){state.gold+=settings.rescueGold;state.result+=` · 재시작 지원금 ${settings.rescueGold} G`;}
 }
 if(!state.discovered.includes(state.level))state.discovered.push(state.level);
 if(action==='enhance')state.best=Math.max(state.best,state.level);
 state.history=[...state.history,state.result].slice(-20);
 return {state,shared};
}
