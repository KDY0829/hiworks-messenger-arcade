import type {QuizQuestion} from '../general-quiz/types';
import {items} from './questions';
const marks=['①','②','③','④','⑤'];
export const aptitudeQuestions:readonly QuizQuestion[]=items.map(item=>({
 id:`aptitude-v2:${item.id}`,provider:'aptitude',providerQuestionId:item.id,fingerprint:`aptitude-v2:${item.id}`,
 question:item.stem,answer:String(item.correct+1),acceptedAnswers:[marks[item.correct],`${item.correct+1}번`],displayAnswer:`${marks[item.correct]} ${item.options[item.correct]}`,
 difficulty:item.difficulty,category:item.area==='numerical'?'science':item.area==='reasoning'?'society':'culture',source:'OfficeChat 독립 제작 적성 유형 연습',kind:'choice',
 options:item.options,table:item.table,chart:item.chart,topic:item.topic,hint:item.hint,extraHint:item.extraHint,
 explanation:`풀이\n${item.solution}\n\n빠른 풀이\n${item.shortcut}\n\n선지 검토\n${item.reasons.map((reason,index)=>`${marks[index]} ${reason}`).join('\n')}`,
}));
