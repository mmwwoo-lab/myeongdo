
// 사전 기반의 투명한 휴리스틱 분석. 언어모델의 심층 문학비평과는 구분합니다.
const WORDS={
  wistful:['그리움','그립','그대','추억','기다','빈집','빈 벤치','떠나','어머니','고향','이별','낙엽','가을','홀로','외로','눈물','세월'],
  hopeful:['햇살','희망','꽃','봄','새싹','기쁨','사랑','빛나','웃음','따뜻','피어나','청춘','노래','푸르','행복'],
  serene:['고요','물결','호수','못둑','강','바다','달','별','새벽','안개','구름','바람','침묵','숲','저녁','잔잔'],
  dramatic:['불','폭풍','전쟁','외침','분노','울부짖','뜨겁','격정','갈라','번개','폭우']
};
const MOTIFS=[
  ['pomegranate',/석류|붉은 알맹이/,'석류나무'],
  ['cosmos',/코스모스/,'코스모스'],
  ['bench',/벤치|의자/,'빈 벤치'],
  ['boat',/배 한 척|돛배|나룻배|쪽배|배가 뜨/,'작은 배'],
  ['water',/강|호수|연못|못둑|신천|물결|물비늘|바다|개울/,'물가'],
  ['flower',/꽃|나리|동백|벚꽃|꽃잎/,'꽃'],
  ['tree',/감나무|나무|홍시|잎|가지/,'나무'],
  ['mountain',/산|능선|앞산|팔공산/,'산'],
  ['moon',/달빛|보름달|초승달|달이|낮달/,'달'],
  ['stars',/별|은하수/,'별빛'],
  ['rain',/비|빗방울|빗물|소나기/,'비'],
  ['snow',/눈꽃|함박눈|눈보라|설원|눈이 내/,'눈']
];
function occurrences(str, token){return str.split(token).length-1;}
function analyzePoem(text){
  const source=String(text||'').replace(/\r\n?/g,'\n').trim();
  const lines=source.split('\n').map(x=>x.trim()).filter(Boolean);
  const score={};
  for(const [key, words] of Object.entries(WORDS)) score[key]=words.reduce((n,w)=>n+Math.min(occurrences(source,w),4),0);
  const ordered=Object.entries(score).sort((a,b)=>b[1]-a[1]);
  const mood=ordered[0][1]===0?'serene':ordered[0][0];
  const season=/겨울|눈보라|설원|얼음/.test(source)?'winter':/가을|낙엽|홍시|석류|단풍/.test(source)?'autumn':/봄|벚꽃|새싹/.test(source)?'spring':/여름|장마|뙤약볕/.test(source)?'summer':'neutral';
  const time=/밤|달빛|별빛|은하수|자정/.test(source)?'night':/노을|석양|황혼|해질녘/.test(source)?'sunset':/새벽|동틀/.test(source)?'dawn':'day';
  const motifs=MOTIFS.filter(([,re])=>re.test(source)).map(([key,,label])=>({key,label}));
  const labels={wistful:'그리움·회상',hopeful:'희망·서정',serene:'명상·평온',dramatic:'긴장·격정'};
  const bpm={wistful:66,hopeful:82,serene:70,dramatic:88}[mood];
  const mode={wistful:'minor',hopeful:'major',serene:'major',dramatic:'minor'}[mood];
  const palette={
    autumn:['#f2d8b0','#cf9b78','#7f6c6c','#597786'],winter:['#e7eef6','#b7d0de','#809ab2','#617a94'],
    spring:['#d6eadd','#b3cebb','#90b9b6','#638d91'],summer:['#c4e3ed','#b0d2cb','#688fa5','#45738b'],
    neutral:['#e9dcca','#b9cdd3','#869cab','#697e84']
  }[season];
  const distinctive=motifs.map(m=>m.label);
  const themes=distinctive.length?distinctive.join('·'):'자연 풍경과 내면의 정서';
  const commentary=`이 작품은 ${themes}의 이미지를 통해 ${labels[mood]}의 정조를 드러냅니다. ${lines.length}개 행의 호흡을 살려, ${season==='autumn'?'가을빛':time==='night'?'밤의 청색': '은은한 자연색'} 수채화와 ${bpm} BPM의 ${mode==='minor'?'단조':'장조'} 선율로 해석합니다. 이 분석은 시어 빈도에 따른 창작용 제안이며 정밀한 문학비평이 아닙니다.`;
  const imagePrompt=`Professional luminous traditional Korean transparent watercolor painting, wide cinematic 16:9 landscape, sophisticated wet-on-wet pigments and fine cold press paper texture, atmospheric perspective, no lettering, no typography, no frames, generous negative space in middle for later poem subtitles. Poetry imagery: ${themes}. Season: ${season}, time: ${time}, emotion: ${labels[mood]}. Specific poem lines as creative context: ${source.slice(0,900)}. Painterly, restrained elegance, natural believable composition, subtle light, detailed image that directly reflects the poem rather than a generic landscape.`;
  return {lines,score,mood,season,time,motifs,bpm,mode,palette,commentary,imagePrompt,summary:`${labels[mood]} · ${bpm} BPM · ${season} · ${themes}`};
}
function wrappingLines(ctx,lines,maxWidth,font='31px serif'){
  ctx.save();ctx.font=font;
  const out=[];
  for(const line of lines){
    let s='';
    for(const ch of line){if(ctx.measureText(s+ch).width>maxWidth && s){out.push(s);s='';} s+=ch;}
    if(s)out.push(s);
  }
  ctx.restore();return out;
}



