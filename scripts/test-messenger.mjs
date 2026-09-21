// Execute the real API handlers against SQLite and an in-memory R2 adapter.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {drizzle} from 'drizzle-orm/sqlite-proxy';
import * as orm from 'drizzle-orm';
import * as sqlite from 'drizzle-orm/sqlite-core';
import ts from 'typescript';
const native=new DatabaseSync(':memory:');
for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())native.exec(readFileSync(`drizzle/${file}`,'utf8'));
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const url=source=>'data:text/javascript;base64,'+Buffer.from(compile(source)).toString('base64');
const scope={sqlite,orm};globalThis.messengerTest=scope;
const schema=await import(url(readFileSync('db/schema.ts','utf8').replace(/import .* from 'drizzle-orm\/sqlite-core';/, 'const {sqliteTable,text,integer,primaryKey,uniqueIndex,index}=globalThis.messengerTest.sqlite;')));scope.schema=schema;
scope.db=drizzle(async(query,params,method)=>{const statement=native.prepare(query);statement.setReturnArrays(true);return {rows:method==='get'?statement.get(...params):statement.all(...params)};},{schema});
function prepared(query,params=[]){return {bind(...values){return prepared(query,values);},async first(){return native.prepare(query).get(...params)??null;},async all(){return {results:native.prepare(query).all(...params)};},run(){const result=native.prepare(query).run(...params);return {meta:{changes:Number(result.changes)}};}};}
scope.raw={prepare:prepared,async batch(statements){native.exec('BEGIN');try{const result=[];for(const s of statements)result.push(s.run());native.exec('COMMIT');return result;}catch(e){native.exec('ROLLBACK');throw e;}}};
const objects=new Map();scope.env={FILES:{async put(id,data){objects.set(id,new Uint8Array(data));},async get(id){const b=objects.get(id);return b?{async arrayBuffer(){return b.slice().buffer;}}:null;},async delete(id){objects.delete(id);}}};
const words=url(readFileSync('lib/words.ts','utf8')),dictionary=url(readFileSync('lib/dictionary.ts','utf8'));
const aiQuestions=url(readFileSync('games/ai-infiltrator/questions.ts','utf8'));
const game=url(readFileSync('lib/game.ts','utf8').replace("'./words'",JSON.stringify(words)).replace("'./dictionary'",JSON.stringify(dictionary)));
const aiEngine=url(readFileSync('games/ai-infiltrator/engine.ts','utf8').replace("'./questions'",JSON.stringify(aiQuestions)).replace("'@/lib/game'",JSON.stringify(game)));
const swordConfig=url(readFileSync('games/sword-enhancement/config.ts','utf8'));
const swordEngine=url(readFileSync('games/sword-enhancement/engine.ts','utf8').replace("'./config'",JSON.stringify(swordConfig)));
const quizConfig=url(readFileSync('games/general-quiz/config.ts','utf8'));
const quizNormalize=url(readFileSync('games/general-quiz/normalize.ts','utf8'));
const quizFallback=url(readFileSync('games/general-quiz/fallback.ts','utf8'));
const quizProviderTypes=url(readFileSync('games/general-quiz/providers/types.ts','utf8'));
const quizProviderUrls=Object.fromEntries(['open-trivia-db','trivia-api','wikidata'].map(id=>[id,url(readFileSync(`games/general-quiz/providers/${id}.ts`,'utf8').replace("'../types'",'"data:text/javascript,export{}"').replace("'./types'",JSON.stringify(quizProviderTypes)))]));
let quizRegistrySource=readFileSync('games/general-quiz/providers/registry.ts','utf8');for(const [id,path] of Object.entries(quizProviderUrls))quizRegistrySource=quizRegistrySource.replace(`'./${id}'`,JSON.stringify(path));
const quizRegistry=url(quizRegistrySource);
const quizStore=url(readFileSync('games/general-quiz/store.ts','utf8').replace("'./config'",JSON.stringify(quizConfig)).replace("'./fallback'",JSON.stringify(quizFallback)).replace("'./normalize'",JSON.stringify(quizNormalize)).replace("'./providers/registry'",JSON.stringify(quizRegistry)));
const quizEngine=url(readFileSync('games/general-quiz/engine.ts','utf8').replace("'@/lib/game'",JSON.stringify(game)).replace("'./config'",JSON.stringify(quizConfig)).replace("'./normalize'",JSON.stringify(quizNormalize)));
const aiConfig=url(readFileSync('ai/config.ts','utf8')),providerTypes=url(readFileSync('ai/providers/types.ts','utf8'));
const providerUrls=Object.fromEntries(['openai','gemini','anthropic'].map(id=>[id,url(readFileSync(`ai/providers/${id}.ts`,'utf8').replace("'./types'",JSON.stringify(providerTypes)))]));
let providerSource=readFileSync('ai/providers/registry.ts','utf8').replace("'../config'",JSON.stringify(aiConfig)).replace("'./types'",JSON.stringify(providerTypes));
for(const [id,path] of Object.entries(providerUrls))providerSource=providerSource.replace(`'./${id}'`,JSON.stringify(path));
const aiProviders=url(providerSource);
async function route(file){let source=readFileSync(file,'utf8').replace(/import \{[^}]+\} from '@\/db';/,'const getDb=()=>globalThis.messengerTest.db,getRawDb=()=>globalThis.messengerTest.raw;').replace(/import \{([^}]+)\} from '@\/db\/schema';/,'const {$1}=globalThis.messengerTest.schema;').replace(/import \{([^}]+)\} from 'drizzle-orm';/,'const {$1}=globalThis.messengerTest.orm;').replace(/import \{env\} from 'cloudflare:workers';/,'const env=globalThis.messengerTest.env;').replace("'@/lib/game'",JSON.stringify(game)).replace("'@/games/sword-enhancement/engine'",JSON.stringify(swordEngine)).replace("'@/games/ai-infiltrator/engine'",JSON.stringify(aiEngine)).replace("'@/games/ai-infiltrator/questions'",JSON.stringify(aiQuestions)).replace("'@/games/general-quiz/engine'",JSON.stringify(quizEngine)).replace("'@/games/general-quiz/config'",JSON.stringify(quizConfig)).replace("'@/games/general-quiz/store'",JSON.stringify(quizStore)).replace("'@/ai/config'",JSON.stringify(aiConfig)).replace("'@/ai/providers/registry'",JSON.stringify(aiProviders)).replace("'@/ai/providers/types'",JSON.stringify(providerTypes));return import(url(source));}
const messenger=await route('app/api/messenger/route.ts'),rooms=await route('app/api/rooms/route.ts'),files=await route('app/api/files/route.ts');
async function call(handler,token,action,extra={},expected=200){const response=await handler.POST(new Request('https://test.local/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,action,...extra})}));const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;}
const a=crypto.randomUUID(),b=crypto.randomUUID(),c=crypto.randomUUID();
const alice=await call(messenger,a,'profile',{name:'대영',status:'근무 중'}),bob=await call(messenger,b,'profile',{name:'유진',status:'회의 중'});await call(messenger,c,'profile',{name:'외부 참여자'});
await call(messenger,a,'addfriend',{friendId:bob.profile.id});let list=await call(messenger,a,'list');assert.equal(list.friends[0].name,'유진');assert(!JSON.stringify(list).includes(b));
const direct=await call(messenger,a,'direct',{friendId:bob.profile.id});assert.equal((await call(messenger,a,'direct',{friendId:bob.profile.id})).roomId,direct.roomId);assert((await call(messenger,b,'list')).rooms.some(r=>r.id===direct.roomId));
await call(rooms,c,'join',{room:direct.roomId,name:'외부 참여자'},403);
await call(rooms,a,'join',{room:direct.roomId,name:'대영'});await call(rooms,b,'join',{room:direct.roomId,name:'유진'});
await new Promise(r=>setTimeout(r,2));await call(rooms,a,'chat',{room:direct.roomId,text:'개인 대화 확인'});list=await call(messenger,b,'list');assert.equal(list.rooms[0].last,'개인 대화 확인');assert.equal(list.rooms[0].unread,1);
await call(rooms,b,'poll',{room:direct.roomId,viewing:false});assert.equal((await call(messenger,b,'list')).rooms[0].unread,1);await call(rooms,b,'poll',{room:direct.roomId,viewing:true});assert.equal((await call(messenger,b,'list')).rooms[0].unread,0);
const group=(await call(rooms,a,'create',{name:'대영'})).id;await call(rooms,b,'join',{room:group,name:'유진'});await call(rooms,a,'start',{room:group});await call(rooms,a,'word',{room:group,text:'사과'});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ7kAAAAASUVORK5CYII=','base64');
async function upload(token,purpose,data,name='photo.png',room=group,expected=200){const form=new FormData();form.set('token',token);form.set('purpose',purpose);form.set('room',room);form.set('file',new Blob([data]),name);const r=await files.POST(new Request('https://test.local/api/files',{method:'POST',body:form}));const value=await r.json();assert.equal(r.status,expected,JSON.stringify(value));return value;}
let avatar=await upload(b,'profile',png);assert.equal(native.prepare('SELECT data FROM files WHERE id=?').get(avatar.id).data,'');assert.equal((await call(messenger,a,'list')).friends[0].photoId,avatar.id);
let preview=await files.GET(new Request(`https://test.local/api/files?id=${avatar.id}&preview=1`));assert.equal(preview.headers.get('Content-Type'),'image/png');assert.deepEqual(Buffer.from(await preview.arrayBuffer()),png);
const old=avatar.id;avatar=await upload(b,'profile',png);assert(!objects.has(old));assert.equal((await files.GET(new Request(`https://test.local/api/files?id=${old}`))).status,404);assert.equal((await call(rooms,b,'poll',{room:group})).players.find(p=>p.id===b.slice(0,8)).photoId,avatar.id);
await upload(b,'profile','text','x.txt',group,400);await upload(c,'chat','unauthorized','x.txt',group,403);await upload(a,'chat',new Uint8Array(512*1024+1),'big.bin',group,413);
const attachment=await upload(a,'chat','small file','sample.txt');assert.equal((await files.GET(new Request(`https://test.local/api/files?id=${attachment.id}`))).status,404);await call(rooms,a,'attachment',{room:group,fileId:attachment.id});const response=await files.GET(new Request(`https://test.local/api/files?id=${attachment.id}`));assert.equal(await response.text(),'small file');assert((await call(messenger,b,'list')).files.some(f=>f.id===attachment.id));
await call(messenger,a,'profile',{name:'대영',status:'집중 중'});assert.equal((await call(messenger,a,'list')).profile.status,'집중 중');await call(messenger,a,'removefriend',{friendId:bob.profile.id});assert.equal((await call(messenger,a,'list')).friends.length,0);
// Sword engine branches use controlled random rolls; API remains server-random.
const engine=await import(swordEngine),config=await import(swordConfig);
let progress=engine.initialState();progress.activeRoom=group;progress.gold=100000000;
for(const [level,roll,outcome] of [[0,0,'성공'],[0,99,'유지'],[10,60,'하락'],[15,32,'파괴']]){
 const state={...progress,level};const result=engine.handleAction(state,'enhance',group,undefined,roll);assert(result.state.result.includes(outcome));assert.equal(result.state.attempts,1);assert.equal(state.level,level);
}
let protectedResult=engine.handleAction({...progress,level:15,shield:1},'enhance',group,undefined,32);assert.equal(protectedResult.state.level,15);assert.equal(protectedResult.state.shield,0);assert.equal(protectedResult.state.destroyed,0);
assert.equal(engine.handleAction({...progress,level:10},'sell',group).state.gold,progress.gold+config.enhancementLevels[10].sellValue);
assert.equal(engine.handleAction(progress,'buy',group,'boost').state.boost,1);
assert.equal(engine.handleAction(progress,'buy',group,'shield').state.shield,1);
assert.equal(engine.handleAction(progress,'buy',group,'starter').state.level,6);
assert.throws(()=>engine.handleAction({...progress,gold:0},'enhance',group));
assert.throws(()=>engine.handleAction({...progress,level:25},'enhance',group));
assert.throws(()=>engine.handleAction({...progress,activeRoom:null},'enhance',group));
assert.equal(engine.handleAction({...progress,level:15,gold:config.enhancementLevels[15].cost},'enhance',group,undefined,32).state.gold,config.settings.rescueGold);
for(const rule of config.enhancementLevels)assert(rule.successRate+rule.destroyChance+rule.downgradeChance<=100);
const sword=await route('app/api/games/sword/route.ts');
await call(rooms,a,'stop',{room:group});
let equipment=await call(sword,a,'get',{room:group});assert.equal(equipment.state.gold,5000);
const startId=crypto.randomUUID();equipment=await call(sword,a,'start',{room:group,revision:equipment.revision,requestId:startId});
const duplicate=await call(sword,a,'start',{room:group,revision:0,requestId:startId});assert.deepEqual(duplicate,equipment);
assert.equal(native.prepare('SELECT count(*) AS n FROM game_events WHERE room_id=?').get(group).n,1);
assert((await call(rooms,b,'poll',{room:group})).messages.some(m=>m.text.includes('검 강화하기')));
assert(!JSON.stringify(await call(rooms,b,'poll',{room:group})).includes('activeRoom'));
await call(sword,c,'get',{room:group},403);
await call(sword,a,'enhance',{room:group,revision:0,requestId:crypto.randomUUID()},409);
const stale=equipment.revision;
const purchases=await Promise.all([call(sword,a,'buy',{room:group,revision:stale,requestId:crypto.randomUUID(),item:'boost'}), (async()=>{const res=await sword.POST(new Request('https://test.local/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:a,room:group,action:'buy',revision:stale,requestId:crypto.randomUUID(),item:'shield'})}));assert.equal(res.status,409);})()]);
equipment=purchases[0];assert.equal(equipment.state.gold,4500);
equipment=await call(sword,a,'stop',{room:group,revision:equipment.revision,requestId:crypto.randomUUID()});assert.equal(equipment.state.activeRoom,null);
const other=(await call(rooms,a,'create',{name:'대영'})).id;equipment=await call(sword,a,'start',{room:other,revision:equipment.revision,requestId:crypto.randomUUID()});assert.equal(equipment.state.boost,1);assert.equal(equipment.state.gold,4500);
assert.deepEqual(await call(sword,a,'get',{room:other}),equipment);
await call(rooms,a,'start',{room:group});await call(sword,a,'start',{room:group,revision:equipment.revision,requestId:crypto.randomUUID()},400);
// General quiz uses cached provider data, private room state, per-user history and CAS first-answer wins.
const quiz=await route('app/api/games/quiz/route.ts'),quizData=await import(quizStore),quizText=await import(quizNormalize),openTrivia=await import(quizProviderUrls['open-trivia-db']);
await quizData.seedFallback(scope.raw);const seeded=Number(native.prepare('SELECT count(*) AS n FROM quiz_questions').get().n);await quizData.seedFallback(scope.raw);assert.equal(Number(native.prepare('SELECT count(*) AS n FROM quiz_questions').get().n),seeded);assert(seeded>=40);
native.prepare("INSERT INTO quiz_provider_state(provider,refreshed_at,last_error) VALUES('wikidata',?,'')").run(Date.now());
native.prepare("INSERT INTO quiz_questions(id,provider,provider_question_id,question,answer,accepted_answers,difficulty,category,source,fingerprint,fetched_at) VALUES('retired-test','wikidata','atomicNumber:Q1:1','원자 번호는?','1','[]','high','science','test','retired-fingerprint',?)").run(Date.now());assert.equal(await quizData.removeRetiredQuestions(scope.raw),1);assert.equal(Number(native.prepare("SELECT count(*) AS n FROM quiz_questions WHERE id='retired-test'").get().n),0);assert.equal(Number(native.prepare("SELECT count(*) AS n FROM quiz_questions WHERE provider='fallback' AND (question LIKE '%원자 번호%' OR question LIKE '%원소 기호%')").get().n),0);
assert.equal(quizText.normalizeAnswer(' 세종 대왕! '),quizText.normalizeAnswer('세종대왕'));assert.equal(quizText.choseongHint('세종 대왕'),'ㅅㅈ ㄷㅇ');assert.equal(quizText.choseongHint('Secure'),'영문 6글자');assert.equal(quizText.firstLetterHint('Secure'),'S•••••');assert.equal(quizText.choseongHint('1945'),'숫자 4자리');assert.equal(quizText.firstLetterHint('1945'),'숫자 4자리');assert(!quizText.choseongHint('10월 9일').includes('10'));
const quizRoom=(await call(rooms,a,'create',{name:'대영'})).id,quizSettings={difficulty:'elementary',category:'all',questionCount:5};
await call(quiz,a,'start',{room:quizRoom,settings:quizSettings});
function rawQuiz(id=quizRoom){return JSON.parse(native.prepare('SELECT state FROM rooms WHERE id=?').get(id).state);}
function editQuiz(edit,id=quizRoom){const room=rawQuiz(id);edit(room.quiz);native.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE id=?').run(JSON.stringify(room),id);}
function quizExtra(id=quizRoom,extra={}){const state=rawQuiz(id).quiz;return {room:id,gameId:state.id,number:state.number,...extra};}
assert.equal(rawQuiz().quiz.stage,'ready');assert.equal(rawQuiz().quiz.openedAt,0);await call(quiz,a,'answer',quizExtra(quizRoom,{text:'아직 안 보임'}),400);await call(quiz,a,'ready',quizExtra());assert.equal(rawQuiz().quiz.stage,'question');assert.equal(rawQuiz().quiz.deadline-rawQuiz().quiz.openedAt,15000);
const hiddenQuiz=await call(rooms,a,'poll',{room:quizRoom});assert(!Object.hasOwn(hiddenQuiz,'quiz'));assert(!JSON.stringify(hiddenQuiz).includes(rawQuiz().quiz.current.answer));
await call(rooms,a,'chat',{room:quizRoom,text:'일반 대화도 계속됩니다.'});
await call(quiz,a,'answer',quizExtra(quizRoom,{text:'확실한 오답'}));await call(quiz,a,'answer',quizExtra(quizRoom,{text:'또 오답'}),400);editQuiz(state=>state.lastAttemptAt[a]=0);
let current=rawQuiz().quiz.current;await call(quiz,a,'answer',quizExtra(quizRoom,{text:` ${[...current.answer].join(' ')}! `}));assert.equal(rawQuiz().quiz.scores[a],3);assert.equal(Number(native.prepare('SELECT count(*) AS n FROM quiz_history WHERE token=?').get(a).n),1);
editQuiz(state=>state.nextAt=Date.now()-1);await call(quiz,a,'get',{room:quizRoom});await call(quiz,a,'ready',quizExtra());editQuiz(state=>state.openedAt=Date.now()-6000);await call(quiz,a,'get',{room:quizRoom});assert(rawQuiz().messages.some(message=>message.text.includes('힌트 ·')));
current=rawQuiz().quiz.current;await call(quiz,a,'answer',quizExtra(quizRoom,{text:current.answer}));assert.equal(rawQuiz().quiz.scores[a],5);
editQuiz(state=>state.nextAt=Date.now()-1);await call(quiz,a,'get',{room:quizRoom});await call(quiz,a,'ready',quizExtra());editQuiz(state=>state.openedAt=Date.now()-16000);await call(quiz,a,'get',{room:quizRoom});assert.equal(rawQuiz().quiz.stage,'result');assert(rawQuiz().messages.some(message=>message.text.includes('추가 힌트')));assert(rawQuiz().messages.some(message=>message.text.includes('시간이 지났습니다.')));
await call(quiz,a,'stop',quizExtra());assert.equal(rawQuiz().quiz.stage,'finished');
for(const difficulty of ['elementary','middle','high','university']){const id=(await call(rooms,a,'create',{name:'대영'})).id;await call(quiz,a,'start',{room:id,settings:{difficulty,category:'all',questionCount:5}});assert.equal(rawQuiz(id).quiz.difficulty,difficulty);await call(quiz,a,'stop',quizExtra(id));}
const delayed=(await call(rooms,a,'create',{name:'대영'})).id;await call(quiz,a,'start',{room:delayed,settings:quizSettings});editQuiz(state=>state.readyDeadline=Date.now()-1,delayed);await call(quiz,a,'get',{room:delayed});assert.equal(rawQuiz(delayed).quiz.stage,'question');assert.equal(rawQuiz(delayed).quiz.deadline-rawQuiz(delayed).quiz.openedAt,15000);await call(quiz,a,'stop',quizExtra(delayed));
const duel=(await call(rooms,a,'create',{name:'대영'})).id;await call(rooms,b,'join',{room:duel,name:'유진'});await call(quiz,a,'start',{room:duel,settings:{difficulty:'middle',category:'all',questionCount:5}});await call(quiz,a,'ready',quizExtra(duel));assert.equal(rawQuiz(duel).quiz.stage,'ready');await call(quiz,b,'ready',quizExtra(duel));const duelState=rawQuiz(duel).quiz,answer=duelState.current.answer,payload={room:duel,action:'answer',gameId:duelState.id,number:duelState.number,text:answer};
const simultaneous=await Promise.all([a,b].map(token=>quiz.POST(new Request('https://test.local/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,...payload})}))));assert.equal(simultaneous.filter(result=>result.status===200).length,1);assert.equal(Math.max(...Object.values(rawQuiz(duel).quiz.scores)),3);assert.equal(Number(native.prepare('SELECT count(*) AS n FROM quiz_history WHERE fingerprint=?').get(duelState.current.fingerprint).n),2);
// OpenTDB's token handshake and translated normalization are tested without a network dependency.
const fetchBeforeQuiz=globalThis.fetch;let openCalls=0;globalThis.fetch=async()=>{openCalls++;return openCalls===1?Response.json({response_code:0,token:'session-token'}):Response.json({response_code:0,results:[{type:'multiple',difficulty:'easy',category:'Science & Nature',question:'Capital%20of%20Korea%3F',correct_answer:'Seoul',incorrect_answers:[]} ]});};
let external=await openTrivia.openTriviaDb.fetchQuestions({limit:10,signal:new AbortController().signal});assert.equal(external.token,'session-token');external=await openTrivia.openTriviaDb.fetchQuestions({limit:10,token:external.token,signal:new AbortController().signal,translate:async text=>text.includes('Capital')?'대한민국의 수도는?':'서울'});assert.equal(external.questions[0].answer,'서울');assert.equal(openCalls,2);globalThis.fetch=fetchBeforeQuiz;
console.log('PASS: quiz single/multiplayer, four difficulties, safe Korean/English/numeric hints, retired repetitive questions, reveal, normalization, cooldown, CAS first answer, scoring, history, fingerprint dedup, cached fallback and OpenTDB session token');
// AI game runs the real provider adapters with controlled HTTP responses; no paid key needed.
const infiltrator=await route('app/api/games/infiltrator/route.ts');
const aiLogic=await import(aiEngine),providerModule=await import(aiProviders);
const aiRoom=(await call(rooms,a,'create',{name:'대영'})).id;
await call(rooms,b,'join',{room:aiRoom,name:'유진'});await call(rooms,c,'join',{room:aiRoom,name:'민수'});
const originalFetch=globalThis.fetch;let calls=0,httpStatus=200,hold=null;
const testKey='test-key-not-a-real-secret';
globalThis.fetch=async(input,options)=>{calls++;const body=JSON.parse(options.body);assert(!JSON.stringify(body).includes(testKey));assert(!String(input).includes(testKey));assert(JSON.stringify(options.headers).includes(testKey));if(hold)await hold;return Response.json(httpStatus===200?String(input).includes('openai')?{choices:[{message:{content:'그냥 집에서 늦잠 잘 듯'}}]}:String(input).includes('googleapis')?{candidates:[{content:{parts:[{text:'바다 가서 쉬고 싶음'}]}}]}:{content:[{type:'text',text:'난 맛있는 거 먹으러 갈듯'}]}:{error:{message:testKey}},{status:httpStatus});};
for(const [provider,model] of [['openai','gpt-4.1-mini'],['gemini','gemini-3.5-flash-lite'],['anthropic','claude-haiku-4-5-20251001']])assert((await providerModule.generate(provider,model,testKey,'짧게 답해라')).length>0);
for(const [status,code] of [[401,'auth'],[429,'quota'],[404,'model'],[503,'network']]){httpStatus=status;await assert.rejects(providerModule.generate('openai','gpt-4.1-mini',testKey,'test'),e=>e.code===code&&!e.message.includes(testKey));}
httpStatus=200;
await assert.rejects(providerModule.generate('openai','unsupported',testKey,'test'));
await call(infiltrator,b,'test',{room:aiRoom,provider:'openai',model:'gpt-4.1-mini',key:testKey},403);
assert.equal((await call(infiltrator,a,'test',{room:aiRoom,provider:'openai',model:'gpt-4.1-mini',key:testKey})).connected,true);
await call(infiltrator,a,'test',{room:aiRoom,provider:'openai',model:'gpt-4.1-mini',key:testKey},429);
const aiSettings={provider:'openai',model:'gpt-4.1-mini',participants:3,rounds:3,seconds:20,questionSet:'daily',key:testKey};
await call(infiltrator,a,'start',{room:aiRoom,settings:aiSettings});
function rawAI(){return JSON.parse(native.prepare('SELECT state FROM rooms WHERE id=?').get(aiRoom).state);}
function editAI(edit){const room=rawAI();edit(room.infiltrator);native.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE id=?').run(JSON.stringify(room),aiRoom);}
function extraAI(extra={}){const state=rawAI().infiltrator;return {room:aiRoom,gameId:state.id,round:state.round,...extra};}
assert(!JSON.stringify(rawAI()).includes(testKey));
await call(rooms,a,'start',{room:aiRoom},400);
await call(infiltrator,a,'start',{room:aiRoom,settings:aiSettings},400);
for(let round=0;round<3;round++){
 const countBefore=calls;
 if(round===0){let resolve;hold=new Promise(r=>resolve=r);const pending=call(infiltrator,a,'generate',extraAI({key:testKey}));await new Promise(r=>setTimeout(r,20));await call(infiltrator,a,'generate',extraAI({key:testKey}),400);resolve();await pending;hold=null;}
 else await call(infiltrator,a,'generate',extraAI({key:testKey}));
 assert.equal(calls,countBefore+1);
 const privateState=rawAI().infiltrator;
 for(const token of [a,b,c]){const state=(await call(infiltrator,token,'get',{room:aiRoom})).state;assert.equal(state.isTarget,token===privateState.target);assert(!JSON.stringify(state).includes(testKey));assert(!Object.hasOwn(state,'answers'));assert(!Object.hasOwn(state,'target'));}
 const publicState=await call(rooms,b,'poll',{room:aiRoom});assert(!Object.hasOwn(publicState,'infiltrator'));assert(!JSON.stringify(publicState).includes(testKey));
 const humans=[a,b,c].filter(t=>t!==privateState.target);
 await call(infiltrator,privateState.target,'answer',extraAI({text:'직접 답변'}),400);
 await call(infiltrator,humans[0],'answer',extraAI({text:'사람 답변 하나'}));
 await call(infiltrator,humans[0],'answer',extraAI({text:'중복'}),400);
 assert(!(await call(rooms,b,'poll',{room:aiRoom})).messages.some(m=>m.text==='사람 답변 하나'&&m.time>=(publicState.messages.at(-1)?.time??0))||round>0);
 await call(infiltrator,humans[1],'answer',extraAI({text:'사람 답변 둘'}));
 const revealed=await call(rooms,b,'poll',{room:aiRoom});assert(revealed.messages.some(m=>m.name===privateState.players.find(p=>p.id===privateState.target).name&&m.text==='그냥 집에서 늦잠 잘 듯'&&!m.system));
 assert.equal(rawAI().infiltrator.stage,'discussion');
 const prior=rawAI().messages.filter(m=>m.name==='유진').at(-1);if(prior)prior.time=0;
 // Conversation coexists with the game (rate limiter may reject an immediate send).
 const chatRoom=rawAI();chatRoom.messages.forEach(m=>m.time=0);native.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE id=?').run(JSON.stringify(chatRoom),aiRoom);
 await call(rooms,b,'chat',{room:aiRoom,text:'평소 말투랑 좀 다른데'});
 editAI(s=>s.deadline=Date.now()-1);await call(infiltrator,a,'get',{room:aiRoom});
}
assert.equal(rawAI().infiltrator.stage,'voting');
const aiTarget=rawAI().infiltrator.target,humans=[a,b,c].filter(t=>t!==aiTarget);
await call(infiltrator,humans[0],'vote',extraAI({target:aiTarget.slice(0,8)}));
await call(infiltrator,humans[0],'vote',extraAI({target:aiTarget.slice(0,8)}),400);
await call(infiltrator,humans[1],'vote',extraAI({target:aiTarget.slice(0,8)}));
assert.equal(rawAI().infiltrator.stage,'finished');assert(rawAI().messages.some(m=>m.text.includes('시민 승')));
// Restart, provider failure, bounded retry, stale action, outsider and origin protection.
await call(infiltrator,a,'start',{room:aiRoom,settings:aiSettings});
httpStatus=401;await call(infiltrator,a,'generate',extraAI({key:testKey}));assert(rawAI().infiltrator.error.includes('API Key'));
assert(!(await call(infiltrator,b,'get',{room:aiRoom})).state.error);
await call(infiltrator,b,'retry',extraAI(),403);await call(infiltrator,a,'retry',extraAI());
httpStatus=429;await call(infiltrator,a,'generate',extraAI({key:testKey}));assert.equal(rawAI().infiltrator.stage,'discussion');assert.equal(rawAI().infiltrator.attempts,2);
await call(infiltrator,a,'retry',extraAI(),400);
await call(infiltrator,crypto.randomUUID(),'get',{room:aiRoom},403);
await call(infiltrator,a,'vote',extraAI({gameId:crypto.randomUUID(),target:b.slice(0,8)}),409);
await call(infiltrator,a,'stop',extraAI());assert.equal(rawAI().infiltrator.cancelled,true);
httpStatus=200;await call(infiltrator,a,'start',{room:aiRoom,settings:aiSettings});
editAI(s=>{const room=rawAI();const lease=aiLogic.claim(room,Date.now());Object.assign(s,room.infiltrator);assert(lease);s.deadline=Date.now()-1;});
await call(infiltrator,a,'get',{room:aiRoom});assert(rawAI().infiltrator.error.includes('대기 시간'));
await call(rooms,c,'leave',{room:aiRoom});assert.equal(rawAI().infiltrator.stage,'finished');
assert(!JSON.stringify(rawAI()).includes(testKey));
globalThis.fetch=originalFetch;
console.log('PASS: BYOK adapters, auth/quota/model errors, API key/role/answer isolation, one call per round under concurrency, game lifecycle, hidden answers, discussion, voting, restart, bounded retry, lease recovery and leave');
native.close();delete globalThis.messengerTest;
console.log('PASS: sword outcomes, sale/shop, protection, rescue, max level, state restoration across rooms, idempotency, concurrent CAS, event visibility and membership');
console.log('PASS: profiles/photos, friends, private conversations, shared history, unread/read tracking, group word game, R2 upload/download, legacy schema, size/member checks');
