// === 顯示行為控制 ===
export const CONFIG = {
  SHOW_TITLE: true,
  SHOW_DESCRIPTION: true,
  SHOW_RELATED_DEFAULT: true,
  PLAYER_TYPE: "lite-youtube", // 可選：'lite-youtube' | 'iframe' | 'youtube-iframe-api'
};

// === 播放器參數配置 ===
export const PLAYER_VARS = {
  autoplay: 0, // 自動播放
  controls: 1, // 顯示播放器控制列（播放／暫停、音量、全螢幕等）
  rel: 0, // 相關影片：0＝只顯示同頻道，1＝可顯示其他頻道
  playsinline: 1, // iOS 內嵌播放（不強制全螢幕）
  modestbranding: 0, // 0＝顯示 YouTube logo，1＝精簡品牌
  enablejsapi: 0, // 0＝不啟用 IFrame Player API（無法用 JS 控制播放／暫停等），1＝啟用。
  iv_load_policy: 3, // 影片註解：1＝顯示，3＝不顯示
};

// PLAYER_VARS 轉成的 query 字串
export const CACHED_PLAYER_PARAMS = new URLSearchParams(PLAYER_VARS).toString();

// === lite-youtube 元件屬性配置 ===
export const ELEMENT_ATTRS = {
  jsApi: true, // true＝顯示overlay（稍後觀看、分享）；false＝僅顯示複製連結
};

// === #initElements 使用的選擇器對照 ===
export const ELEMENT_SELECTORS = {
  modal: "#video-modal",
  closeBtn: "#video-modal-close",
  title: "#video-modal-title",
  iframeContainer: "#video-iframe-container",
  body: ".video-modal-body",
  description: "#video-modal-description",
  relatedSection: "#related-section",
  relatedContainer: "#video-modal-related-videos",
  relatedItemTemplate: "#related-video-item-template",
  iframeTemplate: "#youtube-iframe-template",
};

// === CDN 與資源路徑 ===
export const YOUTUBE_IFRAME_API_URL = "https://www.youtube.com/iframe_api";
export const LITE_YOUTUBE_SCRIPT_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/lite-youtube-embed/0.3.3/lite-yt-embed.js";
export const LITE_YOUTUBE_SCRIPT_INTEGRITY =
  "sha512-WKiiKu2dHNBXgIad9LDYeXL80USp6v+PmhRT5Y5lIcWonM2Avbn0jiWuXuh7mL2d5RsU3ZmIxg5MiWMEMykghA==";
export const LITE_YOUTUBE_CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/lite-youtube-embed/0.3.3/lite-yt-embed.css";
export const CSS_RELATIVE_PATH = "css/youtube-modal.css";
export const DEFAULT_COVER_PATH = "images/default-cover.jpg";
