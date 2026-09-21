import {openTriviaDb} from './open-trivia-db';
import {triviaApi} from './trivia-api';
import {wikidata} from './wikidata';
import type {QuizProvider} from './types';
export const quizProviders:QuizProvider[]=[wikidata,openTriviaDb,triviaApi];
export function quizProvider(id:string){return quizProviders.find(provider=>provider.id===id);}
