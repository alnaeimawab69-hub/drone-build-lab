/* Drone Build Lab · Builders for every part, made from code (no imported models) */
import * as THREE from 'three';
import { ALU_Z, ARM, CINE, MODEL, TAU, V, armPos } from './01-config.js';
import { strapTex } from './03-textures.js';
import { M, std, wireMat } from './04-materials.js';
import { PHASE_COLS, addPad, boardMesh, box, circHole, cyl, flatExtrude, mesh, rod, roundBox, rrShape, slotHole, smd, strands, tube } from './05-geometry.js';

/* ================= Builders (all geometry made here, no imported models) ================= */
/* where the VTX and receiver sit (drone coordinates, same rotation order as place()), shared with the catalogue,
   so each can run its antenna cable up through the top plate into the TPU antenna mount */
export const AT={
  vtx:CINE?{pos:V(0,.5,3.5)}:{pos:V(-.6,1.4,4.85),rx:Math.PI/2,ry:Math.PI},
  rx:CINE?{pos:V(-1.75,.45,6.0)}:{pos:V(-1.2,.42,3.75)},
};
/* TPU antenna mount behind the battery: centre on the top plate's top face, and the slot cut under it [x, z, w, l] */
const TOP_Y=3.4+(CINE?.25:.22);
export const ANT_MOUNT=CINE?V(0,TOP_Y,4.6):V(-1.0,TOP_Y,4.3);
export const ANT_SLOT=CINE?[0,4.8,2,.8]:[-1.0,4.3,1.2,.4];
const MOUNT_H=.7, ANT_TOP=TOP_Y+MOUNT_H;
/* model 1: VTX antenna in the middle, receiver whips either side. Model 2: receiver whips on the left, VTX on the right, GPS wires pass behind */
const ANT_X=CINE?{vtx:.35,rx:[-.5,-.1]}:{vtx:-1.0,rx:[-1.45,-.55]};
const toPart=(pts,at)=>{ const o=new THREE.Object3D(); o.position.copy(at.pos); o.rotation.set(at.rx||0,at.ry||0,0); o.updateMatrix(); const inv=o.matrix.clone().invert(); return pts.map(p=>p.clone().applyMatrix4(inv)); };
/* an antenna cable from the part (path given in drone coordinates) up into the mount, then the antenna out of the top of it */
function mountedAntenna(g,at,path,dir,segs){
  g.add(tube(toPart(path,at),.045,M.black));
  const d=dir.clone().normalize(); let p=path[path.length-1];
  for(const [len,r,mat] of segs){ const q=p.clone().addScaledVector(d,len); const [a,b]=toPart([p,q],at); g.add(rod(a,b,r,mat,12)); p=q; }
}
/* model 2: long slim arm that widens into a square motor pad */
function armShapeC(){
  const L=ARM, R=1.35, sh=new THREE.Shape();
  sh.moveTo(.5,-.8); sh.lineTo(L-2.4,-.55); sh.quadraticCurveTo(L-1.8,-.55,L-1.5,-R); sh.lineTo(L+.9,-R); sh.quadraticCurveTo(L+R,-R,L+R,-.9);
  sh.lineTo(L+R,.9); sh.quadraticCurveTo(L+R,R,L+.9,R); sh.lineTo(L-1.5,R); sh.quadraticCurveTo(L-1.8,.55,L-2.4,.55); sh.lineTo(.5,.8); sh.lineTo(.5,-.8);
  sh.holes.push(circHole(L,0,.45));
  for(const [dx,dy] of [[.57,.57],[.57,-.57],[-.57,.57],[-.57,-.57]]) sh.holes.push(circHole(L+dx,dy,.12));
  for(const x of [1.2,3.2]) sh.holes.push(circHole(x,0,.13));
  sh.holes.push(slotHole(4.6,L-3,0,.16));
  return sh;
}
export function armShape(){
  if(CINE) return armShapeC();
  const L=ARM, root=.9, sh=new THREE.Shape(), a=Math.asin(.62/1.5);
  sh.moveTo(root,-.85); sh.lineTo(L-1.36,-.62); sh.absarc(L,0,1.5,Math.PI+a,3*Math.PI-a,false); sh.lineTo(root,.85); sh.lineTo(root,-.85);
  sh.holes.push(circHole(L,0,.45));
  for(const [dx,dy] of [[.57,.57],[.57,-.57],[-.57,.57],[-.57,-.57]]) sh.holes.push(circHole(L+dx,dy,.12));
  for(const x of [1.2,3.2]) sh.holes.push(circHole(x,0,.13));
  sh.holes.push(slotHole(4.4,8.0,0,.22));
  return sh;
}
export function buildArm(){
  const g=new THREE.Group(); g.add(flatExtrude(armShape(),MODEL.armT,M.carbon));
  /* TPU arm guard: a soft bumper around the arm tip takes the hit in a crash instead of the motor bell */
  const L=ARM, a0=-1.15, a1=1.15, sh=new THREE.Shape();
  sh.absarc(L,0,1.82,a0,a1,false); sh.absarc(L,0,1.52,a1,a0,true);
  if(CINE){ const sole=mesh(roundBox(3.1,.55,3.1,.4,4),M.guard); sole.position.set(L,-.24,0); g.add(sole); return g; }   // model 2: chunky black TPU guard under the motor pad takes landings
  const gd=flatExtrude(sh,MODEL.armT+.3,M.tpu); gd.position.y=-.15; g.add(gd);
  return g;
}
/* an outline that is the same left and right: R lists the right-hand corners [x, z] from nose to tail, f turns z into the shape's y */
const mirrored=(R,f)=>{ const sh=new THREE.Shape(); [...R,...R.slice().reverse().map(([x,z])=>[-x,z])].forEach(([x,z],i)=>i?sh.lineTo(x,f(z)):sh.moveTo(x,f(z))); sh.closePath(); return sh; };
export function buildPlateB(){
  const [W,L]=MODEL.plate, A=MODEL.alu;
  /* model 2: a long slim plate. The nose reaches past the camera, and two shoulders carry the wide front arms */
  const sh=CINE?mirrored([[1.5,-7.4],[1.5,-6.1],[3.5,-5.95],[3.65,-4.9],[2.7,-3.8],[2.7,6.5],[2.2,7.05]],z=>.25-z):rrShape(W,L,.7), H=(x,z)=>sh.holes.push(circHole(x,.25-z,.15));
  for(const a of [-1.525,1.525]) for(const b of [-1.525,1.525]) H(a,b);
  for(const x of [-A,A]) for(const z of ALU_Z) H(x,z);
  for(const n of [1,2,3,4]) for(const r of [1.2,3.2]){ const q=armPos(n,r); H(q.x,q.z); }
  const g=new THREE.Group(); g.add(flatExtrude(sh,.3,M.carbon)); return g;
}
export function buildAluSt(){ const g=new THREE.Group(); g.add(cyl(.2,.2,2.95,CINE?M.accent:M.alu,6)); return g; }   // model 2: purple anodised, model 1: plain aluminium
export function buildNylSt(){ const g=new THREE.Group(); g.add(cyl(.13,.13,2.05,M.nylon,12)); return g; }
export function buildCamPlate(){
  const g=new THREE.Group();
  if(CINE){ g.add(mesh(roundBox(.22,2.95,1.6,.05,3),M.cage)); const bd=cyl(.42,.42,.3,M.tpu,24); bd.rotation.z=Math.PI/2; bd.position.set(0,.2,-.15); g.add(bd); const bp=mesh(roundBox(.36,1.0,1.5,.12,4),M.tpu); bp.position.set(0,-.95,-.85); g.add(bp); for(const z of [-.4,.4]){ const c=cyl(.12,.12,.24,M.darkMetal,12); c.rotation.z=Math.PI/2; c.position.z=z; g.add(c); } }
  else g.add(box(.16,2.95,1.5,M.carbon));
  return g;
}
/* battery straps: each one passes down through a pair of slots, one slot on each side of the battery */
export const PLATE_T=CINE?.25:.22;                       // top plate thickness
export const STRAP_X=MODEL.bat[0]/2+.35;                  // slot distance from the centre line
export const STRAP_Z=[-1,1].map(s=>MODEL.batZ+s*(CINE?1.6:1.9));
const strapSlots=(sh,Y)=>{ for(const z of STRAP_Z) for(const x of [-STRAP_X,STRAP_X]){ const p=new THREE.Path(), y=Y(z); p.moveTo(x-.11,y-.36); p.lineTo(x+.11,y-.36); p.lineTo(x+.11,y+.36); p.lineTo(x-.11,y+.36); p.lineTo(x-.11,y-.36); sh.holes.push(p); } };
/* anti-slip rubber pad under the battery, between the straps */
function batteryPad(g){ const [W,,L]=MODEL.bat, p=box(W-.2,.06,L-.4,M.batPad,0,PLATE_T+.03,MODEL.batZ); p.castShadow=false; g.add(p); }
/* yellow TPU antenna mount behind the battery, screwed over a slot: the antenna cables come up through the slot into it */
function antMount(g,sh,Y){
  const [x,z,w,l]=ANT_SLOT, p=new THREE.Path(), y=Y(z);
  p.moveTo(x-w/2,y-l/2); p.lineTo(x+w/2,y-l/2); p.lineTo(x+w/2,y+l/2); p.lineTo(x-w/2,y+l/2); p.lineTo(x-w/2,y-l/2); sh.holes.push(p);
  const m=mesh(roundBox(CINE?1.5:1.4,MOUNT_H,.6,.15,4),M.tpu); m.position.set(ANT_MOUNT.x,PLATE_T+MOUNT_H/2,ANT_MOUNT.z); g.add(m);
}
export function buildTopPlate(){
  if(CINE) return buildTopPlateC();
  const g=new THREE.Group(), ts=rrShape(5.2,9.2,.6);
  strapSlots(ts,z=>-z);
  for(const x of [-2.35,2.35]) for(const z of [-4,0,4.2]) ts.holes.push(circHole(x,-z,.15));
  antMount(g,ts,z=>-z);
  g.add(flatExtrude(ts,PLATE_T,M.carbonTop));
  batteryPad(g);
  return g;
}
/* model 2: longer, wider top plate with purple trim */
function buildTopPlateC(){
  const g=new THREE.Group(), cz=.5, A=MODEL.alu, Y=z=>-(z-cz), W=A+.4, N=W-.35;   // W: half width · N: half width at the waists
  /* slim outline: a long narrow nose over the camera cage, full width at each pair of standoffs, waists between them, a chamfered tail */
  const ts=mirrored([[1.45,-7],[1.45,-5.3],[W,-4.3],[W,-2.4],[N,-2],[N,-1],[W,-.6],[W,.6],[N,1],[N,3.2],[W,3.6],[W,5.5],[1.9,6.5]],Y);
  strapSlots(ts,Y);
  for(const x of [-A,A]) for(const z of ALU_Z) ts.holes.push(circHole(x,Y(z),.15));
  antMount(g,ts,Y);
  for(const [x,z] of [[-1.3,-1.2],[1.3,-1.2]]) ts.holes.push(circHole(x,Y(z),.45));
  const pl=flatExtrude(ts,PLATE_T,M.carbonTop); pl.position.z=cz; g.add(pl);
  for(const s of [-1,1]) for(const z of ALU_Z) g.add(box(.5,.1,.9,M.accent,s*(A-.05),PLATE_T+.05,z));   // purple anodised pads over each standoff
  batteryPad(g);
  /* see-through purple side panels close the body between the arms; a light bar glows inside each one */
  for(const s of [-1,1]){ const sp=mesh(roundBox(.75,2.6,4,.3,4),M.sidePanel,false); sp.position.set(s*(W+.1),-1.4,0); g.add(sp);
    for(const [y,l,z] of [[-1.5,2.4,.3],[-1.1,1.1,1.2],[-1.9,1.1,-.6]]){ const lb=box(.08,.1,l,M.panelGlow,s*(W+.1),y-.1,z-.3); lb.castShadow=false; g.add(lb); } }
  return g;
}
/* a flat band that follows a closed loop drawn in the x-y plane: outer face, inner face and two edges.
   Material 0 is the outside, material 1 the inside. */
