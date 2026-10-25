/* Drone Build Lab · Geometry helpers, rounded boxes, twisted cables, solder pads */
import * as THREE from 'three';
import { TAU, V, clamp } from './01-config.js';
import { M, std, wireColor, wireMat } from './04-materials.js';

/* ================= Geometry helpers ================= */
export function mesh(geo,mat,cast=true){ const m=new THREE.Mesh(geo,mat); m.castShadow=cast; m.receiveShadow=true; return m; }
export function box(w,h,d,mat,x=0,y=0,z=0){ const m=mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); return m; }
export function roundBox(w,h,d,r,seg=10){
  const g=new THREE.BoxGeometry(w,h,d,seg,seg,seg), p=g.attributes.position, nrm=g.attributes.normal, v=V(), half=[w/2,h/2,d/2], inn=half.map(x=>x-r);
  const f=(x,i)=>{ const t=x/half[i], a=Math.abs(t), sg=Math.sign(t); return a<=.2?sg*a/.2*inn[i]:sg*(inn[i]+(a-.2)/.8*r); };
  for(let i=0;i<p.count;i++){
    v.set(f(p.getX(i),0),f(p.getY(i),1),f(p.getZ(i),2));
    const c=V(clamp(v.x,-inn[0],inn[0]),clamp(v.y,-inn[1],inn[1]),clamp(v.z,-inn[2],inn[2])), dd=v.clone().sub(c);
    if(dd.lengthSq()>1e-10){ dd.normalize(); v.copy(c).addScaledVector(dd,r); nrm.setXYZ(i,dd.x,dd.y,dd.z); }
    p.setXYZ(i,v.x,v.y,v.z);
  }
  /* keep the texture undistorted: rebuild UVs from the final vertex positions, face by face (BoxGeometry face order) */
  const uv=g.attributes.uv, per=(seg+1)*(seg+1), A={x:0,y:1,z:2};
  const faces=[['z','y',-1,-1],['z','y',1,-1],['x','z',1,1],['x','z',1,-1],['x','y',1,-1],['x','y',-1,-1]];
  faces.forEach(([u,vv,ud,vd],k)=>{ for(let j=k*per;j<(k+1)*per;j++){ const P=[p.getX(j),p.getY(j),p.getZ(j)]; const x=P[A[u]]/ud, y=P[A[vv]]/vd; uv.setXY(j,(x+half[A[u]])/(2*half[A[u]]),1-(y+half[A[vv]])/(2*half[A[vv]])); } });
  return g;
}
export function cyl(rt,rb,h,mat,seg=24){ return mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat); }
export function rod(a,b,r,mat,seg=8){ const d=b.clone().sub(a); const m=mesh(new THREE.CylinderGeometry(r,r,d.length(),seg),mat); m.position.copy(a).addScaledVector(d,.5); m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize()); return m; }
export function tube(points,r,mat){ return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),28,r,6,false),mat); }
export function rrShape(w,l,r){ const s=new THREE.Shape(), x=-w/2, y=-l/2;
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+l-r); s.quadraticCurveTo(x+w,y+l,x+w-r,y+l);
  s.lineTo(x+r,y+l); s.quadraticCurveTo(x,y+l,x,y+l-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s; }
export function circHole(x,y,r){ const p=new THREE.Path(); p.absarc(x,y,r,0,TAU,true); return p; }
export function slotHole(x1,x2,y,r){ const p=new THREE.Path(); p.absarc(x2,y,r,-Math.PI/2,Math.PI/2,false); p.absarc(x1,y,r,Math.PI/2,Math.PI*1.5,false); return p; }
export function flatExtrude(shape,depth,mat){ const b=Math.min(.025,depth*.12); const g=new THREE.ExtrudeGeometry(shape,{depth:depth-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:24}); g.rotateX(-Math.PI/2); g.translate(0,b,0); return mesh(g,mat); }
export function boardMesh(w,h,d,side,top){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[side,side,top,side,side,side]); m.castShadow=m.receiveShadow=true; m.position.y=h/2; return m; }

