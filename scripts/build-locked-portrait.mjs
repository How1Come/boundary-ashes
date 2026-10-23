import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const basePath = path.join(root, "assets/li-xingyao-animation-v4/keyframe-01.png");
const outputDir = path.join(root, "assets/li-xingyao-animation-v5");
const videoPath = path.join(root, "assets/li-xingyao-portrait-v5-loop-locked.mp4");
const frameDir = await mkdtemp(path.join(tmpdir(), "xingyao-v5-"));
const width = 720;
const height = 1200;
const fps = 60;
const duration = 4;
const frameCount = fps * duration;
const workflow = `# 黎星遥锁定主体循环动画（v5）

- 底图：\`../li-xingyao-animation-v4/keyframe-01.png\`
- 输出：\`../li-xingyao-portrait-v5-loop-locked.mp4\`
- 规格：720×1200、4 秒、60 FPS、240 帧、无声无缝循环
- 相位参考：32 张，每秒 8 张

## 锁定规则

每一帧都完整复用同一张底图，不对人物主体做重绘、缩放、旋转、平移、变形或镜头运动。脸部、五官、躯干、四肢、手、弓、腿和站姿始终保持逐像素对齐。

动态仅存在于独立透明覆盖层，允许范围为：

1. 右侧发尾与少量长发丝的末端摆动；发根固定。
2. 裙摆、藤带和衣服自由边缘的轻微风动；与身体连接处固定。
3. 契灵的翅光、呼吸光晕、环轨与微粒。

构建脚本会拒绝任何进入脸、上身、手臂、持弓区和上腿核心区域的动态像素。运行 \`npm run portrait:v5\` 可重新生成全部动画素材。
`;

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`${command} exited with code ${code}`));
  });
});

const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));
const wave = (phase, speed = 1, offset = 0) => Math.sin(phase * Math.PI * 2 * speed + offset);

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return chunk;
}

function encodePng(pixels) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) pixels.copy(raw, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function blendPixel(pixels, x, y, color, alpha) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= width || py >= height || alpha <= 0) return;
  const index = (py * width + px) * 4;
  const sourceAlpha = clampByte(alpha) / 255;
  const targetAlpha = pixels[index + 3] / 255;
  const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  if (outAlpha <= 0) return;
  for (let channel = 0; channel < 3; channel += 1) {
    pixels[index + channel] = clampByte((color[channel] * sourceAlpha + pixels[index + channel] * targetAlpha * (1 - sourceAlpha)) / outAlpha);
  }
  pixels[index + 3] = clampByte(outAlpha * 255);
}

function drawDisc(pixels, cx, cy, radius, color, alpha) {
  const minX = Math.floor(cx - radius - 1);
  const maxX = Math.ceil(cx + radius + 1);
  const minY = Math.floor(cy - radius - 1);
  const maxY = Math.ceil(cy + radius + 1);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      const coverage = Math.max(0, Math.min(1, radius + 0.7 - distance));
      if (coverage > 0) blendPixel(pixels, x, y, color, alpha * coverage);
    }
  }
}

function drawGlow(pixels, cx, cy, radius, color, alpha) {
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x - cx, y - cy) / radius;
      if (distance >= 1) continue;
      blendPixel(pixels, x, y, color, alpha * Math.pow(1 - distance, 2.2));
    }
  }
}

function cubic(start, c1, c2, end, steps = 110) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const u = 1 - t;
    return {
      x: u ** 3 * start[0] + 3 * u ** 2 * t * c1[0] + 3 * u * t ** 2 * c2[0] + t ** 3 * end[0],
      y: u ** 3 * start[1] + 3 * u ** 2 * t * c1[1] + 3 * u * t ** 2 * c2[1] + t ** 3 * end[1],
    };
  });
}

function drawPath(pixels, points, color, widthValue, alpha, options = {}) {
  const dash = options.dash || Infinity;
  const gap = options.gap || 0;
  const period = dash + gap;
  let distance = options.offset || 0;
  for (let index = 0; index < points.length; index += 1) {
    if (index > 0) distance += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    const active = period === Infinity || ((distance % period) + period) % period < dash;
    if (!active) continue;
    if (options.glow) drawGlow(pixels, points[index].x, points[index].y, widthValue * 4.5, color, alpha * 0.24);
    drawDisc(pixels, points[index].x, points[index].y, Math.max(0.55, widthValue / 2), color, alpha);
  }
}

const hair = [
  [[432, 218], [[486, 187], [596, 183], [699, 224]]],
  [[441, 246], [[508, 219], [620, 232], [712, 278]]],
  [[447, 277], [[523, 256], [635, 279], [713, 333]]],
  [[452, 309], [[530, 298], [632, 334], [704, 391]]],
  [[458, 343], [[526, 344], [617, 389], [690, 451]]],
  [[465, 380], [[528, 391], [599, 439], [656, 505]]],
  [[474, 414], [[529, 431], [580, 478], [621, 543]]],
];

const cloth = [
  [[404, 554], [[492, 568], [600, 610], [691, 674]]],
  [[401, 582], [[496, 629], [606, 699], [690, 778]]],
  [[392, 615], [[470, 695], [558, 804], [628, 911]]],
  [[369, 631], [[401, 748], [440, 908], [483, 1022]]],
  [[346, 620], [[304, 728], [246, 856], [168, 927]]],
  [[421, 604], [[518, 688], [627, 786], [701, 864]]],
];

