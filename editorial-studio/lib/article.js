import dns from 'node:dns/promises';
import net from 'node:net';
import https from 'node:https';

const MAX_HTML_BYTES=5_000_000;
const MAX_ARTICLE=22000;
export function decodeEntities(s='') {
  return String(s).replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z\d]+);/gi,(all,match)=>{
    if(match[0]==='#') {const n=match[1]?.toLowerCase()==='x'?parseInt(match.slice(2),16):parseInt(match.slice(1),10);return Number.isFinite(n)&&n>0&&n<=0x10FFFF?String.fromCodePoint(n):all;}
    return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',hellip:'…',middot:'·',ndash:'–',mdash:'—',ldquo:'“',rdquo:'”',lsquo:'‘',rsquo:'’'}[match.toLowerCase()]??all;
  });
}
export function cleanText(s='') {
  return decodeEntities(String(s).replace(/<!--[^]*?-->/g,'').replace(/<script\b[^]*?<\/script\s*>/gi,'').replace(/<style\b[^]*?<\/style\s*>/gi,'').replace(/<[^>]*>/g,' ')).replace(/[\t\r ]+/g,' ').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function extractMeta(html,name) {
  const tags=html.match(/<meta\s+[^>]*>/gi)||[];
  for(const tag of tags){
    const attrs={};
    for(const m of tag.matchAll(/([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) attrs[m[1].toLowerCase()]=m[2]??m[3]??m[4];
    if((attrs.property||attrs.name||'').toLowerCase()===name.toLowerCase())return decodeEntities(attrs.content||'').trim();
  }
  return '';
}
function jsonLdArticle(html) {
  const blocks=[...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for(const block of blocks){
    try{
      const root=JSON.parse(block[1]);
      const items=[];
      function walk(o){if(!o||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(walk);return;}items.push(o);if(o['@graph'])walk(o['@graph']);}
      walk(root);
      for(const x of items){if(/NewsArticle|Article|ReportageNewsArticle/i.test([].concat(x['@type']||[]).join(',')) && typeof x.articleBody==='string' && x.articleBody.length>180) return {title:x.headline||'',body:cleanText(x.articleBody)};}
    }catch{}
  }
  return null;
}
export function parseArticleHTML(html,url='') {
  html=String(html||'');
  const title=extractMeta(html,'og:title')||extractMeta(html,'twitter:title')||cleanText((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||'')||cleanText((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'');
  const ld=jsonLdArticle(html);
  if(ld){return {title:cleanText(ld.title)||title,body:ld.body.slice(0,MAX_ARTICLE),url,method:'JSON-LD 기사본문'};}
  const article=(html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)||[])[1]||
    (html.match(/<(?:div|section)\b[^>]*(?:id|class)=["'][^"']*(?:article-body|articleBody|news_body|newsBody|article_txt|news-content|news_content|view_cont|article-content|news-contents)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i)||[])[1]||html;
  const trimmed=article.replace(/<(?:aside|nav|footer|header|form|button)\b[^]*?<\/(?:aside|nav|footer|header|form|button)>/gi,'').replace(/<script\b[^]*?<\/script>/gi,'').replace(/<style\b[^]*?<\/style>/gi,'');
  const paragraphs=[...trimmed.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>cleanText(m[1])).filter(v=>v.length>24 && !/^(관련기사|광고|무단전재|저작권자|사진\s*[:：]|기자\s*[:：])/.test(v));
  const body=paragraphs.length>=2?paragraphs.join('\n\n'):cleanText(trimmed);
  const description=extractMeta(html,'og:description')||extractMeta(html,'description');
  return {title:title||'기사 제목 확인 필요',body:(body.length>120?body:description).slice(0,MAX_ARTICLE),url,method:paragraphs.length>=2?'기사 문단 추출':'제한적 본문 추출'};
}
function isPublicIP(address){
  if(net.isIP(address)===4){const a=address.split('.').map(Number);const [x,y]=a;
    return !(x===0||x===10||x===127||x>=224||x===169&&y===254||x===172&&y>=16&&y<=31||x===192&&y===168||x===100&&y>=64&&y<=127||x===192&&y===0||x===198&&[18,19].includes(y)||x===192&&y===88||x===198&&y===51||x===203&&y===0);
  }
  if(net.isIP(address)===6){let a=address.toLowerCase();return !(a==='::1'||a==='::'||a.startsWith('fe8')||a.startsWith('fe9')||a.startsWith('fea')||a.startsWith('feb')||a.startsWith('fc')||a.startsWith('fd')||a.startsWith('ff')||a.startsWith('2001:db8')||a.startsWith('::ffff:'));
  }
  return false;
}
export function validateArticleURL(raw){
  let u;try{u=new URL(raw);}catch{throw new Error('올바른 기사 URL을 입력하세요.');}
  if(u.protocol!=='https:')throw new Error('보안을 위해 HTTPS 기사 주소만 지원합니다.');
  if(u.username||u.password||u.port&&u.port!=='443')throw new Error('사용자 정보 또는 특수 포트가 포함된 URL은 지원하지 않습니다.');
  const host=u.hostname.toLowerCase();
  if(net.isIP(host)||!host.includes('.')||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.localhost')||host.endsWith('.test')||host.endsWith('.invalid')||host.endsWith('.onion'))throw new Error('공개 뉴스 웹사이트 주소만 지원합니다.');
  u.hash='';return u;
}
async function secureFetchText(raw,maxRedirects=3){
  const u=validateArticleURL(raw);const addrs=await dns.lookup(u.hostname,{all:true,verbatim:true});
  if(!addrs.length||addrs.some(a=>!isPublicIP(a.address)))throw new Error('공개 인터넷 기사 주소만 가져올 수 있습니다.');
  const ip=addrs[0].address;
  return await new Promise((resolve,reject)=>{
    let settled=false;
    const req=https.get(u,{timeout:9000,headers:{'User-Agent':'MyeongdoColumnStudio/1.0 (+article-summary-request)','Accept':'text/html,application/xhtml+xml;q=0.9','Accept-Encoding':'identity'},lookup:(hostname,options,cb)=>cb(null,ip,net.isIP(ip))},async res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();if(maxRedirects<=0)return reject(new Error('기사 주소 리다이렉트 횟수가 너무 많습니다.'));
        try{const next=new URL(res.headers.location,u).href;resolve(await secureFetchText(next,maxRedirects-1));}catch(e){reject(e);}return;}
      if(res.statusCode!==200){res.resume();return reject(new Error(`기사를 가져올 수 없습니다(HTTP ${res.statusCode}). 기사 본문을 직접 붙여 넣어 주세요.`));}
      if(!/text\/html|application\/xhtml\+xml/i.test(String(res.headers['content-type']||''))){res.resume();return reject(new Error('HTML 기사 페이지만 읽을 수 있습니다.'));}
      const chunks=[];let size=0;res.on('data',c=>{size+=c.length;if(size>MAX_HTML_BYTES){req.destroy(new Error('기사 문서 크기가 제한을 초과했습니다.'));return;}chunks.push(c);});
      res.on('end',()=>{try{const bytes=Buffer.concat(chunks);const enc=(String(res.headers['content-type']).match(/charset\s*=\s*([a-z\d_-]+)/i)||[])[1]||'utf-8';let data;try{data=new TextDecoder(enc).decode(bytes)}catch{data=bytes.toString('utf8')}resolve({html:data,finalUrl:u.href});}catch(e){reject(e);}});
      res.on('error',reject);
    });
    req.on('timeout',()=>req.destroy(new Error('기사 사이트 응답 시간이 초과됐습니다.')));req.on('error',reject);
  });
}
export async function importArticle(url){
  const {html,finalUrl}=await secureFetchText(url);
  const parsed=parseArticleHTML(html,finalUrl);
  if(parsed.body.length<160)throw new Error('기사 본문을 충분히 추출하지 못했습니다. 유료벽·동적 페이지일 수 있으므로 본문을 직접 붙여넣어 주세요.');
  return parsed;
}
