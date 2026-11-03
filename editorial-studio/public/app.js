/* 명도재 시사컬럼 — 기사 입력 하나로 작성하는 2단 뉴스룸 편집판 */
import {parseArticleInput} from './article-input.js';
import {ColumnReader} from './reader.js';

const $=id=>document.getElementById(id);
const e={
  url:$('articleUrl'),bundle:$('articleBundle'),generate:$('generateBtn'),sample:$('sampleBtn'),clear:$('clearBtn'),
  reportHeading:$('reportHeading'),reportSource:$('reportSource'),reportIntro:$('reportIntro'),reportSections:$('reportSections'),reportDisclaimer:$('reportDisclaimer'),
  columnHeading:$('columnHeading'),columnBody:$('columnBody'),charCount:$('charCount'),
  read:$('readBtn'),pause:$('pauseBtn'),resume:$('resumeBtn'),stop:$('stopBtn'),rate:$('rate'),rateValue:$('rateValue'),
  audioState:$('audioState'),audioDot:$('audioDot'),progress:$('readingProgress'),readStatus:$('readStatus'),readCounter:$('readCounter'),
  copy:$('copyBtn'),print:$('printBtn'),today:$('todayLabel'),status:$('status')
};
const state={report:null,columnTitle:'',columnBody:'',sourceUrl:'',sourceTitle:'',sourceName:'',article:'',parts:[],currentPart:-1,busy:false};
const setStatus=msg=>e.status.textContent=msg;
function countChars(s){return Array.from(s||'').length;}
function text(el,value){el.textContent=String(value||'');}
function dateLabel(){return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'}).format(new Date());}
function setBusy(value){state.busy=value;e.generate.disabled=value;e.sample.disabled=value;e.clear.disabled=value;e.generate.innerHTML=value?'<span class="icon">◌</span><span>기사 정리·칼럼 작성 중…</span>':'<span class="icon">✦</span><span>기사 요약 보고서 · 600자 칼럼 작성</span>';}
function errorText(x){return x?.message||String(x);}
async function postAPI(path,payload){
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),25000);
 try{
  const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl.signal});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||`서버 요청 실패 (${res.status})`);
  return data;
 }catch(err){if(err?.name==='AbortError')throw new Error('서버 응답 시간이 초과됐습니다. 다시 시도해 주세요.');throw err;}
 finally{clearTimeout(timeout);}
}
function setReport(report){
 state.report=report;
 text(e.reportHeading,report?.headline||'기사 요약 보고서');
 text(e.reportSource,`출처: ${report?.source||'사용자 제공 기사'}${state.sourceUrl?' · 기사 URL 참조':''}`);
 text(e.reportIntro,report?.introduction||'기사 내용을 입력하면 핵심 내용을 정리합니다.');
 e.reportSections.replaceChildren();
 const sections=Array.isArray(report?.sections)?report.sections:[];
 for(const [idx,item] of sections.entries()){
  const wrap=document.createElement('div');wrap.className='report-item';
  const num=document.createElement('span');num.className='item-number';num.textContent=String(idx+1).padStart(2,'0');
  const content=document.createElement('div'),h=document.createElement('h4'),p=document.createElement('p');
  h.textContent=String(item.heading||`항목 ${idx+1}`).replace(/^\d+\s*[·.-]\s*/,'');p.textContent=String(item.text||'');
  content.append(h,p);wrap.append(num,content);e.reportSections.append(wrap);
 }
 if(!sections.length){const placeholder=document.createElement('p');placeholder.textContent='기사 요약 보고서를 준비합니다.';e.reportSections.append(placeholder);}
 text(e.reportDisclaimer,`※ ${report?.disclaimer||'기사 기반 재구성 초안이며, 별도의 사실 검증 결과는 아닙니다.'}`);
}
function makeParagraphs(body){return String(body||'').replace(/\r\n?/g,'\n').split(/\n\s*\n|\n/g).map(s=>s.trim()).filter(Boolean);}
function renderColumn(body){
 state.columnBody=String(body||'');state.parts=makeParagraphs(state.columnBody);state.currentPart=-1;
 e.columnBody.replaceChildren();
 for(const [idx,para] of state.parts.entries()){
   const p=document.createElement('p');p.dataset.part=String(idx);p.textContent=para;e.columnBody.append(p);
 }
 if(!state.parts.length){e.columnBody.textContent='칼럼을 작성하면 이곳에 표시됩니다. 문장을 클릭하여 직접 수정할 수도 있습니다.';}
 text(e.charCount,`${countChars(state.columnBody)}자`);
 text(e.readCounter,`0 / ${state.parts.length} 문단`);
 e.progress.style.width='0%';
}
function getEditedColumn(){
 // paragraph DOM content is the source of truth when editable.
 return Array.from(e.columnBody.querySelectorAll('p')).map(p=>p.textContent.trim()).filter(Boolean).join('\n\n') || e.columnBody.innerText.trim();
}
function highlightPart(idx){
 e.columnBody.querySelectorAll('[data-part]').forEach(p=>p.classList.toggle('reading',Number(p.dataset.part)===idx));
 state.currentPart=idx;
 if(idx>=0){
  const node=e.columnBody.querySelector(`[data-part="${idx}"]`);
  node?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 }
 const num=idx<0?0:idx+1;
 text(e.readCounter,`${num} / ${state.parts.length} 문단`);
 e.progress.style.width=`${state.parts.length?Math.round(num/state.parts.length*100):0}%`;
}
function updateAudio(stateName){
 const active=stateName==='playing',paused=stateName==='paused';
 e.read.disabled=active||paused;
 e.pause.disabled=!active;e.resume.disabled=!paused;e.stop.disabled=!active&&!paused;
 e.audioDot.classList.toggle('on',active);
 text(e.audioState,active?'ON AIR · 칼럼 낭독':paused?'PAUSED · 일시정지':'STANDBY · 한국어 음성');
 text(e.readStatus,active?'칼럼을 읽고 있습니다.':paused?'낭독 일시정지':'낭독 대기');
}
const reader=new ColumnReader({
  synth:typeof window.speechSynthesis!=='undefined'?window.speechSynthesis:null,
  Utterance:window.SpeechSynthesisUtterance,
  onState:status=>updateAudio(status),
  onProgress:index=>highlightPart(index),
  onComplete:()=>{highlightPart(-1);text(e.readStatus,'칼럼 읽기 완료');setStatus('칼럼 읽기가 끝났습니다.');},
  onError:message=>{highlightPart(-1);updateAudio('idle');setStatus(`칼럼 낭독 오류: ${message}`);}
});
function stopAudio(announce=true){reader.stop(true);highlightPart(-1);if(announce)setStatus('칼럼 읽기를 정지했습니다.');}
function startReading(){
 if(!state.columnBody.trim() || !state.parts.length)return setStatus('칼럼 작성 버튼을 먼저 누르거나 칼럼 본문을 입력하세요.');
 try{
  const result=reader.start({title:state.columnTitle,parts:state.parts,rate:Number(e.rate.value)});
  text(e.readCounter,`0 / ${state.parts.length} 문단`);
  setStatus(result.hasKoreanVoice?'작성된 칼럼만 한국어 음성으로 읽습니다. 현재 낭독 문단은 붉은색으로 강조됩니다.':'기기에서 한국어 목소리를 찾지 못했습니다. 기본 음성으로 재생을 시도합니다.');
 }catch(err){setStatus(`음성 시작 오류: ${errorText(err)}`);}
}
async function resolveArticle(){
 const typed=parseArticleInput(e.bundle.value), url=e.url.value.trim()||typed.url;
 if(typed.body.length>=100){
  if(url)setStatus('본문과 URL이 모두 입력되어 본문을 우선 사용합니다.');
  return {article:typed.body,title:typed.title,source:typed.source,url};
 }
 if(url){
  setStatus('기사 링크를 불러오는 중입니다. 일부 언론사는 자동 읽기를 차단할 수 있습니다.');
  const response=await postAPI('/api/import',{url});
  const article=response.article||{};
  if(String(article.body||'').trim().length<100)throw new Error('기사 링크에서 본문을 충분히 가져오지 못했습니다. 기사 내용을 직접 붙여넣어 주세요.');
  return {article:String(article.body||''),title:typed.title||String(article.title||''),source:typed.source||String(article.site||''),url:String(article.url||url)};
 }
 if(typed.body.length>0)throw new Error('기사 본문은 최소 100자 이상 입력해 주세요.');
 throw new Error('기사 주소 또는 기사 내용 중 하나를 입력해 주세요.');
}
function fallbackReport(article,title,source,summary){
 const points=(Array.isArray(summary)?summary:[]).slice(0,3);
 return {headline:title||'기사 요약 보고서',source:source||'사용자 제공 기사',introduction:'입력된 기사에서 주요 내용을 구분해 정리했습니다. 아래 내용은 원문을 근거로 한 보고서 초안입니다.',sections:[
  {heading:'01 · 보도 요지',text:points[0]||article.slice(0,140)},
  {heading:'02 · 주요 쟁점',text:points[1]||'입장과 쟁점을 원문에서 다시 확인해 주세요.'},
  {heading:'03 · 추가 확인사항',text:points[2]||'공식 자료와 당사자 설명을 비교해 검증할 필요가 있습니다.'}
 ],disclaimer:'원문 기사 서술을 바탕으로 정리했으며 사실을 별도로 검증하지 않았습니다.'};
}
async function generate(){
 if(state.busy)return;
 stopAudio(false);setBusy(true);setStatus('기사 자료를 확인하고 요약 보고서와 약 600자 시사칼럼을 작성합니다.');
 try{
  const a=await resolveArticle();
  const response=await postAPI('/api/column',{article:a.article,title:a.title,source:a.source,sourceUrl:a.url});
  const col=response.column;
  if(!col||!col.body)throw new Error('칼럼 작성 결과가 비어 있습니다.');
  state.sourceTitle=a.title;state.sourceName=a.source;state.article=a.article;state.sourceUrl=a.url;
  setReport(col.report||fallbackReport(a.article,a.title,a.source,col.summary));
  state.columnTitle=String(col.headline||'명도재 시사칼럼');text(e.columnHeading,state.columnTitle);
  renderColumn(String(col.body||''));
  setStatus(`기사 보고서 및 시사칼럼 ${countChars(state.columnBody)}자 작성 완료. 칼럼은 오른쪽 하단에서 편집하고 읽어줄 수 있습니다. ${col.notice||''}`);
 }catch(err){setStatus(`기사 정리 실패: ${errorText(err)}${e.url.value.trim()?' 주소 접근이 차단된 경우 기사 본문을 붙여넣어 주세요.':''}`);}
 finally{setBusy(false);}
}
const DEMO=`제목: 전력망 시설 조정 검토에 지역 기업들 우려\n출처: 명도재 기능 시험용 가상 기사 · 실제 보도 아님\n내용:\n한 지방도시에서 산업단지에 필요한 전력망 시설의 건설 순서를 조정하는 방안을 검토한다는 가상 보도가 나왔다. 보도는 관련 기업의 투자 일정이 변경될 가능성을 제기했고, 주민들은 지역 시설의 준공 시기가 밀릴지 우려하고 있다.\n담당 기관은 아직 최종 결정이 내려지지 않았으며 여러 대안의 비용과 시급성을 검토 중이라는 입장을 밝혔다. 지역 상공계는 구체적인 일정 공개를 요구하는 한편, 다른 지역과의 비교보다 산업 전체의 공급 안정성을 고려해야 한다는 의견도 내놓았다.\n기사에서는 시설별 용량과 예산, 공사 진척률 등 검증 가능한 세부 자료가 충분히 공개되지 않았다고 지적한다. 향후 논의에서 각 사업의 지연 가능성과 투자 영향이 공개될지가 관건이다.`;
e.generate.addEventListener('click',generate);
e.sample.addEventListener('click',()=>{stopAudio(false);e.url.value='';e.bundle.value=DEMO;setReport(null);state.columnTitle='';renderColumn('');text(e.columnHeading,'시사칼럼');setStatus('가상 기사 예시를 넣었습니다. 작성 버튼을 누르세요.');});
e.clear.addEventListener('click',()=>{stopAudio(false);e.url.value='';e.bundle.value='';state.columnTitle='';state.article='';state.sourceUrl='';setReport(null);renderColumn('');text(e.columnHeading,'시사칼럼');setStatus('입력과 작성 결과를 초기화했습니다.');});
e.read.addEventListener('click',startReading);e.pause.addEventListener('click',()=>reader.pause());e.resume.addEventListener('click',()=>reader.resume());e.stop.addEventListener('click',()=>stopAudio());
e.rate.addEventListener('input',()=>text(e.rateValue,`${Number(e.rate.value).toFixed(2)}×`));
e.columnBody.addEventListener('input',()=>{
  if(reader.status!=='idle')stopAudio(false);
  state.columnBody=getEditedColumn();state.parts=makeParagraphs(state.columnBody);
  text(e.charCount,`${countChars(state.columnBody)}자`);
  text(e.readCounter,`0 / ${state.parts.length} 문단`);
  e.progress.style.width='0%';
});
e.copy.addEventListener('click',async()=>{
  const body=state.columnBody.trim();if(!body)return setStatus('복사할 칼럼이 없습니다.');
  const content=[state.columnTitle,body,`출처: ${state.sourceName||'사용자 제공 기사'}`,state.sourceUrl?'원문 링크: '+state.sourceUrl:''].filter(Boolean).join('\n\n');
  try{await navigator.clipboard.writeText(content);setStatus('칼럼과 기사 출처를 클립보드에 복사했습니다.');}
  catch{setStatus('자동 복사가 차단되었습니다. 칼럼 본문을 직접 선택해 복사해 주세요.');}
});
e.print.addEventListener('click',()=>window.print());
e.today.textContent=dateLabel();setReport(null);renderColumn('');updateAudio('idle');
window.addEventListener('pagehide',()=>reader.stop(false));
