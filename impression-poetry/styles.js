export const styleNames={pop:'팝아트',impression:'인상파',abstract:'추상파',illustration:'일러스트',renaissance:'스테인드글라스'};
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
  // Cut-glass mosaic panels with dark lead seams; five seasonal palettes.
  const glassColors={
   garden:['#3c9b78','#98bf72','#e5a24a','#e8c966','#cf6a79','#68acc0','#366b9c'],
   water:['#1d6086','#3f8fae','#7cc5c9','#c7e6d4','#e7d781','#456fb0','#78b2d0'],
   sunset:['#7b5192','#bd547a','#e1754f','#e6a642','#f4d17c','#426b9a','#9b6278'],
   winter:['#486a9e','#8aafcc','#b8d9e4','#e4eff2','#84a3bd','#b4c8d8','#c5d9e7'],
   autumn:['#9c4a36','#ca643c','#ed9d42','#f1c55b','#8a743a','#a34041','#be853e']
  };
  const tiles=glassColors[scene]||glassColors.garden;
  function pane(points,color){
   ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
   for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
   ctx.closePath();ctx.fillStyle=color;ctx.fill();
   ctx.strokeStyle='#22282c';ctx.lineWidth=7;ctx.lineJoin='round';ctx.stroke();
   ctx.save();ctx.clip();
   const shine=ctx.createLinearGradient(0,0,W,H);
   shine.addColorStop(0,'rgba(255,255,255,.29)');shine.addColorStop(.45,'rgba(255,255,255,.02)');shine.addColorStop(1,'rgba(12,20,25,.13)');
   ctx.fillStyle=shine;ctx.fillRect(0,0,W,H);ctx.restore();
  }
  ctx.fillStyle='#243038';ctx.fillRect(0,0,W,H);
  // Small glass cells occupy the whole landscape, joined by visible solder lines.
  for(let y=0;y<H;y+=108){
   for(let x=0;x<W;x+=144){
    const x2=Math.min(W,x+144),y2=Math.min(H,y+108),dx=(random()-.5)*48,dy=(random()-.5)*40;
    const a=tiles[Math.floor(random()*tiles.length)];
    const b=tiles[Math.floor(random()*tiles.length)];
    pane([[x,y],[x2,y],[x2+dx*.3,y2+dy*.2],[x+dx,y2]],a);
    if(random()>.4)pane([[x+dx,y2],[x2+dx*.3,y2+dy*.2],[x2,y2],[x2,y2-24]],b);
   }
  }
  // Jewel-like rose window / sun, placed left of the poem.
  const cx=610,cy=250,radius=146,n=12;
  for(let i=0;i<n;i++){
   const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;
   pane([[cx,cy],[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius],[cx+Math.cos(b)*radius,cy+Math.sin(b)*radius]],['#f3df8c','#e5a85a','#d16d64'][i%3]);
  }
  ctx.strokeStyle='#242a30';ctx.lineWidth=15;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
  // Distant jagged mountains, river or fields: separate shaped colored glass.
  for(let x=0;x<960;x+=160){
   const ridge=460+random()*160;
   pane([[x,710],[x,ridge+130],[x+80,ridge-65],[x+160,ridge+105],[x+160,710]],tiles[(Math.floor(x/160)+2)%tiles.length]);
  }
  if(scene==='water'){
   for(let y=700;y<H;y+=70){
    for(let x=0;x<1000;x+=160){
     pane([[x,y],[x+80,y-16],[x+160,y],[x+160,y+70],[x,y+70]],['#2b80ad','#72c0cc','#4e9fbc','#b2d9dc'][Math.floor(random()*4)]);
    }
   }
  }else{
   for(let y=740;y<H;y+=105){
    for(let x=0;x<980;x+=140){
     pane([[x,y],[x+70,y-35],[x+140,y],[x+140,y+105],[x,y+105]],tiles[Math.floor(random()*tiles.length)]);
    }
   }
  }
  // Flower and leaf tesserae in foreground, especially autumn branches.
  if(scene!=='winter'){
   for(let i=0;i<26;i++){
    const x=30+random()*850,y=745+random()*260,size=12+random()*24;
    pane([[x,y-size],[x+size,y],[x,y+size],[x-size,y]],tiles[(i+4)%tiles.length]);
   }
  }
  const shimmer=ctx.createLinearGradient(0,0,W,H);
  shimmer.addColorStop(0,'rgba(255,246,198,.20)');shimmer.addColorStop(.50,'rgba(255,255,255,.03)');shimmer.addColorStop(1,'rgba(12,19,34,.20)');
  ctx.fillStyle=shimmer;ctx.fillRect(0,0,W,H);
 }
 ctx.restore();
}