export function bandLoop(pts,width,thick,mats){
  const curve=new THREE.CatmullRomCurve3(pts.map(([x,y])=>V(x,y,0)),true,'catmullrom',.2), N=160, pos=[], idx=[], groups=[[],[],[]];
  for(let i=0;i<N;i++){ const t=i/N, p=curve.getPointAt(t), tg=curve.getTangentAt(t), n=V(tg.y,-tg.x,0).normalize();
    for(const [s,z] of [[1,-1],[1,1],[-1,1],[-1,-1]]) pos.push(p.x+n.x*s*thick/2,p.y+n.y*s*thick/2,z*width/2); }
  const q=(a,b,c,d,grp)=>groups[grp].push(a,b,c,a,c,d);
  for(let i=0;i<N;i++){ const a=i*4, b=((i+1)%N)*4;
    q(a,b,b+1,a+1,0); q(a+3,a+2,b+2,b+3,1); q(a+1,b+1,b+2,a+2,2); q(a,a+3,b+3,b,2); }
  groups.forEach(l=>idx.push(...l));
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setIndex(idx);
  geo.addGroup(0,groups[0].length,0); geo.addGroup(groups[0].length,groups[1].length,1); geo.addGroup(groups[0].length+groups[1].length,groups[2].length,0);
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mats); m.castShadow=m.receiveShadow=true; return m;
}
/* battery strap, origin on the top surface of the top plate: under the plate, up through the slots, over the battery.
   The inner face is red anti-slip rubber; the buckle and the loose tail sit on top. */
