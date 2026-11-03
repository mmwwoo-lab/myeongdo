import {generateColumn} from '../lib/column.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST만 지원합니다.'});
 try{
  const body=req.body||{};
  if(JSON.stringify(body).length>30000)throw Error('기사 본문이 너무 깁니다.');
  const result=await generateColumn({article:String(body.article||''),title:String(body.title||''),source:String(body.source||''),sourceUrl:String(body.sourceUrl||'')});
  res.status(200).json({column:result});
 }catch(e){res.status(422).json({error:e.message||'칼럼 작성 오류'});}
}
