import { PLAYER_VARS, YOUTUBE_IFRAME_API_URL } from "../config.js";

let loadPromise = null;

export function loadYoutubeIframeAPI() {
  if (loadPromise) return loadPromise;
  if (typeof window.YT !== "undefined" && window.YT.Player) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }
  loadPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve();
    };
    const script = document.createElement("script");
    script.src = YOUTUBE_IFRAME_API_URL;
    script.async = true;
    const first = document.querySelector("script");
    if (first && first.parentNode) {
      first.parentNode.insertBefore(script, first);
    } else {
      document.head.appendChild(script);
    }
  });
  return loadPromise;
}

export async function createYoutubeIframeAPIPlayer(
  container,
  youtubeId,
  videoTitle = "",
) {
  if (!container || !youtubeId) return;
  await loadYoutubeIframeAPI();
  const div = document.createElement("div");
  div.id = "yt-api-player-" + Date.now();
  div.className = "youtube-iframe-player";
  div.setAttribute("title", videoTitle || "播放影片");
  container.appendChild(div);
  // enablejsapi 必須為 1，否則程式無法控制播放器
  const playerVars = { ...PLAYER_VARS, enablejsapi: 1 };
  new window.YT.Player(div, {
    videoId: youtubeId,
    playerVars,
    width: "100%",
    height: "100%",
  });
}
