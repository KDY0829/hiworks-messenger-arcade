import type {QuizCategory,QuizDifficulty} from '../types';
import type {ProviderFetchContext,ProviderFetchResult,QuizProvider} from './types';
const countries='Q30 Q145 Q142 Q183 Q38 Q29 Q17 Q148 Q159 Q155 Q16 Q408 Q884 Q668 Q55 Q31 Q34 Q36 Q213 Q39 Q43 Q45 Q252 Q833'.split(' ');
const authors='Q41567 Q83186 Q25338 Q480 Q208460 Q170583 Q26505 Q40185 Q150827 Q163297 Q165318 Q178869 Q181488 Q184222 Q214371 Q271764 Q320372 Q860577 Q1396889 Q11278105 Q12595068 Q12609038'.split(' ');
const artworks='Q12418 Q45585 Q471379 Q128910 Q175036 Q25729 Q29530 Q157541 Q186953 Q219831 Q328523 Q698487 Q910199 Q1189907'.split(' ');
const films='Q61448040 Q44578 Q43361 Q47703 Q11621 Q104123 Q128518 Q163872 Q167726 Q171048 Q189505 Q475693 Q488169 Q488222 Q492908 Q6408823 Q7690479 Q16930989 Q20444585 Q55106022 Q100889636'.split(' ');
const music='Q5064 Q12016 Q185968 Q193705 Q199786 Q327331 Q724981'.split(' ');
const commonCountries=new Set(['Q30','Q145','Q142','Q183','Q38','Q29','Q17','Q148','Q159','Q155','Q16','Q408','Q884','Q668']);
const middleSubjects=new Set('Q41567 Q83186 Q25338 Q480 Q208460 Q170583 Q1396889 Q12418 Q45585 Q471379 Q128910 Q157541 Q61448040 Q44578 Q43361 Q47703 Q11621 Q167726 Q171048 Q189505 Q12016 Q193705 Q199786 Q5064'.split(' '));
const advancedSubjects=new Set('Q40185 Q178869 Q271764 Q320372 Q11278105 Q25729 Q29530 Q186953 Q219831 Q328523 Q698487 Q910199 Q1189907 Q185968 Q327331 Q724981'.split(' '));
const definitions=[
 {kind:'capital',property:'P36',subjects:countries},
 {kind:'author',property:'P50',subjects:authors},
 {kind:'artist',property:'P170',subjects:artworks},
 {kind:'director',property:'P57',subjects:films},
 {kind:'composer',property:'P86',subjects:music},
] as const;
type Kind=typeof definitions[number]['kind'];
type Binding={kind:{value:Kind};subject:{value:string};subjectLabel:{value:string};answer:{value:string};answerLabel?:{value:string}};
function id(uri:string){return uri.split('/').at(-1)??uri;}
function objectParticle(value:string){const last=[...value].reverse().find(char=>/[가-힣]/.test(char));return last&&((last.charCodeAt(0)-0xac00)%28!==0)?'을':'를';}
function mapped(kind:Kind,subjectId:string):{difficulty:QuizDifficulty;category:Exclude<QuizCategory,'all'>;question:(subject:string)=>string}{
 const difficulty:QuizDifficulty=kind==='capital'?(commonCountries.has(subjectId)?'elementary':'middle'):middleSubjects.has(subjectId)?'middle':advancedSubjects.has(subjectId)?'university':'high';
 if(kind==='capital')return {difficulty,category:'geography',question:subject=>`${subject}의 수도는 어디일까요?`};
 if(kind==='author')return {difficulty,category:'literature',question:subject=>`작품 《${subject}》${objectParticle(subject)} 쓴 작가는 누구일까요?`};
 if(kind==='artist')return {difficulty,category:'art',question:subject=>`미술 작품 《${subject}》${objectParticle(subject)} 그린 화가는 누구일까요?`};
 if(kind==='director')return {difficulty,category:'culture',question:subject=>`영화 《${subject}》의 감독은 누구일까요?`};
 return {difficulty,category:'art',question:subject=>`음악 작품 《${subject}》${objectParticle(subject)} 작곡한 사람은 누구일까요?`};
}
function aliases(answer:string){const common:Record<string,string[]>= {'도쿄도':['도쿄'],'서울특별시':['서울'],'베이징시':['베이징'],'워싱턴 D.C.':['워싱턴','워싱턴 DC']};if(common[answer])return common[answer];const words=answer.trim().split(/\s+/);if(words.length<2)return [];return [answer.includes(' 다 ')?words.slice(-2).join(' '):words.at(-1)!];}
export const wikidata:QuizProvider={id:'wikidata',name:'Wikidata',license:'CC0 1.0',source:'https://www.wikidata.org/',enabledByDefault:true,
 async healthCheck(signal){const response=await fetch('https://www.wikidata.org/wiki/Special:EntityData/Q884.json',{headers:{Accept:'application/json'},signal});return response.ok;},
 async fetchQuestions(context:ProviderFetchContext):Promise<ProviderFetchResult>{
  const unions=definitions.map(definition=>`{ VALUES ?subject { ${definition.subjects.map(value=>`wd:${value}`).join(' ')} } ?subject wdt:${definition.property} ?answer. BIND("${definition.kind}" AS ?kind) }`).join(' UNION ');
  const query=`SELECT ?kind ?subject ?subjectLabel ?answer ?answerLabel WHERE { ${unions} SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". } } LIMIT ${Math.min(240,Math.max(40,context.limit))}`;
  const url=new URL('https://query.wikidata.org/sparql');url.searchParams.set('query',query);
  const response=await fetch(url,{headers:{Accept:'application/sparql-results+json','User-Agent':'OfficeChatQuiz/1.1 (https://github.com/KDY0829/hiworks-messenger-arcade)'},signal:context.signal});if(!response.ok)throw new Error('Wikidata request failed');
  const data=await response.json() as {results:{bindings:Binding[]}};const counts=new Map<string,number>();for(const row of data.results.bindings){const key=`${row.kind.value}:${id(row.subject.value)}`;counts.set(key,(counts.get(key)??0)+1);}
  const questions=[];for(const row of data.results.bindings){const subjectId=id(row.subject.value),key=`${row.kind.value}:${subjectId}`;if((counts.get(key)??0)!==1)continue;const answer=row.answerLabel?.value??'';if(!/[가-힣]/.test(row.subjectLabel.value)||!/[가-힣]/.test(answer))continue;const meta=mapped(row.kind.value,subjectId);questions.push({provider:'wikidata',providerQuestionId:`${row.kind.value}:${subjectId}:${id(row.answer.value)}`,question:meta.question(row.subjectLabel.value),answer,acceptedAnswers:aliases(answer),difficulty:meta.difficulty,category:meta.category,source:`https://www.wikidata.org/wiki/${subjectId}`});}
  return {questions};
 }
};
