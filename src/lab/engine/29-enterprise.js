/* Drone Build Lab · Model 3 (EX-9 enterprise drone): parts, catalogue and mounting points.
   Built at real size in cm like the other models; droneRoot draws it at MODEL.scale so it fits the bench.
   Its parts are sealed modules that click in, so its build has no screws and no soldering. Each module has a cable with a keyed plug
   that goes into its own port on the flight controller (the Connect stage). */
import * as THREE from 'three';
import { ARM, ARM_ANG, DEG, MODEL, TAU, V, armPos } from './01-config.js';
import { exBatTex } from './03-textures.js';
import { M, std } from './04-materials.js';
import { addPad, boardMesh, box, cyl, mesh, rod, roundBox } from './05-geometry.js';
import { makeRing } from './06-builders.js';
import { LANG } from '../../lang.js';

const POD_TOP=31;                                        // top of the motor pods at the arm tips
export const EX_PROP_Y=POD_TOP+4.9;                      // top of the motor, where the prop sits
const propMat=new THREE.MeshPhysicalMaterial({color:0x1d2024,roughness:.4,side:THREE.DoubleSide,clearcoat:.4,clearcoatRoughness:.3});
const exBatTop=std({map:exBatTex,roughness:.5});
/* a module's cable plug (source) and a port on the flight controller (target), drawn at this model's size */
const PS=3.3, UP=V(0,1,0);
const plug=(g,key,label,need,pos,parent=g)=>addPad(g,{key,label,need,pos,out:UP,shape:'plug',s:PS},parent);
const facing=(g,dir)=>{ g.quaternion.setFromUnitVectors(V(0,0,1),dir.clone().normalize()); return g; };

