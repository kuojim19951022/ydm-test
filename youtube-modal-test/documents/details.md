# youtube-modal 元件技術說明

本文說明 youtube-modal Web Component 的專案架構、生命週期、引用流程，以及各函式之間的牽套關係。

---

## 項目 1：專案架構與職責說明

### 目錄結構

```
youtube-modal-test/
├── js/
│   ├── component.js      # 元件主體（唯一對外入口）
│   ├── config.js         # 設定與常數
│   ├── template.js       # Shadow DOM 用 HTML 模板字串
│   ├── modules/         # 依「功能區塊」拆出的模組
│   │   ├── video-content.js   # 標題、描述、播放器、body 顯示
│   │   └── related-videos.js  # 相關影片列表渲染
│   ├── utils/            # 通用工具
│   │   ├── path.js       # 路徑解析
│   │   └── dom.js        # 屬性解析、清空內容、escapeHtml
│   └── players/          # 三種播放器實作
│       ├── iframe.js
│       ├── lite-youtube.js
│       └── youtube-iframe-api.js
├── css/
    └── youtube-modal.css

```

### 各層職責與連結關係

| 層級         | 檔案／資料夾                    | 職責                                                                                   | 被誰引用                                                                   |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **元件入口** | `component.js`                  | 自訂元素類別、生命週期、對外 API（openWithAPI / openWithData / close）、協調資料與模組 | 頁面 HTML 透過 `<script type="module" src="...component.js">` 載入         |
| **設定**     | `config.js`                     | CONFIG、PLAYER_VARS、ELEMENT_SELECTORS、CDN 網址、資源路徑                             | component、各 player、video-content（間接）、related-videos（間接）、utils |
| **模板**     | `template.js`                   | 匯出 `YOUTUBE_MODAL_TEMPLATE` 字串，供 Shadow DOM 使用                                 | 僅 component.js                                                            |
| **功能模組** | `modules/video-content.js`      | 標題／描述渲染、依 playerType 建立播放器、body 顯示與否                                | 僅 component.js                                                            |
| **功能模組** | `modules/related-videos.js`     | 渲染「相關影片」列表，使用 template 複製節點                                           | 僅 component.js                                                            |
| **工具**     | `utils/path.js`                 | **路徑處理**：依元件屬性或全域變數算出資源根路徑、正規化為可用的 URL；供 component 載入 CSS 與傳給 related-videos 當預設封面路徑用。 | component.js、component 呼叫 related-videos 時傳入 defaultCover 路徑       |
| **工具**     | `utils/dom.js`                  | **DOM／屬性工具**：把字串做 HTML 跳脫防 XSS、解析 HTML 布林屬性（如 show-related）、解析播放器類型屬性、清空 modal 內標題／描述／播放器／相關影片區塊。 | component.js、related-videos.js（escapeHtml）                              |
| **播放器**   | `players/iframe.js`             | 建立一般 YouTube embed iframe，使用 config 的 PLAYER_VARS                              | modules/video-content.js                                                   |
| **播放器**   | `players/lite-youtube.js`       | 載入 lite-youtube 腳本與 CSS、建立 `<lite-youtube>` 元素                               | component.js（載入）、video-content.js（建立元素）                         |
| **播放器**   | `players/youtube-iframe-api.js` | 載入 YouTube IFrame API、建立 YT.Player 實例                                           | modules/video-content.js                                                   |

### 引用鏈簡圖

```
頁面 (video.html)
  └── <script type="module" src=".../component.js">

component.js
  ├── template.js          → YOUTUBE_MODAL_TEMPLATE
  ├── config.js            → CONFIG, ELEMENT_SELECTORS, CSS_RELATIVE_PATH, DEFAULT_COVER_PATH
  ├── players/lite-youtube.js → loadLiteYoutubeScript, loadLiteYoutubeCSS（僅 component 在 connectedCallback 用）
  ├── modules/video-content.js → renderContent, renderPlayer, renderBodyVisibility
  ├── modules/related-videos.js → renderRelatedVideos
  ├── utils/path.js        → getBasePath
  └── utils/dom.js        → getBooleanAttribute, getPlayerType, clearModalContent

modules/video-content.js
  ├── players/iframe.js           → createIframePlayer
  ├── players/lite-youtube.js     → createLiteYoutubeElement
  └── players/youtube-iframe-api.js → createYoutubeIframeAPIPlayer

modules/related-videos.js
  └── utils/dom.js        → escapeHtml
```

