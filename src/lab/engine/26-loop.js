/* Drone Build Lab · Render loop */
import { $ } from './01-config.js';
import { camera, controls, renderer, scene } from './02-scene.js';
import { HOT } from './07-catalogue.js';
import { PADS, S, parts } from './08-state.js';
import { droneRoot, styleObj } from './09-scene-content.js';
import { stepTweens } from './11-tweens-camera.js';
import { SCR } from './13-screws.js';
import { stepFlight } from './19-flight.js';
import { stepMoves } from './28-movements.js';
import { stageKey } from './20-stages.js';
import { renderPanel } from './21-panel.js';
import { updateLabels } from './22-info-labels.js';

/* ================= Loop ================= */
export function resize(){ const r=$('#viewport').getBoundingClientRect(); if(!r.width||!r.height) return; renderer.setSize(r.width,r.height,false); camera.aspect=r.width/r.height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe($('#viewport'));
export let last=performance.now(), clockT=0, styleT=0;
export function loop(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; clockT+=dt;
  stepTweens(dt);
  const k=stageKey();
  if(k==='fly') stepFlight(dt);
  if(k==='moves') stepMoves(dt);
  for(let n=1;n<=4;n++){ const w=S.spin[n]; const m=parts['mot'+n]; if(m&&w) m.group.userData.rot.rotation.y+=w*dt; const p=parts['prop'+n]; if(p){ if(w) p.group.userData.spinner.rotation.y+=w*dt; p.group.userData.disc.material.opacity=Math.min(.2,Math.abs(w)/42*.2); } }
  const pulse=1.3+.14*Math.sin(clockT*4);
  HOT.forEach(h=>{ if(h.marker.visible) h.marker.scale.setScalar(S.drag&&S.drag.snap===h?1.8:pulse); });
  for(const s of Object.values(SCR)) if(s.marker.visible) s.marker.scale.setScalar(S.drag&&S.drag.hole===s.id?.95:.55+.08*Math.sin(clockT*4));
  if(k==='wire'&&S.mode==='learn'&&!S.drag){ const sc=1+.3*(.5+.5*Math.sin(clockT*5)); for(const p of Object.values(PADS)) if(p.need) p.vis.scale.setScalar(p.wired?1:sc); }
  if(S.dirty&&!S.drag){ S.dirty=false; renderPanel(); }
  if(S.cad){ styleT+=dt; if(styleT>.4){ styleT=0; styleObj(droneRoot); } }
  controls.update(); renderer.render(scene,camera); updateLabels();
  requestAnimationFrame(loop);
}