function movingCurve(start, controls, phase, index, kind) {
  const sway = wave(phase, 1, (kind === "hair" ? 0 : 0.45) + index * (kind === "hair" ? 0.63 : 0.8));
  const flutter = wave(phase, 2, (kind === "hair" ? 0 : 1.1) + index * (kind === "hair" ? 0.91 : 0.66));
  const [c1, c2, end] = controls;
  const scale = kind === "hair" ? 1 : 0.75;
  return cubic(
    start,
    [c1[0] + sway * 2.2 * scale, c1[1] + flutter * 1.5 * scale],
    [c2[0] + sway * (5.5 + index * 0.45) * scale, c2[1] + flutter * (2.8 + index * 0.25) * scale],
    [end[0] + sway * (9 + index * 0.7) * scale, end[1] + flutter * (4 + index * 0.4) * scale],
  );
}

function drawEllipse(pixels, cx, cy, rx, ry, rotation, color, alpha, offset) {
  const points = Array.from({ length: 150 }, (_, index) => {
    const angle = (index / 149) * Math.PI * 2 + rotation;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
  drawPath(pixels, points, color, 0.9, alpha, { dash: 9, gap: 13, offset, glow: true });
}

function makeOverlay(index) {
  const pixels = Buffer.alloc(width * height * 4);
  const phase = index / frameCount;
  const breath = (wave(phase, 1, -0.5) + 1) / 2;
  const dashOffset = -index * 0.75;

  hair.forEach(([start, controls], hairIndex) => {
    const points = movingCurve(start, controls, phase, hairIndex, "hair");
    const color = hairIndex % 2 ? [105, 194, 176] : [159, 216, 202];
    drawPath(pixels, points, color, 2.5 - hairIndex * 0.12, 28, { glow: true });
    drawPath(pixels, points, color, 1.05, 126, {
      dash: 18 + hairIndex * 3,
      gap: 34 + hairIndex * 4,
      offset: dashOffset - hairIndex * 11,
    });
  });

  cloth.forEach(([start, controls], clothIndex) => {
    const points = movingCurve(start, controls, phase, clothIndex, "cloth");
    const color = clothIndex % 2 ? [117, 205, 185] : [215, 188, 121];
    drawPath(pixels, points, color, 1.45, 62 + breath * 34, {
      dash: 22 + clothIndex * 3,
      gap: 46 + clothIndex * 4,
      offset: dashOffset * 1.35 - clothIndex * 15,
      glow: true,
    });
  });

  const spiritX = 579;
  const spiritY = 161;
  const wing = wave(phase, 2, 0.4);
  drawGlow(pixels, spiritX, spiritY, 50 + breath * 8, [105, 244, 218], 44 + breath * 28);
  const leftWing = cubic([563, 151], [552, 141], [541 - wing * 4, 129 - wing * 5], [548 - wing * 7, 112 - wing * 6], 75);
  const rightWing = cubic([594, 149], [605, 138], [614 + wing * 5, 126 - wing * 4], [610 + wing * 8, 109 - wing * 5], 75);
  drawPath(pixels, leftWing, [164, 255, 235], 1.3, 118 + breath * 52, { glow: true });
  drawPath(pixels, rightWing, [164, 255, 235], 1.3, 118 + breath * 52, { glow: true });
  drawEllipse(pixels, spiritX, spiritY, 34 + breath * 4, 22 + breath * 2, phase * Math.PI * 2, [154, 255, 234], 70 + breath * 38, dashOffset);

  for (let mote = 0; mote < 7; mote += 1) {
    const angle = phase * Math.PI * 2 * (mote % 2 ? -1 : 1) + mote * 0.9;
    const radius = 29 + (mote % 3) * 9;
    const x = spiritX + Math.cos(angle) * radius;
    const y = spiritY + Math.sin(angle) * radius * 0.64;
    drawGlow(pixels, x, y, 5 + (mote % 2) * 2, [173, 255, 236], 70 + ((mote + index) % 5) * 18);
    drawDisc(pixels, x, y, 0.9 + (mote % 2) * 0.55, [201, 255, 244], 155);
  }

  for (let y = 0; y < 540; y += 1) {
    for (let x = 0; x < 425; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] !== 0) throw new Error(`Dynamic overlay entered locked body core at ${x},${y}`);
    }
  }
  return encodePng(pixels);
}

try {
  for (let index = 0; index < frameCount; index += 1) {
    const filename = path.join(frameDir, `overlay-${String(index + 1).padStart(3, "0")}.png`);
    await writeFile(filename, makeOverlay(index));
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "workflow.md"), workflow);
  await run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "warning",
    "-loop", "1", "-framerate", String(fps), "-i", basePath,
    "-framerate", String(fps), "-start_number", "1", "-i", path.join(frameDir, "overlay-%03d.png"),
    "-filter_complex", "[0:v][1:v]overlay=0:0:shortest=1:format=auto[out]",
    "-map", "[out]", "-frames:v", String(frameCount), "-an",
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "12",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath,
  ]);
  await run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "warning", "-i", videoPath,
    "-vf", "fps=8", "-frames:v", "32", path.join(outputDir, "keyframe-%02d.png"),
  ]);
  await run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "warning", "-i", videoPath,
    "-vf", "fps=8,scale=144:240:flags=lanczos,tile=8x4:padding=3:margin=3:color=#071015",
    "-frames:v", "1", "-update", "1", path.join(outputDir, "keyframes-contact-sheet.png"),
  ]);
  console.log(`Created ${videoPath}`);
  console.log(`Saved 32 phase keyframes in ${outputDir}`);
} finally {
  await rm(frameDir, { recursive: true, force: true });
}
