import {getRawDb} from '@/db';
import type {Room} from '@/lib/game';
import {activeQuiz,markHistoryRecorded,markQuestionReady,quizView,startQuiz,stopQuiz,submitAnswer,supplyNextQuestion,tickQuiz} from '@/games/general-quiz/engine';
import {quizConfig} from '@/games/general-quiz/config';
import {ensureQuestionPool,recordQuestionHistory,selectQuestions} from '@/games/general-quiz/store';
import type {QuizSettings} from '@/games/general-quiz/types';
import {generateQuizQuestions} from '@/games/general-quiz/ai';
import {generate} from '@/ai/providers/registry';
import {ProviderError} from '@/ai/providers/types';
import {validModel} from '@/ai/config';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
const response=(room:Room,token:string)=>Response.json({state:quizView(room,token)},{headers:{'Cache-Control':'no-store'}});
type Body={token:string;room:string;action:string;settings?:QuizSettings;text?:string;gameId?:string;number?:number;key?:string;provider?:string;model?:string};
function validSettings(value:QuizSettings|undefined):value is QuizSettings{return !!value&&['builtin','ai'].includes(value.source)&&quizConfig.difficulties.some(item=>item.id===value.difficulty)&&quizConfig.categories.some(item=>item.id===value.category)&&quizConfig.questionCounts.includes(value.questionCount)&&(value.source==='builtin'||!!value.provider&&!!value.model&&validModel(value.provider,value.model)&&value.questionCount!==0);}
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return fail('요청 출처를 확인해 주세요.',403);
  if(Number(req.headers.get('content-length')??0)>4096)return fail('요청이 너무 큽니다.',413);
  const body=await req.json() as Body;if(!/^[a-f0-9-]{36}$/.test(body.token??'')||!/^[A-F0-9]{8}$/.test(body.room??''))return fail('접속 정보를 확인해 주세요.',403);
  const db=getRawDb();let prepared:null|Awaited<ReturnType<typeof selectQuestions>>=null,prepareLease='';
  async function load(){const row=await db.prepare('SELECT state,revision FROM rooms WHERE id=?').bind(body.room).first<{state:string;revision:number}>();return row?{room:JSON.parse(row.state) as Room,revision:row.revision}:null;}
  async function save(room:Room,revision:number){const result=await db.prepare('UPDATE rooms SET state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(room),Date.now(),body.room,revision).run();return !!result.meta.changes;}
  async function releasePrepare(){if(!prepareLease)return;for(let attempt=0;attempt<3;attempt++){const current=await load();if(!current||current.room.quizPrepare?.lease!==prepareLease)return;delete current.room.quizPrepare;if(await save(current.room,current.revision))return;}}
  for(let attempt=0;attempt<5;attempt++){
   const current=await load();if(!current)return fail('대화방을 찾을 수 없습니다.',404);const room=current.room,member=room.players.find(player=>player.id===body.token);if(!member)return fail('먼저 대화방에 참여해 주세요.',403);const now=Date.now();let changed=tickQuiz(room,now),historyFingerprint='';
   if(body.action==='test'){
    if(room.host!==body.token)return fail('방장만 연결을 테스트할 수 있습니다.',403);if(now-(room.aiTestAt??0)<5000)return fail('잠시 후 다시 테스트해 주세요.',429);
    room.aiTestAt=now;if(!await save(room,current.revision))continue;
    try{await generate(String(body.provider??''),String(body.model??''),String(body.key??''),'한국어로 확인이라고만 답해라.');return Response.json({connected:true},{headers:{'Cache-Control':'no-store'}});}catch(error){return fail(error instanceof ProviderError?error.message:'연결 테스트에 실패했습니다.');}
   }
   if(activeQuiz(room)&&room.quiz!.stage==='loading'){const next=room.quiz!.source==='ai'?undefined:(await selectQuestions(db,{difficulty:room.quiz!.difficulty,category:room.quiz!.category,questionCount:room.quiz!.questionCount,source:'builtin'},room.quiz!.players.map(player=>player.id),1,room.quiz!.usedFingerprints))[0];if(next){supplyNextQuestion(room,now,next);changed=true;}else{stopQuiz(room);changed=true;}}
   if(body.action==='start'){
    if(room.host!==body.token)return fail('방장만 시작할 수 있습니다.',403);if(!validSettings(body.settings))return fail('게임 설정을 확인해 주세요.');
    if(activeQuiz(room)||room.phase==='playing'||(room.infiltrator&&room.infiltrator.stage!=='finished'))return fail('이미 게임이 진행 중입니다.');const activePlayers=room.players.filter(player=>now-player.seen<15000);if(!activePlayers.length)return fail('접속 중인 참여자가 필요합니다.');
    if(!prepared){const count=body.settings.questionCount||20;if(body.settings.source==='ai'){
      if(room.quizPrepare&&room.quizPrepare.expires>now&&room.quizPrepare.lease!==prepareLease)return fail('AI 문제를 준비 중입니다. 잠시만 기다려 주세요.',409);
      prepareLease=crypto.randomUUID();room.quizPrepare={lease:prepareLease,creator:body.token,expires:now+90_000};if(!await save(room,current.revision)){prepareLease='';continue;}
      try{prepared=await generateQuizQuestions(body.settings,String(body.key??''),count);}catch(error){await releasePrepare();throw error;}continue;
     }else{await ensureQuestionPool(db);prepared=await selectQuestions(db,body.settings,activePlayers.map(player=>player.id),count);}}
    if(prepareLease&&room.quizPrepare?.lease!==prepareLease)return fail('게임 준비 상태가 변경되었습니다. 다시 시도해 주세요.',409);delete room.quizPrepare;
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
  await releasePrepare();return fail('메시지가 겹쳤습니다. 다시 보내 주세요.',409);
 }catch(e){const allowed=['이미 게임','접속 중인','사용할 수 있는','지금은 답','답을 입력','잠시 생각','이번 문제'];if(e instanceof ProviderError)return fail(e.message);return fail(e instanceof Error&&allowed.some(prefix=>e.message.startsWith(prefix))?e.message:'퀴즈 요청을 처리하지 못했습니다.',400);}
}
