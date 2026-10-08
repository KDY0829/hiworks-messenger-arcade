import {validModel,type ProviderId} from '../config';
import {openai} from './openai';
import {gemini} from './gemini';
import {anthropic} from './anthropic';
import {clean,ProviderError,type AIProvider} from './types';
const registry:Record<ProviderId,AIProvider>={openai,gemini,anthropic};
export async function generate(provider:string,model:string,key:string,prompt:string){
 return clean(await generateRaw(provider,model,key,prompt,256));
}
export async function generateRaw(provider:string,model:string,key:string,prompt:string,maxTokens:number){
 if(!validModel(provider,model))throw new ProviderError('model');
 if(typeof key!=='string')throw new ProviderError('auth');key=key.trim();if(key.length<10||key.length>512||/[\r\n]/.test(key))throw new ProviderError('auth');
 const value=(await registry[provider as ProviderId].generate({key,model,prompt,maxTokens})).trim();if(!value)throw new ProviderError('empty');return value;
}
