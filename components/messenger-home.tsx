'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Bell,Users,MessageCircle,FolderDown,MoreHorizontal,Minus,Square,X,Search,Plus,ChevronDown,Paperclip,Camera,Copy,Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
type Profile={id:string;name:string;status:string;photoId:string|null;online:boolean};
type Recent={id:string;names:string[];direct:boolean;photoId?:string|null;last:string;time:number;unread:number};
type SharedFile={id:string;name:string;size:number;mime:string;roomId:string;createdAt:number};
type Data={profile:Profile;friends:Profile[];rooms:Recent[];files:SharedFile[]};
export function Portrait({name,photoId,group=false}:{name:string;photoId?:string|null;group?:boolean}){
 return <span className={`portrait ${group?'group-portrait':''}`}>{photoId?<img src={`/api/files?id=${photoId}&preview=1`} alt={`${name} 프로필`}/>:group?<Users size={24}/>:<span>{name.trim()[0]??'?'}</span>}</span>;
}
export default function MessengerHome({token,name,onName,onOpen,onCreate,onQuiet,onResize}:{token:string;name:string;onName:(name:string)=>void;onOpen:(id:string,direct?:boolean)=>Promise<void>;onCreate:(code:string)=>Promise<void>;onQuiet:()=>void;onResize:()=>void}){
 const [data,setData]=useState<Data|null>(null),[tab,setTab]=useState<'chats'|'friends'|'files'>('chats'),[search,setSearch]=useState(''),[dialog,setDialog]=useState<'profile'|'friend'|'new'|null>(null),[editName,setEditName]=useState(name),[status,setStatus]=useState('근무 중'),[friendId,setFriendId]=useState(''),[roomCode,setRoomCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[more,setMore]=useState(false),[copied,setCopied]=useState(false);
 const photo=useRef<HTMLInputElement>(null),sequence=useRef(0);
 const api=useCallback(async(action:string,extra:Record<string,unknown>={})=>{
  const number=++sequence.current;
  const res=await fetch('/api/messenger',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,name,action,...extra}),signal:AbortSignal.timeout(10000)});
  const result=await res.json() as Data & {error?:string;roomId?:string};if(!res.ok)throw new Error(result.error??'연결하지 못했습니다.');
  if(result.profile&&number===sequence.current){setData(result);onName(result.profile.name);}
  return result;
 },[token,name,onName]);
 useEffect(()=>{if(!token||!name.trim())return;let live=true;const refresh=async()=>{try{await api('list');if(live)setError('');}catch(e){if(live)setError(e instanceof Error?e.message:'연결하지 못했습니다.');}};void refresh();const timer=setInterval(refresh,5000);return()=>{live=false;clearInterval(timer);};},[token,name,api]);
 const perform=async(task:()=>Promise<unknown>)=>{if(busy)return;setBusy(true);setError('');try{await task();}catch(e){setError(e instanceof Error?e.message:'요청하지 못했습니다.');}finally{setBusy(false);}};
 const copyCode=()=>void perform(async()=>{await navigator.clipboard.writeText(data?.profile.id??'');setCopied(true);setTimeout(()=>setCopied(false),1500);});
 const uploadPhoto=(file?:File)=>void perform(async()=>{
  if(!file)return;if(!file.type.startsWith('image/')||file.size>10*1024*1024)throw new Error('10MB 이하의 이미지 파일을 선택해 주세요.');
  const image=await createImageBitmap(file);const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,256,256);const side=Math.min(image.width,image.height);ctx.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,256,256);image.close();
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('사진을 처리하지 못했습니다.')),'image/jpeg',0.85));
  const form=new FormData();form.append('token',token);form.append('purpose','profile');form.append('file',blob,'profile.jpg');
  const res=await fetch('/api/files',{method:'POST',body:form,signal:AbortSignal.timeout(30000)});const result=await res.json() as {error?:string};if(!res.ok)throw new Error(result.error??'사진을 저장하지 못했습니다.');await api('list');if(photo.current)photo.current.value='';
 });
 const openProfile=()=>{setEditName(data?.profile.name??name);setStatus(data?.profile.status??'근무 중');setDialog('profile');setMore(false);};
 const date=(time:number)=>{const d=new Date(time),today=new Date();return d.toDateString()===today.toDateString()?new Intl.DateTimeFormat('ko-KR',{hour:'numeric',minute:'2-digit'}).format(d):d.toDateString()===new Date(Date.now()-86400000).toDateString()?'어제':d.toLocaleDateString('sv-SE');};
 const friends=data?.friends.filter(f=>`${f.name} ${f.status}`.includes(search))??[];
 const recent=data?.rooms.filter(r=>`${r.names.join(' ')} ${r.last}`.includes(search))??[];
 return <section className="messenger messenger-home" aria-label="메신저 메인">
  <header className="home-title"><span className="home-brand">hiworks <ChevronDown size={12}/></span><span className="home-window"><button aria-label="최소화" onClick={onQuiet}><Minus size={14}/></button><button aria-label="크기 변경" onClick={onResize}><Square size={11}/></button><button aria-label="메신저 접기" onClick={onQuiet}><X size={14}/></button></span></header>
  <div className="my-profile"><button className="profile-open" aria-label="내 프로필 수정" onClick={openProfile}><Portrait name={data?.profile.name??name} photoId={data?.profile.photoId}/><span><b>{data?.profile.name??(name||'내 프로필')}</b><small>{data?.profile.status??'근무 중'}</small></span></button><Bell size={18} className="home-bell"/></div>
  <nav className="home-tabs" aria-label="메신저 탭"><button aria-label="친구 탭" aria-selected={tab==='friends'} onClick={()=>{setTab('friends');setSearch('');}}><Users/></button><button aria-label="대화 탭" aria-selected={tab==='chats'} onClick={()=>{setTab('chats');setSearch('');}}><MessageCircle/></button><button aria-label="파일 탭" aria-selected={tab==='files'} onClick={()=>{setTab('files');setSearch('');}}><FolderDown/></button><button className="home-more" aria-label="더보기" onClick={()=>setMore(!more)}><MoreHorizontal/></button></nav>
  {more&&<div className="home-menu"><button onClick={openProfile}>내 프로필</button><button onClick={()=>{setDialog('new');setMore(false);}}>새 대화</button><button onClick={()=>{setDialog('friend');setMore(false);}}>친구 추가</button></div>}
  <div className="home-search"><Search size={16}/><input aria-label="메신저 검색" placeholder="참여자, 대화내용, 파일명 검색" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="검색 지우기" onClick={()=>setSearch('')}><X size={13}/></button>}</div>
  {!name.trim()?<form className="home-register" onSubmit={e=>{e.preventDefault();void perform(async()=>{const result=await api('profile',{name:editName,status});onName(result.profile.name);});}}><h1>프로필 만들기</h1><label htmlFor="first-name">이름</label><Input id="first-name" value={editName} maxLength={20} onChange={e=>setEditName(e.target.value)} placeholder="대화에 사용할 이름"/><Button disabled={busy||!editName.trim()}>시작</Button></form>:<>
   <div className="list-heading"><span>{tab==='chats'?`대화 ${data?.rooms.length??0}`:tab==='friends'?`친구 ${data?.friends.length??0}`:`파일 ${data?.files.length??0}`}</span>{tab==='files'?null:<button aria-label={tab==='chats'?'새 대화':'친구 추가'} onClick={()=>setDialog(tab==='chats'?'new':'friend')}><Plus size={16}/></button>}</div>
   {tab==='friends'&&<div className="friend-code">내 친구 코드 <button onClick={copyCode}>{data?.profile.id??'…'} {copied?<Check size={12}/>:<Copy size={12}/>}</button></div>}
   <div className="home-list">
    {tab==='chats'&&recent.map(r=>{const other=r.names.filter(n=>n!==data?.profile.name);const label=(r.direct?other:r.names).join(', ')||r.names.join(', ');const friend=data?.friends.find(f=>f.name===other[0]);return <button key={r.id} className="recent-row" disabled={busy} onClick={()=>void perform(()=>onOpen(r.id,r.direct))}><Portrait name={label} group={!r.direct} photoId={r.direct?r.photoId??friend?.photoId:null}/><span className="recent-body"><span className="recent-title"><b>{label}</b>{!r.direct&&<span className="room-members"><Users size={10}/>{r.names.length}</span>}</span><span className="recent-preview">{r.last}</span></span><span className="recent-end"><time>{date(r.time)}</time>{r.unread>0&&<span className="unread">{r.unread}</span>}</span></button>;})}
    {tab==='friends'&&friends.map(f=><div key={f.id} className="friend-row"><button className="friend-open" aria-label={`${f.name}님 프로필`} onClick={()=>{setFriendId(f.id);setDialog('friend');}}><Portrait name={f.name} photoId={f.photoId}/><span><b>{f.name}<i className={f.online?'online':'offline'}/></b><small>{f.status||'상태 메시지가 없습니다.'}</small></span></button><button className="friend-chat" aria-label={`${f.name}님과 대화`} disabled={busy} onClick={()=>void perform(async()=>{const r=await api('direct',{friendId:f.id});await onOpen(r.roomId!,true);})}><MessageCircle size={18}/></button></div>)}
    {tab==='files'&&(data?.files??[]).filter(f=>f.name.includes(search)).map(f=><a key={f.id} className="shared-file-row" href={`/api/files?id=${f.id}`} download>{f.mime.startsWith('image/')?<img src={`/api/files?id=${f.id}&preview=1`} alt={f.name}/>:<Paperclip size={22}/>}<span><b>{f.name}</b><small>{Math.ceil(f.size/1024)}KB · {date(f.createdAt)}</small></span></a>)}
    {tab==='chats'&&!recent.length&&<p className="home-empty">{search?'검색 결과가 없습니다.':'진행한 대화가 없습니다. 새 대화를 시작해 주세요.'}</p>}
    {tab==='friends'&&!friends.length&&<p className="home-empty">{search?'검색 결과가 없습니다.':'친구 코드로 함께할 친구를 추가해 주세요.'}</p>}
    {tab==='files'&&!data?.files.length&&<p className="home-empty">대화에서 주고받은 파일이 표시됩니다.</p>}
   </div>
  </>}
  {error&&<div className="home-error" role="alert">{error}</div>}
  <input type="file" ref={photo} accept="image/*" className="file-input" aria-label="프로필 사진 선택" onChange={e=>uploadPhoto(e.target.files?.[0])}/>
  {dialog&&<div className="home-dialog-shade"><div className="home-dialog" role="dialog" aria-modal="true" aria-label={dialog==='profile'?'내 프로필':dialog==='friend'?'친구 추가':'새 대화'}><header><b>{dialog==='profile'?'내 프로필':dialog==='friend'?'친구 추가':'새 대화'}</b><button aria-label="창 닫기" onClick={()=>setDialog(null)}><X size={16}/></button></header>
   {dialog==='profile'?<form onSubmit={e=>{e.preventDefault();void perform(async()=>{const result=await api('profile',{name:editName,status});onName(result.profile.name);setDialog(null);});}}><button type="button" className="photo-edit" aria-label="프로필 사진 변경" disabled={busy||!data} onClick={()=>photo.current?.click()}><Portrait name={editName} photoId={data?.profile.photoId}/><Camera size={18}/></button><label htmlFor="profile-name">이름</label><Input id="profile-name" value={editName} maxLength={20} onChange={e=>setEditName(e.target.value)}/><label htmlFor="profile-status">상태 메시지</label><Input id="profile-status" value={status} maxLength={60} onChange={e=>setStatus(e.target.value)}/><Button disabled={busy||!editName.trim()}>저장</Button></form>:dialog==='friend'?<form onSubmit={e=>{e.preventDefault();void perform(async()=>{await api('addfriend',{friendId});setDialog(null);setTab('friends');setFriendId('');});}}><label htmlFor="friend-code">친구 코드</label><Input id="friend-code" value={friendId} maxLength={8} placeholder="친구의 8자리 코드" onChange={e=>setFriendId(e.target.value.toUpperCase())}/>{data?.friends.some(f=>f.id===friendId)&&<div className="friend-detail"><Portrait name={data.friends.find(f=>f.id===friendId)!.name} photoId={data.friends.find(f=>f.id===friendId)?.photoId}/><span>{data.friends.find(f=>f.id===friendId)?.name}<small>{data.friends.find(f=>f.id===friendId)?.status}</small></span></div>}<Button disabled={busy||friendId.length!==8}>추가</Button>{data?.friends.some(f=>f.id===friendId)&&<Button type="button" variant="outline" disabled={busy} onClick={()=>void perform(async()=>{await api('removefriend',{friendId});setDialog(null);})}>친구 삭제</Button>}</form>:<form onSubmit={e=>{e.preventDefault();void perform(async()=>{await onCreate(roomCode.trim());setDialog(null);setRoomCode('');});}}><label htmlFor="invite-code">대화방 코드</label><Input id="invite-code" value={roomCode} maxLength={8} placeholder="코드가 없으면 새 대화방" onChange={e=>setRoomCode(e.target.value.toUpperCase())}/><Button disabled={busy||(roomCode.length>0&&roomCode.length!==8)}>{roomCode?'대화 참여':'새 대화 만들기'}</Button></form>}
   {error&&<p className="error" role="alert">{error}</p>}
  </div></div>}
 </section>;
}
