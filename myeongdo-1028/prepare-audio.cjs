// Preserve existing Create Audio previews in each static production deployment.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'audio-previews.js'),'utf8'),c);
const clips=Object.entries(c.window.MYEONGDO_1028_AUDIO).map(([key,p])=>({file:key+'.mp3',url:p.providerPreview}));
const audioSources={window:{}};vm.createContext(audioSources);vm.runInContext(fs.readFileSync(path.join(__dirname,'original-recitals.js'),'utf8'),audioSources);
for(const [key,rec] of Object.entries(audioSources.window.MYEONGDO_1028_ORIGINAL_RECITALS||{})){if(rec.providerPreview)clips.push({file:'recital-'+key+'.mp3',url:rec.providerPreview})}
clips.push({file:'introduction.mp3',url:'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/170bd6d2-5792-4320-874d-24ed2855c199.mp3'});
async function main(){fs.mkdirSync(path.join(__dirname,'audio-v2'),{recursive:true});let i=0;await Promise.all(Array.from({length:5},async()=>{while(i<clips.length){const clip=clips[i++],dest=path.join(__dirname,'audio-v2',clip.file);if(fs.existsSync(dest)&&fs.statSync(dest).size>1000)continue;let saved=false;for(const url of ['https://myeongdo-1028.vercel.app/audio-v2/'+clip.file,clip.url]){try{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok||!r.headers.get('content-type')?.includes('audio'))continue;const b=Buffer.from(await r.arrayBuffer());if(b.length<1000)continue;fs.writeFileSync(dest,b);saved=true;break;}catch{}}if(!saved)throw Error('Unable to preserve '+clip.file);}}));console.log('Preserved commentary previews, original recitals and introduction MP3.');}
main().catch(e=>{console.error(e);process.exitCode=1});