/* ================= Builders ================= */
/* fuselage: the lower body shell that carries everything, with a tapered nose */
/* the fuselage seen from above: the nose tapers to the FPV camera, the tail corners are cut off. d shrinks the outline (for the bevelled edges) */
function hullShape(d){
  const sh=new THREE.Shape();
  [[7,-20.5],[10,-12.5],[10,12.6],[8.4,15],[-8.4,15],[-10,12.6],[-10,-12.5],[-7,-20.5]].forEach(([x,z],i)=>{
    const X=x-Math.sign(x)*d, Z=z<-15?z+d:z>14?z-d:z; i?sh.lineTo(X,-Z):sh.moveTo(X,-Z); });
  sh.closePath(); return sh;
}
function hull(y,h,b,mat,d=0){
  const geo=new THREE.ExtrudeGeometry(hullShape(b+d),{depth:h-2*b,bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3});
  geo.rotateX(-Math.PI/2); geo.translate(0,y+b,0); return mesh(geo,mat);
}
function buildBody(){
  const g=new THREE.Group();
  g.add(hull(21,9,1.4,M.shell));
  g.add(hull(27.2,.16,0,M.shellDark,-.05));                          // the seam where the upper and lower shells meet
  for(let i=0;i<3;i++) g.add(box(7,.28,.3,M.shellDark,0,22.7+i*.62,-20.45));   // air intake under the FPV camera
  /* power button on the tail, with a light ring */
  const pr=cyl(1.1,1.1,.2,M.ledGreen,24); pr.rotation.x=Math.PI/2; pr.position.set(5.6,23.2,15); pr.castShadow=false; g.add(pr);
  const pb=cyl(.85,.85,.3,M.shellDark,24); pb.rotation.x=Math.PI/2; pb.position.set(5.6,23.2,15.02); g.add(pb);
  /* battery bay floor and the divider between the two batteries */
  g.add(box(18,.4,15.4,M.shellDark,0,30.1,8.2));
  g.add(box(.6,2.4,15,M.shellDark,0,31.2,8.2));
  /* cooling vents along the sides */
  for(const s of [-1,1]) for(let i=0;i<6;i++) g.add(box(.2,.5,2.6,M.shellDark,s*10.02,23.2+i*.95,6));
  return g;
}
/* top shell over the electronics, with the payload/accessory port on top */
function buildCover(){
  const g=new THREE.Group();
  g.add(mesh(roundBox(19,3.6,15.4,1.6,6),M.shellLight));
  const port=mesh(roundBox(4.4,.6,2.6,.3,3),M.shellDark); port.position.set(0,2.05,5); g.add(port);
  for(let i=0;i<5;i++) g.add(box(.3,.12,1.4,M.gold,-1.2+i*.6,2.4,5));
  return g;
}
/* folding arm: root fairing on the body, folding joint with a lock sleeve, carbon tube, motor pod with an ESC inside and a light underneath */
function buildArmEX(){
  const g=new THREE.Group(), L=ARM;
  const root=mesh(roundBox(9,4.2,4.6,1.2,4),M.shell); root.position.set(13,27,0); g.add(root);
  const j=cyl(2.4,2.4,3.2,M.shellDark,24); j.rotation.z=Math.PI/2; j.position.set(18.6,27,0); g.add(j);
  const lock=cyl(2.5,2.5,.7,M.orange,24); lock.rotation.z=Math.PI/2; lock.position.set(19.6,27,0); g.add(lock);
  g.add(rod(V(20,27,0),V(L-3.4,28.4,0),1.55,M.carbon,20));
  plug(g,'esc','ESC','M?',V(11,29.4,0));   // the pod's ESC cable, plugs into the motor port with the arm's number
  const pod=cyl(3.8,3.4,5,M.shell,32); pod.position.set(L,28.5,0); g.add(pod);
  const ring=cyl(3.85,3.85,.5,M.shellDark,32); ring.position.set(L,30.7,0); g.add(ring);
  for(let i=0;i<16;i++){ const a=i/16*TAU, f=box(.5,3.4,.22,M.shellDark,L+Math.cos(a)*3.62,28.4,Math.sin(a)*3.62); f.rotation.y=-a; f.castShadow=false; g.add(f); }   // cooling fins for the ESC inside
  const led=cyl(1.2,1.2,.4,M.beaconRed,16); led.position.set(L,25.8,0); led.castShadow=false; g.add(led);
  return g;
}
/* landing gear leg (right side; the left one is the same part turned round): strut, foot bar, and the radio antennas inside the strut */
function buildGear(){
  const g0=new THREE.Group(), g=new THREE.Group(); g.position.x=-16; g0.add(g);   // origin at the foot, so each leg can have its own label
  const br=mesh(roundBox(4,2,6,.6,3),M.shellDark); br.position.set(7.5,20.6,0); g.add(br);
  for(const z of [-1.6,1.6]) g.add(rod(V(8,20.4,z),V(16,2.2,z*.6),1,M.carbon,14));
  g.add(rod(V(9.1,19,0),V(15.2,5.4,0),.28,M.white,8));
  const knee=mesh(roundBox(3,2.4,4,.8,3),M.shellDark); knee.position.set(16,2.2,0); g.add(knee);
  g.add(rod(V(16,1,-15),V(16,1,15),1,M.shellDark,16));
  for(const z of [-15,15]){ const c=cyl(1.15,1.15,1.2,M.black,16); c.rotation.x=Math.PI/2; c.position.set(16,1,z); g.add(c); }
  plug(g0,'ant','ANTENNA','ANT',V(7.5,21.9,2.6),g);   // antenna cable from the leg up into the body (registered on the leg's root)
  return g0;
}
/* flight controller: redundant IMUs (three motion sensors) and barometers, so one failed sensor cannot bring the drone down */
function buildFCEX(){
  const g=new THREE.Group(); g.add(boardMesh(10,.3,10,M.pcbB,M.pcbB));
  g.add(box(3,.5,3,M.black,0,.55,0));
  [[-3,-3],[3,-3],[-3,3]].forEach(([x,z],i)=>{ const c=mesh(roundBox(1.8,.9,1.8,.2,2),i===2?M.steel:M.darkMetal); c.position.set(x,.75,z); g.add(c); });
  for(const x of [3,1.6]){ const b=cyl(.5,.5,.6,M.steel,16); b.position.set(x,.6,3); g.add(b); }
  /* keyed ports round the edge: motors and antennas on the sides, cameras at the front, the rest at the back */
  const port=(key,net,x,z,out)=>addPad(g,{key,label:net,net,pos:V(x,.65,z),out,shape:'port',s:1.15});
  const L=V(-1,0,0), R=V(1,0,0), F=V(0,0,-1), B=V(0,0,1);
  port('m4','M4',-4.4,-2.8,L); port('antL','ANT',-4.4,0,L); port('m3','M3',-4.4,2.8,L);
  port('m2','M2',4.4,-2.8,R); port('antR','ANT',4.4,0,R); port('m1','M1',4.4,2.8,R);
  port('fpv','FPV',-2.5,-4.4,F); port('gmb','GMB',2.5,-4.4,F);
  port('rtk','RTK',-3,4.4,B); port('vis','VIS',0,4.4,B); port('lgt','LGT',3,4.4,B);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.7,1.6,3),M.white); arrow.rotation.x=-Math.PI/2; arrow.position.set(0,.4,-3); g.add(arrow);
  return g;
}
/* first-person camera in the nose, for the pilot's live view (the gimbal camera does the inspection work) */
function buildFPVEX(){
  const g=new THREE.Group();
  g.add(mesh(roundBox(3.4,2.8,1.2,.4,3),M.shellDark));
  const l=cyl(.85,.9,.8,M.black,24); l.rotation.x=Math.PI/2; l.position.z=-.9; g.add(l);
  const gl=cyl(.6,.6,.05,M.lensBlack,24); gl.rotation.x=Math.PI/2; gl.position.z=-1.32; g.add(gl);
  plug(g,'vid','FPV','FPV',V(0,1.75,.4));
  return g;
}
/* three-axis gimbal with a zoom camera, a wide camera, a thermal camera and a laser rangefinder, on a quick-release mount */
function buildGimbal(){
  const g=new THREE.Group();
  const qr=cyl(3,3,1,M.shellDark,32); qr.position.y=-.5; g.add(qr);
  g.add(box(1,.5,1,M.orange,2.6,-.6,-1.6));
  const yaw=cyl(2.2,2.2,2,M.shell,32); yaw.position.y=-2; g.add(yaw);
  g.add(box(6.8,1.2,2,M.shell,2.9,-3,0));
  g.add(box(1.2,6.6,2,M.shell,5.8,-6.3,0));
  const pm=cyl(1.7,1.7,1,M.shellDark,24); pm.rotation.z=Math.PI/2; pm.position.set(5.0,-9,0); g.add(pm);
  const pod=mesh(roundBox(8.4,6.6,6.8,1.8,5),M.shellDark); pod.position.set(0,-9,0); g.add(pod);
  const lens=(x,y,r,m)=>{ const c=cyl(r+.25,r+.25,.5,M.black,32); c.rotation.x=Math.PI/2; c.position.set(x,y,-3.55); g.add(c); const gl=cyl(r,r,.06,m,32); gl.rotation.x=Math.PI/2; gl.position.set(x,y,-3.82); g.add(gl); };
  lens(-1.9,-8.1,1.6,M.lensBlack); lens(1.8,-7.6,.85,M.lensBlack); lens(1.8,-10.2,1.15,std({color:0x3b3326,roughness:.15,metalness:.6}));
  g.add(box(1.6,1,.3,M.lensBlack,-1.9,-10.9,-3.5));
  plug(g,'gmb','GIMBAL','GMB',V(0,.35,2.4));
  return g;
}
/* RTK module: two satellite antennas on folding masts. Two antennas 16 cm apart also measure the heading, without a compass */
function buildRTK(){
  const g=new THREE.Group();
  const base=mesh(roundBox(18,1.2,5,.5,3),M.shellDark); base.position.y=.6; g.add(base);
  for(const x of [-8,8]){
    const h=mesh(roundBox(1.8,1.8,1.8,.4,2),M.shell); h.position.set(x,1.8,0); g.add(h);
    g.add(rod(V(x,2.4,0),V(x,11,0),.55,M.shellDark,12));
    const ant=cyl(3.2,3.2,1.4,M.shellLight,32); ant.position.set(x,11.6,0); g.add(ant);
    const dome=mesh(new THREE.SphereGeometry(3.2,32,12,0,TAU,0,Math.PI/2),M.shellLight); dome.scale.y=.3; dome.position.set(x,12.3,0); g.add(dome);
  }
  plug(g,'rtk','RTK','RTK',V(0,1.5,1.9));
  return g;
}
/* obstacle sensing: a pair of vision cameras on every side (they see depth like two eyes), plus a time-of-flight sensor next to each pair */
function buildVision(){
  const g=new THREE.Group();
  const pair=(pos,dir,gap=4.5)=>{ const p=new THREE.Group();
    p.add(mesh(roundBox(gap+3,1.8,.3,.3,3),M.shellDark));
    for(const s of [-1,1]){ const l=cyl(.8,.8,.25,M.lensBlack,24); l.rotation.x=Math.PI/2; l.position.set(s*gap/2,0,.2); p.add(l); }
    p.add(box(.7,.7,.1,M.lensBlack,0,0,.2));
    p.position.copy(pos); g.add(facing(p,dir)); };
  pair(V(0,26.6,-20.45),V(0,0,-1),7.5); pair(V(0,25.5,15.05),V(0,0,1));
  for(const s of [-1,1]) pair(V(s*10.05,25.5,-5),V(s,0,0),6);
  pair(V(0,33.45,-12.6),V(0,1,0)); pair(V(0,20.95,5),V(0,-1,0));
  plug(g,'vis','SENSORS','VIS',V(0,30.4,-13));
  return g;
}
/* lights: a red anti-collision beacon on top and underneath, and a white auxiliary light that helps the downward sensors in the dark */
function buildLights(){
  const g=new THREE.Group();
  const b=cyl(1.1,1.3,.6,M.shellDark,20); b.position.set(0,33.7,-1.6); g.add(b);
  const d=mesh(new THREE.SphereGeometry(1,20,10,0,TAU,0,Math.PI/2),M.beaconRed); d.position.set(0,34,-1.6); d.castShadow=false; g.add(d);
  const bb=mesh(new THREE.SphereGeometry(.9,20,10,0,TAU,Math.PI/2,Math.PI/2),M.beaconRed); bb.position.set(0,21,-3); bb.castShadow=false; g.add(bb);
  const aux=cyl(1.5,1.5,.3,M.lampWhite,24); aux.position.set(0,20.9,11); aux.castShadow=false; g.add(aux);
  plug(g,'lgt','LIGHTS','LGT',V(0,33.7,-.1));
  return g;
}
function buildMotorEX(){
  const g=new THREE.Group();
  const base=cyl(3.2,3.4,1,M.darkMetal,40); base.position.y=.5; g.add(base);
  const rot=new THREE.Group(); g.add(rot); g.userData.rot=rot;
  const bell=cyl(3.4,3.4,2.6,M.bell,48); bell.position.y=2.3; rot.add(bell);
  for(let i=0;i<12;i++){ const a=i/12*TAU, v=box(.35,1.6,.5,M.black); v.position.set(Math.cos(a)*3.38,2.3,Math.sin(a)*3.38); v.rotation.y=-a; rot.add(v); }
  const cap=cyl(2.9,3.3,.4,M.bell,48); cap.position.y=3.8; rot.add(cap);
  const ad=cyl(1.1,1.3,1,M.alu,24); ad.position.y=4.4; rot.add(ad);
  const ring=makeRing(5,2.4); ring.position.y=5.6; g.add(ring); g.userData.ring=ring;
  return g;
}
/* 21-inch folding two-blade propeller. CW and CCW blades are mirror images */
function buildPropEX(dir){
  const s=dir==='CW'?1:-1, g=new THREE.Group(), sp=new THREE.Group(); g.add(sp); g.userData.spinner=sp; g.userData.dir=dir;
  const hub=cyl(1.4,1.5,1.2,M.shellDark,24); hub.position.y=.6; sp.add(hub);
  const sh=new THREE.Shape(), P=(x,y)=>[x,y*s];
  sh.moveTo(...P(1.6,-1.1)); sh.bezierCurveTo(...P(6,-2.6),...P(17,-2.2),...P(26.2,-.7));
  sh.quadraticCurveTo(...P(26.9,.1),...P(25.9,.7)); sh.bezierCurveTo(...P(17,1.5),...P(7,1.7),...P(1.6,.9)); sh.lineTo(...P(1.6,-1.1));
  const geo=new THREE.ExtrudeGeometry(sh,{depth:.22,bevelEnabled:false,curveSegments:14}); geo.rotateX(-Math.PI/2); geo.translate(0,-.11,0);
  for(let k=0;k<2;k++){ const pv=new THREE.Group(); pv.rotation.y=k*Math.PI;
    const hinge=box(1.4,.9,1.6,M.darkMetal,1.7,.6,0); pv.add(hinge);
    const bl=mesh(geo,dir==='CW'?M.propCW:M.propCCW); bl.rotation.x=-.16*s; bl.position.y=.6; pv.add(bl);
    const tip=box(.9,.24,.9,M.orange,25.3,.6,.15*s); pv.add(tip); sp.add(pv); }
  return g;
}
/* smart flight battery: slides into a bay at the rear; two batteries let you swap one while the drone stays powered */
function buildBatteryEX(){
  const g=new THREE.Group(), [W,H,L]=MODEL.bat;
  const b=new THREE.Mesh(roundBox(W,H,L,.8,6),[M.shellLight,M.shellLight,exBatTop,M.shellLight,M.shellLight,M.shellLight]); b.position.y=H/2; b.castShadow=b.receiveShadow=true; g.add(b);
  g.add(box(W-2.4,.5,1.6,M.shellDark,0,H+.15,-L/2+2));
  for(let i=0;i<4;i++){ const l=box(.6,.3,.12,M.ledGreen,-1.5+i*1,H*.62,L/2+.02); l.castShadow=false; g.add(l); }
  const btn=cyl(.45,.45,.15,M.shellDark,16); btn.rotation.x=Math.PI/2; btn.position.set(2.4,H*.62,L/2+.05); g.add(btn);
  return g;
}

