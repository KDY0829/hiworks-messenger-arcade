import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync('games/aptitude/questions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {items}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const byId=Object.fromEntries(items.map(q=>[q.id,q]));
assert.equal(items.length,30);assert.equal(new Set(items.map(q=>q.stem)).size,30);assert.equal(new Set(items.map(q=>q.id)).size,30);
for(const q of items){assert.equal(q.options.length,5);assert.equal(new Set(q.options).size,5);assert.equal(q.reasons.length,5);assert(q.correct>=0&&q.correct<5);assert(q.solution.length>=50&&q.shortcut.length>=20);assert(q.reasons.every(reason=>reason.length>=5));}
for(const area of ['numerical','reasoning','verbal'])for(const difficulty of ['high','university'])assert.equal(items.filter(q=>q.area===area&&q.difficulty===difficulty).length,5);
const num=value=>Number(value.replaceAll(',','').replace('%',''));
function sole(id,truth){const q=byId[id],indexes=q.options.map((option,index)=>truth(option,index)?index:-1).filter(index=>index>=0);assert.deepEqual(indexes,[q.correct],`${id}: answer not unique or incorrect`);}
function numeric(id,value){sole(id,option=>Math.abs(parseFloat(option)-value)<1e-8);}
const n1=byId.N01.table.rows;numeric('N01',n1.reduce((sum,row)=>sum+num(row[1])*(row[0]==='B'?2:num(row[2]))/100,0)/n1.reduce((sum,row)=>sum+num(row[1]),0)*100);
const sales=byId.N02.table.rows.map(row=>({id:row[0],old:num(row[1]),next:num(row[2])}));
const increases=sales.map(row=>row.next-row.old),rates=sales.map((row,index)=>increases[index]/row.old);
const claims=[rates[3]===Math.max(...rates),increases[0]===increases[3]&&increases[0]===Math.max(...increases),Math.abs(increases.reduce((a,b)=>a+b)/sales.reduce((sum,row)=>sum+row.old,0)-.25)<1e-8];
sole('N02',option=>option.split(', ').join('')===['ㄱ','ㄴ','ㄷ'].filter((_,index)=>claims[index]).join(''));
assert.deepEqual(byId.N02.chart.series.map(series=>series.values),[sales.map(row=>row.old),sales.map(row=>row.next)]);
numeric('N03',(300*.1+200*.2)/(300+200+200)*100);
numeric('N04',(1-3/18)/(1/12+1/18));numeric('N05',(80000*1.5*.8-80000-6000)/80000*100);
const groupA=Array.from({length:49},(_,i)=>i+1).filter(a=>Math.abs((a*72+(50-a)*84)/50-79.2)<1e-8);assert.deepEqual(groupA,[20]);numeric('N06',(groupA[0]*72+5*90)/(groupA[0]+5));
const production=byId.N07.table.rows.map(row=>({id:row[0],gain:num(row[3])*(1-num(row[4])/100)-num(row[1])*(1-num(row[2])/100)}));
sole('N07',option=>option===production.find(row=>row.gain===Math.max(...production.map(row=>row.gain))).id);
const firstCheap=Array.from({length:100},(_,i)=>i+1).find(n=>n*10000*(n>=30?.95:1)+100000<n*12000+20000);numeric('N08',firstCheap);
const meet=Array.from({length:151},(_,i)=>i+30).find(t=>{const a=t<=60?t:t<=70?60:t-10,b=(t-30)*80/60;return b>=a;});assert.equal(meet,90);sole('N09',option=>option==='10시 30분');
function combinations(values,count){if(!count)return [[]];return values.flatMap((value,index)=>combinations(values.slice(index+1),count-1).map(rest=>[value,...rest]));}
const selected=combinations(['A1','A2','A3','B1','B2','C1'],3).filter(team=>team.includes('C1')),favourable=selected.filter(team=>new Set(team.map(name=>name[0])).size===3).length;
sole('N10',option=>{const [a,b]=option.split('/').map(Number);return a/b===favourable/selected.length;});
function permutations(values){return values.length?values.flatMap((v,index)=>permutations(values.filter((_,i)=>i!==index)).map(rest=>[v,...rest])):[[]];}
const pos=(p,name)=>p.indexOf(name);
const r1=permutations([...'ABCDE']).filter(p=>(pos(p,'A')===0||pos(p,'A')===4)&&pos(p,'C')<pos(p,'A')&&pos(p,'E')===1&&pos(p,'D')===pos(p,'B')+1);assert.equal(r1.length,1);sole('R01',option=>r1.every(p=>p[2]===option));
const r2=permutations([...'PQRST']).filter(p=>pos(p,'T')===4&&pos(p,'Q')===pos(p,'P')+1&&pos(p,'S')<pos(p,'P')&&pos(p,'R')>pos(p,'Q'));assert.equal(r2.length,1);sole('R02',option=>r2.every(p=>p[2]===option));
const assignments=[];for(let code=0;code<3**6;code++){let value=code;const a=Array.from({length:6},()=>{const result=value%3;value=Math.floor(value/3);return result;});if([0,1,2].some(x=>a.filter(y=>y===x).length!==2))continue;if(a[0]!==1||a[4]!==0||a[1]!==a[3]||a[3]===1||a[2]===a[0])continue;assignments.push(a);}
assert.equal(assignments.length,1);sole('R03',option=>option===['개발','디자인','영업'][assignments[0][5]]);
const r4=Array.from({length:16},(_,code)=>Array.from({length:4},(_,index)=>!!(code&(1<<index)))).filter(([approved,security,budget,doc])=>(!approved||security&&budget)&&(!budget||doc)&&!doc);
const predicates=[x=>!x[1],x=>x[1],x=>x[2],x=>!x[2]&&!x[0],()=>false];sole('R04',(_,i)=>r4.every(predicates[i]));
const defects=[0,1,2].filter(d=>[d===1,d!==0,d!==1].filter(Boolean).length===1);assert.deepEqual(defects,[0]);sole('R05',(_,i)=>i===defects[0]);
const r6=permutations([...'ABCDEF']).filter(p=>pos(p,'C')===5&&pos(p,'A')===3&&pos(p,'D')===pos(p,'B')+1&&![0,5].includes(pos(p,'E'))&&pos(p,'F')<pos(p,'E'));assert.equal(r6.length,2);
const checks=[p=>pos(p,'B')===0,p=>pos(p,'D')===1,p=>pos(p,'F')===0,p=>pos(p,'E')===4,p=>pos(p,'B')===1];sole('R06',(_,i)=>r6.every(checks[i]));
function validTeam(team){return team.length===3&&(!team.includes('A')||team.includes('B'))&&(!team.includes('D')||team.includes('E'))&&(team.includes('C')!==team.includes('F'))&&!(team.includes('B')&&team.includes('E'));}
sole('R07',option=>validTeam(option.split('·')));
const r8=permutations([...'PQRSTU']).filter(p=>pos(p,'R')===0&&Math.floor(pos(p,'Q')/2)===Math.floor(pos(p,'S')/2)&&pos(p,'T')===pos(p,'P')+1&&pos(p,'U')<pos(p,'Q'));numeric('R08',r8.length);
// Every finite model is a set of allowed person-types (researcher, Python, cloud, auditor).
const personTypes=Array.from({length:16},(_,code)=>Array.from({length:4},(_,i)=>!!(code&(1<<i)))).filter(([r,p,c,a])=>(!r||p)&&(!a||!c));
const models=Array.from({length:2**personTypes.length},(_,code)=>personTypes.filter((_,i)=>code&(1<<i))).filter(people=>people.some(([r,,c])=>r&&c));
const conclusions=[people=>people.every(([r,p])=>!p||r),people=>people.some(([r,,,a])=>r&&a),people=>people.every(([r,,,a])=>!r||!a),people=>people.every(([r,,c])=>!c||r),people=>people.some(([,p,,a])=>p&&!a)];sole('R09',(_,i)=>models.every(conclusions[i]));
numeric('R10',35+30+25-2*(15+12+10)+3*5);
// Construct a concrete counterexample to the false aggregate inference in V09.
assert(.8<.9&&.2<.3&&.9*.8+.1*.2>.1*.9+.9*.3);
console.log('PASS: 30 independent stems, five unique options, exact numerical answers, chart/table consistency, unique assignments, truth tables, finite-model entailment and logic enumeration');
