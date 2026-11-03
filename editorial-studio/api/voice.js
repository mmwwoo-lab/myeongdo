/** 키 없는 버전: 음성은 브라우저 Web Speech API로 재생합니다. */
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 return res.status(501).json({error:'MP3 파일 생성은 제공하지 않습니다. 편집실의 「칼럼 읽기」 버튼에서 한국어 음성으로 재생하세요.'});
}
