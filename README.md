# Boundary Ashes · 界标余烬

A single-player 2D pixel-art dungeon roguelike by [How1Come](https://github.com/How1Come), built with vanilla JavaScript, HTML5 Canvas, and Web Audio.

This repository is the standalone browser game. It does not depend on the separate `nomotropy-xigaloth` framework. The game interface is in Chinese.

## Play locally

You need Python 3 to serve the game. Node.js 18 or newer and npm are used for the convenience commands, asset tools, and automated checks; this checkpoint was verified with Node.js 22.17.1. No npm dependencies are required to play or run the normal build.

From the repository root:

```bash
npm start
```

Open [localhost:5173](http://localhost:5173). Choose a character, then select the tutorial or a dungeon run. Click once to enable browser audio.

Without Node.js:

```bash
python3 -m http.server 5173
```

If port 5173 is occupied, use `python3 -m http.server 5174` and open port 5174 instead. Serve the files over HTTP; opening `index.html` directly does not reliably load the audio bank.

## Current gameplay

- **Two characters:** Li Xingyao (黎星遥), an elf archer with charge shots and a spirit companion; Cheng Wenyu (程闻屿), an engineer with configurable support robots and a temporary mech form.
- **Character tutorials:** a dedicated training room for each hero, with Tianyi (天意) dialogue, highlighted targets, and action-based progression.
- **Three dungeon floors:** seeded room topology, six reusable obstacle layouts, a fully visible minimap, and a marked boss room.
- **Four upgrade rarities:** white, blue, purple, and gold, with weighted appearances, stronger effects, and animated high-rarity cards.
- **Active room hazards:** spikes, ember vents, arcane coils, and spinning blades with warning states and collision-safe spawn areas.
- **A boss encounter:** Eheng (厄衡), with protective anchors, telegraphed line attacks, falling marks, star rings, and gathering attacks.
- **A monster encyclopedia:** enemy behavior, threat information, and boss counterplay.
- **Pixel character actions:** movement, attacks, casting, archer dodge rolls, and engineer repairs, with animation timing separated from combat resolution.
- **Layered combat audio:** weapon release, material impacts, monsters, footsteps, skills, hazards, and boss cues, with volume controls and three audition groups.

| Floor | Name | Rooms |
| --- | --- | ---: |
| 1 | 沉落遗迹 | 8 |
| 2 | 逆星回廊 | 9 |
| 3 | 失序深庭 | 10 |

## Controls

| Input | Li Xingyao · 黎星遥 | Cheng Wenyu · 程闻屿 |
| --- | --- | --- |
| WASD | Move | Move |
| Mouse | Aim | Aim or select robots in binding mode |
| Left mouse | Hold to charge; release to fire | Hold for cooldown-limited pulse fire |
| Q | Summon or recall the spirit | Cycle the next robot's configuration |
| E | Cycle light, meteor, and breeze arrows | Enter or leave robot binding mode |
| Space | Directional dodge roll and volley | Reconfigure and repair a selected or nearby robot |
| R | Activate spirit dance | Recall robots and enter mech form |
| Esc | Pause or resume | Pause or resume |

Li Xingyao starts a normal run with basic attacks and Q. Magic-arrow switching, dodge volleys, and spirit dance must be unlocked through upgrades. Her tutorial exposes the full kit for training. Cheng Wenyu starts with his robot configuration, binding, repair, and mech mechanics available.

## Art and animation

Combat assets are pixel art; title-screen portraits are a separate illustrated presentation layer. All runtime assets are served locally.

| Asset directory | Contents |
| --- | --- |
| `assets/runtime/pixel-v1/` | Dungeon floors, props, enemies, bosses, robots, and effects |
| `assets/runtime/hero-actions-v1/` | Two 32-frame action sheets, frame metadata, and generation prompts |
| `assets/runtime/audio-v2/` | Pre-rendered sound bank and sample index |
| `assets/li-xingyao-animation-v5/` | Archer portrait reference frame and authoring references |
| `assets/cheng-wenyu-animation-v2/` | Engineer portrait master, phase frames, and authoring references |
| `output/hero-actions/` | Transparent source sheets needed to repack combat animations |

Combat action sheets use 96×96 RGBA cells with a shared foot pivot and default 2× rendering. Movement advances through eight frames based on actual distance, so collision-blocked movement does not keep walking. Attacks and skills use their own playback states without changing damage, attack cooldowns, or roll invulnerability.

Both portrait loops are four-second, 60 FPS silent videos. Their body layers remain fixed while hair ends, clothing edges, companion robots, and effects animate.

## Audio

The sound system contains 45 sound types with three variants each. The approximately 4.8 MiB PCM bank loads from the menu; cached samples avoid first-use synthesis during normal combat. Procedural synthesis remains a fallback when the bank cannot load.

The mix includes distance attenuation, stereo positioning, short room reverb, voice prioritization, and a 28-voice scheduling budget. Pausing or leaving the window silences the combat bus. Settings previews use a separate bus. Volume and mute preferences persist in browser storage.

Open settings to audition combat, monsters, or skills. The [nine-second audio sampler](output/audio-v2/preview.wav) provides a dry comparison without the game's spatial mix. These sounds are original layered synthesis, not studio-recorded foley.

## Development commands

| Command | Result |
| --- | --- |
| `npm start` | Serve the game on port 5173 |
| `npm run check` | Check JavaScript syntax |
| `npm run test:gameplay` | Check 3,600 seeded floor configurations, layouts, obstacle spacing, and atlas indices |
| `npm run test:presentation` | Check game-input animation hooks, transparency, audio-bank samples, mute/pause routing, and voice limits |
| `npm run audio:build` | Rebuild the PCM bank and local audio sampler |
| `npm run build` | Copy the runtime files into `dist/client/` and the optional Worker into `dist/server/` |
| `npm run verify` | Run syntax, gameplay, presentation, build, and built-route checks |

After changing the sound design in `src/soundscape.js`:

```bash
npm run audio:build
npm run verify
```

To repack character action sheets, install the authoring-only PNG package and run the packer:

```bash
npm install --no-save --package-lock=false pngjs
node scripts/pack-hero-actions.mjs
npm run verify
```

An existing tooling installation can be selected with `DUNGEON_TOOLING_PACKAGE`, set to its absolute `package.json` path. Repacking reads the two source images in `output/hero-actions/` and writes the runtime sheets and manifest.

Portrait rebuilding requires FFmpeg on the command path:

```bash
npm run portrait:v5
npm run portrait:wenyu:v2
```

The archer's source is `assets/li-xingyao-animation-v4/keyframe-01.png`; the engineer's source is `assets/cheng-wenyu-animation-v2/master.png`.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/game.js` | Combat, characters, enemies, tutorials, upgrades, input, and rendering |
| `src/dungeon-generator.js` | Seeded floor topology |
| `src/room-layouts.js` | Room layouts, obstacles, and placement validation |
| `src/character-animation.js` | Combat animation states and action-sheet rendering |
| `src/soundscape.js` | Sound design, sample playback, and mixing |
| `index.html`, `style.css` | Menus, HUD, tutorials, settings, and visual styling |
| `scripts/` | Asset generation, packaging, and verification |
| `worker/index.js` | Optional static-asset serving adapter |

The normal game needs only a static HTTP server. The Worker adapter and existing hosting configuration are not required for local play. `npm run build` prepares files; it does not publish a website.

## Current limits

- Desktop keyboard and mouse controls are implemented; touch controls are not.
- Character directions use horizontal mirroring, not independent four-direction animation sheets.
- Robot binding targets the engineer in the current single-player implementation.
- Browser storage retains preferences and character selection, not an in-progress dungeon save.
- Automated checks do not replace browser playtesting, visual review, or listening tests.
