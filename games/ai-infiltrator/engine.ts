import {message,type Room} from '@/lib/game';
import type {InfiltratorView,Settings} from './types';
import {questionSets} from './questions';
export const config={minPlayers:3,maxPlayers:8,maxAttempts:2,discussionSeconds:30,voteSeconds:30,generationSeconds:90,leaseSeconds:25,maxAnswerLength:120};
function log(r:Room,name:string,text:string,system=true){message(r,name,text,system);}
export function active(r:Room){return !!r.infiltrator&&r.infiltrator.stage!=='finished';}
function question(r:Room,now:number){const s=r.infiltrator!;s.stage='generating';s.answers={};s.attempts=0;s.lease='';s.error='';s.deadline=now+config.generationSeconds*1000;log(r,'알림',`${s.round+1}/${s.rounds} · ${s.questions[s.round]}`);}
export function start(r:Room,settings:Settings,now:number,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){
 if(active(r)||r.phase==='playing'||(r.quiz&&r.quiz.stage!=='finished'))throw new Error('이미 게임이 진행 중입니다.');
 const players=r.players.filter(p=>now-p.seen<15000);
 if(players.length!==settings.participants||players.length<config.minPlayers||players.length>config.maxPlayers)throw new Error('설정한 인원과 접속 중인 참여 인원이 일치해야 합니다.');
 const questions:string[]=[...questionSets[settings.questionSet].questions];for(let i=questions.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[questions[i],questions[j]]=[questions[j],questions[i]];}
 r.infiltrator={...settings,id:crypto.randomUUID(),creator:r.host,players:players.map(({id,name})=>({id,name})),target:players[Math.floor(random()*players.length)].id,stage:'generating',round:0,questions:questions.slice(0,settings.rounds),answers:{},votes:{},history:[],deadline:0,attempts:0,lease:'',error:'',cancelled:false};
 log(r,'알림','AI 잠입자를 시작합니다. 한 명의 답변은 AI가 대신 작성합니다. 답변은 모두 제출한 뒤 공개됩니다.');question(r,now);
}
function discussion(r:Room,now:number){const s=r.infiltrator!;s.stage='discussion';s.lease='';s.deadline=now+config.discussionSeconds*1000;log(r,'알림','30초 동안 자유롭게 이야기해 주세요.');}
function reveal(r:Room,now:number){const s=r.infiltrator!;for(const p of s.players)log(r,p.name,s.answers[p.id]||'(답변 없음)',false);s.history.push({round:s.round+1,question:s.questions[s.round],answer:s.answers[s.target]||'(응답 없음)'});discussion(r,now);}
function finish(r:Room){const s=r.infiltrator!;s.stage='finished';s.deadline=0;s.lease='';const target=s.players.find(p=>p.id===s.target)!;const correct=s.players.filter(p=>p.id!==s.target&&s.votes[p.id]===s.target);const citizens=s.players.filter(p=>p.id!==s.target);const escaped=citizens.length-correct.length;log(r,'알림',`게임 종료 · AI 잠입자: ${target.name}\n${correct.length>citizens.length/2?'시민 승':'AI 잠입자 승'}\n정답자 (+1점): ${correct.map(p=>p.name).join(', ')||'없음'}\n${target.name}: ${escaped}점\nAI 답변\n${s.history.map(h=>`${h.round}R · ${h.question}\n${h.answer}`).join('\n')}`);}
export function tickInfiltrator(r:Room,now:number){const s=r.infiltrator;if(!s||!active(r))return false;
 if(!r.players.some(p=>p.id===s.creator)||s.players.some(p=>!r.players.some(current=>current.id===p.id))){s.stage='finished';s.cancelled=true;s.deadline=0;s.lease='';log(r,'알림','참여자가 나가 게임을 종료했습니다.');return true;}
 if(s.stage==='generating'){
  if(now>=s.deadline){if(s.lease){s.lease='';s.error='AI 응답 대기 시간이 초과되었습니다.';s.deadline=now+60000;}else{log(r,'알림','AI 응답이 없어 이번 라운드는 무효입니다.');discussion(r,now);}return true;}return false;
 }
 if(s.stage==='answering'&&(now>=s.deadline||s.players.every(p=>p.id===s.target||s.answers[p.id]!==undefined))){reveal(r,now);return true;}
 if(s.stage==='discussion'&&now>=s.deadline){if(s.round+1<s.rounds){s.round++;question(r,now);}else{s.stage='voting';s.deadline=now+config.voteSeconds*1000;log(r,'알림','AI라고 생각하는 사람을 선택해 주세요. 투표는 30초 동안 진행합니다.');}return true;}
 if(s.stage==='voting'&&(now>=s.deadline||s.players.filter(p=>p.id!==s.target).every(p=>s.votes[p.id]))){finish(r);return true;}
 return false;
}
export function answer(r:Room,token:string,text:string,now:number){const s=r.infiltrator!;if(!s||s.stage!=='answering'||!s.players.some(p=>p.id===token)||token===s.target||s.answers[token]!==undefined||now>=s.deadline)throw new Error('지금은 답변을 제출할 수 없습니다.');const value=text.trim();if(!value||value.length>config.maxAnswerLength)throw new Error('답변은 1~120자로 입력해 주세요.');s.answers[token]=value;tickInfiltrator(r,now);}
export function vote(r:Room,token:string,target:string,now:number){const s=r.infiltrator!;if(!s||s.stage!=='voting'||token===s.target||!s.players.some(p=>p.id===token)||!s.players.some(p=>p.id===target)||s.votes[token]||now>=s.deadline)throw new Error('지금은 투표할 수 없습니다.');s.votes[token]=target;tickInfiltrator(r,now);}
export function claim(r:Room,now:number){const s=r.infiltrator!;if(!s||s.stage!=='generating'||s.lease||s.error||s.attempts>=config.maxAttempts)throw new Error('AI 요청을 시작할 수 없습니다.');s.attempts++;s.lease=crypto.randomUUID();s.deadline=now+config.leaseSeconds*1000;return s.lease;}
export function complete(r:Room,lease:string,text:string,error:string,now:number){const s=r.infiltrator!;if(!s||s.stage!=='generating'||s.lease!==lease)return false;s.lease='';s.error=error;if(error){if(s.attempts>=config.maxAttempts){log(r,'알림','AI 응답 생성에 실패해 이번 라운드는 무효입니다.');discussion(r,now);}else s.deadline=now+60000;}else{s.answers[s.target]=text;s.stage='answering';s.deadline=now+s.seconds*1000;}return true;}
export function stop(r:Room){if(!active(r))return;const s=r.infiltrator!;s.stage='finished';s.cancelled=true;s.deadline=0;s.lease='';log(r,'알림','AI 잠입자를 종료했습니다.');}
export function privateView(r:Room,token:string):InfiltratorView|null{const s=r.infiltrator;if(!s)return null;return {id:s.id,provider:s.provider,model:s.model,rounds:s.rounds,seconds:s.seconds,participants:s.participants,questionSet:s.questionSet,creator:s.creator.slice(0,8),players:s.players.map(p=>({...p,id:p.id.slice(0,8)})),stage:s.stage,round:s.round,question:s.questions[s.round],deadline:s.deadline,isTarget:s.target===token,participating:s.players.some(p=>p.id===token),answered:s.answers[token]!==undefined,voted:!!s.votes[token],needsAI:s.creator===token&&s.stage==='generating'&&!s.lease&&!s.error,error:s.creator===token?s.error:'',attempts:s.creator===token?s.attempts:0,cancelled:s.cancelled};}
export function prompt(question:string,round:number){return `친구들과 메신저에서 잡담하는 가상 참가자 역할이다. 한국어 반말로 1~2문장, 80자 이내로 질문에만 답해라. 설명·목록·인사·이모지·AI라는 언급은 금지. 매번 문장 구조를 바꿔라. 답변 번호 ${round+1}. 질문: ${question}`;}
