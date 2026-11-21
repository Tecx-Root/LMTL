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
    "这是新闻列表里的第一条新闻",
    "刚刚那条新闻是假的",
    "下一条新闻绝对是真的",
    "这是一句假话",
    "1 + 1 = ( 系统未响应 )",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  ];

  var OPENING_STORY = [
    { speaker: "旁白", text: "混沌初开" },
    { speaker: "旁白", text: "Derterition从昏迷中苏醒" },
    { speaker: "Derterition", text: "......" },
    { speaker: "Derterition", text: "这是哪里？" },
    { speaker: "Derterition", text: "我怎么什么也想不起来了" },
    { speaker: "Derterition", text: "我该去往何方？" },
    { speaker: "旁白", text: "Derterition看到了一束微光" },
    { speaker: "Derterition", text: "那是我的目标吗" },
    { speaker: "旁白", text: "Derterition向微光移去" }
  ];

  var unlockedStages = new Set(["origin"]);

  var sidebarEl = document.getElementById("sidebar");
  var resourcesEl = document.getElementById("resource-bar");
  var titleEl = document.getElementById("stage-title");
  var descEl = document.getElementById("stage-desc");
  var newsTextEl = document.getElementById("news-text");
  var newsTimeEl = document.getElementById("news-time");
  var stageCardEl = document.getElementById("stage-card");
  var storyPanelEl = document.getElementById("story-panel");
  var storySkipEl = document.getElementById("story-skip");
  var storyPortraitEl = document.getElementById("story-portrait");
  var storySpeakerEl = document.getElementById("story-speaker");
  var storyLineEl = document.getElementById("story-line");
  var storyProgressEl = document.getElementById("story-progress");
  var storyNextEl = document.getElementById("story-next");

  var activeStageId = "origin";
  var newsQueue = [];
  var newsAnim = null;
  var newsTimeout = null;
  var lastNewsIndex = -1;
  var storyLines = null;
  var storyIndex = 0;
  var storyActive = false;
  var storyDone = null;

  function isUnlocked(id) {
    return unlockedStages.has(id);
  }

  function firstUnlockedId() {
    for (var i = 0; i < STAGES.length; i++) {
      if (isUnlocked(STAGES[i].id)) return STAGES[i].id;
    }
    return null;
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
    titleEl.textContent = stage.tab;
    descEl.textContent = stage.chapter + " · " + stage.title;
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

  function renderStoryLine() {
    var line = storyLines[storyIndex];
    var narration = line.speaker === "旁白";
    storySpeakerEl.textContent = narration ? "" : line.speaker;
    storyLineEl.textContent = line.text;
    storyProgressEl.textContent = storyIndex + 1 + " / " + storyLines.length;
    storyPortraitEl.hidden = narration;
    storyPanelEl.classList.toggle("is-narration", narration);
  }

  function endStory() {
    if (!storyActive) return;
    storyActive = false;
    storyPanelEl.hidden = true;
    stageCardEl.hidden = false;
    var done = storyDone;
    storyDone = null;
    storyLines = null;
    if (done) done();
  }

  function advanceStory() {
    if (!storyActive) return;
    storyIndex++;
    if (storyIndex >= storyLines.length) {
      endStory();
      return;
    }
    renderStoryLine();
  }

  function startStory(lines, done) {
    if (!lines || !lines.length) return;
    storyLines = lines;
    storyIndex = 0;
    storyDone = done || null;
    storyActive = true;
    stageCardEl.hidden = true;
    storyPanelEl.hidden = false;
    renderStoryLine();
    storyNextEl.focus();
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

  function pickNewsIndex() {
    if (newsQueue.length <= 1) return 0;
    var index = Math.floor(Math.random() * newsQueue.length);
    if (index === lastNewsIndex) index = (index + 1) % newsQueue.length;
    lastNewsIndex = index;
    return index;
  }

  function playNextNews() {
    if (!newsQueue.length) return;
    stopNews();

    newsTextEl.textContent = newsQueue[pickNewsIndex()];
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
        newsTimeout = window.setTimeout(playNextNews, 300);
      };
    });
  }

  function refreshNewsQueue() {
    stopNews();
    newsQueue = NEWS.slice();
    lastNewsIndex = -1;
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

  storySkipEl.addEventListener("click", function (event) {
    event.stopPropagation();
    endStory();
  });
  storyNextEl.addEventListener("click", advanceStory);
  document.addEventListener("keydown", function (event) {
    if (storyActive && event.key === "Escape") {
      endStory();
    }
  });

  window.LMTL = {
    unlockStage: unlockStage,
    getUnlockedStages: function () {
      return Array.from(unlockedStages);
    },
    playStory: startStory,
    replayOpening: function () {
      startStory(OPENING_STORY);
    }
  };

  setActiveStage(activeStageId);
  refreshNewsQueue();
  updateClock();
  window.setInterval(updateClock, 30000);
  startStory(OPENING_STORY);
})();
