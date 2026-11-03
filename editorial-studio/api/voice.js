/** Optional downloadable speech, available only with OPENAI_API_KEY. */
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST만 지원합니다.'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'서버에 음성 생성 API 키가 등록되지 않았습니다. 브라우저 낭독 기능을 사용하세요.'});
 const text=String(req.body?.text||'').trim();
 if(!text||text.length>1800)return res.status(400).json({error:'저장할 칼럼은 1~1800자로 입력해 주세요.'});
 const ac=new AbortController(),t=setTimeout(()=>ac.abort(),60000);
 try{
  const r=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_TTS_MODEL||'gpt-4o-mini-tts',voice:'nova',input:text,response_format:'mp3'}),signal:ac.signal});
  if(!r.ok)throw Error(`음성 생성 API 오류: HTTP ${r.status}`);
  const ab=await r.arrayBuffer(); if(ab.byteLength>10_000_000)throw Error('음원 파일 크기가 허용 범위를 넘었습니다.');
  res.setHeader('Content-Type','audio/mpeg');res.setHeader('Content-Disposition','attachment; filename="myeongdo-column.mp3"');res.status(200).send(Buffer.from(ab));
 }catch(e){res.status(502).json({error:e.message||'음성 생성 실패'});}finally{clearTimeout(t);}
}
