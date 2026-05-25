(() => {
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const status = document.getElementById("status");
  const btnInsert = document.getElementById("btn-insert");
  const btnCopy = document.getElementById("btn-copy");
  const btnClear = document.getElementById("btn-clear");
  const btnClose = document.getElementById("btn-close");

  const MARKLOG_URL = "https://github.com/runchr-works/marklog";
  const FOOTER_HTML =
    `<p style="margin-top:2em;padding-top:1em;border-top:1px solid #eee;` +
    `font-size:0.85em;color:#888;text-align:right;">` +
    `✍ Written with <a href="${MARKLOG_URL}" target="_blank" rel="noopener" ` +
    `style="color:#ff5722;text-decoration:none;">Marklog</a>` +
    `</p>`;

  const STORAGE_KEY = "marklog.draft";
  const IMAGES_KEY = "marklog.images";
  const IMG_SCHEME = "marklog-img://";

  // id → data URL
  const images = new Map();
  let nextImgId = 1;

  function resolveImages(md) {
    return md.replace(
      /marklog-img:\/\/(\d+)/g,
      (m, id) => images.get(Number(id)) ?? m
    );
  }

  if (window.marked) {
    marked.setOptions({
      gfm: true,
      breaks: true,
      highlight(code, lang) {
        // Only highlight when a language is explicitly given.
        // Skipping highlightAuto avoids costly per-keystroke detection.
        if (window.hljs && lang && hljs.getLanguage(lang)) {
          try { return hljs.highlight(code, { language: lang }).value; } catch {}
        }
        return code;
      },
    });
  }

  let renderTimer = null;
  let renderRaf = 0;
  function render() {
    if (renderTimer) return;
    renderTimer = setTimeout(() => {
      renderTimer = null;
      cancelAnimationFrame(renderRaf);
      renderRaf = requestAnimationFrame(() => {
        const md = resolveImages(editor.value);
        const html = window.marked ? marked.parse(md) : escapeHtml(md);
        preview.innerHTML = html;
      });
    }, 120);
  }
  function renderNow() {
    clearTimeout(renderTimer);
    renderTimer = null;
    cancelAnimationFrame(renderRaf);
    const md = resolveImages(editor.value);
    preview.innerHTML = window.marked ? marked.parse(md) : escapeHtml(md);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const imgObj = Object.fromEntries(images);
      try {
        chrome.storage.local.set({
          [STORAGE_KEY]: editor.value,
          [IMAGES_KEY]: imgObj,
        });
        setStatus("Auto-saved");
      } catch {
        localStorage.setItem(STORAGE_KEY, editor.value);
        localStorage.setItem(IMAGES_KEY, JSON.stringify(imgObj));
      }
    }, 400);
  }

  function setStatus(msg) {
    status.textContent = msg;
  }

  function migrateInlineDataUrls() {
    // Convert any raw data: URLs left in the editor text to short tokens.
    editor.value = editor.value.replace(
      /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g,
      (dataUrl) => {
        const id = nextImgId++;
        images.set(id, dataUrl);
        return `${IMG_SCHEME}${id}`;
      }
    );
  }

  async function loadDraft() {
    try {
      const got = await chrome.storage.local.get([STORAGE_KEY, IMAGES_KEY]);
      if (got?.[STORAGE_KEY]) editor.value = got[STORAGE_KEY];
      if (got?.[IMAGES_KEY]) {
        for (const [k, v] of Object.entries(got[IMAGES_KEY])) {
          images.set(Number(k), v);
          nextImgId = Math.max(nextImgId, Number(k) + 1);
        }
      }
    } catch {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) editor.value = v;
      const imv = localStorage.getItem(IMAGES_KEY);
      if (imv) {
        for (const [k, val] of Object.entries(JSON.parse(imv))) {
          images.set(Number(k), val);
          nextImgId = Math.max(nextImgId, Number(k) + 1);
        }
      }
    }
    migrateInlineDataUrls();
    render();
    scheduleSave();
  }

  editor.addEventListener("input", () => {
    render();
    scheduleSave();
  });

  // Paste: handle images from clipboard
  editor.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imgItem = Array.from(items).find((it) => it.type.startsWith("image/"));
    if (!imgItem) return;
    e.preventDefault();
    const file = imgItem.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const id = nextImgId++;
      images.set(id, dataUrl);
      const md = `![image](${IMG_SCHEME}${id})`;
      const s = editor.selectionStart;
      const en = editor.selectionEnd;
      editor.value = editor.value.slice(0, s) + md + editor.value.slice(en);
      editor.selectionStart = editor.selectionEnd = s + md.length;
      render();
      scheduleSave();
      setStatus(`Image pasted (${Math.round(file.size / 1024)} KB)`);
    };
    reader.readAsDataURL(file);
  });

  // Tab key inserts two spaces
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart;
      const en = editor.selectionEnd;
      editor.value = editor.value.slice(0, s) + "  " + editor.value.slice(en);
      editor.selectionStart = editor.selectionEnd = s + 2;
      render();
      scheduleSave();
    }
  });

  btnInsert.addEventListener("click", () => {
    const html = preview.innerHTML + FOOTER_HTML;
    window.parent.postMessage({ type: "MARKLOG_INSERT_HTML", html }, "*");
    setStatus("Inserting…");
  });

  function copyText(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    return ok;
  }

  btnCopy.addEventListener("click", () => {
    const html = preview.innerHTML + FOOTER_HTML;
    if (copyText(html)) setStatus("HTML copied to clipboard");
    else setStatus("Copy failed — try Ctrl+C in the preview");
  });

  btnClear.addEventListener("click", () => {
    if (!confirm("Clear all editor content?")) return;
    editor.value = "";
    images.clear();
    render();
    scheduleSave();
  });

  btnClose.addEventListener("click", () => {
    window.parent.postMessage({ type: "MARKLOG_CLOSE" }, "*");
  });

  window.addEventListener("message", (e) => {
    const m = e.data;
    if (m?.type === "MARKLOG_INSERT_RESULT") {
      setStatus(m.ok ? "Inserted into Blogger ✓" : "Insert failed — Blogger editor not found");
    }
  });

  // --- Markdown toolbar ---
  function wrapSelection(before, after = before, placeholder = "") {
    const s = editor.selectionStart;
    const en = editor.selectionEnd;
    const sel = editor.value.slice(s, en) || placeholder;
    const out = before + sel + after;
    editor.value = editor.value.slice(0, s) + out + editor.value.slice(en);
    editor.selectionStart = s + before.length;
    editor.selectionEnd = s + before.length + sel.length;
    editor.focus();
    render();
    scheduleSave();
  }

  function prefixLines(prefix) {
    const s = editor.selectionStart;
    const en = editor.selectionEnd;
    const lineStart = editor.value.lastIndexOf("\n", s - 1) + 1;
    const block = editor.value.slice(lineStart, en);
    const replaced = block
      .split("\n")
      .map((l, i) => (typeof prefix === "function" ? prefix(i) : prefix) + l)
      .join("\n");
    editor.value =
      editor.value.slice(0, lineStart) + replaced + editor.value.slice(en);
    editor.selectionStart = lineStart;
    editor.selectionEnd = lineStart + replaced.length;
    editor.focus();
    render();
    scheduleSave();
  }

  function insertAtCursor(text, caretOffset) {
    const s = editor.selectionStart;
    const en = editor.selectionEnd;
    editor.value = editor.value.slice(0, s) + text + editor.value.slice(en);
    const pos = caretOffset != null ? s + caretOffset : s + text.length;
    editor.selectionStart = editor.selectionEnd = pos;
    editor.focus();
    render();
    scheduleSave();
  }

  const mdActions = {
    h: () => prefixLines("## "),
    b: () => wrapSelection("**", "**", "bold"),
    i: () => wrapSelection("*", "*", "italic"),
    s: () => wrapSelection("~~", "~~", "text"),
    code: () => wrapSelection("`", "`", "code"),
    codeblock: () => wrapSelection("\n```\n", "\n```\n", "code"),
    link: () => {
      const url = prompt("URL:", "https://");
      if (url == null) return;
      wrapSelection("[", `](${url})`, "text");
    },
    img: () => {
      const url = prompt("Image URL:", "https://");
      if (url == null) return;
      insertAtCursor(`![alt](${url})`);
    },
    ul: () => prefixLines("- "),
    ol: () => prefixLines((i) => `${i + 1}. `),
    quote: () => prefixLines("> "),
    hr: () => insertAtCursor("\n\n---\n\n"),
    table: () =>
      insertAtCursor(
        "\n| Col 1 | Col 2 |\n| --- | --- |\n| a | b |\n"
      ),
  };

  document.querySelectorAll(".md-toolbar button[data-md]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fn = mdActions[btn.dataset.md];
      if (fn) fn();
    });
  });

  // Keyboard shortcuts
  editor.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); mdActions.b(); }
    else if (k === "i") { e.preventDefault(); mdActions.i(); }
    else if (k === "k") { e.preventDefault(); mdActions.link(); }
  });

  // Help modal
  const helpModal = document.getElementById("help-modal");
  document.getElementById("btn-help").addEventListener("click", () => {
    helpModal.classList.remove("hidden");
  });
  document.getElementById("btn-help-close").addEventListener("click", () => {
    helpModal.classList.add("hidden");
  });
  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) helpModal.classList.add("hidden");
  });

  // --- Theme ---
  const THEME_KEY = "marklog.theme";
  const btnTheme = document.getElementById("btn-theme");
  function applyTheme(t) {
    document.body.classList.toggle("theme-dark", t === "dark");
    btnTheme.textContent = t === "dark" ? "☀" : "🌙";
    btnTheme.title = t === "dark" ? "Switch to light" : "Switch to dark";
  }
  async function loadTheme() {
    let t = "light";
    try {
      const got = await chrome.storage.local.get(THEME_KEY);
      if (got?.[THEME_KEY]) t = got[THEME_KEY];
    } catch {
      t = localStorage.getItem(THEME_KEY) || "light";
    }
    applyTheme(t);
  }
  btnTheme.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    applyTheme(next);
    try { chrome.storage.local.set({ [THEME_KEY]: next }); }
    catch { localStorage.setItem(THEME_KEY, next); }
  });
  loadTheme();

  // --- Resizable splitter ---
  const WIDTH_KEY = "marklog.editorWidth";
  const splitter = document.getElementById("splitter");
  const splitEl = document.querySelector(".split");

  async function loadWidth() {
    try {
      const got = await chrome.storage.local.get(WIDTH_KEY);
      if (got?.[WIDTH_KEY]) splitEl.style.setProperty("--editor-width", got[WIDTH_KEY]);
    } catch {
      const v = localStorage.getItem(WIDTH_KEY);
      if (v) splitEl.style.setProperty("--editor-width", v);
    }
  }
  loadWidth();

  let dragging = false;
  splitter.addEventListener("mousedown", (e) => {
    dragging = true;
    splitter.classList.add("dragging");
    document.body.style.userSelect = "none";
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = splitEl.getBoundingClientRect();
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.max(15, Math.min(85, pct));
    splitEl.style.setProperty("--editor-width", pct + "%");
  });
  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove("dragging");
    document.body.style.userSelect = "";
    const w = splitEl.style.getPropertyValue("--editor-width");
    try { chrome.storage.local.set({ [WIDTH_KEY]: w }); }
    catch { localStorage.setItem(WIDTH_KEY, w); }
  });

  loadDraft();
})();
