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
function prepared(query,params=[]){return {bind(...values){return prepared(query,values);},async first(){return native.prepare(query).get(...params)??null;},async all(){return {results:native.prepare(query).all(...params)};},async run(){return native.prepare(query).run(...params);}};}
scope.raw={prepare:prepared,async batch(statements){native.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());native.exec('COMMIT');return result;}catch(e){native.exec('ROLLBACK');throw e;}}};
const objects=new Map();scope.env={FILES:{async put(id,data){objects.set(id,new Uint8Array(data));},async get(id){const b=objects.get(id);return b?{async arrayBuffer(){return b.slice().buffer;}}:null;},async delete(id){objects.delete(id);}}};
const words=url(readFileSync('lib/words.ts','utf8')),dictionary=url(readFileSync('lib/dictionary.ts','utf8'));
const game=url(readFileSync('lib/game.ts','utf8').replace("'./words'",JSON.stringify(words)).replace("'./dictionary'",JSON.stringify(dictionary)));
async function route(file){let source=readFileSync(file,'utf8').replace(/import \{[^}]+\} from '@\/db';/,'const getDb=()=>globalThis.messengerTest.db,getRawDb=()=>globalThis.messengerTest.raw;').replace(/import \{([^}]+)\} from '@\/db\/schema';/,'const {$1}=globalThis.messengerTest.schema;').replace(/import \{([^}]+)\} from 'drizzle-orm';/,'const {$1}=globalThis.messengerTest.orm;').replace(/import \{env\} from 'cloudflare:workers';/,'const env=globalThis.messengerTest.env;').replace("'@/lib/game'",JSON.stringify(game));return import(url(source));}
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
native.close();delete globalThis.messengerTest;
console.log('PASS: profiles/photos, friends, private conversations, shared history, unread/read tracking, group word game, R2 upload/download, legacy schema, size/member checks');
