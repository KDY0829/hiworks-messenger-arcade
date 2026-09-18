// Client-safe model metadata. Update only this list when adding models.
export const providers=[
 {id:'openai',name:'OpenAI',models:[{id:'gpt-4.1-mini',name:'GPT-4.1 mini'},{id:'gpt-4.1',name:'GPT-4.1'}]},
 {id:'gemini',name:'Google Gemini',models:[{id:'gemini-3.5-flash-lite',name:'Gemini 3.5 Flash-Lite'},{id:'gemini-3.1-pro-preview',name:'Gemini 3.1 Pro (미리 보기)'}]},
 {id:'anthropic',name:'Anthropic Claude',models:[{id:'claude-haiku-4-5-20251001',name:'Claude Haiku 4.5'},{id:'claude-sonnet-5',name:'Claude Sonnet 5'}]},
] as const;
export type ProviderId=typeof providers[number]['id'];
export function validModel(provider:string,model:string){return providers.some(p=>p.id===provider&&p.models.some(m=>m.id===model));}
