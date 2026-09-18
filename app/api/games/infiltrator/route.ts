import {getRawDb} from '@/db';
import type {Room} from '@/lib/game';
import {start,answer,vote,claim,complete,stop,tickInfiltrator,privateView,prompt,config} from '@/games/ai-infiltrator/engine';
import type {Settings} from '@/games/ai-infiltrator/types';
import {questionSets} from '@/games/ai-infiltrator/questions';
import {validModel} from '@/ai/config';
import {generate} from '@/ai/providers/registry';
import {ProviderError,errorMessages} from '@/ai/providers/types';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
const response=(room:Room,token:string)=>Response.json({state:privateView(room,token)},{headers:{'Cache-Control':'no-store'}});
type Body={token:string;room:string;action:string;settings:Settings;key:string;text:string;target:string;gameId:string;round:number;provider:string;model:string};
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return fail('요청 출처를 확인해 주세요.',403);
  if(Number(req.headers.get('content-length')??0)>4096)return fail('요청이 너무 큽니다.',413);
  const b=await req.json() as Body;
  if(!/^[a-f0-9-]{36}$/.test(b.token??'')||!/^[A-F0-9]{8}$/.test(b.room??''))return fail('접속 정보를 확인해 주세요.',403);
  const db=getRawDb();
  async function load(){const row=await db.prepare('SELECT state,revision FROM rooms WHERE id=?').bind(b.room).first<{state:string;revision:number}>();if(!row)return null;return {room:JSON.parse(row.state) as Room,revision:row.revision};}
  async function save(room:Room,revision:number){const result=await db.prepare('UPDATE rooms SET state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(room),Date.now(),b.room,revision).run();return !!result.meta.changes;}
  let lease='',gameId='',round=0,model='',provider='',question='';
  for(let attempt=0;attempt<5;attempt++){
   const current=await load();if(!current||!current.room.players.some(p=>p.id===b.token))return fail('먼저 대화방에 참여해 주세요.',403);
   const r=current.room,now=Date.now();let changed=tickInfiltrator(r,now);
   if(b.action==='test'){
    if(r.host!==b.token)return fail('방장만 연결을 테스트할 수 있습니다.',403);
    if(now-(r.aiTestAt??0)<5000)return fail('잠시 후 다시 테스트해 주세요.',429);
    r.aiTestAt=now;if(!await save(r,current.revision))continue;
    try{await generate(b.provider,b.model,b.key,'한국어로 확인이라고만 답해라.');return Response.json({connected:true},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e instanceof ProviderError?errorMessages[e.code]:'연결 테스트에 실패했습니다.',400);}
   }
   if(b.action==='start'){
    if(r.host!==b.token)return fail('방장만 시작할 수 있습니다.',403);
    const s=b.settings;
    if(!s||!validModel(s.provider,s.model)||![3,5,7].includes(s.rounds)||![20,30,45].includes(s.seconds)||!Number.isInteger(s.participants)||s.participants<3||s.participants>8||!Object.hasOwn(questionSets,s.questionSet))return fail('게임 설정을 확인해 주세요.');
    start(r,{provider:s.provider,model:s.model,rounds:s.rounds,seconds:s.seconds,participants:s.participants,questionSet:s.questionSet},now);changed=true;
   }else if(b.action!=='get'){
    const s=r.infiltrator;
    if(!s||b.gameId!==s.id||b.round!==s.round)return fail('게임 상태가 변경되었습니다. 다시 확인해 주세요.',409);
    if(b.action==='answer'){answer(r,b.token,String(b.text??''),now);changed=true;}
    else if(b.action==='vote'){const p=s.players.find(p=>p.id.slice(0,8)===b.target);if(!p)return fail('참여자를 확인해 주세요.');vote(r,b.token,p.id,now);changed=true;}
    else if(['stop','retry','generate'].includes(b.action)){
     if(s.creator!==b.token)return fail('게임 생성자만 처리할 수 있습니다.',403);
     if(b.action==='stop'){stop(r);changed=true;}
     else if(b.action==='retry'){if(s.stage!=='generating'||!s.error||s.attempts>=config.maxAttempts)return fail('재시도할 수 없습니다.');s.error='';s.deadline=now+60000;changed=true;}
     else{if(typeof b.key!=='string'||b.key.length<10||b.key.length>512||/[\r\n]/.test(b.key))return fail('API Key를 확인해 주세요.');lease=claim(r,now);gameId=s.id;round=s.round;model=s.model;provider=s.provider;question=s.questions[s.round];changed=true;}
    }else return fail('지원하지 않는 요청입니다.');
   }
   if(changed&&!await save(r,current.revision)){lease='';continue;}
   if(b.action!=='generate')return response(r,b.token);
   break;
  }
  if(!lease)return fail('요청이 겹쳤습니다. 다시 확인해 주세요.',409);
  let text='',error='';try{text=await generate(provider,model,b.key,prompt(question,round));}catch(e){error=e instanceof ProviderError?errorMessages[e.code]:'AI 응답을 받지 못했습니다.';}
  for(let attempt=0;attempt<5;attempt++){
   const current=await load();if(!current)return fail('대화방을 찾을 수 없습니다.',404);
   const r=current.room;if(r.infiltrator?.id!==gameId||r.infiltrator.round!==round||!complete(r,lease,text,error,Date.now()))return response(r,b.token);
   if(await save(r,current.revision))return response(r,b.token);
  }
  return fail('상태를 저장하지 못했습니다. 잠시 후 확인해 주세요.',409);
 }catch(e){
  // Never log the exception: request headers or provider errors can contain secrets.
  const allowed=['이미 게임','설정한 인원','지금은 답변','답변은','지금은 투표','AI 요청'];
  return fail(e instanceof Error&&allowed.some(prefix=>e.message.startsWith(prefix))?e.message:'게임 요청을 처리하지 못했습니다.',400);
 }
}
