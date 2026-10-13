'use client';
import {Button} from '@/components/ui/button';
import type {QuizView} from '../general-quiz/types';
const marks=['①','②','③','④','⑤'];
export function AptitudeCard({state,busy,creator,onAction}:{state:QuizView;busy:boolean;creator:boolean;onAction:(action:string,extra?:Record<string,unknown>)=>Promise<boolean>}){
 if(state.source!=='aptitude'||!state.question||state.stage==='finished'||!state.options)return null;
 const resolved=state.stage==='result',canAnswer=state.stage==='question'&&state.participating&&state.attempts===0&&!busy;
 const max=state.chart?Math.max(1,...state.chart.series.flatMap(series=>series.values)):1;
 return <section className="aptitude-card" data-aptitude-question="true" aria-label="인적성 문제">
  <header><strong>{state.topic}</strong><span>{state.difficulty==='university'?'고난도':'실전'} · {state.number}/{state.questionCount}</span></header>
  <p className="aptitude-stem">{state.question}</p>
  {state.chart&&<figure className="aptitude-chart"><figcaption>{state.chart.caption}</figcaption>{state.chart.labels.map((label,row)=><div key={label}><strong>{label}</strong>{state.chart!.series.map((series,index)=><div className="aptitude-bar-row" key={series.name}><span>{series.name}</span><div><i className={`series-${index}`} style={{width:`${series.values[row]/max*100}%`}}/></div><b>{series.values[row]}</b></div>)}</div>)}</figure>}
  {state.table&&<div className="aptitude-table-scroll"><table><caption>{state.table.caption}</caption><thead><tr>{state.table.headers.map((header,index)=><th key={index} scope="col">{header}</th>)}</tr></thead><tbody>{state.table.rows.map((row,index)=><tr key={index}>{row.map((cell,column)=>column===0?<th key={column} scope="row">{cell}</th>:<td key={column}>{cell}</td>)}</tr>)}</tbody></table></div>}
  <div className="aptitude-options" aria-label="정답 선택">{state.options.map((option,index)=><button key={index} className={resolved&&state.answer.startsWith(marks[index])?'correct-option':''} disabled={!canAnswer} onClick={()=>onAction('answer',{text:String(index+1)})}><span>{marks[index]}</span><span>{option}</span></button>)}</div>
  {state.stage==='ready'&&<p className="game-menu-note">참여자에게 문제가 표시되면 제한시간이 시작됩니다.</p>}
  {state.stage==='question'&&state.attempts>0&&<p className="game-menu-note">답변 완료 · 다른 참여자의 답변 또는 정답 공개를 기다립니다.</p>}
  {state.hint&&<p className="aptitude-hint">풀이 방향 · {state.hint}</p>}{state.extraHint&&<p className="aptitude-hint">추가 힌트 · {state.extraHint}</p>}
  {resolved&&<div className="aptitude-solution"><strong>정답 · {state.answer}</strong><p>{state.explanation}</p>{creator?<Button variant="outline" disabled={busy} onClick={()=>onAction('next')}>{state.number>=state.questionCount?'결과 보기':'다음 문제'}</Button>:<p className="game-menu-note">방장이 다음 문제로 넘길 수 있습니다.</p>}</div>}
 </section>;
}
