import type {QuizCategory,QuizDifficulty,QuizQuestion} from '../general-quiz/types';
const bank:QuizQuestion[]=[];
function add(difficulty:QuizDifficulty,category:QuizCategory,question:string,answer:string,explanation:string,hint:string,extraHint:string,acceptedAnswers:string[]=[]){const id=`aptitude-v1:${bank.length}`;bank.push({id,provider:'aptitude',providerQuestionId:id,question,answer,acceptedAnswers,difficulty,category:category as Exclude<QuizCategory,'all'>,source:'OfficeChat 자체 제작 적성 연습',fingerprint:id,kind:'short',explanation,hint,extraHint});}
const levels=['middle','high','university'] as const;
for(const [level,difficulty] of levels.entries())for(let i=1;i<=4;i++){
 const n=i+level*4,speed=30+6*n,hours=2+level;
 add(difficulty,'science',`자동차가 시속 ${speed}km로 ${hours}시간 이동한 뒤, 시속 ${speed/2}km로 2시간 더 이동했다. 총 이동 거리는 몇 km인가? (숫자만 입력)`,String(speed*(hours+1)),`${speed}×${hours} + ${speed/2}×2 = ${speed*(hours+1)}km.`,'각 구간의 거리를 따로 계산하세요.','거리 = 속력 × 시간입니다.');
 const workers=4+2*level,days=6*n;
 add(difficulty,'science',`작업 속도가 같은 ${workers}명이 ${days}일에 끝내는 일을 ${workers*2}명이 하면 며칠이 걸리는가? (하루 작업시간 동일, 숫자만 입력)`,String(days/2),`총 작업량은 ${workers}×${days} 인일. ${workers*2}명으로 나누면 ${days/2}일.`,'인원과 소요 시간은 반비례합니다.','작업량 = 인원 × 일수로 놓으세요.');
 const price=10000*n,markup=20+5*level,discount=10+5*level,profit=Math.round(price*(1+markup/100)*(1-discount/100)-price);
 add(difficulty,'science',`원가 ${price.toLocaleString()}원인 상품에 ${markup}% 이익을 붙여 정가를 정했다. 정가에서 ${discount}% 할인해 팔면 원가 대비 이익은 몇 원인가? (숫자만 입력)`, String(profit),`판매가 = ${price}×${1+markup/100}×${1-discount/100} = ${price+profit}원. 원가를 빼면 ${profit}원.`,'이익률과 할인율의 기준 금액은 다릅니다.','정가에 할인율을 적용한 후 원가를 빼세요.');
 const people=4+n,avg=40+level*10,added=avg+(people+1)*2;
 add(difficulty,'science',`${people}명의 평균 점수는 ${avg}점이다. ${added}점인 한 명이 추가되면 전체 평균은 몇 점인가? (숫자만 입력)`,String(avg+2),`기존 총점 ${people*avg}에 ${added}를 더해 ${people+1}로 나누면 ${avg+2}점.`,'평균을 더하지 말고 총점을 더하세요.','새 평균 = (기존 인원 × 평균 + 추가 점수) ÷ 새 인원.');
 const a=120*n,b=150*n,c=180*n;
 add(difficulty,'science',`다음은 부서별 월 매출(만원)이다.\nA: ${a} → ${b}\nB: ${b} → ${c}\n각 부서의 증가율을 비교하면 어느 부서가 더 높은가? (A 또는 B 입력)`,'A',`A는 (${b}-${a})/${a}=25%, B는 (${c}-${b})/${b}=20%. 증가액은 같아도 기준값이 작은 A의 증가율이 높습니다.`,'증가액과 증가율을 구분하세요.','증가율 = 증가액 ÷ 이전 매출 × 100.');
 const step=2+n,start=3+level,next=start+4*step;
 add(difficulty,'society',`수열 ${start}, ${start+step}, ${start+2*step}, ${start+3*step}, ? 에서 물음표에 들어갈 수는?`,String(next),`인접한 수의 차이는 모두 ${step}. 따라서 ${start+3*step}+${step}=${next}.`,'인접한 두 수의 차이를 보세요.',`일정한 수 ${step}씩 증가합니다.`);
 const base=2+n;
 add(difficulty,'society',`수열 ${base*base}, ${(base+1)**2}, ${(base+2)**2}, ${(base+3)**2}, ? 에서 다음 수는?`,String((base+4)**2),`${base}², ${base+1}², ${base+2}², ${base+3}²의 제곱수입니다. 다음은 ${base+4}²=${(base+4)**2}.`,'각 수를 제곱수로 표현해 보세요.','연속된 정수의 제곱입니다.');
 const x=2+n,ratio=level+2;
 add(difficulty,'society',`수열 ${x}, ${x*ratio}, ${x*ratio**2}, ${x*ratio**3}, ? 의 다음 수는?`,String(x*ratio**4),`이웃한 항의 비가 ${ratio}. ${x*ratio**3}×${ratio}=${x*ratio**4}.`,'뺄셈뿐 아니라 나눗셈으로 규칙을 확인하세요.',`바로 앞의 수에 ${ratio}를 곱합니다.`);
 const names=level===0?['가','나','다','라','마']:level===1?['A','B','C','D','E']:['P','Q','R','S','T'],order=names.slice(n%5).concat(names.slice(0,n%5));
 add(difficulty,'society',`다섯 사람이 왼쪽부터 일렬로 선다.\n${order.slice(0,4).map((name,index)=>`${name}는 ${order[index+1]}의 바로 왼쪽이다.`).join('\n')}\n왼쪽에서 세 번째 사람은?`,order[2],`왼쪽부터 ${order.join(' → ')}. 세 번째는 ${order[2]}.`,'바로 왼쪽이라는 관계를 연결하세요.','모든 관계를 하나의 사슬로 그려보세요.');
 const attribute=`제${n}기 `+['연수 수료자','품질교육 이수자','보안교육 이수자','자격증 보유자'][i-1];
 add(difficulty,'society',`모든 ${attribute}는 심사를 통과했다. 민수는 심사를 통과하지 않았다. 민수는 ${attribute}인가? (그렇다 / 아니다 / 판단불가)`,'아니다',`'${attribute} → 심사 통과'의 대우는 '심사 미통과 → ${attribute}가 아님'입니다.`,'명제의 대우를 이용하세요.','A이면 B일 때, B가 아니면 A도 아닙니다.');
}
const verbal:[QuizDifficulty,string,string,string,string[]?][]=[
 ['middle','적은 자원으로 같은 성과를 내는 것은 효과와 효율 중 무엇인가?','효율','효과는 목표 달성 정도, 효율은 투입 대비 산출의 관계입니다.'],
 ['middle','“실험은 성공했다. 그러나 추가 검증이 필요하다.”에서 두 문장을 연결하는 관계는? (대조 / 인과 / 예시)','대조','그러나는 앞 내용과 다른 방향의 내용을 연결합니다.'],
 ['middle','“모든 직원이 회의에 참석한 것은 아니다.”는 불참자가 있다는 뜻인가? (그렇다 / 아니다)','그렇다','전원이 참석했다는 명제를 부정하므로 적어도 한 명의 불참자가 있습니다.'],
 ['middle','“일부 고객이 환불을 요청했다.”만으로 모든 고객이 환불을 요청했다고 결론낼 수 있는가? (가능 / 불가)','불가','일부에 대한 진술은 전체에 대한 진술을 보장하지 않습니다.'],
 ['middle','“자료를 수집하고, 이를 분류한 후 보고서를 썼다.”에서 “이를”이 가리키는 것은?','자료','앞에 나온 명사 자료를 지시합니다.'],
 ['middle','“생산량이 늘었다. 그 결과 재고도 증가했다.”는 어떤 관계인가? (인과 / 대조 / 예시)','인과','그 결과는 앞 내용을 원인, 뒤 내용을 결과로 연결합니다.'],
 ['middle','“신청자에 한하여 입장할 수 있다.”에서 입장에 필요한 조건은 무엇인가? (신청 / 구매)','신청','한하다는 범위를 제한합니다. 입장하려면 신청자여야 합니다.'],
 ['middle','“비용은 증가했으나 판매량은 변하지 않았다.”에서 증가하지 않은 것은?','판매량','판매량은 변하지 않았다고 명시돼 있습니다.'],
 ['middle','“재고가 부족하므로 주문을 제한했다.”에서 주문 제한의 원인은?','재고 부족','재고 부족이 원인, 주문 제한이 결과입니다.',['재고부족']],
 ['middle','“어떤 지원자는 경력자다.”와 같은 뜻인가? “모든 지원자는 경력자다.” (같다 / 다르다)','다르다','어떤은 적어도 한 명, 모든은 전원을 뜻합니다.'],
 ['high','“정책 시행 후 매출이 올랐다.”만으로 정책이 매출 상승의 원인이라고 단정할 수 있는가? (가능 / 불가)','불가','시간상 앞뒤 관계만으로 인과관계를 확정할 수 없습니다. 다른 원인이 있을 수 있습니다.'],
 ['high','“재택근무자는 모두 노트북을 받았다.” 노트북을 받은 사람이 반드시 재택근무자인가? (그렇다 / 판단불가)','판단불가','A→B로부터 B→A를 도출할 수 없습니다. 재택근무자가 아닌 사람도 노트북을 받을 수 있습니다.'],
 ['high','“회의 참석자 중 누구도 지각하지 않았다.” 참석한 지수는 지각했는가? (했다 / 안했다)','안했다','참석자 전원에게 지각하지 않았다는 진술이 적용됩니다.',['안 했다']],
 ['high','“교육을 수료해야 승진 심사에 지원할 수 있다.”에서 교육 수료는 지원의 필요조건인가 충분조건인가?','필요조건','지원하려면 수료가 필요하지만, 수료만으로 지원 자격의 모든 조건을 갖춘다고 보장되지 않습니다.'],
 ['high','“예산이 승인되면 사업을 시작한다.”에서 예산 승인은 사업 시작의 필요조건인가 충분조건인가?','충분조건','승인되면 시작한다고 했으므로 승인은 시작을 보장하는 충분조건입니다. 다른 경로의 시작은 배제하지 않습니다.'],
 ['high','“제품 불량률이 낮아졌다. 반면 반품률은 높아졌다.” 연결 관계는? (대조 / 예시 / 부연)','대조','반면은 서로 대비되는 내용을 연결합니다.'],
 ['high','“팀원 대부분이 찬성했다.”로 팀원 전원이 찬성했다고 결론낼 수 있는가? (가능 / 불가)','불가','대부분은 전원과 같지 않습니다.'],
 ['high','“가격이 오르면 수요가 줄어든다. 이번에는 수요가 줄지 않았다.” 가격이 올랐는가? (올랐다 / 안올랐다)','안올랐다','P→Q와 ¬Q에서 ¬P를 도출하는 대우 추론입니다.',['안 올랐다']],
 ['high','“어느 관리자도 외부인은 아니다.” 관리자인 지민이 외부인일 수 있는가? (가능 / 불가)','불가','관리자 집합과 외부인 집합이 겹치지 않는다는 뜻입니다.'],
 ['high','“다음 주에도 검토하자.”에서 “도”는 이전에 검토한 적이 있다는 내용을 전제하는가? (그렇다 / 아니다)','그렇다','보조사 도는 같은 행위나 성질의 추가를 나타내므로 이전 검토를 전제합니다.'],
 ['university','“모든 A는 B다. 어떤 B는 C다.”로 어떤 A는 C라고 반드시 결론낼 수 있는가? (가능 / 불가)','불가','C인 B가 A 바깥에 있을 수 있습니다. A와 C의 교집합은 보장되지 않습니다.'],
 ['university','“어떤 A는 B다. 모든 B는 C다.”에서 어떤 A는 C라는 결론은 성립하는가? (성립 / 불성립)','성립','B인 A가 적어도 하나 있고 그 B는 C에 포함되므로 C인 A가 존재합니다.'],
 ['university','“승인 또는 재심사가 필요하다.”에서 둘 다 가능하며 적어도 하나가 필요할 때 사용하는 논리 연산은? (논리곱 / 논리합)','논리합','포괄적 또는은 둘 중 적어도 하나가 참이면 참이며 둘 다 참인 경우도 포함합니다.'],
 ['university','“A와 B 중 정확히 하나만 참이다.”는 포괄적 논리합인가 배타적 논리합인가?','배타적 논리합','둘 다 참인 경우를 제외하므로 배타적 논리합입니다.',['배타적논리합']],
 ['university','“성공한 기업만 분석해서 공통 전략을 발견했다.” 실패한 기업을 배제해 생기는 대표적인 편향은?','생존자 편향','실패하거나 사라진 사례를 제외하면 성공 사례의 특징을 과대평가할 수 있습니다.',['생존자편향']],
 ['university','“일부 의견은 사실이 아니다.”의 논리적 부정은? “모든 의견은 사실이다.” (맞다 / 틀리다)','맞다','적어도 하나의 반례가 존재한다는 명제의 부정은 반례가 하나도 없다는 전칭 명제입니다.'],
 ['university','“업무 성과가 좋은 직원은 모두 교육을 받았다.” 교육은 좋은 성과의 필요조건인가 충분조건인가?','필요조건','성과 좋음→교육 받음이므로 교육은 필요조건입니다. 교육이 좋은 성과를 보장하지는 않습니다.'],
 ['university','“모든 A는 B다. 어떤 C는 A다.”에서 어떤 C는 B라는 결론이 성립하는가? (성립 / 불성립)','성립','A에 속하는 C가 있고 A는 B에 포함되므로 해당 C는 B에도 속합니다.'],
 ['university','“지원자 누구도 면접과 필기시험을 모두 통과하지 못했다.”로 모든 지원자가 필기를 탈락했다고 결론낼 수 있는가? (가능 / 불가)','불가','둘 다 통과하지 못했다는 말은 적어도 하나를 통과하지 못했다는 뜻입니다. 필기만 통과한 지원자는 가능하다.'],
 ['university','“지점별 평균 고객 수를 단순히 평균냈다.” 각 지점의 조사 기간이 다르면 필요한 평균 방식은?','가중평균','조사 기간 등 표본의 크기가 다르면 그 크기를 가중치로 적용해야 합니다.'],
];
for(const [difficulty,question,answer,explanation,accepted] of verbal)add(difficulty,'culture',question,answer,explanation,'문장에 명시된 사실과 추측을 구분하세요.','모든·일부·반드시 같은 표현과 조건의 방향을 확인하세요.',accepted);
export const aptitudeQuestions:readonly QuizQuestion[]=bank;
