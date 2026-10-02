import {generateRaw} from '@/ai/providers/registry';
import {ProviderError} from '@/ai/providers/types';
import {quizCategoryName} from './config';
import {normalizedQuestion,questionFingerprint} from './normalize';
import type {QuizQuestion,QuizSettings} from './types';

type GeneratedQuestion={question?:unknown;answer?:unknown;acceptedAnswers?:unknown;category?:unknown};
const categoryIds=['history','science','geography','society','culture','literature','art','technology','food','sports','general'] as const;
const banned=/(?:감독|작가|저자|원자번호|통화 이름|현재 대통령|현직|최근|올해|지난해|몇 년|몇 월|몇 일|연도는|날짜는)/;
function unwrap(value:string){return value.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();}
function prompt(settings:QuizSettings,count:number){const difficulty={elementary:'초등',middle:'중등',high:'고등',university:'대학'}[settings.difficulty];return `한국어 상식 퀴즈 ${count}개를 JSON 배열로만 작성하세요.
난이도: ${difficulty}. 분야: ${settings.category==='all'?'역사·과학·지리·사회·문화·문학·기술·음식·스포츠를 고르게':quizCategoryName(settings.category)}.
각 원소 형식: {"question":"...","answer":"...","acceptedAnswers":["..."],"category":"history|science|geography|society|culture|literature|art|technology|food|sports|general"}
규칙:
- 한국인이 가볍게 풀 만한 독립적인 단답형 문제만 작성합니다.
- 답은 한글 2~15글자이며 숫자, 영문, 기호만인 답은 금지합니다.
- 감독·작가·저자·통화 이름·원자번호·날짜·연도·현재 인물 질문은 금지합니다.
- 문제 문장에 정답이나 정답의 초성이 드러나면 안 됩니다.
- 모호한 표현, 복수 정답, 설명형 답, 객관식 보기는 금지합니다.
- 서로 중복되지 않게 하고 acceptedAnswers는 실제 허용할 다른 한국어 표기만 넣습니다.`;}
export async function generateQuizQuestions(settings:QuizSettings,key:string,count:number):Promise<QuizQuestion[]>{
 if(!settings.provider||!settings.model)throw new ProviderError('model');
 const raw=await generateRaw(settings.provider,settings.model,key,prompt(settings,count),Math.max(1800,count*240));let parsed:unknown;
 try{parsed=JSON.parse(unwrap(raw));}catch{throw new ProviderError('empty');}
 if(!Array.isArray(parsed))throw new ProviderError('empty');
 const questions:QuizQuestion[]=[],seen=new Set<string>();
 for(const value of parsed as GeneratedQuestion[]){
  const question=typeof value.question==='string'?value.question.replace(/\s+/g,' ').trim():'',answer=typeof value.answer==='string'?value.answer.replace(/\s+/g,' ').trim():'';
  const category=typeof value.category==='string'&&categoryIds.includes(value.category as typeof categoryIds[number])?value.category as typeof categoryIds[number]:(settings.category==='all'?'general':settings.category);
  const accepted=Array.isArray(value.acceptedAnswers)?value.acceptedAnswers.filter((item):item is string=>typeof item==='string').map(item=>item.trim()).filter(item=>/^[가-힣][가-힣 ]{1,14}$/.test(item)).slice(0,3):[];
  const normalized=normalizedQuestion(question),normalizedAnswer=normalizedQuestion(answer);
  if(question.length<10||question.length>90||!/^[가-힣][가-힣 ]{1,14}$/.test(answer)||banned.test(question)||normalized.includes(normalizedAnswer)||seen.has(normalized))continue;
  seen.add(normalized);const fingerprint=await questionFingerprint(question);
  questions.push({id:`ai:${fingerprint.slice(0,20)}`,provider:`ai-${settings.provider}`,providerQuestionId:null,question,answer,acceptedAnswers:accepted,difficulty:settings.difficulty,category,source:`AI ${settings.provider}/${settings.model}`,fingerprint,kind:'short'});
  if(questions.length===count)break;
 }
 if(questions.length<count)throw new ProviderError('empty');return questions;
}
