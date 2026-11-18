(function () {
  "use strict";

  var STAGES = [
    {
      id: "origin",
      chapter: "第1章",
      tab: "源初",
      title: "源初（万物之始）",
      desc: "万物之始。混沌尚未散去，数值是最初的锚点。",
      resources: ["数值"]
    },
    {
      id: "start",
      chapter: "第1章",
      tab: "起步",
      title: "起步（缓步前行）",
      desc: "缓步前行。碎片与时间晶体开始显现。",
      resources: ["数值", "碎片", "时间晶体"]
    },
    {
      id: "frontier",
      chapter: "第2章",
      tab: "拓荒",
      title: "拓荒（开辟前路）",
      desc: "开辟前路。遗迹的轮廓在迷雾中浮现。",
      resources: ["数值", "碎片", "时间晶体", "遗迹"]
    },
    {
      id: "unknown",
      chapter: "第3章",
      tab: "未定",
      title: "未定",
      desc: "尚未定义。新的资源与机制仍不可见。",
      resources: []
    }
  ];

  var RESOURCE_META = {
    "数值": { key: "VALUE", note: "基础积累" },
    "碎片": { key: "SHARD", note: "探索所得" },
    "时间晶体": { key: "CHRONO", note: "时间沉淀" },
    "遗迹": { key: "RELIC", note: "远古遗留" }
  };

  var NEWS = [
    { stageId: null, text: "混沌中出现了第一缕微光，Derterition 开始追寻自己的身世。" },
    { stageId: "origin", text: "第1章 · 源初：万物之始，数值成为最初的锚点。" },
    { stageId: "start", text: "第1章 · 起步：缓步前行，碎片与时间晶体被发现。" },
    { stageId: "frontier", text: "第2章 · 拓荒：开辟前路，遗迹的轮廓逐渐清晰。" },
    { stageId: "unknown", text: "第3章 · 未定：更远处的变化仍不可见。" }
  ];

  var unlockedStages = new Set(["origin"]);

  var tabsEl = document.getElementById("tabs");
  var resourcesEl = document.getElementById("resource-bar");
  var eyebrowEl = document.getElementById("main-eyebrow");
  var titleEl = document.getElementById("main-title");
  var descEl = document.getElementById("main-desc");
  var newsViewportEl = document.getElementById("news-viewport");
  var newsTimeEl = document.getElementById("news-time");

  var activeStageId = "origin";
  var newsQueue = [];
  var newsCursor = 0;
  var newsItem = null;
  var newsTimeout = null;

  function isUnlocked(id) {
    return unlockedStages.has(id);
  }

  function renderTabs() {
    tabsEl.innerHTML = "";
    STAGES.forEach(function (stage, index) {
      if (!isUnlocked(stage.id)) return;

      var button = document.createElement("button");
      button.type = "button";
      button.className = "tab" + (stage.id === activeStageId ? " active" : "");
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", stage.id === activeStageId ? "true" : "false");
      button.title = stage.title;
      button.dataset.stageId = stage.id;
      button.innerHTML =
        '<span class="tab-index">' +
        String(index + 1).padStart(2, "0") +
        "</span>" +
        stage.tab;
      button.addEventListener("click", function () {
        setActiveStage(stage.id);
      });
      tabsEl.appendChild(button);
    });
  }

  function renderResources(stage) {
    resourcesEl.innerHTML = "";
    stage.resources.forEach(function (name) {
      var meta = RESOURCE_META[name];
      var card = document.createElement("article");
      card.className = "resource-card";
      card.innerHTML =
        '<div class="res-head"><span class="res-name">' +
        name +
        '</span><span class="res-key">' +
        meta.key +
        "</span></div>" +
        '<div class="res-value">0</div>' +
        '<div class="res-note">' +
        meta.note +
        "</div>";
      resourcesEl.appendChild(card);
    });
  }

  function setActiveStage(id) {
    if (!isUnlocked(id)) return;
    var stage = STAGES.find(function (item) {
      return item.id === id;
    });
    if (!stage) return;

    activeStageId = id;
    Array.prototype.forEach.call(tabsEl.querySelectorAll(".tab"), function (tab) {
      var isActive = tab.dataset.stageId === id;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    eyebrowEl.textContent = stage.chapter + " · 当前阶段";
    titleEl.textContent = stage.title;
    descEl.textContent = stage.desc;
    renderResources(stage);
  }

  function stopCurrentNews() {
    window.clearTimeout(newsTimeout);
    newsTimeout = null;
    if (newsItem) {
      newsItem.remove();
      newsItem = null;
    }
  }

  function playNextNews() {
    if (!newsQueue.length) return;
    stopCurrentNews();

    var entry = newsQueue[newsCursor];
    var item = document.createElement("span");
    item.className = "news-item";
    item.textContent = entry.text;
    newsViewportEl.appendChild(item);

    var viewportWidth = newsViewportEl.clientWidth;
    var itemWidth = item.offsetWidth;
    var duration = Math.max(6000, Math.round((viewportWidth + itemWidth) / 0.11));

    item.style.setProperty("--start", viewportWidth + "px");
    item.style.setProperty("--end", "-" + itemWidth + "px");
    item.style.setProperty("--duration", duration + "ms");

    newsItem = item;
    window.requestAnimationFrame(function () {
      item.classList.add("scrolling");
    });

    item.addEventListener("animationend", function () {
      if (newsItem !== item) return;
      item.remove();
      newsItem = null;
      newsCursor = (newsCursor + 1) % newsQueue.length;
      newsTimeout = window.setTimeout(playNextNews, 400);
    });
  }

  function refreshNewsQueue() {
    stopCurrentNews();
    newsQueue = NEWS.filter(function (entry) {
      return entry.stageId === null || isUnlocked(entry.stageId);
    });
    newsCursor = 0;
    playNextNews();
  }

  function unlockStage(id) {
    var exists = STAGES.some(function (stage) {
      return stage.id === id;
    });
    if (!exists || isUnlocked(id)) return false;

    unlockedStages.add(id);
    renderTabs();
    refreshNewsQueue();
    return true;
  }

  function updateClock() {
    var now = new Date();
    newsTimeEl.textContent =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");
  }

  window.LMTL = {
    unlockStage: unlockStage,
    getUnlockedStages: function () {
      return Array.from(unlockedStages);
    }
  };

  renderTabs();
  setActiveStage(activeStageId);
  refreshNewsQueue();
  updateClock();
  window.setInterval(updateClock, 30000);
})();
