'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mobile=matchMedia('(max-width:800px)');
let pages=[],pos=0,speechId=null,paused=false,token=0,recitalLines=[],recitalIndex=0,utterance=null;
const step=()=>mobile.matches?1:2;
function add(html,txt,kind='page'){pages.push({html,txt,kind})}
function readBtn(i){return '<div class="read"><button data-read="'+i+'" aria-label="이 페이지 읽기">▶ 이 페이지 읽기</button></div>'}
function render(){
 for(let i=0;i<2;i++){let x=pos+i,el=$(i?'right':'left'),p=pages[x];
 el.className='page'+(p?.kind==='cover'?' cover':p?.kind==='divider'?' divider':'')+(mobile.matches&&i?' hide-mobile':'');
 el.innerHTML=p?readBtn(x)+p.html+'<div class="number">'+(x+1)+'</div>':'';el.scrollTop=0}
 $('progress').textContent=(pos+1)+' — '+Math.min(pos+step(),pages.length)+' / '+pages.length;
 $('prev').disabled=$('edgePrev').hidden=pos===0;
 $('next').disabled=$('edgeNext').hidden=pos+step()>=pages.length;
 document.querySelectorAll('[data-read]').forEach(b=>{if(speechId===Number(b.dataset.read))b.textContent=paused?'▶ 이어 읽기':'⏸ 일시정지'});
}
function stop(){token++;speechId=null;paused=false;if('speechSynthesis'in window)window.speechSynthesis.cancel();$('readingStatus').hidden=true}
function go(page){let p=Math.max(0,Math.min(pages.length-step(),page));if(!mobile.matches)p-=p%2;if(p===pos)return;stop();pos=p;render();history.replaceState(null,'','#page-'+(pos+1))}
function pauseResume(){if(speechId===null)return;try{if(paused){speechSynthesis.resume();paused=false}else{speechSynthesis.pause();paused=true}$('pauseToggle').textContent=paused?'▶ 이어 읽기':'⏸ 낭송 일시정지';document.querySelectorAll('[data-read]').forEach(b=>{if(Number(b.dataset.read)===speechId)b.textContent=paused?'▶ 이어 읽기':'⏸ 일시정지'})}catch(e){console.warn(e)}}
function readPage(i){
 if(speechId===i){pauseResume();return}
 stop();
 const p=pages[i];if(!p||!p.txt.trim())return;
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){alert('이 환경에서는 낭송을 지원하지 않습니다. 크롬에서 열어 주세요.');return}
 const synth=window.speechSynthesis;
 synth.cancel();
 const lines=p.txt.split(/\n+/).map(x=>x.trim()).filter(Boolean);
 if(!lines.length)return;
 const voices=synth.getVoices().filter(v=>/^ko([-_]|$)/i.test(v.lang));
 const voice=voices.find(v=>/female|여성|heami|sunhi|sora|yuna|서연|선희/i.test(v.name))||voices[0]||null;
 speechId=i;recitalLines=lines;recitalIndex=0;paused=false;
 const local=++token;
 $('readingStatus').hidden=false;$('pauseToggle').textContent='⏸ 낭송 일시정지';
 // Longer passages are spoken in short chunks to prevent browser speech cutoff.
 function next(){
  if(local!==token||speechId!==i)return;
  if(recitalIndex>=recitalLines.length){stop();render();return}
  const line=recitalLines[recitalIndex++];
  const chunks=line.match(/[\s\S]{1,90}/gu)||[line];
  const chunk=chunks.shift();
  if(chunks.length)recitalLines.splice(recitalIndex,0,...chunks);
  utterance=new SpeechSynthesisUtterance(chunk);
  utterance.lang='ko-KR';if(voice)utterance.voice=voice;
  utterance.rate=.88;utterance.pitch=1.03;utterance.volume=1;
  utterance.onend=()=>{if(local===token)next()};
  utterance.onerror=e=>{
   if(local!==token)return;
   if(e.error==='interrupted'||e.error==='canceled')return;
   console.warn('낭송 오류',e.error);
   stop();render();alert('음성 재생이 중단되었습니다. 크롬에서 다시 시도해 주세요.');
  };
  synth.speak(utterance);
 }
 next();render();
}
function start(data){
 const parts=data.parts,poems=data.poems;
 add('<div><p class="kicker">明道齋 · 시 읽기</p><h1>별꽃은<br>피고 지고</h1><p>이성두 시인의 다섯 번째 시집</p><p class="author">원시 이성두<br>시평·편집 명도재 이명우</p></div>','별꽃은 피고 지고\n이성두 시인의 다섯 번째 시집\n원시 이성두. 시평과 편집 명도재 이명우.','cover');
 add('<div class="divider"><p class="partnum">EDITORIAL NOTE</p><h2>이 책을 펼치며</h2><p>이성두 시인의 시를 읽고, 명도재 이명우의 작품별 시평을 함께 감상하는 디지털 시집입니다.</p><p>네 부의 시를 책장 넘김 형식으로 엮었습니다. 각 페이지의 낭송 버튼은 해당 페이지의 내용만 읽어줍니다.</p><p>사진 대조 PDF에서 옮긴 교정 초고이므로 원시집과의 최종 대조가 필요합니다.</p></div>','이 책을 펼치며\n이성두 시인의 시와 명도재 이명우의 작품별 시평을 함께 감상하는 디지털 시집입니다.\n네 부로 구성하였습니다.','divider');
 const toc=[];
 for(let part=1;part<=4;part++){
 const list=poems.filter(p=>p.part===part);
 const section=pages.length;toc.push({title:'제'+part+'부 · '+parts[part-1],page:section});
 add('<div class="partnum">PART '+String(part).padStart(2,'0')+'</div><h2>'+esc(parts[part-1])+'</h2><p>'+list.length+'편 · 이성두 원시 / 명도재 이명우 시평</p><p>다음 장부터 시와 작품 해설을 감상하실 수 있습니다.</p>','제'+part+'부 '+parts[part-1]+'. 이성두 시인.','divider');
 for(const p of list){const idx=pages.length;toc.push({title:(p.n||'')+' · '+p.title,page:idx});const poemLines=p.text||'원문을 확인 중입니다.';
 add('<section class="poem"><p class="poem-number">제'+part+'부 · '+esc(parts[part-1])+'</p><h2>'+esc(p.title)+'</h2><div class="poet">이성두 · 『별꽃은 피고 지고』</div><div class="verse">'+esc(poemLines)+'</div></section>',p.title+'\n이성두\n'+poemLines);
 add('<section class="critical"><p class="poem-number">明道齋 · 작품 읽기</p><h2>'+esc(p.title)+' · 시평</h2><p>'+esc(p.commentary||'시평 원본을 확인해 주세요.')+'</p><p class="poet">시평·편집 명도재 이명우</p></section>',p.title+' 시평\n'+(p.commentary||'시평 원본을 확인해 주세요.'));
 }
 }
 add('<div><p class="kicker">COLOPHON</p><h1>별꽃은<br>피고 지고</h1><p>원시 이성두<br>시평·편집 명도재 이명우</p><p>시와 시평의 저작권은 각 권리자에게 있습니다.</p></div>','별꽃은 피고 지고. 원시 이성두. 시평과 편집 명도재 이명우.','cover');
 if(pages.length%2) add('<div class="partnum">明道齋</div><h2>시의 여운이<br>오래 머물기를.</h2>','시의 여운이 오래 머물기를.','divider');
 $('tocPanel').innerHTML='<h2>작품 차례</h2>'+toc.map(x=>'<button data-go="'+x.page+'">'+esc(x.title)+'</button>').join('');
 const match=location.hash.match(/^#page-(\d+)/);if(match)pos=Number(match[1])-1;
 pos=Math.max(0,Math.min(pos,pages.length-step()));if(!mobile.matches)pos-=pos%2;render();
}
document.addEventListener('click',e=>{
 const read=e.target.closest('[data-read]');if(read){e.preventDefault();readPage(Number(read.dataset.read));return}
 const link=e.target.closest('[data-go]');if(link){$('tocPanel').hidden=true;go(Number(link.dataset.go));return}
});
$('prev').onclick=$('edgePrev').onclick=()=>go(pos-step());
$('next').onclick=$('edgeNext').onclick=()=>go(pos+step());
$('contents').onclick=()=>{$('tocPanel').hidden=!$('tocPanel').hidden};
$('pauseToggle').onclick=pauseResume;
$('book').addEventListener('click',e=>{if(e.target.closest('button'))return;if(speechId!==null){pauseResume();return}const el=e.target.closest('.page');if(!el)return;go(pos+(el.id==='left'?-step():step()))});
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(pos+step());if(e.key==='ArrowLeft')go(pos-step())});
window.addEventListener('pagehide',stop);
fetch('./poems.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('작품 파일을 열 수 없습니다.');return r.json()}).then(start).catch(e=>{$('progress').textContent='시집 불러오기 실패';console.error(e)});