### 為何如此拆分？

- **component.js**：只負責「何時載入資源、何時開關彈窗、何時把資料交給誰」，不處理「標題怎麼填、播放器怎麼建、相關影片怎麼畫」。
- **config.js**：所有可調參數集中一處，改行為（如 PLAYER_TYPE、SHOW_TITLE）不必翻邏輯檔。
- **template.js**：HTML 結構單一檔案，易與 CSS 選擇器對照，也方便之後替換成其他模板來源。
- **modules/**：依「影片主體內容」與「相關影片列表」分開，職責單一；component 只做資料取得與呼叫，不直接操作 DOM 細節。
- **utils/**：路徑與 DOM/屬性解析可被多處共用，且不依賴元件內部狀態，方便測試與重用。
- **players/**：三種播放方式（iframe、lite-youtube、youtube-iframe-api）各自獨立檔案，由 video-content 依 `playerType` 選擇呼叫，新增或替換播放器不影響 component 主流程。

### 補充：lite-youtube 為何由 component 載入腳本／CSS？

- **component.js 有引用** `players/lite-youtube.js`：在 `connectedCallback` 裡會呼叫 `loadLiteYoutubeScript()`、`loadLiteYoutubeCSS()`，並把 lite-youtube 的 CSS 字串傳給 `#render(css, liteYoutubeCSS)`，一起注入 Shadow DOM。也就是說，**「載入」腳本與 CSS 的時機在元件初始化時，由 component 負責**。
- **建立 `<lite-youtube>` 元素**則在每次開彈窗時，由 `video-content.js` 的 `renderPlayer` 呼叫 `createLiteYoutubeElement` 完成。
- **另外兩種 player 為何不這樣寫？**
  - **iframe**：不需要額外腳本或 CSS，只要在畫面上建立一個 `<iframe>` 並設好 YouTube embed URL 即可，所以不需要在 component 裡預先載入任何東西。
  - **youtube-iframe-api**：需要 YouTube IFrame API 腳本，但載入時機是「第一次要建立該類型播放器時」，在 `youtube-iframe-api.js` 的 `createYoutubeIframeAPIPlayer` 內會 `await loadYoutubeIframeAPI()`，屬於**延遲載入**，不必在 component 的 `connectedCallback` 就先載入。
- 總結：只有 lite-youtube 需要在**初始化時**就把腳本與 CSS 準備好並注入 Shadow DOM，所以由 component 在 connectedCallback 呼叫 lite-youtube 的載入函式；另外兩種播放器要嘛不需額外資源（iframe），要嘛在自家模組裡延遲載入（youtube-iframe-api）。

### 補充：close() 與 isOpen() 的命名

- **close()**：動詞，表示「執行關閉」的動作。
- **isOpen()**：狀態查詢，表示「彈窗是否為開啟狀態」，回傳 true/false。
- 兩者一個是動作、一個是狀態，命名邏輯一致。若把 `close` 改成 `isClose` 會造成語意混亂：「is close」在英文裡易被理解成「是否接近某物」或筆誤的 isClosed；若要表達「是否已關閉」應用 **isClosed()**，而不是 isClose。因此維持 **close()** 與 **isOpen()** 即可。

### 補充：API 回傳格式中的 `related?`

- 這裡的 **?** 是「選用欄位」的常見寫法（如 TypeScript、JSDoc）：表示 API 回傳的物件**可能帶有 `related`，也可能沒有**。
- 也就是說：`{ status, video, related? }` 代表「一定有 status 和 video，related 則可有可無」；後端若沒回傳相關影片，就不會有 `related`，或為空陣列，程式裡會依「有無 list／length」處理，不會假定 related 一定存在。

---

## 項目 2：生命週期與引用流程

### 生命週期概觀

1. **元素被加入 DOM** → `constructor` 執行 → `attachShadow` → 實例狀態與 `_keydownHandler` 設定。
2. **同一元素被連上 document** → `connectedCallback` 執行（非同步）：設定 endpoint、屬性、載入 CSS／lite-youtube（若需要）、渲染 Shadow、`#initElements`、`#initEventListeners`，最後 `#initialized = true`。
3. **元素自 DOM 移除** → `disconnectedCallback` 執行，移除 document 上的 keydown 監聽。

之後的使用都是「呼叫公開 API」：`openWithAPI(id)`、`openWithData(data)`、`close()`、`isOpen()`。

### 帶 ID 打開彈窗的完整流程（概述）

1. 頁面或列表點擊某影片 → 呼叫 `modal.openWithAPI(videoId)`。
2. `openWithAPI`：清空內容（clearModalContent）、標題改「載入中...」、modal 加 `active`、body 鎖捲動。
3. `fetch(endpoint?id=videoId)` 取得 `{ status, video, related? }`（related 為選用欄位，見下方補充）。
4. 成功且 `data.video` 存在 → 呼叫 `#applyData(data)`。
5. `#applyData` 依序：
   - `renderContent`（標題、描述）
   - `renderPlayer`（依 playerType 呼叫對應 player 建立播放器）
   - `renderRelatedVideos`（相關影片列表）
   - `renderBodyVisibility`（決定 body 區塊是否顯示）
6. 使用者關閉彈窗（按鈕、背景、ESC）→ `close()` → 移除 `active`、再次 `clearModalContent`、還原 body 捲動。

### 初始化時觸發的函式（connectedCallback 內）

| 順序 | 觸發項目                         | 說明                                                                                                            |
| ---- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1    | 讀取 `endpoint`                  | `getAttribute("endpoint")` 或 `window.YOUTUBE_MODAL_ENDPOINT`                                                   |
| 2    | 讀取屬性                         | `getBooleanAttribute(this, "show-related", ...)`、`getPlayerType(this, [...], CONFIG.PLAYER_TYPE)`              |
| 3    | 若 playerType 為 lite-youtube    | `Promise.all([ loadLiteYoutubeScript(), #loadCSS(), loadLiteYoutubeCSS() ])`，再 `#render(css, liteYoutubeCSS)` |
| 4    | 若為 iframe / youtube-iframe-api | 僅 `#loadCSS()`，再 `#render(css, "")`                                                                          |
| 5    | `#initElements()`                | 依 ELEMENT_SELECTORS 在 shadowRoot 查詢，寫入 `this.elements`                                                   |
| 6    | `#initEventListeners()`          | 關閉鈕、點擊背景、document keydown、relatedContainer 點擊委派                                                   |
| 7    | `#initialized = true`            | 之後 `close()`、`isOpen()` 才不會提早 return                                                                    |

---

## 項目 3：流程之函式細節與牽套

### 3.1 建構與狀態（constructor）

- **super()**：呼叫 HTMLElement 建構函式，必須先執行才能使用 `this`。
- **attachShadow({ mode: "open" })**：建立 Shadow DOM，後續 `#render` 寫入的 HTML/CSS 都在此樹內，與主文件樣式隔離。
- **this.endpoint / elements / showRelated / showTitle / showDescription**：由 constructor 或 connectedCallback 賦值，供 openWithAPI、#applyData 使用。
- **\_keydownHandler**：閉包引用 `this`，在 `#initEventListeners` 掛到 document，在 `disconnectedCallback` 卸除；只負責 ESC 關閉。

### 3.2 生命週期

- **connectedCallback**
  - 設定 endpoint、showRelated（getBooleanAttribute）、必要時並行載入 lite-youtube 腳本＋CSS＋元件自身 CSS。
  - 呼叫 `#loadCSS` → 可能用快取；路徑由 `getBasePath(this, import.meta.url)` 與 config 的 `CSS_RELATIVE_PATH` 組成。
  - 呼叫 `#render(css, liteYoutubeCSS)` → 將 template 與兩段 `<style>` 寫入 `this.shadowRoot.innerHTML`，此後 DOM 才存在，才能做 `#initElements`。
  - `#initElements` 依 ELEMENT_SELECTORS 填滿 `this.elements`，供後續 clearModalContent、renderContent、renderPlayer、renderRelatedVideos、renderBodyVisibility 使用。
  - `#initEventListeners` 綁定關閉與相關影片點擊；相關影片點擊時若有 `this.getVideoDetailById` 則用 `openWithData`，否則 `openWithAPI(newVideoId)`。

- **disconnectedCallback**
  - 僅移除 document 的 keydown 監聽，避免元素移除後仍回應 ESC。

### 3.3 私有初始化（#loadCSS、#render、#initElements、#initEventListeners）

- **#loadCSS()**
  - 使用 `YoutubeModal.cssCache` 避免重複 fetch；路徑依 `getBasePath(this, import.meta.url)` 與 config；回傳 CSS 字串給 `#render`。

- **#render(css, liteYoutubeCSS)**
  - 將元件 CSS、lite-youtube CSS（可為空字串）、YOUTUBE_MODAL_TEMPLATE 寫入 shadowRoot。
  - 之後 `this.elements` 才能透過 ELEMENT_SELECTORS 正確查到節點。

- **#initElements()**
  - 用 `Object.fromEntries` + `ELEMENT_SELECTORS` 在 shadowRoot 上 querySelector，產出 `this.elements`（modal、closeBtn、title、iframeContainer、body、description、relatedSection、relatedContainer、relatedItemTemplate 等）。
  - 後續所有「清空、填標題、填描述、掛播放器、填相關影片、控制 body 顯示」都依賴這份 elements。

- **#initEventListeners()**
  - 關閉鈕、modal 背景點擊、document keydown 都呼叫 `this.close()`。
  - relatedContainer 使用事件委派：點到 `.related-video-item` 時取 `dataset.id`，有 `getVideoDetailById` 則取資料後 `openWithData(data)`，否則 `openWithAPI(newVideoId)`。
  - 因此「帶 ID 打開彈窗」的入口可以是：頁面直接呼叫 `openWithAPI(id)`，或從相關影片點擊進來（同一套 openWithAPI / openWithData）。

### 3.4 公開 API 與 #applyData 的牽套

- **openWithAPI(videoId)**
  - 使用 `this.elements`（title、modal）與 utils 的 `clearModalContent(this.elements)` 清空並顯示「載入中...」、加上 `active`、鎖 body。
  - fetch 成功且 `data.video` 存在時呼叫 `this.#applyData(data)`；失敗或無 video 則 `close()` 並 alert。
  - **牽套**：依賴 component 的 endpoint、elements；清空與顯示邏輯依賴 dom.js 的 clearModalContent。

- **openWithData(data)**
  - 不做 fetch，先檢查 `data.video`、`data.video.youtubeId`；同樣 `clearModalContent`，標題直接設為 `data.video.title`，modal 加 `active`、鎖 body，再呼叫 `#applyData(data)`。
  - **牽套**：與 openWithAPI 共用同一套 `#applyData`，差別只在「資料來源」是 API 還是呼叫端傳入。

- **#applyData(data)**
  - 從 `data.video` 取 youtubeId，無則 close 並 alert。
  - 依序呼叫：
    1. **renderContent(this.elements, video, { showTitle, showDescription })**
       - 寫入 title、description 與 display，受 CONFIG 與元件屬性影響。
    2. **renderPlayer(iframeContainer, youtubeId, video.title, getPlayerType(...))**
       - getPlayerType 來自 utils/dom.js，決定 "iframe" | "lite-youtube" | "youtube-iframe-api"。
       - video-content 的 renderPlayer 依此呼叫對應 player 的 create 函式，在 iframeContainer 內建立播放器。
    3. **renderRelatedVideos({ ...this.elements, list, defaultCover, showRelated })**
       - defaultCover 由 `getBasePath(this, import.meta.url)` 與 config 的 DEFAULT_COVER_PATH 組成。
       - related-videos 使用 relatedItemTemplate 複製節點、填封面與標題、escapeHtml 防 XSS，最後掛到 relatedContainer 並控制 relatedSection 的 display。
    4. **renderBodyVisibility(this.elements)**
       - 依 description、relatedSection 的 display 決定 body 區塊是否顯示，避免空白區塊佔位。
  - **牽套**：component 提供 elements、showTitle、showDescription、showRelated、playerType；video-content 與 related-videos 只收「資料 + 選項」，不直接依賴 component 實例。

- **close()**
  - 若未 `#initialized` 直接 return。
  - 移除 modal 的 `active`、clearModalContent、還原 body overflow。
  - **牽套**：依賴 this.elements 與 utils 的 clearModalContent。

- **isOpen()**
  - 未初始化回傳 false；否則回傳 modal 是否包含 `active` class。
  - 供 \_keydownHandler（ESC）與外部判斷是否已開。

### 3.5 modules 與 players 的牽套

- **video-content.js**
  - **renderContent**：只改 elements 的 title、description 的 textContent 與 style.display，不建立節點。
  - **renderPlayer**：依 playerType 呼叫 iframe / lite-youtube / youtube-iframe-api 的 create 函式；三支 player 都只接收 (container, youtubeId, videoTitle)，並從 config 讀取 PLAYER_VARS 等。
  - **renderBodyVisibility**：只讀 elements 的 body、description、relatedSection 的 display，寫入 body 的 display。
  - 不依賴 component，只依賴傳入的 elements 與 options。

- **related-videos.js**
  - 使用 elements 的 relatedSection、relatedContainer、relatedItemTemplate，以及 list、defaultCover、showRelated。
  - 用 utils/dom.js 的 escapeHtml 處理標題與封面網址，避免 XSS。
  - 無 list 或 showRelated 為 false 時隱藏 relatedSection；有資料時 clone template、填寫、append 到 relatedContainer，並顯示 relatedSection。

- **players**
  - **iframe.js**：建立 iframe，src 為 embed URL + PLAYER_VARS 的 query。
  - **lite-youtube.js**：component 在 connectedCallback 負責載入腳本與 CSS；createLiteYoutubeElement 只負責建立 `<lite-youtube>` 並設定屬性（videoid、params、playlabel、js-api）。
  - **youtube-iframe-api.js**：create 時會 await loadYoutubeIframeAPI()，再 new YT.Player(div, ...)；playerVars 來自 config 並強制 enablejsapi: 1。

### 3.6 資料流與影響關係整理

- **初始化一次**：connectedCallback → 載入資源 → #render → #initElements → #initEventListeners → #initialized = true。
  - 之後「開彈窗」只會呼叫 openWithAPI / openWithData → #applyData → renderContent / renderPlayer / renderRelatedVideos / renderBodyVisibility。

- **每次開啟彈窗**：
  - 先 clearModalContent（清掉標題、描述、iframeContainer、相關影片、relatedSection 顯示）。
  - openWithAPI 會先顯示「載入中...」再 fetch；openWithData 直接帶入資料。
  - #applyData 依同一份 data 與 this 的設定，依序更新標題與描述、建立播放器、填相關影片、決定 body 顯示。
  - 因此「標題／描述／播放器／相關影片／body 顯示」都受同一份 data 與 CONFIG/屬性 影響，且由 component 統一驅動，modules 不直接改 component 狀態，只改傳入的 elements（DOM）。

- **關閉彈窗**：close() 再次 clearModalContent 並移除 active，下次開啟時會重新執行 #applyData，因此不會殘留上一支影片的內容。

以上即為 youtube-modal 的架構、生命週期、引用流程，以及各函式之間的牽套與影響說明。
