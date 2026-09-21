import type {QuizCategory,QuizDifficulty} from '../types';
import type {ProviderFetchContext,ProviderFetchResult,QuizProvider} from './types';
type Row={category:string;question:string;correct_answer:string;difficulty:'easy'|'medium'|'hard';type:string};
const category=(value:string):Exclude<QuizCategory,'all'>=>/science|nature|computer|math/i.test(value)?'science':/history/i.test(value)?'history':/geography/i.test(value)?'geography':/sport/i.test(value)?'sports':/art/i.test(value)?'art':/book/i.test(value)?'literature':/food/i.test(value)?'food':'general';
function difficulty(row:Row):QuizDifficulty{const specialist=/mythology|politics|vehicles|anime|video games/i.test(row.category);if(row.difficulty==='easy')return specialist?'middle':'elementary';if(row.difficulty==='medium')return specialist?'high':'middle';return specialist||row.question.length>85?'university':'high';}
async function translated(value:string,translate?:ProviderFetchContext['translate']){if(/[가-힣]/.test(value))return value;return translate?translate(value):null;}
export const openTriviaDb:QuizProvider={id:'opentdb',name:'Open Trivia DB',license:'CC BY-SA 4.0',source:'https://opentdb.com/',enabledByDefault:true,
 async healthCheck(signal){const response=await fetch('https://opentdb.com/api_count_global.php',{signal});return response.ok;},
 async fetchQuestions(context:ProviderFetchContext):Promise<ProviderFetchResult>{
  let token=context.token??null;
  if(!token){const response=await fetch('https://opentdb.com/api_token.php?command=request',{signal:context.signal});if(!response.ok)throw new Error('OpenTDB token request failed');const data=await response.json() as {response_code:number;token?:string};if(data.response_code!==0||!data.token)throw new Error('OpenTDB token request failed');return {questions:[],token:data.token};}
  const url=`https://opentdb.com/api.php?amount=${Math.min(50,context.limit)}&type=multiple&encode=url3986&token=${encodeURIComponent(token)}`;
  const response=await fetch(url,{signal:context.signal});if(!response.ok)throw new Error('OpenTDB request failed');const data=await response.json() as {response_code:number;results:Row[]};
  if(data.response_code===3){token=null;return {questions:[],token};}if(data.response_code===4)return {questions:[],token:null};if(data.response_code!==0)throw new Error(`OpenTDB response ${data.response_code}`);
  const questions=[];
  for(const row of data.results){const originalQuestion=decodeURIComponent(row.question),originalAnswer=decodeURIComponent(row.correct_answer);const question=await translated(originalQuestion,context.translate),answer=await translated(originalAnswer,context.translate);if(!question||!answer)continue;questions.push({provider:'opentdb',providerQuestionId:null,question,answer,acceptedAnswers:[originalAnswer],difficulty:difficulty({...row,question:originalQuestion}),category:category(row.category),source:'https://opentdb.com/'});}
  return {questions,token};
 }
};
