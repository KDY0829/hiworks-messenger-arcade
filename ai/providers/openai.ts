import {request,type AIProvider} from './types';
export const openai:AIProvider={async generate({key,model,prompt}){const data=await request('https://api.openai.com/v1/chat/completions',{Authorization:`Bearer ${key}`},{model,messages:[{role:'user',content:prompt}],max_tokens:100,temperature:1}) as {choices?:{message?:{content?:string}}[]};return data.choices?.[0]?.message?.content??'';}};
