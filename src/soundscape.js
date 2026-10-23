"use strict";

((root) => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function random(seed) {
    let n = seed >>> 0;
    return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
  }
  const durations = {
    bow: 0.32, bowDraw: 0.48, techShot: 0.24, robotShot: 0.2,
    flesh: 0.23, wood: 0.24, stone: 0.38, metal: 0.4, spectral: 0.38,
    light: 0.36, meteor: 0.5, breeze: 0.48, force: 0.34, tech: 0.3,
    roll: 0.43, step: 0.14, stepTech: 0.16, hurt: 0.34,
    select: 0.16, recharge: 0.36, chime: 0.72, shield: 0.34,
    summon: 0.65, repair: 0.5, mech: 0.9, dance: 0.75,
    explosion: 0.9, boundary: 0.6, bossIntro: 1.5, bossWarning: 0.75,
    wraithAttack: 0.45, wraithHurt: 0.35, wraithDeath: 0.9,
    archerAttack: 0.32, archerHurt: 0.28, archerDeath: 0.65,
    bruteAttack: 0.62, bruteHurt: 0.4, bruteDeath: 1.0,
    sentinelAttack: 0.48, sentinelHurt: 0.34, sentinelDeath: 0.8,
    pickup: 0.32, defeat: 1.2, ambience: 4.0,
  };

  function render(name, sampleRate = 32000, seed = 1) {
    const seconds = durations[name];
    if (!seconds) throw new Error(`Unknown sound: ${name}`);
    const output = new Float32Array(Math.ceil(seconds * sampleRate));
    const rng = random(seed);
    function air(start, length, gain, low = 180, high = 5000, attack = 0.002, curve = 3) {
      let slow = 0, fast = 0;
      const a = 1 - Math.exp(-TAU * high / sampleRate);
      const b = 1 - Math.exp(-TAU * low / sampleRate);
      const offset = Math.round(start * sampleRate), count = Math.round(length * sampleRate);
      for (let i = 0; i < count && offset + i < output.length; i++) {
        const n = rng() * 2 - 1;
        fast += a * (n - fast); slow += b * (n - slow);
        const t = i / sampleRate;
        const env = Math.min(1, t / attack) * Math.pow(1 - i / count, curve);
        output[offset + i] += (fast - slow) * env * gain;
      }
    }
    function modes(start, length, base, gain, ratios = [1, 1.59, 2.37, 3.81], damping = 9) {
      const offset = Math.round(start * sampleRate), count = Math.round(length * sampleRate);
      for (let m = 0; m < ratios.length; m++) {
        const frequency = base * ratios[m] * (0.98 + rng() * 0.04);
        const phase = rng() * 0.2;
        for (let i = 0; i < count && offset + i < output.length; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t / 0.0015) * Math.exp(-t * damping * (1 + m * 0.35)) * (1 - i / count);
          output[offset + i] += Math.sin(TAU * frequency * t + phase) * env * gain / (1 + m * 1.3);
        }
      }
    }
    function string(frequency, gain, decay = 0.987) {
      const delay = Math.max(2, Math.round(sampleRate / frequency));
      const ring = new Float32Array(delay);
      for (let i = 0; i < delay; i++) ring[i] = (rng() * 2 - 1) * 0.6;
      for (let i = 0; i < output.length; i++) {
        const p = i % delay, next = (p + 1) % delay;
        const value = ring[p];
        ring[p] = (value + ring[next]) * 0.5 * decay;
        output[i] += value * gain * Math.min(1, i / (sampleRate * 0.001)) * (1 - i / output.length);
      }
    }
    function grit(count, gain, low = 700) {
      for (let i = 0; i < count; i++) {
        const start = 0.015 + rng() * seconds * 0.65;
        air(start, 0.015 + rng() * 0.055, gain * (0.4 + rng() * 0.6), low, 7000, 0.001, 2);
      }
    }
    function bloom(base, gain = 0.13) {
      [1, 1.5, 2.012, 2.77].forEach((ratio, i) => modes(i * 0.018, seconds - i * 0.018, base * ratio, gain / (1 + i), [1, 2.71, 4.13], 7));
      air(0, seconds, 0.22, 1700, 8500, 0.03, 2);
    }
    switch (name) {
      case "bow":
        string(173 + rng() * 30, 1.25); modes(0, 0.13, 310, 0.2, [1, 2.43, 4.91], 33);
        air(0, 0.022, 0.55, 900, 10000); air(0.015, 0.22, 0.5, 1200, 7500, 0.012, 3); break;
      case "bowDraw":
        air(0, seconds, 0.37, 950, 4600, 0.08, 0.8); grit(12, 0.1, 1400); modes(0.18, 0.26, 240, 0.055, [1, 3.14], 19); break;
      case "techShot": case "robotShot": case "tech":
        modes(0, 0.16, name === "robotShot" ? 380 : 230, 0.34, [1, 2.07, 5.21], 29);
        air(0, 0.02, 0.9, 850, 9500); air(0.012, seconds - 0.012, 0.65, 1000, 4600, 0.003, 4); break;
      case "flesh": case "hurt":
        modes(0, 0.16, name === "hurt" ? 87 : 135, 0.44, [1, 1.91, 3.07], 27);
        air(0, 0.055, 1.0, 350, 3800); air(0.025, seconds - 0.025, 0.5, 80, 1600, 0.008, 4); grit(5, 0.23, 950); break;
      case "wood":
        modes(0, 0.19, 265, 0.44, [1, 2.72, 5.31], 30); air(0, 0.035, 0.8, 900, 6500); grit(6, 0.24); break;
      case "stone":
        modes(0, 0.22, 108, 0.5, [1, 2.39, 4.83], 21); air(0, 0.085, 1.1, 240, 4200); grit(13, 0.35, 1400); break;
      case "metal": case "shield":
        modes(0, seconds, name === "shield" ? 335 : 475, 0.33, [1, 1.47, 2.09, 3.63, 5.17], 11);
        air(0, 0.035, 0.8, 1700, 10000); modes(0, 0.1, 150, 0.18, [1, 2.3], 32); break;
      case "spectral":
        air(0, seconds, 0.8, 520, 2900, 0.012, 2); modes(0, seconds, 167, 0.12, [1, 1.06, 2.93], 12); break;
      case "light": bloom(680, 0.15); break;
      case "breeze": bloom(510, 0.09); air(0, seconds, 0.44, 1900, 10000, 0.04, 1.6); break;
      case "force": case "boundary":
        air(0, seconds, 0.8, 170, 3800, 0.004, 3); modes(0, seconds, 146, 0.42, [1, 1.43, 2.91], 16); break;
      case "meteor": case "explosion":
        modes(0, 0.42, 58, 0.6, [1, 1.92, 3.05], 12); air(0, seconds, 1.45, 35, 2500, 0.004, 3);
        air(0, 0.07, 0.75, 1600, 7500); grit(20, 0.4, 1100); break;
      case "roll":
        air(0, 0.3, 0.9, 440, 5800, 0.025, 1.5); air(0.29, 0.14, 0.55, 130, 2100); modes(0.29, 0.14, 127, 0.19, [1, 2.13], 32); break;
      case "step": case "stepTech":
        modes(0, 0.1, name === "step" ? 175 : 128, 0.28, [1, 2.28], 44);
        air(0, 0.055, 0.9, 380, 5400); grit(4, 0.15, 1800); break;
      case "select": case "pickup": case "recharge": case "chime":
        string(name === "chime" ? 440 : name === "pickup" ? 785 : 610, 0.6, 0.996);
        modes(0.02, seconds - 0.02, name === "chime" ? 880 : 1220, 0.09, [1, 2.76, 4.11], 10); air(0, 0.035, 0.19, 1600, 7200); break;
      case "summon": case "dance":
        bloom(name === "dance" ? 440 : 550, 0.13); air(0.04, seconds - 0.04, 0.7, 450, 4500, 0.13, 2); break;
      case "repair":
        modes(0, 0.3, 310, 0.16, [1, 2.41, 4.27], 17); grit(14, 0.25, 1900); bloom(730, 0.08); break;
      case "mech":
        [0, 0.08, 0.19, 0.32].forEach((t, i) => { modes(t, 0.35, 110 + i * 31, 0.28, [1, 2.38, 4.13], 18); air(t, 0.08, 0.72, 260, 5200); });
        air(0.2, 0.65, 0.55, 160, 2300, 0.17, 2); break;
      case "bossIntro": case "bossWarning": case "defeat":
        modes(0, seconds, name === "bossWarning" ? 104 : 53, 0.55, [1, 1.49, 2.09, 2.87], 3.8);
        air(0, seconds, 0.7, 50, 1200, 0.05, 2); grit(12, 0.18, 1400); break;
      case "wraithAttack": case "wraithHurt": case "wraithDeath":
        air(0, seconds, 0.9, 460, 3500, 0.015, 1.5); modes(0, seconds, 135, 0.2, [1, 1.07, 2.83], 8);
        for (let i = 0; i < output.length; i++) output[i] *= 0.72 + 0.28 * Math.sin(TAU * 37 * i / sampleRate); break;
      case "archerAttack":
        string(137, 1.0, 0.981); modes(0, 0.12, 610, 0.26, [1, 2.71], 35); air(0, 0.11, 0.7, 1300, 8200); break;
      case "archerHurt": case "archerDeath":
        for (let j = 0; j < (name.endsWith("Death") ? 7 : 3); j++) {
          const t = j * 0.045; modes(t, 0.12, 390 + rng() * 280, 0.28, [1, 2.39, 4.81], 35); air(t, 0.055, 0.42, 1400, 6000);
        } break;
      case "bruteAttack": case "bruteHurt": case "bruteDeath":
        modes(0, seconds, 67, 0.6, [1, 1.37, 2.61], 7); air(0, seconds, 1.1, 95, 2000, 0.006, 2);
        grit(name.endsWith("Death") ? 30 : 13, 0.38, 900); break;
      case "sentinelAttack": case "sentinelHurt": case "sentinelDeath":
        modes(0, seconds, name.endsWith("Death") ? 278 : 396, 0.37, [1, 1.414, 2.718, 4.123], 7);
        air(0, 0.12, 0.6, 1100, 9000); grit(11, 0.2, 2900); break;
      case "ambience": {
        let low = 0, soft = 0;
        for (let i = 0; i < output.length; i++) {
          low += 0.008 * (rng() * 2 - 1 - low);
          soft += 0.001 * (low - soft);
          const phase = i / output.length;
          output[i] = (low - soft) * (0.65 + 0.35 * Math.sin(TAU * phase) ** 2) * Math.sin(Math.PI * phase) ** 0.5;
        }
        break;
      }
    }
    let mean = 0, peak = 0;
    for (const v of output) mean += v;
    mean /= output.length;
    for (let i = 0; i < output.length; i++) {
      const fade = Math.min(1, i / 32, (output.length - 1 - i) / 160);
      output[i] = (output[i] - mean) * fade;
      peak = Math.max(peak, Math.abs(output[i]));
    }
    const scale = 0.76 / Math.max(0.01, peak);
    for (let i = 0; i < output.length; i++) output[i] *= scale;
    output[0] = 0;
    output[output.length - 1] = 0;
    return output;
  }

  class Soundscape {
    constructor() {
      this.context = null; this.volume = 0.7; this.muted = false;
      this.cache = new Map(); this.voices = new Set(); this.last = new Map(); this.variants = new Map();
      this.sceneActive = true; this.floor = 1;
      this.bank = null;
      if (typeof root.fetch === "function") {
        Promise.all([
          root.fetch("./assets/runtime/audio-v2/manifest.json").then((r) => { if (!r.ok) throw new Error("Audio index unavailable"); return r.json(); }),
          root.fetch("./assets/runtime/audio-v2/foley.pcm").then((r) => { if (!r.ok) throw new Error("Audio bank unavailable"); return r.arrayBuffer(); }),
        ]).then(([index, bytes]) => this.installBank(index, bytes)).catch(() => {});
      }
      try {
        const value = root.localStorage?.getItem("boundary-ashes-volume");
        if (value !== null && value !== undefined && Number.isFinite(Number(value))) this.volume = clamp(Number(value), 0, 1);
        this.muted = root.localStorage?.getItem("boundary-ashes-muted") === "true";
      } catch {}
    }

    enable() {
      if (!this.context) {
        const AudioContext = root.AudioContext || root.webkitAudioContext;
        if (!AudioContext) return;
        this.context = new AudioContext();
        const c = this.context;
        this.master = c.createGain(); this.world = c.createGain(); this.ui = c.createGain();
        this.world.connect(this.master); this.ui.connect(this.master);
        this.world.gain.value = this.sceneActive ? 1 : 0;
        const highpass = c.createBiquadFilter(); highpass.type = "highpass"; highpass.frequency.value = 35;
        const compressor = c.createDynamicsCompressor();
        compressor.threshold.value = -10; compressor.knee.value = 12; compressor.ratio.value = 8;
        compressor.attack.value = 0.002; compressor.release.value = 0.15;
        this.master.connect(highpass); highpass.connect(compressor); compressor.connect(c.destination);
        this.reverb = c.createConvolver(); this.wet = c.createGain(); this.wet.gain.value = 0.17;
        const impulse = c.createBuffer(2, Math.ceil(c.sampleRate * 0.65), c.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel), rng = random(914 + channel);
          let low = 0;
          for (let i = 0; i < data.length; i++) {
            low += 0.17 * (rng() * 2 - 1 - low);
            data[i] = i < c.sampleRate * 0.018 ? 0 : low * Math.exp(-i / c.sampleRate * 10) * 0.26;
          }
        }
        this.reverb.buffer = impulse; this.reverb.connect(this.wet); this.wet.connect(this.world);
        this.ambientGain = c.createGain(); this.ambientGain.gain.value = 0.045; this.ambientGain.connect(this.world);
        this.ambient = c.createBufferSource(); this.ambient.buffer = this.buffer("ambience", 0);
        this.ambient.playbackRate.value = 1 - clamp(this.floor - 1, 0, 2) * 0.09;
        this.ambient.loop = true; this.ambient.connect(this.ambientGain); this.ambient.start();
        this.applyVolume(true);
        for (const name of ["bow", "flesh", "stone", "step", "techShot"]) this.buffer(name, 0);
      }
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
    }

    installBank(index, bytes) {
      if (index.sampleRate !== 32000 || index.format !== "s16le" || bytes.byteLength % 2 !== 0) return;
      const samples = new Int16Array(bytes);
      for (const entry of Object.values(index.samples)) {
        if (!Number.isInteger(entry.offset) || !Number.isInteger(entry.length) || entry.offset < 0 || entry.length < 1 || entry.offset + entry.length > samples.length) return;
      }
      this.bank = { index, samples };
    }

    buffer(name, variant) {
      const key = `${name}:${variant}`;
      if (this.cache.has(key)) return this.cache.get(key);
      const rate = 32000;
      const entry = this.bank?.index.samples[key];
      let buffer;
      if (entry) {
        buffer = this.context.createBuffer(1, entry.length, rate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < entry.length; i++) data[i] = this.bank.samples[entry.offset + i] / 32767;
      } else {
        const pcm = render(name, rate, 9001 + variant * 7919 + name.length * 31);
        buffer = this.context.createBuffer(1, pcm.length, rate);
        buffer.getChannelData(0).set(pcm);
      }
      this.cache.set(key, buffer);
      return buffer;
    }

    cue(name, options = {}) {
      if (!this.context || this.muted || !durations[name]) return;
      const c = this.context, now = c.currentTime;
      const key = options.group || name;
      if (!options.ui && !this.sceneActive) return;
      if (now - (this.last.get(key) ?? -10) < (options.cooldown ?? 0.045)) return;
      this.last.set(key, now);
      const priority = options.priority ?? 1;
      if (this.voices.size >= 28) {
        const victim = [...this.voices].find((v) => v.priority <= priority);
        if (!victim) return;
        victim.gain.gain.setTargetAtTime(0, now, 0.003);
        victim.source.stop(now + 0.012); this.voices.delete(victim);
      }
      const variant = ((this.variants.get(name) ?? -1) + 1) % 3;
      this.variants.set(name, variant);
      const distance = Math.max(0, options.distance || 0);
      const source = c.createBufferSource(); source.buffer = this.buffer(name, variant);
      source.playbackRate.value = options.rate ?? (0.965 + Math.random() * 0.07);
      const gain = c.createGain(); gain.gain.value = (options.gain ?? 0.42) / (1 + (distance / 650) ** 2);
      const filter = c.createBiquadFilter(); filter.type = "lowpass";
      filter.frequency.value = Math.max(2000, 15000 / (1 + distance / 700));
      const pan = typeof c.createStereoPanner === "function" ? c.createStereoPanner() : c.createGain();
      if (pan.pan) pan.pan.value = clamp(options.pan || 0, -0.85, 0.85);
      source.connect(filter); filter.connect(gain); gain.connect(pan);
      pan.connect(options.ui ? this.ui : this.world);
      const send = c.createGain(); send.gain.value = options.reverb ?? (options.ui ? 0 : 0.22);
      pan.connect(send); send.connect(this.reverb);
      const voice = { source, gain, priority, ui: Boolean(options.ui) };
      this.voices.add(voice);
      source.onended = () => {
        this.voices.delete(voice);
        [source, filter, gain, pan, send].forEach((node) => node.disconnect());
      };
      source.start(now + (options.delay || 0));
    }

    setScene(active, floor = 1) {
      if (this.sceneActive === active && this.floor === floor) return;
      this.sceneActive = active; this.floor = floor;
      if (!this.context) return;
      this.world.gain.setTargetAtTime(active ? 1 : 0, this.context.currentTime, 0.04);
      this.ambient.playbackRate.setTargetAtTime(1 - clamp(floor - 1, 0, 2) * 0.09, this.context.currentTime, 0.4);
    }

    applyVolume(immediate = false) {
      if (!this.context) return;
      const now = this.context.currentTime, level = this.muted ? 0 : 0.7 * this.volume ** 1.4;
      this.master.gain.cancelScheduledValues(now);
      if (immediate) this.master.gain.setValueAtTime(level, now);
      else this.master.gain.setTargetAtTime(level, now, 0.025);
    }
    savePreferences() {
      try { root.localStorage?.setItem("boundary-ashes-volume", this.volume.toFixed(2)); root.localStorage?.setItem("boundary-ashes-muted", String(this.muted)); } catch {}
    }
    setVolume(value) { this.volume = clamp(Number(value) || 0, 0, 1); this.applyVolume(); this.savePreferences(); }
    setMuted(value) { this.muted = Boolean(value); this.applyVolume(); this.savePreferences(); }
    shot(charge = 0, options = {}) { this.cue("bow", { group: "playerBow", cooldown: 0, gain: 0.42 + charge * 0.2, rate: 1.05 - charge * 0.12, priority: 3, ...options }); }
    magic(kind, options = {}) { this.cue(durations[kind] ? kind : "force", { gain: 0.23, ...options }); }
    hit(kind = "normal", amount = 10, enemyType = "wraith", pan = 0, distance = 0) {
      const material = { dummy: "wood", brute: "stone", archer: "wood", sentinel: "metal", anchor: "metal", boss: "metal", wraith: "spectral" }[enemyType] || "flesh";
      const gain = clamp(0.3 + amount / 140, 0.32, 0.64);
      this.cue(material, { gain, pan, distance, group: "impact", cooldown: 0.035, priority: 2 });
      if (!["normal", "robot", "tether"].includes(kind)) this.magic(kind, { gain: gain * 0.24, pan, distance, group: "magicImpact", cooldown: 0.075 });
    }
    creature(type, event, options = {}) {
      if (type === "dummy") return;
      if (type === "boss") { if (event === "death") this.cue("explosion", { gain: 0.8, priority: 4, ...options }); return; }
      if (type === "anchor") { if (event === "death") this.cue("sentinelDeath", options); return; }
      const suffix = event === "death" ? "Death" : event === "hurt" ? "Hurt" : "Attack";
      this.cue(type + suffix, { gain: event === "death" ? 0.52 : 0.3, cooldown: event === "hurt" ? 0.24 : 0.15, group: `creature:${type}:${event}`, ...options });
    }
    step(character, options = {}) { this.cue(character === "wenyu" ? "stepTech" : "step", { gain: 0.13, cooldown: 0.17, reverb: 0.12, ...options }); }
    hurt() { this.cue("hurt", { gain: 0.65, priority: 4, cooldown: 0.15 }); }
    roll() { this.cue("roll", { gain: 0.42, priority: 3 }); }
    chime() { this.cue("chime", { gain: 0.3, ui: true, cooldown: 0.13 }); }
    shield() { this.cue("shield", { gain: 0.37, cooldown: 0.15 }); }
    preview(category = "combat") {
      this.enable();
      for (const voice of this.voices) {
        if (!voice.ui) continue;
        voice.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.003);
        voice.source.stop(this.context.currentTime + 0.012);
        this.voices.delete(voice);
      }
      const ui = { ui: true, cooldown: 0, priority: 5 };
      if (category === "creatures") {
        ["wraithAttack", "archerAttack", "bruteAttack", "sentinelDeath"].forEach((name, i) => this.cue(name, { ...ui, delay: i * 0.65, gain: 0.45, pan: i % 2 ? 0.3 : -0.3 }));
      } else if (category === "skills") {
        ["light", "breeze", "force", "mech"].forEach((name, i) => this.cue(name, { ...ui, delay: i * 0.6, gain: 0.4 }));
      } else {
        this.shot(0.85, ui);
        this.cue("wood", { ...ui, delay: 0.22, gain: 0.5, pan: 0.2 });
        this.cue("techShot", { ...ui, delay: 0.7, gain: 0.45 });
        this.cue("stone", { ...ui, delay: 0.87, gain: 0.5, pan: -0.25 });
      }
    }
  }
  root.BoundaryAudio = Object.freeze({ render, names: Object.keys(durations) });
  root.BoundarySoundscape = Soundscape;
})(typeof window === "undefined" ? globalThis : window);
