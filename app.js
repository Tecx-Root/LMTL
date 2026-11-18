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
    "混沌中出现了第一缕微光，Derterition 开始追寻自己的身世。",
    "第1章 · 源初：万物之始，数值成为最初的锚点。",
    "第1章 · 起步：缓步前行，碎片与时间晶体被发现。",
    "第2章 · 拓荒：开辟前路，遗迹的轮廓逐渐清晰。",
    "第3章 · 未定：更远处的变化仍不可见。"
  ];

  var RESOURCE_ORDER = ["数值", "碎片", "时间晶体", "遗迹"];

  var tabsEl = document.getElementById("tabs");
  var resourcesEl = document.getElementById("resource-bar");
  var eyebrowEl = document.getElementById("main-eyebrow");
  var titleEl = document.getElementById("main-title");
  var descEl = document.getElementById("main-desc");
  var newsTextEl = document.getElementById("news-text");
  var newsDotsEl = document.getElementById("news-dots");
  var newsTimeEl = document.getElementById("news-time");

  var activeStageId = STAGES[0].id;
  var newsIndex = 0;
  var newsTimer = null;

  function renderTabs() {
    tabsEl.innerHTML = "";
    STAGES.forEach(function (stage, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "tab" + (stage.id === activeStageId ? " active" : "");
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", stage.id === activeStageId ? "true" : "false");
      button.dataset.stageId = stage.id;
      button.innerHTML = '<span class="tab-index">' + String(index + 1).padStart(2, "0") + "</span>" + stage.tab;
      button.addEventListener("click", function () {
        setActiveStage(stage.id);
      });
      tabsEl.appendChild(button);
    });
  }

  function renderResources(stage) {
    resourcesEl.innerHTML = "";
    RESOURCE_ORDER.forEach(function (name) {
      var meta = RESOURCE_META[name];
      var unlocked = stage.resources.indexOf(name) !== -1;
      var card = document.createElement("article");
      card.className = "resource-card" + (unlocked ? "" : " locked");
      card.innerHTML =
        '<div class="res-head"><span class="res-name">' + name + '</span><span class="res-key">' + meta.key + "</span></div>" +
        '<div class="res-value">0</div>' +
        '<div class="res-note">' + (unlocked ? meta.note : "尚未解锁") + "</div>";
      resourcesEl.appendChild(card);
    });
  }

  function setActiveStage(id) {
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

  function showNews(index) {
    newsIndex = (index + NEWS.length) % NEWS.length;
    newsTextEl.classList.add("fading");
    window.setTimeout(function () {
      newsTextEl.textContent = NEWS[newsIndex];
      newsTextEl.classList.remove("fading");
    }, 220);
    Array.prototype.forEach.call(newsDotsEl.children, function (dot, i) {
      dot.classList.toggle("active", i === newsIndex);
    });
  }

  function renderNewsDots() {
    NEWS.forEach(function (_, index) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "news-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", "新闻 " + (index + 1));
      dot.addEventListener("click", function () {
        showNews(index);
        restartNewsTimer();
      });
      newsDotsEl.appendChild(dot);
    });
  }

  function restartNewsTimer() {
    window.clearInterval(newsTimer);
    newsTimer = window.setInterval(function () {
      showNews(newsIndex + 1);
    }, 6500);
  }

  function updateClock() {
    var now = new Date();
    newsTimeEl.textContent =
      String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  }

  renderTabs();
  renderNewsDots();
  setActiveStage(activeStageId);
  newsTextEl.textContent = NEWS[0];
  updateClock();
  restartNewsTimer();
  window.setInterval(updateClock, 30000);
})();
