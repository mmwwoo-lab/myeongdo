/**
 * 명도재 시사컬럼 낭독기
 * 브라우저 SpeechSynthesis: 짧은 발화 하나씩 순차 재생, 안전한 중단/재개,
 * 원문 칼럼의 문장 인덱스를 보존한 미리보기 동기화.
 */
export function splitSpeechChunks(text, limit = 86) {
  const words = Array.from(String(text || '').replace(/\s+/g, ' ').trim());
  if (!words.length) return [];
  const out = [];
  let pos = 0;
  while (pos < words.length) {
    const remaining = words.length - pos;
    if (remaining <= limit) { out.push(words.slice(pos).join('').trim()); break; }
    const min = Math.max(pos + 24, pos + Math.floor(limit * .56));
    const max = Math.min(words.length, pos + limit);
    let cut = -1;
    for (let i = max; i >= min; i--) {
      if (/[\s,.;:!?，。…]/u.test(words[i - 1])) { cut = i; break; }
    }
    if (cut < 0) cut = max;
    const s = words.slice(pos, cut).join('').trim();
    if (s) out.push(s);
    pos = cut;
    while (pos < words.length && words[pos] === ' ') pos++;
  }
  return out.filter(Boolean);
}

export function planSpeech(title, parts, limit = 86) {
  const chunks = [];
  if (String(title || '').trim()) for (const text of splitSpeechChunks(title, limit)) chunks.push({ text, index: -1 });
  (parts || []).forEach((p, index) => {
    for (const text of splitSpeechChunks(p, limit)) chunks.push({ text, index });
  });
  return chunks;
}

export function chooseKoreanVoice(voices) {
  const korean = (voices || []).filter(v => /^ko(?:[-_]|$)/i.test(v.lang || ''));
  return korean.find(v => /female|여성|yuna|heami|sunhi|jiyun|sora|seoyeon|유나|선희|서연/i.test(v.name || '')) || korean[0] || null;
}

export class ColumnReader {
  constructor({ synth, Utterance, onState = () => {}, onProgress = () => {}, onComplete = () => {}, onError = () => {} } = {}) {
    this.synth = synth;
    this.Utterance = Utterance;
    this.onState = onState;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    this.runId = 0;
    this.tasks = [];
    this.cursor = 0;
    this.status = 'idle';
    this.timer = null;
    this.voice = null;
    this.current = null;
    this.rate = .9;
  }

  start({ title = '', parts = [], rate = .9 } = {}) {
    if (!this.synth || !this.Utterance || typeof this.synth.speak !== 'function') {
      throw new Error('이 브라우저는 음성 읽기를 지원하지 않습니다. 최신 Chrome 또는 Edge를 이용해 주세요.');
    }
    const tasks = planSpeech(title, parts);
    if (!tasks.length) throw new Error('읽을 칼럼 제목 또는 본문이 없습니다.');
    this.stop(false);
    this.tasks = tasks;
    this.cursor = 0;
    this.rate = Math.max(.65, Math.min(1.2, Number(rate) || .9));
    try { this.voice = chooseKoreanVoice(this.synth.getVoices?.() || []); } catch { this.voice = null; }
    this.status = 'playing';
    this.onState('playing', { voice: this.voice });
    this._next(this.runId);
    return { chunks: tasks.length, hasKoreanVoice: !!this.voice };
  }

  _next(run) {
    if (run !== this.runId || this.status !== 'playing') return;
    if (this.cursor >= this.tasks.length) {
      this.status = 'idle'; this.current = null; this._clearTimer();
      this.onState('idle'); this.onComplete(); return;
    }
    const task = this.tasks[this.cursor];
    const u = new this.Utterance(task.text);
    u.lang = 'ko-KR'; u.rate = this.rate; u.pitch = 1; u.volume = 1;
    if (this.voice) u.voice = this.voice;
    this.current = u;
    let settled = false;
    u.onstart = () => {
      if (run !== this.runId || settled) return;
      this.onProgress(task.index, { text: task.text, charIndex: 0 });
    };
    u.onboundary = (event) => {
      if (run !== this.runId || settled) return;
      this.onProgress(task.index, { text: task.text, charIndex: Number(event.charIndex) || 0 });
    };
    u.onend = () => {
      if (run !== this.runId || settled) return;
      settled = true; this._clearTimer(); this.current = null; this.cursor++;
      // Some engines do not accept reentrant speak() from an onend handler.
      this.timer = setTimeout(() => { this.timer = null; this._next(run); }, 85);
    };
    u.onerror = (event) => {
      if (run !== this.runId || settled) return;
      settled = true;
      const code = String(event?.error || 'unknown');
      if (['interrupted', 'canceled'].includes(code)) {
        this._fail(run, '음성 읽기가 중단되었습니다. 다시 칼럼 읽기를 눌러 주세요.');
      } else {
        this._fail(run, ({'not-allowed':'브라우저가 음성 재생을 차단했습니다. 화면을 터치한 뒤 다시 실행해 주세요.', 'voice-unavailable':'한국어 음성을 사용할 수 없습니다. 기기에 한국어 음성 데이터를 설치해 주세요.', 'audio-busy':'다른 앱이 오디오 출력을 사용 중입니다. 다른 재생을 멈추고 다시 실행해 주세요.', 'synthesis-failed':'음성 합성에 실패했습니다. 다른 브라우저에서 다시 시도해 주세요.'})[code] || `음성 엔진 오류(${code})가 발생했습니다.`);
      }
    };
    // Some browser speech engines stop emitting callbacks on long documents.
    // Do not invent progress; report a stalled engine and let the user retry.
    this._clearTimer();
    this.timer = setTimeout(() => {
      if (run !== this.runId || this.status !== 'playing') return;
      this._fail(run, '음성 엔진의 응답이 지연되어 낭독을 중지했습니다. 다시 읽기 버튼을 누르거나 다른 브라우저를 이용해 주세요.');
    }, 45000);
    try {
      this.synth.speak(u);
    } catch (err) {
      this._fail(run, `낭독을 시작하지 못했습니다: ${err?.message || String(err)}`);
    }
  }

  _clearTimer() { if (this.timer != null) clearTimeout(this.timer); this.timer = null; }
  _fail(run, message) {
    if (run !== this.runId) return;
    this.stop(false);
    this.onError(message);
  }
  pause() {
    if (this.status !== 'playing') return false;
    try { this.synth.pause(); this.status = 'paused'; this._clearTimer(); this.onState('paused'); return true; }
    catch (err) { this._fail(this.runId, `일시정지 오류: ${err.message}`); return false; }
  }
  resume() {
    if (this.status !== 'paused') return false;
    try {
      this.synth.resume(); this.status = 'playing'; this.onState('playing', { voice: this.voice });
      // Current utterance is resumed by engine; if it stopped between segments, queue the next one.
      if (!this.current && this.cursor < this.tasks.length) this._next(this.runId);
      else {
        const run = this.runId;
        this._clearTimer(); this.timer = setTimeout(() => { if (run === this.runId && this.status === 'playing') this._fail(run, '낭독이 재개되지 않았습니다. 정지 후 다시 시작해 주세요.'); }, 45000);
      }
      return true;
    } catch (err) { this._fail(this.runId, `이어읽기 오류: ${err.message}`); return false; }
  }
  stop(notify = true) {
    this.runId++;
    this._clearTimer();
    this.status = 'idle'; this.current = null;
    try { this.synth?.cancel?.(); } catch { /* already stopped */ }
    if (notify) this.onState('idle');
  }
}
