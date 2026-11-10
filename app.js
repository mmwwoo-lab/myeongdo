// ==========================================================================
// 명도재 디지털 문학관 — 메인 애플리케이션 로직 (app.js)
// ==========================================================================

(function () {
  "use strict";

  // 애플리케이션 상태
  const state = {
    currentSection: "today-poem",
    todayPoemId: "poem-1",
    selectedPoemId: "poem-1",
    poetryChapterFilter: "all",
    poetrySearchQuery: "",
    selectedEssayId: "essay-1",
    selectedNewsId: "news-1",
    artCategoryFilter: "all",
    currentModalArtId: "art-1",
    tocCategoryFilter: "all",
    fontSize: "normal"
  };

  // 음성 낭송(TTS) 상태 관리 (읽어주기 · 일시정지 · 이어 읽기 완벽 지원)
  const ttsState = {
    sessionId: 0, // 비동기 타이머·이벤트 충돌 방지용 고유 세션 토큰
    status: "idle", // 'idle' | 'playing' | 'paused'
    sourceSection: "today-poem", // 'today-poem' | 'poetry-book' | 'life-essays' | 'literary-news' | 'art-gallery'
    workId: "poem-1",
    workTitle: "",
    workTypeLabel: "시 낭송",
    chunks: [], // [{ text, domElement }]
    currentIndex: 0,
    charOffset: 0, // 문단 중간 일시정지 시 이어 읽을 글자 오프셋
    rate: 0.92,
    utterance: null,
    speakTimer: null
  };

  // 은은한 수묵·서정 배경선율 (Web Audio API 신시사이저)
  const bgmController = {
    isPlaying: false,
    ctx: null,
    intervalId: null,
    start() {
      if (this.isPlaying) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.isPlaying = true;
      this.updateButton();

      // 한국적 5음계(궁상각치우: C4, D4, E4, G4, A4, C5, D5, E5) 잔잔한 아르페지오
      const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
      let step = 0;
      const pattern = [0, 2, 3, 5, 4, 2, 1, 3];

      const playNote = () => {
        if (!this.isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        const freq = notes[pattern[step % pattern.length]];
        step++;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.035, now + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.0008, now + 3.2);

        osc.connect(noteGain);
        noteGain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 3.3);
      };

      playNote();
      this.intervalId = window.setInterval(playNote, 2400);
    },
    stop() {
      this.isPlaying = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.updateButton();
    },
    toggle() {
      if (this.isPlaying) {
        this.stop();
      } else {
        this.start();
      }
    },
    updateButton() {
      const btn = document.getElementById("bgm-toggle-btn");
      if (!btn) return;
      btn.setAttribute("aria-pressed", String(this.isPlaying));
      btn.innerHTML = this.isPlaying
        ? "<span>🎹 배경선율 켜짐</span>"
        : "<span>🎹 배경선율 꺼짐</span>";
    }
  };

  // ==========================================================================
  // 초기화
  // ==========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    if ("speechSynthesis" in window) {
      // 브라우저 음성 목록 사전 로드
      window.speechSynthesis.getVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }

    initAuthorBanner();
    initNavigation();
    initFontControls();
    initTodayPoemSection();
    initPoetryBookSection();
    initEssaysSection();
    initNewspaperSection();
    initArtGallerySection();
    initModalsAndSearch();
    initTTSControls();

    // URL 해시가 있으면 해당 섹션으로 이동
    const hash = window.location.hash.replace("#", "");
    const validSections = ["today-poem", "poetry-book", "life-essays", "literary-news", "art-gallery"];
    if (validSections.includes(hash)) {
      switchSection(hash, false);
    }
  });

  // ==========================================================================
  // 작가 배너 및 총 작품 수 초기화
  // ==========================================================================
  function initAuthorBanner() {
    const philEl = document.getElementById("author-philosophy");
    if (philEl) {
      philEl.textContent = MUSEUM_DATA.author.philosophy;
    }

    const totalWorks =
      MUSEUM_DATA.poems.length +
      MUSEUM_DATA.essays.length +
      MUSEUM_DATA.newspaper.length +
      MUSEUM_DATA.artworks.length;

    const heroTocBtn = document.getElementById("hero-open-toc-btn");
    if (heroTocBtn) {
      heroTocBtn.innerHTML = `<span>📑 전체 작품 목차 보기 (총 ${totalWorks}편)</span>`;
    }

    const headingPoetry = document.getElementById("heading-poetry-book");
    if (headingPoetry) {
      headingPoetry.textContent = `디지털 시집 (전 ${MUSEUM_DATA.poems.length}편)`;
    }

    const allTabBtn = document.querySelector('#poetry-chapter-tabs [data-chapter="all"]');
    if (allTabBtn) {
      allTabBtn.textContent = `전체 (${MUSEUM_DATA.poems.length})`;
    }
  }

  // ==========================================================================
  // 메뉴 네비게이션
  // ==========================================================================
  function initNavigation() {
    document.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = btn.getAttribute("data-nav");
        if (target) {
          switchSection(target, true);
        }
      });
    });
  }

  function switchSection(sectionId, scrollToMain = true) {
    state.currentSection = sectionId;

    // 상단 메뉴 활성화 표시
    document.querySelectorAll(".main-nav .nav-link").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("data-nav") === sectionId);
    });

    // 섹션 표시 전환
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `section-${sectionId}`);
    });

    if (history.replaceState) {
      history.replaceState(null, "", `#${sectionId}`);
    }

    // 만약 낭송이 대기 상태(idle)라면 현재 섹션에 맞춰 하단 바 안내 문구 동기화
    if (ttsState.status === "idle") {
      syncIdleGlobalBarForSection(sectionId);
    }

    if (scrollToMain) {
      const mainEl = document.getElementById("main-content");
      if (mainEl) {
        mainEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function syncIdleGlobalBarForSection(sectionId) {
    if (sectionId === "today-poem") {
      const p = MUSEUM_DATA.poems.find((x) => x.id === state.todayPoemId) || MUSEUM_DATA.poems[0];
      updateGlobalBarMetadata("오늘의 시", p.title, "읽어주기 버튼을 누르면 시 낭송이 시작됩니다");
    } else if (sectionId === "poetry-book") {
      const p = MUSEUM_DATA.poems.find((x) => x.id === state.selectedPoemId) || MUSEUM_DATA.poems[0];
      updateGlobalBarMetadata("디지털 시집", p.title, "읽어주기 버튼을 누르면 시 낭송이 시작됩니다");
    } else if (sectionId === "life-essays") {
      const e = MUSEUM_DATA.essays.find((x) => x.id === state.selectedEssayId) || MUSEUM_DATA.essays[0];
      updateGlobalBarMetadata("생활수필", e.title, "읽어주기 버튼을 누르면 수필 낭독이 시작됩니다");
    } else if (sectionId === "literary-news") {
      const n = MUSEUM_DATA.newspaper.find((x) => x.id === state.selectedNewsId) || MUSEUM_DATA.newspaper[0];
      updateGlobalBarMetadata("문예신문", n.title, "읽어주기 버튼을 누르면 기사 낭독이 시작됩니다");
    } else if (sectionId === "art-gallery") {
      const a = MUSEUM_DATA.artworks.find((x) => x.id === state.currentModalArtId) || MUSEUM_DATA.artworks[0];
      updateGlobalBarMetadata("미술 작품 해설", a.title, "읽어주기 버튼을 누르면 작품 해설을 읽어줍니다");
    }
  }

  // ==========================================================================
  // 글자 크기 조절
  // ==========================================================================
  function initFontControls() {
    const buttons = document.querySelectorAll(".font-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const size = btn.getAttribute("data-fontsize") || "normal";
        state.fontSize = size;
        document.body.className = `font-size-${size}`;
        buttons.forEach((b) => b.classList.toggle("active", b === btn));
      });
    });
  }

  // ==========================================================================
  // 1. 오늘의 시 (Today's Poem)
  // ==========================================================================
  function initTodayPoemSection() {
    const selectEl = document.getElementById("today-poem-select");
    if (selectEl) {
      selectEl.innerHTML = MUSEUM_DATA.poems
        .map(
          (p, idx) =>
            `<option value="${p.id}">${idx + 1}. ${p.title} (${p.chapter.replace(/^제\d부\s*/, "")})</option>`
        )
        .join("");

      // 날짜 기반 오늘의 추천 시 기본 선정 (첫 방문 시 대표시 중 하나)
      const featuredPoems = MUSEUM_DATA.poems.filter((p) => p.featured);
      const dayIndex = new Date().getDate() % featuredPoems.length;
      state.todayPoemId = featuredPoems[dayIndex]?.id || MUSEUM_DATA.poems[0].id;
      selectEl.value = state.todayPoemId;

      selectEl.addEventListener("change", () => {
        renderTodayPoem(selectEl.value, true);
      });
    }

    const randomBtn = document.getElementById("random-today-poem-btn");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const others = MUSEUM_DATA.poems.filter((p) => p.id !== state.todayPoemId);
        const pick = others[Math.floor(Math.random() * others.length)] || MUSEUM_DATA.poems[0];
        if (selectEl) selectEl.value = pick.id;
        renderTodayPoem(pick.id, true);
      });
    }

    document.getElementById("prev-today-poem-btn")?.addEventListener("click", () => {
      const idx = MUSEUM_DATA.poems.findIndex((p) => p.id === state.todayPoemId);
      const prevIdx = (idx - 1 + MUSEUM_DATA.poems.length) % MUSEUM_DATA.poems.length;
      const pick = MUSEUM_DATA.poems[prevIdx];
      if (selectEl) selectEl.value = pick.id;
      renderTodayPoem(pick.id, true);
    });

    document.getElementById("next-today-poem-btn")?.addEventListener("click", () => {
      const idx = MUSEUM_DATA.poems.findIndex((p) => p.id === state.todayPoemId);
      const nextIdx = (idx + 1) % MUSEUM_DATA.poems.length;
      const pick = MUSEUM_DATA.poems[nextIdx];
      if (selectEl) selectEl.value = pick.id;
      renderTodayPoem(pick.id, true);
    });

    const heroListenBtn = document.getElementById("hero-listen-today-btn");
    if (heroListenBtn) {
      heroListenBtn.addEventListener("click", () => {
        switchSection("today-poem", true);
        startTodayPoemTTS(0);
      });
    }

    // 오늘의 시 시화 카드 클릭 시 라이트박스 열기
    const openCompanionArt = () => {
      const poem = MUSEUM_DATA.poems.find((p) => p.id === state.todayPoemId) || MUSEUM_DATA.poems[0];
      const art = getCompanionArtworkForPoem(poem);
      if (art) openArtLightbox(art);
    };
    document.getElementById("today-companion-img-wrap")?.addEventListener("click", openCompanionArt);
    document.getElementById("today-companion-img-wrap")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCompanionArt();
      }
    });
    document.getElementById("today-companion-zoom-btn")?.addEventListener("click", openCompanionArt);

    renderTodayPoem(state.todayPoemId, false);
  }

  function getCompanionArtworkForPoem(poem) {
    const t = poem.title + " " + (poem.tags || []).join(" ");
    if (t.includes("매화")) return MUSEUM_DATA.artworks.find((a) => a.id === "art-6");
    if (t.includes("시장") || t.includes("우뭇가사리")) return MUSEUM_DATA.artworks.find((a) => a.id === "art-5");
    if (t.includes("앞산") || t.includes("인왕")) return MUSEUM_DATA.artworks.find((a) => a.id === "art-2");
    if (t.includes("주리못") || t.includes("벤치") || t.includes("연인")) return MUSEUM_DATA.artworks.find((a) => a.id === "art-11");
    if (t.includes("고산골") || t.includes("물에게")) return MUSEUM_DATA.artworks.find((a) => a.id === "art-10");
    if (t.includes("신천") || t.includes("왜가리")) return MUSEUM_DATA.artworks.find((a) => a.id === "art-9");
    if (t.includes("봇나무") || t.includes("겨울")) return MUSEUM_DATA.artworks.find((a) => a.id === "art-4");
    return MUSEUM_DATA.artworks.find((a) => a.id === "art-6") || MUSEUM_DATA.artworks[0];
  }

  function renderTodayPoem(poemId, scrollCard = false) {
    const poem = MUSEUM_DATA.poems.find((p) => p.id === poemId) || MUSEUM_DATA.poems[0];
    const prevId = state.todayPoemId;
    state.todayPoemId = poem.id;

    // 만약 오늘의 시를 낭송 중이었는데 다른 시로 변경했다면 기존 낭송 정리
    if (
      ttsState.status !== "idle" &&
      ttsState.sourceSection === "today-poem" &&
      prevId !== poem.id
    ) {
      stopTTS();
    }

    const selectEl = document.getElementById("today-poem-select");
    if (selectEl && selectEl.value !== poem.id) {
      selectEl.value = poem.id;
    }

    document.getElementById("today-poem-chapter").textContent = poem.chapter;
    document.getElementById("today-poem-date").textContent = `${poem.date} · 명도재 시선`;
    document.getElementById("today-poem-title").textContent = poem.title;

    const subEl = document.getElementById("today-poem-subtitle");
    if (poem.subtitle) {
      subEl.textContent = `― ${poem.subtitle}`;
      subEl.hidden = false;
    } else {
      subEl.textContent = "";
      subEl.hidden = true;
    }

    // 연(Stanza) 단위 렌더링
    const bodyEl = document.getElementById("today-poem-body");
    const stanzas = poem.content.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    bodyEl.innerHTML = stanzas
      .map(
        (stanza, idx) =>
          `<div class="poem-stanza" data-stanza-index="${idx}" title="클릭하면 이 연부터 읽어줍니다">${escapeHtml(stanza)}</div>`
      )
      .join("");

    // 연 클릭 시 해당 연부터 읽기
    bodyEl.querySelectorAll(".poem-stanza").forEach((el, idx) => {
      el.addEventListener("click", () => {
        startTodayPoemTTS(idx + 1); // 0번은 제목이므로 +1
      });
    });

    // 태그 렌더링
    const tagsEl = document.getElementById("today-poem-tags");
    tagsEl.innerHTML = (poem.tags || [])
      .map((tag) => `<button type="button" class="tag-chip" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`)
      .join("");
    tagsEl.querySelectorAll(".tag-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        openSearchModalWithQuery(chip.getAttribute("data-tag"));
      });
    });

    // 어울리는 시화 이미지 업데이트
    const art = getCompanionArtworkForPoem(poem);
    if (art) {
      const imgEl = document.getElementById("today-companion-img");
      const titleEl = document.getElementById("today-companion-title");
      const descEl = document.getElementById("today-companion-desc");
      if (imgEl) {
        imgEl.src = art.image;
        imgEl.alt = art.title;
      }
      if (titleEl) titleEl.textContent = art.title;
      if (descEl) descEl.textContent = art.meaning;
    }

    // 시평 업데이트
    const critiqueBox = document.getElementById("today-critique-box");
    const critiqueAuthor = document.getElementById("today-critique-author");
    const critiqueText = document.getElementById("today-critique-text");
    if (poem.critique) {
      critiqueBox.hidden = false;
      critiqueAuthor.textContent = poem.critiqueAuthor || "문학평론 해설";
      critiqueText.textContent = poem.critique;
    } else {
      critiqueBox.hidden = false;
      critiqueAuthor.textContent = "명도재 시인의 창작 노트";
      critiqueText.textContent = `「${poem.title}」은(는) ${poem.chapter}에 수록된 서정시로, 일상과 자연 속에서 마주한 그리움과 생명의 온기를 맑은 수채화빛 시어로 담아낸 작품입니다.`;
    }

    if (ttsState.status === "idle") {
      updateGlobalBarMetadata("오늘의 시", poem.title, "읽어주기 버튼을 누르면 시 낭송이 시작됩니다");
    }

    if (scrollCard) {
      document.getElementById("today-poem-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ==========================================================================
  // 2. 디지털 시집 (Digital Poetry Collection)
  // ==========================================================================
  function initPoetryBookSection() {
    // 장(Chapter) 필터 탭
    const tabs = document.querySelectorAll("#poetry-chapter-tabs .chapter-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        state.poetryChapterFilter = tab.getAttribute("data-chapter") || "all";
        renderPoetryTOCAndGrid();

        // 선택한 부(Chapter)의 첫 번째 시를 감상실에 즉시 표시
        const filtered = getFilteredPoems();
        if (filtered.length > 0 && !filtered.some((p) => p.id === state.selectedPoemId)) {
          renderBookReaderPoem(filtered[0].id, false);
        } else {
          updateBookPageIndicators();
        }
      });
    });

    // 시집 내 검색창
    const searchInput = document.getElementById("poetry-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.poetrySearchQuery = searchInput.value.trim();
        renderPoetryTOCAndGrid();
        const filtered = getFilteredPoems();
        if (filtered.length > 0 && !filtered.some((p) => p.id === state.selectedPoemId)) {
          renderBookReaderPoem(filtered[0].id, false);
        } else {
          updateBookPageIndicators();
        }
      });
    }

    // 상단·하단 이전 시 / 다음 시 버튼
    document.getElementById("prev-poem-btn")?.addEventListener("click", () => {
      navigatePoemByOffset(-1);
    });
    document.getElementById("next-poem-btn")?.addEventListener("click", () => {
      navigatePoemByOffset(1);
    });
    document.getElementById("prev-poem-bottom-btn")?.addEventListener("click", () => {
      navigatePoemByOffset(-1);
    });
    document.getElementById("next-poem-bottom-btn")?.addEventListener("click", () => {
      navigatePoemByOffset(1);
    });

    renderPoetryTOCAndGrid();
    renderBookReaderPoem(state.selectedPoemId, false);
  }

  function getFilteredPoems() {
    return MUSEUM_DATA.poems.filter((poem) => {
      const matchChapter =
        state.poetryChapterFilter === "all" || poem.chapter === state.poetryChapterFilter;
      if (!matchChapter) return false;

      if (!state.poetrySearchQuery) return true;
      const q = state.poetrySearchQuery.toLowerCase();
      const hay = [
        poem.title,
        poem.subtitle || "",
        poem.chapter,
        poem.content,
        poem.critique || "",
        (poem.tags || []).join(" ")
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function updateBookPageIndicators() {
    const filtered = getFilteredPoems();
    const list = filtered.length > 0 ? filtered : MUSEUM_DATA.poems;
    const idxInList = list.findIndex((p) => p.id === state.selectedPoemId);
    const label =
      idxInList >= 0
        ? `${idxInList + 1} / ${list.length}`
        : `${MUSEUM_DATA.poems.findIndex((p) => p.id === state.selectedPoemId) + 1} / ${MUSEUM_DATA.poems.length}`;

    const topInd = document.getElementById("book-page-indicator");
    const botInd = document.getElementById("book-page-bottom-indicator");
    if (topInd) topInd.textContent = label;
    if (botInd) botInd.textContent = label;
  }

  function renderPoetryTOCAndGrid() {
    const filtered = getFilteredPoems();
    const tocList = document.getElementById("poetry-toc-list");
    const gridEl = document.getElementById("poetry-cards-grid");
    const countBadge = document.getElementById("poetry-count-badge");

    if (countBadge) {
      countBadge.textContent = `${filtered.length}편`;
    }

    if (filtered.length === 0) {
      tocList.innerHTML = `<p style="padding:1rem;color:var(--ink-muted);font-size:0.95rem;">검색 조건에 맞는 시가 없습니다.</p>`;
      gridEl.innerHTML = `<p style="padding:1.5rem;color:var(--ink-muted);">검색 결과가 없습니다. 다른 검색어를 입력해 보세요.</p>`;
      return;
    }

    // 목차(TOC)를 부(Chapter)별로 그룹화하여 렌더링
    const chapters = [];
    filtered.forEach((p) => {
      if (!chapters.includes(p.chapter)) chapters.push(p.chapter);
    });

    let tocHtml = "";
    chapters.forEach((chap) => {
      tocHtml += `<div class="toc-chapter-group-title">${escapeHtml(chap)}</div>`;
      const poemsInChap = filtered.filter((p) => p.chapter === chap);
      poemsInChap.forEach((poem) => {
        const globalIdx = MUSEUM_DATA.poems.findIndex((item) => item.id === poem.id) + 1;
        const isActive = poem.id === state.selectedPoemId;
        tocHtml += `
          <button type="button" class="toc-item-btn ${isActive ? "active" : ""}" data-poem-id="${poem.id}">
            <span>${escapeHtml(poem.title)}</span>
            <span class="toc-item-num">${String(globalIdx).padStart(2, "0")}</span>
          </button>
        `;
      });
    });
    tocList.innerHTML = tocHtml;

    tocList.querySelectorAll(".toc-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-poem-id");
        renderBookReaderPoem(id, true);
      });
    });

    // 하단 전체 시 카드 그리드 렌더링
    gridEl.innerHTML = filtered
      .map((poem) => {
        const globalIdx = MUSEUM_DATA.poems.findIndex((item) => item.id === poem.id) + 1;
        const isActive = poem.id === state.selectedPoemId;
        return `
          <article class="poem-mini-card ${isActive ? "active" : ""}" data-poem-card-id="${poem.id}">
            <div>
              <span class="poem-chapter-badge">${escapeHtml(poem.chapter.replace(/^제\d부\s*/, ""))}</span>
              <h4>${globalIdx}. ${escapeHtml(poem.title)}</h4>
              <p class="poem-mini-excerpt">${escapeHtml(poem.excerpt)}</p>
            </div>
            <div class="poem-mini-footer">
              <span>시 감상 및 낭송 듣기</span>
              <span>→</span>
            </div>
          </article>
        `;
      })
      .join("");

    gridEl.querySelectorAll(".poem-mini-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-poem-card-id");
        renderBookReaderPoem(id, true);
      });
    });
  }

  function renderBookReaderPoem(poemId, scrollReaderIntoView = false) {
    const idx = MUSEUM_DATA.poems.findIndex((p) => p.id === poemId);
    const poem = idx >= 0 ? MUSEUM_DATA.poems[idx] : MUSEUM_DATA.poems[0];
    const prevId = state.selectedPoemId;
    state.selectedPoemId = poem.id;

    if (
      ttsState.status !== "idle" &&
      ttsState.sourceSection === "poetry-book" &&
      prevId !== poem.id
    ) {
      stopTTS();
    }

    updateBookPageIndicators();
    document.getElementById("reader-poem-chapter").textContent = poem.chapter;
    document.getElementById("reader-poem-date").textContent = poem.date;
    document.getElementById("reader-poem-title").textContent = poem.title;

    const subEl = document.getElementById("reader-poem-subtitle");
    if (poem.subtitle) {
      subEl.textContent = `― ${poem.subtitle}`;
      subEl.hidden = false;
    } else {
      subEl.textContent = "";
      subEl.hidden = true;
    }

    const bodyEl = document.getElementById("reader-poem-body");
    const stanzas = poem.content.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    bodyEl.innerHTML = stanzas
      .map(
        (stanza, sIdx) =>
          `<div class="poem-stanza" data-stanza-index="${sIdx}" title="클릭하면 이 연부터 읽어줍니다">${escapeHtml(stanza)}</div>`
      )
      .join("");

    bodyEl.querySelectorAll(".poem-stanza").forEach((el, sIdx) => {
      el.addEventListener("click", () => {
        startReaderPoemTTS(sIdx + 1);
      });
    });

    const tagsEl = document.getElementById("reader-poem-tags");
    tagsEl.innerHTML = (poem.tags || [])
      .map((tag) => `<button type="button" class="tag-chip" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`)
      .join("");
    tagsEl.querySelectorAll(".tag-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        openSearchModalWithQuery(chip.getAttribute("data-tag"));
      });
    });

    const critiqueBox = document.getElementById("reader-critique-box");
    const critiqueAuthor = document.getElementById("reader-critique-author");
    const critiqueText = document.getElementById("reader-critique-text");
    if (poem.critique) {
      critiqueBox.hidden = false;
      critiqueAuthor.textContent = poem.critiqueAuthor || "시평(詩評)";
      critiqueText.textContent = poem.critique;
    } else {
      critiqueBox.hidden = false;
      critiqueAuthor.textContent = "명도재 시인의 창작 노트";
      critiqueText.textContent = `「${poem.title}」은(는) ${poem.chapter}에 수록된 서정시로, 삶과 자연의 여백을 수묵담채의 시선으로 담아낸 작품입니다.`;
    }

    // 목차 및 카드 활성화 상태 동기화
    document.querySelectorAll("#poetry-toc-list .toc-item-btn").forEach((btn) => {
      const active = btn.getAttribute("data-poem-id") === poem.id;
      btn.classList.toggle("active", active);
      if (active && scrollReaderIntoView) {
        btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
    document.querySelectorAll("#poetry-cards-grid .poem-mini-card").forEach((card) => {
      card.classList.toggle("active", card.getAttribute("data-poem-card-id") === poem.id);
    });

    if (ttsState.status === "idle" && state.currentSection === "poetry-book") {
      updateGlobalBarMetadata("디지털 시집", poem.title, "읽어주기 버튼을 누르면 시 낭송이 시작됩니다");
    }

    if (scrollReaderIntoView) {
      const readerCard = document.getElementById("book-reader-card");
      if (readerCard) {
        readerCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function navigatePoemByOffset(offset) {
    const filtered = getFilteredPoems();
    const list = filtered.length > 0 ? filtered : MUSEUM_DATA.poems;
    const currIdx = list.findIndex((p) => p.id === state.selectedPoemId);
    const baseIdx = currIdx >= 0 ? currIdx : 0;
    const nextIdx = (baseIdx + offset + list.length) % list.length;
    renderBookReaderPoem(list[nextIdx].id, true);
  }

  // ==========================================================================
  // 3. 생활수필 (Life Essays)
  // ==========================================================================
  function initEssaysSection() {
    const tocList = document.getElementById("essay-toc-list");
    const countBadge = document.getElementById("essay-count-badge");
    if (countBadge) {
      countBadge.textContent = `${MUSEUM_DATA.essays.length}편`;
    }

    tocList.innerHTML = MUSEUM_DATA.essays
      .map(
        (essay, idx) => `
        <button type="button" class="essay-nav-card ${idx === 0 ? "active" : ""}" data-essay-id="${essay.id}">
          <span class="cat">${escapeHtml(essay.category)} · ${escapeHtml(essay.date)}</span>
          <h4>${idx + 1}. ${escapeHtml(essay.title)}</h4>
          <p>${escapeHtml(essay.summary)}</p>
        </button>
      `
      )
      .join("");

    tocList.querySelectorAll(".essay-nav-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-essay-id");
        renderEssayReader(id, true);
      });
    });

    const navigateEssay = (offset) => {
      const idx = MUSEUM_DATA.essays.findIndex((e) => e.id === state.selectedEssayId);
      const nextIdx = (idx + offset + MUSEUM_DATA.essays.length) % MUSEUM_DATA.essays.length;
      renderEssayReader(MUSEUM_DATA.essays[nextIdx].id, true);
    };

    document.getElementById("prev-essay-top-btn")?.addEventListener("click", () => navigateEssay(-1));
    document.getElementById("next-essay-top-btn")?.addEventListener("click", () => navigateEssay(1));
    document.getElementById("prev-essay-btn")?.addEventListener("click", () => navigateEssay(-1));
    document.getElementById("next-essay-btn")?.addEventListener("click", () => navigateEssay(1));

    renderEssayReader(state.selectedEssayId, false);
  }

  function renderEssayReader(essayId, scrollIntoView = false) {
    const idx = MUSEUM_DATA.essays.findIndex((e) => e.id === essayId);
    const essay = idx >= 0 ? MUSEUM_DATA.essays[idx] : MUSEUM_DATA.essays[0];
    const actualIdx = idx >= 0 ? idx : 0;
    const prevId = state.selectedEssayId;
    state.selectedEssayId = essay.id;

    if (
      ttsState.status !== "idle" &&
      ttsState.sourceSection === "life-essays" &&
      prevId !== essay.id
    ) {
      stopTTS();
    }

    const pageInd = document.getElementById("essay-page-indicator");
    if (pageInd) {
      pageInd.textContent = `${actualIdx + 1} / ${MUSEUM_DATA.essays.length}`;
    }

    document.getElementById("essay-reader-category").textContent = essay.category;
    document.getElementById("essay-reader-date").textContent = essay.date;
    document.getElementById("essay-reader-time").textContent = `읽기 시간 약 ${essay.readTime}`;
    document.getElementById("essay-reader-title").textContent = essay.title;
    document.getElementById("essay-reader-summary").textContent = essay.summary;

    const paragraphs = essay.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const bodyEl = document.getElementById("essay-reader-body");
    bodyEl.innerHTML = paragraphs
      .map(
        (para, pIdx) =>
          `<p class="essay-paragraph" data-para-index="${pIdx}" title="클릭하면 이 문단부터 읽어줍니다">${escapeHtml(para)}</p>`
      )
      .join("");

    bodyEl.querySelectorAll(".essay-paragraph").forEach((el, pIdx) => {
      el.addEventListener("click", () => {
        startEssayTTS(pIdx + 1);
      });
    });

    document.querySelectorAll("#essay-toc-list .essay-nav-card").forEach((card) => {
      card.classList.toggle("active", card.getAttribute("data-essay-id") === essay.id);
    });

    if (ttsState.status === "idle" && state.currentSection === "life-essays") {
      updateGlobalBarMetadata("생활수필", essay.title, "읽어주기 버튼을 누르면 수필 낭독이 시작됩니다");
    }

    if (scrollIntoView) {
      document.getElementById("essay-reader-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  // ==========================================================================
  // 4. 문예신문 (Literary Newspaper)
  // ==========================================================================
  function initNewspaperSection() {
    const tabsContainer = document.getElementById("news-issue-tabs");
    tabsContainer.innerHTML = MUSEUM_DATA.newspaper
      .map(
        (item, idx) => `
        <button type="button" class="news-tab-btn ${idx === 0 ? "active" : ""}" data-news-id="${item.id}">
          ${escapeHtml(item.issue)}
        </button>
      `
      )
      .join("");

    tabsContainer.querySelectorAll(".news-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-news-id");
        renderNewspaperArticle(id, true);
      });
    });

    const navigateNews = (offset) => {
      const idx = MUSEUM_DATA.newspaper.findIndex((n) => n.id === state.selectedNewsId);
      const nextIdx = (idx + offset + MUSEUM_DATA.newspaper.length) % MUSEUM_DATA.newspaper.length;
      renderNewspaperArticle(MUSEUM_DATA.newspaper[nextIdx].id, true);
    };

    document.getElementById("prev-news-btn")?.addEventListener("click", () => navigateNews(-1));
    document.getElementById("next-news-btn")?.addEventListener("click", () => navigateNews(1));

    renderNewspaperArticle(state.selectedNewsId, false);
  }

  function renderNewspaperArticle(newsId, scrollIntoView = false) {
    const idx = MUSEUM_DATA.newspaper.findIndex((n) => n.id === newsId);
    const article = idx >= 0 ? MUSEUM_DATA.newspaper[idx] : MUSEUM_DATA.newspaper[0];
    const actualIdx = idx >= 0 ? idx : 0;
    const prevId = state.selectedNewsId;
    state.selectedNewsId = article.id;

    if (
      ttsState.status !== "idle" &&
      ttsState.sourceSection === "literary-news" &&
      prevId !== article.id
    ) {
      stopTTS();
    }

    document.querySelectorAll("#news-issue-tabs .news-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-news-id") === article.id);
    });

    const newsInd = document.getElementById("news-page-indicator");
    if (newsInd) {
      newsInd.textContent = `${actualIdx + 1} / ${MUSEUM_DATA.newspaper.length}`;
    }

    document.getElementById("news-issue-label").textContent = article.issue;
    document.getElementById("news-category-label").textContent = article.category;
    document.getElementById("news-date-label").textContent = `발행일: ${article.date}`;
    document.getElementById("news-headline").textContent = article.title;
    document.getElementById("news-subheadline").textContent = article.subtitle;
    document.getElementById("news-byline").textContent = `필자: ${article.author}`;

    const leadEl = document.getElementById("news-lead-summary");
    leadEl.textContent = article.summary;
    leadEl.title = "클릭하면 요약문부터 기사를 읽어줍니다";
    leadEl.style.cursor = "pointer";
    leadEl.onclick = () => startNewsTTS(1);

    const bodyEl = document.getElementById("news-article-body");
    bodyEl.innerHTML = article.content;

    // 기사 내 각 단락 클릭 시 해당 단락부터 낭독 시작
    const blockEls = Array.from(
      bodyEl.querySelectorAll("h4, p, blockquote, li")
    );
    blockEls.forEach((el, bIdx) => {
      el.classList.add("news-tts-block");
      el.title = "클릭하면 이 단락부터 읽어줍니다";
      el.addEventListener("click", () => {
        startNewsTTS(bIdx + 2); // 0: 제목, 1: 요약문, 2~: 본문 단락
      });
    });

    const photosEl = document.getElementById("news-archive-photos");
    if (article.images && article.images.length > 0) {
      photosEl.hidden = false;
      photosEl.innerHTML = article.images
        .map(
          (imgSrc, imgIdx) => `
          <div class="news-photo-card" data-photo-src="${imgSrc}" data-photo-title="${escapeHtml(article.title)} — 수록 자료 ${imgIdx + 1}">
            <img src="${imgSrc}" alt="${escapeHtml(article.title)} 자료 이미지 ${imgIdx + 1}" loading="lazy" />
            <span>🔍 수록 지면 / 발표 자료 원본 크게 보기 (${imgIdx + 1})</span>
          </div>
        `
        )
        .join("");

      photosEl.querySelectorAll(".news-photo-card").forEach((card) => {
        card.addEventListener("click", () => {
          openArtLightbox({
            id: "news-photo",
            title: card.getAttribute("data-photo-title"),
            category: article.issue,
            year: article.date,
            medium: "문예신문 · 학술지 수록 원본 자료",
            image: card.getAttribute("data-photo-src"),
            meaning: article.summary,
            prompt: "『대구예술』 및 수성구미술가협회 학술세미나에 수록된 명도재 이명우 대표의 원고 및 지면 아카이브입니다."
          });
        });
      });
    } else {
      photosEl.hidden = true;
      photosEl.innerHTML = "";
    }

    if (ttsState.status === "idle" && state.currentSection === "literary-news") {
      updateGlobalBarMetadata("문예신문", article.title, "읽어주기 버튼을 누르면 기사 낭독이 시작됩니다");
    }

    if (scrollIntoView) {
      document.getElementById("newspaper-broadsheet")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  // ==========================================================================
  // 5. 미술 작품 (Art Gallery)
  // ==========================================================================
  function initArtGallerySection() {
    const tabs = document.querySelectorAll("#art-filter-tabs .chapter-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        state.artCategoryFilter = tab.getAttribute("data-artcat") || "all";
        renderArtGalleryGrid();
      });
    });

    // 미술 모달 내 이전/다음 작품 버튼
    const navigateModalArt = (offset) => {
      const idx = MUSEUM_DATA.artworks.findIndex((a) => a.id === state.currentModalArtId);
      const baseIdx = idx >= 0 ? idx : 0;
      const nextIdx = (baseIdx + offset + MUSEUM_DATA.artworks.length) % MUSEUM_DATA.artworks.length;
      openArtLightbox(MUSEUM_DATA.artworks[nextIdx]);
    };

    document.getElementById("prev-art-btn")?.addEventListener("click", () => navigateModalArt(-1));
    document.getElementById("next-art-btn")?.addEventListener("click", () => navigateModalArt(1));

    renderArtGalleryGrid();
  }

  function renderArtGalleryGrid() {
    const grid = document.getElementById("art-gallery-grid");
    const filtered = MUSEUM_DATA.artworks.filter(
      (art) => state.artCategoryFilter === "all" || art.category === state.artCategoryFilter
    );

    grid.innerHTML = filtered
      .map(
        (art) => `
        <article class="art-card" data-art-id="${art.id}">
          <div class="art-thumb-wrap">
            <img src="${art.image}" alt="${escapeHtml(art.title)}" loading="lazy" />
            <span class="art-cat-pill">${escapeHtml(art.category)}</span>
          </div>
          <div class="art-card-body">
            <h3 class="art-card-title">${escapeHtml(art.title)}</h3>
            <p class="art-card-medium">${escapeHtml(art.medium)}</p>
            <p class="art-card-desc">${escapeHtml(art.meaning)}</p>
            <span class="art-card-btn">🔍 작품 크게 보기 · 메타프롬프트 해설</span>
          </div>
        </article>
      `
      )
      .join("");

    grid.querySelectorAll(".art-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-art-id");
        const art = MUSEUM_DATA.artworks.find((a) => a.id === id);
        if (art) openArtLightbox(art);
      });
    });
  }

  function openArtLightbox(art) {
    const modal = document.getElementById("art-modal");
    const prevId = state.currentModalArtId;
    if (art.id && art.id.startsWith("art-")) {
      state.currentModalArtId = art.id;
    }

    if (
      ttsState.status !== "idle" &&
      ttsState.sourceSection === "art-gallery" &&
      prevId !== art.id
    ) {
      stopTTS();
    }

    document.getElementById("art-modal-cat").textContent = art.category;
    document.getElementById("art-modal-title").textContent = art.title;
    const imgEl = document.getElementById("art-modal-img");
    imgEl.src = art.image;
    imgEl.alt = art.title;
    document.getElementById("art-modal-medium").textContent = `${art.year}년 · ${art.medium}`;
    document.getElementById("art-modal-meaning").textContent = art.meaning;
    document.getElementById("art-modal-prompt").textContent = art.prompt;

    const artIdx = MUSEUM_DATA.artworks.findIndex((a) => a.id === art.id);
    const navEl = document.getElementById("art-modal-nav");
    const indEl = document.getElementById("art-modal-indicator");
    if (artIdx >= 0) {
      if (navEl) navEl.hidden = false;
      if (indEl) indEl.textContent = `${artIdx + 1} / ${MUSEUM_DATA.artworks.length}`;
    } else if (navEl) {
      navEl.hidden = true;
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
  }

  // ==========================================================================
  // 통합 검색 및 전체 목차 연결 모달 + 작가 소개 모달
  // ==========================================================================
  function initModalsAndSearch() {
    const tocModal = document.getElementById("toc-modal");
    const artModal = document.getElementById("art-modal");
    const authorModal = document.getElementById("author-modal");

    // 상단 검색·목차 버튼: 헤더 검색창에 입력된 검색어와 함께 열기
    document.getElementById("open-toc-btn")?.addEventListener("click", () => {
      const headerQuery = document.getElementById("header-search-input")?.value.trim() || "";
      openSearchModalWithQuery(headerQuery, "all");
    });

    // 히어로 배너 및 푸터의 '전체 작품 목차 보기' 버튼: 항상 전체 60편 목록으로 열기
    ["hero-open-toc-btn", "footer-toc-btn"].forEach((btnId) => {
      document.getElementById(btnId)?.addEventListener("click", () => {
        openSearchModalWithQuery("", "all");
      });
    });

    // 헤더 검색창에서 엔터 입력 시 통합 검색 모달 연동
    const headerSearchInput = document.getElementById("header-search-input");
    if (headerSearchInput) {
      headerSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          openSearchModalWithQuery(headerSearchInput.value.trim(), "all");
        }
      });
    }

    // 모달 내 검색창 실시간 필터링
    const modalSearchInput = document.getElementById("modal-search-input");
    if (modalSearchInput) {
      modalSearchInput.addEventListener("input", () => {
        renderMasterTOCModal(modalSearchInput.value.trim());
      });
    }

    // 모달 검색어 초기화 버튼
    document.getElementById("modal-search-clear-btn")?.addEventListener("click", () => {
      if (modalSearchInput) modalSearchInput.value = "";
      if (headerSearchInput) headerSearchInput.value = "";
      setTocModalCategory("all");
      renderMasterTOCModal("");
      modalSearchInput?.focus();
    });

    // 모달 내 카테고리 탭 필터링
    document.querySelectorAll("#modal-filter-tabs .chapter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const cat = tab.getAttribute("data-toc-cat") || "all";
        setTocModalCategory(cat);
        renderMasterTOCModal(modalSearchInput?.value.trim() || "");
      });
    });

    // 모달 닫기
    document.getElementById("close-toc-modal-btn")?.addEventListener("click", () => {
      closeModal(tocModal);
    });
    document.getElementById("close-art-modal-btn")?.addEventListener("click", () => {
      if (ttsState.sourceSection === "art-gallery" && ttsState.status !== "idle") {
        stopTTS();
      }
      closeModal(artModal);
    });
    document.getElementById("close-author-modal-btn")?.addEventListener("click", () => {
      closeModal(authorModal);
    });

    // 배경 클릭 시 닫기 & ESC 키 닫기
    [tocModal, artModal, authorModal].forEach((modal) => {
      modal?.addEventListener("click", (e) => {
        if (e.target === modal) {
          if (modal === artModal && ttsState.sourceSection === "art-gallery" && ttsState.status !== "idle") {
            stopTTS();
          }
          closeModal(modal);
        }
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        [tocModal, artModal, authorModal].forEach((m) => {
          if (m && !m.hidden) {
            if (m === artModal && ttsState.sourceSection === "art-gallery" && ttsState.status !== "idle") {
              stopTTS();
            }
            closeModal(m);
          }
        });
      }
    });

    // 작가 소개 모달 초기화 (버튼 및 초상화 카드 클릭 시 열기)
    initAuthorModalContent();
    const openAuthorModal = () => {
      authorModal.hidden = false;
      authorModal.setAttribute("aria-hidden", "false");
    };
    document.getElementById("hero-author-modal-btn")?.addEventListener("click", openAuthorModal);
    const portraitCard = document.querySelector(".hero-portrait-card");
    if (portraitCard) {
      portraitCard.style.cursor = "pointer";
      portraitCard.title = "클릭하면 명도재 이명우 작가 소개를 봅니다";
      portraitCard.addEventListener("click", openAuthorModal);
    }
  }

  function setTocModalCategory(cat) {
    state.tocCategoryFilter = cat;
    document.querySelectorAll("#modal-filter-tabs .chapter-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-toc-cat") === cat);
    });
  }

  function openSearchModalWithQuery(query = "", category = "all") {
    const tocModal = document.getElementById("toc-modal");
    const modalInput = document.getElementById("modal-search-input");
    if (modalInput) {
      modalInput.value = query;
    }
    setTocModalCategory(category);
    renderMasterTOCModal(query);
    tocModal.hidden = false;
    tocModal.setAttribute("aria-hidden", "false");
    setTimeout(() => modalInput?.focus(), 60);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }

  function renderMasterTOCModal(query = "") {
    const q = query.toLowerCase();
    const cat = state.tocCategoryFilter || "all";
    const container = document.getElementById("modal-toc-body");
    const countEl = document.getElementById("modal-search-count");

    const matchItem = (textFields) => {
      if (!q) return true;
      return textFields.join(" ").toLowerCase().includes(q);
    };

    const matchedPoems =
      cat === "all" || cat === "poem"
        ? MUSEUM_DATA.poems.filter((p) =>
            matchItem([p.title, p.subtitle || "", p.chapter, p.content, p.critique || "", (p.tags || []).join(" ")])
          )
        : [];
    const matchedEssays =
      cat === "all" || cat === "essay"
        ? MUSEUM_DATA.essays.filter((e) =>
            matchItem([e.title, e.category, e.summary, e.content])
          )
        : [];
    const matchedNews =
      cat === "all" || cat === "news"
        ? MUSEUM_DATA.newspaper.filter((n) =>
            matchItem([n.title, n.subtitle, n.issue, n.summary, n.content])
          )
        : [];
    const matchedArts =
      cat === "all" || cat === "art"
        ? MUSEUM_DATA.artworks.filter((a) =>
            matchItem([a.title, a.category, a.medium, a.meaning, a.prompt])
          )
        : [];

    const totalCount =
      matchedPoems.length + matchedEssays.length + matchedNews.length + matchedArts.length;
    if (countEl) {
      countEl.textContent = q ? `검색 결과 ${totalCount}건` : `표시 작품 ${totalCount}편`;
    }

    if (totalCount === 0) {
      container.innerHTML = `<p style="padding:2rem;text-align:center;color:var(--ink-muted);">‘${escapeHtml(query)}’에 대한 검색 결과가 없습니다.</p>`;
      return;
    }

    let html = "";

    if (matchedPoems.length > 0) {
      html += `
        <section class="toc-modal-section">
          <h4>📖 디지털 시집 (${matchedPoems.length}편)</h4>
          <div class="toc-modal-grid">
            ${matchedPoems
              .map(
                (p) => `
              <button type="button" class="toc-jump-card" data-jump-type="poem" data-jump-id="${p.id}">
                <strong>${escapeHtml(p.title)}</strong>
                <span>${escapeHtml(p.excerpt)}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </section>
      `;
    }

    if (matchedEssays.length > 0) {
      html += `
        <section class="toc-modal-section">
          <h4>🍵 생활수필 (${matchedEssays.length}편)</h4>
          <div class="toc-modal-grid">
            ${matchedEssays
              .map(
                (e) => `
              <button type="button" class="toc-jump-card" data-jump-type="essay" data-jump-id="${e.id}">
                <strong>${escapeHtml(e.title)}</strong>
                <span>${escapeHtml(e.summary)}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </section>
      `;
    }

    if (matchedNews.length > 0) {
      html += `
        <section class="toc-modal-section">
          <h4>📰 문예신문 (${matchedNews.length}편)</h4>
          <div class="toc-modal-grid">
            ${matchedNews
              .map(
                (n) => `
              <button type="button" class="toc-jump-card" data-jump-type="news" data-jump-id="${n.id}">
                <strong>${escapeHtml(n.title)}</strong>
                <span>${escapeHtml(n.issue)}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </section>
      `;
    }

    if (matchedArts.length > 0) {
      html += `
        <section class="toc-modal-section">
          <h4>🎨 미술 작품 (${matchedArts.length}점)</h4>
          <div class="toc-modal-grid">
            ${matchedArts
              .map(
                (a) => `
              <button type="button" class="toc-jump-card" data-jump-type="art" data-jump-id="${a.id}">
                <strong>${escapeHtml(a.title)}</strong>
                <span>${escapeHtml(a.category)} · ${escapeHtml(a.medium)}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </section>
      `;
    }

    container.innerHTML = html;

    // 목차 항목 클릭 시 해당 섹션 및 작품으로 즉시 이동 연결
    container.querySelectorAll(".toc-jump-card").forEach((card) => {
      card.addEventListener("click", () => {
        const type = card.getAttribute("data-jump-type");
        const id = card.getAttribute("data-jump-id");
        closeModal(document.getElementById("toc-modal"));

        if (type === "poem") {
          // 만약 부(Chapter) 필터가 걸려 있어 해당 시가 숨겨져 있다면 전체 탭으로 초기화
          state.poetryChapterFilter = "all";
          state.poetrySearchQuery = "";
          const searchIn = document.getElementById("poetry-search-input");
          if (searchIn) searchIn.value = "";
          document.querySelectorAll("#poetry-chapter-tabs .chapter-tab").forEach((t) => {
            t.classList.toggle("active", t.getAttribute("data-chapter") === "all");
          });
          renderPoetryTOCAndGrid();
          switchSection("poetry-book", false);
          renderBookReaderPoem(id, true);
        } else if (type === "essay") {
          switchSection("life-essays", false);
          renderEssayReader(id, true);
        } else if (type === "news") {
          switchSection("literary-news", true);
          renderNewspaperArticle(id, false);
        } else if (type === "art") {
          switchSection("art-gallery", true);
          const art = MUSEUM_DATA.artworks.find((a) => a.id === id);
          if (art) openArtLightbox(art);
        }
      });
    });
  }

  function initAuthorModalContent() {
    const body = document.getElementById("author-modal-body");
    if (!body) return;
    const a = MUSEUM_DATA.author;
    body.innerHTML = `
      <div class="author-bio-grid">
        <div class="author-bio-photos">
          <img src="${a.portrait}" alt="${escapeHtml(a.name)} 초상" />
          <img src="${a.studioPhoto}" alt="${escapeHtml(a.name)} 대작 수묵설경 작업실 사진" />
        </div>
        <div>
          <span class="poem-chapter-badge">${escapeHtml(a.penName)}</span>
          <h4 style="font-size:1.6rem;margin:0.6rem 0 0.3rem;color:var(--ink-deep);">${escapeHtml(a.name)} (${escapeHtml(a.title)})</h4>
          <p style="margin:0.9rem 0;line-height:1.85;color:var(--ink-body);">${escapeHtml(a.bioSummary)}</p>
          <blockquote style="background:var(--bg-hanji-warm);padding:1rem 1.2rem;border-left:4px solid var(--seal-red);border-radius:0 10px 10px 0;margin:1rem 0;font-weight:700;">
            ${escapeHtml(a.philosophy)}
          </blockquote>
          <h5 style="font-size:1.05rem;margin-top:1.2rem;color:var(--pine-indigo);">주요 약력 및 창작 활동</h5>
          <ul class="author-career-list">
            ${a.career.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 시·수필·신문·미술 해설 읽어주기(TTS), 일시정지, 이어 읽기 엔진
  // (Windows Chrome / Edge Online Natural Voice 일시정지·이어 읽기 100% 보장)
  // ==========================================================================
  function initTTSControls() {
    // 1) 오늘의 시 컨트롤
    document.getElementById("today-tts-play")?.addEventListener("click", () => startTodayPoemTTS(0));
    document.getElementById("today-tts-pause")?.addEventListener("click", pauseTTS);
    document.getElementById("today-tts-resume")?.addEventListener("click", resumeTTS);
    document.getElementById("today-tts-stop")?.addEventListener("click", stopTTS);

    // 2) 디지털 시집 컨트롤
    document.getElementById("reader-tts-play")?.addEventListener("click", () => startReaderPoemTTS(0));
    document.getElementById("reader-tts-pause")?.addEventListener("click", pauseTTS);
    document.getElementById("reader-tts-resume")?.addEventListener("click", resumeTTS);
    document.getElementById("reader-tts-stop")?.addEventListener("click", stopTTS);

    // 3) 생활수필 컨트롤
    document.getElementById("essay-tts-play")?.addEventListener("click", () => startEssayTTS(0));
    document.getElementById("essay-tts-pause")?.addEventListener("click", pauseTTS);
    document.getElementById("essay-tts-resume")?.addEventListener("click", resumeTTS);
    document.getElementById("essay-tts-stop")?.addEventListener("click", stopTTS);

    // 4) 문예신문 컨트롤
    document.getElementById("news-tts-play")?.addEventListener("click", () => startNewsTTS(0));
    document.getElementById("news-tts-pause")?.addEventListener("click", pauseTTS);
    document.getElementById("news-tts-resume")?.addEventListener("click", resumeTTS);
    document.getElementById("news-tts-stop")?.addEventListener("click", stopTTS);

    // 5) 미술 작품 모달 해설 컨트롤
    document.getElementById("art-tts-play")?.addEventListener("click", () => startArtModalTTS(0));
    document.getElementById("art-tts-pause")?.addEventListener("click", pauseTTS);
    document.getElementById("art-tts-resume")?.addEventListener("click", resumeTTS);
    document.getElementById("art-tts-stop")?.addEventListener("click", stopTTS);

    // 6) 하단 전역 바 컨트롤
    document.getElementById("global-tts-play")?.addEventListener("click", () => {
      const artModal = document.getElementById("art-modal");
      if (artModal && !artModal.hidden) {
        startArtModalTTS(0);
        return;
      }
      if (state.currentSection === "today-poem") startTodayPoemTTS(0);
      else if (state.currentSection === "poetry-book") startReaderPoemTTS(0);
      else if (state.currentSection === "life-essays") startEssayTTS(0);
      else if (state.currentSection === "literary-news") startNewsTTS(0);
      else if (state.currentSection === "art-gallery") {
        const art = MUSEUM_DATA.artworks.find((a) => a.id === state.currentModalArtId) || MUSEUM_DATA.artworks[0];
        if (art) {
          openArtLightbox(art);
          startArtModalTTS(0);
        }
      } else {
        startTodayPoemTTS(0);
      }
    });
    document.getElementById("global-tts-pause")?.addEventListener("click", pauseTTS);
    document.getElementById("global-tts-resume")?.addEventListener("click", resumeTTS);
    document.getElementById("global-tts-stop")?.addEventListener("click", stopTTS);

    // 속도 선택
    const rateSelect = document.getElementById("tts-rate-select");
    if (rateSelect) {
      rateSelect.addEventListener("change", () => {
        ttsState.rate = parseFloat(rateSelect.value) || 0.92;
        if (ttsState.status === "playing") {
          // 현재 읽고 있는 단락/위치부터 변경된 속도로 즉시 재개
          speakChunkAtIndex(ttsState.currentIndex, ttsState.charOffset);
        }
      });
    }

    // 배경선율 토글
    document.getElementById("bgm-toggle-btn")?.addEventListener("click", () => {
      bgmController.toggle();
    });
  }

  function startTodayPoemTTS(startIndex = 0) {
    const poem = MUSEUM_DATA.poems.find((p) => p.id === state.todayPoemId) || MUSEUM_DATA.poems[0];
    const stanzaEls = Array.from(document.querySelectorAll("#today-poem-body .poem-stanza"));
    const chunks = [
      { text: `${poem.title}. 시, 명도재 이명우.`, domElement: null },
      ...stanzaEls.map((el) => ({ text: el.textContent.trim(), domElement: el }))
    ];
    beginTTSSession("today-poem", poem.id, poem.title, "오늘의 시 낭송", chunks, startIndex);
  }

  function startReaderPoemTTS(startIndex = 0) {
    const poem = MUSEUM_DATA.poems.find((p) => p.id === state.selectedPoemId) || MUSEUM_DATA.poems[0];
    const stanzaEls = Array.from(document.querySelectorAll("#reader-poem-body .poem-stanza"));
    const chunks = [
      { text: `${poem.title}. 시, 명도재 이명우.`, domElement: null },
      ...stanzaEls.map((el) => ({ text: el.textContent.trim(), domElement: el }))
    ];
    beginTTSSession("poetry-book", poem.id, poem.title, "디지털 시집 낭송", chunks, startIndex);
  }

  function startEssayTTS(startIndex = 0) {
    const essay = MUSEUM_DATA.essays.find((e) => e.id === state.selectedEssayId) || MUSEUM_DATA.essays[0];
    const paraEls = Array.from(document.querySelectorAll("#essay-reader-body .essay-paragraph"));
    const chunks = [
      { text: `${essay.title}. 수필, 명도재 이명우.`, domElement: null },
      ...paraEls.map((el) => ({ text: el.textContent.trim(), domElement: el }))
    ];
    beginTTSSession("life-essays", essay.id, essay.title, "생활수필 낭독", chunks, startIndex);
  }

  function startNewsTTS(startIndex = 0) {
    const article =
      MUSEUM_DATA.newspaper.find((n) => n.id === state.selectedNewsId) || MUSEUM_DATA.newspaper[0];
    const leadEl = document.getElementById("news-lead-summary");
    const blockEls = Array.from(
      document.querySelectorAll("#news-article-body h4, #news-article-body p, #news-article-body blockquote, #news-article-body li")
    );
    const chunks = [
      { text: `${article.title}. ${article.subtitle}. 필자 ${article.author}.`, domElement: null },
      ...(leadEl ? [{ text: leadEl.textContent.trim(), domElement: leadEl }] : []),
      ...blockEls.map((el) => ({ text: el.textContent.trim(), domElement: el }))
    ];
    beginTTSSession("literary-news", article.id, article.title, "문예신문 낭독", chunks, startIndex);
  }

  function startArtModalTTS(startIndex = 0) {
    const title = document.getElementById("art-modal-title")?.textContent.trim() || "미술 작품";
    const mediumEl = document.getElementById("art-modal-medium");
    const meaningEl = document.getElementById("art-modal-meaning");
    const promptEl = document.getElementById("art-modal-prompt");

    const chunks = [
      { text: `미술 작품 해설. ${title}.`, domElement: null },
      ...(mediumEl ? [{ text: `제작 연도 및 기법. ${mediumEl.textContent.trim()}`, domElement: mediumEl }] : []),
      ...(meaningEl ? [{ text: `작품 의미 및 작가 노트. ${meaningEl.textContent.trim()}`, domElement: meaningEl }] : []),
      ...(promptEl ? [{ text: `창작 설계 노트. ${promptEl.textContent.trim()}`, domElement: promptEl }] : [])
    ];
    beginTTSSession("art-gallery", state.currentModalArtId, title, "미술 작품 해설", chunks, startIndex);
  }

  function clearSpeakTimer() {
    if (ttsState.speakTimer) {
      clearTimeout(ttsState.speakTimer);
      ttsState.speakTimer = null;
    }
  }

  function beginTTSSession(sourceSection, workId, workTitle, workTypeLabel, chunks, startIndex = 0) {
    if (!("speechSynthesis" in window)) {
      alert("이 브라우저는 음성 읽어주기(Web Speech API)를 지원하지 않습니다.");
      return;
    }

    ttsState.sessionId += 1;
    clearSpeakTimer();
    window.speechSynthesis.cancel();
    clearAllHighlights();

    ttsState.sourceSection = sourceSection;
    ttsState.workId = workId;
    ttsState.workTitle = workTitle;
    ttsState.workTypeLabel = workTypeLabel;
    ttsState.chunks = chunks.filter((c) => c && c.text && c.text.length > 0);
    ttsState.currentIndex = Math.min(Math.max(0, startIndex), Math.max(0, ttsState.chunks.length - 1));
    ttsState.charOffset = 0;
    ttsState.status = "playing";

    syncAllTTSButtons();
    speakChunkAtIndex(ttsState.currentIndex, 0);
  }

  function getPreferredKoreanVoice() {
    const voices = window.speechSynthesis.getVoices() || [];
    const koVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("ko"));
    if (koVoices.length === 0) return null;
    return (
      koVoices.find((v) => v.name.includes("Natural") || v.name.includes("SunHi") || v.name.includes("InJoon")) ||
      koVoices.find((v) => v.name.includes("Google")) ||
      koVoices[0]
    );
  }

  function speakChunkAtIndex(index, startCharOffset = 0) {
    if (ttsState.status !== "playing") return;
    if (index >= ttsState.chunks.length) {
      finishTTSSession();
      return;
    }

    const mySessionId = ++ttsState.sessionId;
    clearSpeakTimer();

    ttsState.currentIndex = index;
    const chunk = ttsState.chunks[index];
    const fullText = chunk.text || "";

    // 만약 문단 중간에서 이어 읽는 경우, 남은 텍스트가 너무 짧으면 처음부터 읽거나 다음 단락으로 진행
    let safeOffset = Math.max(0, Math.min(startCharOffset, fullText.length));
    let textToSpeak = fullText.slice(safeOffset).trim();
    if (!textToSpeak) {
      safeOffset = 0;
      textToSpeak = fullText;
    }
    ttsState.charOffset = safeOffset;

    clearAllHighlights();
    if (chunk.domElement) {
      chunk.domElement.classList.add("tts-active-chunk");
      chunk.domElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const totalBodyChunks = Math.max(1, ttsState.chunks.length - 1);
    const progressText =
      index === 0
        ? "제목 및 작가 소개 낭독 중..."
        : `낭송 중 (${index} / ${totalBodyChunks} 단락)`;

    updateGlobalBarMetadata(ttsState.workTypeLabel, ttsState.workTitle, progressText);
    updateSectionStatusPill(ttsState.sourceSection, progressText);

    // Chromium 계열에서 cancel() 직후 동기적으로 speak() 호출 시 새 발화가 취소되는 문제를 방지하기 위해
    // 기존 발화를 정리한 뒤 짧은 비동기 간격(60ms) 후 안전하게 발화 큐에 등록
    window.speechSynthesis.cancel();

    ttsState.speakTimer = setTimeout(() => {
      if (ttsState.sessionId !== mySessionId || ttsState.status !== "playing") return;

      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = "ko-KR";
      utter.rate = ttsState.rate;
      utter.pitch = 0.98;
      const koVoice = getPreferredKoreanVoice();
      if (koVoice) utter.voice = koVoice;

      // 단어/어절 경계마다 현재 읽은 글자 위치를 기록하여 문단 중간 일시정지 후 정확한 이어 읽기 지원
      utter.onboundary = (ev) => {
        if (ttsState.sessionId !== mySessionId || ttsState.status !== "playing") return;
        if (typeof ev.charIndex === "number" && ev.charIndex >= 0) {
          ttsState.charOffset = safeOffset + ev.charIndex;
        }
      };

      utter.onend = () => {
        if (ttsState.sessionId !== mySessionId || ttsState.status !== "playing") return;
        // 연과 연 사이 서정적인 호흡(여백) 제공
        ttsState.speakTimer = setTimeout(() => {
          if (ttsState.sessionId === mySessionId && ttsState.status === "playing") {
            speakChunkAtIndex(index + 1, 0);
          }
        }, 380);
      };

      utter.onerror = (ev) => {
        if (ttsState.sessionId !== mySessionId || ttsState.status !== "playing") return;
        if (ev.error === "canceled" || ev.error === "interrupted") return;
        ttsState.speakTimer = setTimeout(() => {
          if (ttsState.sessionId === mySessionId && ttsState.status === "playing") {
            speakChunkAtIndex(index + 1, 0);
          }
        }, 200);
      };

      ttsState.utterance = utter;
      window.__activeUtterance = utter; // GC 방지
      window.speechSynthesis.speak(utter);
    }, 60);
  }

  function pauseTTS() {
    if (ttsState.status !== "playing") return;

    // 세션 토큰을 증가시켜 진행 중인 onend/타이머가 다음 단락으로 넘어가지 않도록 즉시 차단
    ttsState.sessionId += 1;
    clearSpeakTimer();
    ttsState.status = "paused";

    // Windows Chrome / Edge의 Online Natural 음성에서 speechSynthesis.pause()가 작동하지 않거나
    // speaking 상태가 멈추는 브라우저 버그를 원천 해결하기 위해 cancel()로 음성을 즉시 멈추고
    // 현재 단락(currentIndex) 및 어절 위치(charOffset)를 보존하여 '이어 읽기' 시 정확히 재개함
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // 현재 읽던 단락에 일시정지 시각 표시 유지
    const currentChunk = ttsState.chunks[ttsState.currentIndex];
    if (currentChunk && currentChunk.domElement) {
      currentChunk.domElement.classList.add("tts-active-chunk", "tts-paused-chunk");
    }

    const totalBodyChunks = Math.max(1, ttsState.chunks.length - 1);
    const displayIdx = Math.max(1, ttsState.currentIndex);
    const pausedMsg = `일시정지됨 (${displayIdx} / ${totalBodyChunks} 단락) — ‘▶ 이어 읽기’를 누르면 계속 읽습니다`;

    updateGlobalBarMetadata(ttsState.workTypeLabel, ttsState.workTitle, pausedMsg);
    updateSectionStatusPill(ttsState.sourceSection, `일시정지됨 (${displayIdx}/${totalBodyChunks}) · 이어 읽기 가능`);
    syncAllTTSButtons();
  }

  function resumeTTS() {
    if (ttsState.status !== "paused") return;
    if (!ttsState.chunks || ttsState.chunks.length === 0) return;

    ttsState.status = "playing";
    document.querySelectorAll(".tts-paused-chunk").forEach((el) => {
      el.classList.remove("tts-paused-chunk");
    });
    syncAllTTSButtons();

    // 일시정지되었던 정확한 단락(currentIndex)과 어절 오프셋(charOffset)부터 즉시 이어 읽기 실행
    speakChunkAtIndex(ttsState.currentIndex, ttsState.charOffset);
  }

  function stopTTS() {
    ttsState.sessionId += 1;
    clearSpeakTimer();
    ttsState.status = "idle";
    ttsState.charOffset = 0;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearAllHighlights();
    updateGlobalBarMetadata(
      ttsState.workTypeLabel || "시·수필 낭송실",
      ttsState.workTitle || "명도재 문학관",
      "낭송이 정지되었습니다 (읽어주기를 누르면 다시 시작합니다)"
    );
    updateSectionStatusPill(ttsState.sourceSection, "낭송 대기 중");
    syncAllTTSButtons();
  }

  function finishTTSSession() {
    ttsState.sessionId += 1;
    clearSpeakTimer();
    ttsState.status = "idle";
    ttsState.charOffset = 0;
    clearAllHighlights();
    updateGlobalBarMetadata(ttsState.workTypeLabel, ttsState.workTitle, "낭송이 완료되었습니다");
    updateSectionStatusPill(ttsState.sourceSection, "낭송 완료");
    syncAllTTSButtons();
  }

  function clearAllHighlights() {
    document.querySelectorAll(".tts-active-chunk, .tts-paused-chunk").forEach((el) => {
      el.classList.remove("tts-active-chunk", "tts-paused-chunk");
    });
  }

  function updateGlobalBarMetadata(badgeText, titleText, progressText) {
    const badgeEl = document.getElementById("global-tts-badge");
    const titleEl = document.getElementById("global-tts-title");
    const progEl = document.getElementById("global-tts-progress");
    if (badgeEl) badgeEl.textContent = badgeText;
    if (titleEl) titleEl.textContent = titleText;
    if (progEl) progEl.textContent = progressText;
  }

  function updateSectionStatusPill(sourceSection, text) {
    const map = {
      "today-poem": "today-tts-status",
      "poetry-book": "reader-tts-status",
      "life-essays": "essay-tts-status",
      "literary-news": "news-tts-status",
      "art-gallery": "art-tts-status"
    };
    const pillId = map[sourceSection];
    if (pillId) {
      const el = document.getElementById(pillId);
      if (el) el.textContent = text;
    }
  }

  function syncAllTTSButtons() {
    const isPlaying = ttsState.status === "playing";
    const isPaused = ttsState.status === "paused";
    const isIdle = ttsState.status === "idle";

    const waveEl = document.getElementById("tts-wave-indicator");
    if (waveEl) {
      waveEl.classList.toggle("playing", isPlaying);
    }

    const prefixes = ["global", "today", "reader", "essay", "news", "art"];
    prefixes.forEach((prefix) => {
      const playBtn = document.getElementById(`${prefix}-tts-play`);
      const pauseBtn = document.getElementById(`${prefix}-tts-pause`);
      const resumeBtn = document.getElementById(`${prefix}-tts-resume`);
      const stopBtn = document.getElementById(`${prefix}-tts-stop`);

      if (playBtn) playBtn.disabled = false;
      if (pauseBtn) pauseBtn.disabled = !isPlaying;
      if (resumeBtn) resumeBtn.disabled = !isPaused;
      if (stopBtn) stopBtn.disabled = isIdle;
    });
  }

  // HTML 이스케이프 유틸리티
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
