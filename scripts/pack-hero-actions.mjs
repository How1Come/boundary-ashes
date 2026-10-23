import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const require = createRequire(process.env.DUNGEON_TOOLING_PACKAGE || import.meta.url);
const { PNG } = require("pngjs");
const root = new URL("../", import.meta.url);
const out = new URL("assets/runtime/hero-actions-v1/", root);
const cell = 96, scale = 0.25, pivot = [48, 80];

const definitions = {
  xingyao: [
    { y: [0, 229], edges: [0, 270, 514, 754, 978, 1199, 1391, 1584, 1774], feet: [[162,216],[410,216],[647,216],[882,216],[1091,216],[1312,216],[1507,216],[1685,216]] },
    { y: [230, 453], edges: [0, 247, 497, 739, 974, 1195, 1404, 1586, 1774], feet: [[111,436],[356,441],[601,442],[829,445],[1067,445],[1282,443],[1476,446],[1671,442]] },
    { y: [461, 641], edges: [0, 242, 468, 701, 932, 1155, 1366, 1585, 1774], feet: [[127,624],[350,627],[566,631],[785,630],[1022,633],[1257,630],[1460,628],[1680,641]] },
    { y: [641, 887], edges: [0, 243, 465, 683, 893, 1123, 1334, 1555, 1774], feet: [[112,858],[334,858],[555,858],[767,858],[983,858],[1200,858],[1419,858],[1638,858]] },
  ],
  wenyu: [
    { y: [0, 232], edges: [0, 249, 480, 703, 927, 1150, 1372, 1579, 1774], feet: [[135,217],[359,217],[581,217],[799,217],[1022,217],[1241,217],[1462,217],[1679,217]] },
    { y: [238, 448], edges: [0, 245, 484, 710, 948, 1181, 1387, 1576, 1774], feet: [[122,433],[349,433],[568,433],[792,433],[1024,433],[1237,433],[1460,433],[1672,433]] },
    { y: [455, 647], edges: [0, 246, 475, 704, 929, 1149, 1378, 1571, 1774], feet: [[116,621],[342,621],[568,623],[790,623],[1018,623],[1237,623],[1464,632],[1679,632]] },
    { y: [658, 887], edges: [0, 265, 493, 742, 978, 1220, 1428, 1575, 1774], feet: [[106,857],[331,857],[553,857],[786,857],[1007,857],[1234,857],[1459,857],[1677,857]] },
  ],
};
await mkdir(out, { recursive: true });
for (const [character, rows] of Object.entries(definitions)) {
  const source = PNG.sync.read(await readFile(new URL(`output/hero-actions/${character}-source.png`, root)));
  if (source.width !== 1774 || source.height !== 887) throw new Error(`${character}: unexpected source dimensions`);
  const packed = new PNG({ width: cell * 8, height: cell * 4 });
  for (let row = 0; row < 4; row++) {
    const { y: [top, bottom], edges, feet } = rows[row];
    for (let col = 0; col < 8; col++) {
      const [anchorX, anchorY] = feet[col];
      for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
        const sx = Math.round(anchorX + (x - pivot[0]) / scale);
        const sy = Math.round(anchorY + (y - pivot[1]) / scale);
        if (sx < edges[col] || sx >= edges[col + 1] || sy < top || sy >= bottom) continue;
        const si = (sy * source.width + sx) * 4;
        const di = ((row * cell + y) * packed.width + col * cell + x) * 4;
        source.data.copy(packed.data, di, si, si + 4);
      }
    }
  }
  await writeFile(new URL(`${character}.png`, out), PNG.sync.write(packed));
  console.log(`Packed ${character}: 32 RGBA frames, ${cell}px cells, common pivot ${pivot}`);
}
await writeFile(new URL("manifest.json", out), JSON.stringify({
  version: "hero-actions-v1", styleReference: "../pixel-v1/entity-atlas.png",
  columns: 8, rows: 4, cellSize: cell, pivot, displayScale: 2,
  frames: { run: { row: 0, frames: [0,1,2,3,4,5,6,7], distancePerCycle: 96 },
    charge: { row: 1, frames: [0,1,2] }, shoot: { row: 1, frames: [3,4,5,6,7] },
    idle: { row: 1, frames: [7] }, rollOrRepair: { row: 2, frames: [0,1,2,3,4,5,6,7] },
    cast: { row: 3, frames: [0,1,2,3,4,5,6,7] } },
  sourceFrames: definitions,
}, null, 2) + "\n");
