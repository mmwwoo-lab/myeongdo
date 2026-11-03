import {importArticle} from '../lib/article.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST만 지원합니다.'});
 try{
  const url=String(req.body?.url||'').slice(0,2000);
  if(!url)throw Error('기사 주소를 입력해 주세요.');
  const article=await importArticle(url);
  res.status(200).json({article,notice:'기사 자동 추출은 언론사별 HTML과 이용 조건에 따라 제한됩니다. 원문을 직접 확인한 뒤 칼럼을 작성하세요.'});
 }catch(e){res.status(422).json({error:e.message||'기사 불러오기 실패'});}
}
