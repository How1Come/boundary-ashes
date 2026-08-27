"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const titleScreen = document.getElementById("title-screen");
const pauseScreen = document.getElementById("pause-screen");
const settingsScreen = document.getElementById("settings-screen");
const choiceScreen = document.getElementById("choice-screen");
const endScreen = document.getElementById("end-screen");
const choicesElement = document.getElementById("choices");
const toastElement = document.getElementById("toast");
const tutorialDialog = document.getElementById("tutorial-dialog");
const tutorialTitle = document.getElementById("tutorial-title");
const tutorialText = document.getElementById("tutorial-text");
const tutorialKey = document.getElementById("tutorial-key");
const tutorialProgress = document.getElementById("tutorial-progress");
const tutorialStepLabel = document.getElementById("tutorial-step-label");
const tutorialNext = document.getElementById("tutorial-next");
const tutorialSkip = document.getElementById("tutorial-skip");
const bestiaryScreen = document.getElementById("bestiary-screen");
const bestiaryList = document.getElementById("bestiary-list");
const codexVisual = document.getElementById("codex-visual");
const codexPortrait = document.getElementById("codex-portrait");
const codexGlyph = document.getElementById("codex-glyph");
const bossIntroScreen = document.getElementById("boss-intro-screen");
const bossIntroEyebrow = document.getElementById("boss-intro-eyebrow");
const bossIntroTitle = document.getElementById("boss-intro-title");
const bossIntroLore = document.getElementById("boss-intro-lore");
const bossPhaseTwo = document.getElementById("boss-phase-two");
const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");
const muteButton = document.getElementById("mute-button");
const portraitVideo = document.getElementById("hero-portrait-video");
const engineerPortrait = document.getElementById("engineer-portrait-video");
const engineerHero = document.getElementById("engineer-hero");
const characterSubtitle = document.getElementById("character-subtitle");
const characterIntro = document.getElementById("character-intro");
const controlGrid = document.getElementById("control-grid");
const characterButtons = [...document.querySelectorAll("[data-character]")];
const portraitImage = new Image();
portraitImage.src = "./assets/li-xingyao-animation-v5/keyframe-01.png";
const engineerPortraitAsset = new Image();
engineerPortraitAsset.src = "./assets/cheng-wenyu-animation-v2/keyframe-01.png";
const bossPortraitImage = new Image();
bossPortraitImage.src = "./assets/boss-eheng-portrait.png";

const pixelAtlases = Object.freeze({
  floor: Object.assign(new Image(), { src: "./assets/runtime/pixel-v1/floor-atlas.png" }),
  entity: Object.assign(new Image(), { src: "./assets/runtime/pixel-v1/entity-atlas.png" }),
  prop: Object.assign(new Image(), { src: "./assets/runtime/pixel-v1/prop-atlas.png" }),
  vfx: Object.assign(new Image(), { src: "./assets/runtime/pixel-v1/vfx-atlas.png" }),
});

const PIXEL_ENTITY = Object.freeze({
  xingyaoIdle: 0, xingyaoAttack: 1, wenyuIdle: 2, wenyuCast: 3,
  robotHealing: 4, robotEnergy: 5, robotControl: 6, robotEnhance: 7,
  wraith: 8, archer: 9, brute: 10, sentinel: 11,
  anchor: 12, boss: 13, bossEnraged: 14, dummy: 15,
});
const PIXEL_PROP = Object.freeze({
  pillar: 0, crates: 1, urns: 2, barricade: 3,
  spikesIdle: 4, spikesActive: 5, emberIdle: 6, emberActive: 7,
  coilIdle: 8, coilActive: 9, bladeIdle: 10, bladeActive: 11,
  brazier: 12, lamp: 13, obelisk: 14, reliquary: 15,
});
const PIXEL_VFX = Object.freeze({
  normal: 0, light: 1, meteor: 2, breeze: 3,
  force: 4, tech: 5, healing: 6, energy: 7,
  control: 8, enhance: 9, dodge: 10, construct: 11,
  boundary: 12, warning: 13, star: 14, bossBreak: 15,
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const syncPortraitMotion = () => {
  for (const video of [portraitVideo, engineerPortrait]) {
    if (!video) continue;
    if (reducedMotion.matches) {
      video.pause();
      video.currentTime = 0;
    } else {
      video.play().catch(() => {});
    }
  }
};
syncPortraitMotion();
if (typeof reducedMotion.addEventListener === "function") {
  reducedMotion.addEventListener("change", syncPortraitMotion);
}

const W = 1600;
const H = 900;
const TAU = Math.PI * 2;
const ARENA = { left: 92, right: 1508, top: 102, bottom: 798, door: 128 };

const DUNGEON_FLOORS = [
  {
    index: 1,
    name: "沉落遗迹",
    subtitle: "坠入失去刻度的旧界标",
    roomCount: 8,
    mainPathLength: 4,
    eliteCount: 1,
    obstacleBonus: 0,
    enemyLevelBonus: 0,
    enemyCountBonus: 0,
    enemyPool: ["wraith", "wraith", "archer", "brute"],
    labels: { start: "沉落前庭", combat: "遗迹回廊", elite: "断界祭所", boss: "残响校准厅" },
    palette: { inner: "#14292e", middle: "#0d1922", elite: "#1c2931", edge: "#080c13", accentRgb: "116,224,193" },
    boss: {
      name: "失序投影 · 厄衡",
      hp: 680,
      damage: 12.5,
      speed: 70,
      anchors: 3,
      lore: "厄衡留在浅层界标中的观测投影。它仍会执行裁界程序，但只有三枚校准锚维持其形体。",
    },
  },
  {
    index: 2,
    name: "逆星回廊",
    subtitle: "星轨在此倒流，房间彼此错位",
    roomCount: 9,
    mainPathLength: 5,
    eliteCount: 2,
    obstacleBonus: 1,
    enemyLevelBonus: 4,
    enemyCountBonus: 1,
    enemyPool: ["wraith", "archer", "brute", "sentinel", "sentinel"],
    labels: { start: "逆星门廊", combat: "倒悬星径", elite: "回转刑台", boss: "逆序观测厅" },
    palette: { inner: "#20283e", middle: "#121a2b", elite: "#25273a", edge: "#080b16", accentRgb: "112,151,232" },
    boss: {
      name: "逆星映身 · 厄衡",
      hp: 980,
      damage: 15,
      speed: 74,
      anchors: 5,
      lore: "吸收逆流星轨后的厄衡映身。五枚界锚会折返攻击轨迹，迫使闯入者重新寻找安全边界。",
    },
  },
  {
    index: 3,
    name: "失序深庭",
    subtitle: "破碎星图的核心与司界王庭",
    roomCount: 10,
    mainPathLength: 6,
    eliteCount: 2,
    obstacleBonus: 2,
    enemyLevelBonus: 8,
    enemyCountBonus: 2,
    enemyPool: ["wraith", "archer", "brute", "sentinel", "brute", "sentinel"],
    labels: { start: "深庭界门", combat: "失序长廊", elite: "七刃祭环", boss: "失序王庭" },
    palette: { inner: "#281b31", middle: "#171421", elite: "#2c2133", edge: "#090811", accentRgb: "190,112,218" },
    boss: {
      name: "失序司界 · 厄衡",
      hp: 1380,
      damage: 18,
      speed: 76,
      anchors: 7,
      lore: "前代界标校准者的完整本体。破碎星图在其胸腔内运转，七枚校准刃将所有偏离判定为必须抹除的错误。",
    },
  },
];

const MAGIC = [
  { key: "light", name: "流光", color: "#73e9cf", icon: "贯", cost: 9 },
  { key: "meteor", name: "陨星", color: "#f09a68", icon: "爆", cost: 12 },
  { key: "breeze", name: "清风", color: "#9fcbff", icon: "愈", cost: 10 },
];

const ROBOT_CONFIGS = [
  { key: "healing", name: "治疗配置", short: "疗", color: "#72e0b3" },
  { key: "energy", name: "能量配置", short: "能", color: "#69b9ff" },
  { key: "control", name: "控制配置", short: "控", color: "#b692ff" },
  { key: "enhance", name: "强化配置", short: "强", color: "#e4b968" },
];

const CHARACTER_PROFILES = {
  xingyao: {
    name: "黎星遥",
    subtitle: "黎星遥 · 精灵界标射手",
    intro: "深界正在吞没最后的星图。收集星痕、解放失落界律，<br />在不断重构的遗迹中重新掌握魔法箭与灵舞。",
    controls: [
      ["WASD", "移动"], ["鼠标", "瞄准"], ["按住左键", "蓄力射击"], ["Space", "翻滚齐射（解锁）"],
      ["Q", "召唤 / 回收契灵"], ["E", "切换魔法箭（解锁）"], ["R", "灵舞（解锁）"], ["Esc", "暂停"],
    ],
  },
  wenyu: {
    name: "程闻屿",
    subtitle: "程闻屿 · 软系归恒机巧师",
    intro: "柔软可爱的外表下，是一张精确运转的归恒网络。<br />设定配置、制造机器人，让四种机巧守住整片战场。",
    controls: [
      ["WASD", "移动"], ["鼠标", "瞄准 / 选择机器人"], ["按住左键", "脉冲射击"], ["Space", "重设并修复"],
      ["Q", "切换机器人配置"], ["E", "进入 / 退出绑定"], ["R", "回收并机甲变身"], ["Esc", "暂停"],
    ],
  },
};

const XINGYAO_TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "星弦初醒",
    text: "黎星遥，你能听见界线另一侧的声音吗？我是‘天意’。此处是星弦演武庭，我会让界律依次回应你的每一种力量。",
    key: "准备好后继续",
    manual: true,
  },
  {
    id: "move",
    title: "先学会保持距离",
    text: "射手的第一条界律不是命中，而是距离。使用方向键在演武庭中移动；斜向移动时速度不会额外增加。",
    key: "W A S D · 移动一段距离",
    focus: "player",
  },
  {
    id: "normal",
    title: "拉开星弦",
    text: "将光标移向界标傀儡，按住鼠标左键蓄力，松开射出实体箭。弓弩拥有固定攻击冷却，急促连点无法越过它。",
    key: "按住 鼠标左键 · 松开射击",
    focus: "target",
  },
  {
    id: "light",
    title: "流光 · 贯穿与回能",
    text: "弓箭射出后会消耗能量，自动追加当前魔法箭。流光可以无限穿透敌人，并在命中时恢复能量。再次命中傀儡。",
    key: "当前箭种：流光 · 再次蓄力射击",
    focus: "target",
  },
  {
    id: "meteor",
    title: "陨星 · 范围爆发",
    text: "按 E 将流光切换为陨星。陨星撞到敌人或墙壁都会爆炸，适合处理聚集目标。切换后射中傀儡。",
    key: "E · 切换至陨星，然后射击",
    focus: "magic",
  },
  {
    id: "breeze",
    title: "清风 · 维持续航",
    text: "再按一次 E 切换为清风。清风命中会为你恢复生命；我已暂时削弱你的生命界标，试着用清风修复它。",
    key: "E · 切换至清风，然后射击",
    focus: "magic",
  },
  {
    id: "retrieve",
    title: "归弦 · 独行专精",
    text: "按 Q 回收契灵。契灵不在场时，你会获得更快的蓄力速度与更高弓弩伤害，适合由自己组织爆发。",
    key: "Q · 回收契灵",
    focus: "q",
  },
  {
    id: "summon",
    title: "契灵 · 星轨协奏",
    text: "再次按 Q 召回契灵。它会持续恢复能量，间歇射出当前魔法箭，并用万斥为敌人建立界缚。",
    key: "Q · 召唤契灵",
    focus: "q",
  },
  {
    id: "roll",
    title: "翻滚齐射 · 建立界缚",
    text: "按 Space 向移动方向翻滚。翻滚期间不会受伤，并会向附近目标均摊射出万斥与当前魔法箭；你最多储存两次。",
    key: "WASD + Space · 翻滚齐射",
    focus: "space",
  },
  {
    id: "dance",
    title: "灵舞 · 展开星轨",
    text: "按 R 进入灵舞。灵舞持续消耗能量，强化移动、攻击、技能回转与所有魔法箭；契灵不在场时增幅更高。",
    key: "R · 启动灵舞",
    focus: "r",
  },
  {
    id: "complete",
    title: "界律已经回应",
    text: "你已走完第一段星轨。记住：万斥建立界缚，箭种决定收益，翻滚组织齐射，灵舞完成爆发。真正的深界不会如此安静。",
    key: "引导完成 · 可进入正式地牢",
    manual: true,
    final: true,
  },
];

const WENYU_TUTORIAL_STEPS = [
  {
    id: "engineer_welcome",
    title: "归恒网络上线",
    text: "程闻屿，我是‘天意’。这里是归恒校准庭。你不必亲自承担所有火力——先让每一台机器知道自己该成为什么、又该守护谁。",
    key: "准备好后继续",
    manual: true,
  },
  {
    id: "engineer_move",
    title: "保持网络阵位",
    text: "使用方向键移动。机器人会围绕你重整随行阵位，并自动避开场景障碍；移动一段距离，让随行协议完成校准。",
    key: "W A S D · 移动一段距离",
    focus: "player",
  },
  {
    id: "engineer_attack",
    title: "固定频率脉冲",
    text: "将光标对准校准傀儡并按住鼠标左键。脉冲发射器按固定冷却连续射击，点击速度不会突破它的攻击间隔。",
    key: "按住 鼠标左键 · 命中傀儡",
    focus: "target",
  },
  {
    id: "engineer_config",
    title: "设定下一台机器",
    text: "按 Q 在治疗、能量、控制与强化配置间轮换。这里只改变下一台机器人的制造蓝图，已经在场的机器人会保留自己的独立配置。",
    key: "Q · 切换一次制造配置",
    focus: "q",
  },
  {
    id: "engineer_manufacture",
    title: "自动制造",
    text: "制造能量会自行恢复，并受冷却缩减影响。能量充满时，系统会按当前蓝图自动制造机器人并清空能量；观察制造环完成。",
    key: "无需按键 · 等待制造能量充满",
    focus: "player",
  },
  {
    id: "engineer_robot_attack",
    title: "自主远程支援",
    text: "机器人会优先攻击附近威胁，每次命中都能回收机体能量，并附加减速与短暂晕眩。让它自行命中新的校准傀儡。",
    key: "保持在场 · 等待机器人命中",
    focus: "robot_target",
  },
  {
    id: "engineer_bind",
    title: "批量绑定友军",
    text: "我已暂时解除这台机器的绑定。按 E 进入持续指定状态，再点击机器人把它绑定给程闻屿；完成后可再次按 E 退出。",
    key: "E · 进入绑定模式，再点击机器人",
    focus: "binding",
  },
  {
    id: "engineer_reset",
    title: "重设并修复",
    text: "先按 Q 选择另一种配置，再按 Space。系统会把所选或最近的机器人改写为当前配置，同时修复耐久；技能最多储存三次。",
    key: "Q · 更换配置，然后 Space · 重设",
    focus: "space",
  },
  {
    id: "engineer_mech",
    title: "回收与机甲变身",
    text: "按 R 回收全部机器人。它们的机体资源会转回制造能量，并展开短续航机甲；变身会持续消耗制造能量，耗尽后网络重新启动。",
    key: "R · 回收机器人并展开机甲",
    focus: "r",
  },
  {
    id: "engineer_complete",
    title: "归恒链路稳定",
    text: "配置决定职能，绑定决定服务对象，重设负责临场改写，回收则把整张网络压缩成一次机甲窗口。真正的深界会迫使你不断重排这四个环节。",
    key: "引导完成 · 可进入正式地牢",
    manual: true,
    final: true,
  },
];

const BESTIARY = [
  {
    type: "wraith",
    icon: "影",
    name: "蚀影",
    className: "游荡型 · 深界残响",
    threat: "威胁 Ⅰ",
    accent: "#8ca2b0",
    lore: "被深界剥去来路的微弱意识，只剩下追逐活物温度的本能。它们没有面孔，也从不记得自己曾经是谁。",
    tags: ["近身追击", "数量压制", "低韧性"],
    behavior: "持续贴近目标，以短促扑击造成伤害。单体并不危险，但会从不同角度压缩射手的走位空间。",
    counter: "用流光贯穿成列目标，或先用万斥建立界缚。蚀影容易被晕眩，保持中距离即可稳定处理。",
  },
  {
    type: "archer",
    icon: "弩",
    name: "烬弩手",
    className: "远程型 · 遗迹守卫",
    threat: "威胁 Ⅱ",
    accent: "#d497a8",
    lore: "古代守卫的弩机与无名遗骸缝合而成。它仍忠实执行已经失效的警戒指令，将每个活物视为闯入者。",
    tags: ["远程射击", "保持距离", "侧向移动"],
    behavior: "主动维持射击距离，并在玩家接近时后撤。弩矢轨迹清晰，但会与近战怪物形成交叉火力。",
    counter: "优先翻滚接近或用流光隔着其他敌人击杀。不要沿弩矢方向直线移动，横向走位最容易规避。",
  },
  {
    type: "brute",
    icon: "骸",
    name: "界骸",
    className: "重装型 · 边界遗骸",
    threat: "威胁 Ⅲ",
    accent: "#bb806c",
    lore: "承载过量界能后结晶化的巨型遗骸。骨甲内没有血肉，只剩不断试图撞碎边界的轰鸣。",
    tags: ["高生命", "蓄势冲锋", "近身震击"],
    behavior: "缓慢追近，在中距离锁定方向后短暂蓄势并高速冲锋。近身时会释放范围震击。",
    counter: "观察蓄势停顿后垂直闪避。万斥的晕眩和近距离界缚压制能显著限制冲锋，陨星适合消耗其高生命。",
  },
  {
    type: "sentinel",
    icon: "巡",
    name: "巡界灯",
    className: "控制型 · 浮游造物",
    threat: "威胁 Ⅲ",
    accent: "#9a86c7",
    lore: "用于校验界标误差的浮游仪器。失序后，它将一切移动都判定为偏差，并试图以三联界光予以修正。",
    tags: ["环绕移动", "三联弹幕", "中距离压制"],
    behavior: "围绕玩家旋行并保持中距离，周期性发射三枚扇形界光。与远程单位同时出现时会封锁大片安全区域。",
    counter: "不要追着其环绕轨迹移动。蓄力后预判射击，或用翻滚齐射自动索敌；清风可以抵消弹幕带来的消耗。",
  },
  {
    type: "boss",
    icon: "厄",
    name: "失序司界 · 厄衡",
    className: "界标主宰 · 前代校准者",
    threat: "首领 Ⅴ",
    accent: "#c17ae5",
    image: "./assets/boss-eheng-portrait.png",
    lore: "前代界标校准者。破碎星图侵入它的胸腔后，厄衡将所有偏离视为必须抹除的错误。白瓷面具后的赤眼持续观测战场，七枚校准刃则负责切断不被允许的道路。",
    tags: ["三阶段", "裁界预警", "界锚护盾", "强制安全区", "复合弹幕"],
    behavior: "第一阶段用裁界线与坠界印校准走位；第二阶段召唤七锚投影，护盾存在时无法受伤；第三阶段令边界收束，连续组合直线裁决、范围爆破与失序星环。",
    counter: "所有致命技能都有紫红预警。直线裁决应横向离开光带，坠界印需分散落点；七锚出现后立刻转火；归界收束时必须进入中央安全区。",
  },
];

const COLORS = {
  ink: "#070b12",
  floor: "#101a23",
  floor2: "#14232b",
  jade: "#72e0c1",
  gold: "#f1d08b",
  violet: "#b89cff",
  danger: "#ef6d78",
  force: "#d4a8ff",
  text: "#e7f1ee",
  muted: "#7e969d",
};

const input = {
  keys: new Set(),
  pressed: new Set(),
  mouse: { x: W * 0.7, y: H * 0.5, down: false, released: false },
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (a = 1, b = 0) => b + Math.random() * (a - b);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const keyOf = (x, y) => `${x},${y}`;

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundedRectPath(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.roundRect(x, y, w, h, radius);
}

function polygon(context, points) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) context.lineTo(points[i][0], points[i][1]);
  context.closePath();
}

function pixel(value) {
  return Math.round(value / 2) * 2;
}

function atlasLoaded(image) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}

function drawAtlasCell(context, image, index, columns, rows, x, y, width, height, options = {}) {
  if (!atlasLoaded(image)) return false;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const sx = Math.floor((column * image.naturalWidth) / columns);
  const sy = Math.floor((row * image.naturalHeight) / rows);
  const ex = Math.floor(((column + 1) * image.naturalWidth) / columns);
  const ey = Math.floor(((row + 1) * image.naturalHeight) / rows);
  const drawWidth = pixel(width);
  const drawHeight = pixel(height);
  context.save();
  context.globalAlpha *= options.alpha ?? 1;
  context.translate(pixel(x), pixel(y));
  if (options.flipX) context.scale(-1, 1);
  if (options.rotation) context.rotate(options.rotation);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, sx, sy, ex - sx, ey - sy, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();
  return true;
}

function drawPixelShadow(context, x, y, width, alpha = 0.4) {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "#03050a";
  const shadowWidth = pixel(width);
  context.fillRect(pixel(x - shadowWidth / 2), pixel(y), shadowWidth, 8);
  context.fillRect(pixel(x - shadowWidth * 0.36), pixel(y + 8), pixel(shadowWidth * 0.72), 4);
  context.restore();
}

class Soundscape {
  constructor() {
    this.context = null;
    this.master = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.ambientTimer = 0;
    this.lastHitTime = -1;
    this.volume = 0.7;
    this.muted = false;
    try {
      const savedValue = localStorage.getItem("boundary-ashes-volume");
      const savedVolume = Number(savedValue);
      if (savedValue !== null && Number.isFinite(savedVolume)) this.volume = clamp(savedVolume, 0, 1);
      this.muted = localStorage.getItem("boundary-ashes-muted") === "true";
    } catch (error) {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }

  enable() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -20;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4.5;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.16;
      this.master.connect(this.compressor);
      this.compressor.connect(this.context.destination);
      this.applyVolume(true);
    }
    if (this.context.state === "suspended") this.context.resume();
  }

  savePreferences() {
    try {
      localStorage.setItem("boundary-ashes-volume", this.volume.toFixed(2));
      localStorage.setItem("boundary-ashes-muted", String(this.muted));
    } catch (error) {
      // Audio remains functional even when persistence is blocked.
    }
  }

  outputLevel() {
    return this.muted ? 0 : 0.2 * Math.pow(this.volume, 1.18);
  }

  applyVolume(immediate = false) {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const target = this.outputLevel();
    this.master.gain.cancelScheduledValues(now);
    if (immediate) this.master.gain.setValueAtTime(target, now);
    else this.master.gain.setTargetAtTime(target, now, 0.025);
  }

  setVolume(value) {
    this.volume = clamp(Number(value) || 0, 0, 1);
    this.applyVolume();
    this.savePreferences();
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    this.applyVolume();
    this.savePreferences();
  }

  route(node, pan = 0) {
    if (typeof this.context.createStereoPanner === "function") {
      const panner = this.context.createStereoPanner();
      panner.pan.value = clamp(pan, -1, 1);
      node.connect(panner);
      panner.connect(this.master);
      return;
    }
    node.connect(this.master);
  }

  tone(frequency, duration, type = "sine", volume = 0.18, slide = 0, options = {}) {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime + (options.delay || 0);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const attack = Math.min(duration * 0.35, options.attack ?? 0.008);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(30, frequency), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    this.route(gain, options.pan || 0);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  noiseBurst(duration, volume, frequency, type = "bandpass", options = {}) {
    if (!this.context || !this.master) return;
    if (!this.noiseBuffer) {
      const length = Math.ceil(this.context.sampleRate * 0.45);
      this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        const envelope = 1 - i / data.length;
        data[i] = (Math.random() * 2 - 1) * (0.45 + envelope * 0.55);
      }
    }
    const now = this.context.currentTime + (options.delay || 0);
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = options.q ?? 1.15;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + Math.min(0.004, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    this.route(gain, options.pan || 0);
    source.start(now);
    source.stop(now + duration + 0.015);
  }

  shot(charge) {
    const strength = 0.7 + charge * 0.3;
    this.tone(1780 + charge * 620, 0.055, "triangle", 0.13 * strength, -960, { attack: 0.001 });
    this.tone(225 + charge * 58, 0.105, "sine", 0.055 * strength, -72, { attack: 0.002, delay: 0.006 });
    this.noiseBurst(0.092, 0.05 * strength, 3600 + charge * 1900, "bandpass", { delay: 0.005, q: 0.85 });
    if (charge > 0.72) this.tone(2850, 0.075, "sine", 0.025 * charge, 520, { attack: 0.002, delay: 0.012 });
  }

  magic(kind) {
    if (kind === "light") {
      this.tone(880, 0.13, "sine", 0.055, 620, { attack: 0.003 });
      this.tone(1760, 0.09, "sine", 0.025, 320, { attack: 0.002, delay: 0.014 });
    } else if (kind === "meteor") {
      this.tone(245, 0.18, "triangle", 0.075, -118, { attack: 0.004 });
      this.noiseBurst(0.12, 0.04, 720, "lowpass", { delay: 0.012, q: 0.65 });
    } else if (kind === "breeze") {
      this.tone(690, 0.18, "sine", 0.05, 390, { attack: 0.009 });
      this.noiseBurst(0.15, 0.027, 4700, "highpass", { delay: 0.01, q: 0.55 });
    } else {
      this.tone(390, 0.15, "triangle", 0.065, -145, { attack: 0.003 });
      this.tone(790, 0.11, "sine", 0.03, -210, { attack: 0.003, delay: 0.018 });
    }
  }

  hit(kind = "normal", amount = 10, enemyType = "wraith", pan = 0) {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const heavy = amount > 42 || enemyType === "boss" || enemyType === "brute";
    if (!heavy && now - this.lastHitTime < 0.028) return;
    this.lastHitTime = now;
    const strength = clamp(0.45 + amount / 65, 0.48, 1.15);

    if (kind === "meteor") {
      this.noiseBurst(0.14, 0.095 * strength, 620, "lowpass", { pan, q: 0.65 });
      this.tone(138, 0.17, "triangle", 0.1 * strength, -64, { attack: 0.002, pan });
      return;
    }
    if (kind === "light") {
      this.noiseBurst(0.045, 0.038 * strength, 3100, "bandpass", { pan, q: 1.7 });
      this.tone(1260, 0.075, "sine", 0.07 * strength, 470, { attack: 0.001, pan });
      return;
    }
    if (kind === "breeze") {
      this.noiseBurst(0.07, 0.035 * strength, 4400, "highpass", { pan, q: 0.7 });
      this.tone(940, 0.11, "sine", 0.058 * strength, 280, { attack: 0.002, pan });
      return;
    }
    if (kind === "force") {
      this.noiseBurst(0.065, 0.055 * strength, 1450, "bandpass", { pan, q: 1.05 });
      this.tone(365, 0.105, "triangle", 0.085 * strength, -160, { attack: 0.001, pan });
      return;
    }

    this.noiseBurst(heavy ? 0.075 : 0.048, (heavy ? 0.07 : 0.048) * strength, heavy ? 1050 : 1850, "bandpass", { pan, q: 1.25 });
    this.tone(heavy ? 620 : 980, heavy ? 0.095 : 0.065, "triangle", (heavy ? 0.09 : 0.07) * strength, heavy ? -310 : -470, { attack: 0.001, pan });
    this.tone(heavy ? 155 : 210, heavy ? 0.12 : 0.075, "sine", (heavy ? 0.045 : 0.025) * strength, -55, { attack: 0.002, pan });
  }

  hurt() {
    this.noiseBurst(0.13, 0.1, 720, "lowpass", { q: 0.65 });
    this.tone(118, 0.22, "triangle", 0.13, -48, { attack: 0.003 });
  }

  roll() {
    this.noiseBurst(0.2, 0.052, 3300, "highpass", { q: 0.5 });
    this.tone(530, 0.12, "sine", 0.04, -270, { attack: 0.004 });
  }

  chime() {
    this.tone(440, 0.42, "sine", 0.11, 220);
    window.setTimeout(() => this.tone(660, 0.38, "sine", 0.08, 180), 110);
  }

  shield() {
    this.tone(310, 0.11, "triangle", 0.055, -120, { attack: 0.002 });
    this.tone(930, 0.08, "sine", 0.03, -360, { attack: 0.001, delay: 0.012 });
  }

  preview() {
    this.enable();
    this.shot(0.82);
    window.setTimeout(() => this.hit("normal", 27, "wraith"), 125);
  }
}

