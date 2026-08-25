import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const clientRoot = new URL("../dist/client/", import.meta.url);
const workerUrl = new URL(`../dist/server/index.js?verify=${Date.now()}`, import.meta.url);
const { default: worker } = await import(workerUrl.href);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
};

const assets = {
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, "");
    if (pathname.includes("..")) return new Response("Not found", { status: 404 });
    try {
      const body = await readFile(new URL(pathname, clientRoot));
      const extension = pathname.slice(pathname.lastIndexOf("."));
      return new Response(request.method === "HEAD" ? null : body, {
        headers: { "Content-Type": contentTypes[extension] || "application/octet-stream" },
      });
    } catch (error) {
      return new Response("Not found", { status: 404 });
    }
  },
};

async function fetchPath(pathname) {
  return worker.fetch(new Request(`https://boundary-ashes.test${pathname}`), { ASSETS: assets });
}

const home = await fetchPath("/");
assert.equal(home.status, 200);
assert.match(home.headers.get("content-type") || "", /^text\/html/);
assert.match(await home.text(), /界标余烬/);

for (const pathname of [
  "/style.css",
  "/src/dungeon-generator.js",
  "/src/game.js",
  "/assets/boss-eheng-portrait.png",
  "/assets/li-xingyao-portrait-v5-loop-locked.mp4",
  "/assets/li-xingyao-animation-v5/keyframe-01.png",
  "/assets/cheng-wenyu-animation-v2/keyframe-01.png",
]) {
  const response = await fetchPath(pathname);
  assert.equal(response.status, 200, `${pathname} should be deployable`);
}

const fallback = await fetchPath("/play");
assert.equal(fallback.status, 200);
assert.match(await fallback.text(), /界标余烬/);
assert.equal((await fetchPath("/missing.png")).status, 404);
assert.equal((await worker.fetch(new Request("https://boundary-ashes.test/", { method: "POST" }), { ASSETS: assets })).status, 405);

console.log("Verified hosted routes and required game assets.");
