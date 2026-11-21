(function () {
  "use strict";

  var SAVE_KEY = "LMTL_SAVE_V1";

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

  var THEMES = [
    { id: "deep", name: "深空" },
    { id: "abyss", name: "深渊" },
    { id: "ember", name: "余烬" },
    { id: "mono", name: "灰阶" }
  ];

  var SPEEDS = [
    { value: 0.5, name: "0.5×" },
    { value: 1, name: "1×" },
    { value: 1.5, name: "1.5×" },
    { value: 2, name: "2×" }
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
  var settings = { theme: "deep", newsSpeed: 1 };

  var sidebarEl = document.getElementById("sidebar");
  var resourcesEl = document.getElementById("resource-bar");
  var titleEl = document.getElementById("stage-title");
  var descEl = document.getElementById("stage-desc");
  var newsTextEl = document.getElementById("news-text");
  var newsTimeEl = document.getElementById("news-time");
  var stageCardEl = document.getElementById("stage-card");
  var settingsPanelEl = document.getElementById("settings-panel");
  var themeOptionsEl = document.getElementById("theme-options");
  var speedOptionsEl = document.getElementById("speed-options");
  var exportSaveEl = document.getElementById("export-save");
  var importSaveEl = document.getElementById("import-save");
  var importFileEl = document.getElementById("import-file");
  var saveHintEl = document.getElementById("save-hint");
  var storyPanelEl = document.getElementById("story-panel");
  var storySkipEl = document.getElementById("story-skip");
  var storyPortraitEl = document.getElementById("story-portrait");
  var storySpeakerEl = document.getElementById("story-speaker");
  var storyLineEl = document.getElementById("story-line");
  var storyProgressEl = document.getElementById("story-progress");
  var storyNextEl = document.getElementById("story-next");

  var activeStageId = "origin";
  var currentView = "stage";
  var newsQueue = [];
  var newsAnim = null;
  var newsTimeout = null;
  var lastNewsIndex = -1;
  var storyLines = null;
  var storyIndex = 0;
  var storyActive = false;
  var storyDone = null;
  var hintTimeout = null;

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
      setActiveStage(firstUnlockedId());
    });
    sidebarEl.appendChild(group);
    sidebarEl.appendChild(document.createElement("div")).className = "nav-sep";

    STAGES.forEach(function (stage) {
      if (!isUnlocked(stage.id)) return;
      var link = document.createElement("a");
      link.href = "javascript:void(0)";
      link.className = "nav-item nav-sub" + (currentView === "stage" && stage.id === activeStageId ? " active" : "");
      link.textContent = stage.tab;
      link.addEventListener("click", function () {
        setActiveStage(stage.id);
      });
      sidebarEl.appendChild(link);
    });

    sidebarEl.appendChild(document.createElement("div")).className = "nav-sep";
    var settingsLink = document.createElement("a");
    settingsLink.href = "javascript:void(0)";
    settingsLink.className = "nav-item" + (currentView === "settings" ? " active" : "");
    settingsLink.textContent = "设置";
    settingsLink.addEventListener("click", openSettings);
    sidebarEl.appendChild(settingsLink);
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

  function updateMainVisibility() {
    stageCardEl.hidden = currentView !== "stage";
    settingsPanelEl.hidden = currentView !== "settings";
  }

  function setActiveStage(id) {
    if (!isUnlocked(id)) return;
    var stage = STAGES.find(function (item) {
      return item.id === id;
    });
    if (!stage) return;

    activeStageId = id;
    currentView = "stage";
    renderSidebar();
    renderResources(stage);
    renderStage(stage);
    updateMainVisibility();
  }

  function openSettings() {
    currentView = "settings";
    renderSidebar();
    updateMainVisibility();
  }

  function renderSettings() {
    themeOptionsEl.innerHTML = "";
    THEMES.forEach(function (theme) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "setting-option" + (settings.theme === theme.id ? " active" : "");
      button.textContent = theme.name;
      button.addEventListener("click", function () {
        settings.theme = theme.id;
        applyTheme();
        saveState();
        renderSettings();
      });
      themeOptionsEl.appendChild(button);
    });

    speedOptionsEl.innerHTML = "";
    SPEEDS.forEach(function (speed) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "setting-option" + (settings.newsSpeed === speed.value ? " active" : "");
      button.textContent = speed.name;
      button.addEventListener("click", function () {
        settings.newsSpeed = speed.value;
        saveState();
        renderSettings();
        refreshNewsQueue();
      });
      speedOptionsEl.appendChild(button);
    });
  }

  function applyTheme() {
    document.body.setAttribute("data-theme", settings.theme);
  }

  function showHint(message) {
    saveHintEl.textContent = message;
    window.clearTimeout(hintTimeout);
    hintTimeout = window.setTimeout(function () {
      saveHintEl.textContent = "";
    }, 3000);
  }

  function buildSaveData() {
    return {
      version: 1,
      unlockedStages: Array.from(unlockedStages),
      activeStageId: activeStageId,
      settings: { theme: settings.theme, newsSpeed: settings.newsSpeed }
    };
  }

  function saveState() {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData()));
    } catch (error) {
      /* file:// 或隐私模式下存储不可用时静默跳过 */
    }
  }

  function applySaveData(data) {
    if (!data || typeof data !== "object") return false;
    if (data.settings && THEMES.some(function (theme) {
      return theme.id === data.settings.theme;
    })) {
      settings.theme = data.settings.theme;
    }
    if (data.settings && SPEEDS.some(function (speed) {
      return speed.value === data.settings.newsSpeed;
    })) {
      settings.newsSpeed = data.settings.newsSpeed;
    }
    if (Array.isArray(data.unlockedStages)) {
      data.unlockedStages.forEach(function (id) {
        if (STAGES.some(function (stage) { return stage.id === id; })) {
          unlockedStages.add(id);
        }
      });
    }
    if (isUnlocked(data.activeStageId)) {
      activeStageId = data.activeStageId;
    }
    return true;
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) applySaveData(JSON.parse(raw));
    } catch (error) {
      /* 存档损坏时忽略，使用默认设置 */
    }
    applyTheme();
  }

  function exportSave() {
    var text = JSON.stringify(buildSaveData(), null, 2);
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "LMTL-save.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    showHint("存档已导出为 LMTL-save.json");
  }

  function importSave(text) {
    try {
      var data = JSON.parse(text);
      if (!applySaveData(data)) throw new Error("invalid save");
      applyTheme();
      saveState();
      renderSidebar();
      renderSettings();
      renderResources(STAGES.find(function (stage) {
        return stage.id === activeStageId;
      }) || STAGES[0]);
      renderStage(STAGES.find(function (stage) {
        return stage.id === activeStageId;
      }) || STAGES[0]);
      refreshNewsQueue();
      showHint("存档已导入");
    } catch (error) {
      showHint("导入失败：文件格式不正确");
    }
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
    updateMainVisibility();
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
    settingsPanelEl.hidden = true;
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
          duration: Math.max(6000, (wrapWidth + textWidth) * 18) / settings.newsSpeed,
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
    saveState();
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

  exportSaveEl.addEventListener("click", exportSave);
  importSaveEl.addEventListener("click", function () {
    importFileEl.click();
  });
  importFileEl.addEventListener("change", function () {
    var file = importFileEl.files && importFileEl.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      importSave(String(reader.result));
    };
    reader.readAsText(file);
    importFileEl.value = "";
  });

  window.LMTL = {
    unlockStage: unlockStage,
    getUnlockedStages: function () {
      return Array.from(unlockedStages);
    },
    playStory: startStory,
    replayOpening: function () {
      startStory(OPENING_STORY);
    },
    openSettings: openSettings,
    exportSave: exportSave,
    importSave: importSave
  };

  loadState();
  renderSidebar();
  renderSettings();
  setActiveStage(activeStageId);
  refreshNewsQueue();
  updateClock();
  window.setInterval(updateClock, 30000);
  startStory(OPENING_STORY);
})();
