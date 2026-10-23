import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const assetDir = path.join(root, "assets/cheng-wenyu-animation-v2");
const basePath = path.join(assetDir, "master.png");
const videoPath = path.join(root, "assets/cheng-wenyu-portrait-v2-loop-locked.mp4");
const frameDir = await mkdtemp(path.join(tmpdir(), "wenyu-v2-"));
const width = 720;
const height = 1440;
const fps = 60;
const duration = 4;
const frameCount = fps * duration;

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
      const coverage = Math.max(0, Math.min(1, radius + 0.7 - Math.hypot(x - cx, y - cy)));
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
      if (distance < 1) blendPixel(pixels, x, y, color, alpha * Math.pow(1 - distance, 2.25));
    }
  }
}

function cubic(start, c1, c2, end, steps = 120) {
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
    if (period !== Infinity && ((distance % period) + period) % period >= dash) continue;
    if (options.glow) drawGlow(pixels, points[index].x, points[index].y, widthValue * 5, color, alpha * 0.2);
    drawDisc(pixels, points[index].x, points[index].y, Math.max(0.55, widthValue / 2), color, alpha);
  }
}

function drawEllipse(pixels, cx, cy, rx, ry, rotation, color, alpha, offset, dash = 10, gap = 14) {
  const points = Array.from({ length: 180 }, (_, index) => {
    const angle = (index / 179) * Math.PI * 2 + rotation;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
  drawPath(pixels, points, color, 1.15, alpha, { dash, gap, offset, glow: true });
}

function pointOnPath(points, ratio) {
  const normalized = ((ratio % 1) + 1) % 1;
  return points[Math.min(points.length - 1, Math.floor(normalized * (points.length - 1)))];
}

const palm = [168, 393];
const robots = [
  { center: [101, 105], color: [148, 255, 184], phase: 0, path: cubic(palm, [142, 312], [117, 185], [101, 105]) },
  { center: [609, 111], color: [83, 220, 255], phase: Math.PI / 2, path: cubic(palm, [322, 304], [492, 170], [609, 111]) },
  { center: [600, 684], color: [190, 129, 255], phase: Math.PI, path: cubic(palm, [318, 486], [488, 620], [600, 684]) },
  { center: [130, 1001], color: [255, 208, 112], phase: Math.PI * 1.5, path: cubic(palm, [132, 575], [116, 820], [130, 1001]) },
];

const hairHighlights = [
  cubic([360, 246], [458, 240], [590, 271], [689, 341]),
  cubic([365, 264], [486, 285], [612, 340], [706, 438]),
  cubic([369, 282], [486, 332], [575, 430], [666, 536]),
];

const clothHighlights = [
  cubic([387, 454], [486, 480], [590, 539], [657, 626]),
  cubic([350, 609], [448, 650], [562, 720], [635, 809]),
  cubic([269, 702], [221, 808], [171, 914], [119, 1007]),
];

function clearRegion(pixels, x, y, regionWidth, regionHeight) {
  for (let py = Math.max(0, y); py < Math.min(height, y + regionHeight); py += 1) {
    pixels.fill(0, (py * width + Math.max(0, x)) * 4, (py * width + Math.min(width, x + regionWidth)) * 4);
  }
}

function makeOverlay(index) {
  const pixels = Buffer.alloc(width * height * 4);
  const phase = index / (frameCount - 1);
  const turn = phase * Math.PI * 2;
  const breath = (wave(phase, 1, -Math.PI / 2) + 1) / 2;

  drawGlow(pixels, palm[0], palm[1], 110 + breath * 8, [73, 226, 255], 24 + breath * 20);
  drawEllipse(pixels, palm[0], palm[1], 55, 55, turn, [139, 244, 255], 110 + breath * 40, -phase * 19 * 3, 8, 11);
  drawEllipse(pixels, palm[0], palm[1], 78, 78, -turn, [69, 211, 244], 72 + breath * 36, phase * 34 * 2, 15, 19);
  drawEllipse(pixels, palm[0], palm[1], 101, 101, turn * 2, [104, 235, 255], 46 + breath * 28, -phase * 28, 6, 22);

  robots.forEach((robot, robotIndex) => {
    const pulse = (Math.sin(turn + robot.phase) + 1) / 2;
    drawPath(pixels, robot.path, robot.color, 1.05, 42 + pulse * 22, { glow: true });
    drawPath(pixels, robot.path, robot.color, 1.35, 150, {
      dash: 10,
      gap: 35,
      offset: -phase * 45 * (robotIndex + 1) - robotIndex * 13,
      glow: true,
    });
    for (let bead = 0; bead < 3; bead += 1) {
      const point = pointOnPath(robot.path, phase * (1 + (robotIndex % 2)) + bead / 3 + robotIndex * 0.11);
      drawGlow(pixels, point.x, point.y, 8, robot.color, 80 + pulse * 45);
      drawDisc(pixels, point.x, point.y, 1.35, [226, 255, 255], 205);
    }
    drawGlow(pixels, robot.center[0], robot.center[1], 48 + pulse * 7, robot.color, 30 + pulse * 34);
  });

  drawEllipse(pixels, 101, 105, 46 + breath * 3, 31 + breath * 2, -turn, [159, 255, 191], 58 + breath * 40, -phase * 24 * 2);
  drawEllipse(pixels, 609, 111, 54, 54, turn * 2, [104, 229, 255], 78 + breath * 34, phase * 17 * 3, 8, 9);
  drawEllipse(pixels, 600, 684, 49 + breath * 3, 40 + breath * 2, -turn, [203, 151, 255], 64 + breath * 38, -phase * 24 * 2, 11, 13);
  drawEllipse(pixels, 130, 1001, 61 + breath * 5, 29 + breath * 2, turn, [255, 218, 134], 72 + breath * 40, phase * 29 * 2, 13, 16);

  for (let mote = 0; mote < 18; mote += 1) {
    const robot = robots[mote % robots.length];
    const angle = turn * (mote % 2 ? -1 : 1) + mote * 1.7;
    const radius = 35 + (mote % 4) * 9;
    const x = robot.center[0] + Math.cos(angle) * radius;
    const y = robot.center[1] + Math.sin(angle) * radius * 0.72;
    drawGlow(pixels, x, y, 4 + (mote % 3), robot.color, 55 + breath * 35);
    drawDisc(pixels, x, y, 0.75 + (mote % 2) * 0.45, [226, 255, 244], 150);
  }

  hairHighlights.forEach((points, pathIndex) => {
    const dash = 14 + pathIndex * 4;
    const gap = 52 + pathIndex * 7;
    drawPath(pixels, points, [135, 206, 223], 0.9, 54 + breath * 24, {
      dash,
      gap,
      offset: -phase * (dash + gap) * (pathIndex + 1) - pathIndex * 19,
      glow: true,
    });
  });
  clothHighlights.forEach((points, pathIndex) => {
    const dash = 18 + pathIndex * 5;
    const gap = 58 + pathIndex * 8;
    drawPath(pixels, points, pathIndex === 2 ? [245, 205, 126] : [135, 233, 217], 1, 48 + breath * 30, {
      dash,
      gap,
      offset: -phase * (dash + gap) * (pathIndex + 1) - pathIndex * 23,
      glow: true,
    });
  });

  clearRegion(pixels, 278, 135, 170, 155);
  return encodePng(pixels);
}

const filterGraph = [
  "[0:v]scale=720:1440:flags=lanczos,format=rgba,split=5[base][greenSource][blueSource][violetSource][goldSource]",
  "[greenSource]crop=160:165:20:20[green]",
  "[blueSource]crop=180:185:525:20[blue]",
  "[violetSource]crop=180:220:525:575[violet]",
  "[goldSource]crop=180:210:35:895[gold]",
  "[base][green]overlay=x=20:y='20+5*sin(2*PI*n/239)':eval=frame[greenFloat]",
  "[greenFloat][blue]overlay=x=525:y='20+5*sin(2*PI*n/239+PI/2)':eval=frame[blueFloat]",
  "[blueFloat][violet]overlay=x=525:y='575+5*sin(2*PI*n/239+PI)':eval=frame[violetFloat]",
  "[violetFloat][gold]overlay=x=35:y='895+5*sin(2*PI*n/239+3*PI/2)':eval=frame[robotFloat]",
  "[robotFloat][1:v]overlay=0:0:shortest=1:format=auto[out]",
].join(";");

try {
  await mkdir(assetDir, { recursive: true });
  for (let index = 0; index < frameCount; index += 1) {
    const filename = path.join(frameDir, `overlay-${String(index + 1).padStart(3, "0")}.png`);
    await writeFile(filename, makeOverlay(index));
  }

  await run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "warning",
    "-loop", "1", "-framerate", String(fps), "-i", basePath,
    "-framerate", String(fps), "-start_number", "1", "-i", path.join(frameDir, "overlay-%03d.png"),
    "-filter_complex", filterGraph,
    "-map", "[out]", "-frames:v", String(frameCount), "-an",
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "12",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath,
  ]);

  for (let frame = 1; frame <= 16; frame += 1) {
    await rm(path.join(assetDir, `keyframe-${String(frame).padStart(2, "0")}.png`), { force: true });
  }
  await run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "warning", "-i", videoPath,
    "-vf", "fps=4", "-frames:v", "16", path.join(assetDir, "keyframe-%02d.png"),
  ]);
  await run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "warning", "-i", videoPath,
    "-vf", "fps=4,scale=160:320:flags=lanczos,tile=8x2:padding=3:margin=3:color=#071015",
    "-frames:v", "1", "-update", "1", path.join(assetDir, "keyframes-contact-sheet.png"),
  ]);
  console.log(`Created ${videoPath}`);
  console.log(`Saved 16 phase keyframes in ${assetDir}`);
} finally {
  await rm(frameDir, { recursive: true, force: true });
}
