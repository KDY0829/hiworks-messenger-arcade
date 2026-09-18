'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {clientId} from '@/lib/client-id';
import type {SwordAction,SwordView} from './types';
export function useSword(token:string,room:string|undefined){
 const [data,setData]=useState<SwordView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loadedRoom,setLoadedRoom]=useState<string>();
 const state=useRef(data),inFlight=useRef(false),currentRoom=useRef(room);
 useLayoutEffect(()=>{state.current=loadedRoom===room?data:null;currentRoom.current=room;},[data,loadedRoom,room]);
 const load=useCallback(async(signal?:AbortSignal)=>{
  if(!token||!room)return;
  const response=await fetch('/api/games/sword',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,room,action:'get'}),signal:signal??AbortSignal.timeout(10000)});
  const value=await response.json() as SwordView & {error?:string};if(!response.ok)throw new Error(value.error??'장비 기록을 불러오지 못했습니다.');
  if(currentRoom.current===room){state.current=value;setData(value);setLoadedRoom(room);}
 },[token,room]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'연결 오류');});return()=>controller.abort();},[load]);
 const action=useCallback(async(action:SwordAction,item?:string)=>{
  if(!room||!token||!state.current||inFlight.current)return false;
  inFlight.current=true;setBusy(true);setError('');const started=Date.now();
  try{
   const response=await fetch('/api/games/sword',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,room,action,item,revision:state.current.revision,requestId:clientId()}),signal:AbortSignal.timeout(10000)});
   const value=await response.json() as SwordView & {error?:string};
   if(!response.ok)throw new Error(value.error??'처리하지 못했습니다.');
   if(action==='enhance')await new Promise(resolve=>setTimeout(resolve,Math.max(0,400-(Date.now()-started))));
   if(currentRoom.current===room){state.current=value;setData(value);setLoadedRoom(room);}return true;
  }catch(e){if(currentRoom.current===room){setError(e instanceof Error?e.message:'연결 오류');await load().catch(()=>{});}return false;}
  finally{inFlight.current=false;setBusy(false);}
 },[token,room,load]);
 return {data:loadedRoom===room?data:null,busy,error,action};
}
