import { mkdir, writeFile } from "node:fs/promises";
await import("../src/soundscape.js");
const { render, names } = globalThis.BoundaryAudio;
const sampleRate = 32000;
const root = new URL("../", import.meta.url);
const folder = new URL("assets/runtime/audio-v2/", root);
await mkdir(folder, { recursive: true });
const index = { version: "audio-v2", sampleRate, format: "s16le", samples: {} };
const chunks = [];
let offset = 0;
for (const name of names) {
  for (let variant = 0; variant < 3; variant++) {
    const samples = render(name, sampleRate, 9001 + variant * 7919 + name.length * 31);
    const bytes = Buffer.alloc(samples.length * 2);
    for (let i = 0; i < samples.length; i++) bytes.writeInt16LE(Math.round(samples[i] * 32767), i * 2);
    index.samples[`${name}:${variant}`] = { offset, length: samples.length };
    offset += samples.length;
    chunks.push(bytes);
  }
}
await writeFile(new URL("foley.pcm", folder), Buffer.concat(chunks));
await writeFile(new URL("manifest.json", folder), JSON.stringify(index, null, 2) + "\n");

const sequence = [
  [0.15, "bow", 0.65], [0.4, "wood", 0.55], [1.0, "bow", 0.65], [1.25, "metal", 0.5],
  [1.85, "breeze", 0.4], [2.6, "roll", 0.5], [3.3, "techShot", 0.55], [3.5, "stone", 0.6],
  [4.15, "wraithAttack", 0.5], [4.9, "archerDeath", 0.5], [5.7, "bruteAttack", 0.5],
  [6.5, "sentinelDeath", 0.45], [7.4, "mech", 0.55],
];
const preview = new Float32Array(sampleRate * 9);
sequence.forEach(([start, name, gain], variant) => {
  const pcm = render(name, sampleRate, 917 + variant);
  const begin = Math.round(start * sampleRate);
  for (let i = 0; i < pcm.length && i + begin < preview.length; i++) preview[begin + i] += pcm[i] * gain;
});
const wav = Buffer.alloc(44 + preview.length * 2);
wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(preview.length * 2, 40);
for (let i = 0; i < preview.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, preview[i])) * 32767), 44 + i * 2);
await mkdir(new URL("output/audio-v2/", root), { recursive: true });
await writeFile(new URL("output/audio-v2/preview.wav", root), wav);
console.log(`Rendered ${names.length * 3} original PCM variants (${(offset * 2 / 1024 / 1024).toFixed(2)} MiB) and a 9-second audition.`);