const STRAP_LABEL=std({map:strapTex,roughness:.9});
export function buildStrap(){
  const g=new THREE.Group(), [W,H]=MODEL.bat, X=STRAP_X, top=H+.06+.05, bot=-PLATE_T-.05, w=W/2+.04;
  const pts=[[-X,bot],[0,bot-.02],[X,bot],[X,.6],[X-.05,top-.55],[w,top-.08],[w-.35,top],[0,top+.02],[-w+.35,top],[-w,top-.08],[-X+.05,top-.55],[-X,.6]];
  g.add(bandLoop(pts,.62,.07,[M.strapBand,M.strapGrip]));
  const bk=box(.95,.16,.74,M.darkMetal,.55,top+.08,0); g.add(bk);
  g.add(box(.6,.06,.5,M.black,.55,top+.17,0));
  const tail=box(1.5,.06,.6,M.strapBand,1.45,top+.13,0); tail.rotation.z=-.12; g.add(tail);
  if(CINE){ const lb=new THREE.Mesh(new THREE.BoxGeometry(1.25,.03,.5),[M.strapBand,M.strapBand,STRAP_LABEL,M.strapBand,M.strapBand,M.strapBand]); lb.position.set(-.78,top+.07,0); g.add(lb); }   // model 2: yellow lettering on top
  return g;
}
/* TPU camera mount: side cheeks outside the camera plates reach past the lens to protect it,
   a chin bar joins them under the lens, and tick marks show the uptilt angle */
