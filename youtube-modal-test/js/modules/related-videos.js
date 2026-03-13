import { escapeHtml } from "../utils/dom.js";

export function renderRelatedVideos(options) {
  const {
    relatedSection,
    relatedContainer,
    relatedItemTemplate,
    list,
    defaultCover,
    showRelated,
  } = options;

  if (!showRelated || !list || list.length === 0) {
    if (relatedSection) relatedSection.style.display = "none";
    return;
  }

  if (
    !relatedContainer ||
    !relatedItemTemplate ||
    !relatedItemTemplate.content
  ) {
    if (relatedSection) relatedSection.style.display = "none";
    return;
  }

  const templateRoot = relatedItemTemplate.content.firstElementChild;
  if (!templateRoot) {
    if (relatedSection) relatedSection.style.display = "none";
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const video of list) {
    const item = templateRoot.cloneNode(true);
    item.dataset.id = video.id || "";
    const img = item.querySelector("img");
    if (img) {
      const coverSrc =
        video.coverImage ||
        (video.youtubeId
          ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
          : defaultCover);
      img.src = coverSrc;
      img.alt = escapeHtml(video.title);
    }
    const titleEl = item.querySelector(".related-video-title");
    if (titleEl) titleEl.textContent = video.title || "";
    fragment.appendChild(item);
  }

  relatedContainer.innerHTML = "";
  relatedContainer.appendChild(fragment);
  if (relatedSection) relatedSection.style.display = "flex";
}
