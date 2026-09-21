import type {InfiltratorState} from '@/games/ai-infiltrator/types';
import type {QuizState} from '@/games/general-quiz/types';
import { initials } from './words';
import { words, basicWords } from './dictionary';
export type Player = { id: string; name: string; alive: boolean; score: number; seen: number };
export type Message = { id: string; name: string; text: string; time: number; system?: boolean; senderId?: string; attachment?: {id:string;name:string;size:number;mime:string} };
export type Room = { id: string; host: string; players: Player[]; messages: Message[]; direct?: boolean; phase: 'waiting'|'playing'|'finished'; turn: string; last: string; used: string[]; deadline: number; seconds: number; vocabulary?: 'basic'|'extended'; turnCount: number; custom: string[]; pending: {word:string; player:string} | null; created: number; infiltrator?:InfiltratorState; quiz?:QuizState; aiTestAt?:number };
export function message(r:Room, name:string, text:string, system=false) {const time=Math.max(Date.now(),(r.messages.at(-1)?.time??0)+1);r.messages.push({id:crypto.randomUUID(),name,text,time,system,senderId:system?undefined:r.players.find(p=>p.name===name)?.id.slice(0,8)}); r.messages = r.messages.slice(-150);}
export function next(r:Room, now:number, eliminated=false) {
  r.pending=null;
  const index=r.players.findIndex(p=>p.id===r.turn);
  const alive=r.players.filter(p=>p.alive);
  if(alive.length<=1){r.phase='finished';r.deadline=0;message(r,'알림',`${alive[0]?.name ?? '모두'}님이 마지막까지 남았습니다.`,true);return;}
  for(let n=1;n<=r.players.length;n++){const p=r.players[(index+n)%r.players.length];if(p.alive){r.turn=p.id;break;}}
  if(eliminated){r.last='';r.used=[];r.turnCount=0;}
  r.pending=null;
  r.deadline=now + Math.max(3,r.seconds-Math.floor(r.turnCount/10))*1000;
}
export function tick(r:Room, now:number) {
  if(r.phase==='playing' && now>=r.deadline){
    const p=r.players.find(p=>p.id===r.turn);if(p){p.alive=false;message(r,'알림',`${p.name}님 응답 시간이 지났습니다.`,true);}
    next(r,now,true);return true;
  }
  return false;
}
export function validate(r:Room,w:string){
  if(!/^[가-힣]{2,100}$/.test(w)) return '한글 2~100글자로 입력해 주세요.';
  if(r.used.includes(w)) return '이미 나온 단어입니다.';
  if(r.last && !initials(r.last.slice(-1)).includes(w[0])) return `‘${initials(r.last.slice(-1)).join(' / ')}’로 시작해 주세요.`;
  return null;
}
export function accept(r:Room,p:Player,w:string,now:number){message(r,p.name,w);r.last=w;r.used.push(w);r.turnCount++;p.score+=w.length*10;next(r,now);}
function vocabulary(r:Room){return r.vocabulary==='basic'?basicWords:words;}
export function known(r:Room,w:string){return vocabulary(r).has(w)||r.custom.includes(w);}
export function publicRoom(r:Room){const selected=vocabulary(r);const {infiltrator,quiz,aiTestAt,...safe}=r;void infiltrator;void quiz;void aiTestAt;return {...safe,host:r.host.slice(0,8),turn:r.turn.slice(0,8),pending:r.pending?{...r.pending,player:r.pending.player.slice(0,8)}:null,serverTime:Date.now(),wordCount:selected.size+r.custom.filter(w=>!selected.has(w)).length,players:r.players.map(({seen,...p})=>({...p,id:p.id.slice(0,8),online:Date.now()-seen<15000}))};}
