/* Drone Build Lab · Workbench, CAD view, drone root, markers, flight visuals */
'use strict';
/* ================= Scene content ================= */
const ground=new THREE.Mesh(new THREE.CircleGeometry(60,64),new THREE.MeshStandardMaterial({map:matTex,roughness:.92}));
ground.rotation.x=-Math.PI/2; ground.position.y=-.02; ground.receiveShadow=true; scene.add(ground);
const frontDecal=new THREE.Mesh(new THREE.PlaneGeometry(6,2.25),new THREE.MeshBasicMaterial({map:frontTex,transparent:true,depthWrite:false}));
frontDecal.rotation.x=-Math.PI/2; frontDecal.position.set(0,0,-19); scene.add(frontDecal);

/* CAD view: light background, flat materials and black edge lines, like a technical drawing */
const grid=new THREE.GridHelper(120,120,0x8d99a1,0xc6ced3); grid.position.y=-.005; grid.visible=false; scene.add(grid);
const CAD_MATS=new Map(), CAD_SET=new Set(), EDGE_MAT=new THREE.LineBasicMaterial({color:0x1b2328,transparent:true,opacity:.8});
function cadMatFor(m){
  let cm=CAD_MATS.get(m); if(cm) return cm;
  const keepMap=!!m.map&&m!==M.carbon&&m!==M.carbonTop;
  const c=m.color?m.color.clone():new THREE.Color(0xcccccc); if(m.map&&!keepMap) c.setHex(0x7d8790);
  const hsl={}; c.getHSL(hsl); c.setHSL(hsl.h,hsl.s*.55,clamp(.42+hsl.l*.45,.3,.9));
  cm=new THREE.MeshStandardMaterial({color:keepMap?0xffffff:c,map:keepMap?m.map:null,roughness:.85,metalness:0,transparent:m.transparent,opacity:m.opacity,side:m.side,depthWrite:m.depthWrite,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  CAD_MATS.set(m,cm); CAD_SET.add(cm); return cm;
}
function styleObj(root){
  root.traverse(o=>{
    if(!o.isMesh||o.userData.noStyle||o.material===PROXY_MAT||(o.parent&&o.parent.isArrowHelper)) return;
    const cur=o.material; if(cur===M.padGood||cur===M.padHover||cur===M.rubber) return;
    const isCad=Array.isArray(cur)?CAD_SET.has(cur[0]):CAD_SET.has(cur);
    if(S.cad){
      if(!isCad){ o.userData.realMat=cur; o.material=Array.isArray(cur)?cur.map(cadMatFor):cadMatFor(cur); }
      if(!o.userData.noEdges){ if(!o.userData.edges){ const e=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,30),EDGE_MAT); e.raycast=()=>{}; o.add(e); o.userData.edges=e; } o.userData.edges.visible=true; }
    } else {
      if(isCad&&o.userData.realMat) o.material=o.userData.realMat;
      if(o.userData.edges) o.userData.edges.visible=false;
    }
  });
}
const DIM_MAT=new THREE.LineBasicMaterial({color:0x1d63a8,depthTest:false,transparent:true});
const DIM_HEAD=new THREE.MeshBasicMaterial({color:0x1d63a8,depthTest:false,transparent:true});
const mm=d=>{ const v=Math.round(d*100)/10; return (Number.isInteger(v)?v:v.toFixed(1))+' mm'; };
function dimension(a,b,off,note){
  const g=new THREE.Group(), a2=a.clone().add(off), b2=b.clone().add(off), ext=off.clone().setLength(.4);
  const pts=[a2,b2]; if(off.length()>.05) pts.push(a,a2.clone().add(ext),b,b2.clone().add(ext));
  const l=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),DIM_MAT); l.renderOrder=11; g.add(l);
  const dir=b2.clone().sub(a2).normalize();
  for(const [pt,d] of [[a2,dir.clone().negate()],[b2,dir]]){ const c=new THREE.Mesh(new THREE.ConeGeometry(.12,.45,10),DIM_HEAD); c.position.copy(pt).addScaledVector(d,-.22); c.quaternion.setFromUnitVectors(V(0,1,0),d); c.renderOrder=11; g.add(c); }
  const t=textSprite(mm(a.distanceTo(b))+(note?' · '+note:''),'#14457a','#1d63a8',.42,'rgba(246,248,250,.96)');
  t.position.copy(a2).lerp(b2,.5).add(off.length()>.05?off.clone().setLength(.5):V(0,.5,0)); g.add(t);
  g.traverse(o=>o.userData.noStyle=true); return g;
}
const DIMS=new THREE.Group(); DIMS.visible=false;
function buildDims(){ if(!DIMS.parent) droneRoot.add(DIMS); if(DIMS.children.length) return;
[[armPos(4).setY(2.4),armPos(1).setY(2.4),V(0,0,0),'wheelbase'],
 [armPos(4).setY(.45),armPos(2).setY(.45),V(0,0,-4.5),'motor spacing'],
 [armPos(2).add(V(-6.35,2.2,0)),armPos(2).add(V(6.35,2.2,0)),V(0,1.6,0),'5 in prop'],
 [V(1.525,2.3,-1.525),V(1.525,2.3,1.525),V(3.4,0,0),'stack'],
 [V(2.7,0,-4.6),V(2.7,3.62,-4.6),V(1.8,0,0),'frame height'],
 [V(-2.8,.35,-5),V(-2.8,.35,5.5),V(-2.4,0,0),'bottom plate']].forEach(d=>DIMS.add(dimension(...d))); }
