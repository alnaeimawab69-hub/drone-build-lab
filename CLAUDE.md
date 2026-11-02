# Drone Build Lab

WebGL lab where students build a quadcopter from parts, wire it, test motors and fly it. React 19 + Vite + Three.js 0.147.

- Pages: `index.html`, `lab.html`, `guide.html`, each with an entry in `src/entry-*.jsx` and a page in `src/pages/`.
- The 3D lab itself is the ES modules in `src/lab/engine/`, imported in numeric order by `src/lab/engine/index.js` (`01-config.js` … `31-fault-finding.js`). Keep that order; new lab code goes in the file whose number matches its stage, or a new numbered file added to `index.js` in number order.
- `js/lab/` is an old copy that nothing loads (and `.vercelignore` excludes it). Don't edit it.
- Run: `npm run dev`. Build: `npm run build` (output `dist/`, deployed on Vercel).

## Rules
- Every part is modelled in code: no imported 3D models, no brand names.
- Keep Three.js on 0.147 unless the task is the upgrade itself.
- Changes must work for all three drone models and both motor directions (props in / props out).
- `npm run build` must pass before you finish.
- Two remotes: `origin` is this project; `flightlab` is someone else's repo. Never push to `flightlab`.

## Agents
- `feature-builder`: adds features and improves the lab end to end.
