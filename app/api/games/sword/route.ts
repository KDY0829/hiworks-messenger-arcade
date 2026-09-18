import {getRawDb} from '@/db';
import type {Room} from '@/lib/game';
import {initialState,handleAction} from '@/games/sword-enhancement/engine';
import type {SwordState,SwordAction} from '@/games/sword-enhancement/types';
export const dynamic='force-dynamic';
type Row={state:string;revision:number;last_request:string};
const fail=(error:string,status=400)=>Response.json({error},{status});
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return fail('요청 출처를 확인해 주세요.',403);
  const b=await req.json() as {token:string;room:string;action:string;revision:number;requestId:string;item?:string};
  if(!/^[a-f0-9-]{36}$/.test(b.token??'')||!/^[A-F0-9]{8}$/.test(b.room??''))return fail('접속 정보를 확인해 주세요.',403);
  const db=getRawDb(),row=await db.prepare('SELECT state FROM rooms WHERE id=?').bind(b.room).first<{state:string}>();
  const room:Room|null=row?JSON.parse(row.state):null,player=room?.players.find(p=>p.id===b.token);
  if(!room||!player)return fail('먼저 대화방에 참여해 주세요.',403);
  if(!['get','start','stop','enhance','sell','buy'].includes(b.action))return fail('지원하지 않는 요청입니다.');
  await db.prepare('INSERT OR IGNORE INTO sword_progress(token,state) VALUES(?,?)').bind(b.token,JSON.stringify(initialState())).run();
  const current=(await db.prepare('SELECT state,revision,last_request FROM sword_progress WHERE token=?').bind(b.token).first<Row>())!;
  const view=(r:Row)=>({state:JSON.parse(r.state) as SwordState,revision:r.revision});
  if(b.action==='get'||current.last_request===b.requestId)return Response.json(view(current));
  if(!/^[a-f0-9-]{36}$/.test(b.requestId??''))return fail('요청 정보를 확인해 주세요.');
  if(b.revision!==current.revision)return fail('장비 상태가 변경되었습니다. 다시 확인해 주세요.',409);
  if(room.phase==='playing'&&b.action!=='stop')return fail('끝말잇기가 끝난 뒤 시작해 주세요.');
  const roll=crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*100;
  const {state,shared}=handleAction(JSON.parse(current.state),b.action as SwordAction,b.room,b.item,roll);
  const statements=[db.prepare('UPDATE sword_progress SET state=?,revision=revision+1,last_request=? WHERE token=? AND revision=?').bind(JSON.stringify(state),b.requestId,b.token,current.revision)];
  if(shared)statements.push(db.prepare('INSERT OR IGNORE INTO game_events(id,room_id,name,text,time) SELECT ?,?,?,?,? FROM sword_progress WHERE token=? AND revision=? AND last_request=?').bind(b.requestId,b.room,'알림',`${player.name}님 · ${state.result}`,Date.now(),b.token,current.revision+1,b.requestId));
  const result=await db.batch(statements);
  if(!result[0].meta.changes)return fail('요청이 겹쳤습니다. 장비 상태를 다시 확인해 주세요.',409);
  return Response.json({state,revision:current.revision+1});
 }catch(e){if(e instanceof Error&&['골드','최대 강화','먼저 시작','시작 검','상품','기본 검','지원하지'].some(s=>e.message.includes(s)))return fail(e.message);console.error('sword request failed',e);return fail('장비 기록을 처리하지 못했습니다. 다시 시도해 주세요.',503);}
}
