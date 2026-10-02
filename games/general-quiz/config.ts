import type {QuizCategory,QuizDifficulty,QuizQuestion} from './types';
export const quizConfig={
 readyTimeoutMs:8_000,choseongAtMs:5_000,extraHintAtMs:10_000,revealAtMs:15_000,resultPauseMs:1_600,
 choiceRevealAtMs:30_000,
 answerCooldownMs:1_500,maxAttemptsPerQuestion:4,historyCooldownDays:30,
 playableFloorPerDifficulty:10,targetPoolPerDifficulty:100,refreshAfterMs:24*60*60*1000,
 providerRetryAfterMs:60*60*1000,
 providerTimeoutMs:12_000,maxQuestionLength:520,maxAnswerLength:50,
 points:{beforeHint:3,afterChoseong:2,afterExtraHint:1},
 questionCounts:[5,10,20,0] as const,
 difficulties:[
  {id:'elementary',name:'초등'},{id:'middle',name:'중등'},{id:'high',name:'고등'},{id:'university',name:'대학'},
 ] satisfies {id:QuizDifficulty;name:string}[],
 categories:[
  {id:'all',name:'전체'},{id:'history',name:'역사'},{id:'science',name:'과학'},{id:'geography',name:'지리'},
  {id:'society',name:'사회'},{id:'culture',name:'문화'},{id:'literature',name:'문학'},{id:'general',name:'일반상식'},
 ] satisfies {id:QuizCategory;name:string}[],
 providerPriority:['wikidata','opentdb','trivia-api'] as const,
};
export function quizCategoryName(id:QuizCategory){return quizConfig.categories.find(category=>category.id===id)?.name??id;}
export function retiredQuizQuestion(question:Pick<QuizQuestion,'provider'|'providerQuestionId'>){return question.provider==='wikidata';}
