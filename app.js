(function () {
  "use strict";

  var BN = window.LMTLBigNumber;
  var SAVE_KEY = "LMTL_SAVE_V1";
  var CIPHER_PREFIX = "LMTL1:";
  var CIPHER_KEY = "LMTL-sec-2026!";

  var STAGES = [
    {
      id: "origin",
      chapter: "第1章",
      tab: "数值",
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

  /*
   * 源初数值系统（数值平衡依据，2026-11-22 模拟验证）
   * 成本 = ceil(base × coeff^level)，购买项仅可购买一次。
   * 点击 = (1 + 凝聚 + 3×锐化 + 2×火花) × (1 + 0.5×聚能 + 0.5×棱镜) × 全局倍率
   * 自动 = (涌流 + 3×湍流 + 回路) × (1 + 0.5×共鸣 + 0.5×时序钟) × 全局倍率
   * 全局倍率 = 1 + 0.2×源火 + 0.5×奇点锚，倍率全部线性叠加，避免指数爆炸。
   * 模拟（5 次点击/秒，优先购买回本最短项）：累计 1万约 1.6 分钟，
   * 10万约 4.9 分钟，100万约 17.7 分钟，30分钟约 244 万，无数量级硬墙。
   */
  var UPGRADES = [
    { id: "tap",       name: "凝聚", desc: "点击基数 +1",             base: 15,    coeff: 1.35 },
    { id: "auto",      name: "涌流", desc: "自动基数 +1/秒",          base: 100,   coeff: 1.5 },
    { id: "tapm",      name: "聚能", desc: "点击倍率 +50%（线性）",   base: 200,   coeff: 2.2 },
    { id: "autom",     name: "共鸣", desc: "自动倍率 +50%（线性）",   base: 500,   coeff: 2.2 },
    { id: "sharp",     name: "锐化", desc: "点击基数 +3",             base: 1500,  coeff: 3.0 },
    { id: "turb",      name: "湍流", desc: "自动基数 +3/秒",          base: 5000,  coeff: 3.0 },
    { id: "resonance", name: "源火", desc: "全局收益 +20%（线性）",   base: 50000, coeff: 4.0 }
  ];

  var PURCHASES = [
    { id: "spark",  name: "火花",   desc: "点击基数 +2",   cost: 600 },
    { id: "loop",   name: "回路",   desc: "自动基数 +1/秒", cost: 2000 },
    { id: "lens",   name: "棱镜",   desc: "点击倍率 +50%",  cost: 10000 },
    { id: "clock",  name: "时序钟", desc: "自动倍率 +50%",  cost: 40000 },
    { id: "anchor", name: "奇点锚", desc: "全局收益 +50%",  cost: 300000 }
  ];

  // B = 可重复购买的升级，U = 仅可购买一次的项目
  function itemCode(prefix, index) {
    return prefix + "A0-" + (index + 1);
  }

  function upgradeCode(index) {
    return itemCode("B", index);
  }

  function purchaseCode(index) {
    return itemCode("U", index);
  }

  // 密钥按键位偏移编码，源码中不保存明文
  var DEV_KEY = [83, 121, 99, 35, 42, 35, 88, 79, 120].map(function (code, index) {
    return String.fromCharCode(code ^ (7 + index * 3));
  }).join("");

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
  var settings = { theme: "deep", newsSpeed: 1, devMode: false };
  var devLock = { failures: 0, until: 0 };
  var stats = {
    playSeconds: 0,
    newsPlayed: 0,
    storyStarted: 0,
    storySkipped: 0,
    storyFinished: 0,
    saveExports: 0,
    saveImports: 0,
    saveLoads: 0,
    totalClicks: 0,
    totalPurchases: 0,
    peakValue: BN.from(0)
  };
  var numeric = {
    value: BN.from(0),
    total: BN.from(0),
    levels: { tap: 0, auto: 0, tapm: 0, autom: 0, sharp: 0, turb: 0, resonance: 0 },
    purchased: new Set()
  };
  var valueEls = {};
  var purchaseEls = {};

  var sidebarEl = document.getElementById("sidebar");
  var resourcesEl = document.getElementById("resource-bar");
  var titleEl = document.getElementById("stage-title");
  var descEl = document.getElementById("stage-desc");
  var valueCoreWrapEl = document.getElementById("value-core-wrap");
  var valueAmountEl = document.getElementById("value-amount");
  var valueRateEl = document.getElementById("value-rate");
  var perClickEl = document.getElementById("per-click");
  var upgradeGridEl = document.getElementById("upgrade-grid");
  var purchaseGridEl = document.getElementById("purchase-grid");
  var devKeyInputEl = document.getElementById("dev-key-input");
  var devUnlockEl = document.getElementById("dev-unlock");
  var devPanelEl = document.getElementById("dev-panel");
  var devReadoutEl = document.getElementById("dev-readout");
  var devHintEl = document.getElementById("dev-hint");
  var devValueInputEl = document.getElementById("dev-value-input");
  var devLevelInputEl = document.getElementById("dev-level-input");
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

    var stageGroup = addNavItem("nav-top", "源初", function () {
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
      cell.dataset.resKey = name;
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
    valueCoreWrapEl.hidden = stage.id !== "origin";
  }

  function formatNumber(value) {
    var n = BN.from(value);
    if (!n.isFinite()) return n.m > 0 ? "∞" : "-∞";
    if (n.isZero()) return "0";
    if (n.e >= 3 || n.e <= -7) return n.toScientific(2);
    var v = n.toNumber();
    if (v < 10) return (Math.round(v * 10) / 10).toString();
    return Math.floor(v).toString();
  }

  function upgradeCost(definition) {
    var level = numeric.levels[definition.id];
    return BN.from(definition.base).mul(BN.from(definition.coeff).powInt(level)).ceil();
  }

  function hasPurchase(id) {
    return numeric.purchased.has(id) ? 1 : 0;
  }

  function globalMultiplier() {
    return BN.from(1 + 0.2 * numeric.levels.resonance + 0.5 * hasPurchase("anchor"));
  }

  function clickGain() {
    var base = 1 + numeric.levels.tap + 3 * numeric.levels.sharp + 2 * hasPurchase("spark");
    var mult = 1 + 0.5 * numeric.levels.tapm + 0.5 * hasPurchase("lens");
    return BN.from(base).mul(BN.from(mult)).mul(globalMultiplier());
  }

  function autoRate() {
    var base = numeric.levels.auto + 3 * numeric.levels.turb + hasPurchase("loop");
    var mult = 1 + 0.5 * numeric.levels.autom + 0.5 * hasPurchase("clock");
    return BN.from(base).mul(BN.from(mult)).mul(globalMultiplier());
  }

  function gainValue(amount) {
    var delta = BN.from(amount);
    numeric.value = numeric.value.add(delta);
    numeric.total = numeric.total.add(delta);
    if (numeric.value.gt(stats.peakValue)) stats.peakValue = numeric.value;
    updateValueUI();
  }

  function updateValueUI() {
    valueAmountEl.textContent = formatNumber(numeric.value);
    valueRateEl.textContent = "+" + formatNumber(autoRate()) + "/秒";
    perClickEl.textContent = "+" + formatNumber(clickGain()) + " / 点击";
    var cell = resourcesEl.querySelector('[data-res-key="数值"]');
    if (cell) {
      cell.querySelector(".res-amount").textContent = formatNumber(numeric.value);
      cell.querySelector(".res-total").textContent = "累计 " + formatNumber(numeric.total);
      cell.querySelector(".res-rate").textContent = "+" + formatNumber(autoRate()) + "/秒";
    }
    if (currentView === "stats" && statsPanelEl.hidden === false) renderStats();
  }

  function renderUpgrades() {
    upgradeGridEl.innerHTML = "";
    UPGRADES.forEach(function (definition, index) {
      var level = numeric.levels[definition.id];
      var cost = upgradeCost(definition);
      var affordable = numeric.value.gte(cost);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "upgrade-card" + (affordable ? " affordable" : "");
      card.dataset.upgradeId = definition.id;
      card.disabled = !affordable;
      card.innerHTML =
        '<span class="upgrade-name"><span class="item-code">' + upgradeCode(index) + "</span> · " + definition.name + "</span>" +
        '<span class="upgrade-level">Lv.' + level + "</span>" +
        '<span class="upgrade-desc">' + definition.desc + "</span>" +
        '<span class="upgrade-cost">' + formatNumber(cost) + " 数值</span>";
      card.addEventListener("click", function () {
        buyUpgrade(definition.id);
      });
      upgradeGridEl.appendChild(card);
      valueEls[definition.id] = card;
    });
  }

  function renderPurchases() {
    purchaseGridEl.innerHTML = "";
    PURCHASES.forEach(function (definition, index) {
      var owned = hasPurchase(definition.id);
      var cost = BN.from(definition.cost);
      var affordable = !owned && numeric.value.gte(cost);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "purchase-card" + (affordable ? " affordable" : "");
      card.dataset.purchaseId = definition.id;
      card.disabled = owned || !affordable;
      card.innerHTML =
        '<span class="upgrade-name"><span class="item-code">' + purchaseCode(index) + "</span> · " + definition.name + "</span>" +
        '<span class="upgrade-level' + (owned ? " purchase-owned" : "") + '">' + (owned ? "已购买" : "未购买") + "</span>" +
        '<span class="upgrade-desc">' + definition.desc + "</span>" +
        '<span class="upgrade-cost">' + (owned ? "已获得" : formatNumber(cost) + " 数值") + "</span>";
      if (!owned) {
        card.addEventListener("click", function () {
          buyPurchase(definition.id);
        });
      }
      purchaseGridEl.appendChild(card);
      purchaseEls[definition.id] = card;
    });
  }

  function refreshUpgradeAffordability() {
    UPGRADES.forEach(function (definition) {
      var card = valueEls[definition.id];
      if (!card) return;
      var cost = upgradeCost(definition);
      var affordable = numeric.value.gte(cost);
      if (card.classList.contains("affordable") !== affordable) {
        card.classList.toggle("affordable", affordable);
        card.disabled = !affordable;
      }
    });
    PURCHASES.forEach(function (definition) {
      if (hasPurchase(definition.id)) return;
      var card = purchaseEls[definition.id];
      if (!card) return;
      var affordable = numeric.value.gte(BN.from(definition.cost));
      if (card.classList.contains("affordable") !== affordable) {
        card.classList.toggle("affordable", affordable);
        card.disabled = !affordable;
      }
    });
  }

  function buyPurchase(id) {
    var definition = PURCHASES.find(function (item) { return item.id === id; });
    if (!definition || hasPurchase(id)) return false;
    var cost = BN.from(definition.cost);
    if (numeric.value.lt(cost)) return false;
    numeric.value = numeric.value.sub(cost);
    numeric.purchased.add(id);
    stats.totalPurchases += 1;
    renderPurchases();
    updateValueUI();
    refreshUpgradeAffordability();
    saveState();
    return true;
  }

  function buyUpgrade(id) {
    var definition = UPGRADES.find(function (item) { return item.id === id; });
    if (!definition) return false;
    var cost = upgradeCost(definition);
    if (numeric.value.lt(cost)) return false;
    numeric.value = numeric.value.sub(cost);
    numeric.levels[id] += 1;
    stats.totalPurchases += 1;
    renderUpgrades();
    updateValueUI();
    refreshUpgradeAffordability();
    saveState();
    return true;
  }

  function spawnFloat(text, event) {
    var floatEl = document.createElement("span");
    floatEl.className = "value-float";
    floatEl.textContent = text;
    var box = valueCoreWrapEl.getBoundingClientRect();
    var x = event && event.clientX ? event.clientX - box.left : box.width / 2;
    var y = event && event.clientY ? event.clientY - box.top : box.height / 2;
    floatEl.style.left = x + "px";
    floatEl.style.top = y + "px";
    valueCoreWrapEl.appendChild(floatEl);
    var animation = floatEl.animate(
      [
        { transform: "translate(-50%, 0)", opacity: 1 },
        { transform: "translate(-50%, -60px)", opacity: 0 }
      ],
      { duration: 800, easing: "ease-out" }
    );
    animation.onfinish = function () {
      if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
    };
  }

  var lastTick = Date.now();
  function gameTick() {
    var now = Date.now();
    var dt = Math.max(0, Math.min((now - lastTick) / 1000, 1));
    lastTick = now;
    var rate = autoRate();
    if (rate.gt(0) && dt > 0) gainValue(rate.mul(dt));
    refreshUpgradeAffordability();
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

    devPanelEl.hidden = !settings.devMode;
    devUnlockEl.textContent = settings.devMode ? "已开启" : "解锁";
    devKeyInputEl.value = "";
    updateDevLockUI();
    if (settings.devMode) renderDevReadout();
  }

  function devLockRemaining() {
    return Math.max(0, devLock.until - Date.now());
  }

  function formatLockCountdown(ms) {
    var total = Math.ceil(ms / 1000);
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function updateDevLockUI() {
    if (settings.devMode) {
      devHintEl.textContent = "开发者模式已开启";
      devKeyInputEl.disabled = true;
      devUnlockEl.disabled = true;
      return;
    }
    var remaining = devLockRemaining();
    if (remaining > 0) {
      devKeyInputEl.disabled = true;
      devUnlockEl.disabled = true;
      devHintEl.textContent = "输入错误次数过多，" + formatLockCountdown(remaining) + " 后可重试";
      return;
    }
    devKeyInputEl.disabled = false;
    devUnlockEl.disabled = false;
    devHintEl.textContent = devLock.failures > 0 ? "剩余尝试次数：" + (5 - devLock.failures) : "";
  }

  function renderDevReadout() {
    if (!settings.devMode) return;
    var levels = UPGRADES.map(function (definition) {
      return definition.name + " " + numeric.levels[definition.id];
    }).join(" / ");
    var owned = PURCHASES.filter(function (definition) {
      return hasPurchase(definition.id);
    }).map(function (definition) { return definition.name; }).join(" / ") || "无";
    devReadoutEl.textContent =
      "数值: " + numeric.value.toScientific() + " (" + formatNumber(numeric.value) + ")\n" +
      "累计: " + numeric.total.toScientific() + "\n" +
      "峰值: " + stats.peakValue.toScientific() + "\n" +
      "点击: " + clickGain().toScientific() + "\n" +
      "自动: " + autoRate().toScientific() + "\n" +
      "全局倍率: " + globalMultiplier().toScientific() + "\n" +
      "升级: " + levels + "\n" +
      "购买项: " + owned;
  }

  function setDevMode(on) {
    settings.devMode = !!on;
    devPanelEl.hidden = !settings.devMode;
    devUnlockEl.textContent = settings.devMode ? "已开启" : "解锁";
    devKeyInputEl.value = "";
    updateDevLockUI();
    if (settings.devMode) renderDevReadout();
    saveState();
  }

  function runDevAction(action) {
    if (!settings.devMode) return;
    var devGrants = { gain1e3: "1e3", gain1e6: "1e6", gain1e300: "1e300" };
    if (devGrants[action]) {
      gainValue(BN.from(devGrants[action]));
    } else if (action === "setValue") {
      var target = BN.from(String(devValueInputEl.value).trim());
      if (!target.isFinite() || target.lt(0)) {
        showHint("请输入有效的非负数");
        return;
      }
      numeric.value = target;
      if (numeric.total.lt(target)) numeric.total = target;
      if (stats.peakValue.lt(target)) stats.peakValue = target;
      devValueInputEl.value = "";
      updateValueUI();
    } else if (action === "setLevels") {
      var level = Math.floor(Number(devLevelInputEl.value));
      if (!isFinite(level) || level < 0) {
        showHint("请输入有效的等级");
        return;
      }
      if (level > 1000000) level = 1000000;
      UPGRADES.forEach(function (definition) { numeric.levels[definition.id] = level; });
      devLevelInputEl.value = "";
      renderUpgrades();
      updateValueUI();
    } else if (action === "levels") {
      UPGRADES.forEach(function (definition) { numeric.levels[definition.id] += 10; });
      renderUpgrades();
      updateValueUI();
    } else if (action === "buyAll") {
      PURCHASES.forEach(function (definition) {
        if (!hasPurchase(definition.id)) {
          numeric.purchased.add(definition.id);
          stats.totalPurchases += 1;
        }
      });
      renderPurchases();
      updateValueUI();
    } else if (action === "resetValue") {
      numeric.value = BN.from(0);
      updateValueUI();
    } else if (action === "replayStory") {
      startStory(OPENING_STORY);
    } else if (action === "unlock") {
      STAGES.forEach(function (stage) { unlockedStages.add(stage.id); });
      renderSidebar();
    } else if (action === "readout") {
      renderDevReadout();
      return;
    } else if (action === "close") {
      setDevMode(false);
      showHint("开发者模式已关闭");
      return;
    }
    refreshUpgradeAffordability();
    renderDevReadout();
    saveState();
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

    html += '<div class="stats-group"><h3 class="stats-group-title">数值</h3>';
    html += statRow("当前", formatNumber(numeric.value));
    html += statRow("累计产出", formatNumber(numeric.total));
    html += statRow("历史峰值", formatNumber(stats.peakValue));
    html += statRow("点击收益", formatNumber(clickGain()) + " / 次");
    html += statRow("自动产出", formatNumber(autoRate()) + " / 秒");
    html += statRow("全局倍率", "×" + formatNumber(globalMultiplier()));
    html += statRow("累计点击", stats.totalClicks + " 次");
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">升级</h3>';
    UPGRADES.forEach(function (definition, index) {
      html += statRow(upgradeCode(index) + " · " + definition.name + " Lv." + numeric.levels[definition.id], formatNumber(upgradeCost(definition)) + " 下次");
    });
    html += statRow("购买总数", stats.totalPurchases + " 次");
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">购买项</h3>';
    PURCHASES.forEach(function (definition, index) {
      html += statRow(purchaseCode(index) + " · " + definition.name, hasPurchase(definition.id) ? "已购买" : formatNumber(BN.from(definition.cost)) + " 数值");
    });
    html += statRow("已拥有", numeric.purchased.size + " / " + PURCHASES.length);
    html += "</div>";

    html += '<div class="stats-group"><h3 class="stats-group-title">资源</h3>';
    resourceNames.forEach(function (name) {
      html += statRow(name, name === "数值" ? formatNumber(numeric.value) : "0");
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
    updateDevLockUI();
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
      version: 6,
      unlockedStages: Array.from(unlockedStages),
      activeStageId: activeStageId,
      settings: {
        theme: settings.theme,
        newsSpeed: settings.newsSpeed,
        devMode: settings.devMode
      },
      devLock: { failures: devLock.failures, until: devLock.until },
      numeric: {
        value: numeric.value.toScientific(),
        total: numeric.total.toScientific(),
        levels: UPGRADES.reduce(function (acc, definition) {
          acc[definition.id] = numeric.levels[definition.id];
          return acc;
        }, {}),
        purchased: Array.from(numeric.purchased)
      },
      stats: {
        playSeconds: stats.playSeconds,
        newsPlayed: stats.newsPlayed,
        storyStarted: stats.storyStarted,
        storySkipped: stats.storySkipped,
        storyFinished: stats.storyFinished,
        saveExports: stats.saveExports,
        saveImports: stats.saveImports,
        saveLoads: stats.saveLoads,
        totalClicks: stats.totalClicks,
        totalPurchases: stats.totalPurchases,
        peakValue: stats.peakValue.toScientific()
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
    if (data.settings && typeof data.settings.devMode === "boolean") {
      settings.devMode = data.settings.devMode;
    }
    if (data.devLock && typeof data.devLock === "object") {
      var failures = data.devLock.failures;
      var until = data.devLock.until;
      if (typeof failures === "number" && isFinite(failures) && failures >= 0 && failures < 5) {
        devLock.failures = Math.floor(failures);
      }
      if (typeof until === "number" && isFinite(until) && until >= 0) {
        devLock.until = until;
      }
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
        if (key === "peakValue") return;
        var value = data.stats[key];
        if (typeof value === "number" && isFinite(value) && value >= 0) {
          stats[key] = Math.floor(value);
        }
      });
    }
    if (data.numeric && typeof data.numeric === "object") {
      var savedValue = BN.from(data.numeric.value);
      var savedTotal = BN.from(data.numeric.total);
      if (savedValue.isFinite() && savedValue.gte(0)) numeric.value = savedValue;
      if (savedTotal.isFinite() && savedTotal.gte(numeric.value)) numeric.total = savedTotal;
      if (data.numeric.levels && typeof data.numeric.levels === "object") {
        UPGRADES.forEach(function (definition) {
          var level = data.numeric.levels[definition.id];
          if (typeof level === "number" && isFinite(level) && level >= 0) {
            numeric.levels[definition.id] = Math.floor(level);
          }
        });
      }
      if (Array.isArray(data.numeric.purchased)) {
        numeric.purchased.clear();
        data.numeric.purchased.forEach(function (id) {
          if (PURCHASES.some(function (item) { return item.id === id; })) {
            numeric.purchased.add(id);
          }
        });
      }
    }
    if (data.stats && data.stats.peakValue != null) {
      var savedPeak = BN.from(data.stats.peakValue);
      stats.peakValue = savedPeak.isFinite() && savedPeak.gte(0) ? savedPeak : BN.from(0);
    }
    if (stats.peakValue.lt(numeric.value)) stats.peakValue = numeric.value;
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
      renderUpgrades();
      renderPurchases();
      updateValueUI();
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

  valueCoreWrapEl.addEventListener("click", function (event) {
    if (currentView !== "stage") return;
    var gain = clickGain();
    stats.totalClicks += 1;
    gainValue(gain);
    spawnFloat("+" + formatNumber(gain), event);
    refreshUpgradeAffordability();
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

  devUnlockEl.addEventListener("click", function () {
    if (devLockRemaining() > 0) {
      updateDevLockUI();
      return;
    }
    if (devKeyInputEl.value === DEV_KEY) {
      devLock.failures = 0;
      devLock.until = 0;
      setDevMode(true);
      showHint("开发者模式已开启");
      return;
    }
    devKeyInputEl.value = "";
    devLock.failures += 1;
    if (devLock.failures >= 5) {
      devLock.until = Date.now() + 5 * 60 * 1000;
      devLock.failures = 0;
      showHint("连续错误 5 次，已锁定 5 分钟");
    } else {
      showHint("密钥错误，剩余 " + (5 - devLock.failures) + " 次尝试");
    }
    saveState();
    updateDevLockUI();
  });
  devPanelEl.addEventListener("click", function (event) {
    var target = event.target;
    while (target && target !== devPanelEl && !(target.dataset && target.dataset.devAction)) {
      target = target.parentElement;
    }
    if (target && target !== devPanelEl && target.dataset && target.dataset.devAction) {
      runDevAction(target.dataset.devAction);
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
    },
    openSettings: openSettings,
    openStats: openStats,
    exportSave: exportSave,
    importSave: importSave,
    grantValue: function (amount) {
      var delta = BN.from(amount);
      if (delta.isFinite() && delta.gt(0)) {
        gainValue(delta);
        refreshUpgradeAffordability();
        saveState();
      }
    },
    buyUpgrade: buyUpgrade,
    buyPurchase: buyPurchase,
    getNumeric: function () {
      return {
        value: numeric.value.toNumber(),
        valueText: numeric.value.toScientific(),
        total: numeric.total.toNumber(),
        totalText: numeric.total.toScientific(),
        levels: Object.assign({}, numeric.levels),
        purchased: Array.from(numeric.purchased),
        clickGain: clickGain().toNumber(),
        clickGainText: clickGain().toScientific(),
        autoRate: autoRate().toNumber(),
        autoRateText: autoRate().toScientific(),
        globalMultiplier: globalMultiplier().toNumber(),
        globalMultiplierText: globalMultiplier().toScientific()
      };
    },
    formatBigNumber: function (text) {
      return formatNumber(BN.from(text));
    }
  };

  loadState();
  renderSidebar();
  renderSettings();
  setActiveStage(activeStageId);
  renderUpgrades();
  renderPurchases();
  updateValueUI();
  refreshNewsQueue();
  updateClock();
  window.setInterval(updateClock, 30000);
  window.setInterval(tickStats, 1000);
  window.setInterval(gameTick, 100);
  window.setInterval(saveState, 30000);
  startStory(OPENING_STORY);
})();
