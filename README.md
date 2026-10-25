# Drone Build Lab

A WebGL digital lab where students build a quadcopter from bare carbon parts: frame, screws, components, wiring, motor test, propellers and flight physics.

Two drone models, chosen on the start screen:

- **Model 1 · LX-250 quadcopter** (default): 250 mm X frame, analog camera and VTX, 4S battery.
- **Model 2 · CX-5 cinematic FPV**: 5-inch deadcat frame (front arms swept out of the camera view), aluminium camera cage, clear side panels with an LED strip, HD camera and digital video unit, action camera on a TPU mount, 2306 motors, 6S battery.

Four activities: Practice, Assessment, Explore, and **Movements**, a 3D animation where two on-screen transmitter sticks (Mode 2) fly the drone so students learn throttle, yaw, pitch and roll, with a stick quiz at the end. Every part is modelled in code. There are no imported 3D models and no brand names.

Built with React 19, Vite and Three.js 0.147.

## Run it

Needs [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # development server with reload, http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve dist/ locally to check the build
```

`dist/` must be served over HTTP. Opening its HTML files by double-clicking does not work, because browsers block module scripts on `file://`.

Google Fonts load from the internet. Everything else is bundled.

## Pages

Each page is its own Vite entry, so the URLs stay the same.

| File | React component | Purpose |
|---|---|---|
| `index.html` | `src/pages/Home.jsx` | Home page: what the lab is, the seven stages, the activities |
| `lab.html` | `src/pages/Lab.jsx` | The lab itself |
| `guide.html` | `src/pages/Guide.jsx` | Teacher guide: outcomes, scoring, fastener, wiring and motor references |

## Project structure

```
DroneBuildLab/
├── index.html, lab.html, guide.html   page entries (head, fonts, #root)
├── vite.config.js                     multi-page build, relative base
├── vercel.json                        Vercel build settings
└── src/
    ├── entry-home.jsx, entry-lab.jsx, entry-guide.jsx   mount each page
    ├── pages/            Home, Lab and Guide components
    ├── components/       Logo, SiteHeader (shared by home and guide)
    ├── styles/
    │   ├── site.css      home and guide pages
    │   └── lab.css       the lab
    ├── assets/img/       screenshots used on the home page
    └── lab/engine/       the lab engine, plain ES modules
        ├── index.js                imports every module; importing it boots the lab
        ├── 01-config.js            helpers, drone conventions (front = -Z, motor numbering)
        ├── 02-scene.js             renderer, camera, orbit controls, lighting
        ├── 03-textures.js          canvas textures: carbon, mat, boards, labels
        ├── 04-materials.js         materials and wire colours
        ├── 05-geometry.js          geometry helpers, rounded boxes, twisted cables, pads
        ├── 06-builders.js          every part, built from code
        ├── 07-catalogue.js         part catalogue, hotspots, stages, scoring weights
        ├── 08-state.js             lab state
        ├── 09-scene-content.js     workbench, CAD view, markers, flight visuals
        ├── 10-thumbnails.js        tray thumbnails
        ├── 11-tweens-camera.js     animation and camera moves
        ├── 12-placement.js         placing parts, pads, 3D wires
        ├── 13-screws.js            screws, nuts, fastening
        ├── 14-markers-picking.js   hotspot markers, 3D picking
        ├── 15-input.js             mouse and touch input
        ├── 16-wiring-diagram.js    2D wiring diagram, wire validation and explanations
        ├── 17-scoring.js           mistakes and scores
        ├── 18-motor-test.js        motor direction test
        ├── 19-flight.js            flight physics
        ├── 20-stages.js            stage flow and actions
        ├── 21-panel.js             side panel for each stage, quiz
        ├── 22-info-labels.js       info card, part labels
        ├── 23-toast.js             messages
        ├── 24-start-report.js      start screen, report
        ├── 25-viewbar.js           view buttons
        ├── 26-loop.js              render loop
        ├── 27-boot.js              start-up
        └── 28-movements.js         Movements activity: sticks, axis rings, stick quiz
```

## How the lab page works

`Lab.jsx` renders the static layout (top bar, panel, canvas, view bar, overlay) once. Its effect then imports `src/lab/engine/index.js`, and the engine finds those elements by id and drives them directly. The engine starts once per page load. In development, any code change reloads the lab page instead of hot-swapping, because the engine holds the WebGL context.

Each engine module imports what it uses from the others and exports its top-level names. Modules may import each other in a cycle; that is fine for functions. A module's top-level code (outside functions) must only use values from modules that have already run. For example, `02-scene.js` does not import `15-input.js`; instead `15-input.js` fills in `canvasHooks.down`.

## Drone models

`MODELS` in `01-config.js` lists the models and their geometry (arm length and angles, arm thickness, plate size, battery size). The start screen reloads the page with `?model=lx250` or `?model=cx5` (the choice is also remembered in `localStorage`), so every module can read `MODEL` and `CINE` while it loads. Model 2 changes sit next to the model 1 code they replace, each behind `CINE`:

- parts: `06-builders.js` (cinematic builders at the end) and the `if(CINE)` block in `07-catalogue.js`
- wiring: FC pads in `buildFC`, `DG_SRC` in `16-wiring-diagram.js`, `WGROUPS` in `21-panel.js`
- quiz: model 2 adds three questions after `QUIZ`

## Conventions

- 1 scene unit = 1 cm. Front of the drone is −Z, right is +X, up is +Y.
- Motors: M1 rear right (CW), M2 front right (CCW), M3 rear left (CCW), M4 front left (CW).
- Wiring is checked by net: a wire end has a `need` (for example `R1`), a pad has a `net`. They must match.

## Common changes

- **Add a part:** write a `buildX()` function in `06-builders.js`, add it to `TYPES` and add a hotspot to `HOT` in `07-catalogue.js`.
- **Add screws to a part:** add an entry to `SCREW_SPEC` in `13-screws.js` (position, direction, screw kind).
- **Change scoring:** edit `SEC` in `07-catalogue.js` and the deductions passed to `mistake()`.
- **Edit quiz questions:** `QUIZ` in `21-panel.js`.
- **Edit the Movements activity:** `MOVES` (texts) and `stepMoves` (motion and motor mixing) in `28-movements.js`.
- **Edit the home or guide page:** `src/pages/Home.jsx` or `src/pages/Guide.jsx`.

## Hosting

- **Vercel:** `vercel.json` tells Vercel to run `npm run build` and publish `dist/`.
- **Any static host (GitHub Pages, Netlify, a school server):** run `npm run build` and upload the contents of `dist/`. The build uses relative paths, so it also works from a sub-folder such as `https://<user>.github.io/DroneBuildLab/`.
