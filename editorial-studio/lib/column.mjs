/** 명도재 AI 논설: source-grounded Korean editorial fallback, no invented sources. */
export function normalizeArticle(raw='') {
 return String(raw).replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/[\t ]+/g,' ').replace(/\n{3,}/g,'\n\n').trim().slice(0,16000);
}
export function sentencesOf(text=''){
 return normalizeArticle(text).replace(/\n+/g,' ').split(/(?<=[.!?。])\s+|(?<=다\.)\s*/u)
  .map(s=>s.trim()).filter(s=>s.length>18&&s.length<550);
}
/** 기사의 문장을 그대로 발췌하여 핵심 주장을 3개 골라냅니다. (검증된 사실을 뜻하지 않습니다.) */
export function extractArticlePoints(article, maxPoints=3){
 const raw=normalizeArticle(article);
 const sentences=sentencesOf(raw).filter(s=>!/(무단전재|재배포 금지|회원가입|광고문의|저작권자|기사제보)/.test(s));
 const result=[]; const seen=new Set();
 for(const s of sentences){
  const candidate=s.trim();
  const key=candidate.slice(0,34).replace(/\s/g,'');
  if(!key||seen.has(key))continue;
  seen.add(key);
  result.push(candidate.slice(0,185)+(candidate.length>185?'…':''));
  if(result.length>=maxPoints)break;
 }
 if(!result.length&&raw)result.push(raw.slice(0,160)+(raw.length>160?'…':''));
 return result;
}
export function guessTheme(text=''){
 const source=String(text||'');
 const weighted=[
  ['전력·산업 정책',/전력망|변전소|변압기|송전|한전|한국전력|반도체|산업단지|전력 공급/g,2.5],
  ['문화·예술',/문화재단|문화정책|예술|미술|전시|작가|관람객|공연|축제|박물관|갤러리|창작/g,2],
  ['교육·복지',/교육|학생|학교|교사|돌봄|복지|의료|보건|노인|요양|환자/g,2],
  ['행정·정치',/시청|시의회|행정|지방정부|국회|감사|정부|장관|시장|위원회|정치|의사결정|담당 부서/g,2],
  ['지역경제·균형발전',/대구|경북|호남|수도권|지역|지방|투자|예산|경제|일자리|기업|고용|상공계/g,1]
 ];
 const scores=weighted.map(([label,re,w])=>({label,score:(source.match(re)||[]).length*w}));
 scores.sort((a,b)=>b.score-a.score);
 return scores[0]?.score>0?scores[0].label:'사회 현안';
}
const commentaries={
 '전력·산업 정책':[
 '산업의 경쟁력을 논하려면 먼저 설비가 어디에, 언제, 어떤 기준으로 공급되는지 확인해야 한다.',
 '한 지역의 사업을 앞당기는 결정이 다른 지역에 어떤 영향을 주는지 비교할 수 있는 자료가 필요하다.',
 '기술적 제약과 행정 책임을 분리해 평가해야 현장의 불필요한 갈등을 줄일 수 있다.'
 ],
 '지역경제·균형발전':[
 '지방의 미래는 구호보다 실제 예산 집행과 현장의 성과로 판가름 난다.',
 '지역 간 이해가 맞부딪힐수록 우선순위와 형평성의 판단 기준을 명확하게 밝혀야 한다.',
 '정치적 수사보다 기업과 시민이 체감할 실행 계획이 논쟁의 중심에 놓여야 한다.'
 ],
 '문화·예술':[
 '문화정책은 화려한 행사 수보다 창작자의 지속 가능한 활동 여건에서 평가해야 한다.',
 '접근성, 창작 기반, 예산의 지속 가능성이 뒷받침되지 않는 성과는 오래가기 어렵다.',
 '현장의 작은 목소리가 정책에 어떻게 반영됐는지 따져보는 일이 필요하다.'
 ],
 '교육·복지':[
 '제도의 취지만큼이나 중요한 것은 현장에서 이를 실행할 인력과 재원이다.',
 '정책의 수혜자가 실제로 무엇을 경험하는지 측정하고 설명해야 한다.',
 '단기적 성과만 강조하면 지속 가능한 개선의 기회를 놓치기 쉽다.'
 ],
 '행정·정치':[
 '책임 있는 행정은 강한 발언이 아니라 권한에 맞는 결정과 근거 있는 설명으로 평가받는다.',
 '기관 간 권한을 구분해 누가 결정하고 누가 실행하는지 시민에게 밝혀야 한다.',
 '갈등을 확대하기보다 당사자들이 확인할 수 있는 일정과 후속 조치를 제시해야 한다.'
 ],
 '사회 현안':[
 '기사의 문제 제기가 설득력을 얻으려면 확인된 사실과 아직 입증되지 않은 해석을 나누어야 한다.',
 '서로 다른 주장이 충돌할수록 원자료와 관계자의 설명을 나란히 놓는 검증이 필요하다.',
 '문제의 크기뿐 아니라 해결 주체와 실행 기한까지 드러날 때 논의는 앞으로 나아간다.'
 ]
};
const leadA='어떤 보도가 시민의 관심을 끄는 까닭은 논란의 크기만이 아니라 그 결정이 우리의 일상과 미래에 미칠 영향 때문이다.';
const leadB='이 사안을 볼 때 가장 중요한 질문은 누가 옳다고 목소리를 높였는가가 아니라 어떤 근거로 결정했는가이다.';
const closeA='이번 논란의 해답은 자극적인 말보다 검증 가능한 자료에서 찾아야 한다. 언론도 사실과 해석의 경계를 지키며 질문해야 한다.';
const closeB='행정과 정책은 시민의 눈높이에서 설명될 때 신뢰를 얻는다. 남은 과제는 책임 있는 주체가 답하고, 언론이 끝까지 확인하는 일이다.';

