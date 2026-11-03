import test from 'node:test';
import assert from 'node:assert/strict';
import {splitSpeechChunks,planSpeech,chooseKoreanVoice,ColumnReader} from '../public/reader.js';

function setup(){
 const events=[];
 const synth={calls:[],cancelCalls:0,paused:false,speaking:false,
  getVoices(){return [{name:'Korean Female',lang:'ko-KR'},{name:'English',lang:'en-US'}]},
  speak(u){this.calls.push(u);this.speaking=true;u.onstart?.();},
  pause(){this.paused=true;}, resume(){this.paused=false;},
  cancel(){this.cancelCalls++;this.speaking=false;}};
 class Utterance{constructor(text){this.text=text;}}
 const reader=new ColumnReader({synth,Utterance,
  onState:status=>events.push(['state',status]),
  onProgress:(index,data)=>events.push(['progress',index,data.charIndex]),
  onComplete:()=>events.push(['complete']),
  onError:msg=>events.push(['error',msg])});
 return {reader,synth,events};
}
test('낭독 내용을 짧은 음성 구간으로 분할하되 내용 보존',()=>{
 const text='정부 예산 논의가 이어진다. '.repeat(26);
 const chunks=splitSpeechChunks(text,72);
 assert.ok(chunks.length>2);
 assert.ok(chunks.every(s=>[...s].length<=72));
 assert.equal(chunks.join('').replace(/\s/g,''),text.replace(/\s/g,''));
});
test('칼럼 제목과 본문의 원문 문장 인덱스를 유지',()=>{
 const plan=planSpeech('제목',['첫 문장이다.','두 번째 문장이다.']);
 assert.deepEqual(plan.map(p=>p.index),[-1,0,1]);
});
test('한국어 여성 음성 우선 선택',()=>{
 assert.equal(chooseKoreanVoice([{name:'English',lang:'en-US'},{name:'Korean Female',lang:'ko-KR'}]).name,'Korean Female');
 assert.equal(chooseKoreanVoice([{name:'English',lang:'en-US'}]),null);
});
test('읽기 → 문장 이동 → 읽기 완료 상태 전환',async()=>{
 const {reader,synth,events}=setup();
 reader.start({title:'제목',parts:['첫 문장','다음 문장'],rate:.9});
 assert.equal(synth.calls.length,1);
 assert.equal(reader.status,'playing');
 assert.deepEqual(events.filter(e=>e[0]==='progress').at(-1).slice(0,2),['progress',-1]);
 synth.calls.at(-1).onend();await new Promise(r=>setTimeout(r,115));
 assert.equal(synth.calls.length,2);
 assert.equal(events.filter(e=>e[0]==='progress').at(-1)[1],0);
 synth.calls.at(-1).onend();await new Promise(r=>setTimeout(r,115));
 assert.equal(synth.calls.length,3);
 assert.equal(events.filter(e=>e[0]==='progress').at(-1)[1],1);
 synth.calls.at(-1).onend();await new Promise(r=>setTimeout(r,115));
 assert.equal(reader.status,'idle');assert.ok(events.some(e=>e[0]==='complete'));
 reader.stop(false);
});
test('일시정지·이어읽기·정지',()=>{
 const {reader,synth}=setup();reader.start({parts:['시험 발화']});
 assert.equal(reader.pause(),true);assert.equal(synth.paused,true);
 assert.equal(reader.status,'paused');
 assert.equal(reader.resume(),true);assert.equal(synth.paused,false);
 reader.stop();assert.equal(reader.status,'idle');
 assert.ok(synth.cancelCalls>=1);
});
test('음성 오류 시 사용자에게 원인을 알리고 재시작할 수 있음',()=>{
 const {reader,synth,events}=setup();reader.start({parts:['한 문장']});
 synth.calls[0].onerror({error:'not-allowed'});
 assert.equal(reader.status,'idle');assert.ok(events.some(e=>e[0]==='error'&&e[1].includes('차단')));
 reader.start({parts:['다시 한 문장']});assert.equal(reader.status,'playing');reader.stop(false);
});
test('중단된 이전 음성 콜백은 새 낭독에 영향 없음',()=>{
 const {reader,synth,events}=setup();reader.start({parts:['첫번째']});let old=synth.calls[0];
 reader.start({parts:['두번째']});old.onend?.();
 assert.equal(reader.cursor,0);assert.equal(reader.status,'playing');
 assert.equal(events.filter(e=>e[0]==='complete').length,0);
 reader.stop(false);
});
