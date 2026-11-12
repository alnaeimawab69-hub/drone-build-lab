/* Drone Build Lab · Placing parts, pads and 3D wires */
import * as THREE from 'three';
import { EX, SCALE, TAU, V, ZERO, armPos, ease, easeOut } from './01-config.js';
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
import { tr } from '../../lang.js';

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
  const cable=h.type==='battery'||h.type==='lead';
  if(opts.animate){ p.drop=1.4; tween(.35,k=>{ p.drop=1.4*(1-easeOut(k)); layout(p); if(cable) updateBatCable(); }); } else layout(p);
  if(cable) updateBatCable();
  updateMarkers();
  return p;
}
export function unplace(id){ const p=parts[id]; unregisterPads(id); unregisterScrews(id); delete parts[id]; if(p.hot.type==='battery'||p.hot.type==='lead') updateBatCable(); updateMarkers(); removeLabel(id); return p.group; }
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
export function padName(p){ const t=HOTMAP[p.hotId].type; const nm=TYPES[t].name; return p.need?tr(`${nm} · ${p.label} wire`,`${nm} · wayar ${p.label}`):tr(`${nm} · ${p.label} pad`,`${nm} · pad ${p.label}`); }
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
      const H=EX?1.1:.2;   // model 3 is built in centimetres and drawn small, so its labels are bigger
      p.sprite=p.need?textSprite(p.label,'#f2b98e',hex(wireColor(p.need,p.label)),H):textSprite(p.label,'#e9eef2','rgba(255,255,255,.18)',H);
      const o=(p.def.out||V(0,1,0)).clone().multiplyScalar(p.def.shape==='triple'?.5:.36);
      p.sprite.position.copy(p.def.pos).add(o).add(V(0,.2,0)); p.vis.parent.add(p.sprite);
    }
    if(p.sprite) p.sprite.visible=show&&!(p.need&&p.wired);
  });
}

/* wires */
export function wireCurve(a,b){ const d=a.distanceTo(b); const m=a.clone().lerp(b,.5); m.y+=Math.min(.2+d*.1,.9); return new THREE.CatmullRomCurve3([a,a.clone().add(V(0,.22,0)),m,b.clone().add(V(0,.22,0)),b]); }
/* tidy wiring, like a hand-built drone: each wire leaves its pad along the pad's edge direction, drops to the board,
   runs low along it and comes up into the other pad. Wires off a pad facing up run high first, then drop beside the other end */
export function padDir(id){ const p=PADS[id], par=p.vis.parent, o=p.def.out||V(0,1,0);
  const a=droneRoot.worldToLocal(par.localToWorld(p.def.pos.clone())), b=droneRoot.worldToLocal(par.localToWorld(p.def.pos.clone().add(o)));
  return b.sub(a).normalize(); }
export function routeCurve(a,b,da,db){
  const up=d=>d.y>.7, flat=(d,k)=>V(d.x,0,d.z).normalize().multiplyScalar(k);
  const [hi,lo,dh,dl]=a.y>=b.y?[a,b,da,db]:[b,a,db,da], H=lo.y+.2;   // run just above the lower end
  const near=up(dl)?lo.clone():lo.clone().add(flat(dl,.45)), pts=[hi.clone()];
  if(up(dh)){ const top=hi.y+.22; pts.push(hi.clone().setY(top), V(near.x,top,near.z), V(near.x,H,near.z)); }
  else { const o=hi.clone().add(flat(dh,.5)); pts.push(o.clone().setY(hi.y+.05), o.clone().setY(H), V(near.x,H,near.z)); }
  pts.push(up(dl)?lo.clone().setY(lo.y+.18):lo.clone().add(flat(dl,.15)).setY(lo.y+.06), lo.clone());
  const out=pts.filter((p,i)=>i===0||p.distanceTo(pts[i-1])>.04);   // drop repeats so the spline stays smooth
  if(hi!==a) out.reverse();
  return new THREE.CatmullRomCurve3(out,false,'centripetal');
}
/* a part's wires can share a planned path (via points on its hotspot): they leave the part together, run side by side as a flat bundle
   clear of the other parts, and fan out to their pads at the end. lane is the sideways step between neighbouring wires */
