export type SwordAction='start'|'stop'|'enhance'|'sell'|'buy';
export type SwordState={level:number;gold:number;boost:number;shield:number;best:number;bestSale:number;attempts:number;successes:number;failures:number;destroyed:number;discovered:number[];activeRoom:string|null;result:string;history:string[]};
export type SwordView={state:SwordState;revision:number};
