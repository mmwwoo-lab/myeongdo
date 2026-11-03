import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import importHandler from './api/import.js';
import columnHandler from './api/column.js';
import voiceHandler from './api/voice.js';
import cartoonHandler from './api/cartoon.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4176);
const handlers={'/api/import':importHandler,'/api/column':columnHandler,'/api/voice':voiceHandler,'/api/cartoon':cartoonHandler};
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(handlers[pathname]){
  let raw=''; try{for await (const b of req){raw+=b.toString('utf8');if(raw.length>35000)throw Error('요청 크기 제한 초과');}req.body=raw?JSON.parse(raw):{};
    const shim={setHeader:(...a)=>res.setHeader(...a),status:n=>{res.statusCode=n;return shim;},json:o=>{res.setHeader('Content-Type','application/json;charset=utf-8');res.end(JSON.stringify(o));return shim;},send:b=>{res.end(b);return shim;}};
    await handlers[pathname](req,shim);}
  catch(e){res.writeHead(400,{'Content-Type':'application/json;charset=utf-8'});res.end(JSON.stringify({error:e.message}));}return;
 }
 const file=pathname==='/'?'index.html':pathname.slice(1);const full=path.resolve(dir,'public',file);
 if(!full.startsWith(path.resolve(dir,'public')+path.sep)&&full!==path.resolve(dir,'public','index.html')){res.writeHead(403);res.end();return;}
 try{const b=await readFile(full);res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,()=>console.log(`Myeongdo Editorial Studio: http://localhost:${port}`));
