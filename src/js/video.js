const API_LIST_URL =
  "https://mock.apidog.com/m1/1222159-1218189-default/api/libraryVideo/getVideoList";

async function loadVideoList() {
  const container = document.getElementById("video-list-container");
  const templateEl = document.getElementById("video-item-template");

  if (!container || !templateEl) {
    console.error("找不到影片列表容器或模板");
    return;
  }

  try {
    const response = await fetch(API_LIST_URL);
    if (!response.ok) throw new Error("無法載入影片列表");

    const result = await response.json();
    if (!result.status || !result.list || result.list.length === 0) {
      container.innerHTML = '<p class="no-data">暫無影音資料</p>';
      return;
    }

    const list = result.list;

    const ytThumb = (v) =>
      v.youtubeId
        ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`
        : "";
    const videos = list.map((v) => ({
      ...v,
      coverImage: v.coverImage || ytThumb(v),
    }));

    const template = Handlebars.compile(templateEl.innerHTML);
    container.innerHTML = template({ videos });

    bindVideoItemClicks(container);
    console.log(`成功載入 ${list.length} 筆影片`);
  } catch (error) {
    console.error("載入影片列表時發生錯誤:", error);
    container.innerHTML =
      '<p class="no-data">無法載入影音資料，請稍後再試。</p>';
  }
}

function bindVideoItemClicks(container) {
  if (!container) return;
  container.addEventListener("click", (e) => {
    const item = e.target.closest(".video-item");
    if (!item) return;
    const id = item.dataset.id;
    if (!id) return;
    const modal = document.querySelector("youtube-modal");
    if (modal && typeof modal.openWithAPI === "function") {
      modal.openWithAPI(id);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadVideoList);