export function buildCamMount(){
  const g=new THREE.Group();
  if(CINE){ /* model 2: yellow TPU action-camera mount screwed to the front of the top plate: a base and three prongs */
    const mb=mesh(roundBox(2.6,.3,1.5,.1,4),M.tpu); mb.position.y=.15; g.add(mb);
    for(const x of [-.32,0,.32]) g.add(box(.16,.72,.85,M.tpu,x,.65,0));
    return g; }
  for(const s of [-1,1]){
    /* the cheeks fill the gap from the bottom plate to the top plate, so the mount is clamped between them */
    const ch=mesh(roundBox(.3,2.9,2.8,.12,4),M.tpu); ch.position.set(s*1.38,0,-.55); g.add(ch);
    for(const a of [0,10,20,30,40]){ const t=box(.04,.05,.42,M.black); const r=a*Math.PI/180; t.position.set(s*1.545,Math.sin(r)*.85,-Math.cos(r)*.85+.1); t.rotation.x=r; g.add(t); }
  }
  const chin=mesh(roundBox(3.06,.34,.5,.12,4),M.tpu); chin.position.set(0,-1.08,-1.75); g.add(chin);
  return g;
}
/* a flat arc with an arrow head, lying in the x-z plane. As built it points counter-clockwise seen from above;
   scale.z = -1 turns it clockwise. The motor test uses the small one, flight and Movements a big one over each prop. */
