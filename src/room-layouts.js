"use strict";

((root) => {
  const TAU = Math.PI * 2;
  const SPECIAL_LAYOUTS = new Set(["start", "boss", "tutorial"]);

  const templates = [
    {
      id: "fallen-cross",
      wallStyle: "buttress",
      obstacles: [
        [430, 280, 48, "pillar"], [1170, 620, 48, "pillar"],
        [430, 620, 54, "barricade"], [1170, 280, 46, "crates"],
      ],
      bonusObstacles: [[340, 700, 35, "urns"], [1260, 200, 34, "urns"]],
      mechanisms: [[560, 450, 40, "spikes", 0.08]],
      bonusMechanisms: [[1040, 450, 42, "spikes", 0.58]],
      decorations: [[800, 210, "lamp"], [800, 690, "brazier"]],
    },
    {
      id: "four-watchers",
      wallStyle: "alcove",
      obstacles: [
        [520, 300, 42, "pillar"], [1080, 300, 42, "pillar"],
        [520, 600, 46, "crates"], [1080, 600, 44, "urns"],
      ],
      bonusObstacles: [[355, 250, 42, "barricade"], [1245, 650, 40, "barricade"]],
      mechanisms: [[800, 450, 48, "coil", 0.32]],
      bonusMechanisms: [[800, 610, 38, "ember", 0.76]],
      decorations: [[800, 235, "obelisk"]],
    },
    {
      id: "split-sanctum",
      wallStyle: "rune",
      obstacles: [
        [590, 270, 50, "barricade"], [1010, 270, 50, "barricade"],
        [590, 630, 44, "pillar"], [1010, 630, 44, "pillar"],
      ],
      bonusObstacles: [[380, 300, 34, "urns"], [1220, 600, 38, "crates"]],
      mechanisms: [[590, 450, 42, "ember", 0.2]],
      bonusMechanisms: [[1010, 450, 42, "ember", 0.7]],
      decorations: [[800, 450, "brazier"]],
    },
    {
      id: "crescent-ruin",
      wallStyle: "broken",
      obstacles: [
        [410, 315, 52, "barricade"], [410, 585, 44, "urns"],
        [1190, 315, 44, "crates"], [1190, 585, 52, "barricade"],
      ],
      bonusObstacles: [[560, 240, 38, "pillar"], [1040, 660, 38, "pillar"]],
      mechanisms: [[650, 315, 44, "blade", 0.12]],
      bonusMechanisms: [[950, 585, 44, "blade", 0.62]],
      decorations: [[800, 235, "lamp"], [800, 665, "lamp"]],
    },
    {
      id: "star-dials",
      wallStyle: "crystal",
      obstacles: [
        [455, 245, 38, "pillar"], [1145, 245, 38, "pillar"],
        [455, 655, 42, "crates"], [1145, 655, 42, "urns"],
      ],
      bonusObstacles: [[360, 590, 44, "barricade"], [1240, 310, 44, "barricade"]],
      mechanisms: [[625, 450, 43, "coil", 0.04]],
      bonusMechanisms: [[975, 450, 43, "coil", 0.54]],
      decorations: [[800, 245, "obelisk"], [800, 655, "brazier"]],
    },
    {
      id: "reliquary-guard",
      wallStyle: "regal",
      obstacles: [
        [510, 265, 46, "crates"], [1090, 265, 46, "pillar"],
        [510, 635, 46, "pillar"], [1090, 635, 46, "crates"],
      ],
      bonusObstacles: [[350, 240, 32, "urns"], [1250, 660, 32, "urns"]],
      mechanisms: [[650, 450, 42, "spikes", 0.22]],
      bonusMechanisms: [[950, 450, 45, "blade", 0.72]],
      decorations: [[800, 450, "reliquary"]],
    },
  ];

  const cycleByType = Object.freeze({ spikes: 3.2, ember: 3.7, coil: 3.35, blade: 3.05 });

  function hashLayout(seed, floorIndex, roomType) {
    let value = (seed ^ Math.imul(floorIndex + 1, 0x9e3779b9)) >>> 0;
    value ^= roomType === "elite" ? 0x7f4a7c15 : 0x51ed270b;
    value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
    return (value ^ (value >>> 15)) >>> 0;
  }

  function makeObstacle([x, y, r, kind], index) {
    return { x, y, r, kind, variant: index % 4, phase: (index * 1.618) % TAU };
  }

  function makeMechanism([x, y, r, type, phaseOffset], index) {
    return {
      x, y, r, type,
      phaseOffset: phaseOffset ?? (index * 0.23) % 1,
      cycle: cycleByType[type] || 3.4,
      state: "idle",
      progress: 0,
      hitCooldown: 0,
    };
  }

  function select({ room, floorIndex = 1, obstacleBonus = 0 }) {
    if (SPECIAL_LAYOUTS.has(room.type)) {
      return {
        id: `${room.type}-sanctum`,
        wallStyle: room.type === "boss" ? "sovereign" : room.type === "tutorial" ? "training" : "gate",
        obstacles: [], mechanisms: [], decorations: [],
      };
    }
    const index = hashLayout(room.seed, floorIndex, room.type) % templates.length;
    const template = templates[index];
    const bonusCount = Math.max(0, Math.min(template.bonusObstacles.length, obstacleBonus));
    const mechanismBonus = obstacleBonus > 0 ? Math.min(template.bonusMechanisms.length, obstacleBonus) : 0;
    return {
      id: `${template.id}${room.type === "elite" ? "-elite" : ""}`,
      wallStyle: template.wallStyle,
      obstacles: [...template.obstacles, ...template.bonusObstacles.slice(0, bonusCount)].map(makeObstacle),
      mechanisms: [...template.mechanisms, ...template.bonusMechanisms.slice(0, mechanismBonus)].map(makeMechanism),
      decorations: template.decorations.map(([x, y, kind]) => ({ x, y, kind })),
    };
  }

  function obstacleClearance(point, obstacle) {
    return Math.hypot(point.x - obstacle.x, point.y - obstacle.y) - obstacle.r;
  }

  function validate(layout) {
    const center = { x: 800, y: 450 };
    const reserved = [
      { x: 190, y: 450, r: 116 }, { x: 1410, y: 450, r: 116 },
      { x: 800, y: 190, r: 116 }, { x: 800, y: 710, r: 116 },
      { ...center, r: 145 },
    ];
    return layout.obstacles.every((obstacle) => reserved.every((zone) => obstacleClearance(zone, obstacle) >= zone.r));
  }

  root.BoundaryRoomLayouts = Object.freeze({ templates, select, validate });
})(typeof window === "undefined" ? globalThis : window);
