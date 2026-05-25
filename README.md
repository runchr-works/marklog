# Marklog — Markdown for Blogger

> 🇰🇷 한국어: [README_KO.md](README_KO.md)

A Chrome extension that lets you write Google Blogger posts in **Markdown**. Compose in a side panel with live preview, then insert the rendered HTML into the Blogger editor with one click.

Made by [Runchr](https://runchr.com)

---

## ✨ Features

- **Live preview** — Markdown on the left, rendered HTML on the right
- **Full GFM support** — tables, task lists, footnotes, syntax-highlighted code, autolinks, and more
- **Paste images directly** — Ctrl+V from clipboard; long base64 strings are stored as short tokens so the editor stays readable
- **Markdown toolbar** — one-click Bold / Italic / Heading / List / Link / Image / Code / Table / HR
- **Keyboard shortcuts** — `Ctrl+B`, `Ctrl+I`, `Ctrl+K` (link)
- **Cheatsheet** — full GFM reference via the `?` button
- **Dark / light theme toggle** — 🌙/☀ button, preference is remembered
- **Resizable panel & split** — drag the left edge of the panel, or the divider between editor and preview
- **Auto-save** — drafts and pasted images persist in `chrome.storage.local`
- **Copy HTML** — fallback for pasting into Blogger's HTML view manually

---

## 📦 Installation

The extension is not on the Chrome Web Store yet, so you'll load it in developer mode.

1. Clone the repo (or download as ZIP):
   ```
   git clone https://github.com/runchr-works/marklog.git
   ```
2. Open `chrome://extensions` in Chrome
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked** (top left)
5. Select the cloned `marklog` folder
6. **Marklog** should now appear in your extension list

---

## 🚀 Usage

1. Open the [Blogger](https://www.blogger.com/) post editor
2. Click the floating orange **`M↓`** button at the bottom right — the side panel opens
3. Write Markdown on the left; the preview updates on the right
4. Click **"Insert into Blogger"** to drop the rendered HTML into the post body
   - Alternatively, use **"Copy HTML"** and paste it into Blogger's HTML view

<img width="1073" height="916" alt="image" src="https://github.com/user-attachments/assets/766f7408-b671-47e5-876a-329cc5a46cb9" />


### Pasting images
Copy any image (screenshot, clipboard image, etc.) and paste it into the editor with Ctrl+V. Only a short token like `![image](marklog-img://1)` appears in the source; the actual image data is stored separately and substituted automatically in the preview and on insert.

> 💡 Large pasted images are kept as base64 data URLs, which can balloon the HTML size. For big images, prefer uploading them through Blogger's image picker and using the resulting URL.

### Shortcuts
| Shortcut | Action |
| --- | --- |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+K` | Insert link |
| `Tab` | Insert two spaces |

---

## 📁 Project structure

```
marklog/
├── manifest.json           # Chrome MV3 manifest
├── icons/                  # 16 / 48 / 128 icons
└── src/
    ├── background.js       # toolbar action → toggle panel
    ├── content.js          # injects FAB + panel iframe into Blogger pages
    ├── content.css
    ├── panel.html          # markdown editor UI
    ├── panel.css
    ├── panel.js            # markdown rendering, auto-save, shortcuts, etc.
    └── lib/
        ├── marked.min.js        # Markdown parser
        ├── highlight.min.js     # Syntax highlighting
        └── highlight.min.css
```

---

## 🛠 Tech stack

- **Manifest V3** Chrome Extension
- [marked](https://marked.js.org/) — Markdown → HTML
- [highlight.js](https://highlightjs.org/) — code block syntax highlighting
- Plain Vanilla JS / CSS (no build step)

---

## ⚠️ Known limitations

- **No image hosting** — pasted images stay inline as base64. Whether Blogger lifts them to its own CDN on save is not guaranteed; upload large images via Blogger directly.
- **Blogger DOM may change** — if Blogger updates its UI, the editor element might not be detected. As a workaround, use **"Copy HTML"** and paste into Blogger's HTML view.
- **Permissions Policy** — some pages block the Clipboard API; Marklog falls back to `execCommand('copy')`.

---

## 📜 License

[MIT](LICENSE)

---

Made with ☕ by [Runchr](https://runchr.com)
