'use strict';
const status=document.getElementById('audio-status'),audio=document.querySelector('audio');
document.querySelector('.detail-head .read-actions')?.remove();
const playButton=document.getElementById('play');
if(audio&&playButton){
 audio.controls=false;
 playButton.textContent='▶ 읽기';
 const stopButton=document.createElement('button');
 stopButton.type='button';stopButton.className='btn secondary';stopButton.textContent='■ 정지';
 playButton.insertAdjacentElement('afterend',stopButton);
 playButton.addEventListener('click',async()=>{
  if(!audio.paused){audio.pause();return}
  try{await audio.play()}catch{if(status)status.textContent='낭송 재생에 실패했습니다. Chrome에서 다시 시도하세요.'}
 });
 stopButton.addEventListener('click',()=>{audio.pause();audio.currentTime=0;playButton.textContent='▶ 읽기';if(status)status.textContent='정지했습니다. 처음부터 다시 들을 수 있습니다.'});
 audio.addEventListener('play',()=>{playButton.textContent='Ⅱ 일시정지';if(status)status.textContent='여성 AI 전문 시낭송 재생 중'});
 audio.addEventListener('pause',()=>{if(!audio.ended)playButton.textContent=audio.currentTime>0?'▶ 이어읽기':'▶ 읽기'});
 audio.addEventListener('ended',()=>{playButton.textContent='▶ 읽기';if(status)status.textContent='전문 낭송이 끝났습니다.'});
 audio.addEventListener('error',()=>{if(status)status.textContent='낭송 음원을 불러오지 못했습니다.'});
}