const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function makeRnd(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
function hashText(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function blob(ctx,x,y,r,color,rand,alpha=.06){
 ctx.save();ctx.fillStyle=color;ctx.globalAlpha=alpha;
 ctx.beginPath();const n=13,wiggle=Array.from({length:n},()=>0.74+rand()*.52);
 for(let i=0;i<=n;i++){const a=(i%n)/n*TAU,rr=r*wiggle[i%n],px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
 ctx.closePath();ctx.fill();ctx.restore();
}
function wash(ctx,x,y,r,color,rand,layers=20){for(let i=0;i<layers;i++) blob(ctx,x+(rand()-.5)*r*.42,y+(rand()-.5)*r*.28,r*(.65+rand()*.72),color,rand,.007+rand()*.019);}
function ridge(ctx,w,h,topY,amp,color,rand,offset=0){
 ctx.fillStyle=color;ctx.globalAlpha=.58;
 ctx.beginPath();ctx.moveTo(0,h);
 for(let x=0;x<=w+28;x+=28){const y=topY+Math.sin((x+offset)/180)*amp+Math.sin((x+offset)/67)*amp*.29+(rand()-.5)*9;ctx.lineTo(x,y);}
 ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
}
function tree(ctx,x,y,size,analysis,rand){
 ctx.save();ctx.translate(x,y);
 for(let i=0;i<10;i++){
  ctx.beginPath();ctx.strokeStyle=i%2?'rgba(75,67,57,.20)':'rgba(93,78,65,.14)';ctx.lineWidth=10+i%3*3;
  ctx.moveTo((rand()-.5)*9,0);ctx.quadraticCurveTo((rand()-.5)*32,-size*.54,(rand()-.5)*size*.63,-size*.95);
  ctx.stroke();
 }
 const autumn=analysis.season==='autumn',winter=analysis.season==='winter';
 if(!winter){
  const tone=autumn?['#c96b52','#e1a365','#ac5e47','#d6a75d']:analysis.season==='spring'?['#d9acb7','#e2cbd1','#91ad93','#cf9eaa']:['#7c9e84','#a4b6a0','#719c8b'];
  for(let i=0;i<145;i++){
   const a=rand()*TAU,r=Math.sqrt(rand());
   blob(ctx,Math.cos(a)*size*.5*r,-size*.80+Math.sin(a)*size*.25*r,10+rand()*30,tone[Math.floor(rand()*tone.length)],rand,.12);
  }
 }
 if(analysis.motifs.some(m=>m.key==='pomegranate')){
  for(let i=0;i<15;i++){const x=(rand()-.5)*size*.7,y=-size*(.65+rand()*.28);ctx.fillStyle='#b94d42';ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(x,y,7+rand()*6,0,TAU);ctx.fill();}
 }
 ctx.restore();
}
function wildflower(ctx,x,y,s,c,rand){
 ctx.save();ctx.translate(x,y);ctx.strokeStyle='rgba(55,85,72,.65)';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(6,-s*.5,2,-s);ctx.stroke();
 ctx.translate(2,-s);
 for(let j=0;j<7;j++){ctx.save();ctx.rotate(j*TAU/7);ctx.globalAlpha=.56;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,-6,4.8,9,0,0,TAU);ctx.fill();ctx.restore();}
 ctx.fillStyle='#c19e58';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();ctx.restore();
}
function bench(ctx,x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.lineCap='round';
 ctx.strokeStyle='rgba(74,67,73,.7)';ctx.lineWidth=5;
 ctx.beginPath();ctx.moveTo(-60,-11);ctx.lineTo(-56,35);ctx.moveTo(60,-11);ctx.lineTo(56,35);ctx.stroke();
 ctx.fillStyle='rgba(185,120,145,.83)';ctx.fillRect(-80,-10,160,18);ctx.fillRect(-76,-61,152,15);ctx.fillRect(-76,-40,152,14);
 ctx.restore();
}
function boat(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='rgba(85,70,65,.75)';ctx.beginPath();ctx.moveTo(-85,0);ctx.lineTo(77,0);ctx.lineTo(52,28);ctx.lineTo(-56,28);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(67,68,65,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-135);ctx.lineTo(0,4);ctx.stroke();ctx.fillStyle='rgba(245,231,209,.72)';ctx.beginPath();ctx.moveTo(-4,-132);ctx.lineTo(-63,-10);ctx.lineTo(-4,-10);ctx.closePath();ctx.fill();ctx.restore();}
function moon(ctx,x,y,r){const g=ctx.createRadialGradient(x,y,3,x,y,r*2.4);g.addColorStop(0,'rgba(254,249,225,.76)');g.addColorStop(.42,'rgba(248,240,214,.32)');g.addColorStop(1,'rgba(252,241,222,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*2.4,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,251,234,.75)';ctx.beginPath();ctx.arc(x,y,r*.72,0,TAU);ctx.fill();}
function paintWatercolor(canvas,analysis,seed=13){
 const w=canvas.width,h=canvas.height,ctx=canvas.getContext('2d'),rand=makeRnd(seed);
 ctx.clearRect(0,0,w,h);
 const [sky,mid,mountain,water]=analysis.palette;
 const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,analysis.time==='night'?'#26394e':sky);grad.addColorStop(.62,mid);grad.addColorStop(1,water);
 ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 // 수채 번짐·그라데이션의 비정형 안료층
 for(let i=0;i<120;i++)wash(ctx,rand()*w,rand()*h*.74,35+rand()*180,i%2?sky:mid,rand,6);
 if(analysis.time==='night'||analysis.motifs.some(m=>m.key==='moon'))moon(ctx,w*.75,h*.20,42);
 else {
  const g=ctx.createRadialGradient(w*.76,h*.22,0,w*.76,h*.22,175);g.addColorStop(0,'rgba(255,245,207,.7)');g.addColorStop(1,'rgba(255,245,207,0)');ctx.fillStyle=g;ctx.fillRect(w*.57,0,420,380);
 }
 // 구름
 for(let i=0;i<12;i++)wash(ctx,rand()*w,55+rand()*220,55+rand()*110,'#f8f2e4',rand,8);
 ridge(ctx,w,h,h*.46,100,mountain,rand,50);ridge(ctx,w,h,h*.58,55,mid,rand,100);
 const isWater=analysis.motifs.some(m=>m.key==='water'||m.key==='boat');
 if(isWater){
  const lake=ctx.createLinearGradient(0,h*.62,0,h);lake.addColorStop(0,'rgba(136,174,181,.73)');lake.addColorStop(1,'rgba(60,100,115,.78)');ctx.fillStyle=lake;ctx.fillRect(0,h*.65,w,h*.35);
  for(let i=0;i<235;i++){const x=rand()*w,y=h*.67+rand()*h*.31;ctx.strokeStyle=`rgba(245,238,209,${rand()*.25})`;ctx.lineWidth=1+rand()*2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18+rand()*88,y);ctx.stroke();}
 }else{
  ridge(ctx,w,h,h*.72,24,water,rand,160);
  for(let i=0;i<65;i++)wash(ctx,rand()*w,h*.78+rand()*h*.2,35+rand()*75,mid,rand,3);
 }
 const has=(s)=>analysis.motifs.some(m=>m.key===s);
 if(has('pomegranate')||has('tree')||analysis.season==='autumn') tree(ctx,175,h*.83,230,analysis,rand);
 if(has('bench'))bench(ctx,w*.76,h*.79,1.1);
 if(has('boat'))boat(ctx,w*.76,h*.72,.72);
 if(has('cosmos')||has('flower')||analysis.season==='spring'){
  const colors=has('cosmos')?['#d895ac','#c67eaa','#f7e2d9']:['#e4b7b4','#c8929b','#f4e1c5'];
  for(let i=0;i<63;i++)wildflower(ctx,rand()*w,h*.87+rand()*h*.21,25+rand()*85,colors[i%colors.length],rand);
 }
 if(analysis.time==='night'||has('stars')){
  for(let i=0;i<95;i++){ctx.fillStyle=`rgba(255,252,234,${.13+rand()*.48})`;ctx.beginPath();ctx.arc(rand()*w,rand()*h*.38,.4+rand()*1.5,0,TAU);ctx.fill();}
 }
 // 한지 종이결·마른 물감 알갱이
 const img=ctx.getImageData(0,0,w,h),pixels=img.data;
 for(let y=0;y<h;y+=2){for(let x=0;x<w;x+=2){const j=(y*w+x)*4,v=(rand()-.5)*17;pixels[j]=clamp(pixels[j]+v,0,255);pixels[j+1]=clamp(pixels[j+1]+v,0,255);pixels[j+2]=clamp(pixels[j+2]+v,0,255);}}
 ctx.putImageData(img,0,0);
 const veil=ctx.createLinearGradient(0,0,w,h);veil.addColorStop(0,'rgba(255,253,241,.06)');veil.addColorStop(1,'rgba(227,217,200,.08)');ctx.fillStyle=veil;ctx.fillRect(0,0,w,h);
}
class Scene {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.off=document.createElement('canvas');this.off.width=1280;this.off.height=720;this.analysis=null;this.image=null;this.seed=1;this.title='';this.author='';this.lines=[];this.duration=35;}
 setPoem(title,author,analysis){this.title=title||'시의 풍경';this.author=author||'명도재';this.analysis=analysis;this.seed=hashText(analysis.lines.join('|'));this.lines=analysis.lines;paintWatercolor(this.off,analysis,this.seed);this.image=null;}
 async setImage(src){const img=new Image();img.decoding='async';img.src=src;await img.decode();this.image=img;}
 draw(now=0,progress=0,mode='ready',activeIdx=-1){
  const ctx=this.ctx,W=this.canvas.width,H=this.canvas.height,t=now/1000;
  ctx.clearRect(0,0,W,H);
  const source=this.image||this.off;
  const srcW=source.naturalWidth||source.width,srcH=source.naturalHeight||source.height;
  const cover=Math.max(W/srcW,H/srcH),zoom=1.065+.025*Math.sin(t*.09),sw=W/(cover*zoom),sh=H/(cover*zoom);
  const sx=(srcW-sw)/2+Math.sin(t*.045)*Math.max(0,srcW-sw)*.2,sy=(srcH-sh)/2+Math.sin(t*.035)*Math.max(0,srcH-sh)*.15;
  ctx.drawImage(source,clamp(sx,0,srcW-sw),clamp(sy,0,srcH-sh),sw,sh,0,0,W,H);
  // 촬영한 듯한 미세한 부유입자
  const rand=makeRnd(this.seed);
  ctx.save();for(let i=0;i<26;i++){
   const x=(rand()*W + t*(3+i%5))%W,y=(rand()*H+Math.sin(t*.32+i)*9+H)%H;
   ctx.fillStyle=`rgba(255,252,238,${.04+(i%4)*.014})`;
   ctx.beginPath();ctx.arc(x,y,1+i%3,0,TAU);ctx.fill();
  }ctx.restore();
  const dark=ctx.createLinearGradient(0,0,0,H);dark.addColorStop(0,'rgba(10,15,25,.26)');dark.addColorStop(.38,'rgba(12,19,25,.47)');dark.addColorStop(.70,'rgba(13,18,24,.48)');dark.addColorStop(1,'rgba(12,18,24,.72)');ctx.fillStyle=dark;ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(mode==='ready'){
   ctx.fillStyle='rgba(255,249,235,.96)';ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=20;
   ctx.font='bold 55px "Nanum Myeongjo", Georgia, serif';ctx.fillText(this.title.slice(0,35),W/2,H*.49);
   ctx.font='23px "Nanum Myeongjo", serif';ctx.fillText(this.author,W/2,H*.60);ctx.shadowBlur=0;
  }else{
   const lines=wrappingLines(ctx,this.lines,800,'34px "Nanum Myeongjo",serif');
   const lh=62,bodyHeight=lines.length*lh;
   // 처음에는 제목, 전체 구절은 아래에서 올라가고 끝은 위로 떠오른다.
   const scrollY=H*.88-(H*.88-H*.48+Math.max(0,lines.length-1)*lh)*clamp(progress,0,1);
   ctx.save();ctx.beginPath();ctx.rect(140,35,W-280,H-80);ctx.clip();
   ctx.shadowColor='rgba(0,0,0,.75)';ctx.shadowBlur=7;
   for(let i=0;i<lines.length;i++){
    const y=scrollY+i*lh;
    if(y<15||y>H-10)continue;
    ctx.fillStyle='rgba(255,250,240,.97)';ctx.font='34px "Nanum Myeongjo", Georgia, serif';ctx.fillText(lines[i],W/2,y);
   }
   ctx.restore();
   if(progress<.06){ctx.fillStyle=`rgba(255,248,228,${1-progress/.06})`;ctx.font='bold 38px "Nanum Myeongjo", serif';ctx.fillText(this.title,W/2,H*.28);}
   if(progress>.92){ctx.fillStyle=`rgba(255,248,228,${clamp((progress-.92)/.08,0,1)})`;ctx.font='25px "Nanum Myeongjo",serif';ctx.fillText(this.author,W/2,H*.52);}
  }
  // 좌하단 작은 명도 낙관
  ctx.fillStyle='rgba(151,45,40,.92)';ctx.fillRect(23,H-65,48,48);ctx.fillStyle='#fff9f0';ctx.font='bold 17px serif';ctx.fillText('명도',47,H-40);
  return progress;
 }
}