class Effect {
  constructor(type, x, y, options = {}) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.color = options.color || COLORS.jade;
    this.life = options.life || 0.5;
    this.maxLife = this.life;
    this.size = options.size || 5;
    this.text = options.text || "";
    this.kind = options.kind || "normal";
    this.rotation = options.rotation || 0;
    this.spin = options.spin || 0;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.12, dt);
    this.vy *= Math.pow(0.12, dt);
    this.rotation += this.spin * dt;
    if (this.type === "text") this.vy -= 9 * dt;
    return this.life > 0;
  }

  draw(context) {
    const t = clamp(this.life / this.maxLife, 0, 1);
    context.save();
    context.globalAlpha = this.type === "text" ? Math.min(1, t * 2) : t;
    context.translate(this.x, this.y);
    context.rotate(this.rotation);
    if (this.type === "pixelBurst") {
      const index = PIXEL_VFX[this.kind] ?? PIXEL_VFX.normal;
      const scale = this.size * (1.02 + (1 - t) * 0.18);
      context.globalAlpha = Math.min(1, t * 2.6);
      if (!drawAtlasCell(context, pixelAtlases.vfx, index, 4, 4, 0, 0, scale, scale)) {
        context.fillStyle = this.color;
        context.fillRect(-scale * 0.3, -4, scale * 0.6, 8);
        context.fillRect(-4, -scale * 0.3, 8, scale * 0.6);
      }
    } else if (this.type === "particle") {
      context.fillStyle = this.color;
      const particleSize = Math.max(2, pixel(this.size * t));
      context.fillRect(-particleSize, -2, particleSize * 2, 4);
      context.fillStyle = "rgba(255,255,255,0.48)";
      context.fillRect(-particleSize * 0.25, -2, Math.max(2, particleSize * 0.5), 2);
    } else if (this.type === "ring") {
      context.strokeStyle = this.color;
      context.lineWidth = 2 * t;
      context.shadowColor = this.color;
      context.shadowBlur = 16;
      context.beginPath();
      context.arc(0, 0, this.size * (1.35 - t * 0.35), 0, TAU);
      context.stroke();
    } else if (this.type === "slash") {
      context.strokeStyle = this.color;
      context.lineWidth = 5 * t;
      context.shadowColor = this.color;
      context.shadowBlur = 14;
      context.beginPath();
      context.arc(0, 0, this.size, -0.8, 0.8);
      context.stroke();
    } else if (this.type === "text") {
      context.fillStyle = this.color;
      context.font = `700 ${this.size}px system-ui`;
      context.textAlign = "center";
      context.shadowColor = "#000";
      context.shadowBlur = 4;
      context.fillText(this.text, 0, 0);
    }
    context.restore();
  }
}

let entityId = 1;

class Arrow {
  constructor(x, y, angle, damage, kind = "normal", source = "player", charge = 0.5) {
    this.id = entityId += 1;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.angle = angle;
    this.kind = kind;
    this.source = source;
    this.damage = damage;
    this.charge = charge;
    this.speed = kind === "meteor" ? 660 : kind === "breeze" ? 760 : 930;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.radius = kind === "meteor" ? 11 : 5;
    this.life = 1.65;
    this.dead = false;
    this.hit = new Set();
    this.pierce = kind === "light" ? 999 : kind === "normal" && charge > 0.86 ? 2 : 1;
    this.trailTick = 0;
  }

  color() {
    if (this.kind === "force") return COLORS.force;
    if (this.kind === "tech") return "#63d8d0";
    if (this.kind === "normal") return COLORS.gold;
    return MAGIC.find((m) => m.key === this.kind)?.color || COLORS.text;
  }

  update(dt, game) {
    this.life -= dt;
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.trailTick -= dt;

    if (this.trailTick <= 0) {
      this.trailTick = this.kind === "normal" ? 0.045 : 0.025;
      game.effects.push(new Effect("particle", this.x, this.y, {
        vx: -this.vx * 0.08 + rand(18, -18),
        vy: -this.vy * 0.08 + rand(18, -18),
        color: this.color(),
        size: this.kind === "meteor" ? 9 : 5,
        life: 0.24,
        rotation: this.angle,
      }));
    }

    let hitWall = this.x < ARENA.left || this.x > ARENA.right || this.y < ARENA.top || this.y > ARENA.bottom;
    for (const obstacle of game.currentRoom.obstacles) {
      if (Math.hypot(this.x - obstacle.x, this.y - obstacle.y) < obstacle.r + this.radius) hitWall = true;
    }

    if (hitWall) {
      if (this.kind === "meteor") game.explode(this.x, this.y, this.damage, 118, this.source);
      else game.spark(this.x, this.y, this.color(), 5);
      this.dead = true;
      return false;
    }

    for (const enemy of game.enemies) {
      if (enemy.dead || this.hit.has(enemy.id)) continue;
      if (Math.hypot(this.x - enemy.x, this.y - enemy.y) > enemy.r + this.radius + 3) continue;
      this.hit.add(enemy.id);
      this.onHit(enemy, game);
      if (this.dead) break;
    }

    if (this.life <= 0 && this.kind === "meteor" && !this.dead) game.explode(this.x, this.y, this.damage, 118, this.source);
    if (this.life <= 0) this.dead = true;
    return !this.dead;
  }

  onHit(enemy, game) {
    game.recordTutorialHit(this.kind, enemy, this.source);
    if (this.source === "player" && game.player?.characterId === "wenyu") {
      game.player.lastAttackTarget = enemy;
      game.player.lastAttackTargetTimer = 2.6;
    }
    let amount = this.damage;
    if (this.kind === "force") {
      if (enemy.tetherTime > 0) {
        const falloff = clamp(1 - dist(enemy, game.player) / 760, 0.24, 1);
        amount *= 1 + falloff * 0.72;
      } else {
        enemy.stun = Math.max(enemy.stun, enemy.type === "boss" ? 0.35 : 1.05);
      }
      enemy.tetherTime = Math.max(enemy.tetherTime, 8);
      enemy.tetherStacks = Math.max(1, enemy.tetherStacks);
      enemy.tetherTick = 0;
      game.effects.push(new Effect("ring", enemy.x, enemy.y, { color: COLORS.force, size: enemy.r + 26, life: 0.55 }));
    }

    if (this.kind === "light") {
      amount *= 0.72;
      game.player.energy = Math.min(game.player.maxEnergy, game.player.energy + 3.2);
    } else if (this.kind === "meteor") {
      this.dead = true;
      game.explode(this.x, this.y, amount, 118 + this.charge * 28, this.source);
      return;
    } else if (this.kind === "breeze") {
      amount *= 0.68;
      game.player.heal(3.5 + this.charge * 4.5);
    }

    if (this.kind === "normal" && enemy.tetherTime > 0) {
      enemy.tetherStacks = Math.min(5, enemy.tetherStacks + 1);
      enemy.tetherBoost = 1.8;
    }

    game.damageEnemy(enemy, amount, this.kind, this.angle);
    if (this.kind !== "normal") game.player.onMagicHit(this.kind, this.source === "spirit");
    this.pierce -= 1;
    if (this.pierce <= 0) this.dead = true;
  }

  draw(context) {
    const color = this.color();
    context.save();
    context.translate(pixel(this.x), pixel(this.y));
    const direction = Math.round(this.angle / (TAU / 16)) * (TAU / 16);
    context.rotate(direction);
    context.fillStyle = color;
    const shaft = pixel(22 + this.charge * 8);
    const thickness = this.kind === "meteor" ? 6 : 4;
    context.fillRect(-shaft, -thickness / 2, shaft + 8, thickness);
    context.fillStyle = "rgba(255,255,255,0.72)";
    context.fillRect(-shaft + 4, -thickness / 2, Math.max(6, shaft * 0.42), 2);
    context.fillStyle = color;
    context.fillStyle = color;
    polygon(context, [[13, 0], [3, -5], [5, 0], [3, 5]]);
    context.fill();
    if (this.kind === "meteor") {
      context.globalAlpha = 0.44;
      context.fillRect(-12, -10, 18, 20);
      context.fillRect(-18, -6, 8, 12);
    } else if (this.kind === "light") {
      context.globalAlpha = 0.28;
      context.fillRect(-44, -4, 52, 8);
    }
    context.restore();
  }
}

class EnemyProjectile {
  constructor(x, y, angle, speed = 350, damage = 10, color = COLORS.danger, size = 7) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.color = color;
    this.r = size;
    this.life = 5;
    this.dead = false;
  }

  update(dt, game) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < ARENA.left || this.x > ARENA.right || this.y < ARENA.top || this.y > ARENA.bottom) this.dead = true;
    for (const obstacle of game.currentRoom.obstacles) {
      if (Math.hypot(this.x - obstacle.x, this.y - obstacle.y) < obstacle.r + this.r) this.dead = true;
    }
    if (!this.dead && game.player?.robots) {
      const robot = game.player.robots.find((unit) => !unit.dead && Math.hypot(this.x - unit.x, this.y - unit.y) < unit.r + this.r);
      if (robot) {
        robot.takeDamage(this.damage * 0.72);
        this.dead = true;
      }
    }
    if (!this.dead && Math.hypot(this.x - game.player.x, this.y - game.player.y) < game.player.r + this.r) {
      game.player.hurt(this.damage, Math.atan2(this.vy, this.vx));
      this.dead = true;
    }
    return this.life > 0 && !this.dead;
  }

  draw(context) {
    context.save();
    context.translate(pixel(this.x), pixel(this.y));
    context.fillStyle = this.color;
    const size = Math.max(6, pixel(this.r * 1.5));
    polygon(context, [[0, -size], [size, 0], [0, size], [-size, 0]]);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.74)";
    context.fillRect(-2, -2, 4, 4);
    context.globalAlpha = 0.24;
    context.fillStyle = this.color;
    context.fillRect(-size - 4, -2, (size + 4) * 2, 4);
    context.fillRect(-2, -size - 4, 4, (size + 4) * 2);
    context.restore();
  }
}

class BossHazard {
  constructor(type, options = {}) {
    this.type = type;
    this.x = options.x ?? W / 2;
    this.y = options.y ?? H / 2;
    this.angle = options.angle || 0;
    this.radius = options.radius || 120;
    this.width = options.width || 92;
    this.delay = options.delay || 1;
    this.maxDelay = this.delay;
    this.duration = options.duration || 0.28;
    this.damage = options.damage || 18;
    this.color = options.color || "#d267a4";
    this.triggered = false;
    this.dead = false;
  }

  update(dt, game) {
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay <= 0) this.trigger(game);
    } else {
      this.duration -= dt;
      if (this.duration <= 0) this.dead = true;
    }
    return !this.dead;
  }

  trigger(game) {
    if (this.triggered) return;
    this.triggered = true;
    let hit = false;
    if (this.type === "line") {
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      const perpendicular = Math.abs(-Math.sin(this.angle) * dx + Math.cos(this.angle) * dy);
      hit = perpendicular < this.width / 2 + game.player.r;
    } else if (this.type === "circle") {
      hit = Math.hypot(game.player.x - this.x, game.player.y - this.y) < this.radius + game.player.r;
    } else if (this.type === "outside") {
      hit = Math.hypot(game.player.x - this.x, game.player.y - this.y) > this.radius - game.player.r;
    }
    if (hit) game.player.hurt(this.damage, Math.atan2(game.player.y - this.y, game.player.x - this.x));
    if (game.player?.robots) {
      for (const robot of game.player.robots) {
        if (robot.dead) continue;
        let robotHit = false;
        if (this.type === "line") {
          const dx = robot.x - this.x;
          const dy = robot.y - this.y;
          robotHit = Math.abs(-Math.sin(this.angle) * dx + Math.cos(this.angle) * dy) < this.width / 2 + robot.r;
        } else if (this.type === "circle") {
          robotHit = Math.hypot(robot.x - this.x, robot.y - this.y) < this.radius + robot.r;
        } else if (this.type === "outside") {
          robotHit = Math.hypot(robot.x - this.x, robot.y - this.y) > this.radius - robot.r;
        }
        if (robotHit) robot.takeDamage(this.damage * 0.72);
      }
    }
    game.shake = Math.max(game.shake, this.type === "outside" ? 13 : 8);
    game.shockwave(this.x, this.y, this.color, this.type === "line" ? 80 : this.radius);
    game.sound.tone(this.type === "outside" ? 70 : 105, 0.3, "sawtooth", 0.14, -35);
  }

  draw(context, elapsed) {
    const telegraph = this.delay > 0;
    const progress = telegraph ? clamp(1 - this.delay / this.maxDelay, 0, 1) : 1;
    const pulse = 0.55 + Math.sin(elapsed * 10) * 0.2;
    context.save();
    context.strokeStyle = this.color;
    context.fillStyle = this.color;
    context.shadowColor = this.color;
    context.shadowBlur = telegraph ? 8 : 24;

    if (this.type === "line") {
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.globalAlpha = telegraph ? 0.2 + progress * 0.34 : 0.82;
      context.lineWidth = telegraph ? 2 + progress * 2 : this.width;
      context.setLineDash(telegraph ? [18, 14] : []);
      context.lineDashOffset = -elapsed * 70;
      context.beginPath();
      context.moveTo(-1800, 0);
      context.lineTo(1800, 0);
      context.stroke();
      if (telegraph) {
        context.globalAlpha = 0.08 + progress * 0.1;
        context.fillRect(-1800, -this.width / 2, 3600, this.width);
      }
    } else if (this.type === "circle") {
      context.translate(this.x, this.y);
      context.globalAlpha = telegraph ? 0.28 + progress * 0.32 : 0.78;
      context.lineWidth = telegraph ? 2.5 : 12;
      context.setLineDash(telegraph ? [9, 8] : []);
      context.lineDashOffset = -elapsed * 55;
      context.beginPath();
      context.arc(0, 0, this.radius * (telegraph ? 0.84 + progress * 0.16 : 1), 0, TAU);
      context.stroke();
      context.globalAlpha *= telegraph ? 0.12 : 0.28;
      context.beginPath();
      context.arc(0, 0, this.radius, 0, TAU);
      context.fill();
      context.globalAlpha = 0.5;
      for (let i = 0; i < 4; i += 1) {
        context.rotate(Math.PI / 2);
        context.beginPath();
        context.moveTo(this.radius * 0.5, 0);
        context.lineTo(this.radius * 0.78, 0);
        context.stroke();
      }
    } else if (this.type === "outside") {
      context.globalAlpha = telegraph ? 0.17 + progress * 0.2 : 0.5;
      context.beginPath();
      context.rect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
      context.arc(this.x, this.y, this.radius, 0, TAU, true);
      context.fill("evenodd");
      context.globalAlpha = telegraph ? 0.6 + pulse * 0.2 : 0.92;
      context.lineWidth = telegraph ? 3 : 15;
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, TAU);
      context.stroke();
    }
    context.restore();
  }
}

class Pickup {
  constructor(x, y, kind) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.vx = rand(120, -120);
    this.vy = rand(120, -120);
    this.life = 12;
    this.phase = rand(TAU);
  }

  update(dt, game) {
    this.life -= dt;
    const d = dist(this, game.player);
    if (d < 180) {
      const pull = 680 * (1 - d / 220);
      this.vx += ((game.player.x - this.x) / Math.max(1, d)) * pull * dt;
      this.vy += ((game.player.y - this.y) / Math.max(1, d)) * pull * dt;
    }
    this.vx *= Math.pow(0.18, dt);
    this.vy *= Math.pow(0.18, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.phase += dt * 4;
    if (d < game.player.r + 15) {
      if (this.kind === "health") game.player.heal(5);
      else game.player.energy = Math.min(game.player.maxEnergy, game.player.energy + 9);
      game.spark(this.x, this.y, this.kind === "health" ? "#ef8890" : COLORS.jade, 8);
      return false;
    }
    return this.life > 0;
  }

  draw(context) {
    const color = this.kind === "health" ? "#ef8890" : COLORS.jade;
    context.save();
    context.translate(this.x, this.y + Math.sin(this.phase) * 4);
    context.rotate(this.phase * 0.4);
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = 16;
    polygon(context, [[0, -7], [6, 0], [0, 7], [-6, 0]]);
    context.fill();
    context.restore();
  }
}

class Enemy {
  constructor(type, x, y, level = 1) {
    this.id = entityId += 1;
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.phase = rand(TAU);
    this.attackTimer = rand(1.2, 0.3);
    this.specialTimer = rand(4.5, 2.2);
    this.hitFlash = 0;
    this.stun = 0;
    this.dead = false;
    this.tetherTime = 0;
    this.tetherStacks = 0;
    this.tetherBoost = 0;
    this.tetherTick = 0;
    this.networkSlowTimer = 0;
    this.networkSlow = 0;
    this.networkWeakenTimer = 0;
    this.networkWeaken = 0;
    this.state = "idle";
    this.stateTimer = 0;
    this.summonStage = 0;
    this.bossPhase = 1;
    this.bossPattern = 0;
    this.bossTier = 3;
    this.anchorCount = 7;

    const stats = {
      wraith: { hp: 52, speed: 112, damage: 9, r: 20, color: "#8ca2b0", name: "蚀影" },
      archer: { hp: 44, speed: 82, damage: 9, r: 18, color: "#d497a8", name: "烬弩手" },
      brute: { hp: 108, speed: 68, damage: 15, r: 29, color: "#bb806c", name: "界骸" },
      sentinel: { hp: 76, speed: 92, damage: 11, r: 23, color: "#9a86c7", name: "巡界灯" },
      boss: { hp: 1280, speed: 76, damage: 18, r: 52, color: "#a58ae2", name: "失序司界 · 厄衡" },
      anchor: { hp: 92, speed: 0, damage: 0, r: 25, color: "#d06aa8", name: "失序界锚" },
      dummy: { hp: 2400, speed: 0, damage: 0, r: 27, color: "#76c9bc", name: "界标傀儡" },
    }[type];
    const scale = type === "boss" ? 1 : 1 + (level - 1) * 0.13;
    this.maxHp = stats.hp * scale;
    this.hp = this.maxHp;
    this.speed = stats.speed * (1 + (level - 1) * 0.025);
    this.damage = stats.damage * scale;
    this.r = stats.r;
    this.color = stats.color;
    this.name = stats.name;
    if (type === "boss") {
      this.attackTimer = 2.2;
      this.specialTimer = 0;
    }
  }

  update(dt, game) {
    if (this.dead) return;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 6);
    this.stun = Math.max(0, this.stun - dt);
    this.attackTimer -= dt;
    this.specialTimer -= dt;
    this.stateTimer -= dt;
    this.networkSlowTimer = Math.max(0, this.networkSlowTimer - dt);
    this.networkWeakenTimer = Math.max(0, this.networkWeakenTimer - dt);
    if (this.networkSlowTimer <= 0) this.networkSlow = 0;
    if (this.networkWeakenTimer <= 0) this.networkWeaken = 0;
    this.phase += dt * (this.type === "boss" ? 0.8 : 1.5);
    this.updateTether(dt, game);
    if (this.type === "dummy" || this.type === "anchor") {
      this.vx = 0;
      this.vy = 0;
      return;
    }
    if (this.stun > 0) {
      this.vx *= Math.pow(0.02, dt);
      this.vy *= Math.pow(0.02, dt);
      return;
    }
    if (this.type === "boss") this.updateBoss(dt, game);
    else this.updateStandard(dt, game);
    game.moveActor(this, this.vx * dt, this.vy * dt);
  }

  updateTether(dt, game) {
    if (this.tetherTime <= 0) return;
    this.tetherTime -= dt;
    this.tetherBoost = Math.max(0, this.tetherBoost - dt);
    this.tetherTick -= dt;
    const d = dist(this, game.player);
    const pressure = clamp(1 - d / 510, 0, 1);
    if (pressure > 0 && this.tetherTick <= 0) {
      this.tetherTick = 0.42;
      const boost = this.tetherBoost > 0 ? this.tetherStacks : 1;
      game.damageEnemy(this, (1.8 + boost * 0.8) * pressure, "tether", 0, true);
    }
    if (this.tetherTime <= 0) {
      this.tetherStacks = 0;
      this.tetherBoost = 0;
    }
  }

  seekVelocity(game, desiredDistance = 0, orbit = 0) {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    let direction = d > desiredDistance + 35 ? 1 : d < desiredDistance - 35 ? -0.72 : 0;
    let speedFactor = 1;
    if (this.tetherTime > 0) {
      const pressure = clamp(1 - d / 510, 0, 1);
      const movingToward = direction > 0;
      speedFactor -= pressure * (movingToward ? 0.63 : 0.36) * (1 + Math.min(0.35, this.tetherStacks * 0.055));
    }
    const tangentX = -dy / d;
    const tangentY = dx / d;
    this.vx = (dx / d * direction + tangentX * orbit) * this.speed * speedFactor;
    this.vy = (dy / d * direction + tangentY * orbit) * this.speed * speedFactor;
    const networkSpeed = 1 - clamp(this.networkSlow || 0, 0, 0.7);
    this.vx *= networkSpeed;
    this.vy *= networkSpeed;
    return { dx, dy, d, angle: Math.atan2(dy, dx) };
  }

  outgoingDamage() {
    return this.damage * (1 - clamp(this.networkWeaken || 0, 0, 0.55));
  }

  updateStandard(dt, game) {
    if (this.state === "charge") {
      if (this.stateTimer > 0.5) {
        this.vx *= 0.82;
        this.vy *= 0.82;
      } else {
        this.vx = Math.cos(this.chargeAngle) * 440;
        this.vy = Math.sin(this.chargeAngle) * 440;
        if (dist(this, game.player) < this.r + game.player.r + 7 && this.attackTimer <= 0) {
          game.player.hurt(this.outgoingDamage() * 1.25, this.chargeAngle);
          this.attackTimer = 1;
        }
      }
      if (this.stateTimer <= 0) this.state = "idle";
      return;
    }

    if (this.type === "wraith") {
      const target = this.seekVelocity(game, 0, Math.sin(this.phase) * 0.12);
      if (target.d < this.r + game.player.r + 8 && this.attackTimer <= 0) {
        game.player.hurt(this.outgoingDamage(), target.angle);
        this.attackTimer = 1.15;
        this.vx *= -1.6;
        this.vy *= -1.6;
      }
    } else if (this.type === "archer") {
      const target = this.seekVelocity(game, 330, Math.sin(this.phase) * 0.44);
      if (this.attackTimer <= 0 && target.d < 620) {
        game.enemyProjectiles.push(new EnemyProjectile(this.x, this.y, target.angle, 390, this.outgoingDamage(), "#e38da1", 6));
        game.spark(this.x, this.y, "#e38da1", 4);
        this.attackTimer = 1.65;
      }
    } else if (this.type === "brute") {
      const target = this.seekVelocity(game, 0, 0);
      if (this.specialTimer <= 0 && target.d > 150 && target.d < 520) {
        this.state = "charge";
        this.stateTimer = 1.05;
        this.chargeAngle = target.angle;
        this.specialTimer = 5.2;
      } else if (target.d < this.r + game.player.r + 13 && this.attackTimer <= 0) {
        game.player.hurt(this.outgoingDamage(), target.angle);
        game.shockwave(this.x, this.y, "#c88970", 58);
        this.attackTimer = 1.7;
      }
    } else if (this.type === "sentinel") {
      const target = this.seekVelocity(game, 270, 0.72);
      if (this.attackTimer <= 0) {
        for (let i = -1; i <= 1; i += 1) {
          game.enemyProjectiles.push(new EnemyProjectile(this.x, this.y, target.angle + i * 0.18, 315, this.outgoingDamage(), "#ab91dd", 7));
        }
        this.attackTimer = 2.25;
      }
    }
  }

  updateBoss(dt, game) {
    const hpRatio = this.hp / this.maxHp;
    const target = this.seekVelocity(game, this.bossPhase >= 3 ? 205 : 275, Math.sin(this.phase) * 0.22);
    const anchorsAlive = game.enemies.some((enemy) => enemy.type === "anchor" && !enemy.dead);

    if (this.bossPhase === 1 && hpRatio <= 0.68) {
      this.bossPhase = 2;
      this.bossPattern = 0;
      this.attackTimer = 1.8;
      this.vx = 0;
      this.vy = 0;
      game.spawnBossAnchors(this);
      game.announceBossSkill(`${this.anchorCount}锚封律`, "击破全部界锚才能继续伤害厄衡", 2.8);
      return;
    }
    if (this.bossPhase === 2 && hpRatio <= 0.34 && !anchorsAlive) {
      this.bossPhase = 3;
      this.bossPattern = 0;
      this.attackTimer = 1.5;
      game.enemyProjectiles = [];
      game.announceBossSkill("失序崩解", "边界正在收束，组合裁决开始", 2.7);
      game.shockwave(this.x, this.y, "#e25a9a", 230);
      return;
    }

    if (anchorsAlive) {
      this.vx *= 0.35;
      this.vy *= 0.35;
    }
    if (this.attackTimer <= 0) {
      game.castBossPattern(this, this.bossPhase, this.bossPattern, target.angle, anchorsAlive);
      this.bossPattern += 1;
      const baseInterval = this.bossPhase === 1 ? 3.45 : this.bossPhase === 2 ? 3.05 : 2.35;
      this.attackTimer = anchorsAlive ? Math.max(2.3, baseInterval) : baseInterval;
    }
  }

  draw(context, game) {
    const tethered = this.tetherTime > 0;
    context.save();
    context.translate(pixel(this.x), pixel(this.y));
    context.globalAlpha = this.dead ? 0 : 1;
    drawPixelShadow(context, 0, this.r * 0.72, this.type === "boss" ? 96 : this.r * 1.7, 0.38);

    if (!this.drawPixelModel(context)) {
      if (this.type === "wraith") this.drawWraith(context);
      else if (this.type === "archer") this.drawArcher(context);
      else if (this.type === "brute") this.drawBrute(context);
      else if (this.type === "sentinel") this.drawSentinel(context);
      else if (this.type === "anchor") this.drawAnchor(context);
      else if (this.type === "dummy") this.drawDummy(context);
      else this.drawBoss(context);
    }

    if (this.hitFlash > 0) {
      context.globalCompositeOperation = "screen";
      context.globalAlpha = this.hitFlash * 0.65;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(0, 0, this.r + 3, 0, TAU);
      context.fill();
    }
    if (this.stun > 0) {
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      for (let i = 0; i < 3; i += 1) {
        const a = this.phase * 3 + (i / 3) * TAU;
        context.fillStyle = COLORS.force;
        context.fillRect(Math.cos(a) * (this.r + 10) - 2, -this.r - 12 + Math.sin(a) * 5, 4, 4);
      }
    }
    context.restore();

    if (this.type !== "boss" && (this.hp < this.maxHp || tethered)) {
      const w = this.r * 2.1;
      ctx.fillStyle = "rgba(4,7,11,0.72)";
      ctx.fillRect(this.x - w / 2, this.y - this.r - 17, w, 4);
      ctx.fillStyle = tethered ? COLORS.force : "#d66f78";
      ctx.fillRect(this.x - w / 2, this.y - this.r - 17, w * clamp(this.hp / this.maxHp, 0, 1), 4);
    }
  }

  drawPixelModel(context) {
    const index = {
      wraith: PIXEL_ENTITY.wraith,
      archer: PIXEL_ENTITY.archer,
      brute: PIXEL_ENTITY.brute,
      sentinel: PIXEL_ENTITY.sentinel,
      anchor: PIXEL_ENTITY.anchor,
      dummy: PIXEL_ENTITY.dummy,
      boss: this.bossPhase >= 3 ? PIXEL_ENTITY.bossEnraged : PIXEL_ENTITY.boss,
    }[this.type];
    if (index === undefined) return false;
    const size = this.type === "boss" ? 230 : this.type === "brute" ? 146 : this.type === "anchor" ? 142 : 126;
    const bob = this.type === "wraith" || this.type === "sentinel" || this.type === "boss"
      ? pixel(Math.sin(this.phase * 2) * 3)
      : 0;
    return drawAtlasCell(context, pixelAtlases.entity, index, 4, 4, 0, -size * 0.16 + bob, size, size, {
      flipX: this.vx < -2,
    });
  }

  drawWraith(context) {
    const bob = Math.sin(this.phase * 2) * 3;
    context.translate(0, bob);
    context.fillStyle = this.color;
    context.shadowColor = this.color;
    context.shadowBlur = 12;
    polygon(context, [[0, -22], [18, -5], [12, 22], [0, 14], [-12, 22], [-18, -5]]);
    context.fill();
    context.fillStyle = "#101821";
    context.beginPath();
    context.arc(0, -7, 10, 0, TAU);
    context.fill();
    context.fillStyle = "#e8aab3";
    context.fillRect(-6, -8, 3, 2);
    context.fillRect(3, -8, 3, 2);
  }

  drawArcher(context) {
    context.rotate(Math.atan2(this.vy, this.vx) || 0);
    context.fillStyle = "#533f4b";
    polygon(context, [[-17, -17], [14, -13], [19, 0], [14, 15], [-18, 18], [-10, 0]]);
    context.fill();
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(0, -3, 12, 0, TAU);
    context.fill();
    context.strokeStyle = "#e1b4be";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(10, 0, 16, -1.2, 1.2);
    context.stroke();
  }

  drawBrute(context) {
    context.rotate(Math.atan2(this.vy, this.vx) || 0);
    context.fillStyle = "#553b37";
    polygon(context, [[-27, -22], [18, -28], [30, -10], [27, 22], [-22, 28], [-31, 0]]);
    context.fill();
    context.strokeStyle = this.color;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-17, -19);
    context.lineTo(17, 20);
    context.moveTo(-20, 14);
    context.lineTo(20, -17);
    context.stroke();
    context.fillStyle = "#e8b096";
    context.beginPath();
    context.arc(12, 0, 5, 0, TAU);
    context.fill();
  }

  drawSentinel(context) {
    context.rotate(this.phase);
    context.strokeStyle = this.color;
    context.lineWidth = 5;
    context.shadowColor = this.color;
    context.shadowBlur = 16;
    for (let i = 0; i < 4; i += 1) {
      context.rotate(Math.PI / 2);
      context.beginPath();
      context.moveTo(9, 0);
      context.lineTo(24, -7);
      context.lineTo(20, 8);
      context.stroke();
    }
    context.fillStyle = "#251f35";
    context.beginPath();
    context.arc(0, 0, 16, 0, TAU);
    context.fill();
    context.fillStyle = "#d2bdff";
    context.beginPath();
    context.arc(0, 0, 6, 0, TAU);
    context.fill();
  }

  drawAnchor(context) {
    context.rotate(-this.phase * 0.65);
    context.shadowColor = this.color;
    context.shadowBlur = 20;
    context.strokeStyle = this.color;
    context.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      context.rotate(TAU / 3);
      polygon(context, [[7, -5], [30, 0], [7, 5], [14, 0]]);
      context.stroke();
    }
    context.fillStyle = "#241526";
    context.beginPath();
    context.arc(0, 0, 16, 0, TAU);
    context.fill();
    context.strokeStyle = "#f2b5dc";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(0, 0, 10, 0, TAU);
    context.stroke();
    context.fillStyle = "#ee5d9d";
    polygon(context, [[0, -8], [5, 0], [0, 8], [-5, 0]]);
    context.fill();
  }

  drawDummy(context) {
    context.rotate(Math.sin(this.phase) * 0.04);
    context.fillStyle = "#25393d";
    polygon(context, [[-20, -15], [0, -27], [20, -15], [24, 17], [0, 28], [-24, 17]]);
    context.fill();
    context.strokeStyle = "rgba(118,201,188,0.7)";
    context.lineWidth = 2;
    context.shadowColor = this.color;
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(0, 0, 17, 0, TAU);
    context.stroke();
    for (let i = 0; i < 4; i += 1) {
      context.rotate(Math.PI / 2);
      context.beginPath();
      context.moveTo(7, 0);
      context.lineTo(24, 0);
      context.stroke();
    }
    context.fillStyle = "#0b171b";
    context.beginPath();
    context.arc(0, 0, 10, 0, TAU);
    context.fill();
    context.fillStyle = this.tetherTime > 0 ? COLORS.force : COLORS.jade;
    polygon(context, [[0, -7], [6, 0], [0, 7], [-6, 0]]);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#151f22";
    context.fillRect(-5, 27, 10, 22);
    context.fillStyle = "#31474a";
    context.fillRect(-17, 45, 34, 7);
  }

  drawBoss(context) {
    // Seven calibration blades form the boss's readable outer silhouette.
    context.save();
    context.rotate(this.phase * (this.bossPhase >= 3 ? 0.42 : 0.2));
    context.shadowColor = this.bossPhase >= 3 ? "#ec4d91" : this.color;
    context.shadowBlur = 24;
    context.strokeStyle = this.bossPhase >= 3 ? "#e85b9d" : "#aa8bda";
    context.fillStyle = "rgba(53,35,72,0.72)";
    context.lineWidth = 3;
    for (let i = 0; i < 7; i += 1) {
      context.rotate(TAU / 7);
      polygon(context, [[30, -8], [72, 0], [30, 8], [43, 0]]);
      context.fill();
      context.stroke();
      context.fillStyle = "#d35d9c";
      context.beginPath();
      context.arc(49, 0, 3.5, 0, TAU);
      context.fill();
      context.fillStyle = "rgba(53,35,72,0.72)";
    }
    context.restore();

    if (this.bossPhase === 2) {
      context.strokeStyle = "rgba(232,91,157,0.58)";
      context.lineWidth = 4;
      context.setLineDash([8, 7]);
      context.lineDashOffset = -this.phase * 20;
      context.beginPath();
      context.arc(0, 0, 63 + Math.sin(this.phase * 4) * 3, 0, TAU);
      context.stroke();
      context.setLineDash([]);
    }

    // Ceremonial body, split porcelain mask and exposed star-map core.
    context.fillStyle = "#15111f";
    polygon(context, [[-30, -30], [0, -43], [30, -30], [43, 20], [18, 48], [0, 37], [-18, 48], [-43, 20]]);
    context.fill();
    context.fillStyle = "#373043";
    polygon(context, [[-27, -23], [-8, -35], [-13, 34], [-35, 23]]);
    context.fill();
    context.fillStyle = "#30293c";
    polygon(context, [[27, -23], [8, -35], [13, 34], [35, 23]]);
    context.fill();
    context.strokeStyle = "#b5a9b6";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-31, -20);
    context.lineTo(-46, 22);
    context.moveTo(31, -20);
    context.lineTo(46, 22);
    context.stroke();

    context.fillStyle = "#d8d0c6";
    context.shadowColor = "#d9c8de";
    context.shadowBlur = 8;
    polygon(context, [[0, -40], [17, -28], [13, -7], [0, 3], [-13, -7], [-17, -28]]);
    context.fill();
    context.strokeStyle = "#69536e";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(-10, -30);
    context.lineTo(8, -13);
    context.moveTo(9, -33);
    context.lineTo(-5, -9);
    context.stroke();
    context.fillStyle = "#ee4d8d";
    context.shadowColor = "#ee4d8d";
    context.shadowBlur = 18;
    polygon(context, [[0, -33], [3, -21], [0, -10], [-3, -21]]);
    context.fill();

    context.fillStyle = "#1c1022";
    context.beginPath();
    context.arc(0, 18, 17, 0, TAU);
    context.fill();
    context.strokeStyle = this.bossPhase >= 3 ? "#ff598e" : "#d874b7";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 18, 13 + Math.sin(this.phase * 5) * 2, 0, TAU);
    context.stroke();
    context.rotate(-this.phase * 0.8);
    context.fillStyle = "#f1609a";
    polygon(context, [[0, 8], [9, 18], [0, 28], [-9, 18]]);
    context.fill();
  }
}

