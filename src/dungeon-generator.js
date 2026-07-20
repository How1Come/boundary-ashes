"use strict";

((root) => {
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const roomKey = (x, y) => `${x},${y}`;

  function randomFromSeed(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function adjacentRoomCount(rooms, x, y) {
    return directions.reduce((count, [dx, dy]) => count + (rooms.has(roomKey(x + dx, y + dy)) ? 1 : 0), 0);
  }

  function makeRoom({ x, y, type, floorIndex, floorSeed, order, depth = 0, mainPath = false }) {
    return {
      gx: x,
      gy: y,
      type,
      depth,
      floor: floorIndex,
      cleared: type === "start",
      visited: false,
      started: false,
      seed: (floorSeed + order * 971 + x * 131 + y * 313) >>> 0,
      obstacles: [],
      mainPath,
    };
  }

  function assignDepths(rooms) {
    const start = rooms.get("0,0");
    const queue = [start];
    const visited = new Set(["0,0"]);
    while (queue.length > 0) {
      const room = queue.shift();
      for (const [dx, dy] of directions) {
        const neighbor = rooms.get(roomKey(room.gx + dx, room.gy + dy));
        if (!neighbor) continue;
        const key = roomKey(neighbor.gx, neighbor.gy);
        if (visited.has(key)) continue;
        neighbor.depth = room.depth + 1;
        visited.add(key);
        queue.push(neighbor);
      }
    }
    return visited.size;
  }

  function generate({ config, floorIndex, floorSeed }) {
    const random = randomFromSeed(floorSeed);
    for (let attempt = 1; attempt <= 80; attempt += 1) {
      const rooms = new Map();
      const start = makeRoom({ x: 0, y: 0, type: "start", floorIndex, floorSeed, order: 0, mainPath: true });
      rooms.set("0,0", start);
      let cursor = start;
      let failed = false;

      for (let step = 1; step <= config.mainPathLength; step += 1) {
        const candidates = [];
        for (const [dx, dy] of directions) {
          const x = cursor.gx + dx;
          const y = cursor.gy + dy;
          if (Math.abs(x) > 6 || Math.abs(y) > 6 || rooms.has(roomKey(x, y))) continue;
          if (adjacentRoomCount(rooms, x, y) > 1) continue;
          candidates.push({ x, y, score: Math.abs(x) + Math.abs(y) + random() * 2.2 });
        }
        if (candidates.length === 0) {
          failed = true;
          break;
        }
        candidates.sort((a, b) => b.score - a.score);
        const chosen = candidates[0];
        const room = makeRoom({
          x: chosen.x,
          y: chosen.y,
          type: step === config.mainPathLength ? "boss" : "combat",
          floorIndex,
          floorSeed,
          order: rooms.size,
          depth: step,
          mainPath: true,
        });
        rooms.set(roomKey(room.gx, room.gy), room);
        cursor = room;
      }
      if (failed) continue;

      let branchGuard = 0;
      while (rooms.size < config.roomCount && branchGuard < 500) {
        branchGuard += 1;
        const parents = [...rooms.values()].filter((room) => room.type !== "boss");
        const parent = parents[Math.floor(random() * parents.length)];
        const candidates = [];
        for (const [dx, dy] of directions) {
          const x = parent.gx + dx;
          const y = parent.gy + dy;
          if (Math.abs(x) > 6 || Math.abs(y) > 6 || rooms.has(roomKey(x, y))) continue;
          if (adjacentRoomCount(rooms, x, y) !== 1) continue;
          candidates.push({ x, y });
        }
        if (candidates.length === 0) continue;
        const chosen = candidates[Math.floor(random() * candidates.length)];
        const room = makeRoom({ x: chosen.x, y: chosen.y, type: "combat", floorIndex, floorSeed, order: rooms.size });
        rooms.set(roomKey(room.gx, room.gy), room);
      }
      if (rooms.size !== config.roomCount) continue;

      const connected = assignDepths(rooms);
      const boss = [...rooms.values()].find((room) => room.type === "boss");
      if (connected !== rooms.size || !boss || boss.depth < config.mainPathLength) continue;
      return { rooms: [...rooms.values()], attempts: attempt };
    }
    throw new Error(`Unable to generate floor ${floorIndex}`);
  }

  root.DungeonGenerator = Object.freeze({ generate });
})(typeof window === "undefined" ? globalThis : window);
