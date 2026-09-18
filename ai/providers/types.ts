export type GenerateInput={key:string;model:string;prompt:string};
export type AIProvider={generate(input:GenerateInput):Promise<string>};
export class ProviderError extends Error {constructor(public code:'auth'|'quota'|'model'|'network'|'empty'){super(code);}}
export async function request(url:string,headers:Record<string,string>,body:unknown){
 let response:Response;
 try{response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(15000),redirect:'error'});}catch{throw new ProviderError('network');}
 if(!response.ok){await response.body?.cancel();throw new ProviderError(response.status===401||response.status===403?'auth':response.status===429?'quota':response.status===400||response.status===404?'model':'network');}
 try{return await response.json() as unknown;}catch{throw new ProviderError('network');}
}
export function clean(text:string){const value=text.replace(/[\r\n]+/g,' ').trim().slice(0,120);if(!value||/(저는|나는)\s*(AI|인공지능)/i.test(value))throw new ProviderError('empty');return value;}
export const errorMessages={auth:'API Key와 접근 권한을 확인해 주세요.',quota:'사용 한도 또는 잔액을 확인해 주세요.',model:'해당 모델을 사용할 수 없습니다. 모델 설정을 확인해 주세요.',network:'AI 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',empty:'AI 응답을 받지 못했습니다. 다시 시도해 주세요.'};
