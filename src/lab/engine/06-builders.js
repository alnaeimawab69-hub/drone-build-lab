/* Drone Build Lab · Builders for every part, made from code (no imported models) */
import * as THREE from 'three';
import { ARM, CINE, MODEL, TAU, V, armPos } from './01-config.js';
import { M, std, wireMat } from './04-materials.js';
import { PHASE_COLS, addPad, boardMesh, box, circHole, cyl, flatExtrude, mesh, rod, roundBox, rrShape, slotHole, smd, strands, tube } from './05-geometry.js';

/* ================= Builders (all geometry made here, no imported models) ================= */
export function armShape(){
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
  const gd=flatExtrude(sh,MODEL.armT+.3,M.tpu); gd.position.y=-.15; g.add(gd);
  return g;
}
export function buildPlateB(){
  const [W,L]=MODEL.plate, A=MODEL.alu;
  const sh=rrShape(W,L,.7), H=(x,z)=>sh.holes.push(circHole(x,.25-z,.15));
  for(const a of [-1.525,1.525]) for(const b of [-1.525,1.525]) H(a,b);
  for(const x of [-A,A]) for(const z of [-4,0,4.2]) H(x,z);
  for(const n of [1,2,3,4]) for(const r of [1.2,3.2]){ const q=armPos(n,r); H(q.x,q.z); }
  const g=new THREE.Group(); g.add(flatExtrude(sh,.3,M.carbon)); return g;
}
export function buildAluSt(){ const g=new THREE.Group(); g.add(cyl(.2,.2,2.95,M.alu,6)); return g; }
export function buildNylSt(){ const g=new THREE.Group(); g.add(cyl(.13,.13,2.05,M.nylon,12)); return g; }
export function buildCamPlate(){
  const g=new THREE.Group();
  if(CINE){ g.add(mesh(roundBox(.22,2.95,1.6,.05,3),M.alu)); for(const z of [-.4,.4]){ const c=cyl(.12,.12,.24,M.darkMetal,12); c.rotation.z=Math.PI/2; c.position.z=z; g.add(c); } }
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
export function buildTopPlate(){
  if(CINE) return buildTopPlateC();
  const g=new THREE.Group(), ts=rrShape(5.2,9.2,.6);
  strapSlots(ts,z=>-z);
  for(const x of [-2.35,2.35]) for(const z of [-4,0,4.2]) ts.holes.push(circHole(x,-z,.15));
  g.add(flatExtrude(ts,PLATE_T,M.carbonTop));
  batteryPad(g);
  return g;
}
/* model 2: longer, wider top plate with a TPU mount for the action camera at the front */
function buildTopPlateC(){
  const g=new THREE.Group(), cz=.5, ts=rrShape(6.2,12,.6), A=MODEL.alu, Y=z=>-(z-cz);
  strapSlots(ts,Y);
  for(const x of [-A,A]) for(const z of [-4,0,4.2]) ts.holes.push(circHole(x,Y(z),.15));
  for(const [x,z] of [[-1.6,-1.2],[1.6,-1.2]]) ts.holes.push(circHole(x,Y(z),.45));
  const pl=flatExtrude(ts,PLATE_T,M.carbonTop); pl.position.z=cz; g.add(pl);
  batteryPad(g);
  /* action-camera mount: soft TPU base with three prongs */
  const base=mesh(roundBox(3.4,.3,2.4,.1,4),M.tpu); base.position.set(0,.4,-3.7); g.add(base);
  for(const x of [-.32,0,.32]) g.add(box(.16,.75,.9,M.tpu,x,.9,-3.7));
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
export function buildStrap(){
  const g=new THREE.Group(), [W,H]=MODEL.bat, X=STRAP_X, top=H+.06+.05, bot=-PLATE_T-.05, w=W/2+.04;
  const pts=[[-X,bot],[0,bot-.02],[X,bot],[X,.6],[X-.05,top-.55],[w,top-.08],[w-.35,top],[0,top+.02],[-w+.35,top],[-w,top-.08],[-X+.05,top-.55],[-X,.6]];
  g.add(bandLoop(pts,.62,.07,[M.strapBand,M.strapGrip]));
  const bk=box(.95,.16,.74,M.darkMetal,.55,top+.08,0); g.add(bk);
  g.add(box(.6,.06,.5,M.black,.55,top+.17,0));
  const tail=box(1.5,.06,.6,M.strapBand,1.45,top+.13,0); tail.rotation.z=-.12; g.add(tail);
  return g;
}
/* TPU GPS mount: a printed tower at the rear that lifts the GPS above the battery, where the sky view is clear.
   GPS_TOP is where the GPS sits, from the mount's origin. */
export const GPS_TOP=CINE?V(0,2.15,.6):V(0,2.9,1.0);
export function buildGpsMount(){
  const g=new THREE.Group(), T=GPS_TOP;
  const base=mesh(roundBox(2.2,.3,1.1,.1,4),M.tpu); base.position.y=.15; g.add(base);
  for(const x of [-.65,.65]) g.add(rod(V(x,.2,0),V(x*.9,T.y-.2,T.z-.15),.2,M.tpu,10));
  g.add(rod(V(0,.25,.35),V(0,T.y-.25,T.z+.5),.16,M.tpu,10));
  const pl=mesh(roundBox(2.5,.25,2.5,.1,4),M.tpu); pl.position.set(0,T.y-.13,T.z); g.add(pl);
  for(const s of [-1,1]) g.add(box(2.5,.25,.12,M.tpu,0,T.y+.05,T.z+s*1.2));
  for(const x of [-.65,.65]){ const sc=cyl(.17,.17,.08,M.darkMetal,12); sc.position.set(x,.33,0); g.add(sc); }
  return g;
}
/* TPU camera mount: side cheeks outside the camera plates reach past the lens to protect it,
   a chin bar joins them under the lens, and tick marks show the uptilt angle */
export function buildCamMount(){
  const g=new THREE.Group();
  for(const s of [-1,1]){
    const ch=mesh(roundBox(.3,2.5,2.8,.12,4),M.tpu); ch.position.set(s*1.38,0,-.55); g.add(ch);
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
  const head=new THREE.Mesh(new THREE.ConeGeometry(.26*k,.62*k,16),mat);
  head.position.set(R2*Math.cos(arc),0,-R2*Math.sin(arc));
  head.quaternion.setFromUnitVectors(V(0,1,0),V(-Math.sin(arc),0,-Math.cos(arc)));
  g.add(head); t.renderOrder=head.renderOrder=7; t.userData.noStyle=head.userData.noStyle=true; g.userData.mat=mat; g.visible=false;
  return g;
}
export function buildMotor(){
  /* model 2 uses a bigger 2306 motor: wider bell (k) and a taller stator (hk) */
  const g=new THREE.Group(), k=CINE?1.2:1, hk=CINE?1.1:1;
  const base=cyl(1.06*k,1.12*k,.3,M.darkMetal,40); base.position.y=.15; g.add(base);
  const rot=new THREE.Group(); g.add(rot); g.userData.rot=rot;
  const bell=cyl(1.12*k,1.12*k,1.0*hk,M.bell,48); bell.position.y=.36+.5*hk; rot.add(bell);
  const band=cyl(1.135*k,1.135*k,.18,M.alu,48); band.position.y=.36+.76*hk; rot.add(band);
  const cap=cyl(.98*k,1.1*k,.1,M.bell,48); cap.position.y=.36+1.05*hk; rot.add(cap);
  for(let i=0;i<6;i++){ const v=box(.16,.03,.42,M.copper); const a=i/6*TAU; v.position.set(Math.cos(a)*.62*k,.36+1.105*hk,Math.sin(a)*.62*k); v.rotation.y=Math.PI/2-a; rot.add(v); }
  rot.add(box(.08,.5,.3,M.white,1.13*k,.8,0));
  for(const y of [.5,.68]){ const gr=cyl(1.126*k,1.126*k,.025,M.black,48); gr.position.y=y; rot.add(gr); }
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
  for(let k=0;k<3;k++){ const pv=new THREE.Group(); pv.rotation.y=k*TAU/3; const bl=mesh(geo,M.prop); bl.rotation.x=-.28*s; bl.position.y=.2; pv.add(bl); sp.add(pv); }
  const disc=new THREE.Mesh(new THREE.CircleGeometry(6.35,64),new THREE.MeshBasicMaterial({color:0xcfe6ee,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  disc.rotation.x=-Math.PI/2; disc.position.y=.22; disc.userData.noStyle=true; g.add(disc); g.userData.disc=disc;
  return g;
}
export function buildESC(){
  const g=new THREE.Group(); g.add(boardMesh(4,.18,4,M.pcbG,M.escTop));
  for(const sx of [-1,1]) for(const sz of [-1,1]) for(let i=0;i<3;i++) g.add(box(.42,.12,.3,M.black,sx*1.15,.24,sz*(.35+i*.38)));
  g.add(box(.5,.08,.5,M.black,.6,.22,-1.35));
  addPad(g,{key:'m1',label:'M1',net:'M1',pos:V(1.85,.2,.85),out:V(1,0,0),shape:'triple'});
  addPad(g,{key:'m2',label:'M2',net:'M2',pos:V(1.85,.2,-.85),out:V(1,0,0),shape:'triple'});
  addPad(g,{key:'m3',label:'M3',net:'M3',pos:V(-1.85,.2,.85),out:V(-1,0,0),shape:'triple'});
  addPad(g,{key:'m4',label:'M4',net:'M4',pos:V(-1.85,.2,-.85),out:V(-1,0,0),shape:'triple'});
  addPad(g,{key:'bp',label:'+',net:'VBAT+',pos:V(1.0,.2,1.75),out:V(0,0,1),shape:'big'});
  addPad(g,{key:'bn',label:'−',net:'VBAT-',pos:V(.35,.2,1.75),out:V(0,0,1),shape:'big'});
  addPad(g,{key:'fc',label:'HARNESS',need:'ESC',pos:V(-.35,.3,-1.55),out:V(0,1,0),shape:'plug'});
  smd(g,{w:4,d:4,y:.18,n:34,seed:7,avoid:[[.9,-1.35,1.4,1.35],[-1.4,-1.35,-.9,1.35],[.3,-1.65,.9,-1.05],[-.75,-1.8,.05,-1.3],[-.85,-.2,.85,.55]]});
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
  if(CINE){ /* model 2: LED strip on the front pads, digital video unit on UART 2 */
    P('c5','5V','5V',0,-1.6,F); P('cg','G','GND',.55,-1.6,F); P('led','LED','LED',1.1,-1.6,F);
    P('v9','9V','9V',1.6,-.9,Rt); P('vg','G','GND',1.6,-.45,Rt); P('t2','T2','T2',1.6,0,Rt); P('r2','R2','R2',1.6,.45,Rt);
  } else {
    P('c5','5V','5V',0,-1.6,F); P('cg','G','GND',.55,-1.6,F); P('cam','CAM','CAM',1.1,-1.6,F);
    P('v9','9V','9V',1.6,-.7,Rt); P('vg','G','GND',1.6,-.25,Rt); P('vtx','VTX','VTX',1.6,.2,Rt);
  }
  P('u15','5V','5V',-1.2,1.6,B); P('u1g','G','GND',-.65,1.6,B); P('t1','T1','T1',-.1,1.6,B); P('r1','R1','R1',.45,1.6,B);
  P('u35','5V','5V',-1.6,-.45,Lf); P('u3g','G','GND',-1.6,0,Lf); P('t3','T3','T3',-1.6,.45,Lf); P('r3','R3','R3',-1.6,.9,Lf);
  addPad(g,{key:'esc',label:'ESC',net:'ESC',pos:V(-.35,.28,-.95),out:V(0,1,0),shape:'socket'});
  smd(g,{w:3.6,d:3.6,y:.16,n:30,seed:13,avoid:[[-.55,-1.4,.55,.45],[.1,.25,1.15,1.3],[-.9,.55,-.35,1.1],[1.4,.55,1.8,1.45],[-.8,-1.2,.1,-.7]]});
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
  const ant=new THREE.Group(); ant.position.set(.65,.4,.9); ant.rotation.x=.75;
  const st=cyl(.06,.06,3,M.antenna,8); st.position.y=1.5; ant.add(st);
  const tp=mesh(new THREE.SphereGeometry(.34,16,10),M.antenna); tp.scale.y=.65; tp.position.y=3.05; ant.add(tp); g.add(ant);
  const F=V(0,0,-1);
  addPad(g,{key:'vin',label:'VIN',need:'9V',pos:V(-.5,.16,-.85),out:F});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(0,.16,-.85),out:F});
  addPad(g,{key:'vid',label:'VID',need:'VTX',pos:V(.5,.16,-.85),out:F});
  return g;
}
export function buildRX(){
  const g=new THREE.Group(); g.add(boardMesh(1.3,.12,1.6,M.pcbG,M.rxTop));
  g.add(box(.5,.1,.5,M.black,0,.17,.05));
  for(const s of [-1,1]){ const a=V(s*.3,.14,.75), d=V(s*.7,.25,1).normalize(); const b=a.clone().addScaledVector(d,1.9), c=a.clone().addScaledVector(d,2.6); g.add(rod(a,b,.04,M.antenna)); g.add(rod(b,c,.03,M.white)); }
  const F=V(0,0,-1);
  addPad(g,{key:'5v',label:'5V',need:'5V',pos:V(-.45,.14,-.68),out:F});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(-.15,.14,-.68),out:F});
  addPad(g,{key:'tx',label:'TX',need:'R1',pos:V(.15,.14,-.68),out:F});
  addPad(g,{key:'rx',label:'RX',need:'T1',pos:V(.45,.14,-.68),out:F});
  return g;
}
/* compact GPS: a thin black case with a ceramic patch antenna on top (the arrow points to the front),
   a built-in compass, a status LED and a 4-wire plug at the front */
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
  return g;
}
export function buildCap(){
  const g=new THREE.Group();
  const b=cyl(.38,.38,1.6,M.capBody,28); b.rotation.x=Math.PI/2; g.add(b);
  const st=mesh(new THREE.CylinderGeometry(.386,.386,1.5,24,1,true,Math.PI*1.5-.35,.7),M.capStripe); st.rotation.x=Math.PI/2; g.add(st);
  const top=cyl(.36,.36,.04,M.tin,24); top.rotation.x=Math.PI/2; top.position.z=.81; g.add(top);
  for(const x of [-.15,.15]) g.add(rod(V(x,0,-.8),V(x,0,-1.25),.03,M.tin));
  addPad(g,{key:'p',label:'+',need:'VBAT+',pos:V(.15,0,-1.3),out:V(0,1,0)});
  addPad(g,{key:'n',label:'−',need:'VBAT-',pos:V(-.15,0,-1.3),out:V(0,1,0)});
  return g;
}
export function buildLead(){
  const g=new THREE.Group();
  g.add(box(.9,.55,1.0,M.connector,0,0,.6));
  g.add(box(.94,.12,.3,M.connector,0,.3,.25));
  g.add(tube([V(.22,0,.1),V(.25,-.05,-1.2),V(.25,.25,-2.65)],.11,wireMat(0xd8453b)));
  g.add(tube([V(-.22,0,.1),V(-.25,-.05,-1.2),V(-.25,.25,-2.65)],.11,wireMat(0x2b2f35)));
  addPad(g,{key:'p',label:'+',need:'VBAT+',pos:V(.25,.25,-2.72),out:V(0,1,0)});
  addPad(g,{key:'n',label:'−',need:'VBAT-',pos:V(-.25,.25,-2.72),out:V(0,1,0)});
  const sock=new THREE.Object3D(); sock.position.set(0,0,1.12); g.add(sock); g.userData.socket=sock;
  return g;
}
export function buildBattery(){
  const g=new THREE.Group(), [W,H,L]=MODEL.bat;
  const b=new THREE.Mesh(roundBox(W,H,L,.28),[M.batSide,M.batSide,M.batEnd,M.batEnd,M.batEnd,M.batEnd]); b.position.y=H/2; b.castShadow=b.receiveShadow=true; g.add(b);
  const by=CINE?H*.83:2.15, bz=L/2+.12, cells=CINE?7:5, gap=CINE?.1:.12;
  g.add(box(.7,.3,.22,M.white,-1.0,by,bz));
  for(let i=0;i<cells;i++){ const x=-1.25+i*gap; g.add(tube([V(x,by,bz-.12),V(x,by+.3,bz-.32),V(x,by+.47,bz-.62)],.025,wireMat(i?0xd8453b:0x232528))); }
  const plug=new THREE.Object3D(); plug.position.set(1.0,CINE?H*.62:1.6,L/2+.05); g.add(plug); g.userData.plug=plug;
  return g;
}

/* ================= Model 2 (cinematic) parts ================= */
/* HD camera: digital sensor and a bigger lens. Its picture runs over the coax cable that comes with the video unit, so it has no wires of its own */
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
/* digital video unit: heatsink body, two antennas, and the coax cable forward to the HD camera */
function buildHDVTX(){
  const g=new THREE.Group();
  g.add(boardMesh(2.8,.14,2.8,M.pcbG,M.vtxTop));
  const body=mesh(roundBox(2.6,.6,2.4,.1,4),M.heatsink); body.position.set(0,.45,.15); g.add(body);
  for(let i=0;i<6;i++) g.add(box(2.4,.22,.1,M.heatsink,0,.85,-.85+i*.4));
  for(const s of [-1,1]){
    const ant=new THREE.Group(); ant.position.set(s*.85,.55,1.35); ant.rotation.set(1.05,0,-s*.35);
    const st=cyl(.05,.05,2.4,M.antenna,8); st.position.y=1.2; ant.add(st);
    const tp=cyl(.13,.13,.7,M.antenna,10); tp.position.y=2.6; ant.add(tp); g.add(ant);
  }
  const coax=new THREE.Group(); g.add(coax); g.userData.lead=coax;
  coax.add(tube([V(0,.2,-1.35),V(0,.12,-2.4),V(0,.15,-4.6),V(0,.45,-6.3),V(0,1.05,-6.9)],.045,M.black));
  const F=V(0,0,-1);
  addPad(g,{key:'vin',label:'VIN',need:'9V',pos:V(-.75,.16,-1.3),out:F});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(-.3,.16,-1.3),out:F});
  addPad(g,{key:'tx',label:'TX',need:'R2',pos:V(.3,.16,-1.3),out:F});
  addPad(g,{key:'rx',label:'RX',need:'T2',pos:V(.75,.16,-1.3),out:F});
  return g;
}
/* clear side panel between the plates */
export function buildPanel(){
  const g=new THREE.Group();
  const p=box(.1,2.75,9.4,M.panel); p.castShadow=false; p.userData.noEdges=true; g.add(p);
  for(const y of [-1.33,1.33]) g.add(box(.14,.1,9.4,M.black,0,y,0));
  return g;
}
/* LED strip on the inside of the right panel; its three wires leave from the front end */
export function buildLED(){
  const g=new THREE.Group();
  g.add(box(.06,.34,6.4,M.ledStrip));
  for(let i=0;i<10;i++){ const l=box(.07,.18,.24,M.led,-.03,0,-2.9+i*.64); l.castShadow=false; g.add(l); }
  for(const [k,l,need,z] of [['5v','5V','5V',-3.05],['g','G','GND',-2.75],['din','DIN','LED',-2.45]]){
    g.add(rod(V(-.03,-.1,z),V(-.3,-.1,z),.03,wireMat(need==='5V'?0xd8453b:need==='GND'?0x2b2f35:0x4fb06d)));
    addPad(g,{key:k,label:l,need,pos:V(-.35,-.1,z),out:V(-1,0,0)});
  }
  return g;
}
/* action camera for the cinematic footage; sits in the TPU prongs, lens to the front */
export function buildActionCam(){
  const g=new THREE.Group();
  const b=mesh(roundBox(5.8,4,2.6,.35),M.camShell); b.position.y=2; g.add(b);
  const lens=cyl(.95,1,.5,M.black,32); lens.rotation.x=Math.PI/2; lens.position.set(-1.45,2.4,-1.45); g.add(lens);
  const gl=cyl(.62,.62,.04,M.glass,32); gl.rotation.x=Math.PI/2; gl.position.set(-1.45,2.4,-1.72); g.add(gl);
  g.add(box(1.7,1.7,.06,M.black,1.4,2.3,-1.31));
  g.add(box(.9,.16,.5,M.tpu,1.6,4.05,0));
  const rec=box(.5,.5,.06,M.led,-2.3,3.4,-1.31); rec.castShadow=false; g.add(rec);
  return g;
}
