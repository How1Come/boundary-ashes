import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

await import("../src/character-animation.js");
const { CharacterAnimator } = globalThis.BoundaryAnimation;
const animator = new CharacterAnimator("xingyao");
animator.update(0.1);
assert.equal(animator.snapshot.state, "idle");
assert.equal(animator.snapshot.row, 1);
assert.equal(animator.snapshot.frame, 7, "Idle uses a planted standing pose, not a running pose");
const frames = new Set();
for (let i = 0; i < 64; i++) {
  animator.update(1 / 60, { distance: 1.5 });
  frames.add(animator.snapshot.frame);
}
assert.equal(frames.size, 8, "Walking traverses the full 8-frame cycle");
animator.update(0.1, { distance: 0 });
assert.equal(animator.snapshot.state, "idle", "Blocked movement must not keep walking");
animator.update(0.01, { charge: 1 });
assert.equal(animator.snapshot.frame, 2, "Fully drawn bow holds before release");
animator.play("shoot", 0.26);
animator.update(0.01);
assert.equal(animator.snapshot.frame, 3, "Arrow release uses the release frame");
animator.update(0.3);
assert.equal(animator.snapshot.state, "idle", "One-shot action must return to idle");
animator.play("roll", 0.43);
animator.play("cast", 0.5);
assert.equal(animator.action.name, "roll", "Casting must not overwrite active roll");
animator.update(0.1, { rolling: true, rollProgress: 0.5 });
assert.equal(animator.snapshot.row, 2);
assert.equal(animator.snapshot.frame, 4);
const engineer = new CharacterAnimator("wenyu");
engineer.play("repair", 0.6);
engineer.play("shoot", 0.34);
engineer.update(0.3);
assert.equal(engineer.snapshot.state, "repair");
assert.equal(engineer.snapshot.row, 2);

const elements = new Map();
const listeners = new Map();
const noop = () => {};
const drawing = new Proxy({ globalAlpha: 1 }, { get: (o, k) => k in o ? o[k] : noop });
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    id, dataset: {}, style: { setProperty: noop }, textContent: "", innerHTML: "",
    classList: { add: noop, remove: noop, toggle: noop }, setAttribute: noop,
    appendChild: noop, getContext: () => drawing,
    querySelectorAll: () => [], addEventListener: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }),
    play: () => Promise.resolve(), pause: noop,
  });
  return elements.get(id);
}
const sound = new Proxy({}, { get: (_, key) => key === "volume" ? 0.7 : key === "muted" ? false : noop });
const sandbox = {
  console, performance, Math, Set, Map, URL, Number,
  innerWidth: 1600, innerHeight: 900, location: { hostname: "localhost" },
  document: { getElementById: element, querySelectorAll: () => [], body: element("body"), createElement: element, addEventListener: noop },
  localStorage: { getItem: () => null, setItem: noop },
  requestAnimationFrame: noop, setTimeout: noop, setInterval: noop,
  addEventListener: (name, handler) => listeners.set(name, handler),
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  Image: class { complete = true; naturalWidth = 768; naturalHeight = 384; set onload(handler) { handler(); } },
  BoundarySoundscape: class { constructor() { return sound; } },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const file of ["dungeon-generator", "room-layouts", "character-animation", "game"]) {
  vm.runInContext(await readFile(new URL(`../src/${file}.js`, import.meta.url), "utf8"), sandbox);
}
const run = (code) => vm.runInContext(code, sandbox);
run('game.startTutorial(); game.tutorial.active = false; game.enemies = [];');
const startX = run("game.player.x");
run('input.keys.add("KeyD");');
for (let i = 0; i < 20; i++) run("game.update(1 / 60)");
assert.ok(run("game.player.x") > startX);
assert.equal(run("game.player.animation.snapshot.state"), "run");
assert.equal(run("BoundaryAnimation.draw(document.getElementById('game-canvas').getContext('2d'), game.player)"), true, "A loaded action sheet must use the new renderer");
run('input.keys.clear(); input.mouse.down = true;');
for (let i = 0; i < 30; i++) run("game.update(1 / 60)");
assert.equal(run("game.player.animation.snapshot.state"), "charge");
run('input.mouse.down = false; input.mouse.released = true; game.update(1 / 60); input.mouse.released = false;');
assert.equal(run("game.stats.shots"), 1);
assert.equal(run("game.player.animation.snapshot.state"), "shoot");
run("game.player.startRoll(); game.update(1 / 60);");
assert.equal(run("game.player.animation.snapshot.state"), "roll");
assert.ok(run("game.player.invulnerable") > 0);
run('game.selectCharacter("wenyu", false); game.startTutorial(); game.tutorial.active = false; game.enemies = []; game.player.manufactureRobot(); game.player.startRoll(); game.update(1 / 60);');
assert.equal(run("game.player.animation.snapshot.state"), "repair");
assert.equal(run("game.player.rollTimer"), 0, "Engineer repair must not turn into a roll");
assert.equal(run("game.player.rollCharges"), 2);
run("game.player.startDance(); game.update(1 / 60);");
assert.equal(run("game.player.animation.snapshot.state"), "cast");
assert.ok(run("game.player.dancing"));
assert.equal(run("game.player.robots.length"), 0);
run('game.player.animation.reset(); game.player.manufactureRobot(); game.player.danceTimer = 0; game.player.manufactureRobot(); game.player.attackCooldown = 0; input.mouse.down = true; game.player.startRoll(); game.update(1 / 60);');
assert.equal(run("game.player.animation.snapshot.state"), "repair", "Held auto-fire must not hide a repair action");
run('game.player.charge = 0.7; game.togglePause();');
assert.equal(run("game.player.charge"), 0, "Pausing must cancel a held charge");
console.log("Verified 8-frame animation timing, actual movement/charge/release/roll/repair/mech integration.");

