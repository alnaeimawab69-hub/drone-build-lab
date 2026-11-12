/* Drone Build Lab · Animation tweens and camera moves */
import { MODEL, V, ease } from './01-config.js';
import { camera, controls } from './02-scene.js';

/* ================= Tweens & camera ================= */
export const TW=[];
export function tween(dur,fn,done,delay=0){ TW.push({t:-delay,dur,fn,done}); }
export function stepTweens(dt){ for(let i=TW.length-1;i>=0;i--){ const w=TW[i]; w.t+=dt; if(w.t<0) continue; const k=Math.min(1,w.t/w.dur); w.fn&&w.fn(k); if(k>=1){ TW.splice(i,1); w.done&&w.done(); } } }
export const CAM={frame:[V(17,15,21),V(0,1.5,.5)],mount:[V(17,15,21),V(0,1.8,.5)],wire:[V(7.5,11.5,11),V(0,2.6,1.2)],power:[V(13,11,17),V(0,2.6,0)],props:[V(17,16,20),V(0,1.5,0)],fly:[V(20,13,27),V(0,4,0)],quiz:[V(18,14,22),V(0,2,0)],moves:[V(19,21,43),V(0,5,0)],explore:[V(17,14,21),V(0,2.4,0)]};
/* a bigger model (model 3) is viewed from further away and looked at a little higher */
if(MODEL.view) for(const k in CAM){ const [p,t]=CAM[k]; t.y*=MODEL.view; p.sub(t).multiplyScalar(MODEL.view).add(t); }
export function camTo(pos,tgt,dur=1.1){ const p0=camera.position.clone(), t0=controls.target.clone(); tween(dur,k=>{ const e=ease(k); camera.position.lerpVectors(p0,pos,e); controls.target.lerpVectors(t0,tgt,e); }); }
