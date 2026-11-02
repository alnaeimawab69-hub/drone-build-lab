/* Drone Build Lab · 3D wire routing
   Every wire follows the path a builder would use, so no wire passes through a board, standoff or part:
   - motor wires run along the top of their arm, then climb to the motor pads on the side of the ESC
   - battery lead and capacitor wires come up to the battery pads at the back of the ESC
   - wires for the flight controller travel round the stack between the two boards, on a "ring" just outside
     the FC, then climb to their pad at the board edge and drop onto it
   - the GPS wires drop from the GPS through the cable hole in the top plate
   Each part has its own height between the boards so bundles from different parts do not cross, and inside a
   bundle the wire that travels furthest runs lowest, so it passes under the others where they climb to their pads.
   All points are in droneRoot space; the same routes drive the soldered wires, the wire being placed and the
   red "wrong pad" ghost. */
import * as THREE from 'three';
import { ARM, MODEL, V, armPos, clamp } from './01-config.js';
import { CABLE_HOLE, PLATE_T } from './06-builders.js';
import { HOTMAP } from './07-catalogue.js';
import { PADS, WIRES, parts } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { wireColor as _wireColor } from './04-materials.js';
import { tween as _tween } from './11-tweens-camera.js';
import { labelTexture as _labelTex } from './12-placement.js';

export const RING=1.98;                        // half-size of the ring round the stack: outside the 36 mm FC (1.8), inside the frame standoffs
const UP=V(0,1,0), _q=new THREE.Quaternion(), _r=new THREE.Quaternion();

/* pad position and outward direction, both in droneRoot space */
export function padFrame(id){
  const p=PADS[id]; p.vis.updateWorldMatrix(true,false);
  const pos=droneRoot.worldToLocal(p.vis.getWorldPosition(V()));
  p.vis.parent.getWorldQuaternion(_q); droneRoot.getWorldQuaternion(_r); _r.invert();
  const out=(p.def.out||UP).clone().applyQuaternion(_q).applyQuaternion(_r).normalize();
  return {pos,out};
}
/* where the boards are right now (the FC lifts during wiring, and Explore can pull the stack apart) */
export function stackInfo(){
  const e=parts.esc&&parts.esc.group.position, f=parts.fc&&parts.fc.group.position;
  const escTop=(e?e.y:1)+.18, fcBot=f?f.y:2.05;
  const tp=parts.tplate?parts.tplate.group.position.y:3.4;
  /* bundles travel on the ring, which is outside the FC, so they may run above the FC as well as below it:
     anywhere from just over the ESC to just under the top plate */
  const lo=escTop+.12, hi=Math.min(tp-.1,fcBot+.16+.25);
  return {cx:f?f.x:0,cz:f?f.z:0,escTop,fcBot,fcTop:fcBot+.16,lo,hi,gap:Math.max(.5,fcBot-escTop)};
}
/* height of each part's bundle on the ring, as a fraction of the band from just over the ESC to just under the top plate.
   The VTX runs lowest (over the battery wires, under the receiver's climbs), then the receiver, then the GPS */
const TIER={vtx:.29,rx:.6,camera:.5,led:.5,gps:.9};
const typeOf=pad=>HOTMAP[pad.hotId].type;

/* ---- ring round the stack: a square, walked front → right → rear → left ---- */
function ringT(x,z,R){
  const ax=Math.abs(x), az=Math.abs(z);
  if(az>=ax) return z<0?clamp(x,-R,R)+R:5*R-clamp(x,-R,R);
  return x>0?3*R+clamp(z,-R,R):7*R-clamp(z,-R,R);
}
function ringXZ(t,R){ const L=8*R; t=((t%L)+L)%L; if(t<2*R) return [t-R,-R]; if(t<4*R) return [R,t-3*R]; if(t<6*R) return [5*R-t,R]; return [-R,7*R-t]; }
function ringSpan(t0,t1,R){ const L=8*R; let d=((t1-t0)%L+L)%L; if(d>L/2) d-=L; return d; }
/* the corners passed going the short way round from t0 to t1 */
function ringCorners(t0,t1,R){
  const d=ringSpan(t0,t1,R), s=Math.sign(d), L=8*R, out=[];
  for(let k=-1;k<=2;k++) for(const c of [0,2*R,4*R,6*R]){ const cc=c+k*L; if(s>0?cc>t0+1e-4&&cc<t0+d-1e-4:cc<t0-1e-4&&cc>t0+d+1e-4) out.push(cc); }
  return out.sort((a,b)=>s*(a-b)).map(c=>ringXZ(c,R));
}

