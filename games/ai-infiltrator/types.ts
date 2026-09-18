import type {ProviderId} from '@/ai/config';
import type {QuestionSet} from './questions';
export type Settings={provider:ProviderId;model:string;rounds:number;seconds:number;participants:number;questionSet:QuestionSet};
export type InfiltratorState=Settings&{id:string;creator:string;players:{id:string;name:string}[];target:string;stage:'generating'|'answering'|'discussion'|'voting'|'finished';round:number;questions:string[];answers:Record<string,string>;votes:Record<string,string>;history:{round:number;question:string;answer:string}[];deadline:number;attempts:number;lease:string;error:string;cancelled:boolean};
export type InfiltratorView=Settings&{id:string;creator:string;players:{id:string;name:string}[];stage:InfiltratorState['stage'];round:number;question:string;deadline:number;isTarget:boolean;participating:boolean;answered:boolean;voted:boolean;needsAI:boolean;error:string;attempts:number;cancelled:boolean};
