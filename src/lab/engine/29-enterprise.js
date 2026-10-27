/* Drone Build Lab · Model 3 (EX-9 enterprise drone): parts, catalogue and mounting points.
   Built at real size in cm like the other models; droneRoot draws it at MODEL.scale so it fits the bench.
   Its parts are sealed modules, so it is offered in Explore and Movements only (no screws, no wiring). */
import * as THREE from 'three';
import { ARM, ARM_ANG, DEG, MODEL, TAU, V, armPos } from './01-config.js';
import { exBatTex } from './03-textures.js';
import { M, std } from './04-materials.js';
import { boardMesh, box, cyl, mesh, rod, roundBox } from './05-geometry.js';
import { makeRing } from './06-builders.js';

const POD_TOP=31;                                        // top of the motor pods at the arm tips
export const EX_PROP_Y=POD_TOP+4.9;                      // top of the motor, where the prop sits
const propMat=new THREE.MeshPhysicalMaterial({color:0x1d2024,roughness:.4,side:THREE.DoubleSide,clearcoat:.4,clearcoatRoughness:.3});
const exBatTop=std({map:exBatTex,roughness:.5});
const facing=(g,dir)=>{ g.quaternion.setFromUnitVectors(V(0,0,1),dir.clone().normalize()); return g; };

