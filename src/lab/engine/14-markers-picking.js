/* Drone Build Lab · Hotspot markers and 3D picking */
import * as THREE from 'three';
import { EXP, V } from './01-config.js';
import { camera, canvas } from './02-scene.js';
import { HOT, HOTMAP, accepts, propDir } from './07-catalogue.js';
import { PADS, S, parts } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { reqOk } from './12-placement.js';
import { SCR, updateScrewMarkers } from './13-screws.js';
import { stageKey } from './20-stages.js';

/* ================= Markers ================= */
/* practice: a numbered badge rides on the arrow of the next step (part, battery slot, then screws) */
const badgeCv=document.createElement('canvas'); badgeCv.width=badgeCv.height=64;
const badgeTex=new THREE.CanvasTexture(badgeCv); badgeTex.encoding=THREE.sRGBEncoding;
const badge=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex,depthTest:false,transparent:true}));
badge.renderOrder=10; badge.userData.noStyle=true; badge.raycast=()=>{}; badge.visible=false;
let badgeN=0;
function showBadge(arrow,n,y,s){
  if(badge.parent!==arrow) arrow.add(badge);
  badge.position.set(0,y,0); badge.scale.setScalar(s); badge.visible=true;
  if(n===badgeN) return; badgeN=n;
  const g=badgeCv.getContext('2d'); g.clearRect(0,0,64,64);
  g.fillStyle='#e0894a'; g.beginPath(); g.arc(32,32,30,0,Math.PI*2); g.fill();
  g.fillStyle='#fff'; g.font='700 34px "IBM Plex Mono", monospace'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(n,32,34);
  badgeTex.needsUpdate=true;
}
export function updateMarkers(){
  const k=stageKey(), hold=S.drag&&S.drag.kind==='part'?S.drag.typeKey:null;
  const guide=S.mode==='learn'&&!S.explore&&!S.drag&&!S.loaded;
  const next=guide?HOT.find(h=>h.stage===k&&!parts[h.id]&&reqOk(h)):null;
  HOT.forEach(h=>{
    const show=!S.explore&&h.stage===k&&!parts[h.id]&&reqOk(h); h.marker.visible=show;
    /* the arrow tells where the held part goes, or in practice the next spot; practice also tells which motor a propeller belongs on */
    h.arrow.visible=show&&(hold?accepts(h,hold)&&(S.mode!=='learn'||h.type!=='prop'||propDir(hold)===EXP[h.motor]):h===next);
    if(!show) return;
    let c=S.cad?0x2c3a42:0xe3eaed,o=.8;
    if(hold&&S.mode==='learn'){ const ok=accepts(h,hold)&&(h.type!=='prop'||propDir(hold)===EXP[h.motor]); c=ok?0x5bc489:0x65777e; o=ok?1:.35; }
    if(S.drag&&S.drag.snap===h){ c=0xe0894a; o=1; }
    h.marker.material.color.setHex(c); h.marker.material.opacity=o;
  });
  updateScrewMarkers();
  const scr=guide&&!next?Object.values(SCR).find(s=>!s.driven&&HOTMAP[s.hotId].stage===k):null;
  if(scr) scr.arrow.visible=true;
  const done=HOT.filter(h=>h.stage===k&&parts[h.id]).length+Object.values(SCR).filter(s=>s.driven&&HOTMAP[s.hotId].stage===k).length;
  if(next) showBadge(next.arrow,done+1,2.1,1); else if(scr) showBadge(scr.arrow,done+1,1.15,.55); else badge.visible=false;
}

/* ================= Picking ================= */
export const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
export function setNDC(e){ const r=canvas.getBoundingClientRect(); ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(ndc,camera); }
export function insideCanvas(e){ const r=canvas.getBoundingClientRect(); return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; }
export function planePoint(through){ const n=camera.getWorldDirection(V()); const pl=new THREE.Plane().setFromNormalAndCoplanarPoint(n,through); const p=V(); return ray.ray.intersectPlane(pl,p)?p:through.clone(); }
export function screenOf(world){ const p=world.clone().project(camera); const r=canvas.getBoundingClientRect(); return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height,z:p.z}; }
export function pickPad(){ const list=Object.values(PADS).map(p=>p.proxy); const hit=ray.intersectObjects(list,false)[0]; return hit?hit.object.userData.padId:null; }
export function hotOf(o){ while(o&&o!==droneRoot){ if(o.userData.hotId) return o.userData.hotId; o=o.parent; } return null; }
export function pickPart(stage){ const list=Object.values(parts).filter(p=>p.hot.stage===stage).map(p=>p.group); const hit=ray.intersectObjects(list,true)[0]; return hit?hotOf(hit.object):null; }
/* a spot that takes the held part wins over a nearer one that does not (an arm dragged over the plate's edge holes) */
export function computeSnap(x,y,t){ let best=null,bd=150,fit=false; const k=stageKey();
  for(const h of HOT){ if(h.stage!==k||parts[h.id]||!reqOk(h)) continue; const s=screenOf(h.marker.getWorldPosition(V())); const d=Math.hypot(s.x-x,s.y-y), ok=!!t&&accepts(h,t);
    const R=ok&&h.type==='arm'?150:64;
    if(d<R&&(ok&&!fit||ok===fit&&d<bd)){bd=d;best=h;fit=ok;} }
  return best; }
