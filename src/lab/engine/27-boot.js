/* Drone Build Lab · Start-up */
import { TEX_MAKE, batTex, escTex, fcTex, frontTex, gpsTex, rxTex, vtxTex } from './03-textures.js';
import { $, CINE, MODEL } from './01-config.js';
import { makeThumbs } from './10-thumbnails.js';
import { renderAll } from './21-panel.js';
import { showStart } from './24-start-report.js';
import { loop, resize } from './26-loop.js';

/* ================= Boot ================= */
(async function init(){
  try{ await Promise.race([Promise.all(['600 30px "IBM Plex Mono"','700 40px "Barlow Semi Condensed"','500 20px "IBM Plex Mono"'].map(f=>document.fonts.load(f))),new Promise(r=>setTimeout(r,2500))]); }catch(e){}
  /* the page shell is shared by both models; fill in the model's names */
  document.title=`Drone Build Lab · ${MODEL.title}`;
  const sm=$('.brand small'); if(sm) sm.textContent='Digital lab · '+MODEL.tag;
  const tb=$('#tblock b'); if(tb) tb.textContent=MODEL.name+(CINE?' CINEMATIC FPV':' QUADCOPTER');
  rebuildTextures();
  resize();
  makeThumbs();
  renderAll();
  showStart();
  requestAnimationFrame(loop);
})();
/* the board textures were drawn before the web fonts loaded; redraw them once fonts are ready */
export function rebuildTextures(){
  const redo=(tex,fresh)=>{ tex.image=fresh.image; tex.needsUpdate=true; };
  [[escTex,'esc'],[fcTex,'fc'],[vtxTex,'vtx'],[rxTex,'rx'],[gpsTex,'gps'],[batTex,'bat'],[frontTex,'front']].forEach(([t,k])=>redo(t,TEX_MAKE[k]()));
}