class RobotBolt extends Arrow {
  constructor(robot, target, damage) {
    const angle = Math.atan2(target.y - robot.y, target.x - robot.x);
    super(robot.x, robot.y, angle, damage, "tech", "robot", 0.45);
    this.robot = robot;
    this.config = robot.config;
    this.speed = 760;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.radius = 6;
    this.pierce = 1;
  }

  color() {
    return this.config.color;
  }

  onHit(enemy, game) {
    if (!this.robot || this.robot.dead) {
      this.dead = true;
      return;
    }
    const owner = this.robot.owner;
    game.recordTutorialHit("robot", enemy, "robot");
    let damage = this.damage * owner.robotDamageMod;
    enemy.networkSlowTimer = Math.max(enemy.networkSlowTimer || 0, this.config.key === "control" ? 1.8 : 1.1);
    enemy.networkSlow = Math.max(enemy.networkSlow || 0, this.config.key === "control" ? 0.42 : this.config.key === "enhance" ? 0.3 : 0.16);
    enemy.stun = Math.max(enemy.stun, this.config.key === "control" ? 0.34 * owner.robotControlMod : 0.1);
    if (this.config.key === "enhance") {
      enemy.networkWeakenTimer = Math.max(enemy.networkWeakenTimer || 0, 2.4);
      enemy.networkWeaken = Math.max(enemy.networkWeaken || 0, 0.16 * owner.robotEnhanceMod);
    }
    if (this.config.key === "healing") this.robot.repair(4.2 * owner.robotHealMod);
    const energyGain = this.config.key === "energy" ? 8.5 : 4.5;
    this.robot.energy = Math.min(this.robot.maxEnergy, this.robot.energy + energyGain * owner.robotEnergyMod);
    game.damageEnemy(enemy, damage, "tech", this.angle);
    game.shockwave(enemy.x, enemy.y, this.config.color, enemy.r + 12);
    this.dead = true;
  }

  draw(context) {
    const color = this.config.color;
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);
    context.shadowColor = color;
    context.shadowBlur = 18;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 2.5;
    context.globalAlpha = 0.3;
    context.fillRect(-31, -3, 34, 6);
    context.globalAlpha = 1;
    if (this.config.key === "healing") {
      for (let i = 0; i < 4; i += 1) {
        context.rotate(Math.PI / 2);
        context.beginPath();
        context.ellipse(3, 0, 9, 3.5, 0, 0, TAU);
        context.fill();
      }
      context.fillStyle = "#eafff8";
      context.fillRect(-2, -6, 4, 12);
      context.fillRect(-6, -2, 12, 4);
    } else if (this.config.key === "energy") {
      context.beginPath();
      context.arc(0, 0, 8, 0, TAU);
      context.stroke();
      context.beginPath();
      context.arc(0, 0, 3, 0, TAU);
      context.fill();
      context.moveTo(7, -5); context.lineTo(15, 0); context.lineTo(7, 5);
      context.stroke();
    } else if (this.config.key === "control") {
      polygon(context, [[15, 0], [2, -7], [-4, 0], [2, 7]]);
      context.fill();
      context.globalAlpha = 0.65;
      context.strokeRect(-17, -7, 11, 14);
    } else {
      polygon(context, [[16, 0], [2, -9], [6, -3], [-8, 0], [6, 3], [2, 9]]);
      context.fill();
      context.globalAlpha = 0.5;
      context.beginPath();
      context.arc(-5, 0, 11, -0.8, 0.8);
      context.stroke();
    }
    context.restore();
  }
}

class SupportRobot {
  constructor(owner, configIndex, index) {
    this.id = entityId += 1;
    this.owner = owner;
    this.game = owner.game;
    this.configIndex = configIndex;
    this.x = owner.x + Math.cos(index * 1.7) * 54;
    this.y = owner.y + Math.sin(index * 1.7) * 54;
    this.r = 16;
    this.phase = rand(TAU);
    this.energy = 27;
    this.maxEnergy = 44;
    this.durability = 56 * owner.robotDurabilityMod;
    this.maxDurability = this.durability;
    this.attackTimer = rand(1.1, 0.25);
    this.bound = true;
    this.dead = false;
    this.hitFlash = 0;
    this.attackFlash = 0;
    this.currentTarget = null;
  }

  get config() {
    return ROBOT_CONFIGS[this.configIndex];
  }

  update(dt, index, total) {
    if (this.dead) return;
    this.phase += dt * (1.2 + index * 0.05);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 5);
    this.attackFlash = Math.max(0, this.attackFlash - dt * 7);
    this.energy = Math.min(this.maxEnergy, this.energy + dt * 1.15 * this.owner.robotEnergyMod);
    const spacing = Math.min(TAU / Math.max(1, total), 1.05);
    const angle = this.phase * 0.34 + index * spacing - Math.PI / 2;
    const orbit = 54 + Math.floor(index / 6) * 24;
    const targetX = this.owner.x + Math.cos(angle) * orbit;
    const targetY = this.owner.y - 24 + Math.sin(angle) * orbit * 0.68;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const response = 1 - Math.pow(0.006, dt);
    this.x += dx * response;
    this.y += dy * response;
    this.game.resolveObstacleOverlap(this);

    if (this.bound && this.energy > 0.5) {
      const resourceRate = (this.config.key === "energy" ? 2.25 : 1.15) * this.owner.robotEnergyMod;
      const spend = Math.min(this.energy, dt * (this.config.key === "energy" ? 2.8 : 1.9));
      this.energy -= spend;
      this.owner.energy = Math.min(this.owner.maxEnergy, this.owner.energy + dt * resourceRate);
      if (this.config.key === "healing" && this.owner.hp < this.owner.maxHp && this.energy > 1) {
        this.energy = Math.max(0, this.energy - dt * 1.35);
        this.owner.heal(dt * 0.72 * this.owner.robotHealMod);
      }
    }

    const speedScale = this.owner.effectiveAttackSpeed() * this.owner.effectiveCooldownRate();
    this.attackTimer -= dt * speedScale;
    const ownerTarget = this.owner.lastAttackTargetTimer > 0 && this.owner.lastAttackTarget && !this.owner.lastAttackTarget.dead
      && Math.hypot(this.owner.lastAttackTarget.x - this.x, this.owner.lastAttackTarget.y - this.y) <= 820
      ? this.owner.lastAttackTarget
      : null;
    const target = ownerTarget || this.game.nearestEnemy(this.x, this.y, 650);
    this.currentTarget = target;
    if (target && this.attackTimer <= 0) {
      const base = this.config.key === "enhance" ? 8.4 : this.config.key === "control" ? 6.4 : 7.2;
      this.game.arrows.push(new RobotBolt(this, target, base * this.owner.effectiveDamage()));
      this.attackFlash = 1;
      this.attackTimer = this.config.key === "energy" ? 1.25 : 1.52;
      this.game.sound.tone(330 + this.configIndex * 75, 0.08, "triangle", 0.035, 95, { pan: clamp((this.x - W / 2) / 700, -1, 1) });
    }
  }

  repair(amount) {
    this.durability = Math.min(this.maxDurability, this.durability + amount);
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.durability -= amount;
    this.energy = Math.min(this.maxEnergy, this.energy + amount * 0.42 * this.owner.robotEnergyMod);
    this.hitFlash = 1;
    this.game.spark(this.x, this.y, this.config.color, 6);
    if (this.durability <= 0) this.explode();
  }

  explode(recycled = false) {
    if (this.dead) return;
    this.dead = true;
    if (!recycled) {
      const damage = 18 * this.owner.robotDamageMod;
      for (const enemy of this.game.enemies) {
        const distance = dist(this, enemy);
        if (distance <= 105 + enemy.r) this.game.damageEnemy(enemy, damage * (1 - clamp(distance / 150, 0, 0.65)), "tech", Math.atan2(enemy.y - this.y, enemy.x - this.x));
      }
      this.owner.energy = Math.min(this.owner.maxEnergy, this.owner.energy + this.energy * 0.7);
      this.game.shockwave(this.x, this.y, this.config.color, 105);
      this.game.spark(this.x, this.y, this.config.color, 18);
    }
  }

  draw(context) {
    const config = this.config;
    const pulse = 0.5 + Math.sin(this.phase * 4.5) * 0.5;
    const aim = this.currentTarget
      ? Math.atan2(this.currentTarget.y - this.y, this.currentTarget.x - this.x)
      : this.phase * 0.3;
    context.save();
    context.translate(pixel(this.x), pixel(this.y + Math.sin(this.phase * 2.6) * 2.2));
    context.globalAlpha = this.bound ? 1 : 0.5;
    drawPixelShadow(context, 0, 16, 38, 0.34);
    const spriteDrawn = drawAtlasCell(context, pixelAtlases.entity, PIXEL_ENTITY.robotHealing + this.configIndex, 4, 4, 0, -10, 96, 96, {
      flipX: Math.cos(aim) < 0,
    });
    if (!spriteDrawn) {
      context.save();
      context.rotate(aim);
      if (config.key === "healing") this.drawHealingModel(context, pulse);
      else if (config.key === "energy") this.drawEnergyModel(context, pulse);
      else if (config.key === "control") this.drawControlModel(context, pulse);
      else this.drawEnhanceModel(context, pulse);
      context.restore();
    }

    if (this.attackFlash > 0) {
      context.save();
      context.rotate(aim);
      context.globalAlpha = this.attackFlash;
      context.fillStyle = "#f4fffd";
      polygon(context, [[19, 0], [8, -6], [7, 6]]);
      context.fill();
      context.restore();
    }

    context.strokeStyle = this.hitFlash > 0 ? "#fff" : "rgba(220,239,236,0.38)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + TAU * (this.durability / this.maxDurability));
    context.stroke();
    context.strokeStyle = `${config.color}66`;
    context.beginPath();
    context.arc(0, 0, 19.5, Math.PI / 2, Math.PI / 2 + TAU * (this.energy / this.maxEnergy));
    context.stroke();
    if (!this.bound) {
      context.strokeStyle = "rgba(190,204,207,0.38)";
      context.setLineDash([3, 4]);
      context.beginPath();
      context.arc(0, 0, 28, 0, TAU);
      context.stroke();
    }
    context.restore();
  }

  drawHealingModel(context, pulse) {
    context.save();
    context.rotate(this.phase * 0.9);
    context.fillStyle = "rgba(197,255,229,0.72)";
    context.strokeStyle = this.config.color;
    context.lineWidth = 1.5;
    for (let i = 0; i < 4; i += 1) {
      context.rotate(Math.PI / 2);
      context.beginPath();
      context.ellipse(0, -13 - pulse * 2, 6.5, 12, 0, 0, TAU);
      context.fill();
      context.stroke();
    }
    context.restore();
    context.fillStyle = "#10252a";
    context.strokeStyle = "#bfffe3";
    context.lineWidth = 2;
    roundedRectPath(context, -12, -10, 24, 20, 7);
    context.fill();
    context.stroke();
    context.fillStyle = this.config.color;
    context.fillRect(-2, -8, 4, 16);
    context.fillRect(-8, -2, 16, 4);
  }

  drawEnergyModel(context, pulse) {
    context.save();
    context.rotate(-this.phase * 1.35);
    context.strokeStyle = this.config.color;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, 16 + pulse * 2, 0.25, 2.4);
    context.arc(0, 0, 16 + pulse * 2, 3.4, 5.75);
    context.stroke();
    for (let i = 0; i < 4; i += 1) {
      context.rotate(Math.PI / 2);
      context.fillStyle = "#183a50";
      roundedRectPath(context, 10, -4, 12, 8, 2);
      context.fill();
      context.strokeRect(11, -3, 9, 6);
    }
    context.restore();
    context.fillStyle = "#081b2a";
    context.strokeStyle = "#a6dcff";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, 11, 0, TAU);
    context.fill();
    context.stroke();
    context.save();
    context.rotate(this.phase * 2.2);
    context.fillStyle = this.config.color;
    for (let i = 0; i < 3; i += 1) {
      context.rotate(TAU / 3);
      polygon(context, [[2, -2], [10, 0], [2, 3]]);
      context.fill();
    }
    context.restore();
  }

  drawControlModel(context, pulse) {
    const jaw = 3 + this.attackFlash * 4;
    context.fillStyle = "#171327";
    context.strokeStyle = this.config.color;
    context.lineWidth = 2;
    polygon(context, [[-15, 0], [0, -14], [15, 0], [0, 14]]);
    context.fill();
    context.stroke();
    context.fillStyle = "#30244d";
    polygon(context, [[-23, -12 - jaw], [-7, -8], [-13, -1], [-27, -3]]);
    context.fill();
    polygon(context, [[-23, 12 + jaw], [-7, 8], [-13, 1], [-27, 3]]);
    context.fill();
    context.strokeStyle = `rgba(208,185,255,${0.42 + pulse * 0.4})`;
    context.setLineDash([3, 3]);
    context.beginPath();
    context.arc(0, 0, 19 + pulse * 2, -1.15, 1.15);
    context.stroke();
    context.setLineDash([]);
  }

  drawEnhanceModel(context, pulse) {
    context.save();
    context.rotate(this.phase * 0.7);
    context.strokeStyle = this.config.color;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, 18 + pulse * 2, 0, TAU);
    context.stroke();
    for (let i = 0; i < 3; i += 1) {
      context.rotate(TAU / 3);
      context.fillStyle = "rgba(228,185,104,0.5)";
      polygon(context, [[10, -5], [27, 0], [10, 5], [15, 0]]);
      context.fill();
      context.stroke();
    }
    context.restore();
    context.fillStyle = "#2c2418";
    context.strokeStyle = "#ffe1a0";
    context.lineWidth = 2;
    polygon(context, [[0, -13], [12, -5], [10, 10], [0, 14], [-10, 10], [-12, -5]]);
    context.fill();
    context.stroke();
    context.strokeStyle = this.config.color;
    context.beginPath();
    context.moveTo(-8, 0); context.lineTo(0, -8); context.lineTo(8, 0); context.lineTo(0, 8); context.closePath();
    context.stroke();
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.characterId = "xingyao";
    this.x = W / 2;
    this.y = H / 2;
    this.r = 18;
    this.maxHp = 72;
    this.hp = this.maxHp;
    this.maxEnergy = 52;
    this.energy = 30;
    this.baseSpeed = 210;
    this.facing = 0;
    this.charge = 0;
    this.attackCooldown = 0;
    this.baseAttackInterval = 0.86;
    this.invulnerable = 0;
    this.hurtFlash = 0;
    this.rollTimer = 0;
    this.rollDir = { x: 1, y: 0 };
    this.rollVolley = false;
    this.rollCharges = 2;
    this.maxRollCharges = 2;
    this.rollRecharge = 0;
    this.rollRechargeTime = 6.2;
    this.magicIndex = 0;
    this.spiritActive = true;
    this.spiritX = this.x - 40;
    this.spiritY = this.y - 40;
    this.spiritPhase = 0;
    this.spiritShotTimer = 1.2;
    this.spiritForceTimer = 3.5;
    this.qCooldown = 0;
    this.qCooldownMax = 3.5;
    this.danceTimer = 0;
    this.danceCooldown = 0;
    this.danceCooldownMax = 18;
    this.danceDuration = 7;
    this.lastMove = { x: 1, y: 0 };
    this.stepPhase = 0;
    this.magicUnlocked = false;
    this.rollUnlocked = false;
    this.danceUnlocked = false;

    this.damageMod = 1;
    this.chargeMod = 1;
    this.speedMod = 1;
    this.attackSpeedMod = 1;
    this.cooldownMod = 1;
    this.magicCostMod = 1;
    this.healMod = 1;
    this.tetherMod = 1;
    this.rollDamageMod = 1;
    this.extraVolley = 0;
    this.critChance = 0.02;
  }

  get currentMagic() {
    return MAGIC[this.magicIndex];
  }

  get dancing() {
    return this.danceTimer > 0;
  }

  update(dt) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3.3);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.qCooldown = Math.max(0, this.qCooldown - dt * this.effectiveCooldownRate());
    this.danceCooldown = Math.max(0, this.danceCooldown - dt * this.effectiveCooldownRate());
    this.stepPhase += dt * 8;

    if (this.rollCharges < this.maxRollCharges) {
      this.rollRecharge += dt * this.effectiveCooldownRate();
      if (this.rollRecharge >= this.rollRechargeTime) {
        this.rollRecharge -= this.rollRechargeTime;
        this.rollCharges += 1;
        this.game.sound.tone(520, 0.15, "sine", 0.06, 120);
      }
    } else {
      this.rollRecharge = 0;
    }

    if (this.dancing) {
      this.danceTimer -= dt;
      this.energy = Math.max(0, this.energy - 9.5 * dt);
      if (this.energy <= 0 || this.danceTimer <= 0) this.endDance();
      if (Math.random() < dt * 22) {
        const a = rand(TAU);
        this.game.effects.push(new Effect("particle", this.x + Math.cos(a) * rand(45, 18), this.y + Math.sin(a) * rand(45, 18), {
          vx: Math.cos(a + Math.PI) * 45,
          vy: Math.sin(a + Math.PI) * 45,
          color: this.currentMagic.color,
          life: 0.45,
          size: 5,
          rotation: a,
        }));
      }
    }

    if (this.rollTimer > 0) {
      this.rollTimer -= dt;
      this.invulnerable = Math.max(this.invulnerable, 0.08);
      this.game.moveActor(this, this.rollDir.x * 630 * dt, this.rollDir.y * 630 * dt);
      if (!this.rollVolley && this.rollTimer < 0.28) {
        this.rollVolley = true;
        this.fireRollVolley();
      }
      if (Math.random() < dt * 46) {
        this.game.effects.push(new Effect("particle", this.x, this.y, {
          vx: -this.rollDir.x * rand(150, 70) + rand(35, -35),
          vy: -this.rollDir.y * rand(150, 70) + rand(35, -35),
          color: this.currentMagic.color,
          life: 0.32,
          size: 8,
          rotation: Math.atan2(this.rollDir.y, this.rollDir.x),
        }));
      }
    } else {
      this.updateMovement(dt);
      this.updateCharge(dt);
    }

    this.updateSpirit(dt);
  }

  effectiveCooldownRate() {
    let rate = this.cooldownMod;
    if (this.dancing) rate *= this.spiritActive ? 1.32 : 1.55;
    return rate;
  }

  effectiveAttackSpeed() {
    let rate = this.attackSpeedMod;
    if (this.dancing) rate *= this.spiritActive ? 1.28 : 1.48;
    return rate;
  }

  effectiveChargeRate() {
    let rate = this.chargeMod;
    if (!this.spiritActive) rate *= 1.28;
    if (this.dancing) rate *= this.spiritActive ? 1.12 : 1.2;
    return rate;
  }

  effectiveDamage() {
    let value = this.damageMod;
    if (!this.spiritActive) value *= 1.18;
    return value;
  }

  updateMovement(dt) {
    let dx = 0;
    let dy = 0;
    if (input.keys.has("KeyA")) dx -= 1;
    if (input.keys.has("KeyD")) dx += 1;
    if (input.keys.has("KeyW")) dy -= 1;
    if (input.keys.has("KeyS")) dy += 1;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
      this.lastMove = { x: dx, y: dy };
      const danceSpeed = this.dancing ? (this.spiritActive ? 1.22 : 1.34) : 1;
      const stepDistance = this.baseSpeed * this.speedMod * danceSpeed * dt;
      this.game.moveActor(this, dx * stepDistance, dy * stepDistance);
      this.game.stats.moveDistance += stepDistance;
    }
    this.facing = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);
  }

  updateCharge(dt) {
    if (input.mouse.down && this.attackCooldown <= 0) {
      this.charge = Math.min(1, this.charge + dt * 0.82 * this.effectiveChargeRate());
      if (this.charge >= 1 && Math.random() < dt * 12) {
        const a = rand(TAU);
        this.game.effects.push(new Effect("particle", this.x + Math.cos(a) * 35, this.y + Math.sin(a) * 35, {
          vx: -Math.cos(a) * 70,
          vy: -Math.sin(a) * 70,
          color: COLORS.gold,
          life: 0.34,
          size: 4,
          rotation: a + Math.PI,
        }));
      }
    }
    if (input.mouse.released && this.charge > 0.05) this.shoot();
  }

  shoot() {
    const charge = this.charge;
    this.charge = 0;
    this.attackCooldown = this.baseAttackInterval / this.effectiveAttackSpeed();
    const crit = Math.random() < this.critChance;
    const baseDamage = (9 + charge * 23) * this.effectiveDamage() * (crit ? 1.65 : 1);
    const muzzleX = this.x + Math.cos(this.facing) * 25;
    const muzzleY = this.y + Math.sin(this.facing) * 25;
    this.game.arrows.push(new Arrow(muzzleX, muzzleY, this.facing, baseDamage, "normal", "player", charge));
    this.game.sound.shot(charge);
    this.game.stats.shots += 1;
    if (crit) this.game.floatText(this.x, this.y - 32, "会心", COLORS.gold, 13);

    const magic = this.currentMagic;
    const cost = magic.cost * this.magicCostMod;
    if (this.magicUnlocked && this.energy >= cost) {
      this.energy -= cost;
      let magicDamage = baseDamage * (magic.key === "meteor" ? 0.66 : 0.57);
      if (this.dancing) magicDamage *= 1.38;
      this.game.arrows.push(new Arrow(muzzleX - Math.sin(this.facing) * 6, muzzleY + Math.cos(this.facing) * 6, this.facing, magicDamage, magic.key, "player", charge));
      this.game.sound.magic(magic.key);
    }
  }

  switchMagic() {
    if (!this.magicUnlocked) {
      this.game.showToast("魔法箭尚未解锁 · 在星痕中寻找界律");
      return;
    }
    this.magicIndex = (this.magicIndex + 1) % MAGIC.length;
    this.game.stats.switches += 1;
    this.game.showToast(`魔法箭 · ${this.currentMagic.name}`);
    this.game.sound.tone(360 + this.magicIndex * 100, 0.22, "sine", 0.11, 140);
    this.game.shockwave(this.x, this.y, this.currentMagic.color, 40);
    this.game.pixelBurst(this.x, this.y - 14, this.currentMagic.key, 92, 0.42);
  }

  toggleSpirit() {
    if (this.qCooldown > 0) return;
    this.spiritActive = !this.spiritActive;
    this.game.stats.spiritToggles += 1;
    this.qCooldown = this.qCooldownMax;
    if (this.spiritActive) {
      this.spiritX = this.x - 28;
      this.spiritY = this.y - 28;
      this.game.showToast("契灵回应了星弦");
    } else {
      this.game.showToast("契灵归弦 · 专精强化");
    }
    this.game.shockwave(this.x, this.y, this.spiritActive ? COLORS.jade : COLORS.gold, 74);
    this.game.sound.chime();
  }

  updateSpirit(dt) {
    if (!this.spiritActive) return;
    this.spiritPhase += dt * 1.7;
    const targetX = this.x + Math.cos(this.spiritPhase) * 58;
    const targetY = this.y - 45 + Math.sin(this.spiritPhase * 1.3) * 22;
    this.spiritX = lerp(this.spiritX, targetX, 1 - Math.pow(0.002, dt));
    this.spiritY = lerp(this.spiritY, targetY, 1 - Math.pow(0.002, dt));
    this.energy = Math.min(this.maxEnergy, this.energy + 3 * dt);
    const speedScale = this.effectiveAttackSpeed() * this.effectiveCooldownRate() * (this.dancing ? 1.25 : 1);
    this.spiritShotTimer -= dt * speedScale;
    this.spiritForceTimer -= dt * speedScale;
    const target = this.game.nearestEnemy(this.spiritX, this.spiritY, 650);
    if (target && this.spiritShotTimer <= 0) {
      const angle = Math.atan2(target.y - this.spiritY, target.x - this.spiritX);
      const damage = (this.magicUnlocked ? 9 : 7) * this.effectiveDamage() * (this.dancing ? 1.35 : 1);
      const arrowKind = this.magicUnlocked ? this.currentMagic.key : "normal";
      this.game.arrows.push(new Arrow(this.spiritX, this.spiritY, angle, damage, arrowKind, "spirit", 0.55));
      this.spiritShotTimer = 2.05;
      if (this.magicUnlocked) this.game.sound.magic(this.currentMagic.key);
      else this.game.sound.shot(0.35);
    }
    if (target && this.spiritForceTimer <= 0) {
      const angle = Math.atan2(target.y - this.spiritY, target.x - this.spiritX);
      this.game.arrows.push(new Arrow(this.spiritX, this.spiritY, angle, 11 * this.effectiveDamage(), "force", "spirit", 0.65));
      this.spiritForceTimer = 5.4;
      this.game.sound.magic("force");
    }
  }

  startRoll() {
    if (!this.rollUnlocked) {
      this.game.showToast("翻滚齐射尚未解锁 · 在星痕中寻找界律");
      return;
    }
    if (this.rollCharges <= 0 || this.rollTimer > 0) return;
    let dx = 0;
    let dy = 0;
    if (input.keys.has("KeyA")) dx -= 1;
    if (input.keys.has("KeyD")) dx += 1;
    if (input.keys.has("KeyW")) dy -= 1;
    if (input.keys.has("KeyS")) dy += 1;
    if (Math.hypot(dx, dy) < 0.1) {
      dx = Math.cos(this.facing);
      dy = Math.sin(this.facing);
    } else {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
    }
    this.rollDir = { x: dx, y: dy };
    this.rollTimer = 0.43;
    this.rollVolley = false;
    this.rollCharges -= 1;
    this.game.stats.rollUses += 1;
    this.invulnerable = 0.48;
    this.charge = 0;
    this.game.sound.roll();
    this.game.shockwave(this.x, this.y, this.currentMagic.color, 36);
    this.game.pixelBurst(this.x, this.y, "dodge", 118, 0.36, Math.atan2(this.rollDir.y, this.rollDir.x));
  }

  fireRollVolley() {
    const enemies = this.game.enemies.filter((enemy) => !enemy.dead).sort((a, b) => dist(a, this) - dist(b, this));
    if (!enemies.length) return;
    const forceCount = Math.min(enemies.length, 2 + Math.floor((this.damageMod - 1) * 3) + this.extraVolley);
    const magicCount = Math.min(enemies.length + 1, 3 + this.extraVolley);
    for (let i = 0; i < forceCount; i += 1) {
      const enemy = enemies[i % enemies.length];
      const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x) + rand(0.06, -0.06);
      this.game.arrows.push(new Arrow(this.x, this.y, angle, 10 * this.effectiveDamage() * this.rollDamageMod, "force", "player", 0.62));
    }
    for (let i = 0; i < magicCount; i += 1) {
      const enemy = enemies[(i + 1) % enemies.length];
      const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x) + rand(0.08, -0.08);
      const arrowKind = this.magicUnlocked ? this.currentMagic.key : "normal";
      this.game.arrows.push(new Arrow(this.x, this.y, angle, 9 * this.effectiveDamage() * this.rollDamageMod, arrowKind, "player", 0.55));
    }
    this.game.sound.magic("force");
    this.game.stats.rollVolleys += 1;
  }

  startDance() {
    if (!this.danceUnlocked) {
      this.game.showToast("灵舞尚未解锁 · 在星痕中寻找界律");
      return;
    }
    if (this.danceCooldown > 0 || this.dancing || this.energy < 24) return;
    this.danceTimer = this.danceDuration;
    this.game.stats.danceUses += 1;
    this.danceCooldown = this.danceCooldownMax;
    this.game.showToast("灵舞 · 星轨展开");
    this.game.shockwave(this.x, this.y, this.currentMagic.color, 130);
    this.game.pixelBurst(this.x, this.y - 18, "enhance", 180, 0.62);
    this.game.sound.tone(220, 0.5, "sine", 0.14, 440);
  }

  endDance() {
    const shouldAnnounce = this.danceTimer !== 0;
    this.danceTimer = 0;
    if (shouldAnnounce) this.game.showToast("灵舞止息");
  }

  onMagicHit(kind, fromSpirit) {
    const low = kind === "light" || kind === "meteor";
    let reduction = low ? 0.15 : 0.26;
    if (fromSpirit) reduction *= 1.7;
    this.qCooldown = Math.max(0, this.qCooldown - reduction);
    this.danceCooldown = Math.max(0, this.danceCooldown - reduction);
    if (this.rollCharges < this.maxRollCharges) this.rollRecharge += reduction * 1.35;
    this.game.stats.magicHits += 1;
  }

  heal(amount) {
    if (this.hp <= 0) return;
    const value = amount * this.healMod;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + value);
    if (this.hp > before + 0.2) this.game.floatText(this.x, this.y - 28, `+${Math.ceil(this.hp - before)}`, "#9fcbff", 14);
  }

  hurt(amount, angle) {
    if (this.invulnerable > 0 || this.hp <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerable = 0.66;
    this.hurtFlash = 1;
    this.game.shake = Math.max(this.game.shake, 10);
    this.game.sound.hurt();
    this.game.floatText(this.x, this.y - 30, `-${Math.ceil(amount)}`, "#ff8993", 16);
    this.game.spark(this.x, this.y, "#ef6d78", 12);
    this.game.moveActor(this, Math.cos(angle) * 18, Math.sin(angle) * 18);
    if (this.hp <= 0) this.game.defeat();
  }

  drawPixelModel(context, alpha) {
    if (!atlasLoaded(pixelAtlases.entity)) return false;
    drawPixelShadow(context, this.x - 2, this.y + 19, 46, 0.42);
    context.save();
    context.globalAlpha = alpha;
    context.translate(pixel(this.x), pixel(this.y));
    if (this.dancing) {
      context.globalAlpha *= 0.46 + Math.sin(this.stepPhase * 1.7) * 0.1;
      context.strokeStyle = this.currentMagic.color;
      context.lineWidth = 4;
      context.strokeRect(-39, -58, 78, 78);
      context.fillStyle = this.currentMagic.color;
      for (let i = 0; i < 4; i += 1) {
        const angle = i * Math.PI / 2 + this.stepPhase * 0.12;
        context.fillRect(pixel(Math.cos(angle) * 45) - 3, pixel(Math.sin(angle) * 45) - 3, 6, 6);
      }
      context.globalAlpha = alpha;
    }
    const attacking = this.charge > 0.06;
    drawAtlasCell(context, pixelAtlases.entity, attacking ? PIXEL_ENTITY.xingyaoAttack : PIXEL_ENTITY.xingyaoIdle, 4, 4, 0, -29, 120, 124, {
      flipX: Math.cos(this.facing) < 0,
    });
    if (attacking) {
      const direction = Math.round(this.facing / (TAU / 16)) * (TAU / 16);
      context.rotate(direction);
      context.fillStyle = COLORS.gold;
      context.fillRect(22, -2, 24 + pixel(this.charge * 18), 4);
      context.fillStyle = "#fff0b8";
      context.fillRect(24, -2, 12, 2);
    }
    context.restore();
    if (this.spiritActive) this.drawSpirit(context);
    return true;
  }

  draw(context) {
    const alpha = this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0 ? 0.48 : 1;
    if (this.drawPixelModel(context, alpha)) return;
    context.save();
    context.globalAlpha = alpha;
    context.translate(this.x, this.y);
    context.rotate(this.facing);
    const bob = Math.sin(this.stepPhase) * 1.5;
    context.translate(0, bob);

    context.fillStyle = "rgba(0,0,0,0.4)";
    context.beginPath();
    context.ellipse(-5, 15, 28, 10, 0, 0, TAU);
    context.fill();

    if (this.dancing) {
      context.strokeStyle = this.currentMagic.color;
      context.globalAlpha *= 0.42;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(0, 0, 31 + Math.sin(this.stepPhase * 1.7) * 4, 0, TAU);
      context.stroke();
      context.globalAlpha = alpha;
    }

    // Quiver and long elven hair trail behind her movement direction.
    context.save();
    context.rotate(-0.16);
    context.fillStyle = "#7e6042";
    roundedRectPath(context, -25, -22, 30, 8, 3);
    context.fill();
    context.strokeStyle = COLORS.gold;
    context.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      context.beginPath();
      context.moveTo(-25 - i * 2, -21 + i * 3);
      context.lineTo(-38 - i * 3, -20 + i * 3);
      context.stroke();
    }
    context.restore();

    context.fillStyle = "#101b25";
    polygon(context, [[-6, -14], [-33, -25], [-24, -5], [-41, 6], [-9, 10], [6, 2]]);
    context.fill();
    context.fillStyle = "#17313a";
    polygon(context, [[-8, -9], [-30, -15], [-20, -2], [-35, 13], [-7, 12], [8, 3]]);
    context.fill();

    // Layered archer coat with ivory mantle and jade-gold seams.
    context.fillStyle = "#1c3339";
    polygon(context, [[-18, -18], [9, -17], [18, -7], [17, 13], [-10, 22], [-25, 10], [-24, -8]]);
    context.fill();
    context.fillStyle = "#345b5a";
    polygon(context, [[-13, -13], [8, -12], [12, -2], [5, 16], [-11, 18], [-18, 7]]);
    context.fill();
    context.fillStyle = "#c7bfa8";
    polygon(context, [[-15, -17], [8, -16], [13, -9], [5, -5], [-11, -7], [-20, -2], [-23, -9]]);
    context.fill();
    context.strokeStyle = "#b69356";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(-14, -8);
    context.lineTo(7, 14);
    context.moveTo(-9, 18);
    context.lineTo(-18, 7);
    context.stroke();
    context.fillStyle = COLORS.jade;
    context.shadowColor = COLORS.jade;
    context.shadowBlur = 8;
    polygon(context, [[-2, -5], [3, 0], [-2, 5], [-7, 0]]);
    context.fill();
    context.shadowBlur = 0;

    // Pointed ears remain readable even at gameplay scale.
    context.fillStyle = "#d8bca8";
    polygon(context, [[2, -8], [-7, -25], [10, -10]]);
    context.fill();
    polygon(context, [[2, 8], [-7, 25], [10, 10]]);
    context.fill();
    context.strokeStyle = "#ad7f73";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(1, -10);
    context.lineTo(-3, -20);
    context.moveTo(1, 10);
    context.lineTo(-3, 20);
    context.stroke();

    context.fillStyle = "#dfc8b4";
    context.beginPath();
    context.arc(7, 0, 11, 0, TAU);
    context.fill();

    context.fillStyle = "#101923";
    context.beginPath();
    context.arc(3, 0, 12, Math.PI * 0.55, Math.PI * 1.45);
    context.quadraticCurveTo(8, -12, 15, -7);
    context.lineTo(12, -1);
    context.quadraticCurveTo(7, -4, 3, 0);
    context.fill();
    context.strokeStyle = "#3b6668";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-1, -7);
    context.quadraticCurveTo(-13, -15, -22, -9);
    context.moveTo(-1, 7);
    context.quadraticCurveTo(-13, 16, -25, 11);
    context.stroke();
    context.fillStyle = "#d7b86d";
    context.fillRect(13, -4, 2.5, 2);
    context.fillRect(13, 2, 2.5, 2);

    // Bracer, hand and recurved bow.
    context.strokeStyle = "#725842";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(5, 10);
    context.lineTo(22, 9);
    context.stroke();
    context.fillStyle = "#d8bca8";
    context.beginPath();
    context.arc(23, 8, 4, 0, TAU);
    context.fill();

    context.strokeStyle = "#c19a5f";
    context.lineWidth = 3;
    context.shadowColor = "rgba(241,208,139,0.45)";
    context.shadowBlur = 6;
    context.beginPath();
    context.arc(22, 0, 27, -1.16, 1.16);
    context.stroke();
    context.shadowBlur = 0;
    context.strokeStyle = "#e5dcc1";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(33, -25);
    context.lineTo(33, 25);
    context.stroke();

    if (this.charge > 0) {
      context.strokeStyle = COLORS.gold;
      context.lineWidth = 2;
      context.shadowColor = COLORS.gold;
      context.shadowBlur = 14;
      context.beginPath();
      context.moveTo(14, 0);
      context.lineTo(41 + this.charge * 10, 0);
      context.stroke();
      context.fillStyle = COLORS.gold;
      polygon(context, [[48 + this.charge * 10, 0], [39 + this.charge * 10, -4], [41 + this.charge * 10, 0], [39 + this.charge * 10, 4]]);
      context.fill();
    }
    context.restore();

    if (this.spiritActive) this.drawSpirit(context);
  }

  drawSpirit(context) {
    context.save();
    context.translate(pixel(this.spiritX), pixel(this.spiritY));
    context.fillStyle = this.currentMagic.color;
    context.globalAlpha = 0.88;
    polygon(context, [[0, -14], [10, 0], [0, 14], [-10, 0]]);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.82)";
    context.fillRect(-2, -7, 4, 8);
    context.globalAlpha = 0.4;
    context.fillStyle = this.currentMagic.color;
    const wing = 12 + pixel(Math.sin(this.spiritPhase * 4) * 3);
    context.fillRect(-wing - 10, -4, wing, 4);
    context.fillRect(10, 2, wing, 4);
    context.fillRect(-wing - 4, 2, 8, 4);
    context.fillRect(wing - 4, -4, 8, 4);
    context.restore();
  }
}