await import("../src/soundscape.js");
const { render, names } = globalThis.BoundaryAudio;
for (const name of names) {
  const a = render(name, 32000, 42), b = render(name, 32000, 43);
  let peak = 0, energy = 0;
  for (const sample of a) {
    assert.ok(Number.isFinite(sample), `${name} PCM must be finite`);
    peak = Math.max(peak, Math.abs(sample)); energy += sample * sample;
  }
  assert.ok(peak <= 0.761, `${name} must retain headroom`);
  assert.ok(energy / a.length > 0.00001, `${name} must be audible`);
  assert.equal(a[0], 0); assert.equal(a.at(-1), 0);
  assert.notDeepEqual(a, b, `${name} must have genuine sample variation`);
}
class Parameter {
  value = 0;
  setValueAtTime(v) { this.value = v; }
  setTargetAtTime(v) { this.value = v; }
  cancelScheduledValues() {}
}
class AudioNode {
  gain = new Parameter(); frequency = new Parameter(); pan = new Parameter(); playbackRate = new Parameter();
  threshold = new Parameter(); knee = new Parameter(); ratio = new Parameter(); attack = new Parameter(); release = new Parameter();
  connect() {} disconnect() {} start() {} stop() { this.onended?.(); }
}
globalThis.AudioContext = class {
  currentTime = 0; sampleRate = 32000; state = "running"; destination = new AudioNode();
  createGain() { return new AudioNode(); }
  createBiquadFilter() { return new AudioNode(); }
  createDynamicsCompressor() { return new AudioNode(); }
  createConvolver() { return new AudioNode(); }
  createStereoPanner() { return new AudioNode(); }
  createBufferSource() { return new AudioNode(); }
  createBuffer(channels, length) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: (channel) => data[channel] };
  }
};
const audio = new globalThis.BoundarySoundscape();
const bankIndex = JSON.parse(await readFile(new URL("../assets/runtime/audio-v2/manifest.json", import.meta.url), "utf8"));
const bankBytes = await readFile(new URL("../assets/runtime/audio-v2/foley.pcm", import.meta.url));
audio.installBank(bankIndex, bankBytes.buffer.slice(bankBytes.byteOffset, bankBytes.byteOffset + bankBytes.byteLength));
assert.ok(audio.bank, "Offline bank must be valid and available before combat");
audio.enable();
for (const name of names) for (let variant = 0; variant < 3; variant++) {
  const expected = render(name, 32000, 9001 + variant * 7919 + name.length * 31);
  const actual = audio.buffer(name, variant).getChannelData(0);
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < actual.length; i += 53) assert.ok(Math.abs(actual[i] - expected[i]) <= 1 / 32767, `${name}:${variant} bank must match its authored PCM`);
}
audio.shot(0.5, { group: "spiritBow" });
const beforePlayerShot = audio.voices.size;
audio.shot(0.9);
assert.equal(audio.voices.size, beforePlayerShot + 1, "A simultaneous companion arrow must not suppress player audio");
for (let i = 0; i < 80; i++) { audio.context.currentTime += 0.1; audio.cue("bow"); }
assert.ok(audio.voices.size <= 28, "Dense combat must keep a bounded voice count");
audio.setVolume(0); assert.equal(audio.master.gain.value, 0);
audio.setVolume(0.7); audio.setMuted(true); assert.equal(audio.master.gain.value, 0);
audio.setMuted(false); assert.ok(audio.master.gain.value > 0);
audio.setScene(false); assert.equal(audio.world.gain.value, 0);
const count = audio.voices.size; audio.cue("stone"); assert.equal(audio.voices.size, count);
audio.preview("creatures"); assert.ok([...audio.voices].some((v) => v.ui), "Paused settings previews must use the UI bus");
audio.setScene(true, 3); assert.equal(audio.world.gain.value, 1);
assert.ok(Math.abs(audio.ambient.playbackRate.value - 0.82) < 0.000001);
console.log(`Verified ${names.length} foley voices, PCM headroom/variation, voice budget, mute and pause routing.`);
for (const character of ["xingyao", "wenyu"]) {
  const png = await readFile(new URL(`../assets/runtime/hero-actions-v1/${character}.png`, import.meta.url));
  assert.equal(png.readUInt32BE(16), 768);
  assert.equal(png.readUInt32BE(20), 384);
  assert.equal(png[25], 6, `${character} frames must carry true RGBA transparency`);
}
console.log("Verified both packed character sheets and all 135 offline audio variants.");