/** API 키 없이 기사에 근거하여 600자 독립 시사칼럼 초안을 작성합니다. */
function shortSource(text,limit=54){
 const s=String(text||'').replace(/\s+/g,' ').replace(/[“”"「」]/g,'').trim();
 if(s.length<=limit)return s;
 let cut=s.slice(0,limit-1);const i=cut.lastIndexOf(' ');
 if(i>limit*.65)cut=cut.slice(0,i);
 return cut.replace(/[,:;\s]+$/,'')+'…';
}
function articleSignals(body){
 const items=sentencesOf(body).filter(s=>!/(무단전재|광고|이벤트|구독|공유하기)/.test(s));
 const ranked=items.map((text,index)=>({text,index,score:
   (/(발표|검토|추진|계획|설명|지적|우려|반발|요구|반론|논의|확인|사업|변경|지원|예산|문제|정부|지역)/.test(text)?3:0)+
   (/[0-9]+|[가-힣]+(?:시|군|구|부|청|위원회|공사|협회|단체|시민)/.test(text)?2:0)+
   Math.min(2,Math.floor(text.length/65))}));
 ranked.sort((a,b)=>b.score-a.score||a.index-b.index);
 const selected=[];
 for(const item of ranked){if(selected.some(x=>x.text.slice(0,27)===item.text.slice(0,27)))continue;selected.push(item);if(selected.length===3)break;}
 return selected.length?selected.sort((a,b)=>a.index-b.index).map(x=>x.text):[body.replace(/\s+/g,' ').slice(0,130)];
}
const lenses={
 '전력·산업 정책':[
 '전력과 산업 기반시설은 일정·공급 안정성·비용 배분을 함께 따져야 할 공공의 과제다.',
 '사업별 준공 시기, 설비 물량, 예산, 변경 근거를 같은 기준으로 비교할 수 있어야 한다.',
 '담당 기관은 대안별 효과와 지연 위험을 공개하고 지역 주민과 기업에 설명할 책임이 있다.'
 ],
 '지역경제·균형발전':[
 '지역경제의 실효성은 정치적 구호보다 현장의 투자·고용·생활에 미치는 영향을 통해 평가해야 한다.',
 '예산 집행과 지역별 부담, 정책의 수혜 대상을 같은 잣대로 공개해야 한다.',
 '관계기관은 일정과 평가 지표를 제시하고 이해관계자의 의견을 공식 절차에 반영해야 한다.'
 ],
 '문화·예술':[
 '문화예술의 성과는 행사 규모뿐 아니라 창작의 지속성, 시민의 접근성에서 확인돼야 한다.',
 '예산 집행과 참여 기회, 창작자에게 돌아가는 실질적 지원을 따져야 한다.',
 '정책 담당자는 현장 예술인의 요구와 장기 운영 계획을 공개해야 한다.'
 ],
 '교육·복지':[
 '교육·복지의 성과는 발표보다 현장의 인력과 예산, 서비스를 받는 사람의 경험으로 판단해야 한다.',
 '혜택을 누리는 사람과 배제될 수 있는 사람, 담당 인력의 부담을 함께 살펴야 한다.',
 '담당기관은 지속 가능한 재정 계획과 현장 평가 결과를 함께 제시해야 한다.'
 ],
 '행정·정치':[
 '행정의 신뢰는 강한 발언이 아니라 권한에 맞는 결정과 설명 책임에서 나온다.',
 '누가 결정권을 가졌는지, 어떤 절차를 거쳤는지, 판단의 근거가 공개됐는지 확인해야 한다.',
 '관계기관은 책임을 떠넘기기보다 결정 경위와 후속 일정부터 설명해야 한다.'
 ],
 '사회 현안':[
 '사회적 논란이 커질수록 사실과 주장, 해석을 분리하는 태도가 중요하다.',
 '서로 다른 당사자의 근거와 반론을 대조하고 빠진 자료가 없는지 살펴야 한다.',
 '책임 있는 주체가 대안과 실천 시한을 공개해야 논쟁이 해결로 이어진다.'
 ]
};
export function localColumn(article,title=''){
 const body=normalizeArticle(article);
 if(body.length<100)throw new Error('기사 본문이 부족합니다. 최소 100자 이상의 내용을 입력해 주세요.');
 const theme=guessTheme(body), [lead,check,action]=lenses[theme]||lenses['사회 현안'];
 const signals=articleSignals(body),a=shortSource(signals[0]||body,57),b=shortSource(signals[1]||signals[0]||body,53);
 const same=a===b;
 const paras=[
  theme+' 관련 보도에서 중요한 것은 주장만이 아니라 그 근거가 무엇인지 살피는 일이다. '+lead,
  '기사에는 ‘'+a+'’라는 내용이 제시된다. '+(same?'이를 검증할 원자료와 당사자의 설명이 뒤따라야 한다.':'또 ‘'+b+'’라는 대목도 등장한다.')+' 이는 보도에 실린 서술이지 별도의 사실 확인 결과는 아니다.',
  check+' 찬성과 반대의 목소리만 나열해서는 판단에 필요한 정보가 빠진다. '+action,
  '언론은 의혹을 단정하기보다 확인된 사실과 검토 중인 사안을 구분해야 한다. 시민이 신뢰할 수 있는 것은 비난이 아니라 공개된 근거와 책임 있는 후속 조치다.'
 ];
 const extras=[
 '상반된 이해관계가 있다면 그 차이와 비용을 투명하게 설명하는 것이 공론장의 출발점이다.',
 '수치와 일정의 출처가 불분명한 주장에는 정정을 요구하고 이해당사자의 반론도 확인해야 한다.',
 '누가 언제 어떤 자료를 공개할지까지 묻는 것이 시사평론의 몫이다.',
 '시민에게 필요한 것은 성급한 결론이 아니라 비교할 수 있는 선택지와 점검할 기준이다.'
 ];
 let result=paras.join('\n\n');
 for(const sentence of extras){if(result.length>=566)break;if(result.length+sentence.length+1<=650){paras[2]+=' '+sentence;result=paras.join('\n\n');}}
 if(result.length>650){
  paras[1]='기사에는 ‘'+shortSource(signals[0]||body,40)+'’라는 내용이 담겼다. '+(same?'추가 확인이 필요하다.':'또 ‘'+shortSource(signals[1]||body,36)+'’라는 서술도 있다.')+' 이는 기사에 적힌 내용이지 검증 완료된 사실은 아니다.';
  result=paras.join('\n\n');
 }
 if(result.length>650){paras[0]=theme+' 보도는 중요한 질문을 남긴다. '+lead;result=paras.join('\n\n');}
 if(result.length<540){
  const extra='당사자의 설명과 공개 문서가 맞는지 확인하고, 잘못된 정보가 있다면 바로잡는 절차도 필요하다.';
  if(result.length+extra.length+1<=650){paras[3]+=' '+extra;result=paras.join('\n\n');}
 }
 const headline=(title?.trim()?shortSource(title.trim(),28):theme)+' — 근거와 책임을 묻다';
 return {headline,body:result,theme,mode:'keyless',notice:'API 키 없이 작성한 규칙 기반 초안입니다. 입력 기사에 실린 주장과 사실을 원문·반론으로 확인하고 발행 전 편집하세요.'};
}
export async function generateColumn({article,title=''}={}){
 const text=normalizeArticle(article);
 return {...localColumn(text,title),summary:extractArticlePoints(text)};
}
