import dns from 'node:dns/promises';
import net from 'node:net';
function blockedAddress(ip){
 if(!net.isIP(ip)) return true;
 if(ip.includes(':')){const v=ip.toLowerCase();return v==='::1'||v==='::'||v.startsWith('fe80:')||v.startsWith('fc')||v.startsWith('fd')||v.startsWith('ff')||v.startsWith('::ffff:')||v.startsWith('2001:db8');}
 const o=ip.split('.').map(Number);return o[0]===0||o[0]===10||o[0]===127||o[0]>=224||(o[0]===169&&o[1]===254)||(o[0]===172&&o[1]>=16&&o[1]<=31)||(o[0]===192&&o[1]===168)||(o[0]===100&&o[1]>=64&&o[1]<=127)||(o[0]===198&&o[1]>=18&&o[1]<=19)||(o[0]===192&&o[1]===0)||(o[0]===192&&o[1]===0&&o[2]===0);
}
export async function assertPublicUrl(raw, lookup=dns.lookup){
 const url=new URL(raw);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.port&&!['80','443'].includes(url.port))throw new Error('공개 HTTP(S) 기사 주소만 지원합니다.');
 const host=url.hostname.toLowerCase().replace(/\.$/,'');
 if(host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.localhost')||net.isIP(host))throw new Error('내부 서버 주소는 허용하지 않습니다.');
 const ips=await lookup(host,{all:true,verbatim:true});
 if(!ips.length||ips.some(({address})=>blockedAddress(address)))throw new Error('외부 공인 인터넷 주소만 허용합니다.');
 return url;
}
function unescape(s){return String(s).replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));}
function textFromHtml(html){return unescape(html.replace(/<\s*br\s*\/?>/gi,'\n').replace(/<\/p\s*>/gi,'\n').replace(/<\/(?:div|h\d|li)\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t\u00a0]+/g,' ').replace(/\n{3,}/g,'\n\n')).trim();}
function meta(html,key){const tags=[...html.matchAll(/<meta\b[^>]+>/gi)].map(x=>x[0]);for(const tag of tags){if(new RegExp(`(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(tag)){const v=tag.match(/content=["']([^"']+)["']/i);if(v)return unescape(v[1]);}}return '';}
export function extractArticle(html,url=''){
 const source=String(html).slice(0,1600000);
 const title=meta(source,'og:title')||textFromHtml(source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
 const date=meta(source,'article:published_time')||meta(source,'datePublished')||'';
 let body='';
 for(const m of source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{const node=JSON.parse(m[1]);const arr=Array.isArray(node)?node:node['@graph']||[node];const article=arr.find(v=>/Article|NewsArticle/.test(JSON.stringify(v['@type']||''))&&typeof v.articleBody==='string');if(article?.articleBody?.length>body.length)body=article.articleBody;}catch{}
 }
 const cleaned=source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi,'').replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,'');
 if(body.length<180){const candidates=[];for(const re of [/<article\b[^>]*>([\s\S]*?)<\/article>/gi,/<(?:div|section)\b[^>]*(?:itemprop=["']articleBody|class=["'][^"']*(?:article-body|news-body|article_view|view-content|news_view|articleBody|article_txt))[^>]*>([\s\S]*?)<\/(?:div|section)>/gi]){for(const x of cleaned.matchAll(re))candidates.push(textFromHtml(x[1]));}candidates.sort((a,b)=>b.length-a.length);body=candidates[0]||'';}
 if(body.length<180){const p=[...cleaned.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>textFromHtml(m[1])).filter(t=>t.length>35&&t.length<1200);body=p.join('\n');}
 body=unescape(body).replace(/\n{3,}/g,'\n\n').trim().slice(0,12000);
 const site=meta(source,'og:site_name')||new URL(url).hostname;
 return {title:title.slice(0,180),body,site,date,url};
}
export async function fetchPublicArticle(urlStr, fetchImpl=fetch,lookup=dns.lookup){
 let current=urlStr;const seen=new Set();
 for(let i=0;i<4;i++){
  const url=await assertPublicUrl(current,lookup);
  if(seen.has(url.href))throw new Error('리디렉션 반복');seen.add(url.href);
  const ac=new AbortController();const t=setTimeout(()=>ac.abort(),10000);
  let res;
  try{res=await fetchImpl(url.href,{redirect:'manual',signal:ac.signal,headers:{'User-Agent':'MyeongdoEditorialStudio/1.0 (personal article reading helper)','Accept':'text/html,application/xhtml+xml'}});}finally{clearTimeout(t);}
  if(res.status>=300&&res.status<400){const loc=res.headers.get('location');if(!loc)throw Error('이동할 주소가 없습니다.');current=new URL(loc,url).href;continue;}
  if(!res.ok)throw Error(`기사 사이트 요청 실패 (${res.status})`);
  if(!/html|text\/plain/i.test(res.headers.get('content-type')||''))throw Error('HTML 문서가 아닙니다.');
  const max=1200000;const buff=await res.arrayBuffer();if(buff.byteLength>max)throw Error('문서가 너무 큽니다.');
  const declared=(res.headers.get('content-type')||'').match(/charset=([\w-]+)/i)?.[1]||'utf-8';
  let decoded;try{decoded=new TextDecoder(declared).decode(buff);}catch{decoded=new TextDecoder().decode(buff);}
  const article=extractArticle(decoded,url.href);
  if(article.body.length<100)throw Error('기사 본문을 자동으로 읽지 못했습니다. 기사 본문을 복사해 입력해 주세요. 일부 언론사는 자동 접근을 제한합니다.');
  return article;
 }
 throw Error('주소 이동이 너무 많습니다.');
}
