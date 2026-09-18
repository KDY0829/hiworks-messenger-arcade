import { getDb,getRawDb } from '@/db';
import { rooms,files } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { accept,known,message,next,publicRoom,tick,validate,type Room } from '@/lib/game';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status});
async function remember(r:Room,token:string,viewing:boolean,now:number){
 const db=getRawDb(),last=r.messages.at(-1)?.time??0;
 await db.prepare('INSERT OR IGNORE INTO memberships(token,room_id,last_read) VALUES(?,?,0)').bind(token,r.id).run();
 if(viewing&&last)await db.prepare('UPDATE memberships SET last_read=? WHERE token=? AND room_id=? AND last_read<?').bind(last,token,r.id,last).run();
}
async function respond(r:Room){
 const publicView=publicRoom(r),tokens=r.players.map(p=>p.id);
 if(tokens.length){const result=await getRawDb().prepare(`SELECT token,photo_id FROM profiles WHERE token IN (${tokens.map(()=>'?').join(',')})`).bind(...tokens).all<{token:string;photo_id:string|null}>();const photos=new Map(result.results.map(p=>[p.token,p.photo_id]));publicView.players=publicView.players.map((p,i)=>({...p,photoId:photos.get(tokens[i])??null}));}
 return Response.json(publicView);
}
const tokenPattern=/^[a-f0-9-]{36}$/;
export async function POST(req:Request){
 try {
  if(req.headers.get('origin') && new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return fail('요청 출처를 확인해 주세요.',403);
  const b=await req.json() as {token:string;action:string;room?:string;name?:string;text?:string;seconds:number;vocabulary?:'basic'|'extended';word?:string;approved?:boolean;viewing?:boolean;fileId?:string}; const db=getDb(); const now=Date.now();
  if(!tokenPattern.test(b.token??''))return fail('접속 정보를 확인해 주세요.');
  if(b.action==='create'){
   const name=String(b.name??'').trim().slice(0,20);if(!name)return fail('이름을 입력해 주세요.');
   const id=crypto.randomUUID().slice(0,8).toUpperCase();
   const r:Room={id,host:b.token,players:[{id:b.token,name,alive:true,score:0,seen:now}],messages:[],phase:'waiting',turn:'',last:'',used:[],deadline:0,seconds:15,vocabulary:'extended',turnCount:0,custom:[],pending:null,created:now};
   message(r,'알림',`${name}님이 대화방을 만들었습니다.`,true);
   await db.insert(rooms).values({id,state:JSON.stringify(r),revision:0,updatedAt:now});
   await remember(r,b.token,b.viewing!==false,now);return respond(r);
  }
  const id=String(b.room??'').toUpperCase();if(!/^[A-F0-9]{8}$/.test(id))return fail('대화방 코드를 확인해 주세요.');
  for(let attempt=0;attempt<5;attempt++){
   const row=await db.select().from(rooms).where(eq(rooms.id,id)).get();if(!row)return fail('대화방을 찾을 수 없습니다.',404);
   const r:Room=JSON.parse(row.state);const p=r.players.find(p=>p.id===b.token);let changed=tick(r,now);
   if(r.direct&&!p)return fail('초대된 참여자만 입장할 수 있습니다.',403);
   if(b.action==='join'){
    if(p){p.seen=now;if(b.name)p.name=String(b.name).trim().slice(0,20)||p.name;changed=true;}else{
     if(r.phase==='playing')return fail('진행 중입니다. 대화가 끝난 뒤 입장해 주세요.');
     if(r.players.length>=10)return fail('최대 10명까지 입장할 수 있습니다.');
     const name=String(b.name??'').trim().slice(0,20);if(!name)return fail('이름을 입력해 주세요.');
     if(r.players.some(p=>p.name===name))return fail('이미 사용 중인 이름입니다.');
     r.players.push({id:b.token,name,alive:true,score:0,seen:now});message(r,'알림',`${name}님이 들어왔습니다.`,true);changed=true;
    }
   }else{
    if(!p)return fail('먼저 입장해 주세요.',403);
    if(now-p.seen>5000){p.seen=now;changed=true;await getRawDb().prepare('UPDATE profiles SET seen_at=? WHERE token=?').bind(now,b.token).run();}
    if(b.action==='start'){
     if(r.host!==b.token)return fail('방장만 시작할 수 있습니다.',403);
     if(r.phase==='playing')return fail('이미 진행 중입니다.');
     if(r.players.filter(p=>now-p.seen<15000).length<2)return fail('접속 중인 참여자가 2명 이상 필요합니다.');
     r.players=r.players.filter(p=>now-p.seen<15000);r.players.forEach(p=>{p.alive=true;p.score=0;});
     r.phase='playing';r.turn=r.players[0].id;r.used=[];r.last='';r.pending=null;r.turnCount=0;r.deadline=now+r.seconds*1000;
     message(r,'알림','순서대로 이어 주세요. 첫 단어는 자유입니다.',true);changed=true;
    }else if(b.action==='stop'){
     if(r.host!==b.token)return fail('방장만 정지할 수 있습니다.',403);
     r.phase='waiting';r.pending=null;r.deadline=0;message(r,'알림','잠시 쉬어갑니다.',true);changed=true;
    }else if(b.action==='settings'){
     if(r.host!==b.token || r.phase==='playing')return fail('대기 중에 방장만 변경할 수 있습니다.',403);
     if(![5,10,15,20,30].includes(b.seconds))return fail('제한시간을 확인해 주세요.');
     if(b.vocabulary && !['basic','extended'].includes(b.vocabulary))return fail('단어 범위를 확인해 주세요.');
     r.seconds=b.seconds;if(b.vocabulary)r.vocabulary=b.vocabulary;changed=true;
    }else if(b.action==='word'){
     if(r.phase!=='playing'||r.turn!==b.token||!p.alive)return fail('지금은 내 차례가 아닙니다.');
     const w=String(b.text??'').trim();const error=validate(r,w);if(error)return fail(error);
     if(!known(r,w)){r.pending={word:w,player:p.id};changed=true;}else{accept(r,p,w,now);changed=true;}
    }else if(b.action==='approve'){
     if(r.host!==b.token)return fail('방장만 확인할 수 있습니다.',403);
     if(!r.pending||r.phase!=='playing')return fail('확인할 단어가 없습니다.');
     if(b.word!==r.pending.word)return fail('확인 중인 단어가 바뀌었습니다.');
     if(b.approved){const owner=r.players.find(p=>p.id===r.pending!.player)!;r.custom.push(r.pending.word);accept(r,owner,r.pending.word,now);}else{r.pending=null;}
     changed=true;
    }else if(b.action==='attachment'){
     const file=await db.select({id:files.id,name:files.name,size:files.size,mime:files.mime}).from(files).where(and(eq(files.id,String(b.fileId??'')),eq(files.roomId,id),eq(files.owner,b.token))).get();
     if(!file)return fail('첨부파일을 찾을 수 없습니다.',404);
     if(!r.messages.some(m=>m.attachment?.id===file.id)){message(r,p.name,file.name);r.messages.at(-1)!.attachment=file;changed=true;}
    }else if(b.action==='chat'){
     const text=String(b.text??'').trim().slice(0,500);if(!text)return fail('메시지를 입력해 주세요.');
     const last=r.messages.filter(m=>m.name===p.name).at(-1);if(last && now-last.time<500)return fail('잠시 후 보내 주세요.');
     message(r,p.name,text);changed=true;
    }else if(b.action==='leave'){
     if(r.phase==='playing'&&p.alive){p.alive=false;if(r.turn===p.id)next(r,now,true);else if(r.players.filter(p=>p.alive).length<=1){r.turn=p.id;next(r,now,true);}}
     r.players=r.players.filter(p=>p.id!==b.token);if(r.host===b.token)r.host=r.players[0]?.id??'';message(r,'알림',`${p.name}님이 나갔습니다.`,true);changed=true;
    }else if(b.action!=='poll')return fail('지원하지 않는 요청입니다.');
   }
   if(changed){const updated=await db.update(rooms).set({state:JSON.stringify(r),revision:row.revision+1,updatedAt:now}).where(and(eq(rooms.id,id),eq(rooms.revision,row.revision))).returning({id:rooms.id});if(!updated.length)continue;}
   await remember(r,b.token,b.viewing!==false,now);return respond(r);
  }
  return fail('메시지가 겹쳤습니다. 다시 보내 주세요.',409);
 }catch(e){console.error('room request failed',e);return fail('연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',503);}
}
