export type QuizDifficulty='elementary'|'middle'|'high'|'university';
export type QuizCategory='all'|'history'|'science'|'geography'|'society'|'culture'|'literature'|'art'|'technology'|'food'|'sports'|'general';
export type QuizQuestion={
 id:string;provider:string;providerQuestionId:string|null;question:string;answer:string;acceptedAnswers:string[];
 difficulty:QuizDifficulty;category:Exclude<QuizCategory,'all'>;source:string;fingerprint:string;
};
export type QuizSettings={difficulty:QuizDifficulty;category:QuizCategory;questionCount:5|10|20|0};
export type QuizPlayer={id:string;name:string};
export type QuizStats={correct:number;wrong:number;streak:number;bestStreak:number;responseTotal:number};
export type QuizState=QuizSettings&{
 id:string;creator:string;players:QuizPlayer[];stage:'question'|'result'|'loading'|'finished';number:number;
 queue:QuizQuestion[];cursor:number;current:QuizQuestion|null;openedAt:number;deadline:number;hintStage:0|1|2;
 scores:Record<string,number>;stats:Record<string,QuizStats>;attempts:Record<string,number>;lastAttemptAt:Record<string,number>;
 categoryHistory:string[];usedFingerprints:string[];completedFingerprint:string;historyRecorded:boolean;
 winner:string;nextAt:number;cancelled:boolean;
};
export type QuizView=QuizSettings&{
 id:string;creator:string;players:QuizPlayer[];stage:QuizState['stage'];number:number;deadline:number;openedAt:number;
 hintStage:0|1|2;question:string;hint:string;extraHint:string;answer:string;participating:boolean;
 attempts:number;maxAttempts:number;myScore:number;scores:{id:string;name:string;score:number}[];stats:QuizStats;cancelled:boolean;
};
