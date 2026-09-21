import type {QuizCategory,QuizDifficulty} from '../types';
import type {ProviderFetchContext,ProviderFetchResult,QuizProvider} from './types';
const countries='Q30 Q145 Q142 Q183 Q38 Q29 Q17 Q148 Q159 Q155 Q16 Q408 Q884 Q96 Q414 Q668 Q55 Q31 Q20 Q35 Q34 Q36 Q213 Q40 Q39 Q43 Q212 Q218 Q219 Q41 Q45 Q27 Q37 Q33 Q191 Q211 Q28 Q214 Q215 Q224 Q221 Q222 Q225 Q403 Q227 Q232 Q252 Q833 Q928 Q869 Q819 Q424 Q881 Q836 Q854 Q902 Q837 Q843'.split(' ');
const elements='Q556 Q560 Q568 Q569 Q618 Q623 Q627 Q629 Q650 Q654 Q658 Q660 Q663 Q670 Q674 Q682 Q688 Q696 Q703 Q706 Q713 Q716 Q722 Q725 Q731 Q677 Q740 Q744 Q753 Q758 Q861 Q867 Q871 Q876 Q879 Q888 Q1090 Q897 Q925 Q708'.split(' ');
const commonCountries=new Set(['Q30','Q145','Q142','Q183','Q38','Q29','Q17','Q148','Q159','Q155','Q16','Q408','Q884','Q668']);
const commonElements=new Set(['Q556','Q560','Q623','Q627','Q629','Q658','Q660','Q663','Q670','Q674','Q682','Q688','Q703','Q706','Q677','Q753','Q758','Q1090','Q897','Q925','Q708']);
type Binding={kind:{value:string};subject:{value:string};subjectLabel:{value:string};answer:{value:string};answerLabel?:{value:string}};
function id(uri:string){return uri.split('/').at(-1)??uri;}
function mapped(kind:string,subjectId:string):{difficulty:QuizDifficulty;category:Exclude<QuizCategory,'all'>;question:(subject:string)=>string}{
 if(kind==='capital')return {difficulty:commonCountries.has(subjectId)?'elementary':'middle',category:'geography',question:subject=>`${subject}의 수도는 어디일까요?`};
 if(kind==='currency')return {difficulty:commonCountries.has(subjectId)?'middle':'high',category:'society',question:subject=>`${subject}에서 사용하는 통화는 무엇일까요?`};
 if(kind==='elementSymbol')return {difficulty:commonElements.has(subjectId)?'middle':'university',category:'science',question:subject=>`원소 ${subject}의 원소 기호는 무엇일까요?`};
 return {difficulty:commonElements.has(subjectId)?'high':'university',category:'science',question:subject=>`원소 ${subject}의 원자 번호는 몇 번일까요?`};
}
export const wikidata:QuizProvider={id:'wikidata',name:'Wikidata',license:'CC0 1.0',source:'https://www.wikidata.org/',enabledByDefault:true,
 async healthCheck(signal){const response=await fetch('https://www.wikidata.org/wiki/Special:EntityData/Q884.json',{headers:{Accept:'application/json'},signal});return response.ok;},
 async fetchQuestions(context:ProviderFetchContext):Promise<ProviderFetchResult>{
  const countryValues=countries.map(value=>`wd:${value}`).join(' '),elementValues=elements.map(value=>`wd:${value}`).join(' ');
  const query=`SELECT ?kind ?subject ?subjectLabel ?answer ?answerLabel WHERE { { VALUES ?subject { ${countryValues} } ?subject wdt:P36 ?answer. BIND("capital" AS ?kind) } UNION { VALUES ?subject { ${countryValues} } ?subject wdt:P38 ?answer. BIND("currency" AS ?kind) } UNION { VALUES ?subject { ${elementValues} } ?subject wdt:P246 ?answer. BIND("elementSymbol" AS ?kind) } UNION { VALUES ?subject { ${elementValues} } ?subject wdt:P1086 ?answer. BIND("atomicNumber" AS ?kind) } SERVICE wikibase:label { bd:serviceParam wikibase:language "ko". } } LIMIT ${Math.min(240,Math.max(40,context.limit))}`;
  const url=new URL('https://query.wikidata.org/sparql');url.searchParams.set('query',query);
  const response=await fetch(url,{headers:{Accept:'application/sparql-results+json','User-Agent':'OfficeChatQuiz/1.0 (https://github.com/KDY0829/hiworks-messenger-arcade)'},signal:context.signal});if(!response.ok)throw new Error('Wikidata request failed');
  const data=await response.json() as {results:{bindings:Binding[]}};const counts=new Map<string,number>();for(const row of data.results.bindings){const key=`${row.kind.value}:${id(row.subject.value)}`;counts.set(key,(counts.get(key)??0)+1);}
  const questions=[];for(const row of data.results.bindings){const subjectId=id(row.subject.value),key=`${row.kind.value}:${subjectId}`;if((counts.get(key)??0)!==1)continue;const answer=row.answerLabel?.value??row.answer.value;if(!/[가-힣]/.test(row.subjectLabel.value)||!answer||answer.startsWith('Q'))continue;const meta=mapped(row.kind.value,subjectId);questions.push({provider:'wikidata',providerQuestionId:`${row.kind.value}:${subjectId}:${id(row.answer.value)}`,question:meta.question(row.subjectLabel.value),answer,acceptedAnswers:[],difficulty:meta.difficulty,category:meta.category,source:`https://www.wikidata.org/wiki/${subjectId}`});}
  return {questions};
 }
};
