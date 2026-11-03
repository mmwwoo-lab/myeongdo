import {getCartoonPrompt,CARTOON_PRESETS} from '../lib/cartoon.mjs';
/** Optional professional AI image. With no API key the browser paints an original vector draft. */
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST만 지원합니다.'});
 const style=String(req.body?.style||'yong');
 if(!Object.hasOwn(CARTOON_PRESETS,style))return res.status(400).json({error:'만평 유형을 선택해 주세요.'});
 const article=String(req.body?.article||'');
 if(article.length>16000)return res.status(413).json({error:'기사 내용이 너무 깁니다.'});
 let prompt;
 try{prompt=getCartoonPrompt({article,headline:req.body?.headline,style});}catch(err){return res.status(400).json({error:err.message});}
 if(!process.env.OPENAI_API_KEY)return res.status(200).json({mode:'vector',notice:'AI 이미지 API 키가 설정되지 않아 브라우저에서 기사의 핵심 소재를 활용한 독창적인 벡터 만평 시안을 생성합니다. 전문 AI 만평은 서버에 OPENAI_API_KEY 설정이 필요합니다.'});
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),95000);
 try{
  const response=await fetch('https://api.openai.com/v1/images/generations',{
   method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},
   body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2',prompt,size:'1536x1024',quality:'medium',output_format:'webp',output_compression:70,n:1}),signal:ctrl.signal
  });
  if(!response.ok){const issue=await response.text();throw Error(`AI 만평 생성 실패 (${response.status}) ${issue.slice(0,200)}`);}
  const json=await response.json(),b64=json.data?.[0]?.b64_json;
  if(!b64)throw Error('이미지 생성 서비스가 그림 데이터를 반환하지 않았습니다.');
  if(b64.length>5_300_000)throw Error('생성된 이미지 크기가 제한을 초과했습니다.');
  res.status(200).json({mode:'ai',image:`data:image/webp;base64,${b64}`,notice:'기사 소재를 반영한 AI 독창 만평을 만들었습니다. 실제 인물·내용·풍자의 적절성을 검토해 주세요.'});
 }catch(err){res.status(502).json({error:err.message||'만평 생성에 실패했습니다.'});}
 finally{clearTimeout(timeout);}
}
