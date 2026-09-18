'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {InfiltratorView,Settings} from './types';
export function useInfiltrator(token:string,room:string|undefined){
 const [data,setData]=useState<InfiltratorView|null>(null),[loadedRoom,setLoadedRoom]=useState<string>(),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const state=useRef(data),currentRoom=useRef(room),secret=useRef(key),inFlight=useRef(false);
 useLayoutEffect(()=>{state.current=loadedRoom===room?data:null;currentRoom.current=room;secret.current=key;},[data,loadedRoom,room,key]);
 const request=useCallback(async(action:string,extra:Record<string,unknown>={})=>{
  if(!token||!room||inFlight.current)return false;inFlight.current=true;if(action!=='get')setBusy(true);
  try{
   const response=await fetch('/api/games/infiltrator',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,room,action,gameId:state.current?.id,round:state.current?.round,...extra}),signal:AbortSignal.timeout(20000)});
   const result=await response.json() as {state?:InfiltratorView|null;error?:string;connected?:boolean};if(!response.ok)throw new Error(result.error??'게임에 연결하지 못했습니다.');
   if(currentRoom.current===room){if('state' in result){state.current=result.state??null;setData(result.state??null);setLoadedRoom(room);}setError('');if(action==='stop')setKey('');}return true;
  }catch(e){if(currentRoom.current===room)setError(e instanceof Error?e.message:'게임 연결 오류');return false;}
  finally{inFlight.current=false;setBusy(false);}
 },[token,room]);
 useEffect(()=>{
  if(!token||!room)return;let live=true;
  const poll=async()=>{if(!live)return;await request('get');if(live&&state.current?.needsAI&&secret.current)await request('generate',{key:secret.current});};
  void poll();const timer=setInterval(()=>void poll(),1000);return()=>{live=false;clearInterval(timer);};
 },[token,room,request]);
 const start=async(settings:Settings)=>request('start',{settings});
 return {data:loadedRoom===room?data:null,key,setKey,busy,error,request,start};
}