/* ---- source side: from the wire end to the point where it joins the stack ---- */
function sourceLeg(s,A,st){
  const P=A.pos, o=A.out, t=typeOf(s);
  if(t==='motor'){
    /* along the top of the arm toward the centre, beside the arm screws rather than over them. On the rear arms
       the wire keeps to the front edge of the arm, clear of the capacitor and the receiver */
    const n=HOTMAP[s.hotId].motor, y=MODEL.armT+.14, r0=ARM-7.6, d=armPos(n,1);
    const side=V(d.z,0,-d.x).normalize().multiplyScalar(.45);
    if(d.z>.2?side.z>0:side.z<0) side.negate();
    const a=armPos(n,r0-.35).setY(y).add(side), b=armPos(n,Math.min(r0-.8,3.3)).setY(y).add(side);
    return {pts:[P,a,b],ring:false};
  }
  if(t==='cap'){
    /* the legs point forward under the ESC edge: out past the board edge, up beside the capacitor, then back along
       the gap between the stack standoff and the capacitor body. The two legs take separate lanes */
    const lane=s.need==='VBAT+'?0:1, x=2.12+lane*.12, z=P.z-lane*.18, y=st.escTop+.34+lane*.12;
    return {pts:[P,V(x,.9,z),V(x,y,z),V(x-.2,y,1.82)],ring:false,y,z:1.82};
  }
  if(t==='lead') return {pts:[P,P.clone().setY(st.escTop+.08)],ring:false};
  if(t==='esc') return {pts:[P,P.clone().add(V(0,.2,0)),V(P.x,P.y+.3,-1.88)],ring:false,harness:true};
  if(t==='gps'){
    /* forward off the plug, across to the cable hole, down through the top plate */
    const tp=parts.tplate?parts.tplate.group.position:V(0,3.4,0), i=srcIndex(s), li=(i-1.5)*.075;
    const hx=tp.x+CABLE_HOLE.x+li, hz=tp.z+CABLE_HOLE.z, top=tp.y+PLATE_T;
    const p1=P.clone().addScaledVector(o,.28).add(V(0,.1,0));
    return {pts:[P,p1,V(hx,p1.y,hz-.1),V(hx,top+.3,hz),V(hx,tp.y-.28,hz)],ring:true};
  }
  /* camera, VTX, receiver, LED strip: off the pads along their facing, then up or down to the bundle height */
  if(t==='vtx'){
    /* the VTX sits just behind the battery pads: its wires rise behind the battery wires, and inboard of the
       battery lead's own cable, which runs over the VTX */
    const v=parts.vtx?parts.vtx.group.position:V(), p1=V(v.x+clamp(P.x-v.x,-.6,.6),P.y+.05,v.z-(MODEL.key==='cx5'?1.05:.95));
    return {pts:[P,p1],ring:true,riser:true};
  }
  const p1=P.clone().addScaledVector(o,.24);
  return {pts:[P,p1],ring:true,riser:true};
}
function srcIndex(s){ return Object.values(PADS).filter(q=>q.hotId===s.hotId&&q.need).indexOf(s); }

/* ---- target side: from the point where the wire leaves the stack to the pad ---- */
function targetLeg(t,B,st){
  const P=B.pos, o=B.out, h=HOTMAP[t.hotId];
  if(h&&h.type==='fc'){
    if(t.net==='ESC') return {pts:[V(P.x,st.fcTop+.3,-1.88),V(P.x,P.y+.32,P.z-.3),P.clone().add(V(0,.14,0)),P],ring:false,harness:true};
    const lx=P.x-st.cx, lz=P.z-st.cz;
    const rx=Math.abs(o.x)>.5?Math.sign(o.x)*RING:clamp(lx,-RING,RING), rz=Math.abs(o.z)>.5?Math.sign(o.z)*RING:clamp(lz,-RING,RING);
    return {pts:[V(st.cx+rx,P.y+.18,st.cz+rz),P.clone().addScaledVector(o,.13).add(V(0,.07,0)),P],ring:true,rt:ringT(rx,rz,RING)};
  }
  if(h&&h.type==='esc'){
    if(t.net==='VBAT+'||t.net==='VBAT-') return {pts:[V(P.x,st.escTop+.14,P.z+.36),P.clone().add(V(0,.06,.12)),P],ring:false};
    return {pts:[P.clone().addScaledVector(o,.5).setY(st.escTop+.14),P.clone().addScaledVector(o,.15).add(V(0,.06,0)),P],ring:false};
  }
  return {pts:[P.clone().addScaledVector(o,.3),P],ring:false};
}

