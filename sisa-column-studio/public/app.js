/* 명도재 시사컬럼 — 기사·만평·600자 독립 논설의 신문 특집호 편집판 */
import {parseArticleInput} from './article-input.js';
import {ColumnReader} from './reader.js';
import {renderEditorialCartoon} from './cartoon.js';

const $=id=>document.getElementById(id);
const e={
  url:$('articleUrl'),bundle:$('articleBundle'),generate:$('generateBtn'),sample:$('sampleBtn'),clear:$('clearBtn'),
  articleHeading:$('articleHeading'),articleSource:$('articleSource'),articleBody:$('articleBody'),articleSummary:$('articleSummary'),
  cartoon:$('cartoonCanvas'),cartoonStyle:$('cartoonStyle'),cartoonBtn:$('cartoonBtn'),cartoonSave:$('cartoonSaveBtn'),pageSave:$('pageSaveBtn'),cartoonLabel:$('cartoonLabel'),cartoonHeading:$('cartoonHeading'),
  onAir:$('onAir'),signalText:$('signalText'),audioConsoleDot:$('audioConsoleDot'),consoleAudioState:$('consoleAudioState'),
  columnHeading:$('columnHeading'),columnBody:$('columnBody'),charCount:$('charCount'),
  read:$('readBtn'),pause:$('pauseBtn'),resume:$('resumeBtn'),stop:$('stopBtn'),rate:$('rate'),rateValue:$('rateValue'),
  audioState:$('audioState'),audioDot:$('audioDot'),progress:$('readingProgress'),readStatus:$('readStatus'),readCounter:$('readCounter'),
  copy:$('copyBtn'),print:$('printBtn'),today:$('todayLabel'),status:$('status')
};
const state={report:null,columnTitle:'',columnBody:'',sourceUrl:'',sourceTitle:'',sourceName:'',article:'',parts:[],currentPart:-1,busy:false,cartoonReady:false};
const setStatus=msg=>e.status.textContent=msg;
function countChars(s){return Array.from(s||'').length;}
function text(el,value){el.textContent=String(value||'');}
function dateLabel(){return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'}).format(new Date());}
function setBusy(value){state.busy=value;e.generate.disabled=value;e.sample.disabled=value;e.clear.disabled=value;e.generate.innerHTML=value?'<span>◌</span><span>기사 검토·칼럼 작성 중…</span>':'<span>✦</span><span>기사 정리 · 600자 칼럼 작성</span>';}
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
function setArticlePreview({title='',source='',article='',url='',report=null}={}){
 state.report=report;
 const t=String(title||'제목 미상'),s=String(source||'사용자 제공 기사');
 text(e.articleHeading,t);
 text(e.articleSource,`출처: ${s}${url?' · URL 입력 기사':''}`);
 text(e.articleBody,article||'기사를 입력하면 여기에 기사 본문이 나타납니다.');
 const sections=Array.isArray(report?.sections)?report.sections:[];
 const segments=sections.map(x=>`${String(x.heading||'').replace(/^\d+\s*[·.-]\s*/,'')}: ${x.text||''}`);
 text(e.articleSummary,segments.length?segments.join('\n'): '기사를 입력하면 핵심 요지와 확인할 쟁점을 정리합니다.');
}
function showCartoonPlaceholder(){
 const canvas=e.cartoon,ctx=canvas.getContext('2d');
 ctx.fillStyle='#f8f7f2';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle='#2c3135';ctx.lineWidth=6;ctx.strokeRect(26,25,canvas.width-52,canvas.height-50);
 ctx.fillStyle='#303639';ctx.fillRect(48,50,canvas.width-96,73);
 ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 31px Malgun Gothic,sans-serif';ctx.fillText('명도재 시사만평 · EDITORIAL CARTOON',canvas.width/2,99);
 ctx.fillStyle='#63696c';ctx.font='bold 32px Malgun Gothic,sans-serif';ctx.fillText('기사를 입력하면 시사만평이 완성됩니다',canvas.width/2,canvas.height/2);
 ctx.font='19px Malgun Gothic,sans-serif';ctx.fillText('왼쪽 기사 작성 버튼 또는 만평 그리기 버튼을 눌러 주세요',canvas.width/2,canvas.height/2+48);
 state.cartoonReady=false;
 text(e.cartoonLabel,'만평 제작 대기');
}
function paintCartoon(){
 if(state.article.trim().length<80)throw new Error('먼저 기사 본문을 입력하거나 작성 버튼으로 기사 주소를 불러와 주세요.');
 const result=renderEditorialCartoon(e.cartoon,{article:state.article,title:state.sourceTitle,style:e.cartoonStyle.value});
 text(e.cartoonHeading,`${result.topic} · 시사만평`);
 text(e.cartoonLabel,result.style);
 state.cartoonReady=true;
 return result;
}
function saveBlob(blob,name){if(!blob)return setStatus('이미지 저장을 지원하지 않는 브라우저입니다.');const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);}
function saveCanvas(canvas,name){canvas.toBlob(blob=>saveBlob(blob,name),'image/png');}
function filename(s){return String(s||'명도재_시사컬럼').replace(/[\\/:*?"<>|]/g,'_').slice(0,45);}
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
 e.onAir.classList.toggle('reading',active);e.onAir.classList.toggle('paused',paused);
 text(e.signalText,active?'ON AIR · VOICE':paused?'PAUSED':'EDITORIAL READY');
 e.audioConsoleDot.classList.toggle('on',active);
 text(e.consoleAudioState,active?'VOICE OUTPUT · ACTIVE':paused?'PAUSED':'STANDBY · VOICE');
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
  setStatus(result.hasKoreanVoice?'작성된 칼럼만 한국어 음성으로 읽습니다. 현재 낭독 문단은 회색으로 강조됩니다.':'기기에서 한국어 목소리를 찾지 못했습니다. 기본 음성으로 재생을 시도합니다.');
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
 stopAudio(false);setBusy(true);setStatus('기사 원문을 확인하고 약 600자 시사칼럼과 기사 만평을 제작합니다.');
 try{
  const a=await resolveArticle();
  const response=await postAPI('/api/column',{article:a.article,title:a.title,source:a.source,sourceUrl:a.url});
  const col=response.column;
  if(!col||!col.body)throw new Error('칼럼 작성 결과가 비어 있습니다.');
  state.sourceTitle=a.title;state.sourceName=a.source;state.article=a.article;state.sourceUrl=a.url;
  setArticlePreview({title:a.title||col.report?.headline||'기사 원문',source:a.source,article:a.article,url:a.url,report:col.report||fallbackReport(a.article,a.title,a.source,col.summary)});
  state.columnTitle=String(col.headline||'명도재 시사칼럼');text(e.columnHeading,state.columnTitle);
  renderColumn(String(col.body||''));
  try{paintCartoon();}catch(cartoonErr){setStatus(`칼럼은 작성됐지만 만평을 그리는 중 문제가 발생했습니다: ${errorText(cartoonErr)}`);}
  setStatus(`신문 특집호 제작 완료 · 약 ${countChars(state.columnBody)}자 칼럼, 기사 원문, 기사 만평. 오른쪽 하단에서 칼럼을 수정·낭독할 수 있습니다. ${col.notice||''}`);
 }catch(err){setStatus(`기사 정리 실패: ${errorText(err)}${e.url.value.trim()?' 주소 접근이 차단된 경우 기사 본문을 붙여넣어 주세요.':''}`);}
 finally{setBusy(false);}
}
const DEMO=`제목: 전력망 시설 조정 검토에 지역 기업들 우려\n출처: 명도재 기능 시험용 가상 기사 · 실제 보도 아님\n내용:\n한 지방도시에서 산업단지에 필요한 전력망 시설의 건설 순서를 조정하는 방안을 검토한다는 가상 보도가 나왔다. 보도는 관련 기업의 투자 일정이 변경될 가능성을 제기했고, 주민들은 지역 시설의 준공 시기가 밀릴지 우려하고 있다.\n담당 기관은 아직 최종 결정이 내려지지 않았으며 여러 대안의 비용과 시급성을 검토 중이라는 입장을 밝혔다. 지역 상공계는 구체적인 일정 공개를 요구하는 한편, 다른 지역과의 비교보다 산업 전체의 공급 안정성을 고려해야 한다는 의견도 내놓았다.\n기사에서는 시설별 용량과 예산, 공사 진척률 등 검증 가능한 세부 자료가 충분히 공개되지 않았다고 지적한다. 향후 논의에서 각 사업의 지연 가능성과 투자 영향이 공개될지가 관건이다.`;
e.generate.addEventListener('click',generate);
e.sample.addEventListener('click',()=>{stopAudio(false);e.url.value='';e.bundle.value=DEMO;state.article='';state.sourceTitle='';state.sourceName='';state.sourceUrl='';setArticlePreview();showCartoonPlaceholder();state.columnTitle='';renderColumn('');text(e.columnHeading,'시사칼럼');setStatus('가상 기사 예시를 넣었습니다. 작성 버튼을 누르세요.');});
e.clear.addEventListener('click',()=>{stopAudio(false);e.url.value='';e.bundle.value='';state.columnTitle='';state.article='';state.sourceUrl='';state.sourceTitle='';state.sourceName='';setArticlePreview();showCartoonPlaceholder();renderColumn('');text(e.columnHeading,'시사칼럼');setStatus('입력과 작성 결과를 초기화했습니다.');});
e.cartoonBtn.addEventListener('click',async()=>{
 e.cartoonBtn.disabled=true;
 try{const a=await resolveArticle();state.article=a.article;state.sourceTitle=a.title;state.sourceName=a.source;state.sourceUrl=a.url;setArticlePreview({title:a.title,source:a.source,article:a.article,url:a.url,report:state.report});const made=paintCartoon();setStatus(`${made.style} 만평을 그렸습니다. PNG로 저장할 수 있습니다.`);}
 catch(err){setStatus(`만평 그리기 실패: ${errorText(err)}`);}
 finally{e.cartoonBtn.disabled=false;}
});
e.cartoonStyle.addEventListener('change',()=>{if(!state.cartoonReady)return;try{paintCartoon();setStatus('선택한 구성으로 만평을 다시 그렸습니다.');}catch(err){setStatus(errorText(err));}});
e.cartoonSave.addEventListener('click',()=>{if(!state.cartoonReady)return setStatus('기사 내용을 입력해 먼저 만평을 그려 주세요.');saveCanvas(e.cartoon,`${filename(state.sourceTitle)}_명도재_시사만평.png`);setStatus('기사 시사만평 PNG를 저장했습니다.');});

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
  const body=getEditedColumn().trim();if(!body)return setStatus('복사할 칼럼이 없습니다.');
  const content=[state.columnTitle,body,`출처: ${state.sourceName||'사용자 제공 기사'}`,state.sourceUrl?'원문 링크: '+state.sourceUrl:''].filter(Boolean).join('\n\n');
  try{await navigator.clipboard.writeText(content);setStatus('칼럼과 기사 출처를 클립보드에 복사했습니다.');}
  catch{setStatus('자동 복사가 차단되었습니다. 칼럼 본문을 직접 선택해 복사해 주세요.');}
});
// 브라우저에서 기사·만평·칼럼을 합성하는 신문 특집호 PNG.
function drawWrap(ctx,str,x,y,width,lineHeight,maxLines=9999){
 const rows=[];for(const para of String(str||'').replace(/\r/g,'').split('\n')){
   if(!para.trim()){rows.push('');continue;}
   let line='';for(const char of Array.from(para)){if(ctx.measureText(line+char).width>width && line){rows.push(line);line=char;}else line+=char;}if(line)rows.push(line);
 }
 let used=0;for(const line of rows.slice(0,maxLines)){ctx.fillText(line,x,y+used*lineHeight);used++;}
 return {next:y+used*lineHeight,overflow:rows.length>maxLines};
}
function newspaperPng(){
 if(!state.article || !state.cartoonReady)return setStatus('기사·칼럼을 먼저 작성해 주세요.');
 const W=1400,x=92,room=1216,articleText=state.article.slice(0,1450);
 const probe=document.createElement('canvas').getContext('2d');probe.font='29px Malgun Gothic,sans-serif';
 const approxArticle=Math.ceil(articleText.length/47)*43;
 const height=Math.max(2100,700+Math.min(approxArticle,900)+855+Math.ceil(state.columnBody.length/50)*45+360);
 const c=document.createElement('canvas');c.width=W;c.height=Math.min(height,4800);const ctx=c.getContext('2d');ctx.textBaseline='top';ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,c.height);
 ctx.strokeStyle='#252a2d';ctx.lineWidth=8;ctx.strokeRect(32,32,W-64,c.height-64);
 ctx.fillStyle='#212629';ctx.fillRect(x,78,room,6);
 ctx.textAlign='center';ctx.fillStyle='#1b2023';ctx.font='bold 76px Batang,serif';ctx.fillText('명도재 시사컬럼',W/2,110);ctx.font='22px Malgun Gothic,sans-serif';ctx.fillText('MYEONGDO EDITORIAL · NEWSPAPER SPECIAL',W/2,210);
 ctx.textAlign='left';ctx.fillRect(x,262,room,48);ctx.fillStyle='#fff';ctx.font='bold 23px Malgun Gothic,sans-serif';ctx.fillText('01  기사 원문 · 편집 미리보기',x+18,274);
 let y=340;ctx.fillStyle='#111';ctx.font='bold 42px Batang,serif';y=drawWrap(ctx,state.sourceTitle||'기사 원문',x,y,room,55,3).next+15;
 ctx.font='24px Malgun Gothic,sans-serif';ctx.fillStyle='#5c6266';ctx.fillText('출처: '+(state.sourceName||'사용자 제공 기사'),x,y);y+=65;
 ctx.font='28px Malgun Gothic,sans-serif';ctx.fillStyle='#2d3336';const art=drawWrap(ctx,articleText,x,y,room,41,22);y=art.next+30;
 if(state.article.length>1450 || art.overflow){ctx.font='20px Malgun Gothic,sans-serif';ctx.fillStyle='#6a6f72';ctx.fillText('※ 지면 PNG는 기사 일부를 수록합니다. 전체 원문은 프로그램의 미리보기·인쇄에서 확인할 수 있습니다.',x,y);y+=44;}
 ctx.fillStyle='#212629';ctx.fillRect(x,y,room,48);ctx.fillStyle='#fff';ctx.font='bold 23px Malgun Gothic,sans-serif';ctx.fillText('02  기사 기반 시사만평',x+18,y+11);y+=63;
 ctx.drawImage(e.cartoon,x,y,room,room*740/1200);y+=room*740/1200+35;
 ctx.fillStyle='#212629';ctx.fillRect(x,y,room,48);ctx.fillStyle='#fff';ctx.font='bold 23px Malgun Gothic,sans-serif';ctx.fillText('03  명도재 시사칼럼 · 독립 논설 초안',x+18,y+10);y+=65;
 ctx.fillStyle='#111';ctx.font='bold 40px Batang,serif';y=drawWrap(ctx,state.columnTitle,x,y,room,52,3).next+13;
 ctx.fillStyle='#273035';ctx.font='29px Malgun Gothic,sans-serif';y=drawWrap(ctx,getEditedColumn(),x,y,room,45,32).next+44;
 ctx.fillStyle='#676d71';ctx.font='20px Malgun Gothic,sans-serif';ctx.fillText('명도재 시사컬럼 · 원문 출처·사실 관계 검토 후 배포',x,Math.min(y,c.height-110));
 const crop=document.createElement('canvas');crop.width=W;crop.height=Math.min(c.height,Math.max(y+60,1950));crop.getContext('2d').drawImage(c,0,0);
 saveCanvas(crop,`${filename(state.sourceTitle)}_명도재_신문특집호.png`);setStatus('신문 특집호 PNG를 저장했습니다. 기사 원문은 일부만 포함될 수 있습니다.');
}
e.pageSave.addEventListener('click',newspaperPng);

e.print.addEventListener('click',()=>window.print());
e.today.textContent=dateLabel();setArticlePreview();showCartoonPlaceholder();renderColumn('');updateAudio('idle');
window.addEventListener('pagehide',()=>reader.stop(false));
