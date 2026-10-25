/* Drone Build Lab · Builders for every part, made from code (no imported models) */
'use strict';
/* ================= Builders (all geometry made here, no imported models) ================= */
function armShape(){
  const L=ARM, root=.9, sh=new THREE.Shape(), a=Math.asin(.62/1.5);
  sh.moveTo(root,-.85); sh.lineTo(L-1.36,-.62); sh.absarc(L,0,1.5,Math.PI+a,3*Math.PI-a,false); sh.lineTo(root,.85); sh.lineTo(root,-.85);
  sh.holes.push(circHole(L,0,.45));
  for(const [dx,dy] of [[.57,.57],[.57,-.57],[-.57,.57],[-.57,-.57]]) sh.holes.push(circHole(L+dx,dy,.12));
  for(const x of [1.2,3.2]) sh.holes.push(circHole(x,0,.13));
  sh.holes.push(slotHole(4.4,8.0,0,.22));
  return sh;
}
function buildArm(){ const g=new THREE.Group(); g.add(flatExtrude(armShape(),.45,M.carbon)); return g; }
function buildPlateB(){
  const sh=rrShape(5.6,10.5,.7), H=(x,z)=>sh.holes.push(circHole(x,.25-z,.15));
  for(const a of [-1.525,1.525]) for(const b of [-1.525,1.525]) H(a,b);
  for(const x of [-2.35,2.35]) for(const z of [-4,0,4.2]) H(x,z);
  for(const n of [1,2,3,4]) for(const r of [1.2,3.2]){ const q=armPos(n,r); H(q.x,q.z); }
  const g=new THREE.Group(); g.add(flatExtrude(sh,.3,M.carbon)); return g;
}
function buildAluSt(){ const g=new THREE.Group(); g.add(cyl(.2,.2,2.95,M.alu,6)); return g; }
function buildNylSt(){ const g=new THREE.Group(); g.add(cyl(.13,.13,2.05,M.nylon,12)); return g; }
function buildCamPlate(){ const g=new THREE.Group(); g.add(box(.16,2.95,1.5,M.carbon)); return g; }
function buildTopPlate(){
  const g=new THREE.Group(), ts=rrShape(5.2,9.2,.6);
  for(const x of [-1.85,1.85]){ const p=new THREE.Path(); p.moveTo(x-.11,-.35); p.lineTo(x+.11,-.35); p.lineTo(x+.11,.35); p.lineTo(x-.11,.35); p.lineTo(x-.11,-.35); ts.holes.push(p); }
  for(const x of [-2.35,2.35]) for(const z of [-4,0,4.2]) ts.holes.push(circHole(x,-z,.15));
  g.add(flatExtrude(ts,.22,M.carbonTop));
  const mast=cyl(.12,.12,2.35,M.carbonTop,12); mast.position.set(0,1.395,4.1); g.add(mast);
  const mp=cyl(.9,.9,.1,M.carbonTop,32); mp.position.set(0,2.6,4.1); g.add(mp);
  return g;
}
function makeRing(){
  const g=new THREE.Group(); const arc=Math.PI*1.45, R2=1.9;
  const mat=new THREE.MeshBasicMaterial({color:0xe0894a,side:THREE.DoubleSide,depthTest:false,transparent:true});
  const t=new THREE.Mesh(new THREE.TorusGeometry(R2,.08,8,48,arc),mat); t.rotation.x=-Math.PI/2; g.add(t);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.26,.62,16),mat);
  head.position.set(R2*Math.cos(arc),0,-R2*Math.sin(arc));
  head.quaternion.setFromUnitVectors(V(0,1,0),V(-Math.sin(arc),0,-Math.cos(arc)));
  g.add(head); t.renderOrder=head.renderOrder=7; t.userData.noStyle=head.userData.noStyle=true; g.userData.mat=mat; g.visible=false;
  return g;
}
function buildMotor(){
  const g=new THREE.Group();
  const base=cyl(1.06,1.12,.3,M.darkMetal,40); base.position.y=.15; g.add(base);
  const rot=new THREE.Group(); g.add(rot); g.userData.rot=rot;
  const bell=cyl(1.12,1.12,1.0,M.bell,48); bell.position.y=.86; rot.add(bell);
  const band=cyl(1.135,1.135,.18,M.alu,48); band.position.y=1.12; rot.add(band);
  const cap=cyl(.98,1.1,.1,M.bell,48); cap.position.y=1.41; rot.add(cap);
  for(let i=0;i<6;i++){ const v=box(.16,.03,.42,M.copper); const a=i/6*TAU; v.position.set(Math.cos(a)*.62,1.465,Math.sin(a)*.62); v.rotation.y=Math.PI/2-a; rot.add(v); }
  rot.add(box(.08,.5,.3,M.white,1.13,.8,0));
  for(const y of [.5,.68]){ const gr=cyl(1.126,1.126,.025,M.black,48); gr.position.y=y; rot.add(gr); }
  const shaft=cyl(.14,.14,.8,M.steel,16); shaft.position.y=1.8; rot.add(shaft);
  const lead=new THREE.Group(); g.add(lead); g.userData.lead=lead;
  strands(new THREE.CatmullRomCurve3([V(-.95,.2,0),V(-3.5,.21,0),V(-7.35,.19,0)]),3,.06,.07,7,PHASE_COLS).forEach(m=>lead.add(m));
  lead.add(rod(V(-6.5,.19,0),V(-7.3,.19,0),.17,M.sleeve));
  for(const x of [-3.2,-5.6]){ const z=mesh(new THREE.TorusGeometry(.8,.035,6,32),M.black); z.rotation.y=Math.PI/2; z.scale.set(1,.5,1); z.position.set(x,-.12,0); lead.add(z); lead.add(box(.1,.12,.16,M.black,x,.3,.0)); }
  addPad(g,{key:'ph',label:'MOTOR',need:'M?',pos:V(-7.6,.18,0),out:V(0,1,0),shape:'bundle'},lead);
  const ring=makeRing(); ring.position.y=1.7; g.add(ring); g.userData.ring=ring;
  return g;
}
function bladeShape(s){
  const sh=new THREE.Shape(), P=(x,y)=>[x,y*s];
  sh.moveTo(...P(.3,-.32)); sh.bezierCurveTo(...P(1.6,-.95),...P(4.4,-.8),...P(6.3,-.22));
  sh.quadraticCurveTo(...P(6.48,.12),...P(6.05,.3)); sh.bezierCurveTo(...P(4.2,.56),...P(1.8,.56),...P(.3,.3)); sh.lineTo(...P(.3,-.32));
  return sh;
}
function buildProp(dir){
  const s=dir==='CW'?1:-1, g=new THREE.Group(), sp=new THREE.Group(); g.add(sp); g.userData.spinner=sp; g.userData.dir=dir;
  const hub=cyl(.42,.46,.38,M.propHub,24); hub.position.y=.19; sp.add(hub);
  const nut=cyl(.3,.3,.3,M.steel,6); nut.position.y=.53; sp.add(nut);
  const geo=new THREE.ExtrudeGeometry(bladeShape(s),{depth:.07,bevelEnabled:false,curveSegments:10}); geo.rotateX(-Math.PI/2); geo.translate(0,-.035,0);
  for(let k=0;k<3;k++){ const pv=new THREE.Group(); pv.rotation.y=k*TAU/3; const bl=mesh(geo,M.prop); bl.rotation.x=-.28*s; bl.position.y=.2; pv.add(bl); sp.add(pv); }
  const disc=new THREE.Mesh(new THREE.CircleGeometry(6.35,64),new THREE.MeshBasicMaterial({color:0xcfe6ee,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  disc.rotation.x=-Math.PI/2; disc.position.y=.22; disc.userData.noStyle=true; g.add(disc); g.userData.disc=disc;
  return g;
}
function buildESC(){
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
function buildFC(){
  const g=new THREE.Group(); g.add(boardMesh(3.6,.16,3.6,M.pcbB,M.fcTop));
  g.add(box(.95,.12,.95,M.black,.62,.22,.78));
  g.add(box(.42,.1,.42,M.black,-.62,.21,.82));
  g.add(box(.3,.26,.72,M.steel,1.62,.29,1.0));
  g.add(box(.12,.06,.12,std({color:0x4fd18b,emissive:0x2a8a55}),1.1,.19,.6));
  const P=(k,l,net,x,z,o)=>addPad(g,{key:k,label:l,net,pos:V(x,.17,z),out:o});
  const F=V(0,0,-1),B=V(0,0,1),Rt=V(1,0,0),Lf=V(-1,0,0);
  P('c5','5V','5V',0,-1.6,F); P('cg','G','GND',.55,-1.6,F); P('cam','CAM','CAM',1.1,-1.6,F);
  P('v9','9V','9V',1.6,-.7,Rt); P('vg','G','GND',1.6,-.25,Rt); P('vtx','VTX','VTX',1.6,.2,Rt);
  P('u15','5V','5V',-1.2,1.6,B); P('u1g','G','GND',-.65,1.6,B); P('t1','T1','T1',-.1,1.6,B); P('r1','R1','R1',.45,1.6,B);
  P('u35','5V','5V',-1.6,-.45,Lf); P('u3g','G','GND',-1.6,0,Lf); P('t3','T3','T3',-1.6,.45,Lf); P('r3','R3','R3',-1.6,.9,Lf);
  addPad(g,{key:'esc',label:'ESC',net:'ESC',pos:V(-.35,.28,-.95),out:V(0,1,0),shape:'socket'});
  smd(g,{w:3.6,d:3.6,y:.16,n:30,seed:13,avoid:[[-.55,-1.4,.55,.45],[.1,.25,1.15,1.3],[-.9,.55,-.35,1.1],[1.4,.55,1.8,1.45],[-.8,-1.2,.1,-.7]]});
  return g;
}
function buildCamera(){
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
function buildVTX(){
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
function buildRX(){
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
function buildGPS(){
  const g=new THREE.Group();
  const gs=mesh(roundBox(2.2,.5,2.2,.2),M.gpsShell); gs.position.y=.25; g.add(gs);
  const p=new THREE.Mesh(new THREE.BoxGeometry(1.4,.12,1.4),[M.patch,M.patch,M.patch,M.patch,M.patch,M.patch]); p.position.y=.56; p.castShadow=true; g.add(p);
  const F=V(0,0,-1);
  addPad(g,{key:'5v',label:'5V',need:'5V',pos:V(-.45,.12,-1.2),out:F});
  addPad(g,{key:'g',label:'G',need:'GND',pos:V(-.15,.12,-1.2),out:F});
  addPad(g,{key:'tx',label:'TX',need:'R3',pos:V(.15,.12,-1.2),out:F});
  addPad(g,{key:'rx',label:'RX',need:'T3',pos:V(.45,.12,-1.2),out:F});
  return g;
}
function buildCap(){
  const g=new THREE.Group();
  const b=cyl(.38,.38,1.6,M.capBody,28); b.rotation.x=Math.PI/2; g.add(b);
  const st=mesh(new THREE.CylinderGeometry(.386,.386,1.5,24,1,true,Math.PI*1.5-.35,.7),M.capStripe); st.rotation.x=Math.PI/2; g.add(st);
  const top=cyl(.36,.36,.04,M.tin,24); top.rotation.x=Math.PI/2; top.position.z=.81; g.add(top);
  for(const x of [-.15,.15]) g.add(rod(V(x,0,-.8),V(x,0,-1.25),.03,M.tin));
  addPad(g,{key:'p',label:'+',need:'VBAT+',pos:V(.15,0,-1.3),out:V(0,1,0)});
  addPad(g,{key:'n',label:'−',need:'VBAT-',pos:V(-.15,0,-1.3),out:V(0,1,0)});
  return g;
}
function buildLead(){
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
function buildBattery(){
  const g=new THREE.Group();
  const b=new THREE.Mesh(roundBox(3,2.6,7,.28),[M.batSide,M.batSide,M.batEnd,M.batEnd,M.batEnd,M.batEnd]); b.position.y=1.3; b.castShadow=b.receiveShadow=true; g.add(b);
  const st=mesh(roundBox(3.14,2.74,.55,.3),M.strap); st.position.y=1.3; g.add(st);
  g.add(box(.7,.3,.22,M.white,-1.0,2.15,3.62));
  for(let i=0;i<5;i++) g.add(tube([V(-1.25+i*.12,2.15,3.5),V(-1.25+i*.12,2.45,3.3),V(-1.25+i*.12,2.62,3.0)],.025,wireMat([0x232528,0xd8453b,0xd8453b,0xd8453b,0xd8453b][i])));
  const plug=new THREE.Object3D(); plug.position.set(1.0,1.6,3.55); g.add(plug); g.userData.plug=plug;
  return g;
}
