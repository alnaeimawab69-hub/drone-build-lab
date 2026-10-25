/* Drone Build Lab · Tray thumbnails rendered from the 3D parts */
'use strict';
/* ================= Thumbnails for the tray ================= */
const THUMB={};
function makeThumbs(){
  const W=150,H=112;
  let r; try{ r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); }catch(e){ return; }
  r.setPixelRatio(2); r.setSize(W,H); r.outputEncoding=THREE.sRGBEncoding; r.toneMapping=THREE.ACESFilmicToneMapping;
  const sc=new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xe6f0f5,0x30281f,1.1));
  const d1=new THREE.DirectionalLight(0xffffff,1.6); d1.position.set(4,7,5); sc.add(d1);
  const d2=new THREE.DirectionalLight(0x9fc4ff,.7); d2.position.set(-5,3,-4); sc.add(d2);
  const cam=new THREE.PerspectiveCamera(30,W/H,.05,200);
  for(const k of ['plateB','arm','nylSt','aluSt','camPlate','tplate','motor','esc','fc','camera','vtx','rx','gps','cap','lead','battery','propCW','propCCW','M3x10','M3x6','M2x5','nut']){
    const g=(TYPES[k]||SCREWT[k]).build();
    if(g.userData.lead) g.remove(g.userData.lead);
    if(g.userData.ring) g.remove(g.userData.ring);
    const kill=[]; g.traverse(o=>{ if(o.material===PROXY_MAT) kill.push(o); }); kill.forEach(o=>o.parent.remove(o));
    sc.add(g);
    const bb=new THREE.Box3().setFromObject(g), c=bb.getCenter(V()), s=bb.getSize(V()).length();
    const dir=k.startsWith('prop')?V(.25,1,.55):V(.95,.75,1.15);
    cam.position.copy(c).add(dir.normalize().multiplyScalar(s*1.55)); cam.lookAt(c);
    r.render(sc,cam); THUMB[k]=r.domElement.toDataURL('image/png'); sc.remove(g);
  }
  r.dispose(); if(r.forceContextLoss) r.forceContextLoss();
}