export function makeRing(R2=1.9,k=1){
  const g=new THREE.Group(); const arc=Math.PI*1.45;
  const mat=new THREE.MeshBasicMaterial({color:0xe0894a,side:THREE.DoubleSide,depthTest:false,transparent:true});
  const t=new THREE.Mesh(new THREE.TorusGeometry(R2,.08*k,8,64,arc),mat); t.rotation.x=-Math.PI/2; g.add(t);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.26*k,.62*k,16),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false,transparent:true}));   // white arrowhead on the coloured ring
  head.position.set(R2*Math.cos(arc),0,-R2*Math.sin(arc));
  head.quaternion.setFromUnitVectors(V(0,1,0),V(-Math.sin(arc),0,-Math.cos(arc)));
  g.add(head); t.renderOrder=head.renderOrder=7; t.userData.noStyle=head.userData.noStyle=true; g.userData.mat=mat; g.visible=false;
  return g;
}
export function buildMotor(){
  /* model 2 uses a bigger 2306 motor: wider bell (k) and a taller stator (hk) */
  const g=new THREE.Group(), k=CINE?1.2:1, hk=CINE?1.1:1;
  const base=cyl(1.06*k,1.12*k,.3,CINE?M.accent:M.darkMetal,40); base.position.y=.15; g.add(base);
  /* stator: copper windings on 12 teeth. It stays still; you see it through the gap under the bell and the windows in the bell's top */
  const st=cyl(.98*k,.98*k,.9*hk,M.copper,36); st.position.y=.3+.45*hk; g.add(st);
  for(let i=0;i<12;i++){ const a=i/12*TAU, sl=cyl(.05,.05,.9*hk,M.black,6); sl.position.set(Math.cos(a)*.97*k,.3+.45*hk,Math.sin(a)*.97*k); sl.castShadow=false; g.add(sl); }
  const rot=new THREE.Group(); g.add(rot); g.userData.rot=rot;
  /* bell: a steel ring that carries the magnets, and a top with six windows for cooling */
  const bm=CINE?M.bellC:M.bell, y0=.36+.24*hk, ringS=new THREE.Shape(), capS=new THREE.Shape();
  ringS.absarc(0,0,1.12*k,0,TAU,false); ringS.holes.push(circHole(0,0,1.02*k));
  const bell=flatExtrude(ringS,.78*hk,bm); bell.position.y=y0; rot.add(bell);
  capS.absarc(0,0,1.12*k,0,TAU,false);
  for(let i=0;i<6;i++){ const a=i/6*TAU, w=new THREE.Path(); w.absarc(0,0,.9*k,a-.36,a+.36,false); w.absarc(0,0,.45*k,a+.3,a-.3,true); w.closePath(); capS.holes.push(w); }
  const cap=flatExtrude(capS,.1,bm); cap.position.y=y0+.78*hk; rot.add(cap);
  const band=cyl(1.135*k,1.135*k,.18,CINE?M.accent:M.alu,48); band.position.y=.36+.76*hk; rot.add(band);
  rot.add(box(.08,.3*hk,.3,M.white,1.13*k,.36+.46*hk,0));
  const shaft=cyl(.14,.14,.8,M.steel,16); shaft.position.y=.36+1.44*hk; rot.add(shaft);
  const lead=new THREE.Group(); g.add(lead); g.userData.lead=lead;
  strands(new THREE.CatmullRomCurve3([V(-.95*k,.2,0),V(-3.5,.21,0),V(-7.35,.19,0)]),3,.06,.07,7,PHASE_COLS).forEach(m=>lead.add(m));
  lead.add(rod(V(-6.5,.19,0),V(-7.3,.19,0),.17,M.sleeve));
  for(const x of [-3.2,-5.6]){ const z=mesh(new THREE.TorusGeometry(.8,.035,6,32),M.black); z.rotation.y=Math.PI/2; z.scale.set(1,.5,1); z.position.set(x,-.12,0); lead.add(z); lead.add(box(.1,.12,.16,M.black,x,.3,.0)); }
  addPad(g,{key:'ph',label:'MOTOR',need:'M?',pos:V(-7.6,.18,0),out:V(0,1,0),shape:'bundle'},lead);
  const ring=makeRing(); ring.position.y=1.7*hk; g.add(ring); g.userData.ring=ring;
  return g;
}
export function bladeShape(s){
  const sh=new THREE.Shape(), P=(x,y)=>[x,y*s];
  sh.moveTo(...P(.3,-.32)); sh.bezierCurveTo(...P(1.6,-.95),...P(4.4,-.8),...P(6.3,-.22));
  sh.quadraticCurveTo(...P(6.48,.12),...P(6.05,.3)); sh.bezierCurveTo(...P(4.2,.56),...P(1.8,.56),...P(.3,.3)); sh.lineTo(...P(.3,-.32));
  return sh;
}
export function buildProp(dir){
  const s=dir==='CW'?1:-1, g=new THREE.Group(), sp=new THREE.Group(); g.add(sp); g.userData.spinner=sp; g.userData.dir=dir;
  const hub=cyl(.42,.46,.38,M.propHub,24); hub.position.y=.19; sp.add(hub);
  const nut=cyl(.3,.3,.3,M.steel,6); nut.position.y=.53; sp.add(nut);
  const geo=new THREE.ExtrudeGeometry(bladeShape(s),{depth:.07,bevelEnabled:false,curveSegments:10}); geo.rotateX(-Math.PI/2); geo.translate(0,-.035,0);
  for(let k=0;k<3;k++){ const pv=new THREE.Group(); pv.rotation.y=k*TAU/3; const bl=mesh(geo,dir==='CW'?M.propCW:M.propCCW); bl.rotation.x=-.28*s; bl.position.y=.2; pv.add(bl); sp.add(pv); }
  return g;
}
export function buildESC(){
  const g=new THREE.Group(); g.add(boardMesh(4,.18,4,M.pcbG,M.escTop));
  for(const sx of [-1,1]) for(const sz of [-1,1]) for(let i=0;i<3;i++) g.add(box(.42,.12,.3,M.black,sx*1.15,.24,sz*(.35+i*.38)));
  g.add(box(.5,.08,.5,M.black,0,.22,-1.35));
  addPad(g,{key:'m1',label:'M1',net:'M1',pos:V(1.85,.2,.85),out:V(1,0,0),shape:'triple'});
  addPad(g,{key:'m2',label:'M2',net:'M2',pos:V(1.85,.2,-.85),out:V(1,0,0),shape:'triple'});
  addPad(g,{key:'m3',label:'M3',net:'M3',pos:V(-1.85,.2,.85),out:V(-1,0,0),shape:'triple'});
  addPad(g,{key:'m4',label:'M4',net:'M4',pos:V(-1.85,.2,-.85),out:V(-1,0,0),shape:'triple'});
  addPad(g,{key:'bp',label:'+',net:'VBAT+',pos:V(1.0,.2,1.75),out:V(0,0,1),shape:'big'});
  addPad(g,{key:'bn',label:'−',net:'VBAT-',pos:V(.35,.2,1.75),out:V(0,0,1),shape:'big'});
  /* harness plug in the front-right corner, under the FC socket, so the harness stays clear of the receiver wires */
  addPad(g,{key:'fc',label:'HARNESS',need:'ESC',pos:V(.95,.3,-1.62),out:V(0,1,0),shape:'plug'});
  smd(g,{w:4,d:4,y:.18,n:34,seed:7,avoid:[[.9,-1.35,1.4,1.35],[-1.4,-1.35,-.9,1.35],[-.3,-1.65,.3,-1.05],[.55,-1.85,1.35,-1.35],[-.85,-.2,.85,.55]]});
  return g;
}
export function buildFC(){
  const g=new THREE.Group(); g.add(boardMesh(3.6,.16,3.6,M.pcbB,M.fcTop));
  g.add(box(.95,.12,.95,M.black,.62,.22,.78));
  g.add(box(.42,.1,.42,M.black,-.62,.21,.82));
  g.add(box(.3,.26,.72,M.steel,1.62,.29,1.0));
  g.add(box(.12,.06,.12,std({color:0x4fd18b,emissive:0x2a8a55}),1.1,.19,.6));
  const P=(k,l,net,x,z,o)=>addPad(g,{key:k,label:l,net,pos:V(x,.17,z),out:o});
  const F=V(0,0,-1),B=V(0,0,1),Rt=V(1,0,0),Lf=V(-1,0,0);
  if(CINE){ /* model 2: digital VTX on UART 2, spare 5V and G at the front */
    P('c5','5V','5V',0,-1.6,F); P('cg','G','GND',.55,-1.6,F);
    P('v9','9V','9V',1.6,-.9,Rt); P('vg','G','GND',1.6,-.45,Rt); P('t2','T2','T2',1.6,0,Rt); P('r2','R2','R2',1.6,.45,Rt);
  } else {
    P('c5','5V','5V',0,-1.6,F); P('cg','G','GND',.55,-1.6,F); P('cam','CAM','CAM',1.1,-1.6,F);
    P('v9','9V','9V',1.6,-.7,Rt); P('vg','G','GND',1.6,-.25,Rt); P('vtx','VTX','VTX',1.6,.2,Rt);
  }
  P('u15','5V','5V',-1.2,1.6,B); P('u1g','G','GND',-.65,1.6,B); P('t1','T1','T1',-.1,1.6,B); P('r1','R1','R1',.45,1.6,B);
  P('u35','5V','5V',-1.6,-.45,Lf); P('u3g','G','GND',-1.6,0,Lf); P('t3','T3','T3',-1.6,.45,Lf); P('r3','R3','R3',-1.6,.9,Lf);
  addPad(g,{key:'esc',label:'ESC',net:'ESC',pos:V(.95,.28,-.95),out:V(0,1,0),shape:'socket'});
  smd(g,{w:3.6,d:3.6,y:.16,n:30,seed:13,avoid:[[-.55,-1.4,.55,.45],[.1,.25,1.15,1.3],[-.9,.55,-.35,1.1],[1.4,.55,1.8,1.45],[.45,-1.25,1.45,-.65]]});
  return g;
}
export function buildCamera(){
  if(CINE) return buildHDCamera();
  const g=new THREE.Group();
  const cb=mesh(roundBox(1.9,1.9,1.5,.14),M.camBody); cb.position.z=.05; g.add(cb);
  g.add(box(1.95,1.95,.12,M.darkMetal,0,0,-.75));
  const lens=cyl(.58,.62,.75,M.black,32); lens.rotation.x=Math.PI/2; lens.position.z=-1.15; g.add(lens);
  const lr=cyl(.6,.6,.12,M.alu,32); lr.rotation.x=Math.PI/2; lr.position.z=-1.0; g.add(lr);
  const gl=cyl(.42,.42,.04,M.glass,32); gl.rotation.x=Math.PI/2; gl.position.z=-1.53; g.add(gl);
  g.add(box(1.05,.35,.18,M.nylon,0,-.55,.86));
  const B=V(0,0,1);
  addPad(g,{key:'5v',label:'5V',need:'5V',pos:V(-.35,-.55,1.02),out:B});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(0,-.55,1.02),out:B});
  addPad(g,{key:'vid',label:'VID',need:'CAM',pos:V(.35,-.55,1.02),out:B});
  return g;
}
export function buildVTX(){
  if(CINE) return buildHDVTX();
  const g=new THREE.Group(); g.add(boardMesh(2,.14,2,M.pcbG,M.vtxTop));
  g.add(box(1.4,.3,1.15,M.steel,0,.29,.1));
  const cn=cyl(.13,.13,.3,M.gold,12); cn.position.set(.65,.3,.86); g.add(cn);
  /* the antenna cable climbs behind the top plate, through the slot, into the TPU mount; the antenna stands up out of it, clear of the carbon */
  const X=ANT_X.vtx, Z=ANT_MOUNT.z;
  mountedAntenna(g,AT.vtx,[V(-1.25,2.3,5.25),V(-1.2,2.9,5.0),V(X,3.2,Z+.15),V(X,TOP_Y,Z),V(X,ANT_TOP,Z)],V(0,1,.35),[[3.0,.06,M.antenna],[.7,.3,M.antenna]]);
  /* the wire pads are on the underside of the board: the VTX stands upright with that side facing the flight controller,
     so the wires come straight off it, toward the flight controller, instead of passing through the board */
  const D=V(0,-1,0);
  addPad(g,{key:'vin',label:'VIN',need:'9V',pos:V(-.5,-.08,-.85),out:D});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(0,-.08,-.85),out:D});
  addPad(g,{key:'vid',label:'VID',need:'VTX',pos:V(.5,-.08,-.85),out:D});
  return g;
}
export function buildRX(){
  const g=new THREE.Group(); g.add(boardMesh(1.3,.12,1.6,M.pcbG,M.rxTop));
  g.add(box(.5,.1,.5,M.black,0,.17,.05));
  /* both whips come up through the top plate into the TPU mount, 90° apart in a V, so the receiver keeps signal at any angle */
  ANT_X.rx.forEach((X,i)=>{ const a=AT.rx.pos.clone().add(CINE?V(i?-.3:.3,.14,.75):V(i?-.42:-.58,.14,.5)), Z=ANT_MOUNT.z;
    mountedAntenna(g,AT.rx,[a,a.clone().add(V(0,1,.15)),V(X,3.15,Z+.1),V(X,TOP_Y,Z),V(X,ANT_TOP,Z)],V(i?1:-1,1,.35),[[1.9,.04,M.antenna],[.7,.03,M.white]]); });
  const F=V(0,0,-1);
  addPad(g,{key:'5v',label:'5V',need:'5V',pos:V(-.45,.14,-.68),out:F});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(-.15,.14,-.68),out:F});
  addPad(g,{key:'tx',label:'TX',need:'R1',pos:V(.15,.14,-.68),out:F});
  addPad(g,{key:'rx',label:'RX',need:'T1',pos:V(.45,.14,-.68),out:F});
  return g;
}
/* compact GPS: a thin black case with a ceramic patch antenna on top (the arrow points to the front),
   a built-in compass, a status LED and a 4-wire plug at the front */
