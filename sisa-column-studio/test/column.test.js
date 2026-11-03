import test from 'node:test';
import assert from 'node:assert/strict';
import {localColumn,normalizeArticle,guessTheme,generateColumn} from '../lib/column.mjs';
import {parseArticleHTML,validateArticleURL} from '../lib/article.js';
const example='대구 산업단지의 전력망 시설 개선 방안이 검토되고 있다는 가상의 기사다. 관련 기업은 공사 일정 공개를 요구하고 있으며 지방정부는 비용과 준공 시기를 함께 확인하기로 했다고 설명했다. 일부 주민은 공사 지연이 투자 결정에 영향을 미칠 수 있다고 지적했다. 반면 전문가들은 전체 전력망 계획에 근거한 조정이 필요하다는 의견을 내놓았다.';
test('basic editorial fallback creates sourced column in usable character range',()=>{
 const x=localColumn(example,'지역 전력망 시설의 일정 검토');
 assert.equal(x.mode,'keyless');assert.match(x.headline,/지역 전력망/);assert.match(x.body,/기사/);assert.ok(x.body.length>=500&&x.body.length<=680,`length=${x.body.length}`);
 assert.ok(!x.body.includes('김진욱'));console.log('column length',x.body.length);
});
test('fallback refuses insufficient factual source',()=>assert.throws(()=>localColumn('짧음'),/100자/));
test('theme recognizes regional grid context',()=>assert.equal(guessTheme(example),'전력·산업 정책'));
test('API key 없는 기본 모드로 고정',async()=>{const x=await generateColumn({article:example,title:'test'},fetch,{});assert.equal(x.mode,'keyless');});
test('HTML extract reads JSON-LD article',()=>{
 const html=`<html><head><meta property="og:title" content="기사 제목"></head><body><script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"기사 표제","articleBody":"${'실제 내용이 들어가는 본문 '.repeat(18)}"}</script></body></html>`;
 const a=parseArticleHTML(html,'https://news.example.com/story');assert.equal(a.title,'기사 표제');assert.ok(a.body.length>180);
});
test('article importer rejects loopback and port injection',()=>{
 for(const url of ['http://example.com/abc','https://localhost/s','https://127.0.0.1/path','https://example.com:3000/test','https://user:pass@example.com'])assert.throws(()=>validateArticleURL(url));
});


test('article summary excerpts must be exact parts of user-supplied text', async()=>{
 const {extractArticlePoints}=await import('../lib/column.mjs');
 const s='위원회는 자료를 검토 중이라고 발표했다. 지역 상인회는 정책 결정이 늦어질 수 있다고 우려했다. 담당 기관은 추가 설명회를 열겠다고 밝혔다.';
 const points=extractArticlePoints(s);
 assert.equal(points.length,3);
 for(const p of points)assert.ok(s.includes(p));
});


test('API 키가 환경에 있더라도 외부 생성 서비스를 호출하지 않음',async()=>{
 let called=false;const forbidden=async()=>{called=true;throw Error('network should not be called')};
 const result=await generateColumn({article:example,title:'전력망 시설'},forbidden,{OPENAI_API_KEY:'not-used'});
 assert.equal(called,false);assert.equal(result.mode,'keyless');
 assert.ok(result.summary.length>0);
});
test('문화예술 및 행정 주제에 맞는 논평 초안 생성',()=>{
 const culture='지역문화재단은 창작자 지원을 위한 지역예술 전시를 기획했다고 발표했다. 전시 프로그램에 지역 작가들의 참여 기회를 확대하겠다고 설명했다. 예산 집행 계획에 대해 추가 검토가 필요하다는 의견이 나왔다. 지역 문화 단체들은 관람객 접근성과 지속 가능한 창작 여건을 마련해야 한다고 요청했다.';
 const admin='시청 담당 부서는 정책의 결정 경위에 대해 새로운 설명회를 준비 중이라고 말했다. 시민단체는 행정 절차가 명확하게 공개되지 않았다고 지적했다. 담당 시의회는 정책 검토와 의사결정 과정을 확인하겠다고 밝혔다. 지역 시민들은 책임 있는 행정 주체가 사업 일정과 자료를 설명해야 한다고 요구했다.';
 for (const [content,theme] of [[culture,'문화·예술'],[admin,'행정·정치']]) {
  const v=localColumn(content);assert.equal(v.theme,theme);
  assert.ok(v.body.length>=530&&v.body.length<=650,`length ${v.body.length}`);
  assert.ok(!v.body.includes('실제로 확정됐다'));
 }
});
