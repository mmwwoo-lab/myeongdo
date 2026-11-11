export const styleNames={pop:'팝아트',impression:'인상파',abstract:'추상파',illustration:'일러스트',renaissance:'르네상스'};
export function paintStyle(ctx,style,scene,random,W,H){
 const themes={garden:['#f6ddb8','#7eaa6b','#ef82a1'],water:['#cbe8ee','#489db1','#f8d77e'],sunset:['#f4bd93','#b66b82','#ffd779'],winter:['#e4e9f1','#899dbb','#faf6e9'],autumn:['#f5d8ac','#b66f3e','#dd9a43']};
 const p=themes[scene];
 function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 function hill(y,color,amp=100){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,y);ctx.bezierCurveTo(W*.25,y-amp,W*.4,y+amp,W*.65,y);ctx.quadraticCurveTo(W*.85,y-amp,W,y+amp*.2);ctx.lineTo(W,H);ctx.closePath();ctx.fill();}
 function flower(x,y,size,color,outline=false){ctx.strokeStyle=outline?'#242139':'#527747';ctx.lineWidth=outline?5:3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+size*4);ctx.stroke();for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*size,y+Math.sin(a)*size,size*.7,size*.7,color);}ellipse(x,y,size*.5,size*.5,'#ffe7a0');}
 ctx.save();
 if(style==='pop'){
  ctx.fillStyle=scene==='winter'?'#adccff':'#ffde38';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ff639d';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(850,0);ctx.lineTo(0,850);ctx.fill();
  for(let y=18;y<H;y+=30)for(let x=18;x<W;x+=30)ellipse(x,y,3.5,3.5,'#27213b');
  ctx.strokeStyle='#242139';ctx.lineWidth=12;ellipse(680,250,135,135,'#fff089');ctx.stroke();
  hill(620,'#23b8d0',150);ctx.stroke();hill(850,scene==='garden'?'#85d250':scene==='autumn'?'#dc873c':'#7859c9',100);ctx.stroke();
  if(scene==='water')for(let i=0;i<18;i++){ctx.beginPath();ctx.moveTo(0,650+i*24);ctx.bezierCurveTo(250,580+i*24,450,720+i*24,850,640+i*24);ctx.stroke();}
  else if(scene==='autumn')for(let i=0;i<110;i++){const x=random()*880,y=620+random()*380;ellipse(x,y,7+random()*18,4+random()*9,['#a63925','#f87d2f','#ffcf52'][i%3]);}else for(let i=0;i<18;i++)flower(30+random()*800,630+random()*350,18+random()*22,['#ff4896','#fb793e','#fff154'][i%3],true);
 }else if(style==='abstract'){
  ctx.fillStyle=p[0];ctx.fillRect(0,0,W,H);
  const colors=['#284b63',p[1],p[2],'#cb6455','#f6dfb5'];
  for(let i=0;i<35;i++){ctx.save();ctx.translate(random()*W,random()*H);ctx.rotate(random()*Math.PI);ctx.globalAlpha=.4+random()*.4;ctx.fillStyle=colors[i%5];if(i%3===0)ctx.fillRect(-160,-70,160+random()*400,80+random()*180);else{ctx.beginPath();ctx.moveTo(-200,100);ctx.lineTo(120,-180);ctx.lineTo(300,130);ctx.closePath();ctx.fill();}ctx.restore();}
  for(let i=0;i<16;i++){ctx.strokeStyle=colors[i%5];ctx.lineWidth=4+random()*14;ctx.beginPath();ctx.moveTo(random()*900,random()*H);ctx.bezierCurveTo(random()*W,random()*H,random()*W,random()*H,random()*W,random()*H);ctx.stroke();}
  for(let i=0;i<8;i++)ellipse(random()*850,random()*H,20+random()*100,20+random()*100,colors[i%5]);
 }else if(style==='illustration'){
  ctx.fillStyle=p[0];ctx.fillRect(0,0,W,H);ellipse(650,230,95,95,p[2]);
  for(let i=0;i<8;i++){const x=random()*W,y=80+random()*300;ellipse(x,y,80,25,'#fff9ed');ellipse(x+40,y-15,55,30,'#fff9ed');}
  hill(560,'#a6b6a2',150);hill(730,p[1],120);hill(940,scene==='winter'?'#f4f5f0':scene==='autumn'?'#86593d':'#487666',120);
  if(scene==='water'){ctx.fillStyle='#89c6ce';ctx.fillRect(0,690,W,390);for(let i=0;i<40;i++){ctx.strokeStyle='#d4ece6';ctx.lineWidth=4;const x=random()*W,y=720+random()*330;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+35+random()*90,y);ctx.stroke();}}
  for(let i=0;i<7;i++){const x=80+i*100,y=470+random()*180;ctx.fillStyle='#816b52';ctx.fillRect(x-6,y,12,300);ellipse(x,y,50,100,scene==='winter'?'#eef0ea':scene==='autumn'?(i%2?'#c96b37':'#e7a64e'):'#688f65');}
  if(scene==='autumn')for(let i=0;i<130;i++){const x=random()*850,y=810+random()*230;ellipse(x,y,4+random()*13,2+random()*7,['#bb5437','#e49c42','#d4bb63'][i%3]);}else if(scene!=='winter')for(let i=0;i<40;i++)flower(random()*850,830+random()*190,8+random()*10,p[2]);
 }else{
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#7c999c');sky.addColorStop(.5,'#ead3a0');sky.addColorStop(1,'#564e38');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  for(let i=0;i<90;i++)ellipse(random()*W,120+random()*350,70+random()*130,12+random()*22,'rgba(246,225,182,.09)');
  hill(530,'#a5a48a',110);hill(620,'#7b8974',150);hill(770,'#576d52',120);hill(990,'#414f36',100);
  if(scene==='water'){ctx.fillStyle='#9aada0';ctx.beginPath();ctx.moveTo(780,620);ctx.bezierCurveTo(200,820,800,850,350,H);ctx.lineTo(1000,H);ctx.bezierCurveTo(1200,850,700,800,850,620);ctx.fill();}
  // Architectural perspective and warm glazing evoke a classical painted landscape.
  ctx.fillStyle='#cfb98b';ctx.fillRect(85,100,70,900);ctx.fillRect(690,100,70,900);ctx.fillStyle='#a48a60';ctx.fillRect(70,980,710,50);
  ctx.strokeStyle='#c7ae80';ctx.lineWidth=68;ctx.beginPath();ctx.moveTo(120,400);ctx.bezierCurveTo(120,-15,725,-15,725,400);ctx.stroke();
  for(let x of [100,125,705,730]){ctx.strokeStyle='rgba(255,239,196,.35)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,370);ctx.lineTo(x,970);ctx.stroke();}
  if(scene==='garden')for(let i=0;i<90;i++)flower(170+random()*480,820+random()*150,3+random()*5,['#c39a72','#b56b66'][i%2]);
  if(scene==='winter'){ctx.fillStyle='rgba(240,234,214,.45)';ctx.fillRect(155,870,535,60);}if(scene==='autumn'){for(let i=0;i<400;i++){const x=180+random()*570,y=390+random()*560;ellipse(x,y,2+random()*10,2+random()*7,['#b64e2e','#db8e38','#edbd63'][i%3]);}}
  const glow=ctx.createRadialGradient(800,280,30,800,280,1100);glow.addColorStop(0,'rgba(255,228,168,.3)');glow.addColorStop(1,'rgba(52,30,13,.32)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  for(let i=0;i<12000;i++){ctx.fillStyle=i%2?'rgba(255,235,188,.04)':'rgba(45,26,13,.05)';ctx.fillRect(random()*W,random()*H,1+random()*3,1+random()*3);}
 }
 ctx.restore();
}
