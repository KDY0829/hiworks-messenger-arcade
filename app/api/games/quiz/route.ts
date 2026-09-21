import {getRawDb} from '@/db';
import type {Room} from '@/lib/game';
import {activeQuiz,markHistoryRecorded,markQuestionReady,quizView,startQuiz,stopQuiz,submitAnswer,supplyNextQuestion,tickQuiz} from '@/games/general-quiz/engine';
import {quizConfig} from '@/games/general-quiz/config';
import {ensureQuestionPool,recordQuestionHistory,selectQuestions} from '@/games/general-quiz/store';
import type {QuizSettings} from '@/games/general-quiz/types';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
const response=(room:Room,token:string)=>Response.json({state:quizView(room,token)},{headers:{'Cache-Control':'no-store'}});
type Body={token:string;room:string;action:string;settings?:QuizSettings;text?:string;gameId?:string;number?:number};
function validSettings(value:QuizSettings|undefined):value is QuizSettings{return !!value&&quizConfig.difficulties.some(item=>item.id===value.difficulty)&&quizConfig.categories.some(item=>item.id===value.category)&&quizConfig.questionCounts.includes(value.questionCount);}
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return fail('요청 출처를 확인해 주세요.',403);
  if(Number(req.headers.get('content-length')??0)>4096)return fail('요청이 너무 큽니다.',413);
  const body=await req.json() as Body;if(!/^[a-f0-9-]{36}$/.test(body.token??'')||!/^[A-F0-9]{8}$/.test(body.room??''))return fail('접속 정보를 확인해 주세요.',403);
  const db=getRawDb();let prepared:null|Awaited<ReturnType<typeof selectQuestions>>=null;
  async function load(){const row=await db.prepare('SELECT state,revision FROM rooms WHERE id=?').bind(body.room).first<{state:string;revision:number}>();return row?{room:JSON.parse(row.state) as Room,revision:row.revision}:null;}
  async function save(room:Room,revision:number){const result=await db.prepare('UPDATE rooms SET state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(room),Date.now(),body.room,revision).run();return !!result.meta.changes;}
  for(let attempt=0;attempt<5;attempt++){
   const current=await load();if(!current)return fail('대화방을 찾을 수 없습니다.',404);const room=current.room,member=room.players.find(player=>player.id===body.token);if(!member)return fail('먼저 대화방에 참여해 주세요.',403);const now=Date.now();let changed=tickQuiz(room,now),historyFingerprint='';
   if(activeQuiz(room)&&room.quiz!.stage==='loading'){const next=(await selectQuestions(db,{difficulty:room.quiz!.difficulty,category:room.quiz!.category,questionCount:room.quiz!.questionCount},room.quiz!.players.map(player=>player.id),1,room.quiz!.usedFingerprints))[0];if(next){supplyNextQuestion(room,now,next);changed=true;}else{stopQuiz(room);changed=true;}}
   if(body.action==='start'){
    if(room.host!==body.token)return fail('방장만 시작할 수 있습니다.',403);if(!validSettings(body.settings))return fail('게임 설정을 확인해 주세요.');
    if(!prepared){await ensureQuestionPool(db);const count=body.settings.questionCount||20;prepared=await selectQuestions(db,body.settings,room.players.filter(player=>now-player.seen<15000).map(player=>player.id),count);}
    startQuiz(room,body.settings,prepared,now);changed=true;
   }else if(body.action==='refresh'){
    if(room.host!==body.token)return fail('방장만 문제를 갱신할 수 있습니다.',403);await ensureQuestionPool(db,true);return response(room,body.token);
   }else if(body.action!=='get'){
    const state=room.quiz;if(!state||body.gameId!==state.id||body.number!==state.number)return fail('게임 상태가 변경되었습니다. 다시 확인해 주세요.',409);
    if(body.action==='ready'){changed=markQuestionReady(room,body.token,now)||changed;}
    else if(body.action==='answer'){submitAnswer(room,body.token,String(body.text??''),now);changed=true;}
    else if(body.action==='stop'){if(state.creator!==body.token)return fail('방장만 종료할 수 있습니다.',403);stopQuiz(room);changed=true;}
    else return fail('지원하지 않는 요청입니다.');
   }
   if(room.quiz?.completedFingerprint&&!room.quiz.historyRecorded){historyFingerprint=room.quiz.completedFingerprint;markHistoryRecorded(room);changed=true;}
   if(changed&&!await save(room,current.revision))continue;
   if(historyFingerprint){try{await recordQuestionHistory(db,room.quiz!.players.map(player=>player.id),historyFingerprint);}catch(error){console.error('quiz history write failed',error);}}
   return response(room,body.token);
  }
  return fail('메시지가 겹쳤습니다. 다시 보내 주세요.',409);
 }catch(e){const allowed=['이미 게임','접속 중인','사용할 수 있는','지금은 답','답을 입력','잠시 생각','이번 문제'];return fail(e instanceof Error&&allowed.some(prefix=>e.message.startsWith(prefix))?e.message:'퀴즈 요청을 처리하지 못했습니다.',400);}
}
