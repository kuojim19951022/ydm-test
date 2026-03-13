import {
  LITE_YOUTUBE_SCRIPT_URL,
  LITE_YOUTUBE_SCRIPT_INTEGRITY,
  LITE_YOUTUBE_CSS_URL,
  CACHED_PLAYER_PARAMS,
  ELEMENT_ATTRS,
} from "../config.js";

// 模組內快取
let liteYoutubeLoadPromise = null;
let liteYoutubeCSS = null;

function waitForCustomElement(name, resolve, reject, timeout = 5000) {
  const checkInterval = setInterval(() => {
    if (customElements.get(name)) {
      clearInterval(checkInterval);
      resolve();
    }
  }, 50);
  setTimeout(() => {
    clearInterval(checkInterval);
    if (!customElements.get(name)) {
      reject(new Error(`${name} 載入超時`));
    }
  }, timeout);
}

// 載入 lite-youtube-embed 腳本
export function loadLiteYoutubeScript() {
  if (liteYoutubeLoadPromise) {
    return liteYoutubeLoadPromise;
  }
  if (customElements.get("lite-youtube")) {
    liteYoutubeLoadPromise = Promise.resolve();
    return liteYoutubeLoadPromise;
  }
  liteYoutubeLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LITE_YOUTUBE_SCRIPT_URL;
    script.integrity = LITE_YOUTUBE_SCRIPT_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    const existingScript = document.querySelector(
      `script[src="${script.src}"]`,
    );
    if (existingScript) {
      if (customElements.get("lite-youtube")) {
        resolve();
      } else {
        waitForCustomElement("lite-youtube", resolve, reject);
      }
    } else {
      script.onload = () => {
        waitForCustomElement("lite-youtube", resolve, reject);
      };
      script.onerror = () => {
        reject(new Error("lite-youtube-embed 腳本載入失敗"));
      };
      document.head.appendChild(script);
    }
  });
  return liteYoutubeLoadPromise;
}

// 載入 lite-youtube CSS
export async function loadLiteYoutubeCSS() {
  if (liteYoutubeCSS) {
    return liteYoutubeCSS;
  }
  try {
    const response = await fetch(LITE_YOUTUBE_CSS_URL);
    if (response.ok) {
      const cssText = await response.text();
      liteYoutubeCSS = cssText;
      return cssText;
    }
    return "";
  } catch (error) {
    console.error("載入 lite-youtube CSS 失敗:", error);
    return "";
  }
}

//建立 lite-youtube 元素並掛載到容器
export function createLiteYoutubeElement(
  container,
  youtubeId,
  videoTitle = "",
) {
  if (!container) return;
  const el = document.createElement("lite-youtube");
  el.setAttribute("videoid", youtubeId);
  el.setAttribute("params", CACHED_PLAYER_PARAMS);
  if (ELEMENT_ATTRS.jsApi) {
    el.setAttribute("js-api", "");
  }
  const playlabel =
    videoTitle && videoTitle.trim() ? `播放：${videoTitle.trim()}` : "播放影片";
  el.setAttribute("playlabel", playlabel);
  container.appendChild(el);
}