export function viaCurve(a,b,db,h,k){
  const up=db.y>.7, f=V(db.x,0,db.z).normalize(), off=V(...h.lane).multiplyScalar(k);
  const last=h.via.length-1, endOff=h.laneEnd?V(...h.laneEnd).multiplyScalar(k):V();   // laneEnd: extra spread at the last via only, so the wires fan out toward their own pads
  const pts=[a, a.clone().add(V(0,.2,0)), ...h.via.map((p,i)=>V(...p).add(off).add(i===last?endOff:V()))];
  if(up) pts.push(b.clone().setY(b.y+.3)); else pts.push(b.clone().addScaledVector(f,.45).setY(b.y+.2), b.clone().addScaledVector(f,.15).setY(b.y+.06));
  pts.push(b);
  return new THREE.CatmullRomCurve3(pts,false,'centripetal');
}
export function buildWireMesh(w){
  if(w.mesh){ w.mesh.traverse(o=>o.geometry&&o.geometry.dispose()); droneRoot.remove(w.mesh); }
  const s=PADS[w.src], a=padLocal(w.src), b=padLocal(w.tgt), g=new THREE.Group();
  const h=HOTMAP[s.hotId], mine=h.via?srcPads().filter(p=>p.hotId===s.hotId):[];
  const c=s.need==='ESC'?wireCurve(a,b)                       // the harness keeps its short loop over the board edge
    :h.via?viaCurve(a,b,padDir(w.tgt),h,h.order?h.order.indexOf(s.def.key)-(h.order.length-1)/2:mine.indexOf(s)-(mine.length-1)/2)   // order: lane order by pad key, matched to where each wire ends so the fan does not cross
    :routeCurve(a,b,padDir(w.src),padDir(w.tgt));
  const t=PADS[w.tgt], fan=s.need[0]==='M'&&s.def.shape==='bundle'&&t.def.shape==='triple';
  if(EX){
    /* model 3: one round cable with a moulded plug at the port */
    const d=a.distanceTo(b), m=a.clone().lerp(b,.5); m.y+=Math.min(2+d*.12,7);
    const c2=new THREE.CatmullRomCurve3([a,a.clone().add(V(0,1.5,0)),m,b.clone().add(V(0,1.5,0)),b]);
    g.add(mesh(new THREE.TubeGeometry(c2,48,.3,10,false),wireMat(0x2b2f35)));
    const pl=mesh(new THREE.BoxGeometry(1.4,.9,1.1),M.nylon); pl.position.copy(b).add(V(0,.45,0)); g.add(pl);
  }
  else if(fan){
    /* three phase wires, each from its tinned end to its own pad (paired in order, so they run side by side without crossing) */
    const L=o=>droneRoot.worldToLocal(o.getWorldPosition(V())), pins=t.vis.children.map(L), ax=pins[2].clone().sub(pins[0]);
    const ends=s.vis.children.map(L).sort((p,q)=>p.dot(ax)-q.dot(ax));
    ends.forEach((e,k)=>{ g.add(mesh(new THREE.TubeGeometry(routeCurve(e,pins[k],V(0,1,0),padDir(w.tgt)),40,.05,8,false),wireMat(PHASE_COLS[k])));
      const bl=mesh(new THREE.SphereGeometry(.1,12,8),M.solder); bl.scale.y=.5; bl.position.copy(pins[k]); g.add(bl); });
  }
  else if(s.need[0]==='M') strands(c,3,.055,.068,5,PHASE_COLS).forEach(m=>g.add(m));
  else if(s.need==='ESC') strands(c,HARNESS_COLS.length,.026,0,0,HARNESS_COLS,true).forEach(m=>g.add(m));
  else {
    const r=s.need.startsWith('VBAT')?.085:.042;
    g.add(mesh(new THREE.TubeGeometry(c,48,r,10,false),wireMat(wireColor(s.need,s.label))));
    const tan=c.getTangentAt(1); g.add(rod(b.clone().addScaledVector(tan,-.16),b.clone(),r*.7,M.tin));
  }
  if(!EX&&s.need!=='ESC'&&!fan){ const bl=mesh(new THREE.SphereGeometry(s.need[0]==='M'?.17:s.need.startsWith('VBAT')?.16:.1,14,10),M.solder); bl.scale.y=.5; bl.position.copy(b); g.add(bl); }
  g.traverse(o=>{ if(o.isMesh) o.userData.noEdges=true; });
  w.mesh=g; droneRoot.add(g);
}
export function removeWire(src){
  const i=WIRES.findIndex(w=>w.src===src); if(i<0) return false;
  const w=WIRES[i]; if(w.mesh){ w.mesh.traverse(o=>o.geometry&&o.geometry.dispose()); droneRoot.remove(w.mesh); }
  WIRES.splice(i,1); if(PADS[src]) PADS[src].wired=false; updatePadSprites(); return true;
}
export function addWire(src,tgt){ droneRoot.updateMatrixWorld(true); const w={src,tgt,mesh:null}; WIRES.push(w); PADS[src].wired=true; if(PADS[src].sprite) PADS[src].sprite.visible=false; buildWireMesh(w); }
export let batCable=null;
export function updateBatCable(){
  if(batCable){ batCable.forEach(m=>{m.geometry.dispose(); droneRoot.remove(m);}); batCable=null; }
  if(!parts.bat||!parts.lead) return;
  droneRoot.updateMatrixWorld(true);
  const a=droneRoot.worldToLocal(parts.bat.group.userData.plug.getWorldPosition(V()));
  const sock=droneRoot.worldToLocal(parts.lead.group.userData.socket.getWorldPosition(V()));
  /* plugged: pushed fully home, the two bodies touch with no seam. Unplugged: the plug hangs loose, clearly apart, below and behind the lead */
  const b=S.unplugged?sock.clone().add(V(0,-.9,.9)):sock.clone().add(V(0,0,-.04));
  /* the battery's own plug mates with the connector on the battery lead, so the cable ends in a second connector body.
     A short, tight bend from the battery down to the back of that plug, like a real battery pigtail */
  const c=new THREE.CatmullRomCurve3([a.clone(),a.clone().add(V(0,-.05,.45)),V((a.x+b.x)/2,(a.y+b.y)/2+.2,b.z+1.45),b.clone().add(V(0,0,1.2)),b.clone().add(V(0,0,.8))]);
  batCable=strands(c,2,.1,.11,2.5,[0xd8453b,0x2b2f35]);
  const plug=mesh(new THREE.BoxGeometry(.86,.52,.8),M.connector); plug.position.copy(b).add(V(0,0,.4)); batCable.push(plug);
  batCable.forEach(m=>droneRoot.add(m));
}
export function rebuildWires(){ droneRoot.updateMatrixWorld(true); WIRES.forEach(buildWireMesh); updateBatCable(); }
