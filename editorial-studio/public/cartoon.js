/* 명도재 시사컬럼: original browser-drawn editorial cartoons, not copies of named artists. */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const LOOKS={
 kim:{label:'고전 4컷 구성',paper:'#f6f0de',ink:'#242a2b',shade:'#ded7c8',accent:'#a64436',layout:'four'},
 park:{label:'현장 이야기형',paper:'#f1eadb',ink:'#29343a',shade:'#c8d8d2',accent:'#c25c3d',layout:'single'},
 yong:{label:'상징·은유 만평',paper:'#f5f1e3',ink:'#1d343a',shade:'#dae0d4',accent:'#bd543b',layout:'single'},
 jang:{label:'인물·대사 풍자',paper:'#f3eddf',ink:'#292b33',shade:'#f0d6c6',accent:'#a34a3c',layout:'single'},
 soon:{label:'연속 풍자 4컷',paper:'#f2e9d9',ink:'#2d3137',shade:'#d5e0dd',accent:'#c85a39',layout:'four'}
};
const topics=[
 {id:'energy',re:/변전소|송전|전력|한전|변압기|전기|전력망|에너지|반도체/g,name:'전력망과 산업',label:'전력망',symbol:'⚡'},
 {id:'budget',re:/예산|재정|세금|보조금|국비|사업비|재원|물가|금리|투자|경제/g,name:'예산과 경제',label:'예산',symbol:'₩'},
 {id:'culture',re:/문화|예술|축제|전시|미술|공연|관광|문학/g,name:'문화예술 정책',label:'문화',symbol:'♪'},
 {id:'school',re:/교육|학교|학생|교사|대학|강의/g,name:'교육과 미래',label:'교육',symbol:'✦'},
 {id:'care',re:/의료|복지|돌봄|요양|병원|환자|노인/g,name:'복지와 삶',label:'돌봄',symbol:'♡'},
 {id:'admin',re:/국회|행정|대통령|시장|정부|정치|지자체|국감|감사|정책/g,name:'행정의 책임',label:'정책',symbol:'!'}
];
export function inferComicTopic(article,title=''){
 const text=`${title} ${article}`;
 const ranked=topics.map(t=>({...t,count:(text.match(t.re)||[]).length})).sort((a,b)=>b.count-a.count);
 return ranked[0].count>0?ranked[0]:{id:'public',name:'공공의 질문',label:'현안',symbol:'?'};
}
function round(ctx,x,y,w,h,r,fill,stroke='#333',line=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}
function line(ctx,pts,color,w=4){ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function ellipse(ctx,x,y,rx,ry,fill,stroke,w=3){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}}
function label(ctx,msg,x,y,size=22,color='#233',max=900){ctx.fillStyle=color;ctx.font=`700 ${size}px 'Malgun Gothic',system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(msg,x,y,max);}
function banner(ctx,x,y,w,text,look){round(ctx,x,y,w,40,8,look.ink,look.ink,0);label(ctx,text,x+w/2,y+28,19,'#fffaef',w-16);}
function bubble(ctx,msg,x,y,w,look,side='left'){
 const words=String(msg).slice(0,28);
 ctx.beginPath();ctx.moveTo(x+17,y);ctx.lineTo(x+w-17,y);ctx.quadraticCurveTo(x+w,y,x+w,y+15);
 ctx.lineTo(x+w,y+53);ctx.quadraticCurveTo(x+w,y+69,x+w-16,y+69);
 if(side==='left'){ctx.lineTo(x+45,y+69);ctx.lineTo(x+21,y+87);ctx.lineTo(x+29,y+69);}else{ctx.lineTo(x+w-29,y+69);ctx.lineTo(x+w-21,y+87);ctx.lineTo(x+w-45,y+69);}
 ctx.lineTo(x+17,y+69);ctx.quadraticCurveTo(x,y+69,x,y+52);ctx.lineTo(x,y+16);ctx.quadraticCurveTo(x,y,x+17,y);ctx.closePath();ctx.fillStyle='#fffdf4';ctx.strokeStyle=look.ink;ctx.lineWidth=3;ctx.fill();ctx.stroke();
 label(ctx,words,x+w/2,y+43,Math.min(21,words.length>15?17:20),look.ink,w-16);
}
function person(ctx,x,y,s,role,look,seed=1){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);const ink=look.ink;const col=role==='official'?'#3d6270':role==='citizen'?'#d09455':'#7b8b76';
 ellipse(ctx,1,10,82,13,'#0002',null); // floor shadow
 // shoes and legs
 line(ctx,[[-21,-15],[-29,65]],ink,13);line(ctx,[[24,-15],[31,65]],ink,13);
 ellipse(ctx,-30,68,25,10,'#464a4c',ink,3);ellipse(ctx,34,68,25,10,'#464a4c',ink,3);
 // torso with buttons and collar
 ctx.beginPath();ctx.moveTo(-46,-128);ctx.quadraticCurveTo(0,-144,48,-128);ctx.lineTo(62,-21);ctx.lineTo(-58,-20);ctx.closePath();ctx.fillStyle=col;ctx.strokeStyle=ink;ctx.lineWidth=5;ctx.fill();ctx.stroke();
 line(ctx,[[-44,-113],[-78,-46]],ink,17);line(ctx,[[49,-109],[78,-56]],ink,17);
 ellipse(ctx,-81,-39,14,12,'#efc29b',ink,3);ellipse(ctx,82,-50,14,12,'#efc29b',ink,3);
 ctx.fillStyle='#fbf4dc';ctx.beginPath();ctx.moveTo(-18,-129);ctx.lineTo(0,-80);ctx.lineTo(19,-128);ctx.fill();
 if(role==='official'){ctx.fillStyle='#a34a48';ctx.beginPath();ctx.moveTo(0,-118);ctx.lineTo(-8,-101);ctx.lineTo(0,-52);ctx.lineTo(9,-101);ctx.closePath();ctx.fill();}
 // humorous oversized head and hair
 ellipse(ctx,0,-183,60,67,'#eec197',ink,4.5);
 ctx.beginPath();ctx.ellipse(-4,-222,59,28,-.08,Math.PI,TAU);ctx.fillStyle=role==='official'?'#3e4149':'#53504d';ctx.fill();
 ctx.lineWidth=6;ctx.strokeStyle=ink;ctx.beginPath();ctx.arc(-23,-189,5,0,TAU);ctx.arc(22,-190,5,0,TAU);ctx.stroke();
 line(ctx,[[-33,-205],[-10,-212]],ink,4);line(ctx,[[12,-214],[36,-209]],ink,4);
 ctx.beginPath();ctx.ellipse(0,-156,role==='official'?15:19,role==='official'?7:9,0,0,Math.PI);ctx.strokeStyle='#653e3c';ctx.lineWidth=3;ctx.stroke();
 ctx.restore();
}
function icon(ctx,t,x,y,s,look){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);let ink=look.ink;
 if(t.id==='energy'){
  // transmission pylon with struts and power lines
  line(ctx,[[-42,94],[-17,-104],[15,-104],[43,94]],ink,7);
  for(let y of [-70,-29,18,58]){const w=27+y*.14;line(ctx,[[-w,y],[w,y]],ink,6);line(ctx,[[-w,y],[-15,y+27],[w,y]],ink,2.4);}
  line(ctx,[[-75,-65],[72,-65]],ink,6);line(ctx,[[-89,-20],[88,-20]],ink,5);
  for(let xx of [-76,76])line(ctx,[[xx,-65],[xx+(xx<0?-9:9),-20]],'#b86a54',3);
  ctx.fillStyle='#efc55f';ctx.beginPath();ctx.moveTo(30,-56);ctx.lineTo(-14,10);ctx.lineTo(10,12);ctx.lineTo(-10,76);ctx.lineTo(50,-13);ctx.lineTo(20,-13);ctx.fill();ctx.strokeStyle=ink;ctx.stroke();
 } else if(t.id==='budget'){
  ellipse(ctx,0,0,84,84,'#e2c779',ink,8);ellipse(ctx,0,0,66,66,'#f5e5a6',ink,3);label(ctx,'₩',0,31,92,ink);
 } else if(t.id==='culture'){
  ctx.fillStyle='#e9ba7e';ctx.beginPath();ctx.ellipse(0,0,91,72,.1,0,TAU);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=ink;ctx.stroke();for(let k=0;k<5;k++)ellipse(ctx,Math.cos(k*TAU/5)*41,Math.sin(k*TAU/5)*33,11,11,'#f8f2df',ink,2);label(ctx,'♪',15,28,83,ink);
 } else if(t.id==='school'){
  round(ctx,-100,-74,200,148,7,'#efbd88',ink,6);round(ctx,-72,-51,144,108,3,'#f6e9c9',ink,3);label(ctx,'배움',0,25,49,ink);
 } else if(t.id==='care'){
  ellipse(ctx,-39,-32,43,43,'#dd7868',ink,4);ellipse(ctx,36,-32,43,43,'#dd7868',ink,4);ctx.beginPath();ctx.moveTo(-80,-25);ctx.lineTo(0,92);ctx.lineTo(79,-25);ctx.closePath();ctx.fillStyle='#dd7868';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.stroke();
 } else {
  round(ctx,-85,-85,170,170,14,'#c7d1cb',ink,7);label(ctx,'?',0,47,145,look.accent);
 }
 ctx.restore();
}
function prop(ctx,x,y,look,t){
 // public records folder and lens
 round(ctx,x-81,y-49,159,110,10,'#c8d3ce',look.ink,5);
 ctx.fillStyle='#e7f0ec';ctx.fillRect(x-66,y-26,123,72);
 for(let i=0;i<4;i++)line(ctx,[[x-51,y-12+i*17],[x+44,y-12+i*17]],'#71848a',3);
 ellipse(ctx,x+72,y+18,35,35,'#d6ecf08e',look.ink,6);line(ctx,[[x+92,y+40],[x+139,y+88]],look.ink,13);
}
function paintScene(ctx,box,look,t,step,view){
 const {x,y,w,h}=box;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 const bg=ctx.createLinearGradient(x,y,x,y+h);bg.addColorStop(0,look.shade);bg.addColorStop(1,look.paper);ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);
 // press-ink hatching and visible environment
 ctx.strokeStyle='#151d2112';ctx.lineWidth=2;for(let i=0;i<38;i++){ctx.beginPath();ctx.moveTo(x+i*33,y);ctx.lineTo(x-110+i*33,y+h);ctx.stroke();}
 const scale=Math.min(w/550,h/430);
 ctx.save();ctx.translate(x+w/2,y+h*.59);ctx.scale(scale,scale);
 // dramatic background lines around the policy object
 for(let k=0;k<14;k++){const a=k*TAU/14;line(ctx,[[Math.cos(a)*130,Math.sin(a)*95-95],[Math.cos(a)*185,Math.sin(a)*157-95]],'#19252b41',3);}
 if(step===0){icon(ctx,t,-2,-100,.68,look);person(ctx,-155,95,.58,'citizen',look);person(ctx,160,95,.58,'official',look);}
 else if(step===1){icon(ctx,t,-102,-125,.56,look);prop(ctx,65,-72,look,t);person(ctx,-165,92,.5,'official',look);}
 else if(step===2){prop(ctx,-45,-120,look,t);person(ctx,180,93,.58,'citizen',look);}
 else{icon(ctx,t,-98,-105,.45,look);person(ctx,125,92,.61,'official',look);person(ctx,-195,91,.51,'citizen',look);}
 ctx.restore();
 const cap=view[step%view.length];
 const capY=y+h-57; ctx.fillStyle='#faf5e9ed';ctx.fillRect(x+11,capY,w-22,46);label(ctx,cap,x+w/2,capY+31,clamp(w/19,14,23),look.ink,w-40);
 ctx.restore();
}
export function renderEditorialCartoon(canvas,{article='',title='',style='yong'}={}){
 const look=LOOKS[style]||LOOKS.yong,t=inferComicTopic(article,title),ctx=canvas.getContext('2d');
 const W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);ctx.fillStyle=look.paper;ctx.fillRect(0,0,W,H);
 // Newspaper editorial frame with clear attribution
 ctx.strokeStyle=look.ink;ctx.lineWidth=8;ctx.strokeRect(19,17,W-38,H-34);
 banner(ctx,40,37,W-80,`명도재 시사컬럼   |   ${look.label}`,look);
 const prompts=['무슨 일이 있었나','설명은 충분한가','시민의 질문','근거와 대안은?'];
 const gap=18,top=108,bottom=H-73;
 if(look.layout==='four'){
   const side=(W-100-gap)/2,hh=(bottom-top-gap)/2;
   for(let i=0;i<4;i++){
     const xx=40+(i%2)*(side+gap),yy=top+Math.floor(i/2)*(hh+gap);
     paintScene(ctx,{x:xx,y:yy,w:side,h:hh},look,t,i,prompts);
     ctx.strokeStyle=look.ink;ctx.lineWidth=4.5;ctx.strokeRect(xx,yy,side,hh);
     ctx.fillStyle=look.accent;ctx.beginPath();ctx.arc(xx+21,yy+22,16,0,TAU);ctx.fill();label(ctx,String(i+1),xx+21,yy+28,19,'#fff');
   }
 } else {
   const bx=40,by=108,bw=W-80,bh=bottom-by;
   paintScene(ctx,{x:bx,y:by,w:bw,h:bh},look,t,look.layout==='single'?0:2,[`그림 속 쟁점: ${t.name}`]);
   ctx.strokeStyle=look.ink;ctx.lineWidth=5;ctx.strokeRect(bx,by,bw,bh);
   // speech balloons communicate questions, not attributed quotes
   const w1=Math.min(bw*.35,320),w2=Math.min(bw*.35,320);
   bubble(ctx,'누가 결정했나요?',bx+28,by+33,w1,look,'left');
   bubble(ctx,'기준을 공개해야죠!',bx+bw-w2-28,by+45,w2,look,'right');
   banner(ctx,bx+bw*.32,by+bh*.48,bw*.36,`쟁점  ${t.label}`,look);
 }
 label(ctx,'AI 창작 만평 · 기사 내용에 대한 풍자적 해석 · 실제 사건의 사진이 아님',W/2,H-30,18,look.ink,W-80);
 return {topic:t.name,style:look.label};
}
