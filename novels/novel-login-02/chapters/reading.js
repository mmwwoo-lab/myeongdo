(function(){'use strict';
const host=document.querySelector('.chapter-content');if(!host)return;
const supported=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
const panel=document.createElement('section');panel.className='audio-reader';panel.setAttribute('aria-label','이 장의 오디오 읽기');
panel.innerHTML='<div class="audio-title">🔊 이 장 오디오 읽기</div><div class="audio-controls"><button type="button" id="audio-start">▶ 읽기</button><button type="button" id="audio-pause" disabled>⏸ 일시정지</button><button type="button" id="audio-stop" disabled>■ 전체 정지</button><label for="audio-speed">속도 <select id="audio-speed"><option value="0.8">0.8배</option><option value="1" selected>1배</option><option value="1.15">1.15배</option><option value="1.3">1.3배</option></select></label></div><div class="audio-status" id="audio-status" role="status" aria-live="polite">한국어 음성합성으로 본문을 읽습니다.</div>';
host.parentNode.insertBefore(panel,host);const start=document.getElementById('audio-start'),pause=document.getElementById('audio-pause'),stop=document.getElementById('audio-stop'),speed=document.getElementById('audio-speed'),status=document.getElementById('audio-status');
if(!supported){start.disabled=true;status.textContent='이 브라우저에서는 음성 읽기를 지원하지 않습니다. Chrome 또는 Edge에서 열어 주세요.';return;}
let session=0,part=0,active=false,paused=false,utterance=null;const engine=window.speechSynthesis;
// 한 번에 지나치게 긴 문장을 합성하지 않도록 문단을 나누고, 전체 장은 순차 읽기
const texts=[...host.querySelectorAll('p,h2,h3')].map(el=>el.textContent.trim()).filter(Boolean).flatMap(t=>t.match(/[\s\S]{1,190}(?:[.!?。！？]|$)|[\s\S]{1,190}/g)||[t]);
function sayState(t){status.textContent=t}function sync(){start.textContent=active?'↻ 처음부터 읽기':'▶ 읽기';pause.disabled=!active;stop.disabled=!active;pause.textContent=paused?'▶ 이어읽기':'⏸ 일시정지'}
function voice(){const all=engine.getVoices();return all.find(v=>v.lang.toLowerCase()==='ko-kr'&&v.localService)||all.find(v=>v.lang.toLowerCase().startsWith('ko'))||null}
function halt(announce){session++;active=false;paused=false;part=0;utterance=null;try{engine.cancel()}catch(_){}sync();if(announce)sayState('읽기를 정지했습니다.')}
function next(token){if(token!==session||!active||paused)return;if(part>=texts.length){halt(false);sayState('이 장의 읽기를 마쳤습니다.');return}const u=new SpeechSynthesisUtterance(texts[part]);utterance=u;u.lang='ko-KR';u.rate=Number(speed.value)||1;u.pitch=1;const v=voice();if(v)u.voice=v;u.onend=()=>{if(token!==session||!active)return;part++;next(token)};u.onerror=e=>{if(token!==session||!active||e.error==='interrupted'||e.error==='canceled')return;halt(false);sayState('음성 읽기를 계속할 수 없습니다. 브라우저의 한국어 음성 설정을 확인해 주세요.')};sayState('읽는 중 · '+(part+1)+' / '+texts.length+' 구간');try{engine.speak(u)}catch(_){halt(false);sayState('오디오 읽기를 시작할 수 없습니다.') }}
start.addEventListener('click',()=>{halt(false);active=true;sync();if(!texts.length){halt(false);sayState('읽을 본문이 없습니다.');return}const token=session;next(token)});
pause.addEventListener('click',()=>{if(!active)return;if(paused){try{engine.resume()}catch(_){}paused=false;sayState('이어 읽는 중입니다.')}else{try{engine.pause()}catch(_){}paused=true;sayState('일시정지했습니다.')}sync()});
stop.addEventListener('click',()=>halt(true));
speed.addEventListener('change',()=>{if(!active)return;const wasPaused=paused;session++;try{engine.cancel()}catch(_){}paused=false;const token=session;if(wasPaused){active=false;part=0;sync();sayState('속도를 변경했습니다. 읽기 버튼으로 다시 시작해 주세요.')}else{next(token)}});
window.addEventListener('pagehide',()=>halt(false));window.addEventListener('beforeunload',()=>halt(false));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){halt(false);sayState('화면을 벗어나 오디오 읽기를 정지했습니다.')}});
document.querySelectorAll('a[href]').forEach(a=>a.addEventListener('click',()=>{if(active)halt(false)}));sync();
})();