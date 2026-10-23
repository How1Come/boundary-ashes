"use strict";

((root) => {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const frameAt = (progress, count = 8) => Math.min(count - 1, Math.floor(clamp(progress, 0, 1) * count));
  const sheets = new Map();

  class CharacterAnimator {
    constructor(character = "xingyao") {
      this.character = character;
      this.stride = 0;
      this.moving = false;
      this.action = null;
      this.time = 0;
      this.footfall = -1;
      this.snapshot = { state: "idle", row: 1, frame: 7, progress: 0 };
    }

    play(name, duration = 0.5) {
      if (this.action?.name === "roll" && name !== "roll") return;
      if (name === "shoot" && ["cast", "repair"].includes(this.action?.name)) return;
      this.action = { name, elapsed: 0, duration };
    }

    reset() {
      this.action = null;
      this.stride = 0;
      this.moving = false;
      this.footfall = -1;
      this.snapshot = { state: "idle", row: 1, frame: 7, progress: 0 };
    }

    update(dt, { distance = 0, charge = 0, rolling = false, rollProgress = 0, binding = false } = {}) {
      this.time += dt;
      this.moving = distance > 0.05 && !rolling;
      if (this.moving) this.stride += distance / 96;
      else this.footfall = -1;
      if (this.action) {
        this.action.elapsed += dt;
        if (this.action.elapsed >= this.action.duration) this.action = null;
      }
      let state = "idle", row = 1, frame = 7, progress = 0;
      if (rolling) {
        state = "roll"; row = 2; progress = clamp(rollProgress, 0, 1); frame = frameAt(progress);
      } else if (this.action) {
        state = this.action.name; progress = this.action.elapsed / this.action.duration;
        row = state === "repair" ? 2 : state === "shoot" ? 1 : 3;
        frame = state === "shoot" ? 3 + frameAt(progress, 5) : frameAt(progress);
      } else if (charge > 0.01) {
        state = "charge"; row = 1; progress = charge; frame = Math.min(2, Math.floor(charge * 3));
      } else if (binding) {
        state = "channel"; row = 3; frame = 3 + Math.floor(this.time * 6) % 2;
      } else if (this.moving) {
        state = "run"; row = 0; progress = this.stride % 1; frame = frameAt(progress);
      }
      this.snapshot = { state, row, frame, progress };
      const step = Math.floor(this.stride * 2);
      const footstep = this.moving && step !== this.footfall;
      this.footfall = this.moving ? step : -1;
      return footstep;
    }
  }

  function getSheet(character) {
    if (sheets.has(character)) return sheets.get(character);
    if (typeof Image === "undefined") return null;
    const image = new Image();
    image.src = `./assets/runtime/hero-actions-v1/${character}.png`;
    const sheet = { image, ready: false };
    image.onload = () => { sheet.ready = image.naturalWidth >= 8 && image.naturalHeight >= 4; };
    sheets.set(character, sheet);
    return sheet;
  }

  function draw(context, player, alpha = 1) {
    const sheet = getSheet(player.characterId);
    if (!sheet?.ready) return false;
    const motion = player.animation.snapshot;
    const { image } = sheet;
    const cellWidth = image.naturalWidth / 8;
    const cellHeight = image.naturalHeight / 4;
    const sx = Math.round(motion.frame * cellWidth);
    const sy = Math.round(motion.row * cellHeight);
    const width = player.dancing && player.characterId === "wenyu" ? 216 : 192;
    const height = Math.round(width * cellHeight / cellWidth / 2) * 2;
    const facing = motion.state === "roll" ? player.rollDir.x : Math.cos(player.facing);
    context.save();
    context.imageSmoothingEnabled = false;
    context.globalAlpha *= alpha;
    context.translate(Math.round(player.x / 2) * 2, Math.round(player.y / 2) * 2);
    if (player.dancing || player.bindingMode) {
      context.strokeStyle = player.currentMagic.color;
      context.lineWidth = 2;
      context.globalAlpha *= 0.55;
      context.setLineDash([6, 8]);
      context.lineDashOffset = -player.animation.time * 24;
      context.strokeRect(-43, -63, 86, 88);
      context.setLineDash([]);
      context.globalAlpha /= 0.55;
    }
    if (facing < 0) context.scale(-1, 1);
    context.drawImage(image, sx, sy, Math.round(cellWidth), Math.round(cellHeight), -width / 2, 20 - height * 80 / 96, width, height);
    context.restore();
    if (motion.state === "charge" || motion.state === "shoot") {
      context.save();
      context.globalAlpha *= alpha * 0.8;
      context.translate(Math.round(player.x / 2) * 2, Math.round(player.y / 2) * 2);
      context.rotate(player.facing);
      context.fillStyle = player.characterId === "wenyu" ? "#83e7f0" : "#ffdf93";
      context.fillRect(24, -2, 16 + Math.round((player.charge || 0) * 18), 4);
      context.fillRect(36 + Math.round((player.charge || 0) * 18), -4, 4, 8);
      context.restore();
    }
    return true;
  }

  root.BoundaryAnimation = Object.freeze({ CharacterAnimator, draw, frameAt, preload: () => ["xingyao", "wenyu"].forEach(getSheet) });
})(typeof window === "undefined" ? globalThis : window);
