/* Drone Build Lab · Placing parts, pads and 3D wires */
import * as THREE from 'three';
import { SCALE, TAU, V, ZERO, armPos, ease, easeOut } from './01-config.js';
import { M, hex, wireColor, wireMat } from './04-materials.js';
import { HARNESS_COLS, PHASE_COLS, mesh, rod, strands } from './05-geometry.js';
import { HOT, HOTMAP, TYPES } from './07-catalogue.js';
import { PADS, S, WIRES, parts } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { tween } from './11-tweens-camera.js';
import { registerScrews, unregisterScrews } from './13-screws.js';
import { updateMarkers } from './14-markers-picking.js';
import { stageKey } from './20-stages.js';
import { removeLabel } from './22-info-labels.js';

/* ================= Placement ================= */
export function createPart(t){ const g=TYPES[t].build(); g.userData.typeKey=t; return g; }
export function exVec(p){
  const t=p.hot.type;
  if(t==='motor'||t==='prop'){ const d=armPos(p.hot.motor).normalize().multiplyScalar(2.2/SCALE); d.y=(t==='motor'?1:3.2)/SCALE; return d; }
  if(t==='panel') return V(Math.sign(p.hot.pos.x)*2.6,0,0);
  if(t==='gear') return V(Math.sign(p.hot.pos.x)*10,0,0);
  return TYPES[p.type].ex||ZERO;
}
export function layout(p){ p.group.position.copy(p.hot.pos).add(p.lift).addScaledVector(exVec(p),S.explode); p.group.position.y+=p.drop||0; }
export const reqs=h=>[].concat(h.requires||[]);
export function reqOk(h){ return reqs(h).every(r=>parts[r]); }
export function dependents(id){ return HOT.filter(h=>parts[h.id]&&reqs(h).includes(id)).map(h=>h.id); }
export function place(h,g,opts={}){
  g.userData.hotId=h.id; if(!g.parent) droneRoot.add(g); g.visible=true;
  const p={hot:h,group:g,type:g.userData.typeKey,lift:V(),drop:0}; parts[h.id]=p;
  g.rotation.set(h.rotX||0,h.rotY||0,0);
  if(h.type==='fc'){ S.fcRot=opts.fcRot!=null?opts.fcRot:1+Math.floor(Math.random()*3); g.rotation.y=S.fcRot*Math.PI/2; }
  registerPads(h.id,g); registerScrews(h.id,g);
  if(opts.animate){ p.drop=1.4; tween(.35,k=>{ p.drop=1.4*(1-easeOut(k)); layout(p); }); } else layout(p);
  if(h.type==='battery') updateBatCable();
  updateMarkers();
  return p;
}
export function unplace(id){ const p=parts[id]; unregisterPads(id); unregisterScrews(id); delete parts[id]; if(p.hot.type==='battery') updateBatCable(); updateMarkers(); removeLabel(id); return p.group; }
export function removeGroup(g){ if(g.parent) g.parent.remove(g); }
export function setFCRot(r,dur=.35){ const p=parts.fc; if(!p) return; const from=p.group.rotation.y; let to=r*Math.PI/2; while(to<from-1e-6) to+=TAU; S.fcRot=r; tween(dur,k=>{ p.group.rotation.y=from+(to-from)*ease(k); }); }

