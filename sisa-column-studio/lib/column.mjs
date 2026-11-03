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
/**
 * API 키 없이 동작하는 기사 기반 600자 독립 시사칼럼 초안.
 * 보도문을 사실로 인증하지 않으며, 긴 원문 복제 및 외부 사실 추가를 피합니다.
 */
function shortSource(text, limit=54){
 const s=String(text||'').replace(/\s+/g,' ').replace(/[“”"「」]/g,'').trim();
 if(s.length<=limit)return s;
 let cut=s.slice(0,limit-1);const last=cut.lastIndexOf(' ');
 if(last>limit*.65)cut=cut.slice(0,last);
 return cut.replace(/[,:;\s]+$/,'')+'…';
}
function articleSignals(body){
 const all=sentencesOf(body);
 const relevant=all.filter(s=>!/(광고|이벤트|무단전재|공유하기|독자제보|구독 신청)/.test(s));
 const ranked=relevant.map((text,index)=>({text,index,score:
   (/(발표|검토|추진|계획|설명|지적|우려|반발|요구|반론|논의|확인|쟁점|대책|사업|변경|지원|예산|문제|정부|지역)/.test(text)?3:0)+
   (/[0-9]+|[가-힣]+(?:시|군|구|부|청|위원회|공사|협회|단체|시민)/.test(text)?2:0)+
   Math.min(2,Math.floor(text.length/65))
 }));
 ranked.sort((a,b)=>b.score-a.score||a.index-b.index);
 const chosen=[];
 for(const item of ranked){
   if(chosen.some(v=>v.text.slice(0,27)===item.text.slice(0,27)))continue;
   chosen.push(item);if(chosen.length===3)break;
 }
 if(!chosen.length) return [body.replace(/\s+/g,' ').slice(0,130)];
 return chosen.sort((a,b)=>a.index-b.index).map(x=>x.text);
}
const issueLenses={
 '전력·산업 정책':{
  lead:'전력과 산업 기반시설은 지역 간 우열의 문제가 아니라 일정·공급 안정성·비용 배분을 함께 따져야 할 공공의 과제다.',
  check:'사업별 준공 시기, 설비 물량, 예산, 변경 근거를 같은 기준으로 비교할 수 있어야 한다.',
  action:'담당 기관은 대안별 효과와 지연 위험을 공개하고 지역 주민·기업에 설명할 책임이 있다.'
 },
 '지역경제·균형발전':{
  lead:'지역경제를 둘러싼 논쟁은 정치적 구호보다 현장의 투자·고용·생활에 미치는 영향을 살펴야 한다.',
  check:'예산의 실제 집행, 지역별 부담, 정책의 수혜 대상을 같은 잣대로 공개해야 한다.',
  action:'관계기관은 일정과 평가 지표를 제시하고 이해관계자의 의견을 공식 절차에 반영해야 한다.'
 },
 '문화·예술':{
  lead:'문화예술의 성과는 행사 규모뿐 아니라 창작의 지속성, 시민의 접근성에서 확인돼야 한다.',
  check:'예산 집행과 참여 기회, 창작자에게 돌아가는 실질적 지원을 따져야 한다.',
  action:'정책 담당자는 현장 예술인의 요구를 듣고 일회성 실적보다 장기 운영 계획을 공개해야 한다.'
 },
 '교육·복지':{
  lead:'교육과 복지의 성과는 취지 좋은 발표보다 현장의 인력·예산·서비스 경험에서 확인된다.',
  check:'혜택을 받는 사람과 배제될 수 있는 사람, 제도를 실행할 인력의 부담까지 살펴야 한다.',
  action:'담당기관은 지속 가능한 재정 계획과 현장 평가 결과를 함께 제시해야 한다.'
 },
 '행정·정치':{
  lead:'행정의 신뢰는 큰 목소리가 아니라 권한에 맞는 결정과 설명 책임에서 나온다.',
  check:'누가 결정권을 가졌는지, 어떤 절차를 거쳤는지, 그 근거가 공개됐는지 확인해야 한다.',
  action:'관련 기관은 서로 책임을 떠넘기기보다 결정 경위와 후속 일정부터 설명해야 한다.'
 },
 '사회 현안':{
  lead:'사회적 논란이 커질수록 사실·주장·해석을 분리하는 태도가 중요하다.',
  check:'서로 다른 당사자의 근거와 반론을 대조하고 빠진 자료가 없는지 살펴야 한다.',
  action:'책임 있는 주체가 대안과 실천 시한을 공개해야 논쟁이 해결로 이어진다.'
 }
};
export function localColumn(article,title='') {
 const body=normalizeArticle(article);
 if(body.length<100)throw new Error('기사 본문이 부족합니다. 최소 100자 이상의 기사 내용을 입력해 주세요.');
 const theme=guessTheme(body), lens=issueLenses[theme]||issueLenses['사회 현안'];
 const sourceHeadline=String(title||'').replace(/^(기사제목|제목)\s*[:：]\s*/,'').trim();
 const signals=articleSignals(body);
 const a=shortSource(signals[0]||body,57),b=shortSource(signals[1]||signals[0]||body,53);
 const isDuplicated = a===b;
 const intro=`${theme} 관련 보도에서 눈여겨볼 대목은 주장 자체보다 그 주장을 뒷받침할 자료다. ${lens.lead}`;
 const evidence=`기사에는 ‘${a}’라는 내용이 제시된다. ${isDuplicated?'이를 검증할 원자료와 당사자의 설명이 뒷받침돼야 한다.':`또 ‘${b}’라는 대목도 등장한다.`} 이는 기사에 실린 서술이지 별도의 사실 확인 결과는 아니다.`;
 const discussion=`${lens.check} 찬성과 반대의 목소리만 나열해서는 판단에 필요한 정보가 빠진다. ${lens.action}`;
 const conclusion='언론은 의혹을 단정하기보다 확인된 사실과 검토 중인 사안을 구분해야 한다. 시민이 신뢰할 수 있는 것은 상대를 향한 비난이 아니라 공개된 근거와 책임 있는 후속 조치다.';
 const paras=[intro,evidence,discussion,conclusion];
 const extra=[
  '상반된 이해관계가 있다면 그 차이와 비용을 투명하게 설명하는 것이 공론장의 출발점이다.',
  '수치와 일정의 출처가 불분명한 주장에는 정정을 요구하고 이해당사자의 반론도 함께 확인해야 한다.',
  '문제를 제기하는 데서 멈추지 말고 누가 언제 어떤 자료를 공개할지까지 묻는 것이 시사평론의 몫이다.',
  '시민에게 필요한 것은 성급한 결론이 아니라 비교할 수 있는 선택지와 이행 여부를 점검할 기준이다.'
 ];
 let full=paras.join('\n\n');
 for(const sentence of extra){
   if(full.length>=568)break;
   if(full.length+sentence.length+1<=650){paras[2]+=' '+sentence;full=paras.join('\n\n');}
 }
 // 과도하게 긴 원문에도 문장 중간을 절단하지 않도록 짧은 인용으로 다시 구성.
 if(full.length>650){
  const shorter=`기사에는 ‘${shortSource(signals[0]||body,40)}’라는 내용이 담겨 있다. ${isDuplicated?'추가 확인이 필요하다.':`또 ‘${shortSource(signals[1]||body,36)}’라는 서술도 있다.`} 두 대목 모두 원문과 대조할 보도 내용이지 검증 완료된 사실은 아니다.`;
  paras[1]=shorter; full=paras.join('\n\n');
 }
 if(full.length>650){
  paras[0]=`${theme} 보도는 중요한 질문을 남긴다. ${lens.lead}`;
  full=paras.join('\n\n');
 }
 if(full.length<540){
  const add='특히 당사자의 설명과 공개 문서가 서로 맞는지 확인하고, 틀린 정보가 있다면 바로잡는 절차가 필요하다.';
  if(full.length+add.length+1<=650){paras[3]+=' '+add;full=paras.join('\n\n');}
 }
 const titleBase=sourceHeadline?shortSource(sourceHeadline,26):theme;
 const headline=`${titleBase} — 근거와 책임을 묻다`;
 return {headline,body:full,theme,mode:'keyless',notice:'API 키 없는 기사 기반 초안입니다. 기사 속 주장·서술을 바탕으로 작성했으며 사실 확인이나 심층 AI 분석을 대신하지 않습니다. 발행 전 출처와 반론을 확인하세요.'};
}

/** 기사에 나타난 주장을 단정하지 않는 중립적 보고서형 재구성. */
function clipReport(s, limit=115){
 const v=String(s||'').replace(/\s+/g,' ').trim().replace(/[.。\s]+$/,'');
 if(v.length<=limit)return v;
 const cut=v.slice(0,limit-1), last=cut.lastIndexOf(' ');
 return (last>limit*.7?cut.slice(0,last):cut)+'…';
}
export function buildArticleReport({article,title='',source=''}={}){
 const body=normalizeArticle(article);
 if(body.length<100)throw new Error('기사 내용은 최소 100자 이상 입력해 주세요.');
 const theme=guessTheme(body), points=extractArticlePoints(body,3);
 const [a,b,c]=points;
 const lens=issueLenses[theme]||issueLenses['사회 현안'];
 // 사실을 새로 만들어 내지 않고, 기사에서 확인 가능한 짧은 대목을 근거로
 // 독자가 읽기 쉬운 설명형 보고서 문장으로 재구성한다.
 const evidence=s=>`기사의 근거 대목은 “${clipReport(s,58)}”이다.`;
 const issue=b
   ? `기사에서는 서로 다른 설명과 파급효과를 살펴볼 필요가 있다. ${evidence(b)} 이 내용은 보도된 주장 또는 설명으로, 독립적으로 검증된 사실이라는 뜻은 아니다.`
   : `보도에서 제시한 설명과 관계자들의 입장을 구분할 필요가 있다. 일정·자료·발표 주체 등 확인 가능한 내용을 먼저 대조해야 한다.`;
 const follow=c ? `후속 확인의 단서는 “${clipReport(c,48)}”라는 기사 대목에도 담겨 있다. ` : '';
 return {
   headline: String(title||'').trim() || `${theme} 관련 기사 정리`,
   source: String(source||'').trim() || '사용자 제공 기사',
   theme,
   introduction: `이 자료는 제공된 ${theme} 기사를 보고서 형식으로 재구성한 것이다. 기사에 나타난 내용과 추가 확인이 필요한 사항을 구분해 정리했다.`,
   sections:[
     {heading:'01 · 보도 요지',text:`이 보도는 ${theme}과 관련된 주요 상황과 쟁점을 다룬다. ${evidence(a||body)} 기사 내용 자체는 사실 확인을 거친 자료가 아니므로 인용의 출처를 밝혀야 한다.`},
     {heading:'02 · 주요 쟁점',text:issue},
     {heading:'03 · 추가 확인사항',text:`${follow}${lens.check} 기사에 나온 수치와 결정 권한, 당사자의 반론, 후속 발표를 원자료와 대조할 필요가 있다.`}
   ],
   disclaimer:'원문 기사의 내용을 짧게 인용하면서 설명 문장을 새로 작성한 편집 초안이다. 독립적인 사실 확인 결과는 아니다.'
 };
}

/** 기사 본문은 서버로 전달되지만 외부 생성 AI 서비스는 호출하지 않습니다. */
export async function generateColumn({article,title='',source='',sourceUrl=''}={}){
 const input=normalizeArticle(article);
 const draft=localColumn(input,title);
 return {...draft,summary:extractArticlePoints(input),report:buildArticleReport({article:input,title,source})};
}