/* realistic cables: twisted strands and flat ribbons following a curve */
export const PHASE_COLS=[0x3a6fb0,0xd9b23a,0x232528];
export const HARNESS_COLS=[0x232528,0xd8453b,0xeeeeee,0xe8c33c,0x3d9be0,0x4fb06d];
export function strands(curve,n,r,spread,twist,cols,ribbon){
  const N=60, fr=curve.computeFrenetFrames(N,false), out=[];
  for(let k=0;k<n;k++){
    const pts=[];
    for(let i=0;i<=N;i++){ const t=i/N, p=curve.getPointAt(t); let off;
      if(ribbon) off=fr.binormals[i].clone().multiplyScalar((k-(n-1)/2)*r*2.05);
      else { const th=twist*t*TAU+k*TAU/n; off=fr.normals[i].clone().multiplyScalar(Math.cos(th)*spread).addScaledVector(fr.binormals[i],Math.sin(th)*spread); }
      pts.push(p.add(off)); }
    const m=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),N,r,8,false),wireMat(cols[k%cols.length])); m.userData.noEdges=true; out.push(m);
  }
  return out;
}
/* small surface-mount parts so the boards read as real electronics */
export const SMD_MATS=[0x17191b,0x17191b,0xb89a6a,0x8a7a5c].map(c=>std({color:c,roughness:.5}));
export function smd(g,{w,d,y,n,seed=3,avoid=[]}){
  let s=seed; const rnd=()=>{s=(s*9301+49297)%233280; return s/233280;};
  const pads=(g.userData.pads||[]).map(p=>p.def.pos); let placed=0,tries=0;
  while(placed<n&&tries<n*40){ tries++;
    const x=(rnd()-.5)*(w-.35), z=(rnd()-.5)*(d-.35);
    if(avoid.some(([a,b,c,e])=>x>a&&x<c&&z>b&&z<e)) continue;
    if(pads.some(p=>Math.hypot(p.x-x,p.z-z)<.36)) continue;
    if(Math.abs(Math.abs(x)-1.525)<.3&&Math.abs(Math.abs(z)-1.525)<.3) continue;
    const big=rnd()<.25, rot=rnd()<.5, sx=big?.2:.13, sz=big?.12:.07, h=big?.07:.045;
    const b=box(rot?sz:sx,h,rot?sx:sz,SMD_MATS[Math.floor(rnd()*SMD_MATS.length)],x,y+h/2,z); b.castShadow=false; g.add(b); placed++;
  }
}

/* pads: soldering points. Source pads (need) are wire ends; target pads (net) are on the boards */
export const PROXY_GEO=new THREE.SphereGeometry(.3,10,8), PROXY_MAT=new THREE.MeshBasicMaterial({visible:false});
export function addPad(g,def,parent=g){
  let vis;
  if(def.shape==='triple'){ vis=new THREE.Group(); [-.28,0,.28].forEach(z=>{const b=box(.3,.04,.2,M.copper); b.position.z=z; vis.add(b);}); }
  else if(def.shape==='big') vis=box(.5,.05,.42,M.copper);
  else if(def.shape==='socket') vis=box(.8,.24,.34,M.nylon);
  else if(def.shape==='plug') vis=box(.7,.2,.3,M.nylon);
  else if(def.shape==='bundle'){ vis=new THREE.Group(); [-.12,0,.12].forEach(z=>{const c=cyl(.06,.06,.36,M.tin,8); c.rotation.z=Math.PI/2; c.position.z=z; vis.add(c);}); }
  else if(def.need) vis=mesh(new THREE.SphereGeometry(.1,14,10),wireMat(wireColor(def.need,def.label)));
  else vis=box(.24,.04,.24,M.copper);
  vis.position.copy(def.pos); parent.add(vis);
  vis.traverse(o=>{ if(o.isMesh) o.userData.m0=o.material; });
  const proxy=new THREE.Mesh(PROXY_GEO,PROXY_MAT); proxy.position.copy(def.pos); parent.add(proxy);
  (g.userData.pads||(g.userData.pads=[])).push({def,vis,proxy});
}
