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
    "数值": { cls: "res-l0", note: "基础积累" },
    "碎片": { cls: "res-l1", note: "探索所得" },
    "时间晶体": { cls: "res-l2", note: "时间沉淀" },
    "遗迹": { cls: "res-l3", note: "远古遗留" }
  };

  var NEWS = [
    { stageId: null, text: "混沌中出现了第一缕微光，Derterition 开始追寻自己的身世。" },
    { stageId: "origin", text: "第1章 · 源初：万物之始，数值成为最初的锚点。" },
    { stageId: "start", text: "第1章 · 起步：缓步前行，碎片与时间晶体被发现。" },
    { stageId: "frontier", text: "第2章 · 拓荒：开辟前路，遗迹的轮廓逐渐清晰。" },
    { stageId: "unknown", text: "第3章 · 未定：更远处的变化仍不可见。" }
  ];

  var unlockedStages = new Set(["origin"]);

  var sidebarEl = document.getElementById("sidebar");
  var resourcesEl = document.getElementById("resource-bar");
  var titleEl = document.getElementById("stage-title");
  var descEl = document.getElementById("stage-desc");
  var coreValueEl = document.getElementById("core-value");
  var coreLabelEl = document.getElementById("core-label");
  var leftActionsEl = document.getElementById("stage-actions-left");
  var rightActionsEl = document.getElementById("stage-actions-right");
  var stageBtnEl = document.getElementById("stage-btn");
  var newsTextEl = document.getElementById("news-text");
  var newsTimeEl = document.getElementById("news-time");

  var activeStageId = "origin";
  var newsQueue = [];
  var newsCursor = 0;
  var newsAnim = null;
  var newsTimeout = null;

  function isUnlocked(id) {
    return unlockedStages.has(id);
  }

  function firstUnlockedId() {
    for (var i = 0; i < STAGES.length; i++) {
      if (isUnlocked(STAGES[i].id)) return STAGES[i].id;
    }
    return null;
  }

  function makeActionButton(text, enabled) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "action-btn";
    button.textContent = text;
    button.disabled = !enabled;
    if (!enabled) button.title = "尚未解锁";
    return button;
  }

  function renderSidebar() {
    sidebarEl.innerHTML = "";

    var group = document.createElement("a");
    group.href = "javascript:void(0)";
    group.className = "nav-item nav-top";
    group.textContent = "阶段";
    group.addEventListener("click", function () {
      var first = firstUnlockedId();
      if (first) setActiveStage(first);
    });
    sidebarEl.appendChild(group);
    sidebarEl.appendChild(document.createElement("div")).className = "nav-sep";

    STAGES.forEach(function (stage) {
      if (!isUnlocked(stage.id)) return;
      var link = document.createElement("a");
      link.href = "javascript:void(0)";
      link.className = "nav-item nav-sub" + (stage.id === activeStageId ? " active" : "");
      link.textContent = stage.tab;
      link.addEventListener("click", function () {
        setActiveStage(stage.id);
      });
      sidebarEl.appendChild(link);
    });
  }

  function renderResources(stage) {
    resourcesEl.innerHTML = "";
    stage.resources.forEach(function (name) {
      var meta = RESOURCE_META[name];
      var cell = document.createElement("div");
      cell.className = "res-cell " + meta.cls;
      cell.innerHTML =
        '<div class="res-name">' + name + "</div>" +
        '<div class="res-amount">0</div>' +
        '<div class="res-total">累计 0</div>' +
        '<div class="res-rate">+0/秒</div>';
      resourcesEl.appendChild(cell);
    });
  }

  function renderStage(stage) {
    var primary = stage.resources[0] || "未知";

    titleEl.textContent = stage.tab;
    descEl.textContent = stage.chapter + " · " + stage.title;
    coreValueEl.textContent = "0";
    coreLabelEl.textContent = primary;
    stageBtnEl.textContent = "积蓄" + (primary === "未知" ? "数值" : primary);

    leftActionsEl.innerHTML = "";
    leftActionsEl.appendChild(makeActionButton("积蓄", true));
    leftActionsEl.appendChild(makeActionButton("观察", true));

    rightActionsEl.innerHTML = "";
    rightActionsEl.appendChild(makeActionButton("锁定", false));
    rightActionsEl.appendChild(makeActionButton("锁定", false));
  }

  function setActiveStage(id) {
    if (!isUnlocked(id)) return;
    var stage = STAGES.find(function (item) {
      return item.id === id;
    });
    if (!stage) return;

    activeStageId = id;
    renderSidebar();
    renderResources(stage);
    renderStage(stage);
  }

  function stopNews() {
    window.clearTimeout(newsTimeout);
    newsTimeout = null;
    if (newsAnim) {
      newsAnim.cancel();
      newsAnim = null;
    }
    newsTextEl.textContent = "";
  }

  function playNextNews() {
    if (!newsQueue.length) return;
    stopNews();

    newsTextEl.textContent = newsQueue[newsCursor].text;
    window.requestAnimationFrame(function () {
      var wrap = newsTextEl.parentElement;
      var wrapWidth = wrap.clientWidth;
      var textWidth = newsTextEl.offsetWidth;

      newsAnim = newsTextEl.animate(
        [
          { transform: "translateX(" + wrapWidth + "px)" },
          { transform: "translateX(" + -textWidth + "px)" }
        ],
        {
          duration: Math.max(6000, (wrapWidth + textWidth) * 18),
          iterations: 1,
          easing: "linear"
        }
      );

      newsAnim.onfinish = function () {
        newsCursor = (newsCursor + 1) % newsQueue.length;
        newsTimeout = window.setTimeout(playNextNews, 300);
      };
    });
  }

  function refreshNewsQueue() {
    stopNews();
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
    renderSidebar();
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

  setActiveStage(activeStageId);
  refreshNewsQueue();
  updateClock();
  window.setInterval(updateClock, 30000);
})();