/* ================= Builders ================= */
/* fuselage: the lower body shell that carries everything, with a tapered nose */
function buildBody(){
  const g=new THREE.Group();
  const b=mesh(roundBox(20,9,30,2.6,6),M.shell); b.position.set(0,25.5,0); g.add(b);
  const n=mesh(roundBox(14,7.5,7,2.4,6),M.shell); n.position.set(0,25.4,-17); g.add(n);
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
  const pod=cyl(3.8,3.4,5,M.shell,32); pod.position.set(L,28.5,0); g.add(pod);
  const ring=cyl(3.85,3.85,.5,M.shellDark,32); ring.position.set(L,30.7,0); g.add(ring);
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
  return g0;
}
/* flight controller: redundant IMUs (three motion sensors) and barometers, so one failed sensor cannot bring the drone down */
function buildFCEX(){
  const g=new THREE.Group(); g.add(boardMesh(10,.3,10,M.pcbB,M.pcbB));
  g.add(box(3,.5,3,M.black,0,.55,0));
  [[-3,-3],[3,-3],[-3,3]].forEach(([x,z],i)=>{ const c=mesh(roundBox(1.8,.9,1.8,.2,2),i===2?M.steel:M.darkMetal); c.position.set(x,.75,z); g.add(c); });
  for(const x of [3,1.6]){ const b=cyl(.5,.5,.6,M.steel,16); b.position.set(x,.6,3); g.add(b); }
  for(let i=0;i<4;i++) g.add(box(1.6,.6,.7,M.nylon,-3.5+i*2.3,.6,-4.4));
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.7,1.6,3),M.white); arrow.rotation.x=-Math.PI/2; arrow.position.set(0,.4,-3); g.add(arrow);
  return g;
}
/* first-person camera in the nose, for the pilot's live view (the gimbal camera does the inspection work) */
function buildFPVEX(){
  const g=new THREE.Group();
  g.add(mesh(roundBox(3.4,2.8,1.2,.4,3),M.shellDark));
  const l=cyl(.85,.9,.8,M.black,24); l.rotation.x=Math.PI/2; l.position.z=-.9; g.add(l);
  const gl=cyl(.6,.6,.05,M.lensBlack,24); gl.rotation.x=Math.PI/2; gl.position.z=-1.32; g.add(gl);
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
  return g;
}
/* lights: a red anti-collision beacon on top and underneath, and a white auxiliary light that helps the downward sensors in the dark */
function buildLights(){
  const g=new THREE.Group();
  const b=cyl(1.1,1.3,.6,M.shellDark,20); b.position.set(0,33.7,-1.6); g.add(b);
  const d=mesh(new THREE.SphereGeometry(1,20,10,0,TAU,0,Math.PI/2),M.beaconRed); d.position.set(0,34,-1.6); d.castShadow=false; g.add(d);
  const bb=mesh(new THREE.SphereGeometry(.9,20,10,0,TAU,Math.PI/2,Math.PI/2),M.beaconRed); bb.position.set(0,21,-3); bb.castShadow=false; g.add(bb);
  const aux=cyl(1.5,1.5,.3,M.lampWhite,24); aux.position.set(0,20.9,11); aux.castShadow=false; g.add(aux);
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
    const bl=mesh(geo,propMat); bl.rotation.x=-.16*s; bl.position.y=.6; pv.add(bl);
    const tip=box(.9,.24,.9,M.orange,25.3,.6,.15*s); pv.add(tip); sp.add(pv); }
  const disc=new THREE.Mesh(new THREE.CircleGeometry(MODEL.propR,72),new THREE.MeshBasicMaterial({color:0xcfe6ee,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  disc.rotation.x=-Math.PI/2; disc.position.y=.62; disc.userData.noStyle=true; g.add(disc); g.userData.disc=disc;
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
  body:{name:'Fuselage',count:1,build:buildBody,lab:V(-3.4,6.6,3),
    role:'The main body. It carries the arms, the landing gear, the battery bay and all the electronics, sealed against dust and rain.',links:'Arms clip into its sides; the landing gear bolts underneath; the batteries slide into the bay at the rear.',spec:'Magnesium and composite shell · weather-sealed (dust and rain resistant)'},
  arm:{name:'Folding arm',count:4,build:buildArmEX,
    role:'Holds a motor 45 cm from the centre. The arms fold back for transport and lock open with a sleeve. Each motor pod has its own ESC inside, close to the motor, with a light underneath.',links:'Folding joint on the fuselage; power and signal wires run inside the carbon tube to the ESC in the pod.',spec:'Carbon fibre tube · 895 mm wheelbase (motor to motor, diagonal)'},
  gear:{name:'Landing gear',count:2,build:buildGear,lab:V(0,1.2,0),
    role:'Keeps the gimbal camera off the ground for take-off and landing. The radio antennas for the remote link are built into the legs, low and well apart.',links:'Bolts to the bottom of the fuselage. Antenna cables run up into the body.',spec:'Carbon struts · two antennas in each leg for the long-range video and control link'},
  fc:{name:'Flight controller',count:1,build:buildFCEX,ex:V(0,13,0),lab:V(0,1.2,0),
    role:'The brain. It has three motion sensors (IMUs) and two barometers. If one sensor fails, the controller compares them, ignores the faulty one and keeps flying.',links:'Every ESC, both batteries, the RTK and satellite receivers, the obstacle sensors, the gimbal and the radio link.',spec:'Triple IMU · dual barometer · the printed arrow points to the front'},
  cover:{name:'Top shell',count:1,build:buildCover,ex:V(0,24,0),lab:V(0,1.6,0),
    role:'Closes the body over the flight controller. The connector on top is a payload port for extra equipment such as a loudspeaker or a spotlight.',links:'Clips onto the fuselage. The payload port is wired to the flight controller.',spec:'Accessory port: power and data for an extra payload'},
  motor:{name:'Brushless motor',count:4,build:buildMotorEX,lab:V(0,2.6,0),
    role:'Large, slow-turning motor for big propellers: more efficient than a small fast one, so the drone can fly for about 45 minutes.',links:'Three phase wires to the ESC inside its motor pod.',spec:'Outer-rotor motor · about 130 KV · cooling slots in the bell'},
  camera:{name:'FPV camera',count:1,build:buildFPVEX,ex:V(0,0,-8),lab:V(0,1.3,0),
    role:'A small forward camera that gives the pilot a live view for flying, so the gimbal camera can point wherever the inspection needs.',links:'Video to the flight controller and the radio link.',spec:'Fixed, wide-angle, low delay'},
  gimbal:{name:'Gimbal camera',count:1,build:buildGimbal,ex:V(0,-5,-12),lab:V(0,-1.2,-2.2),
    role:'The inspection camera. Three motors keep it steady while the drone moves. It combines a zoom camera, a wide camera, a thermal camera that sees heat, and a laser rangefinder that measures distance.',links:'Quick-release mount under the nose (orange button) for power, video and control.',spec:'3-axis stabiliser · zoom, wide and thermal cameras · laser rangefinder'},
  rtk:{name:'RTK module',count:1,build:buildRTK,ex:V(0,32,0),lab:V(0,4.6,0),
    role:'Satellite positioning corrected by a ground station, accurate to about 1 cm instead of about 1 m. Its two antennas also tell the drone which way it faces, without relying on a compass near steel structures.',links:'Plugs into the top of the body; uses the radio link to receive corrections.',spec:'Two GNSS antennas on folding masts · centimetre-level position'},
  vision:{name:'Obstacle sensors',count:1,build:buildVision,lab:V(0,8.2,-6.6),
    role:'Pairs of cameras on all six sides see depth like two eyes, and a time-of-flight sensor (a small square window) measures distance with invisible light. The drone brakes or steers around obstacles.',links:'Wired to the flight controller.',spec:'Six directions · dual vision + time-of-flight · senses obstacles up to about 40 m'},
  lights:{name:'Beacons and lights',count:1,build:buildLights,lab:V(0,10.8,-.5),
    role:'Red anti-collision beacons on top and underneath make the drone visible to aircraft and people. The white light underneath helps the downward sensors land in the dark.',links:'Powered by the flight controller.',spec:'Anti-collision beacons · downward auxiliary light'},
  battery:{name:'Smart battery',count:2,build:buildBatteryEX,ex:V(0,14,0),lab:V(0,2.4,0),
    role:'Two batteries share the load. Either one can power the drone alone, so you can swap one without switching off (hot swap). Each battery reports its charge, temperature and health.',links:'Slides into the rear bay and locks; the connector at its base plugs into the body.',spec:'12S · 52.8 V · 5935 mAh each · self-heating for cold weather'},
  propCW:{name:'Propeller, CW',count:2,build:()=>buildPropEX('CW'),lab:V(0,.9,0),
    role:'Big, slow two-blade propeller. Shaped to push air down while turning clockwise, seen from above. Folds for transport.',links:'Clamps onto a motor that spins clockwise.',spec:'21 inch (53 cm) · two folding blades'},
  propCCW:{name:'Propeller, CCW',count:2,build:()=>buildPropEX('CCW'),lab:V(0,.9,0),
    role:'Mirror image of the CW prop. Pushes air down while turning counter-clockwise.',links:'Clamps onto a motor that spins counter-clockwise.',spec:'21 inch (53 cm) · two folding blades'},
  frame:{name:'Folding airframe',role:'A sealed body with four folding carbon arms. Everything is a module that clicks in, so the drone is serviced by swapping parts, not by soldering.',links:'Arms, landing gear, batteries, gimbal and RTK all attach with quick-release connectors.',spec:'895 mm wheelbase · about 6.3 kg take-off weight · up to 9 kg'},
};
export function exHot(){
  const B=MODEL.bat;
  return [
    {id:'body',type:'body',stage:'frame',pos:V(0,0,0),label:'Centre'},
    ...[1,2,3,4].map(n=>({id:'arm'+n,type:'arm',stage:'frame',pos:V(0,0,0),rotY:ARM_ANG[n]*DEG,motor:n,label:'Arm '+n})),
    ...[1,2].map(i=>({id:'gear'+i,type:'gear',stage:'frame',pos:V(i===1?16:-16,0,0),rotY:i===1?0:Math.PI,label:i===1?'Right leg':'Left leg'})),
    {id:'fc',type:'fc',stage:'mount',pos:V(0,27,-4),label:'Inside the body'},
    {id:'cover',type:'cover',stage:'mount',pos:V(0,31.6,-7),requires:'fc',label:'Top of the body'},
    ...[1,2,3,4].map(n=>({id:'mot'+n,type:'motor',stage:'mount',pos:armPos(n).setY(POD_TOP),rotY:ARM_ANG[n]*DEG,motor:n,requires:'arm'+n,label:'Motor pod '+n})),
    {id:'cam',type:'camera',stage:'mount',pos:V(0,26.2,-21.3),label:'Nose'},
    {id:'gimbal',type:'gimbal',stage:'mount',pos:V(0,21,-12),label:'Under the nose'},
    {id:'rtk',type:'rtk',stage:'mount',pos:V(0,33.4,-8),requires:'cover',label:'On top'},
    {id:'vision',type:'vision',stage:'mount',pos:V(0,0,0),label:'All sides'},
    {id:'lights',type:'lights',stage:'mount',pos:V(0,0,0),label:'Top and bottom'},
    {id:'bat',type:'battery',stage:'power',pos:V(-B[0]/2-.4,30.3,MODEL.batZ),label:'Battery bay, left'},
    {id:'bat2',type:'battery',stage:'power',pos:V(B[0]/2+.4,30.3,MODEL.batZ),label:'Battery bay, right'},
    ...[1,2,3,4].map(n=>({id:'prop'+n,type:'prop',stage:'props',pos:armPos(n).setY(EX_PROP_Y),motor:n,label:'Motor '+n})),
  ];
}
