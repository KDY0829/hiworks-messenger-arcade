import {request,ProviderError,type AIProvider} from './types';
export const openai:AIProvider={async generate({key,model,prompt,maxTokens=256}){
 const data=await request('https://api.openai.com/v1/chat/completions',{Authorization:`Bearer ${key}`},{model,store:false,messages:[{role:'user',content:prompt}],max_completion_tokens:Math.max(256,maxTokens),...(model==='gpt-5.4-nano'?{reasoning_effort:'none'}:{})}) as {choices?:{finish_reason?:string;message?:{content?:string}}[]};
 const choice=data.choices?.[0];if(choice?.finish_reason==='length')throw new ProviderError('length');return choice?.message?.content??'';
}};