class EngineerPlayer extends Player {
  constructor(game) {
    super(game);
    this.characterId = "wenyu";
    this.r = 19;
    this.maxHp = 82;
    this.hp = this.maxHp;
    this.maxEnergy = 100;
    this.energy = 28;
    this.baseSpeed = 198;
    this.baseAttackInterval = 0.68;
    this.charge = 0;
    this.spiritActive = false;
    this.magicUnlocked = true;
    this.rollUnlocked = true;
    this.danceUnlocked = true;
    this.configIndex = 0;
    this.bindingMode = false;
    this.robots = [];
    this.manufactureRate = 5.4;
    this.manufacturedCount = 0;
    this.rollCharges = 3;
    this.maxRollCharges = 3;
    this.rollRecharge = 0;
    this.rollRechargeTime = 8.2;
    this.qCooldown = 0;
    this.qCooldownMax = 0.22;
    this.danceCooldown = 0;
    this.danceCooldownMax = 24;
    this.danceDuration = 9;
    this.mechDrain = 13.5;
    this.robotDamageMod = 1;
    this.robotDurabilityMod = 1;
    this.robotEnergyMod = 1;
    this.robotHealMod = 1;
    this.robotControlMod = 1;
    this.robotEnhanceMod = 1;
    this.mechDamageMod = 1;
    this.lastAttackTarget = null;
    this.lastAttackTargetTimer = 0;
    this.boundEnhanceCount = 0;
  }

  get currentMagic() {
    return ROBOT_CONFIGS[this.configIndex];
  }

  effectiveCooldownRate() {
    return this.cooldownMod * (1 + Math.min(0.22, this.boundEnhanceCount * 0.035 * this.robotEnhanceMod));
  }

  effectiveAttackSpeed() {
    return this.attackSpeedMod * (this.dancing ? 1.34 : 1);
  }

  effectiveChargeRate() {
    return 1;
  }

  effectiveDamage() {
    const networkDamage = 1 + Math.min(0.28, this.boundEnhanceCount * 0.04 * this.robotEnhanceMod);
    return this.damageMod * networkDamage * (this.dancing ? this.mechDamageMod : 1);
  }

  update(dt) {
    this.robots = this.robots.filter((robot) => !robot.dead);
    this.boundEnhanceCount = this.robots.reduce(
      (count, robot) => count + (robot.bound && robot.config.key === "enhance" ? 1 : 0),
      0,
    );
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3.3);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.qCooldown = Math.max(0, this.qCooldown - dt);
    this.danceCooldown = Math.max(0, this.danceCooldown - dt * this.effectiveCooldownRate());
    this.stepPhase += dt * (this.dancing ? 11 : 7);
    this.lastAttackTargetTimer = Math.max(0, this.lastAttackTargetTimer - dt);
    if (this.lastAttackTargetTimer <= 0 || this.lastAttackTarget?.dead) this.lastAttackTarget = null;
    this.updateMovement(dt);

    if (this.rollCharges < this.maxRollCharges) {
      this.rollRecharge += dt * this.effectiveCooldownRate();
      if (this.rollRecharge >= this.rollRechargeTime) {
        this.rollRecharge -= this.rollRechargeTime;
        this.rollCharges += 1;
        this.game.sound.tone(470, 0.12, "triangle", 0.045, 130);
      }
    } else {
      this.rollRecharge = 0;
    }

    if (this.dancing) {
      this.danceTimer -= dt;
      this.energy = Math.max(0, this.energy - this.mechDrain * dt);
      this.invulnerable = Math.max(this.invulnerable, 0.045);
      if (this.energy <= 0 || this.danceTimer <= 0) this.endDance();
      if (Math.random() < dt * 18) {
        const angle = rand(TAU);
        this.game.effects.push(new Effect("particle", this.x + Math.cos(angle) * 34, this.y + Math.sin(angle) * 34, {
          vx: -Math.cos(angle) * 55,
          vy: -Math.sin(angle) * 55,
          color: this.currentMagic.color,
          life: 0.32,
          size: 5,
          rotation: angle,
        }));
      }
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + this.manufactureRate * this.effectiveCooldownRate() * dt);
      if (this.energy >= this.maxEnergy - 0.001) this.manufactureRobot();
    }

    this.robots.forEach((robot, index) => robot.update(dt, index, this.robots.length));
    if (input.mouse.down && !this.bindingMode && this.attackCooldown <= 0) this.shoot();
  }

  updateMovement(dt) {
    let dx = 0;
    let dy = 0;
    if (input.keys.has("KeyA")) dx -= 1;
    if (input.keys.has("KeyD")) dx += 1;
    if (input.keys.has("KeyW")) dy -= 1;
    if (input.keys.has("KeyS")) dy += 1;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
      this.lastMove = { x: dx, y: dy };
      const distance = this.baseSpeed * this.speedMod * (this.dancing ? 1.2 : 1) * dt;
      this.game.moveActor(this, dx * distance, dy * distance);
      this.game.stats.moveDistance += distance;
    }
    this.facing = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);
  }

  shoot() {
    this.attackCooldown = this.baseAttackInterval / this.effectiveAttackSpeed();
    const muzzleX = this.x + Math.cos(this.facing) * (this.dancing ? 31 : 23);
    const muzzleY = this.y + Math.sin(this.facing) * (this.dancing ? 31 : 23);
    const crit = Math.random() < this.critChance;
    const damage = (this.dancing ? 10.5 : 8.2) * this.effectiveDamage() * (crit ? 1.55 : 1);
    const spread = this.dancing ? 0.055 : 0;
    this.game.arrows.push(new Arrow(muzzleX, muzzleY, this.facing - spread, damage, "tech", "player", 0.5));
    if (this.dancing) this.game.arrows.push(new Arrow(muzzleX, muzzleY, this.facing + spread, damage * 0.84, "tech", "player", 0.5));
    this.game.stats.shots += 1;
    this.game.sound.tone(this.dancing ? 190 : 245, 0.09, "square", 0.045, 180, { pan: clamp((this.x - W / 2) / 700, -1, 1) });
    if (crit) this.game.floatText(this.x, this.y - 32, "校准", this.currentMagic.color, 13);
  }

  toggleSpirit() {
    if (this.qCooldown > 0) return;
    this.configIndex = (this.configIndex + 1) % ROBOT_CONFIGS.length;
    this.qCooldown = this.qCooldownMax;
    this.game.stats.switches += 1;
    this.game.showToast(`制造配置 · ${this.currentMagic.name}`);
    this.game.shockwave(this.x, this.y, this.currentMagic.color, 52);
    this.game.sound.tone(330 + this.configIndex * 75, 0.18, "triangle", 0.075, 120);
  }

  switchMagic() {
    this.bindingMode = !this.bindingMode;
    input.mouse.down = false;
    this.game.showToast(this.bindingMode ? "批量绑定模式 · 点击机器人切换绑定" : "绑定指定结束");
    this.game.shockwave(this.x, this.y, this.currentMagic.color, 66);
  }

  handlePointerDown() {
    if (!this.bindingMode) return false;
    let nearest = null;
    let distance = 42;
    for (const robot of this.robots) {
      const value = Math.hypot(input.mouse.x - robot.x, input.mouse.y - robot.y);
      if (value < distance) { nearest = robot; distance = value; }
    }
    if (!nearest) {
      this.game.showToast("请选择一台机器人 · E 退出绑定模式");
      return true;
    }
    nearest.bound = !nearest.bound;
    this.game.stats.bindings += 1;
    this.game.showToast(`${nearest.config.name} · ${nearest.bound ? "已绑定程闻屿" : "解除绑定"}`);
    this.game.shockwave(nearest.x, nearest.y, nearest.config.color, 42);
    return true;
  }

  startRoll() {
    if (this.rollCharges <= 0 || this.robots.length === 0) {
      this.game.showToast(this.robots.length === 0 ? "当前没有可重设的机器人" : "重设储存尚未恢复");
      return;
    }
    let target = null;
    let best = 175;
    for (const robot of this.robots) {
      const distance = Math.hypot(input.mouse.x - robot.x, input.mouse.y - robot.y);
      if (distance < best) { target = robot; best = distance; }
    }
    if (!target) target = this.robots.reduce((closest, robot) => dist(robot, this) < dist(closest, this) ? robot : closest, this.robots[0]);
    target.configIndex = this.configIndex;
    target.repair(target.maxDurability * 0.46);
    target.energy = Math.min(target.maxEnergy, target.energy + 12);
    this.rollCharges -= 1;
    this.game.stats.rollUses += 1;
    this.game.showToast(`重设完成 · ${target.config.name} · 耐久修复`);
    this.game.shockwave(target.x, target.y, target.config.color, 78);
    this.game.sound.chime();
  }

  startDance() {
    if (this.danceCooldown > 0 || this.dancing) return;
    if (this.robots.length === 0) {
      this.game.showToast("没有机器人可供回收");
      return;
    }
    let recovered = 0;
    for (const robot of this.robots) {
      recovered += 17 + robot.energy * 0.58 + (robot.durability / robot.maxDurability) * 7;
      robot.explode(true);
    }
    this.robots = [];
    this.energy = Math.min(this.maxEnergy, this.energy + recovered);
    if (this.energy < 18) return;
    this.danceTimer = this.danceDuration;
    this.danceCooldown = this.danceCooldownMax;
    this.bindingMode = false;
    this.game.stats.danceUses += 1;
    this.game.showToast(`归恒机甲展开 · 回收能量 ${Math.round(recovered)}`);
    this.game.shockwave(this.x, this.y, "#63d8d0", 145);
    this.game.pixelBurst(this.x, this.y - 18, "construct", 190, 0.68);
    this.game.sound.tone(115, 0.55, "sawtooth", 0.12, 390);
  }

  endDance() {
    const active = this.danceTimer > 0;
    this.danceTimer = 0;
    if (active) this.game.showToast("机甲续航结束 · 制造网络重启");
  }

  manufactureRobot() {
    if (this.dancing) return;
    this.energy = 0;
    const robot = new SupportRobot(this, this.configIndex, this.robots.length);
    this.robots.push(robot);
    this.manufacturedCount += 1;
    this.game.stats.manufactures += 1;
    this.game.showToast(`自动制造 · ${robot.config.name}机器人 #${this.manufacturedCount}`);
    this.game.shockwave(robot.x, robot.y, robot.config.color, 66);
    this.game.pixelBurst(robot.x, robot.y, "construct", 108, 0.52);
    this.game.sound.chime();
  }

  onRoomEnter() {
    this.bindingMode = false;
    this.robots.forEach((robot, index) => {
      const angle = (index / Math.max(1, this.robots.length)) * TAU;
      robot.x = this.x + Math.cos(angle) * 45;
      robot.y = this.y + Math.sin(angle) * 45;
      this.game.resolveObstacleOverlap(robot);
    });
  }

  onMagicHit() {}

  hurt(amount, angle) {
    super.hurt(amount * (this.dancing ? 0.72 : 1), angle);
  }

  drawCompanionLinks(context) {
    for (const robot of this.robots) {
      if (robot.bound) {
        context.save();
        context.globalAlpha = 0.12;
        context.strokeStyle = robot.config.color;
        context.setLineDash([5, 10]);
        context.lineDashOffset = -this.game.elapsed * 24;
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(robot.x, robot.y);
        context.stroke();
        context.restore();
      }
    }
  }

  drawCompanions(context) {
    for (const robot of this.robots) robot.draw(context);
  }

  draw(context) {
    const alpha = this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0 ? 0.48 : 1;
    if (atlasLoaded(pixelAtlases.entity)) {
      drawPixelShadow(context, this.x - 2, this.y + 20, this.dancing ? 62 : 48, 0.42);
      context.save();
      context.globalAlpha = alpha;
      context.translate(pixel(this.x), pixel(this.y));
      if (this.dancing) {
        context.globalAlpha *= 0.38;
        context.strokeStyle = "#63d8d0";
        context.lineWidth = 6;
        context.strokeRect(-46, -60, 92, 88);
        context.fillStyle = "#d4ad64";
        context.fillRect(-54, -4, 108, 6);
        context.globalAlpha = alpha;
      }
      const casting = input.mouse.down || this.bindingMode || this.dancing;
      drawAtlasCell(context, pixelAtlases.entity, casting ? PIXEL_ENTITY.wenyuCast : PIXEL_ENTITY.wenyuIdle, 4, 4, 0, -28, this.dancing ? 142 : 122, this.dancing ? 142 : 126, {
        flipX: Math.cos(this.facing) < 0,
      });
      if (this.bindingMode) {
        context.strokeStyle = this.currentMagic.color;
        context.setLineDash([6, 6]);
        context.lineDashOffset = -this.game.elapsed * 18;
        context.strokeRect(-48, -62, 96, 94);
        context.setLineDash([]);
      }
      context.restore();
      return;
    }
    context.save();
    context.globalAlpha = alpha;
    context.translate(this.x, this.y);
    context.rotate(this.facing);
    const bob = Math.sin(this.stepPhase) * 1.3;
    context.translate(0, bob);
    context.fillStyle = "rgba(0,0,0,0.4)";
    context.beginPath();
    context.ellipse(-5, 17, this.dancing ? 34 : 27, 10, 0, 0, TAU);
    context.fill();

    if (this.dancing) {
      context.strokeStyle = "#63d8d0";
      context.fillStyle = "#172d34";
      context.lineWidth = 4;
      context.shadowColor = "#63d8d0";
      context.shadowBlur = 16;
      polygon(context, [[-27, -23], [13, -27], [30, -13], [29, 17], [8, 30], [-26, 21], [-35, 0]]);
      context.fill();
      context.stroke();
      context.strokeStyle = "#d4ad64";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-22, -17); context.lineTo(16, 20);
      context.moveTo(-18, 19); context.lineTo(21, -17);
      context.stroke();
      context.shadowBlur = 0;
    } else {
      context.fillStyle = "#13222b";
      polygon(context, [[-24, -15], [-8, -23], [13, -18], [21, -8], [16, 18], [-7, 23], [-27, 10]]);
      context.fill();
      context.fillStyle = "#91c8c2";
      polygon(context, [[-17, -14], [7, -17], [14, -6], [7, 15], [-11, 18], [-21, 7]]);
      context.fill();
      context.fillStyle = "#d8eee8";
      polygon(context, [[-3, -15], [9, -12], [5, 2], [-5, 5], [-12, -7]]);
      context.fill();
      context.fillStyle = "#6e627f";
      polygon(context, [[-10, 17], [4, 15], [10, 25], [-3, 22]]);
      context.fill();
      context.fillStyle = "#202637";
      roundedRectPath(context, -24, -20, 12, 15, 5);
      context.fill();
      roundedRectPath(context, -24, 6, 12, 15, 5);
      context.fill();
      context.strokeStyle = this.currentMagic.color;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-13, -9); context.lineTo(8, 14);
      context.stroke();
      context.fillStyle = "#f0b8c4";
      polygon(context, [[-4, -4], [-10, -9], [-9, -1], [-10, 7], [-3, 2], [3, 6], [2, -2]]);
      context.fill();
    }

    // Fluffy hair, soft face and small side-tie keep the engineer readable as
    // a cute adult androgynous boy even at combat scale.
    context.fillStyle = "#101923";
    context.beginPath();
    context.ellipse(2, -12, 8, 5, -0.35, 0, TAU);
    context.ellipse(-4, -16, 6, 3.5, -0.7, 0, TAU);
    context.fill();
    context.fillStyle = "#e0bdae";
    context.beginPath();
    context.arc(8, 0, 11.5, 0, TAU);
    context.fill();
    context.fillStyle = "#121c27";
    context.beginPath();
    context.arc(4, 0, 13, Math.PI * 0.48, Math.PI * 1.5);
    context.quadraticCurveTo(9, -15, 19, -7);
    context.quadraticCurveTo(13, -4, 11, 0);
    context.fill();
    context.fillStyle = "#f2a8b7";
    context.globalAlpha = 0.65;
    context.beginPath();
    context.ellipse(15, 5, 3.2, 1.6, 0.3, 0, TAU);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "#d9fff7";
    context.beginPath();
    context.arc(16, -2.5, 1.8, 0, TAU);
    context.fill();
    context.fillStyle = this.currentMagic.color;
    context.shadowColor = this.currentMagic.color;
    context.shadowBlur = 9;
    context.fillRect(4, -12, 5, 2);
    context.shadowBlur = 0;

    context.strokeStyle = "#ad8754";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(4, 10); context.lineTo(24, 8);
    context.stroke();
    context.fillStyle = "#223b43";
    roundedRectPath(context, 19, 2, 24, 12, 4);
    context.fill();
    context.strokeStyle = this.currentMagic.color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(42, 8); context.lineTo(52, 8);
    context.stroke();

    context.restore();

    if (this.bindingMode) {
      context.save();
      context.strokeStyle = this.currentMagic.color;
      context.globalAlpha = 0.5 + Math.sin(this.game.elapsed * 6) * 0.18;
      context.setLineDash([8, 8]);
      context.beginPath();
      context.arc(input.mouse.x, input.mouse.y, 36, 0, TAU);
      context.stroke();
      context.restore();
    }
  }
}

