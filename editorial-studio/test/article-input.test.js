import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArticleInput} from '../public/article-input.js';
import {buildArticleReport} from '../lib/column.mjs';
const body = '대구지역의 신설 산업시설 투자가 예정돼 있다. 담당 기관은 다양한 설비 조달 일정과 예산을 검토할 방침이라고 밝혔다. 지역 주민들은 사업 지연 가능성과 함께 공급 안전성 문제를 우려했다. 시의회는 공식 자료 공개와 지역 사업에 대한 일정 설명을 요구했다. 이와 관련한 최종 결정은 아직 확정되지 않았다.';
test('one box title source and body',()=>{
  const r=parseArticleInput(`제목: 전력 기반 시설\n출처: 지역신문 A\n내용: ${body}`);
  assert.equal(r.title,'전력 기반 시설');assert.equal(r.source,'지역신문 A');assert.equal(r.body,body);assert.equal(r.url,'');
});
test('pasted body only is preserved',()=>assert.equal(parseArticleInput(body).body,body));
test('URL alone is recognized',()=>assert.equal(parseArticleInput('https://example.com/news/1').url,'https://example.com/news/1'));
test('report is grounded, structured',()=>{
  const r=buildArticleReport({article:body,title:'전력 기반 시설',source:'지역신문 A'});
  assert.equal(r.headline,'전력 기반 시설');assert.equal(r.sections.length,3);assert.match(r.sections[0].text,/기사/);assert.match(r.disclaimer,/사실 확인/);
});
