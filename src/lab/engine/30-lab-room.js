/* Drone Build Lab · The studio around the drone: the ESD work mat on a seamless dark backdrop (1 unit = 1 cm) */
import * as THREE from 'three';
import { TAU } from './01-config.js';
import { ctex } from './03-textures.js';
import { std } from './04-materials.js';
import { cyl, mesh } from './05-geometry.js';

/* ================= Sizes and colours =================
   The mat's top is the surface the drone stands on (y = -0.02). The studio floor and the backdrop fade to BG at the horizon,
   so floor and sky meet without a visible edge, like a photo studio's curved backdrop. */
export const MAT_W=120, MAT_D=80, MAT_Z=-5, BG=0x141c20;
const TOP=-.02, MAT_T=.3, FLOOR_R=900, SKY_R=1000;
const FONT='"IBM Plex Mono", monospace', HEAD='"Barlow Semi Condensed", sans-serif';

/* ================= Textures ================= */
/* ESD work mat, the whole mat in one texture: 1 cm squares, stronger lines every 5 and 10 cm, rulers along two edges, a build circle in the middle */
const matTex=ctex(2048,Math.round(2048*MAT_D/MAT_W),(g,w,h)=>{
  const P=w/MAT_W, cx=w/2, cy=h/2-MAT_Z*P;                         // pixels per cm; the drone's origin on the mat
  g.fillStyle='#24363b'; g.fillRect(0,0,w,h);
  let s=7; const rnd=()=>{ s=(s*9301+49297)%233280; return s/233280; };
  for(let i=0;i<9000;i++){ g.fillStyle=`rgba(${rnd()<.5?'255,255,255':'0,0,0'},.025)`; g.fillRect(rnd()*w,rnd()*h,2,2); }
  const m=2.2*P;                                                    // border
  for(const [step,a,lw] of [[1,.05,1],[5,.1,1.5],[10,.17,2.5]]){ g.strokeStyle=`rgba(200,230,225,${a})`; g.lineWidth=lw;
    for(let x=cx%(step*P);x<w;x+=step*P){ g.beginPath(); g.moveTo(x,m); g.lineTo(x,h-m); g.stroke(); }
    for(let y=cy%(step*P);y<h;y+=step*P){ g.beginPath(); g.moveTo(m,y); g.lineTo(w-m,y); g.stroke(); } }
  g.strokeStyle='rgba(200,230,225,.28)'; g.lineWidth=3; g.setLineDash([18,12]);
  g.beginPath(); g.arc(cx,cy,22*P,0,TAU); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(cx-3*P,cy); g.lineTo(cx+3*P,cy); g.moveTo(cx,cy-3*P); g.lineTo(cx,cy+3*P); g.stroke();
  g.strokeStyle='rgba(214,232,228,.55)'; g.lineWidth=3; g.strokeRect(m,m,w-2*m,h-2*m);
  /* rulers along the front edge and the left edge, 1 cm ticks, numbers every 10 cm */
  g.fillStyle='rgba(214,232,228,.7)'; g.font=`500 ${Math.round(1.1*P)}px ${FONT}`; g.textAlign='center'; g.textBaseline='top';
  for(let c=0;c*P<=w-2*m;c++){ const x=m+c*P, L=c%10?(c%5?.5:.9):1.4; g.fillRect(x-1,h-m-L*P,2,L*P); if(c%10===0&&c) g.fillText(c,x,h-m-3.2*P); }
  g.textAlign='left'; g.textBaseline='middle';
  for(let c=0;c*P<=h-2*m;c++){ const y=h-m-c*P, L=c%10?(c%5?.5:.9):1.4; g.fillRect(m,y-1,L*P,2); if(c%10===0&&c) g.fillText(c,m+1.9*P,y); }
  /* ESD label, back right corner */
  const lx=w-m-30*P, ly=m+2.6*P;
  g.fillStyle='rgba(234,196,96,.85)'; g.beginPath(); g.moveTo(lx,ly+3.4*P); g.lineTo(lx+2*P,ly); g.lineTo(lx+4*P,ly+3.4*P); g.closePath(); g.fill();
  g.fillStyle='#24363b'; g.font=`700 ${Math.round(2.2*P)}px ${HEAD}`; g.textAlign='center'; g.fillText('!',lx+2*P,ly+2.2*P);
  g.textAlign='left'; g.fillStyle='rgba(214,232,228,.75)'; g.font=`700 ${Math.round(1.6*P)}px ${HEAD}`; g.fillText('ESD PROTECTED WORK AREA',lx+5.2*P,ly+1.1*P);
  g.font=`500 ${Math.round(1.05*P)}px ${FONT}`; g.fillStyle='rgba(214,232,228,.5)'; g.fillText('GROUND STRAP BEFORE HANDLING BOARDS',lx+5.2*P,ly+2.8*P);
});
matTex.anisotropy=16;

/* studio floor seen from above: a soft pool of light under the mat, fading out to the backdrop colour */
const floorTex=ctex(1024,1024,(g,w)=>{ const c=w/2, rg=g.createRadialGradient(c,c,0,c,c,c);
  rg.addColorStop(0,'#33434a'); rg.addColorStop(.08,'#2a383e'); rg.addColorStop(.22,'#1d282d'); rg.addColorStop(.5,'#161f23'); rg.addColorStop(1,'#141c20');
  g.fillStyle=rg; g.fillRect(0,0,w,w); });
/* backdrop, top to bottom: deep at the top, a faint glow just above the horizon, the backdrop colour below */
const skyTex=ctex(8,512,(g,w,h)=>{ const lg=g.createLinearGradient(0,0,0,h);
  lg.addColorStop(0,'#080c0e'); lg.addColorStop(.32,'#0f161a'); lg.addColorStop(.47,'#1b262c'); lg.addColorStop(.5,'#141c20'); lg.addColorStop(1,'#141c20');
  g.fillStyle=lg; g.fillRect(0,0,w,h); });

/* ================= Build ================= */
export function buildLabRoom(){
  const room=new THREE.Group();
  /* ESD mat: it takes the drone's shadow */
  const edge=std({color:0x1c2a2e,roughness:.9});
  const mat=mesh(new THREE.BoxGeometry(MAT_W,MAT_T,MAT_D),[edge,edge,std({map:matTex,roughness:.88}),edge,edge,edge],false);
  mat.position.set(0,TOP-MAT_T/2,MAT_Z); room.add(mat);
  const stud=cyl(.9,.9,.5,std({color:0xc9cfd4,metalness:1,roughness:.3}),24); stud.castShadow=false; stud.position.set(MAT_W/2-3,TOP,MAT_Z+MAT_D/2-3); room.add(stud);
  /* floor and backdrop: unlit and outside the fog, so their colours meet exactly at the horizon */
  const flat=map=>new THREE.MeshBasicMaterial({map,fog:false,toneMapped:false,depthWrite:false});
  const floor=new THREE.Mesh(new THREE.CircleGeometry(FLOOR_R,96),flat(floorTex)); floor.rotation.x=-Math.PI/2; floor.position.y=TOP-MAT_T-.05; floor.renderOrder=-2; room.add(floor);
  const skyM=flat(skyTex); skyM.side=THREE.BackSide;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(SKY_R,48,24),skyM); sky.renderOrder=-3; room.add(sky);
  return room;
}
