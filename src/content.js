(() => {
  if (window.__marklogInjected) return;
  window.__marklogInjected = true;

  let panel = null;
  let fab = null;
  let resizer = null;
  const WIDTH_KEY = "marklogPanelWidth";

  function ensureFab() {
    if (fab) return;
    fab = document.createElement("button");
    fab.id = "marklog-fab";
    fab.textContent = "M↓";
    fab.title = "Marklog (Markdown editor)";
    fab.addEventListener("click", togglePanel);
    document.body.appendChild(fab);
  }

  function ensurePanel() {
    if (panel) return;
    panel = document.createElement("iframe");
    panel.id = "marklog-panel";
    panel.src = chrome.runtime.getURL("src/panel.html");
    panel.classList.add("marklog-hidden");
    document.body.appendChild(panel);

    resizer = document.createElement("div");
    resizer.id = "marklog-resizer";
    resizer.classList.add("marklog-hidden");
    resizer.title = "Drag to resize panel";
    document.body.appendChild(resizer);
    setupResizer();

    // Apply saved width
    try {
      chrome.storage?.local.get(WIDTH_KEY, (got) => {
        if (got?.[WIDTH_KEY]) setPanelWidth(got[WIDTH_KEY]);
      });
    } catch {
      const v = localStorage.getItem(WIDTH_KEY);
      if (v) setPanelWidth(v);
    }
  }

  function setPanelWidth(w) {
    document.documentElement.style.setProperty("--marklog-panel-width", w);
  }

  function setupResizer() {
    let activeId = null;

    const onMove = (e) => {
      if (e.pointerId !== activeId) return;
      const fromRight = window.innerWidth - e.clientX;
      const min = 320;
      const max = window.innerWidth * 0.95;
      const w = Math.max(min, Math.min(max, fromRight));
      setPanelWidth(w + "px");
    };

    const endDrag = (e) => {
      if (e.pointerId !== activeId) return;
      activeId = null;
      resizer.classList.remove("dragging");
      document.body.classList.remove("marklog-resizing");
      try { resizer.releasePointerCapture(e.pointerId); } catch {}
      resizer.removeEventListener("pointermove", onMove);
      resizer.removeEventListener("pointerup", endDrag);
      resizer.removeEventListener("pointercancel", endDrag);
      const w = getComputedStyle(document.documentElement)
        .getPropertyValue("--marklog-panel-width").trim();
      try { chrome.storage?.local.set({ [WIDTH_KEY]: w }); }
      catch { localStorage.setItem(WIDTH_KEY, w); }
    };

    resizer.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      activeId = e.pointerId;
      resizer.setPointerCapture(e.pointerId);
      resizer.classList.add("dragging");
      document.body.classList.add("marklog-resizing");
      resizer.addEventListener("pointermove", onMove);
      resizer.addEventListener("pointerup", endDrag);
      resizer.addEventListener("pointercancel", endDrag);
      e.preventDefault();
    });
  }

  function togglePanel() {
    ensurePanel();
    const hidden = panel.classList.toggle("marklog-hidden");
    resizer.classList.toggle("marklog-hidden", hidden);
  }

  // Listen for messages from panel iframe
  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "MARKLOG_INSERT_HTML") {
      const ok = insertHtmlIntoBlogger(msg.html);
      event.source?.postMessage(
        { type: "MARKLOG_INSERT_RESULT", ok },
        event.origin
      );
    } else if (msg.type === "MARKLOG_CLOSE") {
      if (panel) panel.classList.add("marklog-hidden");
      if (resizer) resizer.classList.add("marklog-hidden");
    }
  });

  // Receive toolbar-icon clicks from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "MARKLOG_TOGGLE_PANEL") togglePanel();
  });

  // Find Blogger's post body editor iframe and inject HTML.
  // Blogger renders the post body in an iframe in HTML view, and in a
  // contenteditable in Compose view. We try Compose first.
  function insertHtmlIntoBlogger(html) {
    // Strategy 1: rich-text iframe (Compose view legacy)
    const editorIframes = Array.from(document.querySelectorAll("iframe")).filter(
      (f) => {
        try {
          return f.contentDocument && f.contentDocument.body?.isContentEditable;
        } catch {
          return false;
        }
      }
    );
    for (const f of editorIframes) {
      const doc = f.contentDocument;
      const body = doc.body;
      body.focus();
      const sel = doc.getSelection();
      if (sel && sel.rangeCount === 0) {
        const r = doc.createRange();
        r.selectNodeContents(body);
        r.collapse(false);
        sel.addRange(r);
      }
      const ok = doc.execCommand("insertHTML", false, html);
      if (ok) return true;
    }

    // Strategy 2: top-level contenteditable (newer Blogger Compose)
    const ce = document.querySelector('[contenteditable="true"]');
    if (ce) {
      ce.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount === 0) {
        const r = document.createRange();
        r.selectNodeContents(ce);
        r.collapse(false);
        sel.addRange(r);
      }
      if (document.execCommand("insertHTML", false, html)) return true;
    }

    // Strategy 3: HTML view textarea
    const ta = document.querySelector("textarea");
    if (ta) {
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? ta.value.length;
      ta.value = ta.value.slice(0, start) + html + ta.value.slice(end);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    return false;
  }

  function init() {
    ensureFab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
