const $ = id => document.getElementById(id);
const els = {
  input:$('poemInput'),paint:$('paintBtn'),compose:$('musicBtn'),play:$('playBtn'),pause:$('pauseBtn'),resume:$('resumeBtn'),stop:$('stopBtn'),
  record:$('movieBtn'),save:$('pngBtn'),pace:$('pace'),paceValue:$('paceValue'),status:$('status'),clock:$('clock'),playState:$('playState'),track:$('track'),mood:$('mood'),canvas:$('screen')
};
const V={W:1280,H:720,TAU:Math.PI*2};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const seeded=n=>{let s=n>>>0;return()=>((s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296);};
function hash(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const sample=(r,a,b)=>a+(b-a)*r();
const setStatus=txt=>{els.status.textContent=txt;};
const fmt=s=>{s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const safeName=s=>(s||'명도재_시화').replace(/[\\/:*?"<>|]/g,'_').slice(0,70);
function download(blob,filename){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}

function parsePoem(raw){
 const text=String(raw||'').replace(/\r\n?/g,'\n').trim();
 const rows=text.split('\n');while(rows.length&&rows[0].trim()==='')rows.shift();
 const title=(rows.shift()||'무제').replace(/^제목\s*[:：]\s*/,'').trim();
 const author=(rows.shift()||'작가 미상').replace(/^(시인|작가|글)\s*[:：]\s*/,'').trim();
 const body=rows.join('\n').trim();
 const lines=body.split('\n').map(s=>s.trim()).filter(Boolean);
 if(!title||!lines.length)throw Error('첫 줄에 제목, 둘째 줄에 작가, 그 아래에 시 본문을 입력해 주세요.');
 return {title,author:author||'작가 미상',body,lines,raw:text};
}
const MOTIFS=[
 ['pomegranate',/석류|홍시/,'석류와 열매'],['cottage',/빈집|초가|고향집|돌담|담장|기왓|마당|시산방/,'오래된 집'],
 ['water',/호수|시냇물|물결|물비늘|물가|강물|바다|강가|신천|못둑|저수지|연못/,'강과 물빛'],
 ['boat',/돛배|나룻배|고깃배|쪽배|뱃사공|배 한 척/,'물 위의 배'],
 ['moon',/달빛|보름달|초승달|낮달|달이|달은|달을|달이여|달무리/,'달'],
 ['stars',/별빛|은하수|밤하늘|별이|별들|별을/,'별자리'],
 ['flowers',/꽃|나리|코스모스|동백|민들레|진달래|매화|연꽃/,'꽃'],
 ['rain',/빗방울|비바람|소나기|장맛비|비가|비는|비를|비에|비 갠|빗소리/,'비'],
 ['snow',/눈꽃|함박눈|눈보라|설원|눈이 내|흰 눈/,'눈'],
 ['birds',/까치|기러기|두루미|부엉이|갈매기|새들이|새가|새 한 마리/,'새'],
 ['reed',/갈대|억새/,'갈대'],['bench',/벤치/,'빈 벤치'],['umbrella',/우산/,'우산'],
 ['lantern',/등불|초롱|불빛|등잔/,'등불'],['bridge',/돌다리|징검다리|교각|육교|다리를 건너|다리 위/,'다리'],['mountain',/앞산|팔공산|산자락|산봉우리|산길|산맥/,'산'],
 ['leaves',/낙엽|단풍|잎새|풀잎/,'나뭇잎'],['sunlight',/햇살|햇빛|태양|석양|노을/,'햇빛']
];
function analyze(poem){
 const t=poem.body, m=MOTIFS.filter(([,re])=>re.test(t)).map(([key,,label])=>({key,label}));
 const has=k=>m.some(x=>x.key===k);
 const season=/겨울|눈보라|설원|얼어붙|서리/.test(t)?'winter':/가을|석류|홍시|단풍|낙엽|시월/.test(t)?'autumn':/봄|매화|진달래|새싹|벚꽃/.test(t)?'spring':/여름|장마|뙤약볕|폭염/.test(t)?'summer':'neutral';
 const night=has('moon')||has('stars')||/밤|자정|어둠/.test(t);const sunset=/노을|석양|황혼/.test(t);const time=night?'night':sunset?'sunset':'day';
 const scores={longing:0,hope:0,peace:0,dramatic:0};
 for(const x of ['그리움','기다','그립','외로','빈집','떠나','이별','눈물','쓸쓸','고향'])scores.longing+=(t.match(new RegExp(x,'g'))||[]).length;
 for(const x of ['희망','햇살','웃음','꽃','사랑','피어나','따뜻','행복'])scores.hope+=(t.match(new RegExp(x,'g'))||[]).length;
 for(const x of ['고요','하늘','물결','바람','평온','침묵','빛','달'])scores.peace+=(t.match(new RegExp(x,'g'))||[]).length;
 for(const x of ['비바람','불꽃','격랑','붉','열정','아픔','뜨거'])scores.dramatic+=(t.match(new RegExp(x,'g'))||[]).length;
 const mood=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][1]>0?Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0]:'peace';
 const label={longing:'그리움',hope:'희망',peace:'명상',dramatic:'열정'}[mood];
 const themes=m.length?m.map(x=>x.label).slice(0,6).join('·'):'자연과 내면';
 const palette={
 autumn:{sky:['#182842','#294e72','#744666','#c57158','#eca16b','#f8d88c'],mount:['#233b5b','#395768','#6d5a75','#7c8175'],ground:['#214d60','#387866','#ba6248','#e9ae5e'],accent:['#e95848','#f7a843','#ffd76f','#bc3e55','#f9c37c']},
 spring:{sky:['#1f456a','#356b8e','#6898ad','#ce8aa8','#f8bfd0','#fadfa2'],mount:['#31617a','#668a8a','#87b19c','#c7a0a3'],ground:['#327e75','#61a58b','#98c48f','#f3ce9a'],accent:['#f7acc4','#eab1e2','#8ae8ce','#fae18a','#e66c91']},
 summer:{sky:['#0d385c','#176b91','#43a5c6','#6cd0cc','#f0e3aa','#f5a663'],mount:['#215d79','#3e8d93','#317769','#6bb1a1'],ground:['#246d75','#258a79','#79b48a','#d6c17b'],accent:['#ffa25b','#e3d27b','#43d4bb','#f3e9a2','#e45f5a']},
 winter:{sky:['#172d58','#49648b','#7a9ac3','#aac5d9','#dfeef3','#e7d3dc'],mount:['#345578','#557f9d','#87a7b9','#ccd9db'],ground:['#3e6083','#80a3bd','#b8d3e0','#d0dbe1'],accent:['#e7ebfc','#acd6f7','#c8a6e5','#f8e8c9','#8dcbdc']},
 neutral:{sky:['#192c4d','#2f5574','#678da0','#a88ca2','#e9b98b','#f3d3a0'],mount:['#244e63','#407486','#6d8c8d','#96aaa2'],ground:['#2c6176','#4e8278','#93a98a','#d4bd85'],accent:['#f3ca77','#d7a0ad','#5db1b9','#e9ae77','#f9dda5']}
 }[season];
 return {...poem,m,has,season,time,mood,label,themes,palette,bpm:{longing:62,hope:78,peace:68,dramatic:84}[mood],mode:['longing','dramatic'].includes(mood)?'minor':'major',seed:hash(poem.raw)};
}

const art=document.createElement('canvas');art.width=V.W;art.height=V.H;const g=art.getContext('2d');
function polygon(points,color,alpha=1,width=2.8){
 if(points.length<3)return;
 const xs=points.map(x=>x[0]),ys=points.map(x=>x[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const lin=g.createLinearGradient(minX,minY,maxX+3,maxY+3);lin.addColorStop(0,'#eafcff');lin.addColorStop(.08,color);lin.addColorStop(.66,color);lin.addColorStop(1,'#132332');
 g.save();g.globalAlpha=alpha;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=lin;g.fill();g.strokeStyle='rgba(12,20,30,.94)';g.lineWidth=width;g.lineJoin='round';g.stroke();
 g.strokeStyle='rgba(250,236,205,.23)';g.lineWidth=Math.max(.4,width*.36);g.stroke();g.restore();
}
function irregularRect(x,y,w,h,r,cArr,j=.17,alpha=.97){
 const a=[[x+sample(r,-j,j)*w,y+sample(r,-j,j)*h],[x+w+sample(r,-j,j)*w,y+sample(r,-j,j)*h],[x+w+sample(r,-j,j)*w,y+h+sample(r,-j,j)*h],[x+sample(r,-j,j)*w,y+h+sample(r,-j,j)*h]];
 polygon(a,pick(r,cArr),alpha,sample(r,1.8,3.5));
}
function tiledArea(yTop,yBottom,pal,r,{cols=22,rows=10}={}){
 const dx=V.W/cols,dy=(yBottom-yTop)/rows,pts=[];
 for(let i=0;i<=rows;i++) {const a=[];for(let j=0;j<=cols;j++) a.push([j*dx+(j&&j<cols?sample(r,-dx*.23,dx*.23):0),yTop+i*dy+(i&&i<rows?sample(r,-dy*.22,dy*.22):0)]);pts.push(a);}
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
  const a=pts[i][j],b=pts[i][j+1],c=pts[i+1][j+1],d=pts[i+1][j];
  if(r()>.48){const m=[(a[0]+b[0]+c[0]+d[0])/4+sample(r,-7,7),(a[1]+b[1]+c[1]+d[1])/4+sample(r,-7,7)];polygon([a,b,m],pick(r,pal),.94,2.1);polygon([b,c,m],pick(r,pal),.94,2.1);polygon([c,d,m],pick(r,pal),.94,2.1);polygon([d,a,m],pick(r,pal),.94,2.1);}
  else polygon([a,b,c,d],pick(r,pal),.96,2.8);
 }
}
function rays(cx,cy,r,pal,rnd){
 g.save();g.shadowColor='#f9d489';g.shadowBlur=62;g.fillStyle='#fbdca7';g.beginPath();g.arc(cx,cy,r*.87,0,V.TAU);g.fill();g.restore();
 for(let ring=0;ring<3;ring++){const n=ring===0?24:ring===1?48:60;const aR=[r*.41,r*.89,r*1.34][ring],bR=[r*.88,r*1.32,r*1.76][ring];
  for(let i=0;i<n;i++){const a=i/n*V.TAU,b=(i+1)/n*V.TAU;
   polygon([[cx+Math.cos(a)*aR,cy+Math.sin(a)*aR],[cx+Math.cos(a)*bR,cy+Math.sin(a)*bR],[cx+Math.cos(b)*bR,cy+Math.sin(b)*bR],[cx+Math.cos(b)*aR,cy+Math.sin(b)*aR]],pick(rnd,pal),ring===2?.45:.92,2.6);}}
}
function hillside(base,color,r,amp=90){
 const ridge=[];for(let x=0;x<=1280;x+=68)ridge.push([x,base-amp*(.2+r()*.8)-Math.sin(x/152)*35]);
 polygon([[0,720],...ridge,[1280,720]],color,.91,5);
 for(let j=0;j<ridge.length-1;j++){
  const a=ridge[j],b=ridge[j+1],m=[(a[0]+b[0])/2,Math.min(680,(a[1]+b[1])/2+80+r()*130)];polygon([a,b,m],color,.22,2.9);
 }
}
function river(r,pal){
 tiledArea(438,720,[pal.sky[0],pal.mount[1],pal.ground[0],pal.sky[2],pal.accent[3]],r,{cols:20,rows:7});
 for(let i=0;i<90;i++){let x=r()*1280,y=450+r()*250,len=10+r()*70;polygon([[x,y],[x+len,y-3-r()*5],[x+len*.75,y+3],[x+len*.1,y+5]],pick(r,['#e8ce9a','#b1d9df','#79bccc','#466c9c']),.2+r()*.23,1.2);}
}
function paths(c,points,width,color){c.save();c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.strokeStyle='rgba(14,24,30,.95)';c.lineCap='round';c.lineJoin='round';c.lineWidth=width+6;c.stroke();c.strokeStyle=color;c.lineWidth=width;c.stroke();c.restore();}
function tree(cx,base,scale,pal,r,{fruit=false}={}){
 g.save();g.translate(cx,base);g.scale(scale,scale);
 paths(g,[[0,15],[-5,-100],[-45,-171],[-122,-215]],14,'#87644c');paths(g,[[-3,-100],[33,-177],[101,-230]],15,'#987251');paths(g,[[0,-125],[12,-220],[-35,-294]],12,'#735e4d');
 const leafPal=pal.accent.concat(pal.ground).concat(['#f1c66f','#a5a0c8']);
 for(let j=0;j<45;j++){
  const x=sample(r,-158,158),y=sample(r,-328,-140),rr=sample(r,14,39),n=5+Math.floor(r()*4),pts=[];
  for(let k=0;k<n;k++){const a=k/n*V.TAU;pts.push([x+Math.cos(a)*rr*sample(r,.66,1.12),y+Math.sin(a)*rr*sample(r,.65,1.2)]);}
  polygon(pts,pick(r,leafPal),.94,3.2);
 }
 if(fruit){for(let j=0;j<24;j++){let x=sample(r,-128,126),y=sample(r,-283,-145),rr=sample(r,5,12);const pts=[];for(let k=0;k<7;k++){let a=k/7*V.TAU;pts.push([x+rr*Math.cos(a),y+rr*Math.sin(a)]);}polygon(pts,pick(r,['#a41e42','#d52c43','#eb5d50','#e98b4f']),.97,2.8);}}
 g.restore();
}
function lantern(x,y,s,r){
 g.save();g.translate(x,y);g.scale(s,s);g.shadowColor='#ffd881';g.shadowBlur=25;
 polygon([[-16,-19],[0,-32],[18,-18],[14,18],[0,31],[-15,18]],pick(r,['#ffda8b','#ffbe69','#ffa45b']),.96,3);
 g.restore();
}
function cottage(x,y,s,r,pal){
 g.save();g.translate(x,y);g.scale(s,s);
 polygon([[-138,-6],[-126,-127],[112,-127],[122,-3]],'#ba9478',.98,5);
 for(let iy=0;iy<5;iy++)for(let ix=0;ix<9;ix++)irregularRect(-117+ix*25,-113+iy*22,26,23,r,[...pal.accent,'#bba58c','#8f8998'],.1,.67);
 polygon([[-158,-118],[-90,-210],[35,-237],[153,-132],[104,-132],[-105,-144]],'#4c4250',.97,5);
 for(let i=0;i<14;i++)polygon([[-116+i*19,-145],[-95+i*17,-202+r()*10],[-76+i*17,-180+r()*15]],pick(r,['#8e494f','#8b6672','#a58589','#d48767']),.82,3);
 polygon([[-20,-3],[-16,-73],[31,-73],[34,-3]],'#2c3b4b',1,4);lantern(3,-40,.35,r);
 for(const x2 of [-88,77]){
  polygon([[x2-18,-59],[x2-18,-103],[x2+16,-103],[x2+16,-59]],'#ffd7a2',.9,4);
  paths(g,[[x2,-103],[x2,-59]],3,'#523b38');paths(g,[[x2-18,-81],[x2+16,-81]],3,'#523b38');
 }
 g.restore();
}
function boat(x,y,s,r){
 g.save();g.translate(x,y);g.scale(s,s);polygon([[-85,0],[96,0],[60,33],[-62,33]],'#644c56',1,4);
 paths(g,[[0,0],[0,-154]],5,'#ccaa7a');polygon([[0,-149],[-78,-16],[0,-16]],'#e7d6ab',.85,4);polygon([[6,-149],[69,-22],[6,-20]],'#e4a36e',.79,4);g.restore();
}
function person(x,y,s,r){
 g.save();g.translate(x,y);g.scale(s,s);const col=pick(r,['#485477','#906f7c','#a66b64']);
 const pts=[];for(let i=0;i<9;i++){let a=i/9*V.TAU;pts.push([Math.cos(a)*14,Math.sin(a)*14-86]);}polygon(pts,'#c9a89c',.95,2.8);
 polygon([[-18,-67],[18,-67],[31,-1],[-28,-1]],col,.93,3);paths(g,[[-12,0],[-14,37]],6,'#443b45');paths(g,[[13,0],[18,37]],6,'#443b45');g.restore();
}
function bench(x,y,s){g.save();g.translate(x,y);g.scale(s,s);for(let i=0;i<2;i++)polygon([[-120,-43+i*23],[120,-43+i*23],[120,-30+i*23],[-120,-30+i*23]],i?'#b35d85':'#d68b9f',.9,4);polygon([[-122,7],[122,7],[120,21],[-120,21]],'#ae739a',.95,4);paths(g,[[-93,20],[-105,55]],7,'#665b64');paths(g,[[90,20],[105,55]],7,'#665b64');g.restore();}
function flowers(x,y,r,count=38,scale=1){
 for(let i=0;i<count;i++){
  const fx=x+sample(r,-160,160),fy=y+sample(r,-55,60),rr=sample(r,5,13)*scale;
  paths(g,[[fx,fy+28],[fx+sample(r,-9,9),fy]],2.5,'#618979');
  for(let k=0;k<6;k++){
   const a=k/6*V.TAU,pt=[[fx,fy],[fx+Math.cos(a-.31)*rr*1.9,fy+Math.sin(a-.31)*rr*1.9],[fx+Math.cos(a+.3)*rr*1.9,fy+Math.sin(a+.3)*rr*1.9]];
   polygon(pt,pick(r,['#f0c47d','#ffc3c0','#dc86af','#ed8f6a','#e4e0bd','#8fd5c8']),.91,1.7);
  }
  polygon([[fx-3,fy],[fx,fy-3],[fx+3,fy],[fx,fy+3]],'#f9edb6',.99,1.4);
 }
}
function reeds(r){for(let i=0;i<65;i++){
 const x=sample(r,15,1270),y=sample(r,570,760),ht=sample(r,45,153);paths(g,[[x,y],[x+10,y-ht]],2.4,'#a9b289');
 const tops=[];for(let k=0;k<6;k++){let a=k/6*V.TAU;tops.push([x+10+Math.cos(a)*6,y-ht+Math.sin(a)*22]);}polygon(tops,pick(r,['#d2a879','#c59e9a','#967e7a','#f0c67e']),.87,2.1);
 }}
function birds(r,n=16){for(let i=0;i<n;i++){
 const x=sample(r,320,1150),y=sample(r,80,360),s=sample(r,5,18);
 paths(g,[[x-s,y+s*.3],[x,y],[x+s,y-s*.3]],2.4,pick(r,['#283147','#384158','#5b5067']));
 }}
function rain(r){for(let i=0;i<125;i++){
 const x=r()*1280,y=r()*720,h=sample(r,8,40);polygon([[x,y],[x+5,y+2],[x-10,y+h],[x-14,y+h-2]],'#bee7f4',.33,1.3);
 }}
function snow(r){for(let i=0;i<115;i++){
 const x=r()*1280,y=r()*720,s=sample(r,3,8);polygon([[x-s,y],[x,y-s],[x+s,y],[x,y+s]],'#f3f7ff',.75,1.2);
 }}
function petals(r){for(let i=0;i<42;i++){
 const x=r()*1280,y=r()*720,a=r()*V.TAU,s=sample(r,4,16);polygon([[x,y],[x+s*Math.cos(a),y+s*Math.sin(a)],[x+s*.8*Math.cos(a+1),y+s*.8*Math.sin(a+1)]],pick(r,['#f5c68b','#ea839a','#a9d1a0']),.38,1);
 }}
function umbrella(x,y,s){g.save();g.translate(x,y);g.scale(s,s);paths(g,[[0,-2],[0,-88],[11,-100]],5,'#423944');const pts=[[-70,-90],[-43,-138],[0,-153],[45,-133],[72,-88]];for(let i=0;i<4;i++)polygon([[0,-104],pts[i],pts[i+1]],i%2?'#efba98':'#c97b86',.95,3);g.restore();}
function moonStars(r){for(let i=0;i<70;i++){const x=r()*1280,y=r()*395,s=sample(r,1,4);g.save();g.globalAlpha=.65;g.fillStyle='#f9e9ba';g.fillRect(x,y,s,s);g.restore();}}
function frame(r,pal){
 for(let i=0;i<18;i++){
  irregularRect(0,i*40,26,43,r,pal.accent,.06,.85);
  irregularRect(1254,i*40,26,43,r,pal.accent,.06,.85);
 }
 for(let j=0;j<28;j++){
  irregularRect(j*46,0,48,22,r,pal.accent,.05,.82);
  irregularRect(j*46,698,48,22,r,pal.accent,.05,.82);
 }
 g.strokeStyle='#18232c';g.lineWidth=12;g.strokeRect(15,15,1250,690);g.strokeStyle='#d3ae73';g.lineWidth=2.2;g.strokeRect(24,24,1232,672);
}
function renderStainedArt(a){
 const r=seeded(a.seed),p=a.palette;
 g.clearRect(0,0,V.W,V.H);g.fillStyle='#142233';g.fillRect(0,0,V.W,V.H);
 tiledArea(0,455,p.sky,r,{cols:24,rows:9});
 if(a.time==='night')moonStars(r);
 g.save();g.globalCompositeOperation='screen';const light=g.createRadialGradient(992,153,4,992,153,560);light.addColorStop(0,'rgba(255,234,153,.48)');light.addColorStop(.45,'rgba(255,175,127,.17)');light.addColorStop(1,'rgba(255,233,173,0)');g.fillStyle=light;g.fillRect(0,0,V.W,V.H);g.restore();
 rays(982,155,a.time==='night'?41:64,a.time==='night'?['#f6e3b9','#a6bde8','#dfc6d7','#ffeac9']:['#f9e0a6','#f3a46b','#e67b82','#fff1be'],r);
 hillside(374,p.mount[0],r,145);hillside(442,p.mount[1],r,95);hillside(542,p.mount[2],r,100);
 if(a.has('water')||a.has('boat'))river(r,p);
 else tiledArea(512,720,p.ground.concat(p.accent),r,{cols:20,rows:5});
 // 겹쳐진 상징: 시에 등장하는 요소를 중심으로 복수의 이야기 공간을 구성합니다.
 if(a.has('cottage'))cottage(360,525,.77,r,p);
 if(a.has('bridge')&&a.has('water')){
  for(let i=0;i<7;i++)polygon([[430+i*54,532],[480+i*54,524],[476+i*54,552],[435+i*54,556]],pick(r,p.accent),.9,3);
 }
 if(a.has('boat'))boat(865,575,.71,r);
 if(a.has('pomegranate')){tree(a.has('cottage')?165:245,598,1.16,p,r,{fruit:true});tree(1082,610,.85,p,r,{fruit:true});}
 else{tree(a.has('cottage')?160:245,602,1.08,p,r);tree(1100,604,.78,p,r);}
 if(a.has('bench'))bench(806,608,.6);
 if(a.has('umbrella'))umbrella(924,566,.7);
 if(a.has('birds'))birds(r,25);
 if(a.has('reed'))reeds(r);
 if(a.has('flowers')||a.season==='spring')flowers(750,627,r,55,1.1);
 else flowers(644,650,r,24,.8);
 if(a.has('lantern')){for(let i=0;i<7;i++)lantern(660+i*75,480+Math.sin(i)*40,.8,r);}
 if(a.has('rain'))rain(r);
 if(a.has('snow'))snow(r);
 if(a.has('leaves')||a.season==='autumn')petals(r);
 if(a.mood==='longing'&&a.has('cottage'))person(558,587,.7,r);
 // 분할된 유리의 빛의 잔상 / 리드 프레임 / 모서리 소형 유리 조각
 for(let i=0;i<85;i++){
  const x=sample(r,35,1245),y=sample(r,28,690),sz=sample(r,3,11);
  polygon([[x-sz,y],[x,y-sz],[x+sz,y],[x,y+sz]],pick(r,p.accent),sample(r,.18,.48),1.05);
 }
 frame(r,p);
 // 은은한 광택과 입체 유리 표현
 const vignette=g.createRadialGradient(645,340,260,645,340,840);
 vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(2,8,16,.36)');g.fillStyle=vignette;g.fillRect(0,0,V.W,V.H);
}

// Music-only engine. No text-to-speech, microphone recording or voice track.
const midiHz=n=>440*Math.pow(2,(n-69)/12);
class MusicEngine{
 constructor(){this.ctx=null;this.bus=null;this.master=null;this.dest=null;this.timer=null;this.notes=new Set();this.step=0;this.next=0;this.cfg=null;this.running=false;}
 async init(){
  if(!this.ctx){
   this.ctx=new (window.AudioContext||window.webkitAudioContext)();
   this.master=this.ctx.createDynamicsCompressor();this.master.threshold.value=-19;this.master.ratio.value=2.5;this.master.attack.value=.012;this.master.release.value=.22;
   this.bus=this.ctx.createGain();this.bus.gain.value=.42;this.bus.connect(this.master);
   this.dest=this.ctx.createMediaStreamDestination();this.master.connect(this.ctx.destination);this.master.connect(this.dest);
  }
  if(this.ctx.state==='suspended')await this.ctx.resume();
 }
 configure(a){this.cfg=a;this.rnd=seeded(a.seed^0x4a215c7d);}
 note(midi,time,length,amp,instrument){
  if(!this.ctx)return;
  const os=this.ctx.createOscillator(),env=this.ctx.createGain();
  os.type=instrument==='flute'?'sine':instrument==='strings'?'triangle':'sine';os.frequency.setValueAtTime(midiHz(midi),time);
  const attack=instrument==='strings'?.5:instrument==='flute'?.07:.009,release=instrument==='strings'?1.2:.32;
  env.gain.setValueAtTime(.0001,time);env.gain.linearRampToValueAtTime(amp,time+attack);
  env.gain.exponentialRampToValueAtTime(Math.max(.0003,amp*.22),time+Math.max(attack+.1,length*.72));env.gain.exponentialRampToValueAtTime(.0001,time+length+release);
  os.connect(env);env.connect(this.bus);os.start(time);os.stop(time+length+release+.05);
  this.notes.add(os);os.onended=()=>{this.notes.delete(os);try{os.disconnect();env.disconnect();}catch{}};
 }
 beat(step,t){
  const mode=this.cfg?.mode==='minor'?'minor':'major';
  const chords=mode==='minor'?[[57,60,64],[53,57,60],[60,64,67],[55,59,62]]:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
  const scale=mode==='minor'?[0,2,3,5,7,8,10,12,14,15]:[0,2,4,5,7,9,11,12,14,16];
  const chord=chords[Math.floor(step/4)%4],dur=60/(this.cfg?.bpm||68);
  if(step%4===0){for(const n of chord)this.note(n-12,t,dur*3.8,.055,'strings');this.note(chord[0]-24,t+.02,dur*1.4,.12,'piano');}
  if(step%2===0)this.note(chord[(step/2)%3]+12,t+dur*.46,dur*.56,.083,'piano');
  const arches=[0,2,4,5,6,5,3,1,0,2,3,4,5,2,1,0],idx=(arches[step%16]+Math.floor((this.cfg.seed%7))+(step>>4))%scale.length;
  if(step%4!==3||this.rnd()>.3)this.note(57+scale[idx],t+.04,dur*.86,.061,'flute');
 }
 tick(){if(!this.running||!this.ctx||this.ctx.state!=='running')return;const d=60/(this.cfg?.bpm||68);while(this.next<this.ctx.currentTime+.20){this.beat(this.step++,this.next);this.next+=d;}}
 start(){if(!this.ctx||!this.cfg)return;this.stop();this.running=true;this.next=this.ctx.currentTime+.08;this.step=0;this.timer=setInterval(()=>this.tick(),55);this.tick();}
 stop(){this.running=false;if(this.timer)clearInterval(this.timer);this.timer=null;for(const n of this.notes){try{n.stop();}catch{}}this.notes.clear();}
 async pause(){if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){if(this.ctx?.state==='suspended')await this.ctx.resume();}
 mixedStream(){return this.dest?.stream;}
}
const music=new MusicEngine(),display=els.canvas.getContext('2d');
const studio={poem:null,artHash:0,playing:false,paused:false,line:-1,progress:0,recording:null,chunks:[],captureStream:null,startAt:0,pauseAt:0,pausedTime:0,elapsed:0,duration:0,lineSeconds:4,previewUntil:0,finished:false};
function durationFor(a){return 4+a.lines.length*Number(els.pace.value)+3;}
function refreshArt(force=false){
 const poem=parsePoem(els.input.value);
 if(force||studio.artHash!==hash(poem.raw)){
  if(studio.playing)stopAll(true);
  studio.poem=analyze(poem);studio.artHash=hash(poem.raw);renderStainedArt(studio.poem);music.configure(studio.poem);
  els.mood.textContent=`${studio.poem.label} · ${studio.poem.themes} · ${studio.poem.m.length}개 상징`;
  studio.line=-1;studio.progress=0;studio.elapsed=0;
 }
 studio.lineSeconds=Number(els.pace.value);studio.duration=durationFor(studio.poem);
 draw();return studio.poem;
}
function draw(){
 const ctx=display,now=performance.now();ctx.clearRect(0,0,V.W,V.H);
 if(art.width){
  const zoom=1.012+Math.sin(now/8200)*.006,dw=V.W*zoom,dh=V.H*zoom;
  ctx.drawImage(art,(V.W-dw)/2+Math.sin(now/10500)*3,(V.H-dh)/2+Math.cos(now/12900)*3,dw,dh);
 }
 const beam=(now/15000)%1,glow=ctx.createLinearGradient(-450+beam*1700,0,250+beam*1700,0);
 glow.addColorStop(0,'rgba(255,252,211,0)');glow.addColorStop(.5,'rgba(255,249,201,.042)');glow.addColorStop(1,'rgba(255,252,211,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,V.W,V.H);
 if(!studio.poem)return;
 ctx.save();ctx.shadowColor='rgba(0,0,0,.75)';ctx.shadowBlur=18;
 ctx.fillStyle='rgba(6,15,23,.66)';ctx.fillRect(55,43,690,106);ctx.strokeStyle='rgba(243,207,142,.62)';ctx.lineWidth=2;ctx.strokeRect(55,43,690,106);
 ctx.shadowBlur=0;ctx.fillStyle='#ffebc3';ctx.font='bold 40px serif';ctx.textAlign='left';ctx.fillText(studio.poem.title,77,94,620);
 ctx.fillStyle='#f1f4ed';ctx.font='23px sans-serif';ctx.fillText(`시 · ${studio.poem.author}`,79,128,595);ctx.restore();
 const y0=431,h=239,center=y0+113,lines=studio.poem.lines,sub=studio.line<0?0:studio.line+studio.progress;
 ctx.fillStyle='rgba(6,12,22,.70)';ctx.fillRect(55,y0,1170,h);
 ctx.strokeStyle='rgba(239,209,149,.51)';ctx.lineWidth=2;ctx.strokeRect(55,y0,1170,h);
 ctx.save();ctx.beginPath();ctx.rect(58,y0+2,1164,h-4);ctx.clip();ctx.textAlign='center';
 for(let i=0;i<lines.length;i++){
  const yy=center+(i-sub)*45;if(yy<y0-30||yy>y0+h+25)continue;
  const dist=Math.abs(i-sub),active=studio.playing&&i===studio.line,fade=clamp(1-dist*.21,.20,1);
  ctx.shadowColor=active?'rgba(243,169,74,.9)':'rgba(0,0,0,.7)';ctx.shadowBlur=active?20:5;
  ctx.fillStyle=active?`rgba(255,218,136,${fade})`:i<sub?`rgba(175,201,213,${fade*.94})`:`rgba(247,250,242,${fade})`;
  ctx.font=active?'bold 34px sans-serif':'500 30px sans-serif';ctx.fillText(lines[i],640,yy,1070);
 }
 ctx.restore();
}
function tick(now){
 if(studio.playing&&!studio.paused){
  studio.elapsed=clamp((now-studio.startAt-studio.pausedTime)/1000,0,studio.duration);
  const textElapsed=studio.elapsed-4;
  if(textElapsed<0){studio.line=-1;studio.progress=0;}
  else if(textElapsed<studio.poem.lines.length*studio.lineSeconds){
   const pos=textElapsed/studio.lineSeconds;studio.line=Math.floor(pos);studio.progress=pos-studio.line;
  }else{studio.line=studio.poem.lines.length-1;studio.progress=1;}
  if(studio.elapsed>=studio.duration)finishPlayback();
  els.track.style.width=`${Math.min(100,studio.duration?studio.elapsed/studio.duration*100:0)}%`;
 }
 if(!studio.playing&&studio.previewUntil&&now>studio.previewUntil){music.stop();studio.previewUntil=0;}
 els.clock.textContent=`${fmt(studio.elapsed)} / ${fmt(studio.duration)}`;
 draw();requestAnimationFrame(tick);
}
function updateControls(){
 els.play.disabled=studio.playing;els.pause.disabled=!studio.playing||studio.paused;
 els.resume.disabled=!studio.playing||!studio.paused;els.stop.disabled=!studio.playing;
 els.record.disabled=studio.playing||!!studio.recording;els.compose.disabled=studio.playing;els.paint.disabled=studio.playing;
 els.pace.disabled=studio.playing;
}
function stopAll(silent=false){
 music.stop();studio.playing=false;studio.paused=false;studio.line=-1;studio.progress=0;studio.elapsed=0;
 if(studio.recording&&studio.recording.state!=='inactive')studio.recording.stop();
 els.playState.textContent='정지';els.track.style.width='0%';updateControls();
 if(!silent)setStatus('영상 재생을 정지했습니다.');
}
function finishPlayback(){
 if(!studio.playing)return;
 studio.playing=false;studio.paused=false;studio.elapsed=studio.duration;studio.line=studio.poem.lines.length-1;studio.progress=1;
 music.stop();els.playState.textContent='재생 완료';els.track.style.width='100%';updateControls();
 if(studio.recording?.state!=='inactive'&&studio.recording)studio.recording.stop();
 else setStatus('시화 자막과 음악 영상의 재생이 끝났습니다.');
}
async function perform(withRecording=false){
 if(studio.playing)stopAll(true);
 refreshArt();await music.init();music.configure(studio.poem);studio.previewUntil=0;
 if(withRecording){
  if(!window.MediaRecorder||!els.canvas.captureStream)throw Error('현재 브라우저는 영상 녹화를 지원하지 않습니다.');
  const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const mime=types.find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw Error('영상 인코더를 사용할 수 없습니다.');
  const stream=els.canvas.captureStream(30);for(const track of music.mixedStream().getAudioTracks())stream.addTrack(track);
  studio.captureStream=stream;studio.chunks=[];
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6_800_000});studio.recording=rec;
  rec.ondataavailable=e=>{if(e.data?.size)studio.chunks.push(e.data);};
  rec.onstop=()=>{
   const actualType=rec.mimeType||mime,ext=actualType.startsWith('video/mp4')?'mp4':'webm';
   const blob=new Blob(studio.chunks,{type:actualType});
   for(const t of stream.getVideoTracks())t.stop();studio.captureStream=null;studio.recording=null;updateControls();
   if(blob.size){download(blob,`${safeName(studio.poem.title)}_명도재_음악시화.${ext}`);setStatus(`${ext.toUpperCase()} 음악 영상 저장 완료 · ${(blob.size/1048576).toFixed(1)} MB · 배경음악 포함`);}
   else setStatus('녹화 데이터가 없어 저장에 실패했습니다.');
  };
  rec.onerror=e=>setStatus(`녹화 오류: ${e.error?.message||'브라우저 인코더 오류'}`);
  rec.start(500);
 }
 studio.startAt=performance.now();studio.pausedTime=0;studio.playing=true;studio.paused=false;studio.elapsed=0;studio.line=-1;studio.progress=0;
 music.start();updateControls();els.playState.textContent=withRecording?'음악 영상 녹화 중':'시화 음악 영상 재생 중';
 setStatus(withRecording?'복합 스테인드글라스와 자막, 음악을 영상으로 녹화합니다. 완료되면 자동 저장됩니다.':'시화 위로 시 자막이 흘러가고 배경음악이 재생됩니다.');
}
function pause(){
 if(!studio.playing||studio.paused)return;studio.paused=true;studio.pauseAt=performance.now();
 music.pause();if(studio.recording?.state==='recording')studio.recording.pause();updateControls();els.playState.textContent='일시정지';
}
async function resume(){
 if(!studio.playing||!studio.paused)return;
 studio.pausedTime+=performance.now()-studio.pauseAt;studio.paused=false;await music.resume();
 if(studio.recording?.state==='paused')studio.recording.resume();updateControls();els.playState.textContent='이어보기 중';
}
els.paint.onclick=()=>{try{refreshArt(true);setStatus(`복합 스테인드글라스 미디어아트 완성 · ${studio.poem.m.length}개 시적 상징 · 다층 유리 조각과 투과광을 표현했습니다.`);}catch(e){setStatus(e.message);}};
els.compose.onclick=async()=>{try{refreshArt();await music.init();music.configure(studio.poem);music.start();studio.previewUntil=performance.now()+7500;setStatus(`${studio.poem.label} 정서에 맞춰 ${studio.poem.bpm} BPM · ${studio.poem.mode==='minor'?'단조':'장조'} · 피아노·플루트·현악 배경음악을 만들었습니다. 영상 감상 시 자동 연주됩니다.`);}catch(e){setStatus(e.message);}};
els.play.onclick=async()=>{try{await perform(false);}catch(e){stopAll(true);setStatus(`영상 재생 오류: ${e.message}`);}};
els.pause.onclick=pause;els.resume.onclick=()=>resume().catch(e=>setStatus(e.message));els.stop.onclick=()=>stopAll();
els.pace.oninput=()=>{els.paceValue.textContent=`${Number(els.pace.value).toFixed(1)}초`;if(!studio.playing)refreshArt();};
els.record.onclick=async()=>{try{await perform(true);}catch(e){stopAll(true);setStatus(`영상 저장 준비 실패: ${e.message}`);}};
els.save.onclick=()=>{try{refreshArt();els.canvas.toBlob(b=>{if(b){download(b,`${safeName(studio.poem.title)}_스테인드글라스.png`);setStatus('16:9 스테인드글라스 시화를 PNG로 저장했습니다.');}},'image/png');}catch(e){setStatus(e.message);}};
try{refreshArt(true);}catch(e){setStatus(e.message);}updateControls();requestAnimationFrame(tick);
