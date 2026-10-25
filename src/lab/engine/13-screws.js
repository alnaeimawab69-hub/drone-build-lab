/* Drone Build Lab · Screws, nuts and fastening */
import * as THREE from 'three';
import { CINE, MODEL, TAU, V, easeOut } from './01-config.js';
import { ringTex } from './03-textures.js';
import { M, std } from './04-materials.js';
import { PROXY_GEO, PROXY_MAT, cyl } from './05-geometry.js';
import { HOTMAP, NYL_POS, TYPES } from './07-catalogue.js';
import { S } from './08-state.js';
import { tween } from './11-tweens-camera.js';
import { insideCanvas, ray, setNDC } from './14-markers-picking.js';
import { showTip } from './15-input.js';
import { mistake, secOf } from './17-scoring.js';
import { stageKey } from './20-stages.js';
import { renderPanel } from './21-panel.js';
import { toast } from './23-toast.js';

/* ================= Screws & nuts ================= */
export const SCREWT={
  M3x10:{name:'M3 × 10 mm screw',r:.14,head:.27,L:1.0},
  M3x6:{name:'M3 × 6 mm screw',r:.14,head:.27,L:.6},
  M2x5:{name:'M2 × 5 mm screw',r:.1,head:.19,L:.5},
  nut:{name:'M3 nylon nut'},
};
export const M_SCREW=std({color:0x2a2d31,roughness:.35,metalness:.85});
export function buildScrew(k){
  const g=new THREE.Group(), t=SCREWT[k];
  if(k==='nut'){ const n=cyl(.3,.3,.26,M.nylon,6); n.position.y=.13; g.add(n); const h=cyl(.14,.14,.27,M.black,12); h.position.y=.13; g.add(h); return g; }
  const hd=cyl(t.head,t.head,t.head*.9,M_SCREW,20); hd.position.y=t.head*.45; g.add(hd);
  const rc=cyl(t.head*.42,t.head*.42,.03,M.black,6); rc.position.y=t.head*.9+.005; g.add(rc);
  const sh=cyl(t.r,t.r,t.L,M.steel,12); sh.position.y=-t.L/2; g.add(sh);
  return g;
}
Object.keys(SCREWT).forEach(k=>SCREWT[k].build=()=>buildScrew(k));
export const SCREW_SPEC={
  arm:[[1.2,MODEL.armT,0],[3.2,MODEL.armT,0]].map(p=>({p,out:[0,1,0],kind:'M3x10'})),
  tplate:[-4,0,4.2].flatMap(z=>[-MODEL.alu,MODEL.alu].map(x=>({p:[x,CINE?.25:.22,z],out:[0,1,0],kind:'M3x6'}))),
  motor:[[.57,.57],[.57,-.57],[-.57,.57],[-.57,-.57]].map(([x,z])=>({p:[x,-MODEL.armT,z],out:[0,-1,0],kind:'M3x6'})),
  fc:NYL_POS.map(([x,z])=>({p:[x,.16,z],out:[0,1,0],kind:'nut'})),
  camera:[-1,1].map(s=>({p:[s*(CINE?1.27:1.21),0,0],out:[s,0,0],kind:'M2x5'})),
};
export const SCR={};
export function registerScrews(hotId,g){
  (SCREW_SPEC[HOTMAP[hotId].type]||[]).forEach((spec,i)=>{
    const id=hotId+'#'+i, pos=V(...spec.p);
    const proxy=new THREE.Mesh(PROXY_GEO,PROXY_MAT); proxy.position.copy(pos); proxy.userData.screwId=id; g.add(proxy);
    const mk=new THREE.Sprite(new THREE.SpriteMaterial({map:ringTex,depthTest:false,transparent:true})); mk.scale.setScalar(.6); mk.renderOrder=9; mk.position.copy(pos).addScaledVector(V(...spec.out),.05); g.add(mk);
    SCR[id]={id,hotId,spec,g,proxy,marker:mk,driven:false,mesh:null};
  });
}
export function unregisterScrews(hotId){ for(const id in SCR) if(SCR[id].hotId===hotId){ const s=SCR[id]; [s.proxy,s.marker,s.mesh].forEach(o=>o&&o.parent&&o.parent.remove(o)); delete SCR[id]; } }
export const stageScrews=k=>Object.values(SCR).filter(s=>HOTMAP[s.hotId].stage===k);
export function drive(id,anim){
  const s=SCR[id]; s.driven=true; s.marker.visible=false;
  const m=buildScrew(s.spec.kind), out=V(...s.spec.out), base=V(...s.spec.p), qa=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),out), qs=new THREE.Quaternion();
  m.quaternion.copy(qa); s.g.add(m); s.mesh=m;
  if(anim){ m.position.copy(base).addScaledVector(out,1.1); tween(.6,k=>{ const e=easeOut(k); m.position.copy(base).addScaledVector(out,(1-e)*1.1); m.quaternion.copy(qa).multiply(qs.setFromAxisAngle(V(0,1,0),-e*TAU*3)); }); }
  else m.position.copy(base);
}
export function screwMsg(need,got,owner){
  if(owner==='motor'&&got==='M3x10') return 'Too long. An M3 × 10 screw goes through the arm and into the copper windings under the motor base, and can short the motor. Motor screws must be short: M3 × 6.';
  if(need==='M3x10'&&got==='M3x6') return 'Too short. The arm screw must pass through the arm and the bottom plate and still grip. Use M3 × 10.';
  if(need==='M3x6'&&got==='M3x10') return 'Too long. In a standoff a 10 mm screw bottoms out before it clamps the plate. Use M3 × 6.';
  if(need==='nut') return 'The stack is clamped with M3 nylon nuts on top of the stack standoffs. Nylon cannot short the boards.';
  if(got==='nut') return 'A nut needs a bolt or standoff to thread onto. This hole needs a screw.';
  if(need==='M2x5') return 'The camera mounting holes are M2. An M3 screw is too thick to fit.';
  if(got==='M2x5') return 'M2 is too thin for this M3 hole. It will not grip.';
  return 'Wrong fastener for this hole.';
}
export function tryDrive(id,kind){
  const s=SCR[id]; if(!s||s.driven) return;
  if(!kind){ toast('Choose a screw or nut from the fastener bin first.'); return; }
  if(kind!==s.spec.kind){ mistake(secOf(),2,screwMsg(s.spec.kind,kind,HOTMAP[s.hotId].type),'Wrong fastener for this hole.'); return; }
  drive(id,true);
  const left=stageScrews(stageKey()).filter(x=>!x.driven).length;
  toast(`${SCREWT[kind].name} fitted to the ${TYPES[HOTMAP[s.hotId].type].name.toLowerCase()}.${left?'':' Every fastener in this stage is tight.'}`,'ok');
  renderPanel();
}
export function autoScrews(k,anim){ stageScrews(k).filter(s=>!s.driven).forEach((s,i)=>{ const go=()=>{ if(SCR[s.id]&&!s.driven){ drive(s.id,anim); if(anim) renderPanel(); } }; anim?tween(.01,null,go,i*.06):go(); }); }
export function pickHole(){ const k=stageKey(); const list=Object.values(SCR).filter(s=>!s.driven&&HOTMAP[s.hotId].stage===k).map(s=>s.proxy); const hit=ray.intersectObjects(list,false)[0]; return hit?hit.object.userData.screwId:null; }
export function updateScrewMarkers(){
  const k=stageKey(), hold=S.loaded;
  Object.values(SCR).forEach(s=>{
    const show=!S.explore&&!s.driven&&HOTMAP[s.hotId].stage===k&&!(S.drag&&S.drag.kind==='part'); s.marker.visible=show; if(!show) return;
    let c=S.cad?0x2c3a42:0xe3eaed,o=.9;
    if(S.mode==='learn'&&hold){ const ok=hold===s.spec.kind; c=ok?0x5bc489:0x65777e; o=ok?1:.35; }
    if(S.drag&&S.drag.kind==='screw'&&S.drag.hole===s.id){ c=0xe0894a; o=1; }
    s.marker.material.color.setHex(c); s.marker.material.opacity=o;
  });
}
export function moveScrewDrag(e){
  const d=S.drag; d.hole=null;
  if(insideCanvas(e)){ document.body.classList.add('dragging'); setNDC(e); d.hole=pickHole(); }
  updateScrewMarkers(); showTip(SCREWT[d.screw].name+(d.hole?' → hole':''),e.clientX,e.clientY);
}
export function endScrewDrag(e,cancel){
  const {hole,screw}=S.drag; S.drag=null; document.body.classList.remove('dragging'); showTip(null);
  if(!cancel&&hole) tryDrive(hole,screw); else renderPanel();
  updateScrewMarkers();
}
