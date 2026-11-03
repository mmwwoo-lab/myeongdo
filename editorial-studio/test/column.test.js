import test from 'node:test';
import assert from 'node:assert/strict';
import {localColumn,normalizeArticle,guessTheme,generateColumn} from '../lib/column.mjs';
import {parseArticleHTML,validateArticleURL} from '../lib/article.js';
const example='대구 산업단지의 전력망 시설 개선 방안이 검토되고 있다는 가상의 기사다. 관련 기업은 공사 일정 공개를 요구하고 있으며 지방정부는 비용과 준공 시기를 함께 확인하기로 했다고 설명했다. 일부 주민은 공사 지연이 투자 결정에 영향을 미칠 수 있다고 지적했다. 반면 전문가들은 전체 전력망 계획에 근거한 조정이 필요하다는 의견을 내놓았다.';
test('basic editorial fallback creates sourced column in usable character range',()=>{
 const x=localColumn(example,'지역 전력망 시설의 일정 검토');
 assert.equal(x.mode,'basic');assert.match(x.headline,/지역 전력망/);assert.match(x.body,/기사/);assert.ok(x.body.length>=500&&x.body.length<=680,`length=${x.body.length}`);
 assert.ok(!x.body.includes('김진욱'));console.log('column length',x.body.length);
});
test('fallback refuses insufficient factual source',()=>assert.throws(()=>localColumn('짧음'),/100자/));
test('theme recognizes regional grid context',()=>assert.equal(guessTheme(example),'전력·산업 정책'));
test('AI without key falls back to basic',async()=>{const x=await generateColumn({article:example,title:'test'},fetch,{});assert.equal(x.mode,'basic');});
test('HTML extract reads JSON-LD article',()=>{
 const html=`<html><head><meta property="og:title" content="기사 제목"></head><body><script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"기사 표제","articleBody":"${'실제 내용이 들어가는 본문 '.repeat(18)}"}</script></body></html>`;
 const a=parseArticleHTML(html,'https://news.example.com/story');assert.equal(a.title,'기사 표제');assert.ok(a.body.length>180);
});
test('article importer rejects loopback and port injection',()=>{
 for(const url of ['http://example.com/abc','https://localhost/s','https://127.0.0.1/path','https://example.com:3000/test','https://user:pass@example.com'])assert.throws(()=>validateArticleURL(url));
});
