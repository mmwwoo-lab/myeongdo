/** 키 없는 버전: 칼럼 낭독은 브라우저 Web Speech API로 처리합니다. */
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 return res.status(501).json({error:'파일형 음성 생성은 지원하지 않습니다. 편집실의 「칼럼 읽기」 버튼으로 한국어 음성을 재생할 수 있습니다.'});
}
