export type GenerateInput={key:string;model:string;prompt:string;maxTokens?:number};
export type AIProvider={generate(input:GenerateInput):Promise<string>};
export type ProviderErrorCode='auth'|'permission'|'quota'|'rate'|'model'|'request'|'network'|'timeout'|'empty'|'length';
export class ProviderError extends Error {constructor(public code:ProviderErrorCode,public status?:number,public apiCode?:string){super(`${errorMessages[code]}${status?` (HTTP ${status}${apiCode?` · ${apiCode}`:''})`:''}`);}}
export async function request(url:string,headers:Record<string,string>,body:unknown){
 let response:Response;
 try{response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(45000),redirect:'error'});}catch(error){throw new ProviderError(error instanceof Error&&(error.name==='TimeoutError'||error.name==='AbortError')?'timeout':'network');}
 if(!response.ok){
  // Never return provider message text: it can contain the visitor's secret.
  let apiCode='';try{const data=await response.json() as {error?:{code?:string;type?:string}};const candidate=data.error?.code??data.error?.type??'';if(['invalid_api_key','insufficient_quota','rate_limit_exceeded','model_not_found','permission_denied','unsupported_parameter','invalid_request_error'].includes(candidate))apiCode=candidate;}catch{}
  const code:ProviderErrorCode=response.status===401?'auth':response.status===403?'permission':response.status===429?(apiCode==='rate_limit_exceeded'?'rate':'quota'):response.status===404||apiCode==='model_not_found'?'model':response.status===400?'request':'network';
  throw new ProviderError(code,response.status,apiCode);
 }
 try{return await response.json() as unknown;}catch{throw new ProviderError('network');}
}
export function clean(text:string){const value=text.replace(/[\r\n]+/g,' ').trim().slice(0,120);if(!value||/(저는|나는)\s*(AI|인공지능)/i.test(value))throw new ProviderError('empty');return value;}
export const errorMessages={auth:'API Key가 유효하지 않습니다. 앞뒤 공백·폐기 여부를 확인해 주세요.',permission:'이 키에 모델 또는 API 호출 권한이 없습니다. 프로젝트 키의 권한을 확인해 주세요.',quota:'API 잔액 또는 프로젝트 사용 한도를 확인해 주세요. ChatGPT 구독과 API 결제는 별도입니다.',rate:'요청 한도에 도달했습니다. 잠시 후 다시 테스트해 주세요.',model:'해당 모델에 접근할 수 없습니다. 다른 모델로 테스트해 주세요.',request:'AI 서비스가 요청 형식을 거절했습니다. 다른 모델로 테스트해 주세요.',network:'AI 서비스에 연결하지 못했습니다. 네트워크 또는 서비스 상태를 확인해 주세요.',timeout:'AI 응답이 45초 안에 도착하지 않았습니다. 잠시 후 다시 시도해 주세요.',empty:'AI가 답변을 반환하지 않았습니다. 다른 모델로 테스트해 주세요.',length:'AI 답변이 출력 한도에서 잘렸습니다. 문항 수를 줄여 다시 시작해 주세요.'};