/* ================= Catalogue ================= */
export const EX_TYPES={
  body:{name:'Fuselage',count:1,where:'in the centre of the mat',build:buildBody,lab:V(-3.4,6.6,3),
    role:'The main body. It carries the arms, the landing gear, the battery bay and all the electronics, sealed against dust and rain.',links:'Arms clip into its sides; the landing gear bolts underneath; the batteries slide into the bay at the rear.',spec:'Magnesium and composite shell · weather-sealed (dust and rain resistant)'},
  arm:{name:'Folding arm',count:4,where:'on a joint at the side of the fuselage',build:buildArmEX,
    role:'Holds a motor 45 cm from the centre. The arm folds back for transport and locks open with a sleeve. Each motor pod has its own ESC (speed controller) close to the motor, and a light underneath.',links:'Folding joint on the fuselage; power and signal wires run inside the carbon tube to the ESC in the pod.',spec:'Carbon fibre tube · 895 mm wheelbase (motor to motor, diagonal)'},
  gear:{name:'Landing gear',count:2,where:'under the fuselage',build:buildGear,lab:V(0,1.2,0),
    role:'Keeps the gimbal camera off the ground for take-off and landing. The radio antennas for the remote link are built into the legs, low and well apart.',links:'Bolts to the bottom of the fuselage. Antenna cables run up into the body.',spec:'Carbon struts · two antennas in each leg for the long-range video and control link'},
  fc:{name:'Flight controller',count:1,where:'inside the body, before the top shell goes on',build:buildFCEX,ex:V(0,13,0),lab:V(0,1.2,0),
    role:'The FC (flight controller) is the brain. It has three IMUs (motion sensors) and two barometers (height sensors). If one sensor fails, the FC compares them, ignores the faulty one and keeps flying.',links:'Every ESC, both batteries, the RTK and satellite receivers, the obstacle sensors, the gimbal and the radio link.',spec:'Three IMUs · two barometers · the printed arrow points to the front'},
  cover:{name:'Top shell',count:1,where:'on top of the body, over the flight controller',build:buildCover,ex:V(0,24,0),lab:V(0,1.6,0),
    role:'Closes the body over the flight controller. The connector on top is a payload port for extra equipment such as a loudspeaker or a spotlight.',links:'Clips onto the fuselage. The payload port is wired to the flight controller.',spec:'Accessory port: power and data for an extra payload'},
  motor:{name:'Brushless motor',count:4,where:'on a motor pod at an arm tip',build:buildMotorEX,lab:V(0,2.6,0),
    role:'A large, slow-turning motor for big propellers. It is more efficient than a small, fast motor, so the drone can fly for about 45 minutes.',links:'Three phase wires to the ESC inside its motor pod.',spec:'Outer-rotor motor · about 130 KV (rpm per volt) · cooling slots in the bell'},
  camera:{name:'FPV camera',count:1,where:'in the nose',build:buildFPVEX,ex:V(0,0,-8),lab:V(0,1.3,0),
    role:'A small forward camera that gives the pilot a live view for flying (FPV: first-person view). The gimbal camera is then free to point wherever the inspection needs.',links:'Video to the flight controller and the radio link.',spec:'Fixed, wide-angle, low delay'},
  gimbal:{name:'Gimbal camera',count:1,where:'on the quick-release mount under the nose',build:buildGimbal,ex:V(0,-5,-12),lab:V(0,-1.2,-2.2),
    role:'The inspection camera. Three motors keep it steady while the drone moves. It combines a zoom camera, a wide camera, a thermal camera that sees heat, and a laser rangefinder that measures distance.',links:'Quick-release mount under the nose (orange button) for power, video and control.',spec:'3-axis stabiliser (gimbal) · zoom, wide and thermal cameras · laser rangefinder'},
  rtk:{name:'RTK module',count:1,where:'on top of the top shell',build:buildRTK,ex:V(0,32,0),lab:V(0,4.6,0),
    role:'RTK (real-time kinematic) corrects satellite positioning with data from a ground station. Accuracy is about 1 cm instead of about 1 m. Its two antennas also tell the drone which way it faces, so it does not need a compass near steel structures.',links:'Plugs into the top of the body; uses the radio link to receive corrections.',spec:'Two GNSS (satellite) antennas on folding masts · centimetre-level position'},
  vision:{name:'Obstacle sensors',count:1,where:'around the body, one pair on each side',build:buildVision,lab:V(0,8.2,-6.6),
    role:'Pairs of cameras on all six sides see depth, like two eyes. A time-of-flight sensor (the small square window) measures distance with invisible light. The drone brakes or steers around obstacles.',links:'Wired to the flight controller.',spec:'Six directions · dual vision + time-of-flight · senses obstacles up to about 40 m'},
  lights:{name:'Beacons and lights',count:1,where:'on top of and underneath the body',build:buildLights,lab:V(0,10.8,-.5),
    role:'Red anti-collision beacons on top and underneath make the drone visible to aircraft and people. The white light underneath helps the downward sensors land in the dark.',links:'Powered by the flight controller.',spec:'Anti-collision beacons · downward auxiliary light'},
  battery:{name:'Smart battery',count:2,where:'in the battery bay at the rear',build:buildBatteryEX,ex:V(0,14,0),lab:V(0,2.4,0),
    role:'Two batteries share the load. Either one can power the drone alone, so you can change one without switching off (hot swap). Each battery reports its charge, temperature and health.',links:'Slides into the rear bay and locks; the connector at its base plugs into the body.',spec:'12S (twelve cells in series) · 52.8 V when full · 5935 mAh each · heats itself in cold weather'},
  propCW:{name:'Propeller, CW',count:2,where:'on a motor that spins clockwise',build:()=>buildPropEX('CW'),lab:V(0,.9,0),
    role:'Big, slow two-blade propeller. Pushes air down when it turns clockwise (CW), seen from above. Folds for transport.',links:'Clamps onto a motor that spins clockwise.',spec:'21 inch (53 cm) · two folding blades'},
  propCCW:{name:'Propeller, CCW',count:2,where:'on a motor that spins counter-clockwise',build:()=>buildPropEX('CCW'),lab:V(0,.9,0),
    role:'Mirror image of the CW propeller. Pushes air down when it turns counter-clockwise (CCW), seen from above.',links:'Clamps onto a motor that spins counter-clockwise.',spec:'21 inch (53 cm) · two folding blades'},
  frame:{name:'Folding airframe',role:'A sealed body with four folding carbon arms. Everything is a module that clicks in, so the drone is serviced by swapping parts, not by soldering.',links:'Arms, landing gear, batteries, gimbal and RTK all attach with quick-release connectors.',spec:'895 mm wheelbase · about 6.3 kg take-off weight · up to 9 kg'},
};
/* Bahasa Malaysia: same fields, swapped in when the page language is BM */
if(LANG==='ms') Object.entries({
  body:{name:'Fiuslaj',where:'di tengah alas',role:'Badan utama. Ia membawa lengan, gear pendaratan, ruang bateri dan semua elektronik, kedap terhadap debu dan hujan.',links:'Lengan dikancingkan ke sisinya; gear pendaratan diskru di bawah; bateri disorong ke dalam ruang di belakang.',spec:'Cangkerang magnesium dan komposit · kedap cuaca (tahan debu dan hujan)'},
  arm:{name:'Lengan lipat',where:'pada sendi di sisi fiuslaj',role:'Memegang motor 45 cm dari tengah. Lengan dilipat ke belakang untuk dibawa dan dikunci terbuka dengan sarung. Setiap pod motor mempunyai ESC (pengawal kelajuan) sendiri berdekatan motor, dan lampu di bawahnya.',links:'Sendi lipat pada fiuslaj; wayar kuasa dan isyarat melalui tiub karbon ke ESC di dalam pod.',spec:'Tiub gentian karbon · jarak roda 895 mm (motor ke motor, pepenjuru)'},
  gear:{name:'Gear pendaratan',where:'di bawah fiuslaj',role:'Menjauhkan kamera gimbal dari tanah semasa berlepas dan mendarat. Antena radio untuk pautan alat kawalan terbina dalam kaki, rendah dan berjauhan.',links:'Diskru ke bahagian bawah fiuslaj. Kabel antena naik ke dalam badan.',spec:'Topang karbon · dua antena dalam setiap kaki untuk pautan video dan kawalan jarak jauh'},
  fc:{name:'Pengawal penerbangan',where:'di dalam badan, sebelum cangkerang atas dipasang',role:'FC (pengawal penerbangan) ialah otak dron. Ia mempunyai tiga IMU (penderia gerakan) dan dua barometer (penderia ketinggian). Jika satu penderia rosak, FC membandingkannya, mengabaikan yang rosak dan terus terbang.',links:'Setiap ESC, kedua-dua bateri, penerima RTK dan satelit, penderia halangan, gimbal dan pautan radio.',spec:'Tiga IMU · dua barometer · anak panah bercetak menghala ke depan'},
  cover:{name:'Cangkerang atas',where:'di atas badan, di atas pengawal penerbangan',role:'Menutup badan di atas pengawal penerbangan. Penyambung di atas ialah port muatan untuk peralatan tambahan seperti pembesar suara atau lampu sorot.',links:'Dikancingkan pada fiuslaj. Port muatan didawaikan ke pengawal penerbangan.',spec:'Port aksesori: kuasa dan data untuk muatan tambahan'},
  motor:{name:'Motor tanpa berus',where:'pada pod motor di hujung lengan',role:'Motor besar yang berputar perlahan untuk kipas besar. Ia lebih cekap daripada motor kecil yang laju, jadi dron boleh terbang selama kira-kira 45 minit.',links:'Tiga wayar fasa ke ESC di dalam pod motornya.',spec:'Motor rotor luar · kira-kira 130 KV (rpm setiap volt) · alur penyejukan pada loceng'},
  camera:{name:'Kamera FPV',where:'di muncung',role:'Kamera kecil menghadap ke depan yang memberi juruterbang paparan langsung untuk terbang (FPV: pandangan orang pertama). Kamera gimbal pula bebas menghala ke mana-mana yang diperlukan untuk pemeriksaan.',links:'Video ke pengawal penerbangan dan pautan radio.',spec:'Tetap, sudut lebar, kelewatan rendah'},
  gimbal:{name:'Kamera gimbal',where:'pada pemegang lepas-cepat di bawah muncung',role:'Kamera pemeriksaan. Tiga motor memastikannya stabil semasa dron bergerak. Ia menggabungkan kamera zum, kamera lebar, kamera terma yang melihat haba, dan pencari jarak laser yang mengukur jarak.',links:'Pemegang lepas-cepat di bawah muncung (butang oren) untuk kuasa, video dan kawalan.',spec:'Penstabil 3 paksi (gimbal) · kamera zum, lebar dan terma · pencari jarak laser'},
  rtk:{name:'Modul RTK',where:'di atas cangkerang atas',role:'RTK (kinematik masa nyata) membetulkan kedudukan satelit dengan data dari stesen bumi. Ketepatannya kira-kira 1 cm berbanding kira-kira 1 m. Dua antenanya juga memberitahu dron arah yang dihadapinya, jadi ia tidak memerlukan kompas berhampiran struktur keluli.',links:'Dipalamkan ke bahagian atas badan; menggunakan pautan radio untuk menerima pembetulan.',spec:'Dua antena GNSS (satelit) pada tiang lipat · kedudukan tahap sentimeter'},
  vision:{name:'Penderia halangan',where:'di sekeliling badan, sepasang pada setiap sisi',role:'Pasangan kamera pada keenam-enam sisi melihat kedalaman, seperti dua mata. Penderia masa penerbangan (tingkap segi empat kecil) mengukur jarak dengan cahaya yang tidak kelihatan. Dron membrek atau mengelak halangan.',links:'Didawaikan ke pengawal penerbangan.',spec:'Enam arah · penglihatan dwi + masa penerbangan · mengesan halangan sehingga kira-kira 40 m'},
  lights:{name:'Lampu suar dan lampu',where:'di atas dan di bawah badan',role:'Lampu suar antiperlanggaran merah di atas dan di bawah menjadikan dron kelihatan kepada pesawat dan orang. Lampu putih di bawah membantu penderia bawah mendarat dalam gelap.',links:'Dikuasakan oleh pengawal penerbangan.',spec:'Lampu suar antiperlanggaran · lampu bantu ke bawah'},
  battery:{name:'Bateri pintar',where:'di dalam ruang bateri di belakang',role:'Dua bateri berkongsi beban. Mana-mana satu boleh menguasakan dron sendirian, jadi anda boleh menukar satu tanpa mematikan dron (tukar-panas). Setiap bateri melaporkan cas, suhu dan tahap kesihatannya.',links:'Disorong ke dalam ruang belakang dan dikunci; penyambung di tapaknya dipalamkan ke badan.',spec:'12S (dua belas sel bersiri) · 52.8 V apabila penuh · 5935 mAh setiap satu · memanaskan diri dalam cuaca sejuk'},
  propCW:{name:'Kipas, CW',where:'pada motor yang berputar ikut arah jam',role:'Kipas dua bilah yang besar dan perlahan. Menolak udara ke bawah apabila berputar ikut arah jam (CW), dilihat dari atas. Boleh dilipat untuk dibawa.',links:'Diapit pada motor yang berputar ikut arah jam.',spec:'21 inci (53 cm) · dua bilah lipat'},
  propCCW:{name:'Kipas, CCW',where:'pada motor yang berputar lawan arah jam',role:'Bayangan cermin kipas CW. Menolak udara ke bawah apabila berputar lawan arah jam (CCW), dilihat dari atas.',links:'Diapit pada motor yang berputar lawan arah jam.',spec:'21 inci (53 cm) · dua bilah lipat'},
  frame:{name:'Rangka udara lipat',role:'Badan kedap dengan empat lengan karbon yang boleh dilipat. Semuanya modul yang dikancingkan, jadi dron diselenggara dengan menukar bahagian, bukan dengan memateri.',links:'Lengan, gear pendaratan, bateri, gimbal dan RTK semuanya dipasang dengan penyambung lepas-cepat.',spec:'Jarak roda 895 mm · berat berlepas kira-kira 6.3 kg · sehingga 9 kg'},
}).forEach(([k,o])=>Object.assign(EX_TYPES[k],o));

