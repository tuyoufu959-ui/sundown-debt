# Verification record

Verified on 2026-11-17 with Node v24.22.1 and the locally installed Playwright plus Chromium headless shell 1255, loading the real served `game/index.html` at `http://127.0.0.1:8080/`.

The full story passed **29 browser assertions** using keyboard and mouse inputs. The test never teleports the player, edits simulation state, grants health/cash, or stages a screenshot scene. It starts a fresh story, walks to Lena, accepts her job, walks to and steals the courier van, drives to Dock 04, delivers it, exits and reenters the van, shoots all four hostiles, walks to the safehouse, completes the story, then exercises free roam, expanded map, pause, restart, and save restoration. The chase capture records the van moving above 200 simulation units/second with an active pursuit, multiple patrol cars and wanted stars. Completion records all three contracts, $5,130 cash and zero heat.

An additional **17 browser assertions** passed. These use explicitly identified simulation fixtures for isolated melee damage, lethal enemy fire, recovery, passive safehouse heat reduction, natural wanted decay, collisions, collectibles, and corrupt-save handling. They also verify audio context activation, mute controls, gameplay with browser networking disabled, opening the original static HTML directly via `file://`, and resizing the viewport. They are separate from the screenshot playthrough.

Both browser runs recorded **zero JavaScript page errors**. The story test recorded **zero external requests**; the only HTTP requests loaded the local HTML, stylesheet, and six scripts. There are no external fonts, images, sound files, libraries, CDN links, fetches or other remote dependencies. The audio graph ran in Chromium; subjective sound quality was not assessed by listening because this was headless verification.

All six game JavaScript files, both browser test harnesses, both TypeScript entrypoints, and the package audit parsed with Node syntax checks. The served index and simulation script returned **HTTP 200** with correct HTML and JavaScript MIME types.

Packaging passed **9 assertions**:

- `game/`: 9 files and directories together, 74,258 bytes; all regular files/directories within the kit limits.
- The vendor SHA-256 is exactly `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`.
- Every declared page/script reference resolves inside `game/` or is a data URI.
- Exactly three complete 1280×720 JPEG screenshots, all below 256 KiB.
- Two clean output directories produce byte-identical dossiers, and rebuilding with the unchanged helper produces the same bytes.
- `out/dossier.json` and root `dossier.json` are **598,138 bytes**, with SHA-256 `b128a42d74d47e8ce38ede014c9020012e9f171ce433237f0b9a332d34e83ee0`.

| Screenshot | Bytes | Captured state |
| --- | ---: | --- |
| `screenshots/1-start.jpg` | 141,113 | Title over the live coastal city |
| `screenshots/2-play.jpg` | 168,718 | Driving the stolen van with police in pursuit |
| `screenshots/3-end.jpg` | 80,897 | Story complete after all three contracts |

The kit check runs from the supplied kit directory with `node cli/makefun.mjs check --kit . --repo /home/hatch/workspace/makefun/gta6-01/repo`. Its local result is **4 passed, 0 failed, 16 skipped, 5 deferred to submission**. The skipped checks are prerequisites (verified separately above), the unrequested strategy note, submitted-secret scan with no secrets supplied, and 13 transcript checks that only the site can run against a sealed recording. The five submission checks cover public repository, ownership, creation date, pushed commit, and duplicate snapshots. They are not local failures. This command is a pre-submit audit; the competition has no local AI grading command.

Recording ID visible in the parent record log: **01a1ea3c-341e-7599-ac23-33f943bfe9f2**. The parent `record` wrapper remains active while this agent works and will seal when the wrapped session exits. Recording sealing and server-side transcript acceptance have not been verified in this session. No account, wallet, keypair, remote Git repository, push, or competition submission was created or used.

Remaining limits: no prolonged soak test, subjective audio listening, other browser engines, mobile controls, or server-side judging/transcript validation. The intended desktop Chromium story, free roam, save cycle and offline static package have been exercised.
