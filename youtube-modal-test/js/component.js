import { YOUTUBE_MODAL_TEMPLATE } from "./template.js";
import {
  CONFIG,
  ELEMENT_SELECTORS,
  CSS_RELATIVE_PATH,
  DEFAULT_COVER_PATH,
} from "./config.js";
import {
  loadLiteYoutubeScript,
  loadLiteYoutubeCSS,
} from "./players/lite-youtube.js";
import {
  renderContent,
  renderPlayer,
  renderBodyVisibility,
} from "./modules/video-content.js";
import { renderRelatedVideos } from "./modules/related-videos.js";
import { getBasePath } from "./utils/path.js";
import {
  getBooleanAttribute,
  getPlayerType,
  clearModalContent,
} from "./utils/dom.js";

class YoutubeModal extends HTMLElement {
  static cssCache = null;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.endpoint = null;
    this.elements = {};
    this.showRelated = CONFIG.SHOW_RELATED_DEFAULT;
    this.showDescription = CONFIG.SHOW_DESCRIPTION;
    this.showTitle = CONFIG.SHOW_TITLE;
    this._keydownHandler = (e) => {
      if (e.key === "Escape" && this.isOpen()) this.close();
    };
  }

  // === 初始化完成旗標 ===
  #initialized = false;

  async connectedCallback() {
    const attrEndpoint = this.getAttribute("endpoint");
    const globalEndpoint = window.YOUTUBE_MODAL_ENDPOINT;
    this.endpoint = attrEndpoint || globalEndpoint || "";
    this.showRelated = getBooleanAttribute(
      this,
      "show-related",
      CONFIG.SHOW_RELATED_DEFAULT,
    );
    if (
      getPlayerType(
        this,
        ["lite-youtube", "iframe", "youtube-iframe-api"],
        CONFIG.PLAYER_TYPE,
      ) === "lite-youtube"
    ) {
      const [, css, liteYoutubeCSS] = await Promise.all([
        loadLiteYoutubeScript(),
        this.#loadCSS(),
        loadLiteYoutubeCSS(),
      ]);
      this.#render(css, liteYoutubeCSS);
    } else {
      const css = await this.#loadCSS();
      this.#render(css, "");
    }
    this.#initElements();
    this.#initEventListeners();
    this.#initialized = true;
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._keydownHandler);
  }

  // === 私有：初始化（載入 CSS、渲染、元素引用、事件）===
  async #loadCSS() {
    if (YoutubeModal.cssCache) return YoutubeModal.cssCache;
    const timestamp = window.APP_TIMESTAMP || Date.now();
    const cssPath = `${getBasePath(this, import.meta.url)}/${CSS_RELATIVE_PATH}?v=${timestamp}`;
    try {
      const response = await fetch(cssPath);
      if (response.ok) {
        const cssText = await response.text();
        YoutubeModal.cssCache = cssText;
        return cssText;
      }
      return "";
    } catch (error) {
      console.error("載入 YouTube Modal CSS 失敗:", error);
      return "";
    }
  }

  #render(css, liteYoutubeCSS) {
    const template = YOUTUBE_MODAL_TEMPLATE;
    this.shadowRoot.innerHTML = `
            <style>${css}</style>
            <style>${liteYoutubeCSS}</style>
            ${template}
        `;
  }

  #initElements() {
    const root = this.shadowRoot;
    this.elements = Object.fromEntries(
      Object.entries(ELEMENT_SELECTORS).map(([key, selector]) => [
        key,
        root.querySelector(selector),
      ]),
    );
  }

  #initEventListeners() {
    const { closeBtn, modal, relatedContainer } = this.elements;
    // 關閉按鈕
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }
    // 點擊背景關閉
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }
    // ESC 鍵關閉
    document.addEventListener("keydown", this._keydownHandler);
    // 若頁面有 getVideoDetailById（靜態資料），優先用openWithData
    if (relatedContainer) {
      relatedContainer.addEventListener("click", (e) => {
        const item = e.target.closest(".related-video-item");
        if (item) {
          const newVideoId = item.dataset.id;
          if (typeof this.getVideoDetailById === "function") {
            const data = this.getVideoDetailById(newVideoId);
            if (data && data.video) {
              this.openWithData(data);
              return;
            }
          }
          this.openWithAPI(newVideoId);
        }
      });
    }
  }

  // === API 模式 ===
  async openWithAPI(videoId) {
    if (!videoId) {
      console.error("缺少影片 ID");
      return;
    }
    const { title, modal } = this.elements;
    // 先清理所有舊資料
    clearModalContent(this.elements);
    // 顯示載入中狀態
    if (title) title.textContent = "載入中...";
    if (modal) modal.classList.add("active");
    document.body.style.overflow = "hidden";
    try {
      // 取得影片詳細資料
      const response = await fetch(
        `${this.endpoint}?id=${encodeURIComponent(videoId)}`,
      );
      const data = await response.json();
      if (data.status && data.video) {
        this.#applyData(data);
      } else {
        this.close();
        alert(data.message || "無法載入影片資料");
      }
    } catch (error) {
      console.error("載入影片資料失敗:", error);
      this.close();
      alert("載入影片失敗，請稍後再試");
    }
  }

  // === 靜態資料模式 ===
  openWithData(data) {
    if (!data || !data.video) {
      console.error("openWithData 需要傳入 { status, video, related? }");
      return;
    }
    if (!data.video.youtubeId) {
      alert("此影片沒有 YouTube 連結");
      return;
    }
    const { title, modal } = this.elements;
    clearModalContent(this.elements);
    if (title) title.textContent = data.video.title ?? "";
    if (modal) modal.classList.add("active");
    document.body.style.overflow = "hidden";
    this.#applyData(data);
  }

  close() {
    if (!this.#initialized) return;
    this.elements.modal.classList.remove("active");
    clearModalContent(this.elements);
    document.body.style.overflow = "";
  }

  isOpen() {
    if (!this.#initialized) return false;
    return this.elements.modal.classList.contains("active");
  }

  // === 私有：套用資料（標題、播放器、描述、相關影片、body 顯示）===
  #applyData(data) {
    const video = data.video;
    const youtubeId = video.youtubeId;
    if (!youtubeId) {
      this.close();
      alert("此影片沒有 YouTube 連結");
      return;
    }
    renderContent(this.elements, video, {
      showTitle: this.showTitle,
      showDescription: this.showDescription,
    });
    renderPlayer(
      this.elements.iframeContainer,
      youtubeId,
      video.title,
      getPlayerType(
        this,
        ["lite-youtube", "iframe", "youtube-iframe-api"],
        CONFIG.PLAYER_TYPE,
      ),
    );
    renderRelatedVideos({
      ...this.elements,
      list: data.related,
      defaultCover: `${getBasePath(this, import.meta.url)}/${DEFAULT_COVER_PATH}`,
      showRelated: this.showRelated,
    });
    renderBodyVisibility(this.elements);
  }
}

// 註冊自定義元素
if (!customElements.get("youtube-modal")) {
  customElements.define("youtube-modal", YoutubeModal);
}
