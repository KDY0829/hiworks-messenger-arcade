import type {QuizQuestion} from '../types';
export type ProviderFetchContext={limit:number;token?:string|null;signal:AbortSignal;translate?:(text:string)=>Promise<string|null>};
export type ProviderFetchResult={questions:Omit<QuizQuestion,'id'|'fingerprint'>[];token?:string|null};
export type QuizProvider={id:string;name:string;license:string;source:string;enabledByDefault:boolean;fetchQuestions(context:ProviderFetchContext):Promise<ProviderFetchResult>;healthCheck(signal:AbortSignal):Promise<boolean>};
