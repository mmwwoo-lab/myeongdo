/** 외부 이미지 API 없이 브라우저에서 제작하는 원본 벡터 만평. */
import {CARTOON_PRESETS} from '../lib/cartoon.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST만 지원합니다.'});
 const style=String(req.body?.style||'yong');
 if(!Object.hasOwn(CARTOON_PRESETS,style))return res.status(400).json({error:'만평 유형을 선택해 주세요.'});
 const article=String(req.body?.article||'');
 if(article.length>16000)return res.status(413).json({error:'기사 내용이 너무 깁니다.'});
 return res.status(200).json({mode:'vector',notice:'API 키가 필요 없는 기본 만평입니다. 기사의 주요 소재를 바탕으로 브라우저가 그림을 생성합니다.'});
}
