import { createIframePlayer } from "../players/iframe.js";
import { createLiteYoutubeElement } from "../players/lite-youtube.js";
import { createYoutubeIframeAPIPlayer } from "../players/youtube-iframe-api.js";

// 依 playerType 在 container 內建立播放器
export function renderPlayer(
  container,
  youtubeId,
  videoTitle = "",
  playerType = "lite-youtube",
) {
  if (!container || !youtubeId) return;
  if (playerType === "iframe") {
    createIframePlayer(container, youtubeId, videoTitle);
  } else if (playerType === "youtube-iframe-api") {
    createYoutubeIframeAPIPlayer(container, youtubeId, videoTitle);
  } else {
    createLiteYoutubeElement(container, youtubeId, videoTitle);
  }
}

export function renderContent(elements, video, options) {
  const { title, description } = elements;
  const { showTitle = true, showDescription = true } = options || {};
  if (title) {
    if (showTitle) {
      title.textContent = video.title || "";
      title.style.display = "";
    } else {
      title.textContent = "";
      title.style.display = "none";
    }
  }
  if (description) {
    const hasDescription =
      typeof video.description === "string" && video.description.trim() !== "";
    const shouldShow = showDescription !== false && hasDescription;
    description.textContent = shouldShow ? video.description : "";
    description.style.display = shouldShow ? "" : "none";
  }
}

export function renderBodyVisibility(elements) {
  const { body, description, relatedSection } = elements;
  if (!body) return;
  const descriptionVisible =
    description && description.style.display !== "none";
  const relatedVisible =
    relatedSection && relatedSection.style.display !== "none";
  body.style.display = descriptionVisible || relatedVisible ? "" : "none";
}