const UPGRADE_RARITIES = [
  { key: "white", name: "白", label: "白色星痕", color: "#c9d4d4", power: 1, weight: 0.57 },
  { key: "blue", name: "蓝", label: "蓝色星痕", color: "#68a9ff", power: 1.65, weight: 0.28 },
  { key: "purple", name: "紫", label: "紫色星痕", color: "#bd7cff", power: 2.4, weight: 0.12 },
  { key: "gold", name: "金", label: "金色星痕", color: "#f1c766", power: 3.25, weight: 0.03 },
];

const pct = (value) => Math.round(value * 100);

const SKILL_UNLOCKS = [
  {
    id: "unlock-magic",
    name: "三相魔法箭",
    icon: "矢",
    category: "技能解锁 · E",
    available: (p) => !p.magicUnlocked,
    description: "解锁流光、陨星与清风。普通射击会消耗能量追加当前魔法箭，并可按 E 循环切换。",
    apply: (p) => { p.magicUnlocked = true; p.energy = Math.max(p.energy, 36); },
  },
  {
    id: "unlock-roll",
    name: "翻滚齐射",
    icon: "闪",
    category: "技能解锁 · Space",
    available: (p) => !p.rollUnlocked,
    description: "解锁两次储存的无敌翻滚，并在翻滚中自动向附近目标发射万斥与追击箭。",
    apply: (p) => { p.rollUnlocked = true; p.rollCharges = p.maxRollCharges; p.rollRecharge = 0; },
  },
  {
    id: "unlock-dance",
    name: "灵舞",
    icon: "舞",
    category: "技能解锁 · R",
    available: (p) => !p.danceUnlocked,
    description: "解锁持续消耗能量的灵舞状态，提高移动、攻击与技能回转，并强化契灵协奏。",
    apply: (p) => { p.danceUnlocked = true; p.danceCooldown = 0; },
  },
];

const UPGRADES = [
  {
    id: "damage",
    name: "弦月准星",
    icon: "弦",
    category: "弓弩 · 伤害",
    description: (power) => `弓弩伤害提高 ${pct(0.06 * power)}%，会心率提高 ${pct(0.009 * power)}%。`,
    apply: (p, power) => { p.damageMod *= 1 + 0.06 * power; p.critChance += 0.009 * power; },
  },
  {
    id: "charge",
    name: "逐星腕轮",
    icon: "迅",
    category: "弓弩 · 蓄力",
    description: (power) => `蓄力速度提高 ${pct(0.09 * power)}%，更快进入满弦状态。`,
    apply: (p, power) => { p.chargeMod *= 1 + 0.09 * power; },
  },
  {
    id: "attack-speed",
    name: "星弦机括",
    icon: "疾",
    category: "弓弩 · 攻速",
    description: (power) => `攻击速度提高 ${pct(0.075 * power)}%，固定射击冷却同步缩短。`,
    apply: (p, power) => { p.attackSpeedMod *= 1 + 0.075 * power; },
  },
  {
    id: "cooldown",
    name: "回响刻印",
    icon: "响",
    category: "通用 · 回转",
    description: (power) => `技能回转加快 ${pct(0.065 * power)}%，并立即推进部分储存恢复。`,
    apply: (p, power) => { p.cooldownMod *= 1 + 0.065 * power; p.rollRecharge += 0.55 * power; },
  },
  {
    id: "mobility",
    name: "浮风轻靴",
    icon: "风",
    category: "机动 · 翻滚",
    available: (p) => p.rollUnlocked,
    description: (power) => `移动速度提高 ${pct(0.045 * power)}%，翻滚储存恢复时间缩短 ${pct(0.035 * power)}%。`,
    apply: (p, power) => { p.speedMod *= 1 + 0.045 * power; p.rollRechargeTime *= 1 - 0.035 * power; },
  },
  {
    id: "magic-economy",
    name: "澄澈箭羽",
    icon: "澄",
    category: "魔法箭 · 能量",
    available: (p) => p.magicUnlocked,
    description: (power) => `魔法箭能耗降低 ${pct(0.055 * power)}%，最大能量提高 ${Math.round(4 * power)}。`,
    apply: (p, power) => {
      const energy = Math.round(4 * power);
      p.magicCostMod *= 1 - 0.055 * power;
      p.maxEnergy += energy;
      p.energy += energy;
    },
  },
  {
    id: "vitality",
    name: "生息之种",
    icon: "生",
    category: "生存 · 生命",
    description: (power) => `最大生命提高 ${Math.round(7 * power)}，治疗效果提高 ${pct(0.055 * power)}%，并立即恢复生命。`,
    apply: (p, power) => {
      const health = Math.round(7 * power);
      p.maxHp += health;
      p.hp = Math.min(p.maxHp, p.hp + Math.round(9 * power));
      p.healMod *= 1 + 0.055 * power;
    },
  },
  {
    id: "tether",
    name: "重界之楔",
    icon: "界",
    category: "万斥 · 界缚",
    description: (power) => `界缚伤害提高 ${pct(0.11 * power)}%，翻滚齐射伤害提高 ${pct(0.07 * power)}%。`,
    apply: (p, power) => { p.tetherMod *= 1 + 0.11 * power; p.rollDamageMod *= 1 + 0.07 * power; },
  },
  {
    id: "spirit",
    name: "双生契约",
    icon: "契",
    category: "契灵 · 协奏",
    description: (power) => `契灵射击与自身攻击速度提高 ${pct(0.04 * power)}%，最大能量提高 ${Math.round(3 * power)}。`,
    apply: (p, power) => {
      const energy = Math.round(3 * power);
      p.attackSpeedMod *= 1 + 0.04 * power;
      p.maxEnergy += energy;
      p.energy += energy;
    },
  },
  {
    id: "dance",
    name: "无垠灵舞",
    icon: "舞",
    category: "灵舞 · 强化",
    available: (p) => p.danceUnlocked,
    description: (power) => `灵舞持续时间增加 ${(0.45 * power).toFixed(1)} 秒，冷却缩短 ${pct(0.035 * power)}%。`,
    apply: (p, power) => { p.danceDuration += 0.45 * power; p.danceCooldownMax *= 1 - 0.035 * power; },
  },
];

const ENGINEER_UPGRADES = [
  {
    id: "fabrication",
    name: "恒动制造列",
    icon: "造",
    category: "制造 · 自动化",
    description: (power) => `制造能量恢复速度提高 ${pct(0.085 * power)}%，冷却缩减仍会继续放大恢复速度。`,
    apply: (p, power) => { p.manufactureRate *= 1 + 0.085 * power; },
  },
  {
    id: "network-damage",
    name: "协同火控核",
    icon: "网",
    category: "机器人 · 火控",
    description: (power) => `机器人伤害提高 ${pct(0.09 * power)}%，程闻屿攻击速度提高 ${pct(0.045 * power)}%。`,
    apply: (p, power) => { p.robotDamageMod *= 1 + 0.09 * power; p.attackSpeedMod *= 1 + 0.045 * power; },
  },
  {
    id: "durability",
    name: "自修复骨架",
    icon: "甲",
    category: "机器人 · 耐久",
    description: (power) => `机器人最大耐久提高 ${pct(0.11 * power)}%，现有机器人立即获得等比例耐久。`,
    apply: (p, power) => {
      const ratio = 1 + 0.11 * power;
      p.robotDurabilityMod *= ratio;
      p.robots.forEach((robot) => { robot.maxDurability *= ratio; robot.durability *= ratio; });
    },
  },
  {
    id: "energy-loop",
    name: "闭环蓄能器",
    icon: "能",
    category: "机器人 · 资源",
    description: (power) => `机器人回能与资源供给提高 ${pct(0.1 * power)}%，制造能量上限维持 100。`,
    apply: (p, power) => { p.robotEnergyMod *= 1 + 0.1 * power; },
  },
  {
    id: "healing-protocol",
    name: "温床协议",
    icon: "疗",
    category: "治疗配置 · 强化",
    description: (power) => `治疗配置的自修复与绑定治疗提高 ${pct(0.13 * power)}%。`,
    apply: (p, power) => { p.robotHealMod *= 1 + 0.13 * power; },
  },
  {
    id: "control-protocol",
    name: "冻结握手",
    icon: "控",
    category: "控制配置 · 强化",
    description: (power) => `控制配置的晕眩强度提高 ${pct(0.12 * power)}%，机器人伤害小幅提高。`,
    apply: (p, power) => { p.robotControlMod *= 1 + 0.12 * power; p.robotDamageMod *= 1 + 0.035 * power; },
  },
  {
    id: "enhance-protocol",
    name: "归恒校准场",
    icon: "强",
    category: "强化配置 · 增幅",
    description: (power) => `强化配置的伤害削弱效果提高 ${pct(0.1 * power)}%，程闻屿伤害提高 ${pct(0.04 * power)}%。`,
    apply: (p, power) => { p.robotEnhanceMod *= 1 + 0.1 * power; p.damageMod *= 1 + 0.04 * power; },
  },
  {
    id: "reset-cache",
    name: "热备配置栈",
    icon: "栈",
    category: "重设 · 储存",
    description: (power) => `重设储存恢复时间缩短 ${pct(0.055 * power)}%，修复后额外补充机体能量。`,
    apply: (p, power) => { p.rollRechargeTime *= 1 - 0.055 * power; p.robots.forEach((robot) => { robot.energy = Math.min(robot.maxEnergy, robot.energy + 3 * power); }); },
  },
  {
    id: "mech-drive",
    name: "短续航超频",
    icon: "铠",
    category: "机甲 · 变身",
    description: (power) => `机甲伤害提高 ${pct(0.08 * power)}%，能量消耗降低 ${pct(0.045 * power)}%。`,
    apply: (p, power) => { p.mechDamageMod *= 1 + 0.08 * power; p.mechDrain *= 1 - 0.045 * power; },
  },
  {
    id: "engineer-vitality",
    name: "稳态生命线",
    icon: "恒",
    category: "生存 · 通用",
    description: (power) => `最大生命提高 ${Math.round(8 * power)}，冷却回转提高 ${pct(0.045 * power)}%，并立即恢复生命。`,
    apply: (p, power) => { const hp = Math.round(8 * power); p.maxHp += hp; p.hp = Math.min(p.maxHp, p.hp + hp); p.cooldownMod *= 1 + 0.045 * power; },
  },
];

class Game {
  constructor() {
    this.sound = new Soundscape();
    this.selectedCharacter = "xingyao";
    try {
      const savedCharacter = localStorage.getItem("boundary-ashes-character");
      if (CHARACTER_PROFILES[savedCharacter]) this.selectedCharacter = savedCharacter;
    } catch (error) {
      // Character choice remains available when local storage is restricted.
    }
    this.state = "title";
    this.mode = "run";
    this.tutorial = null;
    this.lastTime = performance.now();
    this.elapsed = 0;
    this.shake = 0;
    this.toastTimer = 0;
    this.transition = 0;
    this.pendingVictory = 0;
    this.pendingFloorTransition = 0;
    this.pendingFloorReward = false;
    this.floorBannerTimer = 0;
    this.currentFloor = 1;
    this.totalFloors = DUNGEON_FLOORS.length;
    this.floorRoomsCleared = 0;
    this.floorConfig = DUNGEON_FLOORS[0];
    this.rooms = new Map();
    this.currentRoom = null;
    this.enemies = [];
    this.arrows = [];
    this.enemyProjectiles = [];
    this.hazards = [];
    this.effects = [];
    this.pickups = [];
    this.stats = {};
    this.currentChoices = [];
    this.bestiaryIndex = 0;
    this.bestiaryReturnState = "title";
    this.settingsReturnState = "title";
    this.bossSkillName = "";
    this.bossSkillDetail = "";
    this.bossSkillTimer = 0;
    this.demoPlayer = new Player(this);
    this.demoPlayer.x = W / 2;
    this.demoPlayer.y = H / 2 + 100;
    this.loop = this.loop.bind(this);
    this.resize();
    this.buildBestiaryUI();
    this.syncSoundSettingsUI();
    this.bindEvents();
    this.selectCharacter(this.selectedCharacter, false);
    requestAnimationFrame(this.loop);
  }

  createPlayer() {
    return this.selectedCharacter === "wenyu" ? new EngineerPlayer(this) : new Player(this);
  }

  selectCharacter(characterId, announce = true) {
    if (!CHARACTER_PROFILES[characterId]) return;
    this.selectedCharacter = characterId;
    const profile = CHARACTER_PROFILES[characterId];
    document.body.classList.toggle("character-wenyu", characterId === "wenyu");
    characterButtons.forEach((button) => {
      const selected = button.dataset.character === characterId;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    characterSubtitle.textContent = profile.subtitle;
    characterIntro.innerHTML = profile.intro;
    controlGrid.innerHTML = profile.controls.map(([key, label]) => `<span><kbd>${key}</kbd> ${label}</span>`).join("");
    if (portraitVideo) {
      portraitVideo.setAttribute("aria-hidden", characterId === "wenyu" ? "true" : "false");
      syncPortraitMotion();
    }
    if (engineerPortrait) engineerPortrait.setAttribute("aria-hidden", characterId === "wenyu" ? "false" : "true");
    if (engineerHero) engineerHero.setAttribute("aria-hidden", "true");
    try { localStorage.setItem("boundary-ashes-character", characterId); } catch (error) {}
    if (announce) this.sound.tone(characterId === "wenyu" ? 285 : 410, 0.2, "triangle", 0.07, 120);
  }

  reset(mode = "run") {
    this.mode = mode;
    this.seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    this.rng = mulberry32(this.seed);
    if (mode === "tutorial") {
      this.currentFloor = 0;
      this.floorConfig = null;
      this.buildTutorialRoom();
    } else {
      this.currentFloor = 1;
      this.buildDungeon(this.currentFloor);
    }
    this.player = this.createPlayer();
    this.enemies = [];
    this.arrows = [];
    this.enemyProjectiles = [];
    this.hazards = [];
    this.effects = [];
    this.pickups = [];
    this.elapsed = 0;
    this.shake = 0;
    this.pendingVictory = 0;
    this.pendingFloorTransition = 0;
    this.pendingFloorReward = false;
    this.floorBannerTimer = mode === "tutorial" ? 0 : 3.4;
    this.floorRoomsCleared = 0;
    this.bossSkillName = "";
    this.bossSkillDetail = "";
    this.bossSkillTimer = 0;
    this.stats = {
      kills: 0,
      rooms: 0,
      shots: 0,
      magicHits: 0,
      rollVolleys: 0,
      moveDistance: 0,
      switches: 0,
      spiritToggles: 0,
      rollUses: 0,
      danceUses: 0,
      bindings: 0,
      manufactures: 0,
      floors: 0,
      hitsByKind: { normal: 0, light: 0, meteor: 0, breeze: 0, force: 0, tether: 0, tech: 0, robot: 0 },
      upgrades: [],
    };
    const start = this.rooms.get("0,0");
    this.enterRoom(start, null);
    if (mode === "tutorial") this.setupTutorial();
    else this.hideTutorial();
  }

  start() {
    this.sound.enable();
    this.reset("run");
    this.state = "playing";
    this.setScreen(titleScreen, false);
    this.setScreen(endScreen, false);
    this.setScreen(pauseScreen, false);
    this.setScreen(settingsScreen, false);
    this.setScreen(bestiaryScreen, false);
    this.setScreen(bossIntroScreen, false);
    this.showToast(`第 1 层 · ${this.floorConfig.name}`);
  }

  startTutorial() {
    this.sound.enable();
    this.reset("tutorial");
    this.state = "playing";
    this.setScreen(titleScreen, false);
    this.setScreen(endScreen, false);
    this.setScreen(pauseScreen, false);
    this.setScreen(settingsScreen, false);
    this.setScreen(bestiaryScreen, false);
    this.setScreen(bossIntroScreen, false);
    this.showToast(this.selectedCharacter === "wenyu" ? "新手关卡 · 归恒校准庭" : "新手关卡 · 星弦演武庭");
  }

  buildTutorialRoom() {
    this.rooms = new Map();
    const room = {
      gx: 0,
      gy: 0,
      type: "tutorial",
      depth: 0,
      cleared: true,
      visited: false,
      started: true,
      seed: this.seed,
      obstacles: [],
      mechanisms: [],
      decorations: [],
      layoutId: "tutorial-sanctum",
      wallStyle: "training",
    };
    this.rooms.set("0,0", room);
  }

  buildDungeon(floorIndex = this.currentFloor) {
    const config = DUNGEON_FLOORS[floorIndex - 1] || DUNGEON_FLOORS[0];
    const floorSeed = (this.seed + Math.imul(floorIndex, 0x9e3779b9)) >>> 0;
    this.floorConfig = config;
    this.rng = mulberry32(floorSeed);
    const generated = window.DungeonGenerator.generate({ config, floorIndex, floorSeed });
    this.rooms = new Map(generated.rooms.map((room) => [keyOf(room.gx, room.gy), room]));
    this.generationAttempts = generated.attempts;

    const eliteCandidates = [...this.rooms.values()]
      .filter((room) => room.type === "combat" && room.depth >= 2)
      .sort((a, b) => b.depth - a.depth);
    for (let i = 0; i < config.eliteCount && eliteCandidates.length > 0; i += 1) {
      const range = Math.max(1, Math.ceil(eliteCandidates.length * 0.65));
      const index = Math.floor(this.rng() * range);
      const [elite] = eliteCandidates.splice(index, 1);
      elite.type = "elite";
    }
    for (const room of this.rooms.values()) room.obstacles = this.createObstacles(room);
    this.floorRoomsCleared = 0;
  }

  createObstacles(room) {
    const layout = window.BoundaryRoomLayouts.select({
      room,
      floorIndex: this.currentFloor,
      obstacleBonus: this.floorConfig?.obstacleBonus || 0,
    });
    room.layoutId = layout.id;
    room.wallStyle = layout.wallStyle;
    room.mechanisms = layout.mechanisms;
    room.decorations = layout.decorations;
    return layout.obstacles;
  }

  enterRoom(room, fromDirection) {
    if (!room) return;
    this.currentRoom = room;
    room.visited = true;
    this.enemies = [];
    this.arrows = [];
    this.enemyProjectiles = [];
    this.hazards = [];
    this.pickups = [];
    if (this.player) {
      if (fromDirection === "left") { this.player.x = ARENA.right - 50; this.player.y = H / 2; }
      else if (fromDirection === "right") { this.player.x = ARENA.left + 50; this.player.y = H / 2; }
      else if (fromDirection === "up") { this.player.x = W / 2; this.player.y = ARENA.bottom - 50; }
      else if (fromDirection === "down") { this.player.x = W / 2; this.player.y = ARENA.top + 50; }
      else { this.player.x = W / 2; this.player.y = H / 2; }
      this.player.onRoomEnter?.();
    }
    this.transition = 0.42;
    if (!room.started && room.type !== "start") {
      room.started = true;
      this.spawnRoom(room);
    }
    if (room.type === "tutorial") {
      this.showToast(this.player.characterId === "wenyu" ? "归恒校准庭" : "星弦演武庭");
    } else {
      const baseLabel = this.floorConfig.labels[room.type];
      const depthLabel = room.type === "combat" ? ` · 界深 ${room.depth}` : "";
      this.showToast(`第 ${this.currentFloor} 层 · ${baseLabel}${depthLabel}`);
    }
  }

  spawnRoom(room) {
    if (room.type === "boss") {
      const bossConfig = this.floorConfig.boss;
      const boss = new Enemy("boss", W / 2, 300, room.depth + this.floorConfig.enemyLevelBonus + 1);
      boss.name = bossConfig.name;
      boss.maxHp = bossConfig.hp;
      boss.hp = boss.maxHp;
      boss.damage = bossConfig.damage;
      boss.speed = bossConfig.speed;
      boss.anchorCount = bossConfig.anchors;
      boss.bossTier = this.currentFloor;
      this.enemies.push(boss);
      this.showToast(boss.name);
      window.setTimeout(() => {
        if (this.currentRoom === room && this.state === "playing") this.showBossIntro(boss);
      }, 220);
      return;
    }
    const count = room.type === "elite"
      ? 5 + this.floorConfig.enemyCountBonus
      : 2 + this.floorConfig.enemyCountBonus + Math.min(3, room.depth);
    const types = room.type === "elite" ? ["brute", "sentinel", "archer"] : this.floorConfig.enemyPool;
    for (let i = 0; i < count; i += 1) {
      const type = room.type === "elite" && i === 0 ? "sentinel" : types[Math.floor(this.rng() * types.length)];
      const level = room.depth + this.floorConfig.enemyLevelBonus + (room.type === "elite" ? 2 : 0);
      const enemy = new Enemy(type, 0, 0, level);
      const position = this.findSpawnPosition(enemy.r);
      enemy.x = position.x;
      enemy.y = position.y;
      this.enemies.push(enemy);
    }
  }

  spawnAdds(count) {
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * TAU + rand(0.4, -0.4);
      const radius = 220;
      const x = clamp(W / 2 + Math.cos(a) * radius, ARENA.left + 50, ARENA.right - 50);
      const y = clamp(H / 2 + Math.sin(a) * radius, ARENA.top + 50, ARENA.bottom - 50);
      const level = this.currentRoom.depth + (this.floorConfig?.enemyLevelBonus || 0) + 1;
      const enemy = new Enemy(i % 2 ? "archer" : "wraith", 0, 0, level);
      const position = this.findSpawnPosition(enemy.r, { x, y }, 150);
      enemy.x = position.x;
      enemy.y = position.y;
      this.enemies.push(enemy);
      this.shockwave(position.x, position.y, COLORS.violet, 40);
    }
  }

  showBossIntro(boss = this.enemies.find((enemy) => enemy.type === "boss" && !enemy.dead)) {
    if (this.state !== "playing") return;
    const bossConfig = this.floorConfig?.boss;
    bossIntroEyebrow.textContent = this.currentFloor === this.totalFloors ? "BOUNDARY SOVEREIGN" : `BOUNDARY PROJECTION · FLOOR ${this.currentFloor}`;
    bossIntroTitle.textContent = boss?.name || bossConfig?.name || "失序司界 · 厄衡";
    bossIntroLore.textContent = bossConfig?.lore || "前代界标校准者。它将所有偏离视为错误，并以破碎星图抹去不应存在的道路。";
    bossPhaseTwo.textContent = `Ⅱ ${boss?.anchorCount || bossConfig?.anchors || 7}锚封律`;
    this.state = "bossIntro";
    input.mouse.down = false;
    this.setScreen(bossIntroScreen, true);
    this.sound.tone(72, 0.8, "sawtooth", 0.12, -18);
  }

  closeBossIntro() {
    if (this.state !== "bossIntro") return;
    this.state = "playing";
    this.lastTime = performance.now();
    this.setScreen(bossIntroScreen, false);
    this.announceBossSkill("裁界观测", `第 ${this.currentFloor} 层校准开始 · 观察紫红预警`, 2.8);
  }

  announceBossSkill(name, detail = "", duration = 2.2) {
    this.bossSkillName = name;
    this.bossSkillDetail = detail;
    this.bossSkillTimer = duration;
    this.sound.tone(135, 0.32, "triangle", 0.1, 75);
  }

  spawnBossAnchors(boss) {
    const radius = 225;
    const count = boss.anchorCount || 7;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (i / count) * TAU;
      const x = W / 2 + Math.cos(angle) * radius;
      const y = H / 2 + Math.sin(angle) * radius * 0.82;
      const anchor = new Enemy("anchor", x, y, 1);
      this.enemies.push(anchor);
      this.shockwave(x, y, "#d06aa8", 48);
    }
    this.hazards = [];
    this.enemyProjectiles = [];
    this.shockwave(boss.x, boss.y, "#e266a7", 180);
  }

  castBossPattern(boss, phase, pattern, targetAngle, anchorsAlive) {
    const index = pattern % 3;
    if (anchorsAlive) {
      if (index === 0) this.castFallingMarks(boss, 1.2, 3);
      else if (index === 1) this.castStarRing(boss, 14, 250, 0.55);
      else this.castBoundaryLines(boss, targetAngle, 2, 1.15);
      return;
    }

    if (phase === 1) {
      if (index === 0) this.castBoundaryLines(boss, targetAngle, 2, 1.2);
      else if (index === 1) this.castFallingMarks(boss, 1.25, 3);
      else this.castStarRing(boss, 16, 270, 0.45);
    } else if (phase === 2) {
      if (index === 0) this.castBoundaryLines(boss, targetAngle, 3, 1.05);
      else if (index === 1) this.castBoundaryCollapse(boss, 310, 1.45);
      else this.castStarRing(boss, 18, 300, 0.38);
    } else if (index === 0) {
      this.castBoundaryLines(boss, targetAngle, 3, 0.88);
      this.castFallingMarks(boss, 1.12, 2, false);
    } else if (index === 1) {
      this.castBoundaryCollapse(boss, 275, 1.15);
      this.castStarRing(boss, 20, 325, 0.3, false);
    } else {
      this.castBoundaryLines(boss, targetAngle + 0.45, 4, 0.78);
      this.castFallingMarks(boss, 0.98, 4, false);
    }
  }