/* bundle height of a wire: its part's band, then lower for wires that travel further round the ring */
function laneY(s,st,tgtId){
  const t=typeOf(s), f=TIER[t]??.5, step=.09;
  const mine=Object.values(PADS).filter(q=>q.hotId===s.hotId&&q.need);
  const goes=mine.map(q=>{ const w=q.id===s.id?tgtId:(WIRES.find(w=>w.src===q.id)||{}).tgt; return w&&PADS[w]?{q,d:travel(q,w,st)}:null; }).filter(Boolean);
  goes.sort((a,b)=>b.d-a.d||(a.q.id<b.q.id?-1:1));
  const rank=Math.max(0,goes.findIndex(g=>g.q.id===s.id)), n=Math.max(mine.length,1);
  return st.lo+(st.hi-st.lo)*f+(rank-(n-1)/2)*step;
}
function travel(s,tgtId,st){
  const A=padFrame(s.id), B=padFrame(tgtId), sl=sourceLeg(s,A,st), tl=targetLeg(PADS[tgtId],B,st);
  if(!sl.ring||!tl.ring) return 0;
  const e=sl.pts[sl.pts.length-1]; return Math.abs(ringSpan(ringT(e.x-st.cx,e.z-st.cz,RING),tl.rt,RING));
}

/* the full route as a polyline */
export function wireRoute(srcId,tgtId){
  const s=PADS[srcId], t=PADS[tgtId], st=stackInfo();
  const A=padFrame(srcId), B=padFrame(tgtId), sl=sourceLeg(s,A,st), tl=targetLeg(t,B,st);
  const pts=[...sl.pts];
  if(tl.ring){
    /* join the ring at the bundle height, walk round it, climb at the pad's edge */
    const y=sl.ring?laneY(s,st,tgtId):st.lo+(st.hi-st.lo)*.5, e=pts[pts.length-1];
    const t0=ringT(e.x-st.cx,e.z-st.cz,RING), [x0,z0]=ringXZ(t0,RING);
    if(sl.riser) pts.push(e.clone().setY(y));
    pts.push(V(st.cx+x0,y,st.cz+z0));
    ringCorners(t0,tl.rt,RING).forEach(([x,z])=>pts.push(V(st.cx+x,y,st.cz+z)));
    const c=tl.pts[0]; pts.push(V(c.x,y,c.z));
    pts.push(...tl.pts);
  } else if(tl.harness&&sl.harness){ pts.push(...tl.pts); }
  else {
    if(sl.y!=null){ const c=tl.pts[0]; pts.push(V(c.x+(t.net==='VBAT+'?.08:-.08),sl.y,sl.z)); pts.push(...tl.pts.slice(1)); }
    else pts.push(...tl.pts);
  }
  return pts;
}

/* round every corner, then fit a smooth curve through the result */
export function smoothCurve(pts,r=.32){
  const P=[pts[0]]; for(const p of pts) if(p.distanceTo(P[P.length-1])>.015) P.push(p);
  if(P.length<2) P.push(P[0].clone().add(V(0,.01,0)));
  const out=[P[0].clone()];
  for(let i=1;i<P.length-1;i++){
    const a=P[i-1], b=P[i], c=P[i+1], ab=a.distanceTo(b), bc=b.distanceTo(c), k=Math.min(r,ab*.45,bc*.45);
    const p0=b.clone().lerp(a,k/ab), p2=b.clone().lerp(c,k/bc);
    for(let j=0;j<=5;j++){ const u=j/5; out.push(p0.clone().multiplyScalar((1-u)*(1-u)).addScaledVector(b,2*(1-u)*u).addScaledVector(p2,u*u)); }
  }
  out.push(P[P.length-1].clone());
  const clean=[out[0]]; for(const p of out) if(p.distanceTo(clean[clean.length-1])>.01) clean.push(p);
  if(clean.length<2) clean.push(clean[0].clone().add(V(0,.01,0)));
  return new THREE.CatmullRomCurve3(clean,false,'centripetal');
}
export const wireCurveFor=(srcId,tgtId)=>smoothCurve(wireRoute(srcId,tgtId));
/* tube segments for a curve: enough to stay round in the bends without wasting triangles on the straights */
export const segsFor=c=>Math.round(clamp(c.getLength()*14,24,220));

