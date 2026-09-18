import {getDb} from '@/db';
import {env} from 'cloudflare:workers';
import {files,rooms,profiles} from '@/db/schema';
import {eq,sql} from 'drizzle-orm';
import type {Room} from '@/lib/game';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status});
const MAX=512*1024;
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return fail('요청 출처를 확인해 주세요.',403);
  if(Number(req.headers.get('content-length')??0)>MAX+8192)return fail('파일은 512KB 이하로 첨부해 주세요.',413);
  const form=await req.formData(),token=String(form.get('token')??''),roomId=form.get('purpose')==='profile'?'@profile':String(form.get('room')??'');
  if(!/^[a-f0-9-]{36}$/.test(token)||(roomId!=='@profile'&&!/^[A-F0-9]{8}$/.test(roomId)))return fail('접속 정보를 확인해 주세요.',403);
  const file=form.get('file');if(!(file instanceof File)||!file.size)return fail('첨부할 파일을 선택해 주세요.');
  if(file.size>MAX)return fail('파일은 512KB 이하로 첨부해 주세요.',413);
  const db=getDb();
  if(roomId==='@profile'){if(!await db.select({token:profiles.token}).from(profiles).where(eq(profiles.token,token)).get())return fail('먼저 프로필을 등록해 주세요.',403);}
  const row=roomId==='@profile'?null:await db.select().from(rooms).where(eq(rooms.id,roomId)).get();
  if(roomId!=='@profile'&&(!row||!(JSON.parse(row.state) as Room).players.some(p=>p.id===token)))return fail('먼저 대화방에 참여해 주세요.',403);
  const quota=await db.select({total:sql<number>`count(*)`}).from(files).where(eq(files.roomId,roomId)).get();
  if(roomId!=='@profile'&&(quota?.total??0)>=100)return fail('이 대화방의 첨부 한도(100개)에 도달했습니다.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  let mime='application/octet-stream';
  const match=(prefix:number[])=>prefix.every((v,i)=>bytes[i]===v);
  if(match([137,80,78,71,13,10,26,10]))mime='image/png';
  else if(match([255,216,255]))mime='image/jpeg';
  else if(match([71,73,70,56,55,97])||match([71,73,70,56,57,97]))mime='image/gif';
  else if(match([82,73,70,70])&&bytes[8]===87&&bytes[9]===69&&bytes[10]===66&&bytes[11]===80)mime='image/webp';
  if(roomId==='@profile'&&!mime.startsWith('image/'))return fail('PNG, JPG, GIF, WebP 사진을 선택해 주세요.');
  if(!env.FILES)return fail('파일 저장소에 연결하지 못했습니다.',503);
  const id=crypto.randomUUID(),name=file.name.replace(/[\/\\\x00-\x1f\x7f]/g,'_').slice(0,120)||'첨부파일';
  await env.FILES.put(id,bytes,{httpMetadata:{contentType:mime}});
  await db.insert(files).values({id,roomId,owner:token,name,size:file.size,mime,data:'',createdAt:Date.now()});
  if(roomId==='@profile'){const old=await db.select({photoId:profiles.photoId}).from(profiles).where(eq(profiles.token,token)).get();await db.update(profiles).set({photoId:id}).where(eq(profiles.token,token));if(old?.photoId){await env.FILES.delete(old.photoId);await db.delete(files).where(eq(files.id,old.photoId));}}
  return Response.json({id,name,size:file.size,mime});
 }catch(e){console.error('file upload failed',e);return fail('파일을 첨부하지 못했습니다.',503);}
}
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get('id');if(!id||!/^[a-f0-9-]{36}$/.test(id))return fail('파일을 찾을 수 없습니다.',404);
 const db=getDb(),file=await db.select().from(files).where(eq(files.id,id)).get();if(!file)return fail('파일을 찾을 수 없습니다.',404);
 const row=await db.select({state:rooms.state}).from(rooms).where(eq(rooms.id,file.roomId)).get();
 const photo=file.roomId==='@profile'?await db.select({token:profiles.token}).from(profiles).where(eq(profiles.photoId,id)).get():null;
 if(!photo&&(!row||!(JSON.parse(row.state) as Room).messages.some(m=>m.attachment?.id===id)))return fail('파일을 찾을 수 없습니다.',404);
 const object=file.data?null:await env.FILES?.get(id);if(!file.data&&!object)return fail('파일을 찾을 수 없습니다.',404);
 const bytes=file.data?Uint8Array.from(atob(file.data),c=>c.charCodeAt(0)):new Uint8Array(await object!.arrayBuffer());
 const preview=new URL(req.url).searchParams.get('preview')==='1'&&file.mime.startsWith('image/');
 return new Response(bytes,{headers:{'Content-Type':preview?file.mime:'application/octet-stream','Content-Length':String(bytes.length),'Content-Disposition':`${preview?'inline':'attachment'}; filename="attachment"; filename*=UTF-8''${encodeURIComponent(file.name)}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=3600','Referrer-Policy':'no-referrer'}});
}
