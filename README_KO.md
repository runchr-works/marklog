# Marklog — Markdown for Blogger

> 🇬🇧 English: [README.md](README.md)

구글 블로거(Blogger)의 글쓰기 화면에서 **마크다운**으로 글을 쓸 수 있게 해주는 크롬 확장 프로그램입니다. 사이드 패널에서 마크다운을 작성하면 실시간으로 미리보기가 표시되고, 한 번의 클릭으로 Blogger 본문에 HTML로 삽입됩니다.

Made by [Runchr](https://runchr.com)

---

## ✨ 주요 기능

- **실시간 미리보기** — 좌측 마크다운 / 우측 렌더링된 HTML
- **GFM 전체 지원** — 표, 체크박스, 각주, 코드 하이라이트, 자동 링크 등
- **이미지 붙여넣기** — 클립보드 이미지를 그대로 Ctrl+V (긴 base64는 짧은 토큰으로 자동 치환되어 가독성 유지)
- **마크다운 툴바** — Bold/Italic/Heading/List/Link/Image/Code/Table/HR 원클릭
- **단축키** — `Ctrl+B`, `Ctrl+I`, `Ctrl+K`(링크)
- **치트시트** — 툴바의 `?` 버튼으로 GFM 전체 문법 참조
- **다크/라이트 테마 토글** — 🌙/☀ 버튼으로 전환, 선택 유지
- **패널 폭 / 에디터·미리보기 분할 폭 조절** — 가장자리 드래그
- **자동 저장** — `chrome.storage.local`에 초안 보관, 다음 접속 시 복원
- **HTML 복사** — Blogger의 HTML 보기에 직접 붙여넣기용 폴백

---

## 📦 설치 방법

아직 Chrome Web Store에 올라가 있지 않아서 **개발자 모드로 직접 로드**합니다.

1. 이 저장소를 클론하거나 ZIP으로 내려받기
   ```
   git clone https://github.com/your-username/marklog.git
   ```
2. 크롬 주소창에 `chrome://extensions` 입력 후 이동
3. 우상단 **"개발자 모드"** 토글을 ON
4. 좌상단 **"압축해제된 확장 프로그램 로드"** 클릭
5. 클론한 `marklog` 폴더 선택
6. 확장 목록에 **Marklog**가 나타나면 완료

---

## 🚀 사용 방법

1. [Blogger](https://www.blogger.com/) 글쓰기 화면 열기
2. 우하단의 주황색 **`M↓`** 떠 있는 버튼 클릭 → 사이드 패널 열림
3. 좌측에 마크다운 작성 → 우측에 미리보기 표시
4. **"Insert into Blogger"** 버튼 클릭 → Blogger 본문에 HTML 삽입
   - 또는 **"Copy HTML"** 후 Blogger의 HTML 보기에 수동 붙여넣기

### 이미지 첨부
스크린샷이나 이미지를 복사한 뒤 에디터에 그냥 붙여넣기(Ctrl+V) 하면 됩니다. 본문에는 `![image](marklog-img://1)` 같은 짧은 토큰만 표시되고, 실제 데이터는 별도로 저장됩니다. 미리보기와 삽입 시점에 자동으로 실제 이미지로 치환됩니다.

> 💡 큰 이미지는 base64 데이터 URL로 들어가므로 HTML 크기가 커집니다. 가급적 Blogger 본문에 직접 업로드한 뒤 URL을 받아 쓰는 것을 권장합니다.

### 단축키
| 단축키 | 동작 |
| --- | --- |
| `Ctrl+B` | 굵게 |
| `Ctrl+I` | 기울임 |
| `Ctrl+K` | 링크 삽입 |
| `Tab` | 2칸 들여쓰기 |

---

## 📁 프로젝트 구조

```
marklog/
├── manifest.json           # Chrome MV3 manifest
├── icons/                  # 16/48/128 아이콘
└── src/
    ├── background.js       # 툴바 아이콘 → 패널 토글
    ├── content.js          # Blogger 페이지에 FAB/패널 주입, 본문 삽입
    ├── content.css
    ├── panel.html          # 마크다운 에디터 UI
    ├── panel.css
    ├── panel.js            # 마크다운 변환, 자동 저장, 단축키 등
    └── lib/
        ├── marked.min.js        # 마크다운 파서
        ├── highlight.min.js     # 코드 하이라이팅
        └── highlight.min.css
```

---

## 🛠 기술 스택

- **Manifest V3** Chrome Extension
- [marked](https://marked.js.org/) — Markdown → HTML 변환
- [highlight.js](https://highlightjs.org/) — 코드 블록 신택스 하이라이팅
- 순수 Vanilla JS / CSS (빌드 도구 없음)

---

## ⚠️ 알려진 제약

- **이미지 자동 업로드 없음** — 붙여넣은 이미지는 base64로 인라인 저장됩니다. Blogger가 자체 CDN으로 옮기는지는 보장되지 않으므로, 큰 이미지는 직접 업로드를 권장합니다.
- **Blogger DOM 변경 시 삽입 실패 가능** — Blogger UI가 업데이트되면 본문 에디터를 찾지 못할 수 있습니다. 그 경우 **"Copy HTML"** 후 HTML 보기에 붙여넣기로 우회 가능합니다.
- **Permissions Policy** — 일부 페이지에서 Clipboard API가 차단되어 `execCommand('copy')` 폴백을 사용합니다.

---

## 📜 라이선스

[MIT](LICENSE)

---

Made with ☕ by [Runchr](https://runchr.com)
