import {styleNames,paintStyle} from './styles.js';
import {revisePoem,buildExpertPrompt} from './revision.js';
const $=id=>document.getElementById(id);
const canvas=$('art'),ctx=canvas.getContext('2d');
const W=1920,H=1080;
let seed=Date.now()>>>0, artwork=null, busy=false, finalized=false, selectedStyle='impression', previousPoem=null;
const fonts={brush:'PoetryBrush',myeongjo:'"Nanum Myeongjo"',gowun:'"Gowun Batang"',sans:'"Noto Sans KR"',gungsuh:'"Gungsuh", "궁서"'};
const familyFor=data=>fonts[data.font]||fonts.brush;
const example={title:'빛이 머무는 자리',author:'',poem:'바람이 지나간 자리마다\n작은 꽃들이 고개를 든다\n\n호수에 내려앉은 오후의 빛\n물결은 말없이 하늘을 안고\n\n나는 잠시 걸음을 멈추어\n너의 이름을 봄이라 부른다'};
const palettes={garden:['#d8e3d5','#f3e8ca','#8dad9e','#617f72','#a8b780','#e7acc1','#f5e9c5'],water:['#c7dce4','#f4e0bb','#87adb4','#507e86','#91ae8d','#c7b4d2','#f6dda7'],sunset:['#e2b6ab','#f8d4a0','#bb9891','#7e8588','#bbad78','#ce8190','#f8d3a0'],winter:['#d7dce8','#f1e9df','#b6c7ce','#7d929e','#aebbb8','#d8c9d9','#f4eded'],autumn:['#e0c4a2','#f7d8a6','#b98560','#766044','#ad8050','#c85b43','#ffbf62']};
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function chooseScene(text){if(/눈|겨울|서리|얼음/.test(text))return 'winter';if(/노을|저녁|황혼|석양/.test(text))return 'sunset';if(/단풍|가을|낙엽|은행잎|단풍잎/.test(text))return 'autumn';if(/호수|바다|물결|강|비|물빛/.test(text))return 'water';return 'garden';}
function stroke(x,y,w,h,color,alpha=.65,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,w,h,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function paint(scene){const p=palettes[scene];const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,p[0]);sky.addColorStop(.47,p[1]);sky.addColorStop(.49,p[2]);sky.addColorStop(1,p[3]);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // Broken colors and short, layered strokes create light instead of hard outlines.
 for(let i=0;i<5400;i++){let x=random()*W,y=random()*H*.54;stroke(x,y,10+random()*42,2+random()*9,[p[0],p[1],'#fff7e4'][Math.floor(random()*3)],.10+random()*.2,random()*.12);}
 const sunX=scene==='sunset'?600:750;for(let i=0;i<240;i++)stroke(sunX+(random()-.5)*240,200+(random()-.5)*130,10+random()*32,4+random()*9,p[6],.12);
 for(let layer=0;layer<3;layer++){ctx.beginPath();ctx.moveTo(0,600);for(let x=0;x<=W;x+=12){ctx.lineTo(x,470+layer*34+Math.sin(x/240+layer*1.4)*45+Math.sin(x/100+layer)*13);}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.globalAlpha=.24+layer*.1;ctx.fillStyle=[p[2],p[4],p[3]][layer];ctx.fill();}ctx.globalAlpha=1;
 const water=scene==='water'||scene==='winter';
 for(let i=0;i<12500;i++){const x=random()*W,y=540+random()*540,d=(y-540)/540;const colors=water?[p[0],p[2],p[3],p[6],p[4]]:[p[3],p[4],p[2],p[1]];stroke(x,y,water?7+random()*(15+d*43):3+random()*15,2+random()*(water?4:10+d*5),colors[Math.floor(random()*colors.length)],.16+random()*.42,water?0:(random()-.5)*1.6);}
 // A bank of foliage on the far left leaves breathing room for the poem.
 for(let i=0;i<2300;i++){let x=random()*550,y=230+random()*820;const edge=230+Math.sin(y/140)*110;if(x>edge+random()*180)continue;stroke(x,y,5+random()*18,3+random()*12,[p[3],p[4],p[2]][Math.floor(random()*3)],.12+random()*.34,random());}
 if(scene==='autumn'){for(let i=0;i<2200;i++){const x=random()*970,y=160+random()*660;if(x>780-y*.23+random()*270)continue;stroke(x,y,5+random()*26,3+random()*17,['#b74932','#d27838','#f3b45d','#8d5132'][Math.floor(random()*4)],.32+random()*.42,random()*3);}for(let i=0;i<650;i++){const x=random()*W,y=760+random()*320;stroke(x,y,3+random()*15,2+random()*7,['#b64936','#eb983d','#edc768'][Math.floor(random()*3)],.32+random()*.35,random()*3);}}
 if(scene!=='winter'&&scene!=='autumn')for(let i=0;i<1600;i++){const x=random()*W,y=750+random()*330; if(random()<(x/W)*.8)continue;const scale=(y-650)/400;stroke(x,y,3+random()*8*scale,2+random()*6*scale,[p[5],p[6],'#e9c9c1'][Math.floor(random()*3)],.35+random()*.45,random()*2);}
 // Fine canvas grain, kept subtle for export.
 for(let i=0;i<23000;i++){ctx.fillStyle=random()>.5?'rgba(255,255,255,.07)':'rgba(35,50,45,.035)';ctx.fillRect(random()*W,random()*H,1+random()*3,1+random()*2);}
}
function wrapped(text,maxWidth){const result=[];for(const line of text.split('\n')){if(!line){result.push('');continue;}let current='';for(const char of line){if(current&&ctx.measureText(current+char).width>maxWidth){result.push(current);current=char;}else current+=char;}result.push(current);}return result;}
function layout(data){
 const maxWidth=780,family=familyFor(data),desired=Math.min(88,Math.max(28,Number(data.fontSize)||60));
 for(let size=desired;size>=20;size-=2){
  ctx.font=size+'px '+family;
  const lines=wrapped(data.poem,maxWidth);
  ctx.font=Math.round(size*1.3)+'px '+family;
  const titles=wrapped(data.title,maxWidth);
  const height=titles.length*size*1.48+size*.85+lines.length*size*1.43+(data.author?size*1.9:0);
  if(height<=850)return {size,lines,titles,height,adjusted:size<desired,family};
 }
 return null;
}
function lettering(data,l){
 const x=data.position==='left'?130:data.position==='center'?(W-780)/2:1010;
 let y=(H-l.height)/2;
 const gradient=ctx.createLinearGradient(x-100,0,x+880,0);
 gradient.addColorStop(0,'rgba(255,251,237,0)');
 gradient.addColorStop(.15,'rgba(255,251,237,.68)');
 gradient.addColorStop(.85,'rgba(255,251,237,.68)');
 gradient.addColorStop(1,'rgba(255,251,237,0)');
 ctx.fillStyle=gradient;ctx.fillRect(x-100,0,980,H);
 ctx.fillStyle='#293e36';ctx.textBaseline='top';
 ctx.font=Math.round(l.size*1.3)+'px '+l.family;
 for(const title of l.titles){ctx.fillText(title,x,y);y+=l.size*1.48;}
 y+=l.size*.85;
 ctx.font=l.size+'px '+l.family;
 for(const line of l.lines){ctx.fillText(line,x,y);y+=l.size*1.43;}
 if(data.author){
  y+=l.size*.65;let authorSize=Math.round(l.size*.8);
  do{ctx.font=authorSize+'px '+l.family;if(ctx.measureText('— '+data.author).width<=780)break;authorSize--;}while(authorSize>12);
  ctx.fillText('— '+data.author,x,y);
 }
}
async function render(data,{finalize=false}={}){if(busy)return;busy=true;$('apply-design').disabled=true;$('final-create').disabled=true;$('variation').disabled=true;$('download').disabled=true;$('status').textContent=finalize?'최종 시화를 제작하고 있습니다…':'시화 미리보기에 설정을 적용하고 있습니다…';try{await document.fonts.load('60px '+familyFor(data));const l=layout(data);if(!l)throw Error('시의 줄 수가 너무 많습니다. 빈 줄을 줄이거나 시를 나누어 입력해 주세요.');await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(data.style==='impression')paint(data.scene);else paintStyle(ctx,data.style,data.scene,random,W,H);lettering(data,l);artwork=data;finalized=finalize;$('status').textContent=`${{garden:'꽃 정원',water:'빛나는 호수',sunset:'노을 들판',winter:'겨울 풍경',autumn:'단풍 숲길'}[data.scene]}에 시를 담았습니다. · ${styleNames[data.style]} · ${l.size}px${l.adjusted?' (화면 맞춤)':''}`;canvas.setAttribute('aria-label',`${styleNames[data.style]} 화풍 ${finalize?'최종 시화':'시화 미리보기'}`);if(finalize)$('status').textContent='최종 시화 제작 완료 · '+$('status').textContent+' · 아래 최종 PNG 저장 버튼을 누르세요.';else $('status').textContent+=' · 최종 제작 버튼으로 완성할 수 있습니다.';}catch(error){artwork=null;finalized=false;$('status').textContent=error.message;}finally{busy=false;$('apply-design').disabled=false;$('final-create').disabled=false;$('variation').disabled=!artwork;$('download').disabled=!artwork||!finalized;}}
$('editor').addEventListener('submit',event=>{event.preventDefault();const poem=$('poem').value.trim();if(!poem){$('status').textContent='시 본문을 입력해 주세요.';$('poem').focus();return;}const title=$('title').value.trim()||'제목 없는 시';render({style:selectedStyle,title,author:$('author').value.trim(),poem,position:$('position').value,font:$('font').value,fontSize:Number($('font-size').value),scene:$('scene').value==='auto'?chooseScene(title+' '+poem):$('scene').value});});
$('poem').addEventListener('input',()=>{$('count').textContent=$('poem').value.length.toLocaleString()+' / 1,500';markDesignPending();});
$('font-size').addEventListener('input',()=>{$('font-size-output').textContent=$('font-size').value+'px';});
function markDesignPending(){finalized=false;$('download').disabled=true;if($('poem').value.trim())$('status').textContent='시 내용 또는 설정이 변경되었습니다. 오른쪽의 설정 적용 또는 최종 시화 제작을 눌러주세요.';}
for(const id of ['font','font-size','scene','position'])$(id).addEventListener('change',markDesignPending);
for(const id of ['title','author'])$(id).addEventListener('input',markDesignPending);
function fillExample(){for(const key of ['title','author','poem'])$(key).value=example[key];$('poem').dispatchEvent(new Event('input'));}
$('example').addEventListener('click',fillExample);
$('variation').addEventListener('click',()=>{if(artwork)render({...artwork},{finalize:false});});
$('apply-design').addEventListener('click',()=>{$('editor').requestSubmit();});
$('final-create').addEventListener('click',()=>{
 const poem=$('poem').value.trim();
 if(!poem){$('status').textContent='최종 제작할 시를 먼저 입력해 주세요.';$('poem').focus();return;}
 const title=$('title').value.trim()||'제목 없는 시';
 render({style:selectedStyle,title,author:$('author').value.trim(),poem,position:$('position').value,font:$('font').value,fontSize:Number($('font-size').value),scene:$('scene').value==='auto'?chooseScene(title+' '+poem):$('scene').value},{finalize:true});
});
$('download').addEventListener('click',()=>{if(!artwork||!finalized)return;canvas.toBlob(blob=>{if(!blob){$('status').textContent='이미지 저장에 실패했습니다. 다시 시도해 주세요.';return;}const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${artwork.title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_')}-시화.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);},'image/png');});
const picker=$('style-picker');
picker.addEventListener('click',event=>{
 const button=event.target.closest('button[data-style]');
 if(!button||busy)return;
 selectedStyle=button.dataset.style;
 for(const choice of picker.querySelectorAll('button[data-style]'))choice.setAttribute('aria-pressed',String(choice===button));
 markDesignPending();
});
$('clear-poem').addEventListener('click',()=>{
 if(($('poem').value.trim()||$('title').value.trim())&&!window.confirm('입력한 시 제목과 본문을 지우시겠습니까?'))return;
 $('poem').value='';$('title').value='';$('poem').dispatchEvent(new Event('input'));
 $('revision-panel').hidden=true;$('revised-poem').value='';previousPoem=null;
 artwork=null;finalized=false;$('variation').disabled=true;$('download').disabled=true;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#f0f2ea';ctx.fillRect(0,0,W,H);
 $('status').textContent='시 입력을 지웠습니다. 새 시를 입력해 주세요.';$('poem').focus();
});
$('rewrite').addEventListener('click',()=>{
 const poem=$('poem').value.trim();
 if(!poem){$('status').textContent='재창작할 시를 먼저 입력해 주세요.';$('poem').focus();return;}
 const revised=revisePoem($('title').value,poem);
 $('revised-poem').value=revised.poem;
 $('revision-notes').replaceChildren(...revised.notes.map(note=>{
  const p=document.createElement('p');p.textContent='• '+note;return p;
 }));
 $('revision-panel').hidden=false;
 $('apply-revision').disabled=false;
 $('status').textContent='재창작 초안을 만들었습니다. 원문과 비교한 뒤 적용해 주세요.';
 $('revision-panel').scrollIntoView({behavior:'smooth',block:'nearest'});
});
$('apply-revision').addEventListener('click',()=>{
 const next=$('revised-poem').value.trim();
 if(!next){$('status').textContent='재창작된 시가 비어 있습니다.';return;}
 if(next.length>1500){$('status').textContent='재창작 시는 1,500자까지 적용할 수 있습니다.';return;}
 if(!previousPoem)previousPoem={title:$('title').value,poem:$('poem').value};
 $('poem').value=next;$('poem').dispatchEvent(new Event('input'));
 $('undo-revision').disabled=false;
 $('editor').requestSubmit();
});
$('undo-revision').addEventListener('click',()=>{
 if(!previousPoem)return;
 $('title').value=previousPoem.title;$('poem').value=previousPoem.poem;
 $('poem').dispatchEvent(new Event('input'));previousPoem=null;
 $('undo-revision').disabled=true;$('editor').requestSubmit();
});
$('ai-rewrite').addEventListener('click',async()=>{
 const poem=$('poem').value.trim();
 if(!poem){$('status').textContent='전문 재창작을 요청할 시를 먼저 입력해 주세요.';return;}
 const prompt=buildExpertPrompt($('title').value,poem);
 let copied;
 try{copied=navigator.clipboard.writeText(prompt);}catch(e){copied=Promise.reject(e);}
 window.open('https://chatgpt.com/','_blank','noopener,noreferrer');
 try{await copied;
  $('status').textContent='전문 재창작 지침을 복사했습니다. 새 ChatGPT 창에 붙여넣어 전송해 주세요.';
 }catch(e){
  $('status').textContent='클립보드 접근이 차단되었습니다. 아래 지침을 직접 복사해 주세요.';
  let fallback=$('manual-prompt');
  if(!fallback){fallback=document.createElement('textarea');fallback.id='manual-prompt';fallback.className='manual-prompt';fallback.setAttribute('aria-label','전문 재창작 요청문 직접 복사');$('revision-panel').appendChild(fallback);}
  fallback.value=prompt;fallback.focus();fallback.select();
 }
});
fillExample();render({...example,style:selectedStyle,scene:'water',position:'right',font:'brush',fontSize:60});
