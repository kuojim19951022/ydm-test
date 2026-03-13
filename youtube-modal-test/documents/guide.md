# YouTube Modal Web Component 使用手冊

## 目錄

- [基本用法](#基本用法)
- [API Endpoint 設定](#api-endpoint-設定)
- [功能開關設定](#功能開關設定)
- [API 回應格式](#api-回應格式)
- [程式碼結構說明](#程式碼結構說明)
- [注意事項](#注意事項)

---

## 基本用法

### 1. 在 HTML 中放入元件

```html
<youtube-modal endpoint="/path/to/getVideoDetail"></youtube-modal>
```

### 2. 載入元件腳本

```html
<script type="module" src="/path/to/youtube-modal/js/component.js"></script>
```

**注意**：請將 `/path/to/youtube-modal` 替換為實際的元件安裝路徑。

---

## API Endpoint 設定

元件需要透過 endpoint 取得影片詳細資料。設定方式有兩種：

### 方式 1：HTML 屬性（推薦）

直接在元件標籤中設定：

```html
<youtube-modal endpoint="/path/to/getVideoDetail"></youtube-modal>
```

### 方式 2：全域變數（跨頁共用）

多頁共用同一個 endpoint 時，可在頁面先設定全域變數，元件初始化時會讀取它；標籤上就不必再寫 `endpoint`。

```html
<script>
  window.YOUTUBE_MODAL_ENDPOINT = "/path/to/getVideoDetail";
</script>
<youtube-modal></youtube-modal>
```

**為什麼不用寫在標籤裡？** 元件內部會依序檢查：先看是否有 HTML 屬性 `endpoint`，沒有時再讀 `window.YOUTUBE_MODAL_ENDPOINT`，因此只要在全域設定好即可。

### 優先順序

1. HTML 屬性 `endpoint`（最高優先）
2. 全域變數 `window.YOUTUBE_MODAL_ENDPOINT`

**重要**：若兩者都未設定，元件無法以 API 模式載入影片資料。

---

## 功能開關設定

### 在設定檔中設定

編輯 `youtube-modal-test/js/config.js`，以下區塊皆可用行內註解調整：

**CONFIG**

```javascript
export const CONFIG = {
  SHOW_TITLE: true, // 是否顯示影片標題
  SHOW_DESCRIPTION: true, // 是否顯示影片描述（空描述會自動隱藏）
  SHOW_RELATED_DEFAULT: true, // 是否預設顯示相關影片（可被 HTML 屬性 show-related 覆蓋）
  PLAYER_TYPE: "lite-youtube", // 播放器類型：'lite-youtube' | 'iframe' | 'youtube-iframe-api'
};
```

**PLAYER_VARS**

```javascript
export const PLAYER_VARS = {
  autoplay: 0, // 自動播放：0＝關閉，1＝開啟
  controls: 1, // 顯示播放器控制列（播放／暫停、音量、全螢幕等）
  rel: 0, // 相關影片：0＝只顯示同頻道，1＝可顯示其他頻道
  playsinline: 1, // iOS 內嵌播放（不強制全螢幕）
  modestbranding: 0, // 0＝顯示 YouTube logo，1＝精簡品牌
  enablejsapi: 0, // 0＝不啟用 IFrame Player API，1＝啟用（youtube-iframe-api 會強制為 1）
  iv_load_policy: 3, // 影片註解：1＝顯示，3＝不顯示
};
```

**ELEMENT_ATTRS**（僅 lite-youtube 播放器）

```javascript
export const ELEMENT_ATTRS = {
  jsApi: true, // true＝顯示 overlay（稍後觀看、分享）；false＝僅顯示複製連結
};
```

修改後重新載入頁面即可生效。

### 在 HTML 標籤中設定

```html
<!-- 例：關閉相關影片 -->
<youtube-modal
  endpoint="/path/to/getVideoDetail"
  show-related="false"
></youtube-modal>
```

---

## API 回應格式

endpoint 需返回以下 JSON 格式：

```json
{
  "status": true,
  "video": {
    "id": "video-001",
    "title": "影片標題",
    "description": "影片描述（可選）",
    "youtubeId": "dQw4w9WgXcQ"
  },
  "related": [
    {
      "id": "video-002",
      "title": "相關影片標題",
      "coverImage": "/path/to/cover.jpg"
    }
  ]
}
```

---

## 程式碼結構說明

### 檔案結構（行內為簡短說明）

```
youtube-modal-test/
├── js/
│   ├── component.js      # 核心元件（生命週期、對外 API、協調模組）
│   ├── config.js         # 設定（CONFIG、PLAYER_VARS、選擇器、CDN 與資源路徑）
│   ├── template.js       # Shadow DOM 用 HTML 模板字串
│   ├── modules/
│   │   ├── video-content.js   # 標題、描述、播放器、body 顯示
│   │   └── related-videos.js  # 相關影片列表渲染
│   ├── utils/
│   │   ├── path.js       # 路徑解析（getBasePath 等）
│   │   └── dom.js        # 屬性解析、清空內容、escapeHtml
│   └── players/
│       ├── iframe.js     # 一般 YouTube embed iframe
│       ├── lite-youtube.js    # 載入腳本/CSS、建立 lite-youtube 元素
│       └── youtube-iframe-api.js  # YouTube IFrame API 播放器
├── css/
│   └── youtube-modal.css # 元件樣式
├── documents/
│   └── guide.md          # 本使用手冊
└── images/
    └── default-cover.jpg # 相關影片預設封面
```

---

## 注意事項

### ✅ 建議做法

#### 使用方式

- 頁面中只需放置**一個** `<youtube-modal>` 元件

#### 樣式修改

- 調整樣式請改 `youtube-modal.css`
- **請勿修改** `template.js` 中的 `id`、`class` 名稱，以免功能綁定失效

### ❌ 不建議做法

- **不要在同一個頁面放置多個 `<youtube-modal>` 元件**（除非有特殊需求）
- **不要直接修改 `template.js` 中的結構**（除非了解影響範圍）
- **不要移除事件監聽或關閉邏輯**（會影響使用者體驗）
