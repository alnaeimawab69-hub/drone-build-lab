/* Drone Build Lab · Render loop */
'use strict';
/* ================= Loop ================= */
function resize(){ const r=$('#viewport').getBoundingClientRect(); if(!r.width||!r.height) return; renderer.setSize(r.width,r.height,false); camera.aspect=r.width/r.height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe($('#viewport'));
let last=performance.now(), clockT=0, styleT=0;
function loop(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; clockT+=dt;
  stepTweens(dt);
  const k=stageKey();
  if(k==='fly') stepFlight(dt);
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