export function exHot(){
  const B=MODEL.bat;
  return [
    {id:'body',type:'body',stage:'frame',pos:V(0,0,0),label:'Centre',mk:V(0,25.5,0)},
    ...[1,2,3,4].map(n=>({id:'arm'+n,type:'arm',stage:'frame',pos:V(0,0,0),rotY:ARM_ANG[n]*DEG,motor:n,requires:'body',label:'Arm '+n,mk:armPos(n,19).setY(27)})),
    ...[1,2].map(i=>({id:'gear'+i,type:'gear',stage:'frame',pos:V(i===1?16:-16,0,0),rotY:i===1?0:Math.PI,requires:'body',label:i===1?'Right leg':'Left leg',mk:V(0,1.5,0)})),
    {id:'fc',type:'fc',stage:'mount',pos:V(0,27,-4),label:'Inside the body'},
    {id:'cover',type:'cover',stage:'mount',pos:V(0,31.6,-7),requires:'fc',label:'Top of the body'},
    ...[1,2,3,4].map(n=>({id:'mot'+n,type:'motor',stage:'mount',pos:armPos(n).setY(POD_TOP),rotY:ARM_ANG[n]*DEG,motor:n,requires:'arm'+n,label:'Motor pod '+n})),
    {id:'cam',type:'camera',stage:'mount',pos:V(0,26.2,-21.3),label:'Nose'},
    {id:'gimbal',type:'gimbal',stage:'mount',pos:V(0,21,-12),label:'Under the nose'},
    {id:'rtk',type:'rtk',stage:'mount',pos:V(0,33.4,-8),requires:'cover',label:'On top'},
    {id:'vision',type:'vision',stage:'mount',pos:V(0,0,0),requires:'body',label:'All sides',mk:V(0,26.6,-20.6)},
    {id:'lights',type:'lights',stage:'mount',pos:V(0,0,0),requires:'cover',label:'Top and bottom',mk:V(0,34.5,-1.6)},
    {id:'bat',type:'battery',stage:'power',pos:V(-B[0]/2-.4,30.3,MODEL.batZ),label:'Battery bay, left'},
    {id:'bat2',type:'battery',stage:'power',pos:V(B[0]/2+.4,30.3,MODEL.batZ),label:'Battery bay, right'},
    ...[1,2,3,4].map(n=>({id:'prop'+n,type:'prop',stage:'props',pos:armPos(n).setY(EX_PROP_Y),motor:n,label:'Motor '+n})),
  ];
}