export const GPS_LIFT=CINE?.5:.6;   // standoff height under the GPS
export function buildGPS(){
  const g=new THREE.Group();
  const gs=mesh(roundBox(2.1,.36,2.1,.14,4),M.gpsShell); gs.position.y=.18; g.add(gs);
  const p=new THREE.Mesh(new THREE.BoxGeometry(1.5,.26,1.5),[M.ceramic,M.ceramic,M.patch,M.ceramic,M.ceramic,M.ceramic]); p.position.y=.49; p.castShadow=true; g.add(p);
  const pin=cyl(.09,.09,.04,M.tin,12); pin.position.set(.18,.64,.18); g.add(pin);
  const led=box(.12,.06,.12,std({color:0x6fd0ff,emissive:0x2a8fd0}),.82,.38,.82); led.castShadow=false; g.add(led);
  g.add(box(.8,.24,.3,M.nylon,0,.16,-1.08));
  const F=V(0,0,-1);
  addPad(g,{key:'5v',label:'5V',need:'5V',pos:V(-.45,.12,-1.2),out:F});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(-.15,.12,-1.2),out:F});
  addPad(g,{key:'tx',label:'TX',need:'R3',pos:V(.15,.12,-1.2),out:F});
  addPad(g,{key:'rx',label:'RX',need:'T3',pos:V(.45,.12,-1.2),out:F});
  /* four nylon standoffs: model 1 lifts the GPS off the bottom plate so the battery wires pass under it; model 2 stands it on the top plate behind the antenna mount */
  const sc=CINE?.85:.75, h=GPS_LIFT/sc;
  for(const x of [-.6,.6]) for(const z of [-.6,.6]){ const st=cyl(.12,.12,h,M.nylon,10); st.position.set(x,-h/2,z); g.add(st); }
  g.scale.setScalar(sc);
  return g;
}
export function buildCap(){
  const g=new THREE.Group();
  /* 10 mm across and 20 mm long, the usual size of a 1000 µF low-ESR capacitor */
  const b=cyl(.5,.5,2,M.capBody,32); b.rotation.x=Math.PI/2; g.add(b);
  const st=mesh(new THREE.CylinderGeometry(.507,.507,1.9,24,1,true,Math.PI*1.5-.4,.8),M.capStripe); st.rotation.x=Math.PI/2; g.add(st);
  const top=cyl(.47,.47,.04,M.tin,24); top.rotation.x=Math.PI/2; top.position.z=1.01; g.add(top);
  for(const x of [-.2,.2]) g.add(rod(V(x,0,-1),V(x,0,-1.5),.035,M.tin));
  addPad(g,{key:'p',label:'+',need:'VBAT+',pos:V(.2,0,-1.55),out:V(0,1,0)});
  addPad(g,{key:'n',label:'−',need:'VBAT-',pos:V(-.2,0,-1.55),out:V(0,1,0)});
  return g;
}
/* model 1: the XT60 plug sits just behind the top plate, in a TPU holder screwed under the plate's rear edge, socket facing back to meet the battery cable.
   The two wires leave the plug, drop behind the plate edge to the bottom plate and run forward along it to the ESC battery pads.
   Model 2: the wires drop less and run forward above the VTX */