/* ================= Wire in hand, and wrong-pad feedback ================= */
const ACCENT=0xe0894a, GOOD=0x5bc489, BAD=0xe2483c;
let held=null;
function dropGroup(g){ if(!g) return; g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material&&o.userData.own){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); if(g.parent) g.parent.remove(g); }
function own(m,mat){ m.userData.own=true; m.userData.noStyle=true; m.userData.noEdges=true; m.raycast=()=>{}; return m; }
function glowTube(curve,r,col,opacity){ return own(new THREE.Mesh(new THREE.TubeGeometry(curve,segsFor(curve),r,8,false),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity,depthTest:false,depthWrite:false}))); }
/* the wire being placed: drawn in its real colour, with a glow that shows through parts.
   The glow is orange while the wire is free, and (practice only) green over a correct pad, red over a wrong one */
export function showHeld(srcId,tgtId,free,state='neutral'){
  dropHeld();
  const s=PADS[srcId]; if(!s) return;
  let curve;
  if(tgtId&&PADS[tgtId]) curve=wireCurveFor(srcId,tgtId);
  else { const A=padFrame(srcId), p1=A.pos.clone().addScaledVector(A.out,.35).add(V(0,.3,0)); curve=smoothCurve([A.pos,p1,free||p1.clone().add(V(0,.5,0))],.6); }
  const col=wireColorOf(s), g=new THREE.Group();
  const core=own(new THREE.Mesh(new THREE.TubeGeometry(curve,segsFor(curve),.055,8,false),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.25,roughness:.45})));
  core.renderOrder=6; g.add(core);
  const glow=glowTube(curve,.12,state==='ok'?GOOD:state==='bad'?BAD:ACCENT,.38); glow.renderOrder=7; g.add(glow);
  const halo=own(new THREE.Mesh(new THREE.SphereGeometry(.24,16,12),new THREE.MeshBasicMaterial({color:ACCENT,transparent:true,opacity:.45,depthTest:false,depthWrite:false})));
  halo.position.copy(padFrame(srcId).pos); halo.renderOrder=7; g.add(halo);
  droneRoot.add(g); held=g;
}
export function dropHeld(){ dropGroup(held); held=null; }
function wireColorOf(s){ const k=s.need&&s.need[0]==='M'?'phase':null; return k?0x9aa3ab:s.need==='ESC'?0xc9ced3:_wireColor(s.need); }

/* a wrong connection: a red ghost of the wire along the route it would take, a cross on the pad and the reason.
   It fades after a few seconds; the wire itself is not soldered */
export function flashWrong(srcId,tgtId,title){
  if(!PADS[srcId]||!PADS[tgtId]) return;
  const curve=wireCurveFor(srcId,tgtId), g=new THREE.Group(), mats=[];
  const core=glowTube(curve,.06,BAD,.95); core.renderOrder=8; g.add(core); mats.push([core.material,.95]);
  const glow=glowTube(curve,.14,BAD,.3); glow.renderOrder=8; g.add(glow); mats.push([glow.material,.3]);
  const B=padFrame(tgtId).pos;
  const ring=own(new THREE.Mesh(new THREE.TorusGeometry(.3,.05,8,32),new THREE.MeshBasicMaterial({color:BAD,transparent:true,depthTest:false,depthWrite:false})));
  ring.rotation.x=-Math.PI/2; ring.position.copy(B).add(V(0,.08,0)); ring.renderOrder=9; g.add(ring); mats.push([ring.material,1]);
  const tex=_labelTex('✕ '+title,[BAD],'bad','rgba(120,22,18,.94)'), sp=own(new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true})));
  const H=.3; sp.scale.set(H*tex.userData.w/tex.userData.h,H,1); sp.position.copy(B).add(V(0,.85,0)); sp.renderOrder=11; g.add(sp); mats.push([sp.material,1]);
  droneRoot.add(g);
  _tween(3.2,k=>{ const f=k<.75?1:1-(k-.75)/.25, pulse=k<.3?.6+.4*Math.abs(Math.sin(k*30)):1; mats.forEach(([m,o])=>m.opacity=o*f*pulse); },()=>dropGroup(g));
}