  castBoundaryLines(boss, targetAngle, count, delay) {
    this.announceBossSkill("界线裁决", "离开紫红光带", delay + 0.65);
    this.pixelBurst(boss.x, boss.y, "boundary", 150, 0.5, targetAngle);
    const spread = count === 2 ? Math.PI / 2 : Math.PI / count;
    for (let i = 0; i < count; i += 1) {
      this.hazards.push(new BossHazard("line", {
        x: boss.x,
        y: boss.y,
        angle: targetAngle + i * spread,
        width: 82,
        delay: delay + i * 0.08,
        damage: boss.outgoingDamage() * 1.05,
        color: "#de5c9b",
      }));
    }
  }

  castFallingMarks(boss, delay, count, announce = true) {
    if (announce) this.announceBossSkill("坠界印", "让落点彼此分离", delay + 0.65);
    const base = { x: this.player.x, y: this.player.y };
    for (let i = 0; i < count; i += 1) {
      const angle = (i / Math.max(1, count - 1)) * Math.PI - Math.PI / 2;
      const offset = i === 0 ? 0 : 120 + i * 15;
      this.hazards.push(new BossHazard("circle", {
        x: clamp(base.x + Math.cos(angle) * offset, ARENA.left + 90, ARENA.right - 90),
        y: clamp(base.y + Math.sin(angle) * offset, ARENA.top + 90, ARENA.bottom - 90),
        radius: i === 0 ? 94 : 78,
        delay: delay + i * 0.12,
        damage: boss.outgoingDamage() * 0.92,
        color: "#c459aa",
      }));
      this.pixelBurst(clamp(base.x + Math.cos(angle) * offset, ARENA.left + 90, ARENA.right - 90), clamp(base.y + Math.sin(angle) * offset, ARENA.top + 90, ARENA.bottom - 90), "warning", 104, 0.58);
    }
  }

  castBoundaryCollapse(boss, safeRadius, delay) {
    this.announceBossSkill("归界收束", "进入中央界环以内", delay + 0.75);
    this.pixelBurst(boss.x, boss.y, "boundary", 210, 0.62);
    this.hazards.push(new BossHazard("outside", {
      x: boss.x,
      y: boss.y,
      radius: safeRadius,
      delay,
      duration: 0.36,
      damage: boss.outgoingDamage() * 1.15,
      color: "#cf4d90",
    }));
  }

  castStarRing(boss, count, speed, rotationOffset = 0, announce = true) {
    if (announce) this.announceBossSkill("失序星环", "从校准刃之间寻找缺口", 1.8);
    this.pixelBurst(boss.x, boss.y, "star", 176, 0.58, rotationOffset);
    const offset = this.elapsed * 0.8 + rotationOffset;
    for (let i = 0; i < count; i += 1) {
      if (i % 7 === 0) continue;
      const angle = offset + (i / count) * TAU;
      this.enemyProjectiles.push(new EnemyProjectile(boss.x, boss.y, angle, speed, boss.outgoingDamage() * 0.58, i % 2 ? "#a96fdd" : "#df5b9a", 7));
    }
    for (let i = 0; i < 5; i += 1) {
      this.enemyProjectiles.push(new EnemyProjectile(boss.x, boss.y, Math.atan2(this.player.y - boss.y, this.player.x - boss.x) + (i - 2) * 0.12, speed + 70, boss.outgoingDamage() * 0.55, "#ec6b9a", 6));
    }
    this.shockwave(boss.x, boss.y, "#bd78de", 94);
  }