const midiToHz=m=>440*Math.pow(2,(m-69)/12);
const CHORDS={
  major:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],
  minor:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]]
};
const SCALES={major:[0,2,4,5,7,9,11,12,14,16],minor:[0,2,3,5,7,8,10,12,14,15]};
function seeded(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
class MusicEngine {
 constructor(){this.ctx=null;this.musicBus=null;this.voiceBus=null;this.capture=null;this.oscillators=new Set();this.interval=null;this.config=null;this.nextNoteTime=0;this.step=0;this.voiceElement=null;this.voiceSource=null;this.level=.32;}
 async init(){
  if(!this.ctx){
   this.ctx=new (window.AudioContext||window.webkitAudioContext)();
   this.capture=this.ctx.createMediaStreamDestination();
   const out=this.ctx.createDynamicsCompressor();out.threshold.value=-16;out.ratio.value=2.8;out.knee.value=16;out.attack.value=.01;out.release.value=.22;
   out.connect(this.ctx.destination);out.connect(this.capture);
   this.musicBus=this.ctx.createGain();this.musicBus.gain.value=this.level;this.musicBus.connect(out);
   this.voiceBus=this.ctx.createGain();this.voiceBus.gain.value=1;this.voiceBus.connect(out);
  }
  if(this.ctx.state==='suspended')await this.ctx.resume();
 }
 configure(analysis,poem){this.config={bpm:analysis.bpm,mode:analysis.mode,mood:analysis.mood,seed:hashText(poem),motifs:analysis.motifs.map(x=>x.label)};}
 setDucking(on){if(!this.ctx)return;const n=this.ctx.currentTime;this.musicBus.gain.cancelScheduledValues(n);this.musicBus.gain.setTargetAtTime(on?this.level*.31:this.level,n,on?.12:.50);}
 setVolume(v){this.level=Number(v);if(this.ctx)this.setDucking(false);}
 note(midi,when,duration,volume=.1,type='piano'){
  if(!this.ctx)return;
  const ctx=this.ctx,osc=ctx.createOscillator(),g=ctx.createGain(),freq=midiToHz(midi);
  osc.type=type==='flute'?'sine':type==='pad'?'triangle':'sine';osc.frequency.setValueAtTime(freq,when);
  const a=type==='pad'?.55:type==='flute'?.09:.012,release=type==='pad'?1.0:type==='flute'?.29:.65;
  const peak=volume*(type==='piano'?.9:1);
  g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(peak,when+a);
  if(type==='piano')g.gain.exponentialRampToValueAtTime(Math.max(.0004,peak*.18),when+Math.max(a+.04,duration*.65));
  else g.gain.setValueAtTime(peak*.85,when+Math.max(a+.01,duration*.68));
  g.gain.exponentialRampToValueAtTime(.0001,when+duration+release);
  osc.connect(g);g.connect(this.musicBus);osc.start(when);osc.stop(when+duration+release+.06);
  this.oscillators.add(osc);osc.onended=()=>{try{osc.disconnect();g.disconnect();}catch{}this.oscillators.delete(osc);};
 }
 scheduleBeat(beat,time){
  const {mode,seed,mood}=this.config,rootScale=SCALES[mode],harm=CHORDS[mode],chord=harm[Math.floor(beat/4)%4];
  const beatDur=60/this.config.bpm;
  const r=seeded((seed^Math.imul(beat+1,2654435761))>>>0);
  if(beat%4===0){
    for(const note of chord)this.note(note-12,time,beatDur*3.65,.042,'pad');
    this.note(chord[0]-24,time,beatDur*2.8,.09,'piano');
  }
  const degree=(Math.floor(beat*.75)+Math.floor(r()*5)+(seed%4))%rootScale.length;
  // 동요나 반복 단일음이 아니라 4마디의 아치형 선율
  const lift=[0,0,2,4,5,4,2,1,0,2,4,5,3,2,1,0][beat%16];
  const note=57+rootScale[(degree+lift)%rootScale.length];
  if(beat%4!==3 || r()>.25)this.note(note,time+.075,beatDur*.80,mood==='dramatic'?.068:.052,'flute');
  if(beat%2===0){const a=chord[(beat/2)%3],n=a+12;this.note(n,time+beatDur*.5,beatDur*.49,.067,'piano');}
 }
 start(){if(!this.ctx||!this.config)throw Error('작곡 준비가 필요합니다.');this.stop(false);this.step=0;this.nextNoteTime=this.ctx.currentTime+.10;this.interval=setInterval(()=>this.tick(),65);this.tick();}
 tick(){if(!this.interval||!this.ctx||this.ctx.state!=='running')return;const sec=60/this.config.bpm;while(this.nextNoteTime<this.ctx.currentTime+.22){this.scheduleBeat(this.step++,this.nextNoteTime);this.nextNoteTime+=sec;}}
 async pause(){if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){if(this.ctx?.state==='suspended')await this.ctx.resume();}
 stop(hard=true){if(this.interval){clearInterval(this.interval);this.interval=null;}if(hard){for(const osc of this.oscillators){try{osc.stop();}catch{}}this.oscillators.clear();}}
 async attachNarration(element){await this.init();if(this.voiceElement!==element){this.voiceSource?.disconnect();this.voiceElement=element;this.voiceSource=this.ctx.createMediaElementSource(element);this.voiceSource.connect(this.voiceBus);}return this.voiceSource;}
 getMixStream(){return this.capture?.stream;}
 async renderWav(seconds=30){
  if(!this.config)throw Error('시를 먼저 분석해야 합니다.');
  const length=Math.min(120,Math.max(5,seconds));
  const sampleRate=44100;
  const offline=new OfflineAudioContext(2,Math.ceil(length*sampleRate),sampleRate);
  const bus=offline.createGain();bus.gain.value=Math.max(0.1,this.level);bus.connect(offline.destination);
  const eng=new MusicEngine();eng.ctx=offline;eng.musicBus=bus;eng.config=this.config;
  const beats=Math.ceil(length*this.config.bpm/60);
  for(let i=0;i<beats;i++)eng.scheduleBeat(i,i*60/this.config.bpm);
  const buffer=await offline.startRendering();
  const len=buffer.length,channels=buffer.numberOfChannels,arr=new ArrayBuffer(44+len*channels*2),view=new DataView(arr);
  const put=(off,text)=>{for(let i=0;i<text.length;i++)view.setUint8(off+i,text.charCodeAt(i));};
  put(0,'RIFF');view.setUint32(4,36+len*channels*2,true);put(8,'WAVE');put(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels*2,true);
  view.setUint16(32,channels*2,true);view.setUint16(34,16,true);
  put(36,'data');view.setUint32(40,len*channels*2,true);
  let pos=44;const data=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));
  for(let i=0;i<len;i++)for(let c=0;c<channels;c++){
   const x=Math.max(-1,Math.min(1,data[c][i]));view.setInt16(pos,x<0?x*32768:x*32767,true);pos+=2;
  }
  return new Blob([arr],{type:'audio/wav'});
 }
 score(){return {...this.config,instruments:['Piano','Warm strings','Flute'],tempo:'4/4',harmonicCycle:CHORDS[this.config.mode].map(ch=>ch.map(m=>midiToHz(m).toFixed(1)))};}
}