function setStyle(cad){
  S.cad=cad; const bg=cad?0xe6eaed:0x0f171a;
  scene.background.setHex(bg); scene.fog.color.setHex(bg); ground.visible=!cad; grid.visible=cad;
  buildDims(); DIMS.visible=cad; $('#tblock').hidden=!cad; $('#tbName').textContent=S.name||'Student';
  styleObj(droneRoot); $('#btnCad').setAttribute('aria-pressed',cad); $('#viewport').classList.toggle('cad',cad); updateMarkers();
}

const droneRoot=new THREE.Group(); scene.add(droneRoot);

HOT.forEach(h=>{
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ringTex,depthTest:false,transparent:true}));
  s.scale.setScalar(1.4); s.renderOrder=8; s.position.copy(h.pos).add(h.mk||V(0,.3,0)); s.visible=false;
  droneRoot.add(s); h.marker=s;
});

/* flight visuals */
const thrustArrows=[1,2,3,4].map(n=>{ const a=new THREE.ArrowHelper(V(0,1,0),armPos(n).setY(2.6),2,0xe0894a,.6,.4); a.visible=false; a.traverse(o=>{if(o.material){o.material.depthTest=false;o.material.transparent=true;}}); a.renderOrder=9; droneRoot.add(a); return a; });
const totalArrow=new THREE.ArrowHelper(V(0,1,0),V(),3,0xe0894a,.9,.6);
const weightArrow=new THREE.ArrowHelper(V(0,-1,0),V(),3.4,0x7cc0d3,.9,.6);
[totalArrow,weightArrow].forEach(a=>{a.visible=false; a.traverse(o=>{if(o.material){o.material.depthTest=false;o.material.transparent=true;}}); scene.add(a);});
const PN=320, pPos=new Float32Array(PN*3), pData=[];
for(let i=0;i<PN;i++) pData.push({m:1+(i%4),y:2-Math.random()*8,r:Math.sqrt(Math.random())*5.6,a:Math.random()*TAU});
const pGeo=new THREE.BufferGeometry(); pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xbfe6f2,size:.11,transparent:true,opacity:.55,depthWrite:false}));
particles.visible=false; particles.frustumCulled=false; droneRoot.add(particles);