  drawBossAnchorLinks() {
    const boss = this.enemies.find((enemy) => enemy.type === "boss" && !enemy.dead);
    if (!boss) return;
    const anchors = this.enemies.filter((enemy) => enemy.type === "anchor" && !enemy.dead);
    if (!anchors.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(224,92,157,0.48)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#d65b9e";
    ctx.shadowBlur = 12;
    ctx.setLineDash([8, 10]);
    ctx.lineDashOffset = -this.elapsed * 44;
    for (const anchor of anchors) {
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(anchor.x, anchor.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  isSpawnPositionClear(point, radius, minPlayerDistance = 320, enemyPadding = 20) {
    const edgePadding = 14;
    if (point.x < ARENA.left + radius + edgePadding || point.x > ARENA.right - radius - edgePadding) return false;
    if (point.y < ARENA.top + radius + edgePadding || point.y > ARENA.bottom - radius - edgePadding) return false;
    if (this.player && dist(point, this.player) < minPlayerDistance) return false;
    if (this.currentRoom.obstacles.some((obstacle) => dist(point, obstacle) < obstacle.r + radius + 12)) return false;
    if ((this.currentRoom.mechanisms || []).some((mechanism) => dist(point, mechanism) < mechanism.r + radius + 34)) return false;
    return this.enemies.every((enemy) => enemy.dead || dist(point, enemy) >= enemy.r + radius + enemyPadding);
  }

  findSpawnPosition(radius = 24, preferred = null, minPlayerDistance = 320) {
    const candidates = [];
    if (preferred) {
      candidates.push(preferred);
      for (let ring = 1; ring <= 4; ring += 1) {
        for (let i = 0; i < 12; i += 1) {
          const angle = (i / 12) * TAU + ring * 0.37;
          candidates.push({
            x: preferred.x + Math.cos(angle) * ring * 42,
            y: preferred.y + Math.sin(angle) * ring * 42,
          });
        }
      }
    }
    for (const point of candidates) {
      if (this.isSpawnPositionClear(point, radius, minPlayerDistance)) return point;
    }

    for (let tries = 0; tries < 90; tries += 1) {
      const point = {
        x: rand(ARENA.right - radius - 18, ARENA.left + radius + 18),
        y: rand(ARENA.bottom - radius - 18, ARENA.top + radius + 18),
      };
      if (this.isSpawnPositionClear(point, radius, minPlayerDistance)) return point;
    }

    const gridStep = Math.max(58, radius * 2 + 26);
    for (const playerDistance of [minPlayerDistance, Math.min(180, minPlayerDistance), 90]) {
      const safe = [];
      for (let y = ARENA.top + radius + 18; y <= ARENA.bottom - radius - 18; y += gridStep) {
        for (let x = ARENA.left + radius + 18; x <= ARENA.right - radius - 18; x += gridStep) {
          const point = { x, y };
          if (this.isSpawnPositionClear(point, radius, playerDistance, 8)) safe.push(point);
        }
      }
      if (safe.length > 0) return safe[Math.floor(this.rng() * safe.length)];
    }

    // Keep obstacle safety mandatory even if a future room packs in far more entities.
    let best = null;
    let bestScore = -Infinity;
    for (let y = ARENA.top + radius + 16; y <= ARENA.bottom - radius - 16; y += 28) {
      for (let x = ARENA.left + radius + 16; x <= ARENA.right - radius - 16; x += 28) {
        const point = { x, y };
        if (this.currentRoom.obstacles.some((obstacle) => dist(point, obstacle) < obstacle.r + radius + 12)) continue;
        if ((this.currentRoom.mechanisms || []).some((mechanism) => dist(point, mechanism) < mechanism.r + radius + 34)) continue;
        const playerClearance = this.player ? dist(point, this.player) - this.player.r : 9999;
        const enemyClearance = this.enemies.reduce(
          (clearance, enemy) => Math.min(clearance, dist(point, enemy) - enemy.r),
          9999,
        );
        const score = Math.min(playerClearance, enemyClearance);
        if (score > bestScore) {
          best = point;
          bestScore = score;
        }
      }
    }
    return best || { x: W / 2, y: H / 2 };
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      if (!input.keys.has(event.code)) input.pressed.add(event.code);
      input.keys.add(event.code);
      if (event.code === "Escape") {
        if (this.state === "settings") this.closeSettings();
        else if (this.state === "bestiary") this.closeBestiary();
        else this.togglePause();
      }
      if (this.state === "choice" && ["Digit1", "Digit2", "Digit3"].includes(event.code)) this.chooseUpgrade(Number(event.code.slice(-1)) - 1);
      if (event.code === "Enter" && this.mode === "tutorial" && this.tutorial?.active && this.getTutorialSteps()[this.tutorial.index].manual) this.handleTutorialNext();
    });
    window.addEventListener("keyup", (event) => input.keys.delete(event.code));
    canvas.addEventListener("pointermove", (event) => this.updatePointer(event));
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.state !== "playing") return;
      this.updatePointer(event);
      if (this.player?.handlePointerDown?.()) return;
      input.mouse.down = true;
      this.sound.enable();
    });
    window.addEventListener("pointerup", (event) => {
      if (event.button !== 0) return;
      if (input.mouse.down) input.mouse.released = true;
      input.mouse.down = false;
    });
    document.getElementById("start-button").addEventListener("click", () => this.start());
    characterButtons.forEach((button) => button.addEventListener("click", () => this.selectCharacter(button.dataset.character)));
    document.getElementById("tutorial-button").addEventListener("click", () => this.startTutorial());
    document.getElementById("bestiary-button").addEventListener("click", () => this.openBestiary());
    document.getElementById("pause-bestiary-button").addEventListener("click", () => this.openBestiary());
    document.getElementById("title-settings-button").addEventListener("click", () => this.openSettings());
    document.getElementById("pause-settings-button").addEventListener("click", () => this.openSettings());
    document.getElementById("settings-close").addEventListener("click", () => this.closeSettings());
    volumeSlider.addEventListener("input", () => {
      this.sound.setVolume(Number(volumeSlider.value) / 100);
      this.syncSoundSettingsUI();
    });
    muteButton.addEventListener("click", () => {
      this.sound.enable();
      this.sound.setMuted(!this.sound.muted);
      this.syncSoundSettingsUI();
    });
    document.getElementById("sound-preview-button").addEventListener("click", () => {
      if (this.sound.muted) this.sound.setMuted(false);
      this.syncSoundSettingsUI();
      this.sound.preview();
    });
    document.getElementById("bestiary-close").addEventListener("click", () => this.closeBestiary());
    document.getElementById("boss-intro-continue").addEventListener("click", () => this.closeBossIntro());
    document.getElementById("restart-button").addEventListener("click", () => this.start());
    tutorialNext.addEventListener("click", () => this.handleTutorialNext());
    tutorialSkip.addEventListener("click", () => this.start());
    window.addEventListener("blur", () => {
      input.keys.clear();
      input.mouse.down = false;
      if (this.state === "playing") this.togglePause();
    });
  }

  updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (W / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (H / rect.height);
  }

  resize() {
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      input.mouse.down = false;
      this.setScreen(pauseScreen, true);
    } else if (this.state === "paused") {
      this.state = "playing";
      this.lastTime = performance.now();
      this.setScreen(pauseScreen, false);
    }
  }

  setScreen(element, visible) {
    element.classList.toggle("visible", visible);
    element.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  loop(now) {
    const dt = Math.min(0.033, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;
    if (this.state === "playing") this.update(dt);
    else this.updateAmbient(dt);
    this.render();
    input.mouse.released = false;
    input.pressed.clear();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.elapsed += dt;
    this.transition = Math.max(0, this.transition - dt);
    this.toastTimer = Math.max(0, this.toastTimer - dt);
    this.bossSkillTimer = Math.max(0, this.bossSkillTimer - dt);
    this.floorBannerTimer = Math.max(0, this.floorBannerTimer - dt);
    if (this.toastTimer <= 0) toastElement.classList.remove("show");
    this.shake = Math.max(0, this.shake - dt * 28);

    if (input.pressed.has("KeyE")) this.player.switchMagic();
    if (input.pressed.has("KeyQ")) this.player.toggleSpirit();
    if (input.pressed.has("Space")) this.player.startRoll();
    if (input.pressed.has("KeyR")) this.player.startDance();

    this.player.update(dt);
    this.checkDoorTransition();
    this.updateRoomMechanisms(dt);
    for (const enemy of this.enemies) enemy.update(dt, this);
    this.separateEnemies();
    this.arrows = this.arrows.filter((arrow) => arrow.update(dt, this));
    this.enemyProjectiles = this.enemyProjectiles.filter((projectile) => projectile.update(dt, this));
    this.hazards = this.hazards.filter((hazard) => hazard.update(dt, this));
    this.pickups = this.pickups.filter((pickup) => pickup.update(dt, this));
    this.effects = this.effects.filter((effect) => effect.update(dt));
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);

    if (this.mode === "tutorial") this.updateTutorial(dt);
    if (this.currentRoom.started && !this.currentRoom.cleared && this.enemies.length === 0) this.clearRoom();
    if (this.pendingVictory > 0) {
      this.pendingVictory -= dt;
      if (this.pendingVictory <= 0) this.victory();
    }
    if (this.pendingFloorTransition > 0) {
      this.pendingFloorTransition -= dt;
      if (this.pendingFloorTransition <= 0) {
        this.advanceFloor();
        return;
      }
    }
    if (this.pendingFloorReward && this.floorBannerTimer <= 2.15) {
      this.pendingFloorReward = false;
      this.offerUpgrade();
    }
  }

  updateRoomMechanisms(dt) {
    const mechanisms = this.currentRoom?.mechanisms || [];
    for (const mechanism of mechanisms) {
      mechanism.hitCooldown = Math.max(0, mechanism.hitCooldown - dt);
      if (this.currentRoom.cleared) {
        mechanism.state = "idle";
        mechanism.progress = 0;
        continue;
      }
      const progress = ((this.elapsed / mechanism.cycle + mechanism.phaseOffset) % 1 + 1) % 1;
      const activeStart = mechanism.type === "blade" ? 0.52 : 0.66;
      const activeEnd = mechanism.type === "blade" ? 0.91 : 0.84;
      const previous = mechanism.state;
      mechanism.progress = progress;
      mechanism.state = progress >= activeStart && progress < activeEnd
        ? "active"
        : progress >= activeStart - 0.16 && progress < activeStart
          ? "warning"
          : "idle";
      if (mechanism.state === "active" && previous !== "active") {
        const kind = mechanism.type === "ember" ? "meteor" : mechanism.type === "coil" ? "tech" : mechanism.type === "blade" ? "boundary" : "warning";
        this.effects.push(new Effect("pixelBurst", mechanism.x, mechanism.y - 6, { kind, size: mechanism.r * 2.4, life: 0.34 }));
      }
      if (mechanism.state !== "active" || mechanism.hitCooldown > 0) continue;
      if (dist(mechanism, this.player) <= mechanism.r + this.player.r * 0.65) {
        const angle = Math.atan2(this.player.y - mechanism.y, this.player.x - mechanism.x);
        this.player.hurt(5.5 + Math.max(0, this.currentFloor) * 1.5, angle);
        mechanism.hitCooldown = 0.72;
      }
      for (const robot of this.player.robots || []) {
        if (robot.dead || dist(mechanism, robot) > mechanism.r + robot.r * 0.55) continue;
        robot.takeDamage(3.5 + Math.max(0, this.currentFloor));
        mechanism.hitCooldown = Math.max(mechanism.hitCooldown, 0.48);
        break;
      }
    }
  }

  updateAmbient(dt) {
    this.elapsed += dt * 0.35;
    this.effects = this.effects.filter((effect) => effect.update(dt));
  }

  checkDoorTransition() {
    if (!this.currentRoom.cleared || this.transition > 0 || this.pendingFloorTransition > 0) return;
    const room = this.currentRoom;
    const centerX = Math.abs(this.player.x - W / 2) < ARENA.door / 2;
    const centerY = Math.abs(this.player.y - H / 2) < ARENA.door / 2;
    let target = null;
    let from = null;
    if (centerY && this.player.x <= ARENA.left + this.player.r + 2 && input.keys.has("KeyA")) {
      target = this.rooms.get(keyOf(room.gx - 1, room.gy)); from = "left";
    } else if (centerY && this.player.x >= ARENA.right - this.player.r - 2 && input.keys.has("KeyD")) {
      target = this.rooms.get(keyOf(room.gx + 1, room.gy)); from = "right";
    } else if (centerX && this.player.y <= ARENA.top + this.player.r + 2 && input.keys.has("KeyW")) {
      target = this.rooms.get(keyOf(room.gx, room.gy - 1)); from = "up";
    } else if (centerX && this.player.y >= ARENA.bottom - this.player.r - 2 && input.keys.has("KeyS")) {
      target = this.rooms.get(keyOf(room.gx, room.gy + 1)); from = "down";
    }
    if (target) this.enterRoom(target, from);
  }

  moveActor(actor, dx, dy) {
    this.resolveObstacleOverlap(actor);
    const oldX = actor.x;
    const oldY = actor.y;
    actor.x += dx;
    actor.x = clamp(actor.x, ARENA.left + actor.r, ARENA.right - actor.r);
    for (const obstacle of this.currentRoom.obstacles) {
      const d = Math.hypot(actor.x - obstacle.x, actor.y - obstacle.y);
      const min = actor.r + obstacle.r + 3;
      if (d < min) actor.x = oldX;
    }
    actor.y += dy;
    actor.y = clamp(actor.y, ARENA.top + actor.r, ARENA.bottom - actor.r);
    for (const obstacle of this.currentRoom.obstacles) {
      const d = Math.hypot(actor.x - obstacle.x, actor.y - obstacle.y);
      const min = actor.r + obstacle.r + 3;
      if (d < min) actor.y = oldY;
    }
  }

  resolveObstacleOverlap(actor) {
    if (!actor || !this.currentRoom?.obstacles?.length) return;
    const origin = { x: actor.x, y: actor.y };
    for (let pass = 0; pass < 12; pass += 1) {
      let corrected = false;
      for (const obstacle of this.currentRoom.obstacles) {
        let dx = actor.x - obstacle.x;
        let dy = actor.y - obstacle.y;
        let distance = Math.hypot(dx, dy);
        const minimum = actor.r + obstacle.r + 4;
        if (distance >= minimum) continue;
        if (distance < 0.001) {
          const angle = ((actor.id || 1) * 2.39996 + (obstacle.phase || 0)) % TAU;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }
        const push = minimum - distance;
        actor.x += (dx / distance) * push;
        actor.y += (dy / distance) * push;
        actor.x = clamp(actor.x, ARENA.left + actor.r, ARENA.right - actor.r);
        actor.y = clamp(actor.y, ARENA.top + actor.r, ARENA.bottom - actor.r);
        corrected = true;
      }
      if (!corrected) break;
    }

    const isClear = (point) => {
      if (point.x < ARENA.left + actor.r || point.x > ARENA.right - actor.r) return false;
      if (point.y < ARENA.top + actor.r || point.y > ARENA.bottom - actor.r) return false;
      return this.currentRoom.obstacles.every(
        (obstacle) => dist(point, obstacle) >= actor.r + obstacle.r + 4,
      );
    };
    if (isClear(actor)) return;

    // If an obstacle sits near a wall, a direct push can aim into that wall and
    // be cancelled by arena clamping. Search the nearest complete free circle instead.
    const inwardAngle = Math.atan2(H / 2 - origin.y, W / 2 - origin.x);
    for (let searchRadius = 12; searchRadius <= 180; searchRadius += 12) {
      for (let i = 0; i < 24; i += 1) {
        const angle = inwardAngle + (i / 24) * TAU;
        const point = {
          x: origin.x + Math.cos(angle) * searchRadius,
          y: origin.y + Math.sin(angle) * searchRadius,
        };
        if (!isClear(point)) continue;
        actor.x = point.x;
        actor.y = point.y;
        return;
      }
    }

    let nearest = null;
    let nearestDistance = Infinity;
    for (let y = ARENA.top + actor.r; y <= ARENA.bottom - actor.r; y += 24) {
      for (let x = ARENA.left + actor.r; x <= ARENA.right - actor.r; x += 24) {
        const point = { x, y };
        const distance = dist(point, origin);
        if (distance < nearestDistance && isClear(point)) {
          nearest = point;
          nearestDistance = distance;
        }
      }
    }
    if (nearest) {
      actor.x = nearest.x;
      actor.y = nearest.y;
    }
  }

  separateEnemies() {
    for (let i = 0; i < this.enemies.length; i += 1) {
      for (let j = i + 1; j < this.enemies.length; j += 1) {
        const a = this.enemies[i];
        const b = this.enemies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(0.1, Math.hypot(dx, dy));
        const overlap = a.r + b.r + 7 - d;
        if (overlap > 0) {
          const push = overlap * 0.18;
          a.x -= (dx / d) * push;
          a.y -= (dy / d) * push;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
        }
      }
    }
    for (const enemy of this.enemies) this.resolveObstacleOverlap(enemy);
  }

  nearestEnemy(x, y, radius = Infinity) {
    let best = null;
    let bestDistance = radius;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d < bestDistance) { best = enemy; bestDistance = d; }
    }
    return best;
  }

  damageEnemy(enemy, amount, kind, angle = 0, silent = false) {
    if (enemy.dead) return;
    if (enemy.type === "boss" && this.enemies.some((target) => target.type === "anchor" && !target.dead)) {
      if (!silent) {
        enemy.hitFlash = 0.35;
        this.floatText(enemy.x, enemy.y - enemy.r - 12, "界锚护盾", "#ef8bc4", 12);
        this.shockwave(enemy.x, enemy.y, "#d06aa8", 72);
        this.sound.shield();
      }
      return;
    }
    if (kind === "tether") amount *= this.player.tetherMod;
    enemy.hp -= amount;
    enemy.hitFlash = 1;
    if (!silent) {
      const pan = clamp((enemy.x - W / 2) / (W * 0.45), -1, 1);
      this.sound.hit(kind, amount, enemy.type, pan);
      this.floatText(enemy.x, enemy.y - enemy.r - 8, `${Math.ceil(amount)}`, kind === "normal" ? COLORS.gold : kind === "tether" ? COLORS.force : "#d9f5ee", amount > 50 ? 17 : 13);
      this.spark(enemy.x, enemy.y, kind === "normal" ? COLORS.gold : kind === "force" ? COLORS.force : "#beded9", amount > 50 ? 10 : 5);
      this.pixelBurst(enemy.x, enemy.y - enemy.r * 0.18, kind === "tether" ? "force" : kind, amount > 50 ? 112 : 78, 0.3, angle);
      enemy.x += Math.cos(angle) * Math.min(13, amount * 0.1);
      enemy.y += Math.sin(angle) * Math.min(13, amount * 0.1);
      this.resolveObstacleOverlap(enemy);
    }
    if (enemy.type === "dummy" && enemy.hp <= 0) {
      enemy.hp = enemy.maxHp;
      this.shockwave(enemy.x, enemy.y, COLORS.jade, 56);
      return;
    }
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    this.stats.kills += 1;
    this.shake = Math.max(this.shake, enemy.type === "boss" ? 18 : 4);
    this.spark(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 42 : 15);
    this.shockwave(enemy.x, enemy.y, enemy.color, enemy.r * 1.8);
    this.pixelBurst(enemy.x, enemy.y, enemy.type === "boss" ? "bossBreak" : enemy.type === "anchor" ? "boundary" : "normal", enemy.type === "boss" ? 250 : 110, enemy.type === "boss" ? 0.75 : 0.42);
    if (!["boss", "anchor", "dummy"].includes(enemy.type) && Math.random() < 0.58) {
      this.pickups.push(new Pickup(enemy.x, enemy.y, Math.random() < 0.2 ? "health" : "energy"));
    }
    if (enemy.type === "anchor") {
      const remaining = this.enemies.filter((target) => target.type === "anchor" && !target.dead).length;
      if (remaining === 0) {
        this.announceBossSkill("界锚尽毁", "厄衡的护盾已经解除", 2.1);
        const boss = this.enemies.find((target) => target.type === "boss" && !target.dead);
        if (boss) this.shockwave(boss.x, boss.y, "#f08ac2", 150);
      } else {
        this.showToast(`失序界锚剩余 ${remaining}`);
      }
    }
  }

  explode(x, y, damage, radius, source) {
    this.shockwave(x, y, "#f09a68", radius);
    this.spark(x, y, "#ffb072", 22);
    this.pixelBurst(x, y, "meteor", Math.min(230, radius * 1.65), 0.52);
    this.shake = Math.max(this.shake, 8);
    this.sound.tone(90, 0.26, "sawtooth", 0.16, -42);
    for (const enemy of this.enemies) {
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d > radius + enemy.r) continue;
      const scale = 1 - clamp(d / (radius + enemy.r), 0, 0.72);
      this.damageEnemy(enemy, damage * scale, "meteor", Math.atan2(enemy.y - y, enemy.x - x));
      this.player.onMagicHit("meteor", source === "spirit");
    }
  }

  spark(x, y, color, count = 8) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(TAU);
      const speed = rand(210, 45);
      this.effects.push(new Effect("particle", x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: rand(8, 3),
        life: rand(0.52, 0.2),
        rotation: angle,
        spin: rand(4, -4),
      }));
    }
  }

  shockwave(x, y, color, size) {
    this.effects.push(new Effect("ring", x, y, { color, size, life: 0.48 }));
  }

  pixelBurst(x, y, kind = "normal", size = 84, life = 0.38, rotation = 0) {
    this.effects.push(new Effect("pixelBurst", pixel(x), pixel(y), { kind, size, life, rotation }));
  }

  floatText(x, y, text, color, size) {
    this.effects.push(new Effect("text", x + rand(8, -8), y, { color, text, size, life: 0.72, vy: -22 }));
  }

  clearRoom() {
    this.currentRoom.cleared = true;
    this.stats.rooms += 1;
    if (this.mode !== "tutorial") this.floorRoomsCleared += 1;
    this.enemyProjectiles = [];
    this.hazards = [];
    this.player.heal(this.currentRoom.type === "elite" ? 10 : 5);
    this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 12);
    this.shockwave(W / 2, H / 2, COLORS.jade, 320);
    this.sound.chime();
    if (this.currentRoom.type === "boss") {
      this.stats.floors = Math.max(this.stats.floors, this.currentFloor);
      if (this.currentFloor < this.totalFloors) {
        this.pendingFloorTransition = 1.8;
        this.showToast(`第 ${this.currentFloor} 层稳定 · 下一界层正在生成`);
      } else {
        this.pendingVictory = 1.4;
        this.showToast("失序消散，三层星图重新显现");
      }
    } else {
      this.showToast("界隙稳定 · 获得星痕");
      window.setTimeout(() => {
        if (this.state === "playing" && this.currentRoom.cleared) this.offerUpgrade();
      }, 520);
    }
  }

  advanceFloor() {
    if (this.currentFloor >= this.totalFloors) return;
    this.currentFloor += 1;
    this.buildDungeon(this.currentFloor);
    this.enemies = [];
    this.arrows = [];
    this.enemyProjectiles = [];
    this.hazards = [];
    this.effects = [];
    this.pickups = [];
    this.bossSkillName = "";
    this.bossSkillDetail = "";
    this.bossSkillTimer = 0;
    this.player.x = W / 2;
    this.player.y = H / 2;
    this.player.charge = 0;
    this.player.attackCooldown = 0;
    this.player.rollTimer = 0;
    this.player.danceTimer = 0;
    this.player.invulnerable = 1.25;
    this.player.heal(this.player.maxHp * 0.3);
    this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + this.player.maxEnergy * 0.45);
    this.enterRoom(this.rooms.get("0,0"), null);
    this.transition = 1.05;
    this.floorBannerTimer = 3.4;
    this.pendingFloorReward = true;
    this.showToast(`进入第 ${this.currentFloor} 层 · ${this.floorConfig.name}`);
    this.sound.tone(96, 0.75, "triangle", 0.14, 170);
  }

  offerUpgrade() {
    const choices = [];
    const unlockPool = this.player.characterId === "wenyu" ? [] : SKILL_UNLOCKS.filter((upgrade) => upgrade.available(this.player));
    if (unlockPool.length > 0) {
      const unlock = unlockPool[Math.floor(this.rng() * unlockPool.length)];
      choices.push(this.materializeSkillUnlock(unlock));
    }

    const upgradeSource = this.player.characterId === "wenyu" ? ENGINEER_UPGRADES : UPGRADES;
    const pool = upgradeSource.filter((upgrade) => !upgrade.available || upgrade.available(this.player));
    while (choices.length < 3 && pool.length > 0) {
      const index = Math.floor(this.rng() * pool.length);
      const [upgrade] = pool.splice(index, 1);
      choices.push(this.materializeUpgrade(upgrade));
    }
    for (let i = choices.length - 1; i > 0; i -= 1) {
      const swap = Math.floor(this.rng() * (i + 1));
      [choices[i], choices[swap]] = [choices[swap], choices[i]];
    }

    this.currentChoices = choices;
    choicesElement.innerHTML = "";
    this.currentChoices.forEach((upgrade, index) => {
      const button = document.createElement("button");
      const gradeLabel = upgrade.kind === "unlock" ? "界律解锁" : upgrade.rarity.label;
      button.className = `choice-card rarity-${upgrade.rarity.key}${upgrade.kind === "unlock" ? " is-unlock" : ""}`;
      button.style.setProperty("--accent", upgrade.rarity.color);
      button.style.setProperty("--rarity-power", upgrade.rarity.power);
      button.setAttribute("aria-label", `${gradeLabel} ${upgrade.name}：${upgrade.description}`);
      button.innerHTML = `
        <span class="choice-energy" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="choice-topline">
          <span class="choice-number">0${index + 1}</span>
          <span class="choice-rarity">${gradeLabel}</span>
        </span>
        <span class="choice-icon">${upgrade.icon}</span>
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <span class="choice-footer">
          <span>${upgrade.category}</span>
          <strong>${upgrade.kind === "unlock" ? "永久解锁" : `增幅 ×${upgrade.rarity.power.toFixed(2)}`}</strong>
        </span>
      `;
      button.addEventListener("click", () => this.chooseUpgrade(index));
      choicesElement.appendChild(button);
    });
    this.state = "choice";
    this.setScreen(choiceScreen, true);
  }

  rollUpgradeRarity() {
    let roll = this.rng();
    for (const rarity of UPGRADE_RARITIES) {
      roll -= rarity.weight;
      if (roll <= 0) return rarity;
    }
    return UPGRADE_RARITIES[0];
  }

  materializeUpgrade(upgrade) {
    const rarity = this.rollUpgradeRarity();
    return {
      ...upgrade,
      kind: "buff",
      rarity,
      description: upgrade.description(rarity.power),
      apply: (player) => upgrade.apply(player, rarity.power),
    };
  }

  materializeSkillUnlock(upgrade) {
    const rarity = UPGRADE_RARITIES[2];
    return { ...upgrade, kind: "unlock", rarity };
  }

  chooseUpgrade(index) {
    const upgrade = this.currentChoices[index];
    if (!upgrade || this.state !== "choice") return;
    upgrade.apply(this.player);
    const record = upgrade.kind === "unlock" ? `界律 · ${upgrade.name}` : `${upgrade.rarity.name} · ${upgrade.name}`;
    this.stats.upgrades.push(record);
    this.state = "playing";
    this.lastTime = performance.now();
    this.setScreen(choiceScreen, false);
    this.showToast(upgrade.kind === "unlock" ? `界律解锁 · ${upgrade.name}` : `${upgrade.rarity.label}铭刻 · ${upgrade.name}`);
    this.sound.chime();
  }

  defeat() {
    if (this.state !== "playing") return;
    this.state = "ended";
    input.mouse.down = false;
    document.getElementById("end-eyebrow").textContent = "JOURNEY ENDED";
    document.getElementById("end-title").textContent = this.player.characterId === "wenyu" ? "网络离线" : "星图黯淡";
    document.getElementById("end-copy").textContent = this.player.characterId === "wenyu"
      ? "归恒链路暂时中断，但制造协议仍保存在下一次重构中。重新排列配置，网络就会再次上线。"
      : "界弦沉寂，但深界会再次重构。下一支箭仍有机会抵达终点。";
    this.populateStats();
    this.setScreen(endScreen, true);
  }

  victory() {
    if (this.state !== "playing") return;
    this.state = "ended";
    input.mouse.down = false;
    document.getElementById("end-eyebrow").textContent = "BOUNDARY RESTORED";
    document.getElementById("end-title").textContent = "星路重明";
    document.getElementById("end-copy").textContent = this.player.characterId === "wenyu"
      ? "三重界层重新接合，厄衡归于寂静。程闻屿以归恒网络重建了贯穿沉落遗迹、逆星回廊与失序深庭的稳定航路。"
      : "三重界层重新接合，厄衡归于寂静。黎星遥以界弦标定了贯穿沉落遗迹、逆星回廊与失序深庭的归途。";
    this.populateStats();
    this.setScreen(endScreen, true);
    this.sound.chime();
  }

  populateStats() {
    const time = this.formatTime(this.elapsed);
    document.getElementById("run-stats").innerHTML = `
      <span class="run-stat"><strong>${time}</strong>历时</span>
      <span class="run-stat"><strong>${this.stats.kills}</strong>击破</span>
      <span class="run-stat"><strong>${this.stats.rooms}</strong>净化房间</span>
      <span class="run-stat"><strong>${this.stats.floors}/${this.totalFloors}</strong>贯穿界层</span>
    `;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  buildBestiaryUI() {
    bestiaryList.innerHTML = BESTIARY.map((entry, index) => `
      <button class="codex-list-button${index === 0 ? " active" : ""}" data-codex-index="${index}" style="--entry-accent:${entry.accent}">
        <span class="codex-list-icon">${entry.icon}</span>
        <span class="codex-list-name"><strong>${entry.name}</strong><small>${entry.className}</small></span>
        <span class="codex-list-number">${String(index + 1).padStart(2, "0")}</span>
      </button>
    `).join("");
    for (const button of bestiaryList.querySelectorAll("button")) {
      button.addEventListener("click", () => this.selectBestiary(Number(button.dataset.codexIndex)));
    }
    this.selectBestiary(0);
  }

  selectBestiary(index) {
    const entry = BESTIARY[index];
    if (!entry) return;
    this.bestiaryIndex = index;
    bestiaryScreen.style.setProperty("--entry-accent", entry.accent);
    codexVisual.style.setProperty("--entry-accent", entry.accent);
    document.getElementById("codex-index").textContent = `ARCHIVE · ${String(index + 1).padStart(2, "0")}`;
    document.getElementById("codex-class").textContent = entry.className;
    document.getElementById("codex-name").textContent = entry.name;
    document.getElementById("codex-threat").textContent = entry.threat;
    document.getElementById("codex-lore").textContent = entry.lore;
    document.getElementById("codex-behavior").textContent = entry.behavior;
    document.getElementById("codex-counter").textContent = entry.counter;
    document.getElementById("codex-tags").innerHTML = entry.tags.map((tag) => `<span>${tag}</span>`).join("");
    codexPortrait.classList.toggle("visible", Boolean(entry.image));
    codexPortrait.src = entry.image || "";
    codexPortrait.alt = entry.image ? entry.name : "";
    codexGlyph.className = `codex-glyph ${entry.image ? "hidden" : entry.type}`;
    codexGlyph.style.setProperty("--glyph", entry.accent);
    for (const button of bestiaryList.querySelectorAll("button")) {
      button.classList.toggle("active", Number(button.dataset.codexIndex) === index);
    }
  }

  syncSoundSettingsUI() {
    const percent = Math.round(this.sound.volume * 100);
    volumeSlider.value = String(percent);
    volumeValue.value = `${percent}%`;
    volumeValue.textContent = `${percent}%`;
    muteButton.setAttribute("aria-pressed", this.sound.muted ? "true" : "false");
    muteButton.textContent = this.sound.muted ? "静音 · 开启" : "静音 · 关闭";
  }

  openSettings() {
    if (!["title", "paused"].includes(this.state)) return;
    this.settingsReturnState = this.state;
    this.state = "settings";
    input.mouse.down = false;
    this.sound.enable();
    this.syncSoundSettingsUI();
    this.setScreen(settingsScreen, true);
  }

  closeSettings() {
    if (this.state !== "settings") return;
    this.setScreen(settingsScreen, false);
    this.state = this.settingsReturnState;
    this.lastTime = performance.now();
  }

  openBestiary() {
    if (!["title", "paused", "playing"].includes(this.state)) return;
    this.bestiaryReturnState = this.state === "playing" ? "paused" : this.state;
    if (this.state === "playing") this.setScreen(pauseScreen, true);
    this.state = "bestiary";
    input.mouse.down = false;
    this.selectBestiary(this.bestiaryIndex);
    this.setScreen(bestiaryScreen, true);
  }

  closeBestiary() {
    if (this.state !== "bestiary") return;
    this.setScreen(bestiaryScreen, false);
    this.state = this.bestiaryReturnState;
    this.lastTime = performance.now();
  }

  setupTutorial() {
    // Each character gets a controlled full-kit showcase. Formal runs retain
    // their own unlock rules and lower starting resources.
    if (this.player.characterId === "wenyu") {
      this.player.configIndex = 0;
      this.player.bindingMode = false;
      this.player.robots = [];
      this.player.energy = 56;
      this.player.qCooldown = 0;
      this.player.danceCooldown = 0;
      this.player.rollCharges = 3;
    } else {
      this.player.magicUnlocked = true;
      this.player.rollUnlocked = true;
      this.player.danceUnlocked = true;
      this.player.magicIndex = 0;
      this.player.spiritActive = true;
      this.player.qCooldown = 0;
      this.player.danceCooldown = 0;
      this.player.rollCharges = 2;
    }
    this.tutorial = {
      active: true,
      index: 0,
      pending: 0,
      baseline: this.captureTutorialBaseline(),
    };
    this.setTutorialStep(0);
    tutorialDialog.classList.add("visible");
    tutorialDialog.setAttribute("aria-hidden", "false");
  }

  getTutorialSteps() {
    return this.player?.characterId === "wenyu" ? WENYU_TUTORIAL_STEPS : XINGYAO_TUTORIAL_STEPS;
  }

  hideTutorial() {
    tutorialDialog.classList.remove("visible");
    tutorialDialog.setAttribute("aria-hidden", "true");
    if (this.tutorial) this.tutorial.active = false;
  }

  captureTutorialBaseline() {
    return {
      moveDistance: this.stats.moveDistance,
      spiritToggles: this.stats.spiritToggles,
      rollVolleys: this.stats.rollVolleys,
      rollUses: this.stats.rollUses,
      danceUses: this.stats.danceUses,
      switches: this.stats.switches,
      bindings: this.stats.bindings,
      manufactures: this.stats.manufactures,
      manufacturedCount: this.player.manufacturedCount || 0,
      hitsByKind: { ...this.stats.hitsByKind },
    };
  }

  setTutorialStep(index) {
    const steps = this.getTutorialSteps();
    if (!this.tutorial || index < 0 || index >= steps.length) return;
    this.tutorial.index = index;
    this.tutorial.pending = 0;
    this.tutorial.baseline = this.captureTutorialBaseline();
    const step = steps[index];

    this.arrows = [];
    this.enemyProjectiles = [];
    if (["normal", "light", "breeze", "engineer_attack", "engineer_robot_attack"].includes(step.id)) this.spawnTutorialTargets(1);
    else if (step.id === "meteor" || step.id === "roll" || step.id === "dance") this.spawnTutorialTargets(3);
    else this.enemies = [];

    if (step.id === "normal") {
      this.player.magicIndex = 0;
      this.player.attackCooldown = 0;
      this.player.energy = Math.max(this.player.energy, 38);
    } else if (step.id === "light") {
      this.player.magicIndex = 0;
      this.player.attackCooldown = 0;
      this.player.energy = Math.max(this.player.energy, 32);
    } else if (step.id === "meteor") {
      this.player.attackCooldown = 0;
      this.player.energy = Math.max(this.player.energy, 36);
    } else if (step.id === "breeze") {
      this.player.attackCooldown = 0;
      this.player.energy = Math.max(this.player.energy, 34);
      this.player.hp = Math.min(this.player.hp, this.player.maxHp - 24);
    } else if (step.id === "retrieve") {
      this.player.spiritActive = true;
      this.player.qCooldown = 0;
    } else if (step.id === "summon") {
      this.player.spiritActive = false;
      this.player.qCooldown = 0;
    } else if (step.id === "roll") {
      this.player.rollCharges = 2;
      this.player.rollRecharge = 0;
    } else if (step.id === "dance") {
      this.player.energy = this.player.maxEnergy;
      this.player.danceCooldown = 0;
    } else if (step.id === "engineer_attack") {
      this.player.attackCooldown = 0;
    } else if (step.id === "engineer_config") {
      this.player.qCooldown = 0;
    } else if (step.id === "engineer_manufacture") {
      this.player.bindingMode = false;
      this.player.energy = Math.max(this.player.energy, this.player.maxEnergy - 9);
    } else if (step.id === "engineer_robot_attack") {
      if (this.player.robots.length === 0) this.player.manufactureRobot();
      this.player.robots.forEach((robot) => { robot.attackTimer = 0.22; });
    } else if (step.id === "engineer_bind") {
      if (this.player.robots.length === 0) this.player.manufactureRobot();
      this.player.bindingMode = false;
      this.player.robots[0].bound = false;
    } else if (step.id === "engineer_reset") {
      this.player.bindingMode = false;
      this.player.qCooldown = 0;
      this.player.rollCharges = 3;
      this.player.rollRecharge = 0;
    } else if (step.id === "engineer_mech") {
      if (this.player.robots.length === 0) this.player.manufactureRobot();
      this.player.bindingMode = false;
      this.player.energy = Math.max(this.player.energy, 70);
      this.player.danceCooldown = 0;
    }

    this.renderTutorialDialog();
    if (index > 0 && !step.final) this.sound.tone(390 + index * 18, 0.16, "sine", 0.055, 80);
  }

  spawnTutorialTargets(count) {
    this.enemies = [];
    const positions = count === 1
      ? [{ x: 1080, y: 400 }]
      : [{ x: 1020, y: 275 }, { x: 1110, y: 430 }, { x: 990, y: 590 }];
    for (let i = 0; i < count; i += 1) {
      const position = positions[i];
      this.enemies.push(new Enemy("dummy", position.x, position.y, 1));
      this.shockwave(position.x, position.y, COLORS.jade, 42);
    }
  }

  renderTutorialDialog() {
    if (!this.tutorial?.active) return;
    const steps = this.getTutorialSteps();
    const step = steps[this.tutorial.index];
    tutorialTitle.textContent = step.title;
    tutorialText.textContent = step.text;
    tutorialKey.textContent = step.key;
    tutorialStepLabel.textContent = `${this.player.characterId === "wenyu" ? "归恒引导" : "界律引导"} · ${String(this.tutorial.index + 1).padStart(2, "0")}/${steps.length}`;
    tutorialProgress.innerHTML = steps.map((_, index) => {
      const state = index < this.tutorial.index ? "done" : index === this.tutorial.index ? "current" : "";
      return `<i class="${state}"></i>`;
    }).join("");
    tutorialNext.hidden = !step.manual;
    tutorialNext.textContent = step.final ? "进入正式地牢" : "继续";
    tutorialSkip.hidden = Boolean(step.final);
    tutorialSkip.textContent = "跳过并进入地牢";
  }

  handleTutorialNext() {
    if (this.mode !== "tutorial" || !this.tutorial?.active) return;
    const step = this.getTutorialSteps()[this.tutorial.index];
    if (!step.manual) return;
    if (step.final) this.start();
    else this.setTutorialStep(this.tutorial.index + 1);
  }

  updateTutorial(dt) {
    if (!this.tutorial?.active) return;
    if (this.tutorial.pending > 0) {
      this.tutorial.pending -= dt;
      if (this.tutorial.pending <= 0) this.setTutorialStep(this.tutorial.index + 1);
      return;
    }

    const step = this.getTutorialSteps()[this.tutorial.index];
    if (step.manual) return;
    const baseline = this.tutorial.baseline;
    let complete = false;
    if (step.id === "move") complete = this.stats.moveDistance - baseline.moveDistance >= 105;
    else if (["normal", "light", "meteor", "breeze"].includes(step.id)) {
      complete = this.stats.hitsByKind[step.id] > baseline.hitsByKind[step.id];
    } else if (step.id === "retrieve") complete = !this.player.spiritActive && this.stats.spiritToggles > baseline.spiritToggles;
    else if (step.id === "summon") complete = this.player.spiritActive && this.stats.spiritToggles > baseline.spiritToggles;
    else if (step.id === "roll") complete = this.stats.rollVolleys > baseline.rollVolleys;
    else if (step.id === "dance") complete = this.stats.danceUses > baseline.danceUses;
    else if (step.id === "engineer_move") complete = this.stats.moveDistance - baseline.moveDistance >= 105;
    else if (step.id === "engineer_attack") complete = this.stats.hitsByKind.tech > baseline.hitsByKind.tech;
    else if (step.id === "engineer_config") complete = this.stats.switches > baseline.switches;
    else if (step.id === "engineer_manufacture") complete = this.player.manufacturedCount > baseline.manufacturedCount;
    else if (step.id === "engineer_robot_attack") complete = this.stats.hitsByKind.robot > baseline.hitsByKind.robot;
    else if (step.id === "engineer_bind") complete = this.stats.bindings > baseline.bindings && this.player.robots.some((robot) => robot.bound);
    else if (step.id === "engineer_reset") complete = this.stats.switches > baseline.switches && this.stats.rollUses > baseline.rollUses;
    else if (step.id === "engineer_mech") complete = this.stats.danceUses > baseline.danceUses;

    if (complete) {
      this.tutorial.pending = 0.52;
      tutorialKey.textContent = "界律已回应 · 正在进入下一步";
      this.sound.chime();
    }
  }

  recordTutorialHit(kind, enemy, source) {
    if (source !== "spirit" && this.stats.hitsByKind && Object.hasOwn(this.stats.hitsByKind, kind)) this.stats.hitsByKind[kind] += 1;
    if (this.mode === "tutorial" && enemy.type === "dummy") {
      this.effects.push(new Effect("ring", enemy.x, enemy.y, { color: kind === "normal" ? COLORS.gold : enemy.color, size: enemy.r + 20, life: 0.36 }));
    }
  }

  showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");
    this.toastTimer = 2.2;
  }

  render() {
    ctx.clearRect(0, 0, W, H);
    if (!this.currentRoom) {
      this.renderTitleBackdrop();
      return;
    }
    const shakeX = this.shake > 0 ? rand(this.shake, -this.shake) : 0;
    const shakeY = this.shake > 0 ? rand(this.shake, -this.shake) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    this.drawRoom();
    this.drawBossAnchorLinks();
    for (const hazard of this.hazards) hazard.draw(ctx, this.elapsed);
    this.drawTethers();
    for (const pickup of this.pickups) pickup.draw(ctx);
    this.player.drawCompanionLinks?.(ctx);
    const drawables = [
      ...(this.currentRoom.obstacles || []).map((obstacle) => ({ y: obstacle.y + obstacle.r * 0.55, draw: () => this.drawObstacle(obstacle) })),
      ...this.enemies.map((enemy) => ({ y: enemy.y + enemy.r * 0.62, draw: () => enemy.draw(ctx, this) })),
      ...(this.player.robots || []).map((robot) => ({ y: robot.y + robot.r * 0.62, draw: () => robot.draw(ctx) })),
      { y: this.player.y + this.player.r * 0.62, draw: () => this.player.draw(ctx) },
    ].sort((a, b) => a.y - b.y);
    for (const drawable of drawables) drawable.draw();
    for (const projectile of this.enemyProjectiles) projectile.draw(ctx);
    for (const arrow of this.arrows) arrow.draw(ctx);
    for (const effect of this.effects) effect.draw(ctx);
    ctx.restore();
    this.drawLighting();
    this.drawHUD();
    this.drawFloorBanner();
    this.drawTutorialGuide();
    this.drawReticle();
    if (this.transition > 0) {
      ctx.fillStyle = `rgba(3,6,11,${clamp(this.transition * 1.8, 0, 0.65)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.player.hurtFlash > 0) {
      const gradient = ctx.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 840);
      gradient.addColorStop(0, "rgba(160,30,48,0)");
      gradient.addColorStop(1, `rgba(180,28,48,${this.player.hurtFlash * 0.32})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    }
  }

  renderTitleBackdrop() {
    const gradient = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 780);
    gradient.addColorStop(0, "#14262b");
    gradient.addColorStop(0.5, "#0a111b");
    gradient.addColorStop(1, "#03050a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(this.elapsed * 0.03);
    ctx.strokeStyle = "rgba(116,224,193,0.08)";
    ctx.lineWidth = 1;
    for (let radius = 170; radius < 760; radius += 86) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 18; i += 1) {
      ctx.rotate(TAU / 18);
      ctx.beginPath();
      ctx.moveTo(150, 0);
      ctx.lineTo(760, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawRoom() {
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, W, H);
    const floorGradient = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 850);
    const palette = this.floorConfig?.palette || DUNGEON_FLOORS[0].palette;
    if (this.currentRoom.type === "tutorial") {
      floorGradient.addColorStop(0, "#173038");
      floorGradient.addColorStop(0.58, "#111e28");
      floorGradient.addColorStop(1, "#080c15");
    } else if (this.currentRoom.type === "boss") {
      floorGradient.addColorStop(0, "#241c31");
      floorGradient.addColorStop(0.6, "#141522");
      floorGradient.addColorStop(1, "#080a11");
    } else if (this.currentRoom.type === "elite") {
      floorGradient.addColorStop(0, palette.elite);
      floorGradient.addColorStop(0.6, palette.middle);
      floorGradient.addColorStop(1, palette.edge);
    } else {
      floorGradient.addColorStop(0, palette.inner);
      floorGradient.addColorStop(0.62, palette.middle);
      floorGradient.addColorStop(1, palette.edge);
    }
    ctx.fillStyle = floorGradient;
    ctx.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);

    ctx.save();
    ctx.beginPath();
    ctx.rect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
    ctx.clip();
    const floorMaterial = this.currentRoom.type === "tutorial" ? 3 : clamp((this.currentFloor || 1) - 1, 0, 2);
    drawAtlasCell(ctx, pixelAtlases.floor, floorMaterial, 2, 2, W / 2, H / 2, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, { alpha: 0.62 });
    ctx.fillStyle = "rgba(3,7,12,0.2)";
    ctx.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
    const random = mulberry32(Math.imul((this.currentFloor || 0) + 7, 0x6d2b79f5));
    ctx.lineWidth = 1;
    for (let x = ARENA.left; x <= ARENA.right; x += 72) {
      ctx.strokeStyle = `rgba(${palette.accentRgb},${0.028 + random() * 0.025})`;
      ctx.beginPath();
      ctx.moveTo(x, ARENA.top);
      ctx.lineTo(x + Math.sin(x * 0.02) * 15, ARENA.bottom);
      ctx.stroke();
    }
    for (let y = ARENA.top; y <= ARENA.bottom; y += 72) {
      ctx.strokeStyle = `rgba(${palette.accentRgb},${0.028 + random() * 0.025})`;
      ctx.beginPath();
      ctx.moveTo(ARENA.left, y);
      ctx.lineTo(ARENA.right, y + Math.sin(y * 0.04) * 8);
      ctx.stroke();
    }
    for (let i = 0; i < 70; i += 1) {
      const x = ARENA.left + random() * (ARENA.right - ARENA.left);
      const y = ARENA.top + random() * (ARENA.bottom - ARENA.top);
      ctx.fillStyle = `rgba(${palette.accentRgb},${0.025 + random() * 0.04})`;
      ctx.fillRect(x, y, random() * 15 + 2, 1);
    }
    this.drawRoomSigil();
    ctx.restore();

    ctx.strokeStyle = this.currentRoom.type === "boss" ? "rgba(184,156,255,0.3)" : `rgba(${palette.accentRgb},0.22)`;
    ctx.lineWidth = 4;
    ctx.strokeRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
    ctx.strokeStyle = "rgba(4,7,12,0.9)";
    ctx.lineWidth = 32;
    ctx.strokeRect(ARENA.left - 15, ARENA.top - 15, ARENA.right - ARENA.left + 30, ARENA.bottom - ARENA.top + 30);
    this.drawPixelWalls();
    this.drawDoors();
    this.drawRoomDecorations();
    this.drawRoomMechanisms();
  }

  drawPixelWalls() {
    const room = this.currentRoom;
    const palette = this.floorConfig?.palette || DUNGEON_FLOORS[0].palette;
    const styleIndex = ["gate", "training", "buttress", "alcove", "rune", "broken", "crystal", "regal", "sovereign"].indexOf(room.wallStyle);
    const block = 64;
    const hasLeft = this.rooms.has(keyOf(room.gx - 1, room.gy));
    const hasRight = this.rooms.has(keyOf(room.gx + 1, room.gy));
    const hasUp = this.rooms.has(keyOf(room.gx, room.gy - 1));
    const hasDown = this.rooms.has(keyOf(room.gx, room.gy + 1));
    ctx.save();
    ctx.fillStyle = "#0a1018";
    ctx.strokeStyle = `rgba(${palette.accentRgb},0.22)`;
    ctx.lineWidth = 2;
    for (let x = ARENA.left; x < ARENA.right; x += block) {
      const center = x + block / 2;
      const shade = ((Math.floor(x / block) + Math.max(0, styleIndex)) % 3) * 5;
      ctx.fillStyle = `rgb(${12 + shade},${19 + shade},${27 + shade})`;
      if (!(hasUp && Math.abs(center - W / 2) < ARENA.door * 0.64)) {
        ctx.fillRect(x + 2, ARENA.top - 30, block - 4, 34);
        ctx.strokeRect(x + 2, ARENA.top - 30, block - 4, 34);
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fillRect(x + 6, ARENA.top - 26, block - 12, 4);
      }
      ctx.fillStyle = `rgb(${10 + shade},${17 + shade},${25 + shade})`;
      if (!(hasDown && Math.abs(center - W / 2) < ARENA.door * 0.64)) {
        ctx.fillRect(x + 2, ARENA.bottom - 4, block - 4, 34);
        ctx.strokeRect(x + 2, ARENA.bottom - 4, block - 4, 34);
      }
    }
    for (let y = ARENA.top; y < ARENA.bottom; y += block) {
      const center = y + block / 2;
      const shade = ((Math.floor(y / block) + Math.max(0, styleIndex) + 1) % 3) * 5;
      ctx.fillStyle = `rgb(${11 + shade},${18 + shade},${26 + shade})`;
      if (!(hasLeft && Math.abs(center - H / 2) < ARENA.door * 0.64)) {
        ctx.fillRect(ARENA.left - 30, y + 2, 34, block - 4);
        ctx.strokeRect(ARENA.left - 30, y + 2, 34, block - 4);
      }
      if (!(hasRight && Math.abs(center - H / 2) < ARENA.door * 0.64)) {
        ctx.fillRect(ARENA.right - 4, y + 2, 34, block - 4);
        ctx.strokeRect(ARENA.right - 4, y + 2, 34, block - 4);
      }
    }
    ctx.restore();
  }

  drawRoomDecorations() {
    for (const decoration of this.currentRoom.decorations || []) {
      const index = PIXEL_PROP[decoration.kind];
      if (index === undefined) continue;
      drawAtlasCell(ctx, pixelAtlases.prop, index, 4, 4, decoration.x, decoration.y - 12, 82, 82, { alpha: 0.66 });
    }
  }

  drawRoomMechanisms() {
    for (const mechanism of this.currentRoom.mechanisms || []) {
      const active = mechanism.state === "active";
      const pair = {
        spikes: [PIXEL_PROP.spikesIdle, PIXEL_PROP.spikesActive],
        ember: [PIXEL_PROP.emberIdle, PIXEL_PROP.emberActive],
        coil: [PIXEL_PROP.coilIdle, PIXEL_PROP.coilActive],
        blade: [PIXEL_PROP.bladeIdle, PIXEL_PROP.bladeActive],
      }[mechanism.type];
      if (!pair) continue;
      const telegraph = mechanism.state === "warning";
      if (telegraph) {
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(this.elapsed * 18) * 0.18;
        ctx.strokeStyle = mechanism.type === "ember" ? "#ff8b52" : mechanism.type === "coil" ? "#72cfff" : "#ef6b7f";
        ctx.lineWidth = 4;
        ctx.strokeRect(pixel(mechanism.x - mechanism.r), pixel(mechanism.y - mechanism.r), pixel(mechanism.r * 2), pixel(mechanism.r * 2));
        ctx.restore();
      }
      const drawn = drawAtlasCell(ctx, pixelAtlases.prop, active ? pair[1] : pair[0], 4, 4, mechanism.x, mechanism.y - 7, mechanism.r * 2.45, mechanism.r * 2.45, {
        alpha: this.currentRoom.cleared ? 0.52 : 0.9,
      });
      if (!drawn) {
        ctx.fillStyle = active ? "#e66b72" : "#28313a";
        ctx.fillRect(pixel(mechanism.x - mechanism.r), pixel(mechanism.y - mechanism.r * 0.45), pixel(mechanism.r * 2), pixel(mechanism.r * 0.9));
        ctx.strokeStyle = "#aeb9b4";
        ctx.strokeRect(pixel(mechanism.x - mechanism.r), pixel(mechanism.y - mechanism.r * 0.45), pixel(mechanism.r * 2), pixel(mechanism.r * 0.9));
      }
    }
  }

  drawRoomSigil() {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(((this.currentFloor || 0) * Math.PI) / 12);
    const accentRgb = this.floorConfig?.palette?.accentRgb || "116,224,193";
    const color = this.currentRoom.type === "boss" ? "rgba(184,156,255,0.09)" : `rgba(${accentRgb},0.055)`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const radius = this.currentRoom.type === "boss" ? 245 : 148;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(0, radius + 38);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDoors() {
    const room = this.currentRoom;
    const doors = [
      { direction: "left", x: ARENA.left, y: H / 2, neighbor: this.rooms.get(keyOf(room.gx - 1, room.gy)), rotation: Math.PI / 2 },
      { direction: "right", x: ARENA.right, y: H / 2, neighbor: this.rooms.get(keyOf(room.gx + 1, room.gy)), rotation: Math.PI / 2 },
      { direction: "up", x: W / 2, y: ARENA.top, neighbor: this.rooms.get(keyOf(room.gx, room.gy - 1)), rotation: 0 },
      { direction: "down", x: W / 2, y: ARENA.bottom, neighbor: this.rooms.get(keyOf(room.gx, room.gy + 1)), rotation: 0 },
    ];
    for (const door of doors) {
      if (!door.neighbor) continue;
      const open = room.cleared;
      ctx.save();
      ctx.translate(door.x, door.y);
      ctx.rotate(door.rotation);
      ctx.fillStyle = "#0a1018";
      ctx.fillRect(-ARENA.door / 2, -26, ARENA.door, 52);
      ctx.strokeStyle = open ? "rgba(114,224,193,0.62)" : "rgba(216,91,112,0.65)";
      ctx.lineWidth = 3;
      ctx.shadowColor = open ? COLORS.jade : COLORS.danger;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(-ARENA.door / 2, 0);
      ctx.lineTo(ARENA.door / 2, 0);
      ctx.stroke();
      if (!open) {
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * 21 - 8, -20);
          ctx.lineTo(i * 21 + 8, 20);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = 0.4 + Math.sin(this.elapsed * 3) * 0.15;
        ctx.fillStyle = COLORS.jade;
        ctx.fillRect(-38, -3, 76, 6);
      }
      ctx.restore();
    }
  }

  drawObstacle(obstacle) {
    const spriteIndex = PIXEL_PROP[obstacle.kind];
    if (spriteIndex !== undefined && atlasLoaded(pixelAtlases.prop)) {
      const sizeMod = obstacle.kind === "pillar" ? 2.9 : obstacle.kind === "barricade" ? 2.75 : obstacle.kind === "urns" ? 2.35 : 2.55;
      const size = obstacle.r * sizeMod;
      drawPixelShadow(ctx, obstacle.x, obstacle.y + obstacle.r * 0.58, obstacle.r * 1.7, 0.42);
      drawAtlasCell(ctx, pixelAtlases.prop, spriteIndex, 4, 4, obstacle.x, obstacle.y - obstacle.r * 0.28, size, size);
      return;
    }
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(4, obstacle.r * 0.72, obstacle.r * 0.9, obstacle.r * 0.34, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = obstacle.variant === 0 ? "#18262c" : obstacle.variant === 1 ? "#22252e" : "#17252b";
    ctx.strokeStyle = "rgba(110,168,165,0.18)";
    ctx.lineWidth = 3;
    polygon(ctx, [
      [-obstacle.r * 0.7, -obstacle.r * 0.55],
      [obstacle.r * 0.18, -obstacle.r],
      [obstacle.r * 0.78, -obstacle.r * 0.34],
      [obstacle.r * 0.65, obstacle.r * 0.63],
      [-obstacle.r * 0.4, obstacle.r * 0.87],
      [-obstacle.r * 0.82, obstacle.r * 0.2],
    ]);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(116,224,193,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-obstacle.r * 0.35, -obstacle.r * 0.3);
    ctx.lineTo(obstacle.r * 0.1, 0);
    ctx.lineTo(obstacle.r * 0.4, obstacle.r * 0.42);
    ctx.stroke();
    ctx.restore();
  }

  drawTethers() {
    for (const enemy of this.enemies) {
      if (enemy.tetherTime <= 0) continue;
      const d = dist(enemy, this.player);
      const pressure = clamp(1 - d / 540, 0.08, 1);
      ctx.save();
      ctx.globalAlpha = 0.18 + pressure * 0.38;
      ctx.strokeStyle = COLORS.force;
      ctx.lineWidth = 1.2 + pressure * 2.2;
      ctx.shadowColor = COLORS.force;
      ctx.shadowBlur = 12 * pressure;
      ctx.setLineDash([6, 9]);
      ctx.lineDashOffset = -this.elapsed * 36;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      const mx = (this.player.x + enemy.x) / 2 + Math.sin(this.elapsed * 3 + enemy.id) * 12;
      const my = (this.player.y + enemy.y) / 2 + Math.cos(this.elapsed * 2.3 + enemy.id) * 12;
      ctx.quadraticCurveTo(mx, my, enemy.x, enemy.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.35 + pressure * 0.3;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r + 9 + enemy.tetherStacks * 2, this.elapsed, this.elapsed + Math.PI * 1.45);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawLighting() {
    ctx.save();
    const vignette = ctx.createRadialGradient(this.player.x, this.player.y, 140, this.player.x, this.player.y, 790);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.64, "rgba(1,3,8,0.08)");
    vignette.addColorStop(1, "rgba(1,3,7,0.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(this.player.x, this.player.y, 0, this.player.x, this.player.y, this.player.dancing ? 210 : 125);
    glow.addColorStop(0, this.player.dancing ? "rgba(116,224,193,0.12)" : "rgba(116,224,193,0.07)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(this.player.x - 220, this.player.y - 220, 440, 440);
    ctx.restore();
  }

  drawHUD() {
    this.drawPlayerStatus();
    this.drawSkills();
    if (this.mode !== "tutorial") this.drawMinimap();
    this.drawObjective();
    const boss = this.enemies.find((enemy) => enemy.type === "boss");
    if (boss) this.drawBossBar(boss);
  }

  drawPlayerStatus() {
    const x = 42;
    const y = 36;
    const engineer = this.player.characterId === "wenyu";
    ctx.save();
    ctx.fillStyle = "rgba(5,10,17,0.76)";
    roundedRectPath(ctx, x, y, 414, 112, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(125,181,181,0.2)";
    ctx.stroke();

    roundedRectPath(ctx, x + 12, y + 12, 64, 78, 3);
    ctx.save();
    ctx.clip();
    const animatedPortraitReady = !engineer && portraitVideo && portraitVideo.readyState >= 2 && portraitVideo.videoWidth > 0;
    const portraitSource = animatedPortraitReady ? portraitVideo : portraitImage;
    const portraitWidth = animatedPortraitReady ? portraitVideo.videoWidth : portraitImage.naturalWidth;
    const portraitHeight = animatedPortraitReady ? portraitVideo.videoHeight : portraitImage.naturalHeight;
    const engineerAnimatedReady = engineer && engineerPortrait && engineerPortrait.readyState >= 2 && engineerPortrait.videoWidth > 0;
    const engineerSource = engineerAnimatedReady ? engineerPortrait : engineerPortraitAsset;
    const engineerWidth = engineerAnimatedReady ? engineerPortrait.videoWidth : engineerPortraitAsset.naturalWidth;
    const engineerHeight = engineerAnimatedReady ? engineerPortrait.videoHeight : engineerPortraitAsset.naturalHeight;
    if (engineer && engineerWidth > 0 && engineerHeight > 0) {
      ctx.drawImage(
        engineerSource,
        engineerWidth * 0.28,
        engineerHeight * 0.07,
        engineerWidth * 0.44,
        engineerHeight * 0.268,
        x + 12,
        y + 12,
        64,
        78,
      );
    } else if (engineer) {
      const gradient = ctx.createLinearGradient(x + 12, y + 12, x + 76, y + 90);
      gradient.addColorStop(0, "#416d70");
      gradient.addColorStop(0.5, "#172b35");
      gradient.addColorStop(1, "#0b121c");
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 12, y + 12, 64, 78);
      ctx.save();
      ctx.translate(x + 44, y + 49);
      ctx.fillStyle = "#8ec3bd";
      polygon(ctx, [[-23, 34], [-18, 3], [-10, -9], [13, -7], [22, 5], [23, 34]]);
      ctx.fill();
      ctx.fillStyle = "#dcefe9";
      polygon(ctx, [[-12, -5], [9, -6], [13, 11], [-4, 17], [-18, 7]]);
      ctx.fill();
      ctx.fillStyle = "#efb0bf";
      polygon(ctx, [[-5, 8], [-13, 3], [-12, 13], [-4, 10], [5, 14], [4, 5]]);
      ctx.fill();
      ctx.fillStyle = "#121c27";
      ctx.beginPath();
      ctx.ellipse(-4, -27, 12, 8, -0.45, 0, TAU);
      ctx.ellipse(-13, -34, 7, 4, -0.7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#dfbdad";
      ctx.beginPath();
      ctx.arc(3, -17, 12, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#111a25";
      ctx.beginPath();
      ctx.arc(-1, -19, 14, Math.PI * 0.45, Math.PI * 1.55);
      ctx.quadraticCurveTo(5, -35, 16, -25);
      ctx.lineTo(9, -18);
      ctx.fill();
      ctx.fillStyle = "#edfdfa";
      ctx.beginPath();
      ctx.ellipse(8, -18, 2.2, 3, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#f09fb0";
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(10, -11, 4, 2, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.player.currentMagic.color;
      ctx.fillRect(-2, -32, 6, 2);
      ctx.strokeStyle = this.player.currentMagic.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 8, 17, 0.2, 2.8);
      ctx.stroke();
      ctx.restore();
    } else if (portraitWidth > 0 && portraitHeight > 0) {
      ctx.drawImage(
        portraitSource,
        portraitWidth * 0.333,
        portraitHeight * 0.067,
        portraitWidth * 0.375,
        portraitHeight * 0.275,
        x + 12,
        y + 12,
        64,
        78,
      );
    } else {
      ctx.fillStyle = "#173039";
      ctx.fillRect(x + 12, y + 12, 64, 78);
    }
    ctx.restore();
    ctx.strokeStyle = engineer ? "rgba(99,216,208,0.52)" : "rgba(116,224,193,0.42)";
    roundedRectPath(ctx, x + 12, y + 12, 64, 78, 3);
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.font = "500 17px 'STKaiti','KaiTi',serif";
    ctx.fillText(engineer ? "程闻屿" : "黎星遥", x + 92, y + 27);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "10px system-ui";
    ctx.letterSpacing = "2px";
    const roleText = engineer
      ? (this.player.dancing ? "归恒机巧师 · 机甲展开" : `归恒机巧师 · ${this.player.robots.length} 机在线`)
      : (this.player.spiritActive ? "精灵射手 · 契灵在场" : "精灵射手 · 归弦专精");
    ctx.fillText(roleText, x + 162, y + 26);
    this.drawBar(x + 92, y + 43, 294, 13, this.player.hp / this.player.maxHp, "#dc6773", "rgba(88,34,43,0.55)");
    this.drawBar(x + 92, y + 67, 294, 9, this.player.energy / this.player.maxEnergy, this.player.currentMagic.color, "rgba(34,68,70,0.48)");
    ctx.fillStyle = "#ebc6c9";
    ctx.font = "600 10px system-ui";
    ctx.fillText(`${Math.ceil(this.player.hp)} / ${Math.ceil(this.player.maxHp)}`, x + 96, y + 54);
    ctx.fillStyle = "#bddbd7";
    ctx.fillText(`${engineer ? "制造 " : ""}${Math.ceil(this.player.energy)} / ${Math.ceil(this.player.maxEnergy)}`, x + 96, y + 76);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "10px system-ui";
    ctx.fillText(`攻速 ${(this.player.effectiveAttackSpeed() / this.player.baseAttackInterval).toFixed(2)}/秒`, x + 92, y + 98);
    ctx.fillText(this.mode === "tutorial" ? "演武模式" : `界层 ${this.currentFloor}/${this.totalFloors}`, x + 230, y + 98);
    ctx.fillText(this.mode === "tutorial" ? "界隙 0/0" : `界隙 ${this.floorRoomsCleared}/${this.rooms.size - 1}`, x + 327, y + 98);
    ctx.restore();
  }

  drawBar(x, y, width, height, ratio, color, background) {
    ctx.fillStyle = background;
    roundedRectPath(ctx, x, y, width, height, height / 2);
    ctx.fill();
    const filled = Math.max(0, width * clamp(ratio, 0, 1));
    if (filled > 0.5) {
      ctx.fillStyle = color;
      roundedRectPath(ctx, x, y, filled, height, height / 2);
      ctx.fill();
    }
  }

  drawSkills() {
    const baseX = W / 2 - 210;
    const y = this.mode === "tutorial" ? H - 340 : H - 92;
    const engineer = this.player.characterId === "wenyu";
    const slots = engineer ? [
      { key: "Q", label: this.player.currentMagic.name, color: this.player.currentMagic.color, cooldown: this.player.qCooldown, max: this.player.qCooldownMax, locked: false },
      { key: "E", label: this.player.bindingMode ? "绑定指定中" : "批量绑定", color: "#7bd9d1", cooldown: 0, max: 1, locked: false },
      { key: "␣", label: "重设并修复", color: "#b692ff", cooldown: this.player.rollCharges > 0 ? 0 : this.player.rollRechargeTime - this.player.rollRecharge, max: this.player.rollRechargeTime, locked: false },
      { key: "R", label: this.player.dancing ? "机甲展开" : "回收变身", color: "#e4b968", cooldown: this.player.danceCooldown, max: this.player.danceCooldownMax, locked: false },
    ] : [
      { key: "Q", label: this.player.spiritActive ? "回收契灵" : "召唤契灵", color: COLORS.jade, cooldown: this.player.qCooldown, max: this.player.qCooldownMax, locked: false },
      { key: "E", label: this.player.magicUnlocked ? this.player.currentMagic.name : "尚未解锁", color: this.player.currentMagic.color, cooldown: 0, max: 1, locked: !this.player.magicUnlocked },
      { key: "␣", label: this.player.rollUnlocked ? "翻滚齐射" : "尚未解锁", color: COLORS.force, cooldown: this.player.rollCharges > 0 ? 0 : this.player.rollRechargeTime - this.player.rollRecharge, max: this.player.rollRechargeTime, locked: !this.player.rollUnlocked },
      { key: "R", label: this.player.danceUnlocked ? (this.player.dancing ? "灵舞中" : "灵舞") : "尚未解锁", color: "#df8fc5", cooldown: this.player.danceCooldown, max: this.player.danceCooldownMax, locked: !this.player.danceUnlocked },
    ];
    ctx.save();
    slots.forEach((slot, index) => {
      const x = baseX + index * 112;
      const slotColor = slot.locked ? "#53636b" : slot.color;
      ctx.fillStyle = slot.locked ? "rgba(4,8,14,0.9)" : "rgba(5,10,17,0.82)";
      roundedRectPath(ctx, x, y, 94, 58, 4);
      ctx.fill();
      ctx.strokeStyle = slot.locked ? "rgba(98,113,120,0.22)" : slot.cooldown > 0 ? "rgba(113,130,136,0.25)" : `${slot.color}88`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = slotColor;
      ctx.font = "700 15px system-ui";
      ctx.fillText(slot.key, x + 11, y + 21);
      ctx.fillStyle = slot.locked ? "#596a71" : "#c4d2cf";
      ctx.font = "10px system-ui";
      ctx.fillText(slot.label, x + 11, y + 44);
      if (slot.locked) {
        ctx.fillStyle = "rgba(91,104,111,0.12)";
        ctx.fillRect(x + 1, y + 1, 92, 56);
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(127,143,149,0.46)";
        ctx.font = "700 11px 'STKaiti','KaiTi',serif";
        ctx.fillText("封", x + 82, y + 19);
        ctx.textAlign = "left";
      } else if (slot.cooldown > 0) {
        const ratio = clamp(slot.cooldown / slot.max, 0, 1);
        ctx.fillStyle = "rgba(3,6,11,0.7)";
        ctx.fillRect(x, y, 94, 58 * ratio);
        ctx.fillStyle = "#ccd5d3";
        ctx.font = "600 13px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(slot.cooldown.toFixed(1), x + 47, y + 34);
        ctx.textAlign = "left";
      }
      if (index === 2 && !slot.locked) {
        for (let c = 0; c < this.player.maxRollCharges; c += 1) {
          ctx.fillStyle = c < this.player.rollCharges ? COLORS.force : "rgba(184,156,255,0.18)";
          ctx.fillRect(x + 72 + c * 8, y + 8, 5, 5);
        }
      }
      if (index === (engineer ? 0 : 1) && !slot.locked) {
        const next = engineer ? ROBOT_CONFIGS[(this.player.configIndex + 1) % ROBOT_CONFIGS.length] : MAGIC[(this.player.magicIndex + 1) % MAGIC.length];
        ctx.fillStyle = next.color;
        ctx.globalAlpha = 0.48;
        ctx.fillRect(x + 79, y + 9, 4, 19);
        ctx.globalAlpha = 1;
      }
    });

    if (this.player.charge > 0) {
      const width = 280;
      const x = W / 2 - width / 2;
      const cy = y - 20;
      ctx.fillStyle = "rgba(5,10,17,0.75)";
      ctx.fillRect(x, cy, width, 5);
      ctx.fillStyle = this.player.charge >= 1 ? "#fff2b0" : COLORS.gold;
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, cy, width * this.player.charge, 5);
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.muted;
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(this.player.charge >= 1 ? "满弦" : "蓄力", W / 2, cy - 7);
    }
    ctx.restore();
  }

  drawMinimap() {
    const rooms = [...this.rooms.values()];
    const minX = Math.min(...rooms.map((room) => room.gx));
    const maxX = Math.max(...rooms.map((room) => room.gx));
    const minY = Math.min(...rooms.map((room) => room.gy));
    const maxY = Math.max(...rooms.map((room) => room.gy));
    const cell = 24;
    const mapWidth = (maxX - minX + 1) * cell;
    const mapHeight = (maxY - minY + 1) * cell;
    const originX = W - 48 - mapWidth;
    const originY = 66;
    ctx.save();
    ctx.fillStyle = "rgba(5,10,17,0.76)";
    roundedRectPath(ctx, originX - 20, originY - 34, mapWidth + 40, mapHeight + 57, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(127,177,178,0.17)";
    ctx.stroke();

    ctx.fillStyle = "rgba(205,221,219,0.58)";
    ctx.font = "9px system-ui";
    ctx.fillText(`第 ${this.currentFloor} 层 · ${this.floorConfig.name}`, originX, originY - 17);
    ctx.fillStyle = "#e26f82";
    ctx.textAlign = "right";
    ctx.fillText("◆ 首领", originX + mapWidth, originY - 17);
    ctx.textAlign = "left";

    ctx.strokeStyle = "rgba(122,155,159,0.26)";
    ctx.lineWidth = 3;
    for (const room of rooms) {
      const x = originX + (room.gx - minX) * cell;
      const y = originY + (room.gy - minY) * cell;
      if (this.rooms.has(keyOf(room.gx + 1, room.gy))) {
        ctx.beginPath();
        ctx.moveTo(x + 9, y + 9);
        ctx.lineTo(x + cell + 9, y + 9);
        ctx.stroke();
      }
      if (this.rooms.has(keyOf(room.gx, room.gy + 1))) {
        ctx.beginPath();
        ctx.moveTo(x + 9, y + 9);
        ctx.lineTo(x + 9, y + cell + 9);
        ctx.stroke();
      }
    }

    for (const room of rooms) {
      const x = originX + (room.gx - minX) * cell;
      const y = originY + (room.gy - minY) * cell;
      const current = room === this.currentRoom;
      const boss = room.type === "boss";
      ctx.fillStyle = current
        ? COLORS.gold
        : boss
          ? "rgba(226,75,101,0.92)"
          : room.cleared
            ? "rgba(114,224,193,0.66)"
            : room.visited
              ? "rgba(136,155,161,0.5)"
              : "rgba(46,61,69,0.9)";
      ctx.fillRect(x + 1, y + 1, 17, 17);
      ctx.strokeStyle = boss ? "#f79aad" : "rgba(151,183,185,0.44)";
      ctx.lineWidth = boss ? 2 : 1;
      ctx.strokeRect(x + 1, y + 1, 17, 17);
      if (boss) {
        ctx.fillStyle = "#ffe3e8";
        ctx.font = "700 10px 'STKaiti','KaiTi',serif";
        ctx.textAlign = "center";
        ctx.fillText("首", x + 9.5, y + 13);
        ctx.textAlign = "left";
      }
      if (current) {
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, 23, 23);
      }
    }
    ctx.restore();
  }

  drawObjective() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(205,221,219,0.55)";
    ctx.font = "10px system-ui";
    if (this.mode === "tutorial" && this.tutorial?.active) {
      ctx.fillText(`新手关卡 · ${this.getTutorialSteps()[this.tutorial.index].title}`, W / 2, 34);
    } else {
      const objective = this.currentRoom.cleared ? "房间已稳定 · 寻找发光界门" : `残余威胁 ${this.enemies.length}`;
      ctx.fillText(`第 ${this.currentFloor} 层 · ${this.floorConfig.name} · ${objective}`, W / 2, 34);
    }
    ctx.restore();
  }

  drawFloorBanner() {
    if (this.mode === "tutorial" || this.floorBannerTimer <= 0 || !this.floorConfig) return;
    const fadeIn = clamp((3.4 - this.floorBannerTimer) / 0.45, 0, 1);
    const fadeOut = clamp(this.floorBannerTimer / 0.7, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const accent = `rgba(${this.floorConfig.palette.accentRgb},${0.7 * alpha})`;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(3,7,13,0.78)";
    roundedRectPath(ctx, W / 2 - 245, 145, 490, 126, 4);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.font = "600 10px system-ui";
    ctx.fillText(`BOUNDARY FLOOR ${String(this.currentFloor).padStart(2, "0")} / ${String(this.totalFloors).padStart(2, "0")}`, W / 2, 177);
    ctx.fillStyle = "#e6eeeb";
    ctx.font = "500 36px 'STKaiti','KaiTi',serif";
    ctx.fillText(this.floorConfig.name, W / 2, 220);
    ctx.fillStyle = "rgba(181,198,199,0.68)";
    ctx.font = "11px 'STKaiti','KaiTi',serif";
    ctx.fillText(this.floorConfig.subtitle, W / 2, 246);
    ctx.restore();
  }

  drawTutorialGuide() {
    if (this.mode !== "tutorial" || !this.tutorial?.active) return;
    const step = this.getTutorialSteps()[this.tutorial.index];
    if (!step.focus) return;
    const pulse = 0.5 + Math.sin(this.elapsed * 5) * 0.5;
    ctx.save();
    ctx.strokeStyle = `rgba(208,185,255,${0.5 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.force;
    ctx.shadowBlur = 12;
    ctx.setLineDash([7, 8]);
    ctx.lineDashOffset = -this.elapsed * 34;

    if (step.focus === "player") {
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, 48 + pulse * 7, 0, TAU);
      ctx.stroke();
    } else if (["target", "magic", "robot_target"].includes(step.focus)) {
      const target = this.enemies.find((enemy) => enemy.type === "dummy");
      if (target) {
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r + 25 + pulse * 5, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(target.x - 72, target.y);
        ctx.lineTo(target.x - 46, target.y);
        ctx.moveTo(target.x + 46, target.y);
        ctx.lineTo(target.x + 72, target.y);
        ctx.stroke();
      }
    }

    if (["robot", "robot_target", "binding"].includes(step.focus)) {
      const robot = this.player.robots?.[0];
      if (robot) {
        ctx.beginPath();
        ctx.arc(robot.x, robot.y, robot.r + 24 + pulse * 5, 0, TAU);
        ctx.stroke();
      }
    }

    const skillIndex = { q: 0, magic: 1, binding: 1, space: 2, r: 3 }[step.focus];
    if (skillIndex !== undefined) {
      const x = W / 2 - 210 + skillIndex * 112;
      const y = H - 340;
      ctx.strokeRect(x - 7 - pulse * 2, y - 7 - pulse * 2, 108 + pulse * 4, 72 + pulse * 4);
    }
    ctx.restore();
  }

  drawBossBar(boss) {
    const width = 550;
    const x = W / 2 - width / 2;
    const y = 63;
    const anchors = this.enemies.filter((enemy) => enemy.type === "anchor" && !enemy.dead).length;
    const phaseNames = ["", "Ⅰ · 裁界观测", `Ⅱ · ${boss.anchorCount || 7}锚封律`, "Ⅲ · 失序崩解"];
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#d9cbea";
    ctx.font = "500 15px 'STKaiti','KaiTi',serif";
    ctx.fillText(boss.name, W / 2, y - 10);
    this.drawBar(x, y, width, 9, boss.hp / boss.maxHp, "#b17bd4", "rgba(61,39,73,0.7)");
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(196,177,218,0.62)";
    ctx.font = "9px system-ui";
    ctx.fillText(phaseNames[boss.bossPhase], x, y + 23);
    if (anchors > 0) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#ee85bd";
      ctx.fillText(`界锚护盾 · ${anchors}/${boss.anchorCount || 7}`, x + width, y + 23);
    }
    if (this.bossSkillTimer > 0 && this.bossSkillName) {
      const alpha = Math.min(1, this.bossSkillTimer * 2);
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(6,5,12,0.82)";
      roundedRectPath(ctx, W / 2 - 175, y + 36, 350, 48, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(218,95,160,0.42)";
      ctx.stroke();
      ctx.fillStyle = "#edb0d2";
      ctx.font = "500 17px 'STKaiti','KaiTi',serif";
      ctx.fillText(this.bossSkillName, W / 2, y + 56);
      ctx.fillStyle = "#8f8195";
      ctx.font = "9px system-ui";
      ctx.fillText(this.bossSkillDetail, W / 2, y + 73);
    }
    ctx.restore();
  }

  drawReticle() {
    if (this.state !== "playing") return;
    const x = input.mouse.x;
    const y = input.mouse.y;
    const color = this.player.currentMagic.color;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.elapsed * 0.7);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 10 + this.player.charge * 7, 0, TAU);
    ctx.stroke();

    const interval = this.player.baseAttackInterval / this.player.effectiveAttackSpeed();
    const readyRatio = 1 - clamp(this.player.attackCooldown / interval, 0, 1);
    if (readyRatio < 1) {
      ctx.strokeStyle = "rgba(218,226,223,0.48)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + TAU * readyRatio);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(21 + this.player.charge * 6, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const game = new Game();
if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  window.__boundaryAshesDebug = game;
  const debugProbe = document.createElement("output");
  debugProbe.id = "debug-game-state";
  debugProbe.hidden = true;
  document.body.appendChild(debugProbe);
  window.setInterval(() => {
    const player = game.player;
    debugProbe.dataset.state = game.state;
    debugProbe.dataset.character = player?.characterId || game.selectedCharacter;
    debugProbe.dataset.playerClass = player?.constructor?.name || "";
    debugProbe.dataset.hp = String(player?.hp ?? "");
    debugProbe.dataset.energy = String(player?.energy ?? "");
    debugProbe.dataset.robots = String(player?.robots?.length ?? 0);
    debugProbe.dataset.config = player?.currentMagic?.name || "";
    debugProbe.dataset.binding = String(Boolean(player?.bindingMode));
    debugProbe.dataset.resetCharges = String(player?.rollCharges ?? 0);
    debugProbe.dataset.mech = String(Boolean(player?.dancing));
    debugProbe.dataset.shots = String(game.stats?.shots ?? 0);
    debugProbe.dataset.moveDistance = String(game.stats?.moveDistance ?? 0);
    debugProbe.dataset.playerX = String(player?.x ?? "");
    debugProbe.dataset.playerY = String(player?.y ?? "");
    debugProbe.dataset.tutorial = game.tutorial?.active ? game.getTutorialSteps()[game.tutorial.index]?.id || "" : "";
    debugProbe.dataset.robotHits = String(game.stats?.hitsByKind?.robot ?? 0);
    debugProbe.dataset.bindings = String(game.stats?.bindings ?? 0);
    debugProbe.dataset.manufactures = String(game.stats?.manufactures ?? 0);
    debugProbe.dataset.firstRobotX = String(player?.robots?.[0]?.x ?? "");
    debugProbe.dataset.firstRobotY = String(player?.robots?.[0]?.y ?? "");
    debugProbe.dataset.firstRobotBound = String(Boolean(player?.robots?.[0]?.bound));
    debugProbe.dataset.layout = game.currentRoom?.layoutId || "";
    debugProbe.dataset.mechanisms = String(game.currentRoom?.mechanisms?.length ?? 0);
    debugProbe.dataset.activeMechanisms = String(game.currentRoom?.mechanisms?.filter((mechanism) => mechanism.state === "active").length ?? 0);
    debugProbe.dataset.pixelAssetsReady = String(Object.values(pixelAtlases).every(atlasLoaded));
  }, 80);
}
