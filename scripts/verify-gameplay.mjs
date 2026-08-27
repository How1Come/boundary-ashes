import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

await import(new URL("../src/dungeon-generator.js", import.meta.url));
await import(new URL("../src/room-layouts.js", import.meta.url));

const floors = [
  { roomCount: 8, mainPathLength: 4, obstacleBonus: 0 },
  { roomCount: 9, mainPathLength: 5, obstacleBonus: 1 },
  { roomCount: 10, mainPathLength: 6, obstacleBonus: 2 },
];

for (let floorIndex = 1; floorIndex <= floors.length; floorIndex += 1) {
  const config = floors[floorIndex - 1];
  for (let seed = 1; seed <= 1200; seed += 1) {
    const floorSeed = (seed * 2654435761) >>> 0;
    const generated = globalThis.DungeonGenerator.generate({ config, floorIndex, floorSeed });
    assert.equal(generated.rooms.length, config.roomCount);
    for (const room of generated.rooms) {
      const first = globalThis.BoundaryRoomLayouts.select({ room, floorIndex, obstacleBonus: config.obstacleBonus });
      const second = globalThis.BoundaryRoomLayouts.select({ room, floorIndex, obstacleBonus: config.obstacleBonus });
      assert.deepEqual(first, second, "layout selection must be deterministic");
      assert.ok(globalThis.BoundaryRoomLayouts.validate(first), `${first.id} must preserve doors and center`);
      for (let i = 0; i < first.obstacles.length; i += 1) {
        for (let j = i + 1; j < first.obstacles.length; j += 1) {
          const a = first.obstacles[i];
          const b = first.obstacles[j];
          assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > a.r + b.r + 18, `${first.id} obstacles must not overlap`);
        }
      }
    }
  }
}

const manifest = JSON.parse(await readFile(new URL("../assets/runtime/pixel-v1/manifest.json", import.meta.url), "utf8"));
for (const [groupName, frames] of Object.entries({ entities: manifest.entities, props: manifest.props, vfx: manifest.vfx })) {
  const atlas = manifest.atlases[groupName === "entities" ? "entity" : groupName === "props" ? "prop" : "vfx"];
  const cellCount = atlas.columns * atlas.rows;
  for (const [frameName, index] of Object.entries(frames)) {
    assert.ok(Number.isInteger(index) && index >= 0 && index < cellCount, `${groupName}.${frameName} must fit its atlas`);
  }
}

console.log("Verified deterministic room layouts, spawn corridors, obstacle spacing, and pixel atlas frames.");
