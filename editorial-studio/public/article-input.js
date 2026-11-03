/** 기사 URL 한 개 또는 제목·출처·내용 통합 입력 파서. 외부 요청 없는 순수 함수. */
export function parseArticleInput(raw = '') {
  const source = String(raw).replace(/\r\n?/g, '\n').trim();
  if (!source) return { title: '', source: '', body: '', url: '' };
  if (/^https?:\/\/[^\s]+$/i.test(source)) return { title: '', source: '', body: '', url: source };

  const lines = source.split('\n');
  let title = '', byline = '', body = [];
  let foundMetadata = false, inBody = false;
  for (const line of lines) {
    const cleaned = line.trim();
    if (!inBody) {
      const titleMatch = cleaned.match(/^(?:제목|기사\s*제목|title)\s*[:：]\s*(.*)$/i);
      const bylineMatch = cleaned.match(/^(?:출처|언론사|매체|신문사|source)\s*[:：]\s*(.*)$/i);
      const bodyMatch = cleaned.match(/^(?:내용|본문|기사\s*내용|article)\s*[:：]\s*(.*)$/i);
      if (titleMatch) { title = titleMatch[1].trim(); foundMetadata = true; continue; }
      if (bylineMatch) { byline = bylineMatch[1].trim(); foundMetadata = true; continue; }
      if (bodyMatch) { inBody = true; foundMetadata = true; if (bodyMatch[1].trim()) body.push(bodyMatch[1]); continue; }
      if (!foundMetadata && cleaned) {
        // 제목·출처 레이블이 없는 보통 기사 본문은 원문 전체를 유지한다.
        // 두 줄만 보고 제목/기자를 임의로 추정하지 않는다.
        inBody = true;
      } else if (foundMetadata && cleaned) {
        inBody = true;
      }
    }
    if (inBody) body.push(line);
  }
  return { title, source: byline, body: body.join('\n').trim(), url: '' };
}
