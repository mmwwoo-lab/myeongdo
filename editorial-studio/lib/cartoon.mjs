/** Original editorial-cartoon presets: five artists as historical reference, not style replication. */
export const CARTOON_PRESETS = Object.freeze({
  kim: {name:'김성환',subtitle:'간결한 고전 4컷 구성',approach:'an original four-panel black-ink newspaper narrative, sparse backgrounds, restrained comic understatement, clean dialogue balloons'},
  park: {name:'박재동',subtitle:'상황·현장 이야기형',approach:'an original narrative editorial illustration with expressive figures, contextual street-level environment, dynamic gestures and restrained Korean ink-and-watercolor textures'},
  yong: {name:'김용민',subtitle:'상징·은유 단컷 만평',approach:'an original single-panel symbolic cartoon focused on one oversized central metaphor, minimal crisp linework and pointed visual contrast'},
  jang: {name:'장봉군',subtitle:'표정·대사 중심 인물 풍자',approach:'an original satirical caricature with fictional anonymous public-official archetypes, dramatic expressions, comic exaggeration, punchy speech bubbles'},
  soon: {name:'박순찬',subtitle:'원인·결과 연속 풍자',approach:'an original three-beat editorial cartoon showing cause, public reaction, and responsibility with dynamic framing and ironic contrast'}
});
export function getCartoonPrompt({article='',headline='',style='yong'}={}){
 const preset=CARTOON_PRESETS[style];
 if(!preset)throw Error('지원하지 않는 만평 유형입니다.');
 const src=String(article||'').replace(/\s+/g,' ').slice(0,3400);
 if(src.length<80)throw Error('만평을 그리려면 기사 본문을 80자 이상 입력하세요.');
 return `Create a finished professional-quality ORIGINAL Korean newspaper editorial cartoon from the supplied article, in a wide 3:2 editorial layout. Composition: ${preset.approach}. Draw complex, polished, detailed and coherent cartoon art with clean ink outlines and vibrant editorial color, visual storytelling, visual irony and carefully crafted props. Convert the verified central issue into a sharp but fair visual metaphor, grounded only in the supplied article. Avoid invented allegations, fake facts, fabricated quotations, defamation and recognizable caricatures of specific real persons when not justified by supplied facts; use neutral fictional figures and symbolic objects. Do not copy or imitate any named artist's distinctive style or existing comics. No newspaper masthead, no signature, no watermark, no copied logos. Minimize embedded text because the app will add readable Korean labels. Article title: ${String(headline).slice(0,160)}. Article content: ${src}. The final image should be professional original political/editorial cartoon art, not a generic stock photo.`;
}
