# SUNDOWN DEBT

An original, fully offline open world crime game. Explore **Port Serein** as **Nico Vale**: steal a car, follow a bad lead, and settle a debt before the sun goes down. All artwork is drawn by Canvas; all sound is synthesized locally with Web Audio. No assets, libraries, fonts, or services are downloaded.

Run `node serve.ts` with Node 22.18+ and open **http://127.0.0.1:8080** in desktop Chrome. `PORT=8081 node serve.ts` selects another port. You can also open `game/index.html` directly; the local server gives localStorage a consistent origin. The static game has no build step.

| Input | Action |
| --- | --- |
| WASD / arrows | Walk; throttle, reverse and steer in a vehicle |
| Shift | Sprint on foot |
| E | Talk, steal/enter/exit, deliver, use safehouse |
| Mouse | Aim |
| Left click / F | Shoot, including from a vehicle |
| Space | Melee on foot; handbrake while driving |
| Right click | Melee |
| M | Expand/close the city map |
| P / Esc | Pause/resume |
| Q | Toggle sound |
| Enter | Start or activate the primary dialogue/menu action |

Three connected contracts:

1. **A debt in daylight** — meet mechanic and fixer Lena Quill at Quill Motor Works, hear her plan, and accept the courier job. Reward: $250.
2. **Borrowed time** — steal the silver Sol courier van and deliver it to Dock 04 while police pursue you. Reward: $1,500.
3. **Cut the wire** — defeat four members of the Wire Crew, recover the ledger, then escape to The Low Tide in Old Serein. Reward: $3,200.

Free roam is available from the title and after the story. The city has moving traffic and pedestrians, multiple vehicle types, a waterfront and marina, a palm park and tennis court, rooftop pools, eight hidden $200 stashes, shooting and melee, five wanted levels, police that navigate roads and respond to crimes, and a safehouse that restores health and clears heat. Break sight and keep moving to escape a pursuit, or head for The Low Tide. Contract completion restores health. If you lose all health, recovery costs $100 and keeps your contract progress.

Progress saves every eight seconds, at story milestones, when pausing, and when leaving the page. Continue restores position, current vehicle, cash, health, contracts, enemies, and collected stashes. Restart Story in the pause menu starts over and replaces the local save. A corrupt or unavailable save does not stop play.

`game/src/city.js` defines the city and collision geometry; `simulation.js` owns movement, traffic, combat, pursuit and storage; `story.js` owns the contracts; `render.js` draws the world and minimap; `audio.js` synthesizes sounds; `main.js` handles input, menus and the fixed-step loop.

Build the competition output with:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The entrypoint uses only Node standard libraries and the unchanged supplied `vendor/makefun-game.ts`. It copies `game/` and `screenshots/` and builds the canonical dossier. The root `dossier.json` is an exact copy of the verified output. `out/` is ignored by Git.

The three submitted images are genuine, unedited Playwright screenshots at 1280×720: the live title screen, a moving courier-van police chase, and the final story completion screen. Their capture required an actual keyboard and mouse playthrough, with no state changes or scene staging. Capture and verification are reproducible in `tests/playthrough.cjs` using an existing Playwright installation and Chromium headless shell; `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` can override the local defaults. Playwright is a development tool only and is not shipped in the game.

- `node tests/playthrough.cjs`: 29 full-playthrough browser checks and the three screenshots.
- `node tests/mechanics.cjs`: 17 isolated browser checks, including fixture-based melee, damage, recovery, hiding, and collision tests; these fixtures never produce submission screenshots.
- `node tests/package.ts`: 9 package checks, screenshot constraints, vendor hash, and byte-identical dossiers from two clean output runs. Run the packaging command first.
- `browser-validation.json`, `mechanics-validation.json`, `package-validation.json`, and `kit-check.json` hold the results; `VALIDATION.md` explains their scope.

All names, characters, city geometry, story, art and audio are original. The supplied ChatGPT reference README was consulted for design only; none of its code or screenshots were used. MIT licensed.
