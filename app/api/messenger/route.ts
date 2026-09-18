import {getRawDb} from '@/db';
import {message,type Room} from '@/lib/game';
export const dynamic='force-dynamic';
type Profile={token:string;public_id:string;name:string;status:string;photo_id:string|null;seen_at:number};
const fail=(error:string,status=400)=>Response.json({error},{status});
const safe=(p:Profile)=>({id:p.public_id,name:p.name,status:p.status,photoId:p.photo_id,online:Date.now()-p.seen_at<15000});
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return fail('요청 출처를 확인해 주세요.',403);
  const b=await req.json() as {token:string;action:string;name?:string;status?:string;friendId?:string};
  if(!/^[a-f0-9-]{36}$/.test(b.token??''))return fail('접속 정보를 확인해 주세요.',403);
  const db=getRawDb(),now=Date.now();let me=await db.prepare('SELECT * FROM profiles WHERE token=?').bind(b.token).first<Profile>();
  if(!me){const name=String(b.name??'').trim().slice(0,20);if(!name)return fail('이름을 입력해 주세요.');await db.prepare('INSERT INTO profiles(token,public_id,name,seen_at) VALUES(?,?,?,?)').bind(b.token,b.token.slice(0,8).toUpperCase(),name,now).run();me=await db.prepare('SELECT * FROM profiles WHERE token=?').bind(b.token).first<Profile>();}
  if(!me)return fail('프로필을 불러오지 못했습니다.',503);
  if(b.action==='profile'){
   const name=String(b.name??'').trim().slice(0,20),status=String(b.status??'').trim().slice(0,60);if(!name)return fail('이름을 입력해 주세요.');
   await db.prepare('UPDATE profiles SET name=?,status=?,seen_at=? WHERE token=?').bind(name,status,now,b.token).run();me={...me,name,status,seen_at:now};
  }else{await db.prepare('UPDATE profiles SET seen_at=? WHERE token=?').bind(now,b.token).run();}
  if(['addfriend','removefriend','direct'].includes(b.action)){
   const friendId=String(b.friendId??'').trim().toUpperCase();if(!/^[A-F0-9]{8}$/.test(friendId)||friendId===me.public_id)return fail('친구 코드를 확인해 주세요.');
   const friend=await db.prepare('SELECT * FROM profiles WHERE public_id=?').bind(friendId).first<Profile>();if(!friend)return fail('등록된 친구를 찾을 수 없습니다.',404);
   if(b.action==='addfriend')await db.prepare('INSERT OR IGNORE INTO contacts(owner,friend_id) VALUES(?,?)').bind(b.token,friendId).run();
   else if(b.action==='removefriend')await db.prepare('DELETE FROM contacts WHERE owner=? AND friend_id=?').bind(b.token,friendId).run();
   else{
    if(!await db.prepare('SELECT 1 FROM contacts WHERE owner=? AND friend_id=?').bind(b.token,friendId).first())return fail('먼저 친구를 추가해 주세요.',403);
    const pair=[me.public_id,friendId].sort().join(':');let direct=await db.prepare('SELECT room_id FROM direct_rooms WHERE pair=?').bind(pair).first<{room_id:string}>();
    if(!direct){
     const id=crypto.randomUUID().slice(0,8).toUpperCase();const r:Room={id,host:b.token,direct:true,players:[{id:b.token,name:me.name,alive:true,score:0,seen:now},{id:friend.token,name:friend.name,alive:true,score:0,seen:0}],messages:[],phase:'waiting',turn:'',last:'',used:[],deadline:0,seconds:15,vocabulary:'extended',turnCount:0,custom:[],pending:null,created:now};message(r,'알림','대화가 시작되었습니다.',true);
     await db.batch([db.prepare('INSERT INTO rooms(id,state,revision,updated_at) VALUES(?,?,0,?)').bind(id,JSON.stringify(r),now),db.prepare('INSERT OR IGNORE INTO direct_rooms(pair,room_id) VALUES(?,?)').bind(pair,id),db.prepare('INSERT OR IGNORE INTO memberships(token,room_id,last_read) VALUES(?,?,?)').bind(b.token,id,now),db.prepare('INSERT OR IGNORE INTO memberships(token,room_id,last_read) VALUES(?,?,0)').bind(friend.token,id)]);
     direct=await db.prepare('SELECT room_id FROM direct_rooms WHERE pair=?').bind(pair).first<{room_id:string}>();
    }
    return Response.json({roomId:direct!.room_id});
   }
  }else if(!['list','profile'].includes(b.action))return fail('지원하지 않는 요청입니다.');
  const friends=await db.prepare('SELECT p.* FROM contacts c JOIN profiles p ON p.public_id=c.friend_id WHERE c.owner=? ORDER BY p.name').bind(b.token).all<Profile>();
  const recent=await db.prepare('SELECT r.state,m.last_read FROM memberships m JOIN rooms r ON r.id=m.room_id WHERE m.token=? ORDER BY r.updated_at DESC LIMIT 100').bind(b.token).all<{state:string;last_read:number}>();
  const previews=recent.results.map(row=>{const r:Room=JSON.parse(row.state),last=r.messages.at(-1);return {id:r.id,names:r.players.map(p=>p.name),direct:!!r.direct,photoId:null as string|null,last:last?.attachment?`파일: ${last.attachment.name}`:last?.text??'',time:last?.time??r.created,unread:r.messages.filter(m=>m.time>row.last_read&&!m.system&&(m.senderId?m.senderId!==me!.public_id.toLowerCase():m.name!==me!.name)).length};}).sort((a,b)=>b.time-a.time);
  const events=await db.prepare('SELECT e.room_id,e.text,e.time,(SELECT count(*) FROM game_events u WHERE u.room_id=e.room_id AND u.time>m.last_read) AS unread FROM memberships m JOIN game_events e ON e.room_id=m.room_id WHERE m.token=? AND e.id=(SELECT id FROM game_events WHERE room_id=m.room_id ORDER BY time DESC,id DESC LIMIT 1)').bind(b.token).all<{room_id:string;text:string;time:number;unread:number}>();
  for(const preview of previews){const event=events.results.find(e=>e.room_id===preview.id);if(!event)continue;preview.unread+=event.unread;if(event.time>=preview.time){preview.last=event.text;preview.time=event.time;}}previews.sort((a,b)=>b.time-a.time);
  const shared=await db.prepare('SELECT f.id,f.name,f.size,f.mime,f.room_id AS roomId,f.created_at AS createdAt FROM files f JOIN memberships m ON m.room_id=f.room_id WHERE m.token=? ORDER BY f.created_at DESC LIMIT 100').bind(b.token).all();
  const ids=[...new Set(recent.results.flatMap(row=>{const r:Room=JSON.parse(row.state);return r.direct?r.players.map(p=>p.id):[];}))];
  if(ids.length){const people=await db.prepare(`SELECT token,name,photo_id FROM profiles WHERE token IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<{token:string;name:string;photo_id:string|null}>();for(const preview of previews){if(!preview.direct)continue;const raw=recent.results.find(row=>(JSON.parse(row.state) as Room).id===preview.id)!;const r:Room=JSON.parse(raw.state),other=r.players.find(p=>p.id!==b.token),person=people.results.find(p=>p.token===other?.id);if(person){preview.photoId=person.photo_id;preview.names=[me.name,person.name];}}}
  return Response.json({profile:safe(me),friends:friends.results.map(safe),rooms:previews,files:shared.results});
 }catch(e){console.error('messenger request failed',e);return fail('목록을 불러오지 못했습니다. 다시 시도해 주세요.',503);}
}
