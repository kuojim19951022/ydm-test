// HTML 轉義（防止 XSS）
export function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// 解析 HTML 布林屬性（如 show-related）
export function getBooleanAttribute(element, name, fallback) {
  if (!element.hasAttribute(name)) return fallback;
  const value = element.getAttribute(name);
  if (value === null || value === "") return true;
  return !/^(false|0|no|off)$/i.test(value.trim());
}

// 取得播放器類型（屬性優先，否則 config 預設值）
export function getPlayerType(element, validTypes, configDefault) {
  const attrValue = element.getAttribute("player-type");
  if (attrValue && validTypes.includes(attrValue)) return attrValue;
  return configDefault || "lite-youtube";
}

// 清空 modal 標題、描述、播放器、相關影片區塊
export function clearModalContent(elements) {
  const {
    title,
    description,
    iframeContainer,
    relatedContainer,
    relatedSection,
  } = elements;
  if (title) {
    title.textContent = "";
    title.style.display = "";
  }
  if (description) {
    description.textContent = "";
    description.style.display = "none";
  }
  if (iframeContainer) iframeContainer.innerHTML = "";
  if (relatedContainer) relatedContainer.innerHTML = "";
  if (relatedSection) relatedSection.style.display = "none";
}
