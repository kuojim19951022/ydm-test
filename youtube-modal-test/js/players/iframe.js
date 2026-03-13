import { PLAYER_VARS } from "../config.js";

export function createIframePlayer(container, youtubeId, videoTitle = "") {
  if (!container) return;
  const iframe = document.createElement("iframe");
  iframe.className = "youtube-iframe-player";
  const params = new URLSearchParams({
    ...PLAYER_VARS,
  }).toString();
  iframe.src = `https://www.youtube.com/embed/${youtubeId}?${params}`;
  iframe.title = videoTitle || "播放影片";
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute(
    "allow",
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
  );
  container.appendChild(iframe);
}