export function buildLead(){
  const g=new THREE.Group(), k=CINE?.5:1;
  g.add(box(.9,.55,1.0,M.connector,0,0,.6));
  g.add(box(.94,.12,.3,M.connector,0,.3,.25));
  g.add(box(1.15,.4,.75,CINE?M.guard:M.tpu,0,-.3,-.08));                // holder: screwed under the rear edge of the top plate, cradles the plug
  g.add(box(1.2,.05,.1,M.black,0,-.52,.12));               // zip tie round the holder and the plug
  /* model 1: the wires drop behind the rear standoffs to the bottom plate, run forward along it under the raised GPS, then rise to the ESC pads */
  for(const [x,c,ex] of [[.22,0xd8453b,.2],[-.22,0x2b2f35,-.35]])
    g.add(tube(CINE?[V(x,-.28,.55),V(x,-.8*k,.62),V(x,-1.6*k,.55),V(x,-2.05*k,-.2),V(ex,-2.05*k,-1.4),V(ex,-2.05*k,-2.4)]
      :[V(x,-.28,.55),V(x,-.9,.62),V(x,-2.2,.5),V(x,-2.88,.15),V(ex,-2.92,-.9),V(ex,-2.85,-1.9),V(ex,-2.3,-2.35),V(ex,-2.05,-2.4)],.11,wireMat(c)));
  addPad(g,{key:'p',label:'+',need:'VBAT+',pos:V(.2,-2.05*k,-2.47),out:V(0,1,0)});
  addPad(g,{key:'n',label:'−',need:'VBAT-',pos:V(-.35,-2.05*k,-2.47),out:V(0,1,0)});
  const sock=new THREE.Object3D(); sock.position.set(0,0,1.12); g.add(sock); g.userData.socket=sock;
  return g;
}
export function buildBattery(){
  const g=new THREE.Group(), [W,H,L]=MODEL.bat;
  const b=new THREE.Mesh(roundBox(W,H,L,.28),[M.batSide,M.batSide,M.batEnd,M.batEnd,M.batEnd,M.batEnd]); b.position.y=H/2; b.castShadow=b.receiveShadow=true; g.add(b);
  const by=CINE?H*.83:2.15, bz=L/2+.12, cells=CINE?7:5, gap=CINE?.1:.12;
  g.add(box(.7,.3,.22,M.white,-1.0,by,bz));
  for(let i=0;i<cells;i++){ const x=-1.25+i*gap; g.add(tube([V(x,by,bz-.12),V(x,by+.3,bz-.32),V(x,by+.47,bz-.62)],.025,wireMat(i?0xd8453b:0x232528))); }
  const plug=new THREE.Object3D(); plug.position.set(CINE?1.45:1.0,CINE?H*.62:1.6,L/2+.05); g.add(plug); g.userData.plug=plug;   // model 2: further right, so the cable clears the GPS on the top plate
  return g;
}

