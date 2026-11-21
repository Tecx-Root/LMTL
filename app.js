(function () {
  "use strict";

  var SAVE_KEY = "LMTL_SAVE_V1";
  var CIPHER_PREFIX = "LMTL1:";
  var CIPHER_KEY = "LMTL-sec-2026!";

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
  var stats = {
    playSeconds: 0,
    newsPlayed: 0,
    storyStarted: 0,
    storySkipped: 0,
    storyFinished: 0,
    saveExports: 0,
    saveImports: 0,
    saveLoads: 0
  };

  var sidebarEl = document.getElementById("sidebar");
  var resourcesEl = document.getElementById("resource-bar");
  var titleEl = document.getElementById("stage-title");
  var descEl = document.getElementById("stage-desc");
  var newsTextEl = document.getElementById("news-text");
  var newsTimeEl = document.getElementById("news-time");
  var stageCardEl = document.getElementById("stage-card");
  var settingsPanelEl = document.getElementById("settings-panel");
  var statsPanelEl = document.getElementById("stats-panel");
  var statsViewEl = document.getElementById("stats-view");
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
  var sessionSeconds = 0;

  function isUnlocked(id) {
    return unlockedStages.has(id);
  }

  function firstUnlockedId() {
    for (var i = 0; i < STAGES.length; i++) {
      if (isUnlocked(STAGES[i].id)) return STAGES[i].id;
    }
    return null;
  }

  function addNavItem(className, text, onClick) {
    var link = document.createElement("a");
    link.href = "javascript:void(0)";
    link.className = "nav-item " + className;
    link.textContent = text;
    if (onClick) link.addEventListener("click", onClick);
    sidebarEl.appendChild(link);
    return link;
  }

  function addNavSep() {
    sidebarEl.appendChild(document.createElement("div")).className = "nav-sep";
  }

  function renderSidebar() {
    sidebarEl.innerHTML = "";

    var stageGroup = addNavItem("nav-top", "阶段", function () {
      setActiveStage(firstUnlockedId());
    });
    stageGroup.classList.toggle("nav-active-group", currentView === "stage");
    addNavSep();

    STAGES.forEach(function (stage) {
      if (!isUnlocked(stage.id)) return;
      var active = currentView === "stage" && stage.id === activeStageId;
      var link = addNavItem("nav-sub" + (active ? " active" : ""), stage.tab, function () {
        setActiveStage(stage.id);
      });
      if (active) link.setAttribute("aria-current", "page");
    });

    addNavSep();
    var miscGroup = addNavItem("nav-top", "杂项");
    miscGroup.classList.toggle("nav-active-group", currentView === "settings" || currentView === "stats");
    addNavSep();

    addNavItem("nav-sub" + (currentView === "settings" ? " active" : ""), "设置", openSettings);
    addNavItem("nav-sub" + (currentView === "stats" ? " active" : ""), "统计", openStats);
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
    statsPanelEl.hidden = currentView !== "stats";
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

  function openStats() {
    currentView = "stats";
    renderSidebar();
    updateMainVisibility();
    renderStats();
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
        applyNewsSpeed();
      });
      speedOptionsEl.appendChild(button);
    });
  }

  function applyTheme() {
    document.body.setAttribute("data-theme", settings.theme);
  }

  function formatDuration(totalSeconds) {
    var s = Math.max(0, Math.floor(totalSeconds));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    return (h > 0 ? h + ":" : "") + pad(m) + ":" + pad(sec);
  }

  function statRow(label, value) {
    return '<div class="stat-row"><span class="stat-key">' + label + '</span><span class="stat-val">' + value + "</span></div>";
  }

  function renderStats() {
    var stage = STAGES.find(function (item) { return item.id === activeStageId; }) || STAGES[0];
    var theme = THEMES.find(function (item) { return item.id === settings.theme; }) || THEMES[0];
    var speed = SPEEDS.find(function (item) { return item.value === settings.newsSpeed; }) || SPEEDS[1];
    var resourceNames = Object.keys(RESOURCE_META);

    var html = "";
    html += '<div class="stats-group"><h3 class="stats-group-title">进度</h3>';
    html += statRow("已解锁阶段", unlockedStages.size + " / " + STAGES.length);
    html += statRow("当前阶段", stage.tab);
    html += statRow("当前章节", stage.chapter);
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">资源</h3>';
    resourceNames.forEach(function (name) {
      html += statRow(name, "0");
    });
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">时间</h3>';
    html += statRow("本次会话", formatDuration(sessionSeconds));
    html += statRow("累计游玩", formatDuration(stats.playSeconds));
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">剧情</h3>';
    html += statRow("已开始", stats.storyStarted + " 次");
    html += statRow("已读完", stats.storyFinished + " 次");
    html += statRow("已跳过", stats.storySkipped + " 次");
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">新闻</h3>';
    html += statRow("已播放", stats.newsPlayed + " 条");
    html += statRow("新闻列表", NEWS.length + " 条");
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">存档</h3>';
    html += statRow("导出次数", stats.saveExports + " 次");
    html += statRow("导入次数", stats.saveImports + " 次");
    html += statRow("读取次数", stats.saveLoads + " 次");
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">设置</h3>';
    html += statRow("颜色主题", theme.name);
    html += statRow("新闻速度", speed.name);
    html += "</div>";

    statsViewEl.innerHTML = html;
  }

  function tickStats() {
    if (document.visibilityState !== "visible") return;
    stats.playSeconds += 1;
    sessionSeconds += 1;
    if (currentView === "stats" && !statsPanelEl.hidden) renderStats();
  }

  function showHint(message) {
    saveHintEl.textContent = message;
    window.clearTimeout(hintTimeout);
    hintTimeout = window.setTimeout(function () {
      saveHintEl.textContent = "";
    }, 3000);
  }

  function xorWithKey(bytes) {
    var out = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length) ^ (i & 0xff);
    }
    return out;
  }

  function encryptText(text) {
    var bytes = new TextEncoder().encode(text);
    var cipher = xorWithKey(bytes);
    var binary = "";
    for (var i = 0; i < cipher.length; i++) binary += String.fromCharCode(cipher[i]);
    return CIPHER_PREFIX + btoa(binary);
  }

  function decryptText(cipher) {
    if (typeof cipher !== "string" || cipher.indexOf(CIPHER_PREFIX) !== 0) {
      return cipher;
    }
    var binary = atob(cipher.slice(CIPHER_PREFIX.length));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(xorWithKey(bytes));
  }

  function buildSaveData() {
    return {
      version: 2,
      unlockedStages: Array.from(unlockedStages),
      activeStageId: activeStageId,
      settings: { theme: settings.theme, newsSpeed: settings.newsSpeed },
      stats: {
        playSeconds: stats.playSeconds,
        newsPlayed: stats.newsPlayed,
        storyStarted: stats.storyStarted,
        storySkipped: stats.storySkipped,
        storyFinished: stats.storyFinished,
        saveExports: stats.saveExports,
        saveImports: stats.saveImports,
        saveLoads: stats.saveLoads
      }
    };
  }

  function saveState() {
    try {
      window.localStorage.setItem(SAVE_KEY, encryptText(JSON.stringify(buildSaveData())));
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
    if (data.stats && typeof data.stats === "object") {
      Object.keys(stats).forEach(function (key) {
        var value = data.stats[key];
        if (typeof value === "number" && isFinite(value) && value >= 0) {
          stats[key] = Math.floor(value);
        }
      });
    }
    return true;
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) {
        if (applySaveData(JSON.parse(decryptText(raw)))) stats.saveLoads += 1;
      }
    } catch (error) {
      /* 存档损坏时忽略，使用默认设置 */
    }
    applyTheme();
  }

  function exportSave() {
    var text = encryptText(JSON.stringify(buildSaveData(), null, 2));
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "LMTL-save.lmtl";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    stats.saveExports += 1;
    saveState();
    showHint("存档已加密导出为 LMTL-save.lmtl");
  }

  function importSave(text) {
    try {
      var data = JSON.parse(decryptText(text));
      if (!applySaveData(data)) throw new Error("invalid save");
      stats.saveImports += 1;
      applyTheme();
      saveState();
      renderSidebar();
      renderSettings();
      renderStats();
      renderResources(STAGES.find(function (stage) {
        return stage.id === activeStageId;
      }) || STAGES[0]);
      renderStage(STAGES.find(function (stage) {
        return stage.id === activeStageId;
      }) || STAGES[0]);
      refreshNewsQueue();
      showHint("加密存档已导入");
    } catch (error) {
      showHint("导入失败：文件格式不正确或无法解密");
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

  function endStory(skipped) {
    if (!storyActive) return;
    storyActive = false;
    storyPanelEl.hidden = true;
    updateMainVisibility();
    if (skipped) stats.storySkipped += 1;
    else stats.storyFinished += 1;
    saveState();
    var done = storyDone;
    storyDone = null;
    storyLines = null;
    if (done) done();
  }

  function advanceStory() {
    if (!storyActive) return;
    storyIndex++;
    if (storyIndex >= storyLines.length) {
      endStory(false);
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
    stats.storyStarted += 1;
    stageCardEl.hidden = true;
    settingsPanelEl.hidden = true;
    statsPanelEl.hidden = true;
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
    stats.newsPlayed += 1;
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
      newsAnim.playbackRate = settings.newsSpeed;

      newsAnim.onfinish = function () {
        newsTimeout = window.setTimeout(playNextNews, 300 / settings.newsSpeed);
      };
    });
  }

  function applyNewsSpeed() {
    if (newsAnim) newsAnim.playbackRate = settings.newsSpeed;
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
    endStory(true);
  });
  storyNextEl.addEventListener("click", advanceStory);
  document.addEventListener("keydown", function (event) {
    if (storyActive && event.key === "Escape") {
      endStory(true);
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
    openStats: openStats,
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
  statsInterval = window.setInterval(tickStats, 1000);
  window.setInterval(saveState, 30000);
  startStory(OPENING_STORY);
})();
