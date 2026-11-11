// On-device first-pass revision: deterministic editing, not a generative AI model.
// Preserve all meaningful source imagery; never overwrite the original without consent.
const substitutions=[
 ['가슴이 먹먹하다','목 안쪽에 말이 걸린다'],
 ['가슴이 먹먹해진다','목 안쪽에 말이 걸린다'],
 ['가슴이 아프다','숨을 한 번 길게 고른다'],
 ['마음이 아프다','말끝을 오래 삼킨다'],
 ['그리움이 밀려온다','접어 둔 이름이 다시 펼쳐진다'],
 ['행복이 찾아온다','웃음이 방 안쪽까지 번진다'],
 ['세월이 흘러간다','달력의 모서리가 한 장씩 넘어간다'],
 ['시간이 흐른다','창가의 그림자가 조금씩 길어진다'],
 ['바람이 속삭인다','바람이 창틀을 가볍게 두드린다'],
 ['꽃이 웃는다','꽃잎이 햇빛 쪽으로 벌어진다'],
 ['눈물이 흘러내린다','눈가에 물기가 고인다'],
 ['눈물이 흘렀다','눈가에 물기가 고였다'],
 ['희망이 피어난다','빈 가지 끝에 새순이 돋는다'],
 ['소중한 추억','손때 묻은 기억'],
 ['아름다운 추억','손때 묻은 기억'],
 ['그리운 님','다시 부르고 싶은 이름'],
 ['인생은 아름답다','저녁의 작은 불빛이 오래 남는다']
];
const fillers=/(?:정말|너무나도|너무|매우|아주|무척|굉장히|너무나)\s+/g;
const overused=/(그리움|행복|슬픔|기쁨|사랑|희망|영원|운명|추억|세월)/g;
function breakLongLines(value){
 const out=[];
 for(const raw of value.replace(/\r/g,'').split('\n')){
  let line=raw.trim().replace(/[ \t]{2,}/g,' ');
  if(!line){if(out.length&&out[out.length-1]!=='')out.push('');continue;}
  if(line.length>42){
   const parts=line.split(/(?<=[,，;；])\s*|\s+(?=그러나|그런데|그리고|마침내)/).map(x=>x.trim()).filter(Boolean);
   if(parts.length>1){out.push(...parts);continue;}
  }
  out.push(line);
 }
 while(out.length&&out[0]==='')out.shift();
 while(out.length&&out[out.length-1]==='')out.pop();
 return out;
}
export function revisePoem(title,text){
 const original=text.trim(), notes=[];
 if(!original)return {poem:'',notes:['먼저 시를 입력해 주세요.']};
 let replaced=0,fillerCount=0,dedup=0;
 const lines=breakLongLines(original), used=new Set(), edited=[];
 for(const raw of lines){
  if(raw===''){if(edited.length&&edited[edited.length-1]!=='')edited.push('');continue;}
  let line=raw;
  for(const [bad,better] of substitutions){
   if(line.includes(bad)){line=line.split(bad).join(better);replaced++;}
  }
  line=line.replace(fillers,()=>{fillerCount++;return '';});
  line=line.replace(/(?:[.。])+\s*$/,'').trim();
  if(!line)continue;
  if(used.has(line)){dedup++;continue;}
  used.add(line);edited.push(line);
 }
 const withoutEmpty=edited.filter(Boolean);
 if(withoutEmpty.length>=5){
  // Rebuild the poem in a scene -> movement -> resonance rhythm.
  const a=Math.max(2,Math.round(withoutEmpty.length*.36));
  const b=Math.max(a+1,Math.round(withoutEmpty.length*.7));
  const groups=[withoutEmpty.slice(0,a),withoutEmpty.slice(a,b),withoutEmpty.slice(b)].filter(x=>x.length);
  if(groups.length>=2){
   edited.length=0;
   groups.forEach((group,i)=>{if(i)edited.push('');edited.push(...group);});
  }
 }else{
  // Respect the poet's own breaks for very short poems.
  edited.length=0;
  for(const line of lines){if(line||edited.length)edited.push(line);}
  for(let i=0;i<edited.length;i++){
   if(!edited[i])continue;
   let s=edited[i];
   for(const [bad,better] of substitutions){if(s.includes(bad))s=s.split(bad).join(better);}
   s=s.replace(fillers,'').replace(/(?:[.。])+\s*$/,'').trim();
   edited[i]=s;
  }
 }
 const overusedHits=original.match(overused)||[];
 if(replaced)notes.push('상투적 표현 '+replaced+'곳을 구체적인 동작이나 사물로 바꾸었습니다.');
 if(fillerCount)notes.push('불필요한 강조 부사 '+fillerCount+'곳을 덜어 냈습니다.');
 if(dedup)notes.push('완전히 반복된 행 '+dedup+'곳을 정리했습니다.');
 if(withoutEmpty.length>=5)notes.push('장면 → 움직임 → 여운의 흐름에 맞추어 연을 다시 나누었습니다.');
 if(overusedHits.length>=3)notes.push('추상어가 자주 나옵니다. 그리움·행복 같은 말 대신 실제로 본 사물과 몸짓을 더해 보세요.');
 if(!notes.length)notes.push('원문의 고유한 이미지와 목소리를 살렸습니다. 설명을 줄이고 마지막 행의 여운을 다시 살펴보세요.');
 notes.push('시에는 절대적인 금지어가 없습니다. 낯익은 비유·직접적인 교훈·불필요한 수식은 문맥에 따라 고쳐 보세요.');
 return {poem:edited.join('\n').replace(/\n{3,}/g,'\n\n').trim().slice(0,1500),notes};
}
export function buildExpertPrompt(title,text){
 return [
 '당신은 현대 한국 서정시의 엄격한 문학 편집자이자 창작 시인입니다.',
 '다음 원작을 고유한 장면과 화자의 목소리를 존중하면서 완성도 높은 현대 서정시로 새롭게 창작해 주세요.',
 '실존 시인 한 사람의 문체를 그대로 모사하거나 익숙한 시구를 차용하지 마세요.',
 '',
 '퇴고 기준:',
 '1. 시의 중심 정서, 구체적인 배경, 핵심 사물, 중요한 인물과 사건을 보존합니다.',
 '2. 도입(장면 제시) → 전개(관찰과 감정의 움직임) → 결말(설명하지 않는 울림)로 구조를 세웁니다.',
 '3. 추상적 감정 선언 대신 시각·청각·촉각 이미지, 동사, 실제 행동과 사물을 사용합니다.',
 '4. 상투적인 비유, 과도한 형용사와 부사, 중복된 이미지, 설명조 문장, 교훈적 결론, 과장된 감탄, 억지 의인화는 문맥에 맞게 수정합니다.',
 '5. 불필요한 직유와 접속사를 절제하고, 이미지 사이의 자연스러운 전환과 리듬을 살립니다.',
 '6. 원작에 없는 사실이나 지명을 꾸며내지 않고 자연스럽고 정확한 한국어를 씁니다.',
 '7. 지나친 난해함을 피하되 독자가 발견할 여백을 남깁니다. 원문의 독창적인 좋은 행은 살려도 좋습니다.',
 '8. 빈말로 칭찬하지 말고, 유명 시인과의 수준 비교·문학상 수상 가능성 같은 보증은 하지 마세요.',
 '',
 '출력 형식: (1) 최종 시 제목과 완성 시 전문 (2) 수정한 핵심 이유 3가지 (3) 마지막 행의 효과 평가 1문장.',
 '재창작은 3~5연, 총 12~22행을 원칙으로 하되 원문 길이가 짧으면 무리하게 늘리지 마세요.',
 '',
 '원작 제목: '+(title.trim()||'제목 없는 시'),
 '원작:',
 text.trim()
 ].join('\n');
}