/* pads */
export function registerPads(hotId,g){
  const h=HOTMAP[hotId];
  (g.userData.pads||[]).forEach(pd=>{
    const id=hotId+':'+pd.def.key;
    const need=pd.def.need==='M?'?'M'+h.motor:pd.def.need;
    const label=pd.def.need==='M?'?'MOTOR '+h.motor:pd.def.label;
    pd.proxy.userData.padId=id;
    PADS[id]={id,hotId,def:pd.def,vis:pd.vis,proxy:pd.proxy,need,net:pd.def.net,label,wired:false,sprite:null};
  });
}
export function unregisterPads(hotId){ for(const id in PADS) if(PADS[id].hotId===hotId){ const s=PADS[id].sprite; if(s&&s.parent) s.parent.remove(s); delete PADS[id]; } }
export const srcPads=()=>Object.values(PADS).filter(p=>p.need);
export function padLocal(id){ const v=PADS[id].vis.getWorldPosition(V()); return droneRoot.worldToLocal(v); }
export function padName(p){ const t=HOTMAP[p.hotId].type; const nm=TYPES[t].name; return p.need?`${nm} · ${p.label} wire`:`${nm} · ${p.label} pad`; }
export function setPadMat(p,mat){ p.vis.traverse(o=>{ if(o.isMesh) o.material=mat||o.userData.m0; }); }
export function textSprite(text,col='#e9eef2',border='rgba(255,255,255,.18)',H=.26,bg='rgba(12,17,20,.88)'){
  const fs=44,pad=14, c=document.createElement('canvas'), g=c.getContext('2d');
  g.font=`600 ${fs}px "IBM Plex Mono", monospace`; const tw=g.measureText(text).width;
  c.width=Math.ceil(tw+pad*2); c.height=fs+pad;
  g.font=`600 ${fs}px "IBM Plex Mono", monospace`; g.fillStyle=bg; g.strokeStyle=border; g.lineWidth=3;
  const r=10,w=c.width,h=c.height; g.beginPath(); g.moveTo(r,1.5); g.lineTo(w-r,1.5); g.quadraticCurveTo(w-1.5,1.5,w-1.5,r); g.lineTo(w-1.5,h-r); g.quadraticCurveTo(w-1.5,h-1.5,w-r,h-1.5); g.lineTo(r,h-1.5); g.quadraticCurveTo(1.5,h-1.5,1.5,h-r); g.lineTo(1.5,r); g.quadraticCurveTo(1.5,1.5,r,1.5); g.fill(); g.stroke();
  g.fillStyle=col; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,w/2,h/2+2);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));
  s.scale.set(H*w/h,H,1); s.renderOrder=10; return s;
}
export function updatePadSprites(){
  const show=stageKey()==='wire';
  Object.values(PADS).forEach(p=>{
    if(show&&!p.sprite){
      p.sprite=p.need?textSprite(p.label,'#f2b98e',hex(wireColor(p.need,p.label)),.2):textSprite(p.label,'#e9eef2','rgba(255,255,255,.18)',.2);
      const o=(p.def.out||V(0,1,0)).clone().multiplyScalar(p.def.shape==='triple'?.5:.36);
      p.sprite.position.copy(p.def.pos).add(o).add(V(0,.2,0)); p.vis.parent.add(p.sprite);
    }
    if(p.sprite) p.sprite.visible=show&&!(p.need&&p.wired);
  });
}

/* wires */
export function wireCurve(a,b){ const d=a.distanceTo(b); const m=a.clone().lerp(b,.5); m.y+=Math.min(.2+d*.1,.9); return new THREE.CatmullRomCurve3([a,a.clone().add(V(0,.22,0)),m,b.clone().add(V(0,.22,0)),b]); }
export function buildWireMesh(w){
  if(w.mesh){ w.mesh.traverse(o=>o.geometry&&o.geometry.dispose()); droneRoot.remove(w.mesh); }
  const s=PADS[w.src], a=padLocal(w.src), b=padLocal(w.tgt), c=wireCurve(a,b), g=new THREE.Group();
  if(s.need[0]==='M') strands(c,3,.055,.068,5,PHASE_COLS).forEach(m=>g.add(m));
  else if(s.need==='ESC') strands(c,6,.026,0,0,HARNESS_COLS,true).forEach(m=>g.add(m));
  else {
    const r=s.need.startsWith('VBAT')?.085:.042;
    g.add(mesh(new THREE.TubeGeometry(c,48,r,10,false),wireMat(wireColor(s.need,s.label))));
    const tan=c.getTangentAt(1); g.add(rod(b.clone().addScaledVector(tan,-.16),b.clone(),r*.7,M.tin));
  }
  if(s.need!=='ESC'){ const bl=mesh(new THREE.SphereGeometry(s.need[0]==='M'?.17:s.need.startsWith('VBAT')?.16:.1,14,10),M.solder); bl.scale.y=.5; bl.position.copy(b); g.add(bl); }
  g.traverse(o=>{ if(o.isMesh) o.userData.noEdges=true; });
  w.mesh=g; droneRoot.add(g);
}
export function addWire(src,tgt){ droneRoot.updateMatrixWorld(true); const w={src,tgt,mesh:null}; WIRES.push(w); PADS[src].wired=true; if(PADS[src].sprite) PADS[src].sprite.visible=false; buildWireMesh(w); }
export let batCable=null;
export function updateBatCable(){
  if(batCable){ batCable.forEach(m=>{m.geometry.dispose(); droneRoot.remove(m);}); batCable=null; }
  if(!parts.bat||!parts.lead) return;
  droneRoot.updateMatrixWorld(true);
  const a=droneRoot.worldToLocal(parts.bat.group.userData.plug.getWorldPosition(V()));
  const b=droneRoot.worldToLocal(parts.lead.group.userData.socket.getWorldPosition(V()));
  const c=new THREE.CatmullRomCurve3([a.clone(),a.clone().add(V(0,.2,.9)),V((a.x+b.x)/2,(a.y+b.y)/2,Math.max(a.z,b.z)+1.0),b.clone().add(V(0,0,.7)),b.clone()]);
  batCable=strands(c,2,.085,.09,2.5,[0xd8453b,0x2b2f35]); batCable.forEach(m=>droneRoot.add(m));
}
export function rebuildWires(){ droneRoot.updateMatrixWorld(true); WIRES.forEach(buildWireMesh); updateBatCable(); }
