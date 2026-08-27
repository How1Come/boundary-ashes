import { cp, mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const client = new URL("../dist/client/", import.meta.url);
const server = new URL("../dist/server/", import.meta.url);

await rm(dist, { recursive: true, force: true });
await mkdir(new URL("assets/", client), { recursive: true });
await mkdir(new URL("assets/li-xingyao-animation-v5/", client), { recursive: true });
await mkdir(new URL("assets/cheng-wenyu-animation-v2/", client), { recursive: true });
await mkdir(new URL("assets/runtime/", client), { recursive: true });
await mkdir(server, { recursive: true });

await Promise.all([
  cp(new URL("index.html", root), new URL("index.html", client)),
  cp(new URL("style.css", root), new URL("style.css", client)),
  cp(new URL("src/", root), new URL("src/", client), { recursive: true }),
  cp(new URL("assets/boss-eheng-portrait.png", root), new URL("assets/boss-eheng-portrait.png", client)),
  cp(new URL("assets/li-xingyao-portrait-v5-loop-locked.mp4", root), new URL("assets/li-xingyao-portrait-v5-loop-locked.mp4", client)),
  cp(new URL("assets/li-xingyao-animation-v5/keyframe-01.png", root), new URL("assets/li-xingyao-animation-v5/keyframe-01.png", client), { recursive: true }),
  cp(new URL("assets/cheng-wenyu-animation-v2/keyframe-01.png", root), new URL("assets/cheng-wenyu-animation-v2/keyframe-01.png", client)),
  cp(new URL("assets/cheng-wenyu-portrait-v2-loop-locked.mp4", root), new URL("assets/cheng-wenyu-portrait-v2-loop-locked.mp4", client)),
  cp(new URL("assets/runtime/pixel-v1/", root), new URL("assets/runtime/pixel-v1/", client), { recursive: true }),
  cp(new URL("worker/index.js", root), new URL("index.js", server)),
]);

console.log("Built Boundary Ashes for Sites hosting.");