const $=id=>document.getElementById(id);
const scene=new Scene($('screen'));
const music=new MusicEngine();
let analysis=null, syncedText='', syncedTitle='', syncedAuthor='';
let voiceElement=null, voiceUrl=null, voiceMode='browser';
let transport='idle',startedAt=0,pausedAt=0,pausedTotal=0,lastElapsed=0,lead=2.4,outro=3.6,total=35,voiceStarted=false,voiceEnded=false;
let speechIndex=-1,speechToken=0,speechUtterance=null,pendingNext=false,ttsDelay=null,recording=null,recordChunks=[],micRecorder=null,micStream=null,micChunks=[],animateId=0;
const fmt=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const say=(s)=>{$('status').textContent=s;$('stateLabel').textContent=s.length>40?s.slice(0,36)+'…':s;};
const saveBlob=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30_000);};
function analysisRefresh(){
 const poem=$('poemText').value.trim();
 if(!poem)throw Error('시 전문을 입력해 주세요.');
 if(poem.length>4000)throw Error('시 전문은 4,000자 이내로 입력해 주세요.');
 analysis=analyzePoem(poem);
 const title=$('poemTitle').value.trim()||'무제',author=$('poemAuthor').value.trim()||'작가 미상';
 scene.setPoem(title,author,analysis);
 syncedText=poem;syncedTitle=title;syncedAuthor=author;
 music.configure(analysis,poem);
 $('moodBadge').textContent=analysis.summary;
 $('analysisSummary').textContent=analysis.summary;
 $('analysisDetail').textContent=analysis.commentary;
 $('imagePrompt').value=analysis.imagePrompt;
 drawReady();
 return analysis;
}
function ensureAnalyzed(){const title=$('poemTitle').value.trim()||'무제',author=$('poemAuthor').value.trim()||'작가 미상';if(!analysis||syncedText!==$('poemText').value.trim()||syncedTitle!==title||syncedAuthor!==author)analysisRefresh();return analysis;}
function drawReady(){scene.draw(performance.now(),0,'ready');}
function canLiveTts(){return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;}
function femaleKoreanVoice(){
 const voices=window.speechSynthesis.getVoices().filter(v=>/^ko([-_]|$)/i.test(v.lang));
 const preferred=voices.find(v=>/female|여성|yuna|heami|sunhi|jiyun|sora|seoyeon|sooyeon|유나|선희|서연|google.*한국어/i.test(v.name));
 return {voice:preferred||voices[0]||null,verified:!!preferred,available:voices.length};
}
async function setVoice(blob,name='낭송 파일'){
 if(!blob||!blob.size)throw Error('음성 파일이 비어 있습니다.');
 if(blob.size>70_000_000)throw Error('음성 파일은 70MB 이하로 선택해 주세요.');
 stopPerformance(false);
 if(voiceUrl)URL.revokeObjectURL(voiceUrl);
 voiceUrl=URL.createObjectURL(blob);
 voiceElement=new Audio();voiceElement.preload='auto';voiceElement.src=voiceUrl;
 voiceMode='file';
 await new Promise((resolve,reject)=>{let done=false;const okay=()=>{if(done)return;done=true;resolve();};const bad=()=>{if(done)return;done=true;reject(Error('음성 파일을 읽을 수 없습니다. MP3/WAV/WebM 파일로 다시 시도하세요.'));};voiceElement.addEventListener('loadedmetadata',okay,{once:true});voiceElement.addEventListener('error',bad,{once:true});voiceElement.load();});
 say(`낭송 준비 완료: ${name} (${fmt(voiceElement.duration)}) · 이 음성은 영상에 포함됩니다.`);
}
async function makeImage(){if(transport!=='idle')stopPerformance(false);ensureAnalyzed();analysisRefresh();say('시어와 계절·빛을 반영한 16:9 수채화 시화를 그렸습니다.');}
async function aiImage(){
 try{
  stopPerformance(false);ensureAnalyzed();$('aiImageBtn').disabled=true;say('AI 수채화 시화를 생성하고 있습니다. API 사용량에 따른 비용이 발생할 수 있습니다.');
  const response=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:$('imagePrompt').value})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'이미지 생성 실패');
  await scene.setImage(data.image);drawReady();say('AI 고급 수채화 시화가 적용되었습니다. 화면은 16:9로 중앙 크롭됩니다.');
 }catch(e){say(`AI 시화 사용 불가: ${e.message} · 기본 시화 기능은 그대로 사용할 수 있습니다.`);}finally{$('aiImageBtn').disabled=false;}
}
async function aiVoice(){
 try{
  ensureAnalyzed();$('generateVoiceBtn').disabled=true;say('AI 한국어 여성 낭송 음성을 생성 중입니다. API 과금이 발생할 수 있습니다.');
  const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:analysis.lines.join('\n')})});
  if(!response.ok){let data={};try{data=await response.json();}catch{}throw Error(data.error||`HTTP ${response.status}`);}
  const blob=await response.blob();await setVoice(blob,'AI 여성 낭송 MP3');
 }catch(e){say(`AI 낭송 생성 실패: ${e.message}`);}finally{$('generateVoiceBtn').disabled=false;}
}
function elapsed(){if(transport==='idle')return lastElapsed;if(transport==='paused')return Math.max(0,(pausedAt-startedAt-pausedTotal)/1000);return Math.max(0,(performance.now()-startedAt-pausedTotal)/1000);}
function updateControls(){const active=transport==='playing'||transport==='paused';$('playBtn').disabled=active;$('recordBtn').disabled=active;$('pauseBtn').disabled=!active;$('stopBtn').disabled=!active;$('pauseBtn').textContent=transport==='paused'?'▶ 이어읽기':'⏸ 일시정지';}
function nextSpeechLine(token){
 if(token!==speechToken||transport==='idle')return;
 if(transport==='paused'){pendingNext=true;return;}
 if(++speechIndex>=analysis.lines.length){voiceEnded=true;total=elapsed()+outro;music.setDucking(false);say('낭송 완료 · 엔딩 장면');return;}
 const utter=new SpeechSynthesisUtterance(analysis.lines[speechIndex]);
 utter.lang='ko-KR';utter.rate=Number($('ttsSpeed').value);utter.pitch=1;utter.volume=1;
 const sel=femaleKoreanVoice();if(sel.voice)utter.voice=sel.voice;
 speechUtterance=utter;
 utter.onstart=()=>{if(token!==speechToken)return;music.setDucking(true);say(`낭송 중 · ${speechIndex+1}/${analysis.lines.length}행`);};
 utter.onend=()=>{if(token!==speechToken)return;music.setDucking(false);ttsDelay=setTimeout(()=>nextSpeechLine(token),300);};
 utter.onerror=(e)=>{if(token!==speechToken)return;music.setDucking(false);if(e.error==='interrupted'||e.error==='canceled')return;ttsDelay=setTimeout(()=>nextSpeechLine(token),250);};
 window.speechSynthesis.speak(utter);
}
function beginVoice(){
 if(voiceStarted)return;voiceStarted=true;
 if(voiceMode==='file'&&voiceElement){
  voiceElement.currentTime=0;
  music.setDucking(true);
  voiceElement.onended=()=>{if(transport==='idle')return;voiceEnded=true;total=elapsed()+outro;music.setDucking(false);say('음성 낭송 완료 · 엔딩 장면');};
  voiceElement.play().catch(e=>{music.setDucking(false);voiceEnded=true;total=elapsed()+outro;say(`음성 재생 실패: ${e.message}`);});
 }else if(canLiveTts()){
  const sel=femaleKoreanVoice();
  if(!sel.verified)say('브라우저에서 한국어 여성 음성을 확정할 수 없어 설치된 한국어 음성으로 낭독합니다.');
  speechIndex=-1;speechToken++;nextSpeechLine(speechToken);
 }else{
  voiceEnded=true;total=Math.max(16,analysis.lines.join('').length*.22)+outro;
  say('한국어 TTS 미지원 환경: 시화·음악만 재생합니다.');
 }
}
function render(){
 const t=elapsed();lastElapsed=t;
 if(transport==='playing' && !voiceStarted && t>=lead)beginVoice();
 let p=0;
 if(transport!=='idle'){
  if(voiceMode==='file'&&voiceElement&&Number.isFinite(voiceElement.duration)&&voiceElement.duration>0){p=Math.min(1,Math.max(0,(t-lead)/voiceElement.duration));}
  else if(canLiveTts()){p=voiceEnded?1:Math.max(0,(speechIndex+.32)/Math.max(1,analysis.lines.length));}
  else p=Math.min(1,t/Math.max(1,total-outro));
 }
 scene.draw(performance.now(),p,transport==='idle'?'ready':'rolling',speechIndex);
 $('progressBar').style.width=`${Math.min(100,t/Math.max(1,total)*100)}%`;
 $('clock').textContent=`${fmt(t)} / ${fmt(total)}`;
 if(transport==='playing'&&voiceEnded&&t>=total-.05){stopPerformance(true);return;}
 if(transport==='playing')animateId=requestAnimationFrame(render);
}
async function startPerformance(record=false,forceBrowser=false){
 try{
  if(transport!=='idle')stopPerformance(false);
  ensureAnalyzed();
  if(record && (!voiceElement||forceBrowser))throw Error('음성 포함 영상 녹화를 위해 먼저 AI 여성 낭송을 생성하거나 낭송 음성 파일·마이크 녹음을 등록해 주세요. 브라우저 TTS 음성은 영상으로 직접 캡처할 수 없습니다.');
  if(record && (!window.MediaRecorder||!$('screen').captureStream))throw Error('이 브라우저에서는 영상 녹화를 지원하지 않습니다. Chrome 또는 Edge를 사용하세요.');
  await music.init();music.configure(analysis,syncedText);
  voiceMode=(voiceElement&&!forceBrowser)?'file':'browser';
  if(voiceMode==='file')await music.attachNarration(voiceElement);
  if(record){
   const preferred=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
   const mime=preferred.find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw Error('WebM 영상 인코더를 사용할 수 없습니다.');
   const stream=$('screen').captureStream(30);for(const track of music.getMixStream().getAudioTracks())stream.addTrack(track);
   recordChunks=[];recording=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5_000_000});
   recording.ondataavailable=e=>{if(e.data?.size)recordChunks.push(e.data);};
   recording.onerror=e=>say(`녹화 오류: ${e.error?.message||'MediaRecorder 오류'}`);
   recording.onstop=()=>{for(const track of stream.getTracks())track.stop();if(recordChunks.length){const blob=new Blob(recordChunks,{type:'video/webm'});saveBlob(blob,`${safeName(syncedTitle)}_명도재_시화영상.webm`);say(`영상 저장 완료 (${(blob.size/1024/1024).toFixed(1)}MB). 음악과 등록된 낭송 음원이 포함되었습니다.`);}};
   recording.start(300);
  }
  speechIndex=-1;voiceStarted=false;voiceEnded=false;pendingNext=false;speechToken++;
  total=voiceMode==='file'&&Number.isFinite(voiceElement.duration)?lead+voiceElement.duration+outro:Math.max(24,lead+analysis.lines.join('').length*.32+outro);
  startedAt=performance.now();pausedTotal=0;pausedAt=0;transport='playing';lastElapsed=0;
  music.setDucking(false);music.start();
  updateControls();say(record?'● 실시간 영상 녹화 중 · 낭송과 배경음악 동시 합성':'수채화 영상 · 맞춤 음악 · 시낭송 재생 중');
  animateId=requestAnimationFrame(render);
 }catch(e){say(`시작 실패: ${e.message}`);if(transport!=='idle')stopPerformance(false);else if(recording&&recording.state!=='inactive'){recording.stop();recording=null;}}
}
function safeName(s){return String(s||'시화').replace(/[\\/:*?"<>|]/g,'_').slice(0,48);}
async function togglePause(){
 if(transport==='playing'){
  pausedAt=performance.now();transport='paused';
  if(recording?.state==='recording')recording.pause();
  if(voiceMode==='file'&&voiceElement)voiceElement.pause();
  else if(canLiveTts())window.speechSynthesis.pause();
  await music.pause();cancelAnimationFrame(animateId);render();updateControls();say('일시정지 · [이어읽기]로 계속 감상');
 }else if(transport==='paused'){
  pausedTotal+=performance.now()-pausedAt;transport='playing';
  await music.resume();
  if(recording?.state==='paused')recording.resume();
  if(voiceMode==='file'&&voiceElement&&voiceStarted)voiceElement.play().catch(e=>say(`음성 재개 실패: ${e.message}`));
  else if(canLiveTts())window.speechSynthesis.resume();
  if(pendingNext){pendingNext=false;nextSpeechLine(speechToken);}
  updateControls();say('이어읽기 재생 중');animateId=requestAnimationFrame(render);
 }
}
function stopPerformance(finished=false){
 if(transport==='idle'&&!recording)return;
 const wasRecording=!!recording;
 transport='idle';speechToken++;pendingNext=false;clearTimeout(ttsDelay);ttsDelay=null;
 if(canLiveTts())window.speechSynthesis.cancel();
 if(voiceElement){voiceElement.pause();voiceElement.onended=null;try{voiceElement.currentTime=0;}catch{}}
 music.setDucking(false);music.stop();
 cancelAnimationFrame(animateId);animateId=0;
 if(recording){const recorder=recording;recording=null;if(recorder.state!=='inactive')recorder.stop();}
 updateControls();
 if(!wasRecording)say(finished?'시화 음악·낭송 감상 완료':'재생이 정지되었습니다.');
 drawReady();
}
async function startMic(){
 try{
  if(micRecorder&&micRecorder.state==='recording'){micRecorder.stop();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('마이크 녹음 기능은 localhost·HTTPS 환경의 지원 브라우저에서 가능합니다.');
  micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
  const options=['audio/webm;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  micRecorder=new MediaRecorder(micStream,options?{mimeType:options}:{});micChunks=[];
  micRecorder.ondataavailable=e=>{if(e.data.size)micChunks.push(e.data);};
  micRecorder.onstop=async()=>{
   micStream.getTracks().forEach(t=>t.stop());
   $('micBtn').textContent='🎙 마이크 낭송 녹음';
   try{await setVoice(new Blob(micChunks,{type:micRecorder.mimeType||'audio/webm'}),'마이크 낭송 녹음');}
   catch(e){say(e.message);}
  };
  micRecorder.start();$('micBtn').textContent='■ 마이크 녹음 완료';say('마이크로 시를 낭송하세요. 끝나면 [마이크 녹음 완료] 버튼을 누르세요.');
 }catch(e){say(`마이크 오류: ${e.message}`);}
}
function exportPNG(){try{
 ensureAnalyzed();const target=document.createElement('canvas');target.width=1280;target.height=720;const c=target.getContext('2d');
 const img=scene.image||scene.off,w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,scale=Math.max(1280/w,720/h),sw=1280/scale,sh=720/scale;
 c.drawImage(img,(w-sw)/2,(h-sh)/2,sw,sh,0,0,1280,720);
 target.toBlob(blob=>blob&&saveBlob(blob,`${safeName(syncedTitle)}_수채화시화.png`),'image/png');say('시 텍스트 없는 1280×720 수채화 원본 PNG 저장.');
 }catch(e){say(e.message);}}
async function exportMusic(){try{if(transport!=='idle')throw Error('재생을 정지한 후 음악을 저장해 주세요.');ensureAnalyzed();$('musicExportBtn').disabled=true;say('30초 분량 배경음악 WAV 파일을 렌더링하는 중입니다.');const blob=await music.renderWav(30);saveBlob(blob,`${safeName(syncedTitle)}_시화배경음악.wav`);say('맞춤 작곡한 30초 WAV 음악 파일을 저장했습니다.');}catch(e){say(`음악 저장 실패: ${e.message}`);}finally{$('musicExportBtn').disabled=false;}}
function exportProject(){try{ensureAnalyzed();const project={version:1,title:syncedTitle,author:syncedAuthor,poem:syncedText,analysis,composition:music.score(),notes:'이미지·음성 바이너리는 JSON에 포함되지 않습니다.'};saveBlob(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),`${safeName(syncedTitle)}_명도재_프로젝트.json`);say('시 전문·분석·악곡 구조가 JSON으로 저장되었습니다.');}catch(e){say(e.message);}}
$('analyzeBtn').addEventListener('click',()=>{try{if(transport!=='idle')stopPerformance(false);analysisRefresh();say('시의 정서·계절·대표 시어와 수채화 구도, 곡의 기본 조성을 분석했습니다.');}catch(e){say(e.message);}});
$('drawBtn').addEventListener('click',()=>makeImage().catch(e=>say(e.message)));
$('aiImageBtn').addEventListener('click',aiImage);
$('composeBtn').addEventListener('click',()=>{try{ensureAnalyzed();say(`${analysis.bpm} BPM · ${analysis.mode==='major'?'장조':'단조'} · 피아노·현악·플루트로 맞춤 작곡 완료. [영상 감상]에서 음악이 재생됩니다.`);}catch(e){say(e.message);}});
$('generateVoiceBtn').addEventListener('click',aiVoice);
$('imageFile').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>30_000_000)throw Error('이미지는 30MB 이하로 선택해 주세요.');ensureAnalyzed();await scene.setImage(URL.createObjectURL(f));drawReady();say(`사용자 수채화 이미지 적용: ${f.name}`);}catch(err){say(err.message);}});
$('voiceFile').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(f)await setVoice(f,f.name);}catch(err){say(err.message);}});
$('micBtn').addEventListener('click',startMic);
$('ttsBtn').addEventListener('click',()=>startPerformance(false,true));
$('musicVolume').addEventListener('input',e=>music.setVolume(e.target.value));
$('playBtn').addEventListener('click',()=>startPerformance());
$('recordBtn').addEventListener('click',()=>startPerformance(true));
$('pauseBtn').addEventListener('click',()=>togglePause().catch(e=>say(`일시정지 오류: ${e.message}`)));
$('stopBtn').addEventListener('click',()=>stopPerformance(false));
$('pngBtn').addEventListener('click',exportPNG);
$('musicExportBtn').addEventListener('click',exportMusic);
$('projectBtn').addEventListener('click',exportProject);
window.addEventListener('beforeunload',()=>{if(voiceUrl)URL.revokeObjectURL(voiceUrl);});
try{analysisRefresh();}catch(e){say(e.message);}
if(window.location.protocol==='file:'){
 $('apiStatus').textContent='설치 없는 기본 창작 모드';
 $('aiImageBtn').disabled=true;$('aiImageBtn').title='서버 실행 버전에서만 사용할 수 있습니다.';
 $('generateVoiceBtn').disabled=true;$('generateVoiceBtn').title='서버 실행 버전에서만 사용할 수 있습니다.';
}else{
 fetch('/api/status').then(r=>r.json()).then(info=>{$('apiStatus').textContent=info.configured?'AI 이미지·낭송 API 연동 가능':'무료 기본 창작 모드 · AI API 미설정';}).catch(()=>{$('apiStatus').textContent='기본 창작 모드';});
}