/* ================= Model 2 (HD freestyle) parts ================= */
/* HD camera: digital sensor and a bigger lens. Its picture runs over the coax cable that comes with the VTX, so it has no wires of its own */
function buildHDCamera(){
  const g=new THREE.Group();
  const cb=mesh(roundBox(1.9,1.9,1.5,.14),M.camShell); cb.position.z=.05; g.add(cb);
  g.add(box(1.95,1.95,.12,M.alu,0,0,-.75));
  const lens=cyl(.66,.7,.8,M.black,32); lens.rotation.x=Math.PI/2; lens.position.z=-1.2; g.add(lens);
  const lr=cyl(.7,.7,.14,M.alu,32); lr.rotation.x=Math.PI/2; lr.position.z=-1.0; g.add(lr);
  const gl=cyl(.5,.5,.04,M.glass,32); gl.rotation.x=Math.PI/2; gl.position.z=-1.61; g.add(gl);
  g.add(box(.5,.3,.2,M.gold,0,-.4,.86));
  return g;
}
/* digital VTX: heatsink body, one antenna, and the coax cable forward to the HD camera */
function buildHDVTX(){
  const g=new THREE.Group();
  g.add(boardMesh(2.8,.14,2.8,M.pcbG,M.vtxTop));
  const body=mesh(roundBox(2.6,.6,2.4,.1,4),M.heatsink); body.position.set(0,.45,.15); g.add(body);
  for(let i=0;i<6;i++) g.add(box(2.4,.22,.1,M.heatsink,0,.85,-.85+i*.4));
  /* the antenna cable climbs to the TPU mount on the top plate; the antenna stands up out of it, behind the battery */
  { const X=ANT_X.vtx, Z=ANT_MOUNT.z;
    mountedAntenna(g,AT.vtx,[V(0,1.05,4.85),V(.1,1.6,5.2),V(X,3.0,Z+.2),V(X,TOP_Y,Z),V(X,ANT_TOP,Z)],V(0,1,.35),[[3.0,.06,M.antenna],[.85,.32,M.antenna]]); }
  const coax=new THREE.Group(); g.add(coax); g.userData.lead=coax;
  coax.add(tube([V(0,.2,-1.35),V(0,.12,-2.4),V(0,.15,-5.9),V(0,.45,-7.6),V(0,1.05,-8.2)],.045,M.black));   // forward to the camera at the nose
  const F=V(0,0,-1);
  addPad(g,{key:'vin',label:'VIN',need:'9V',pos:V(-.75,.16,-1.3),out:F});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(-.3,.16,-1.3),out:F});
  addPad(g,{key:'tx',label:'TX',need:'R2',pos:V(.3,.16,-1.3),out:F});
  addPad(g,{key:'rx',label:'RX',need:'T2',pos:V(.75,.16,-1.3),out:F});
  return g;
}
