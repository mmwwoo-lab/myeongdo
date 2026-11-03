/* 명도재 시사컬럼 · independent article-to-opinion newsroom studio */
import {renderEditorialCartoon, inferComicTopic} from './cartoon.js';

const $=id=>document.getElementById(id);
const e={
 url:$('articleUrl'),sourceTitle:$('sourceTitle'),sourceName:$('sourceName'),article:$('articleText'),
 columnTitle:$('columnTitle'),column:$('columnBody'),status:$('status'),canvas:$('newspaper'),
 cartoon:$('cartoonCanvas'),cartoonStyle:$('cartoonStyle'),cartoonButton:$('cartoonBtn'),cartoonMode:$('cartoonMode'),cartoonCaption:$('cartoonCaption'),cartoonStyleLabel:$('cartoonStyleLabel'),
 previewArticleTitle:$('previewArticleTitle'),previewSource:$('previewSource'),previewArticleText:$('previewArticleText'),previewColumnTitle:$('previewColumnTitle'),previewColumnText:$('previewColumnText'),paperDate:$('paperDate'),
 generate:$('generateBtn'),import:$('fetchBtn'),sample:$('sampleBtn'),clear:$('clearBtn'),read:$('readBtn'),pause:$('pauseBtn'),resume:$('resumeBtn'),stop:$('stopBtn'),
 rate:$('rate'),rateValue:$('rateValue'),png:$('pngBtn'),cartoonPng:$('cartoonPngBtn'),copy:$('copyBtn'),count:$('charCount'),topic:$('topicBadge'),model:$('modelBadge'),air:$('airBadge'),
 progress:$('readingProgress'),readStatus:$('readStatus'),readCounter:$('readCounter'),meters:$('meters'),previewState:$('previewState'),localTime:$('localTime')
};
const C=e.canvas.getContext('2d'),W=e.canvas.width,H=e.canvas.height;
const state={theme:'시사·논설',mode:'waiting',active:-1,parts:[],busy:false,reading:false,paused:false,runId:0,cartoonImage:null,cartoonMode:'vector',drawFrame:0};
const fmtDate=()=>new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'});
const setStatus=message=>{e.status.textContent=message;};
function safeName(s){return (s||'명도재_시사컬럼').replace(/[\\/:*?"<>|]/g,'_').slice(0,65);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);}
function setBusy(on){state.busy=on;for(const b of [e.import,e.generate,e.cartoonButton,e.sample,e.clear])b.disabled=on;}
async function requestAPI(path,data){const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 let result;try{result=await response.json();}catch{throw new Error(`서버에서 응답을 해석하지 못했습니다 (${response.status}).`);}
 if(!response.ok)throw Error(result.error||`서버 오류 ${response.status}`);return result;}
function segments(text){return String(text||'').trim().split(/(?<=[.!?。])\s+|\n\s*\n/gu).map(x=>x.trim()).filter(Boolean);}
function guessTopic(text){const rules=[['전력·산업',/전력|송전|변전|반도체|에너지|산업단지/g],['문화·예술',/문화|예술|축제|전시|공연|문학/g],['지역경제',/지역|대구|경북|경제|예산|기업|일자리/g],['행정·정책',/정부|정책|행정|국회|교육|제도/g]];
 const sorted=rules.map(([key,regex])=>[key,(text.match(regex)||[]).length]).sort((a,b)=>b[1]-a[1]);return sorted[0][1]?sorted[0][0]:'시사·논설';}
function updateCounts(){e.count.textContent=[...e.column.value].length;e.topic.textContent=state.theme;}
function refreshParts(){state.parts=segments(e.column.value);e.readCounter.textContent=`${Math.max(0,state.active+1)} / ${state.parts.length} 문장`;}
function updatePreview(){
 e.previewArticleTitle.textContent=e.sourceTitle.value.trim()||'신문기사를 입력하면 제목이 여기에 표시됩니다.';
 e.previewSource.textContent=[e.sourceName.value.trim(),e.url.value.trim()].filter(Boolean).join('  |  ')||'자료 출처 미입력 · 원문 확인 필요';
 e.previewArticleText.textContent=e.article.value.trim()||'왼쪽에 기사 본문을 붙여 넣거나 주소에서 기사를 가져오세요. 이 구역에서는 기사 내용을 스크롤하여 볼 수 있습니다.';
 e.previewColumnTitle.textContent=e.columnTitle.value.trim()||'기사의 이면을 묻는 질문';
 e.paperDate.textContent=`${fmtDate()}  ·  기획 특집호`;
 e.previewColumnText.replaceChildren();
 if(!state.parts.length){e.previewColumnText.textContent='작성된 약 600자 칼럼이 여기에 나타납니다. 칼럼 읽기 기능을 시작하면 현재 낭독하는 문장이 강조됩니다.';}
 else state.parts.forEach((s,i)=>{const span=document.createElement('span');span.className='sentence'+(state.reading&&i===state.active?' speaking':state.reading&&i<state.active?' past':'');span.textContent=s+(i===state.parts.length-1?'':' ');e.previewColumnText.appendChild(span);});
 scheduleCanvas();
}
const cartStyles={kim:'고전 4컷 구성',park:'현장 이야기형',yong:'상징·은유 단컷',jang:'인물·대사 풍자',soon:'원인·결과 연속'};
function updateCartoonLabel(){e.cartoonStyleLabel.textContent=cartStyles[e.cartoonStyle.value]||'상징·은유 만평';}
function drawCartoon(){
 if(state.cartoonImage){const ctx=e.cartoon.getContext('2d'),img=state.cartoonImage;ctx.clearRect(0,0,640,480);ctx.fillStyle='#e9e2d3';ctx.fillRect(0,0,640,480);const k=Math.max(640/img.width,480/img.height),w=img.width*k,h=img.height*k;ctx.drawImage(img,(640-w)/2,(480-h)/2,w,h);}
 else renderEditorialCartoon(e.cartoon,{article:e.article.value,title:e.sourceTitle.value,style:e.cartoonStyle.value});
 updateCartoonLabel();e.cartoonCaption.textContent=state.cartoonImage?'AI 생성 원본 만평 · 사실 확인 후 공개':`기사의 쟁점: ${inferComicTopic(e.article.value,e.sourceTitle.value).name} · 독창적 풍자 시안`;
 scheduleCanvas();
}
function updateControls(){e.air.classList.toggle('on',state.reading&&!state.paused);e.air.classList.toggle('paused',state.reading&&state.paused);
 e.air.innerHTML=`<span class="led"></span> ${state.reading?(state.paused?'PAUSED':'ON AIR'):'STANDBY'}`;
 e.read.disabled=state.reading;e.pause.disabled=!state.reading||state.paused;e.resume.disabled=!state.reading||!state.paused;e.stop.disabled=!state.reading;
 e.readStatus.textContent=state.reading?(state.paused?'일시정지':'칼럼 낭독 중'):'읽기 대기';
 e.readCounter.textContent=`${Math.max(0,state.active+1)} / ${state.parts.length} 문장`;
 e.progress.style.width=state.reading&&state.parts.length?`${Math.round((state.active+1)/state.parts.length*100)}%`:'0%';
 e.previewState.textContent=state.reading?'AUDIO · '+(state.paused?'PAUSED':'LIVE'):'PREVIEW · READY';
 updatePreview();
}
const bars=Array.from({length:24},()=>{const b=document.createElement('span');b.className='meter';e.meters.appendChild(b);return b;});
let meterFrame=0;function meterLoop(){meterFrame++;for(let i=0;i<bars.length;i++){const active=state.reading&&!state.paused;const level=active?Math.max(12,Math.sin(meterFrame*.17+i*.9)*26+48+Math.cos(i*.64)*14):10;bars[i].style.height=level+'%';bars[i].classList.toggle('active',active);bars[i].classList.toggle('hot',active&&level>72);}requestAnimationFrame(meterLoop);}meterLoop();
function stopSpeech(message=true){state.runId++;if('speechSynthesis'in window)window.speechSynthesis.cancel();state.reading=false;state.paused=false;state.active=-1;updateControls();if(message)setStatus('칼럼 낭독을 정지했습니다.');}
function voiceChoice(){const list=speechSynthesis.getVoices().filter(v=>/^ko(?:[-_]|$)/i.test(v.lang));return list.find(v=>/female|여성|yuna|heami|sunhi|jiyun|sora|seoyeon|유나|선희|서연/i.test(v.name))||list[0]||null;}
function speakColumn(){
 if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window))throw Error('이 브라우저에서는 한국어 TTS 낭독을 지원하지 않습니다.');
 if(!e.column.value.trim())throw Error('칼럼을 먼저 작성하세요.');
 stopSpeech(false);refreshParts();if(!state.parts.length)throw Error('읽을 문장이 없습니다.');
 const run=state.runId,voice=voiceChoice(),items=[e.columnTitle.value.trim(),...state.parts].filter(Boolean),offset=e.columnTitle.value.trim()?1:0;
 state.reading=true;state.paused=false;state.active=0;
 let completed=0;
 for(let i=0;i<items.length;i++){
  const utterance=new SpeechSynthesisUtterance(items[i]);utterance.lang='ko-KR';utterance.rate=Number(e.rate.value);utterance.pitch=1.0;if(voice)utterance.voice=voice;
  utterance.onstart=()=>{if(run!==state.runId)return;state.active=Math.max(0,i-offset);updateControls();};
  utterance.onend=()=>{if(run!==state.runId)return;completed++;if(completed===items.length){state.reading=false;state.paused=false;state.active=-1;updateControls();setStatus('칼럼 낭독을 완료했습니다.');}};
  utterance.onerror=err=>{if(run===state.runId&&!['interrupted','canceled'].includes(err.error)){stopSpeech(false);setStatus(`칼럼 읽기 오류: ${err.error}`);}};
  speechSynthesis.speak(utterance);
 }
 updateControls();setStatus('AI 칼럼을 한국어로 읽습니다. 현재 읽는 문장은 신문 하단에서 붉은색으로 강조합니다.');
}

// Print-export is a newspaper composed from sourced headline, short fair-use excerpt, original cartoon and independent column.
function paperRect(x,y,w,h,color){C.fillStyle=color;C.fillRect(x,y,w,h);}
function paperLine(x1,y1,x2,y2,color='#aaaaaa',width=2){C.strokeStyle=color;C.lineWidth=width;C.beginPath();C.moveTo(x1,y1);C.lineTo(x2,y2);C.stroke();}
function paperText(s,x,y,font,color='#20323a',max){C.font=font;C.textAlign='left';C.fillStyle=color;C.fillText(String(s),x,y,max);}
function splitLines(text,maxWidth,font){C.font=font;const result=[];let line='';for(const ch of String(text)){if(ch==='\n'){if(line)result.push(line);line='';continue;}if(C.measureText(line+ch).width>maxWidth&&line){result.push(line);line='';}line+=ch;}if(line)result.push(line);return result;}
function drawPrintPage(){
 C.clearRect(0,0,W,H);paperRect(0,0,W,H,'#f7f3ea');
 let rand=72819;for(let i=0;i<1300;i++){rand=(1664525*rand+1013904223)>>>0;const x=rand/W*0+rand%W;rand=(1664525*rand+1013904223)>>>0;const y=rand%H;paperRect(x,y,1,1,'#d2cabc3c');}
 C.strokeStyle='#b3a998';C.lineWidth=2;C.strokeRect(28,25,W-56,H-52);
 paperRect(40,40,W-80,24,'#1c303b');paperRect(40,64,W-80,5,'#aa4239');
 C.textAlign='center';C.font='700 74px Georgia,serif';C.fillStyle='#172e39';C.fillText('명도재 시사컬럼',W/2,158);C.font='700 19px sans-serif';C.fillStyle='#7e5148';C.fillText('MYEONGDO  •  EDITORIAL  •  SPECIAL EDITION',W/2,197);C.textAlign='left';
 paperLine(65,220,W-65,220,'#263c45',5);
 paperText(`${fmtDate()}     |     기획 · 사회 · 정책 · 지역 현안`,68,256,'bold 17px sans-serif','#59616a');
 paperRect(852,233,180,35,'#9a3835');paperText('SPECIAL REPORT',867,257,'bold 16px sans-serif','#fff7ed');
 paperText('01  원문 기사  /  FACT & SOURCE',68,320,'bold 22px sans-serif','#a13c38');paperLine(67,330,W-68,330,'#b8b2a4',2);
 const title=e.sourceTitle.value.trim()||'기사 제목을 입력해 주세요';
 const titleLines=splitLines(title,950,'bold 47px Georgia,serif').slice(0,2);let ty=388;
 for(const line of titleLines){paperText(line,68,ty,'bold 47px Georgia,serif','#233b48',960);ty+=57;}
 paperText((e.sourceName.value.trim()||'기사 출처 미입력').slice(0,90),70,ty+6,'18px sans-serif','#687279',950);
 const bodyTop=ty+52,articleWidth=565;
 const bodyExcerpt=e.article.value.trim().slice(0,530)||'기사 본문을 입력하면 이곳에 발행 검토용 요약 발췌가 나타납니다.';
 let lines=splitLines(bodyExcerpt,articleWidth,'22px sans-serif');
 for(let i=0;i<Math.min(15,lines.length);i++){paperText(lines[i],70,bodyTop+i*32,'22px sans-serif','#34434a',articleWidth);}
 if(lines.length>15)paperText('…',74,bodyTop+15*32,'23px sans-serif','#56646a');
 C.drawImage(e.cartoon,680,bodyTop-10,350,290);paperRect(680,bodyTop+290,350,33,'#e6dfd2');paperText('기사 핵심을 바탕으로 그린 오리지널 시사만평',692,bodyTop+313,'15px sans-serif','#6a4c48',324);
 const dividerY=Math.max(930,bodyTop+15*32+32);paperLine(65,dividerY,1035,dividerY,'#273942',5);
 paperText('02  시사평론 칼럼  /  AI OPINION',68,dividerY+44,'bold 22px sans-serif','#a13c38');
 let y=dividerY+97;const colTitle=e.columnTitle.value.trim()||'칼럼 제목';
 for(const l of splitLines(colTitle,970,'bold 40px Georgia,serif').slice(0,2)){paperText(l,70,y,'bold 40px Georgia,serif','#233b48',960);y+=47;}
 paperText('명도재 AI 시사평론 · 독립 논설 초안',72,y+4,'18px sans-serif','#7b7270');y+=42;
 const column=e.column.value.trim()||'칼럼 작성 버튼을 눌러 독립적인 시사 논설 초안을 생성하세요.';
 const font=column.length>680?'20px sans-serif':'22px sans-serif',lineHeight=32,colWidth=452;
 const rows=splitLines(column,colWidth,font),maxRows=Math.min(22,Math.floor((H-145-y)/lineHeight));
 for(let i=0;i<rows.length&&i<maxRows*2;i++){const col=i>=maxRows?1:0,row=col?i-maxRows:i;paperText(rows[i],col?594:70,y+row*lineHeight,font,'#263a44',colWidth);}
 paperLine(550,y-16,550,H-134,'#c3b9a8',1.5);paperLine(65,H-103,1035,H-103,'#9a998e',2);
 paperText(`출처: ${(e.sourceName.value.trim()||'사용자 제공 기사').slice(0,72)}`,69,H-70,'17px sans-serif','#596268',954);
 paperText('AI 재구성 초안 · 원문과 사실관계 검증 후 발행 · 공식 언론사 보도가 아님',69,H-45,'15px sans-serif','#a1453d',940);
}
function scheduleCanvas(){cancelAnimationFrame(state.drawFrame);state.drawFrame=requestAnimationFrame(drawPrintPage);}
function refreshAll(){refreshParts();updateCounts();updatePreview();drawCartoon();}

const DEMO=`(가상 사례 · 테스트용 기사. 실제 언론보도나 정책 결정이 아닙니다.)\n한 지방도시에서 산업단지에 필요한 전력망 시설의 건설 순서를 조정하는 방안을 검토한다는 가상 보도가 나왔다. 보도는 관련 기업의 투자 일정이 변경될 가능성을 제기했고, 주민들은 지역 시설의 준공 시기가 밀릴지 우려하고 있다.\n담당 기관은 아직 최종 결정이 내려지지 않았으며 여러 대안의 비용과 시급성을 검토 중이라는 입장을 밝혔다. 지역 상공계는 구체적인 일정 공개를 요구하는 한편, 다른 지역과의 비교보다 산업 전체의 공급 안정성을 고려해야 한다는 의견도 내놓았다.\n기사에서는 시설별 용량과 예산, 공사 진척률 등 검증 가능한 세부 자료가 충분히 공개되지 않았다고 지적한다. 향후 논의에서 각 사업의 지연 가능성과 투자 영향이 공개될지가 관건이다.`;
e.sample.onclick=()=>{stopSpeech(false);e.url.value='';e.sourceTitle.value='전력망 조정 논의에 지역 기업들 우려';e.sourceName.value='가상 기사 · 기능 시험자료';e.article.value=DEMO;e.columnTitle.value='';e.column.value='';state.theme='전력·산업';state.mode='waiting';state.cartoonImage=null;e.model.textContent='작성 전';refreshAll();setStatus('가상 시험 기사로 채웠습니다. 600자 칼럼과 시사만화를 제작할 수 있습니다.');};
e.clear.onclick=()=>{stopSpeech(false);for(const el of [e.url,e.sourceTitle,e.sourceName,e.article,e.columnTitle,e.column])el.value='';state.theme='시사·논설';state.mode='waiting';state.cartoonImage=null;e.model.textContent='작성 전';e.cartoonMode.textContent='기사 소재를 입력한 뒤 시사만화를 그려 보세요.';refreshAll();setStatus('입력과 미리보기를 초기화했습니다.');};
e.import.onclick=async()=>{if(!e.url.value.trim())return setStatus('HTTPS 기사 주소를 먼저 입력하세요.');setBusy(true);setStatus('원문 기사 페이지를 확인하고 있습니다.');try{
 const {article,notice}=await requestAPI('/api/import',{url:e.url.value.trim()});e.sourceTitle.value=article.title||'';e.article.value=article.body||'';e.sourceName.value=new URL(article.url).hostname;state.cartoonImage=null;state.theme=guessTopic(e.article.value);refreshAll();setStatus(`기사 본문 약 ${article.body.length}자를 가져왔습니다. ${notice||''}`);
 }catch(err){setStatus(`기사 가져오기 실패: ${err.message} 직접 본문을 붙여 넣어 주세요.`);}finally{setBusy(false);}};
e.generate.onclick=async()=>{const article=e.article.value.trim();if(article.length<100)return setStatus('기사 내용을 최소 100자 이상 입력하세요.');setBusy(true);stopSpeech(false);setStatus('원문에 기초해 사실과 의견을 구분한 600자 칼럼을 작성 중입니다.');try{
 const result=await requestAPI('/api/column',{article,title:e.sourceTitle.value,source:e.sourceName.value,sourceUrl:e.url.value});const col=result.column;e.columnTitle.value=col.headline||'';e.column.value=col.body||'';state.theme=col.theme||guessTopic(article);state.mode=col.mode;e.model.textContent=col.mode==='ai'?'AI 논설 작성':'기본 초안 · AI 키 미설정';refreshParts();updateCounts();updatePreview();setStatus(`${[...e.column.value].length}자 칼럼 초안을 작성했습니다. ${col.notice||''}`);
 }catch(err){setStatus(`칼럼 생성 실패: ${err.message}`);}finally{setBusy(false);}};
e.read.onclick=()=>{try{speakColumn();}catch(err){setStatus(err.message);}};
e.pause.onclick=()=>{if(!state.reading||state.paused)return;speechSynthesis.pause();state.paused=true;updateControls();};
e.resume.onclick=()=>{if(!state.reading||!state.paused)return;speechSynthesis.resume();state.paused=false;updateControls();};
e.stop.onclick=()=>stopSpeech();
e.rate.oninput=()=>e.rateValue.textContent=`${Number(e.rate.value).toFixed(2)}×`;
e.cartoonStyle.onchange=()=>{state.cartoonImage=null;drawCartoon();e.cartoonMode.textContent=`${cartStyles[e.cartoonStyle.value]} 연출로 전환했습니다. 기사 내용에 맞는 오리지널 만평 시안을 표시합니다.`;};
e.cartoonButton.onclick=async()=>{if(e.article.value.trim().length<80)return setStatus('시사만평을 만들려면 기사 내용을 80자 이상 입력하세요.');setBusy(true);setStatus('기사 핵심 쟁점을 분석해 만평을 생성합니다.');try{
 const r=await requestAPI('/api/cartoon',{article:e.article.value,headline:e.sourceTitle.value,style:e.cartoonStyle.value});
 state.cartoonImage=null;
 if(r.mode==='ai'&&r.image){const img=new Image();img.src=r.image;await img.decode();state.cartoonImage=img;state.cartoonMode='ai';}
 else{state.cartoonMode='vector';}
 drawCartoon();e.cartoonMode.textContent=r.notice||'기사를 바탕으로 만평을 작성했습니다.';setStatus(r.notice||'기사 기반 시사만평 시안을 완성했습니다.');
 }catch(err){state.cartoonImage=null;state.cartoonMode='vector';drawCartoon();e.cartoonMode.textContent='자동 벡터 만평 시안을 표시했습니다.';setStatus(`전문 이미지 생성 미사용: ${err.message} · 기본 만평으로 대체했습니다.`);}finally{setBusy(false);}};
e.png.onclick=()=>{drawPrintPage();e.canvas.toBlob(b=>{if(b)download(b,`${safeName(e.columnTitle.value)}_시사컬럼_특집호.png`);else setStatus('신문 이미지 저장에 실패했습니다.');},'image/png');};
e.cartoonPng.onclick=()=>{e.cartoon.toBlob(b=>{if(b)download(b,`${safeName(e.sourceTitle.value)}_시사만평.png`);else setStatus('만평 저장에 실패했습니다.');},'image/png');};
e.copy.onclick=async()=>{if(!e.column.value.trim())return setStatus('복사할 칼럼이 없습니다.');const content=[e.columnTitle.value,e.column.value,'명도재 AI 시사평론',`참조: ${e.sourceName.value} ${e.url.value}`].filter(Boolean).join('\n\n');try{await navigator.clipboard.writeText(content);setStatus('칼럼과 출처를 복사했습니다.');}catch{setStatus('복사 권한이 제한됐습니다. 본문 입력창을 선택해 직접 복사하세요.');}};
for(const el of [e.article,e.sourceTitle,e.sourceName,e.url])el.addEventListener('input',()=>{state.cartoonImage=null;state.theme=guessTopic(e.article.value);updateCounts();updatePreview();drawCartoon();});
for(const el of [e.column,e.columnTitle])el.addEventListener('input',()=>{if(state.reading)stopSpeech(false);refreshParts();updateCounts();updatePreview();});
function tickClock(){e.localTime.textContent=new Date().toLocaleTimeString('ko-KR',{hour12:false,timeZone:'Asia/Seoul'});}tickClock();setInterval(tickClock,1000);
if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=()=>{};
refreshAll();updateControls();drawPrintPage();
