/* Drone Build Lab · Shared helpers and drone conventions (front = -Z, motor numbering) */
import * as THREE from 'three';

export const $=s=>document.querySelector(s);
export const TAU=Math.PI*2, DEG=Math.PI/180;
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export const ZERO=V();
export const clamp=THREE.MathUtils.clamp;
export const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
export const easeOut=k=>1-Math.pow(1-k,3);
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ================= Drone models =================
   The student picks a model on the start screen. Switching model reloads the page with ?model=<key>,
   so every module can read MODEL while it loads. Model 1 is the original build and stays the default.
   arm: centre-to-motor (1 unit = 1 cm) · ang: arm angles in degrees (0 = right, 90 = front)
   armT: arm thickness · plate: bottom plate [width, length] · alu: standoff x offset · bat: battery [w, h, l]
   cg: height of the centre of gravity · propR: prop radius · scale: drawn size (1 = real size) · view: camera distance factor
   sealed: built from sealed modules, so only Explore and Movements are offered */
export const MODELS={
  lx250:{key:'lx250',no:1,name:'LX-250',title:'LX-250 quadcopter',tag:'250 mm quad',
    blurb:'Classic X frame, analog video, 4S power. The first build.',
    arm:12.5,ang:{1:-45,2:45,3:-135,4:135},armT:.45,plate:[5.6,10.5],alu:2.35,bat:[3,2.6,7],batZ:0,prop:'5 in',cg:2.6,propR:6.35},
  cx5:{key:'cx5',no:2,name:'CX-5',title:'CX-5 cinematic FPV',tag:'5-inch cinematic FPV',
    blurb:'Deadcat frame for clean footage, HD digital video, action camera, 6S power.',
    arm:11.5,ang:{1:-45,2:30,3:-135,4:150},armT:.6,plate:[6.6,11],alu:2.9,bat:[3.4,3,6],batZ:1.1,prop:'5.1 in',cg:2.8,propR:6.5},
  ex9:{key:'ex9',no:3,name:'EX-9',title:'EX-9 enterprise drone',tag:'enterprise inspection drone',
    blurb:'Large industrial quad: folding arms, dual hot-swap batteries, RTK, gimbal camera, obstacle sensors. Explore and Movements.',
    arm:44.75,ang:{1:-51,2:51,3:-129,4:129},armT:3,plate:[20,30],alu:0,bat:[8,5.5,15],batZ:8.2,prop:'21 in',cg:27,propR:26.7,armLblY:29.5,scale:.3,view:1.9,sealed:true},
};
function pickModel(){
  let k=null;
  try{ k=new URLSearchParams(location.search).get('model'); }catch(e){}
  if(!MODELS[k]){ try{ k=localStorage.getItem('dbl-model'); }catch(e){} }
  return MODELS[k]?k:'lx250';
}
export const MODEL=MODELS[pickModel()];
export const CINE=MODEL.key==='cx5';
export const EX=MODEL.key==='ex9';
export const SCALE=MODEL.scale||1;                       // model 3 is drawn at 30 % so it fits the bench like the others
try{ localStorage.setItem('dbl-model',MODEL.key); }catch(e){}

/* props in (the default) or props out: chosen on the start screen, read while the modules load, like the model */
function pickProps(){
  let p=null;
  try{ p=new URLSearchParams(location.search).get('props'); }catch(e){}
  if(p!=='in'&&p!=='out'){ try{ p=localStorage.getItem('dbl-props'); }catch(e){} }
  return p==='out'?'out':'in';
}
export const PROPS=pickProps();
export const PROPS_OUT=PROPS==='out';
try{ localStorage.setItem('dbl-props',PROPS); }catch(e){}

/* ================= Drone conventions =================
   Front = -Z, right = +X. Motor numbering:
   props in:  M1 rear-right CW · M2 front-right CCW · M3 rear-left CCW · M4 front-left CW
   props out: every motor reversed (M1 CCW · M2 CW · M3 CW · M4 CCW)  */
export const ARM=MODEL.arm;                              // model 1: 250 mm wheelbase / 2
export const ARM_ANG=MODEL.ang;                          // model 2 is a deadcat: front arms swept out to the sides
export const EXP=PROPS_OUT?{1:'CCW',2:'CW',3:'CW',4:'CCW'}:{1:'CW',2:'CCW',3:'CCW',4:'CW'};
export const YAW_MIX=PROPS_OUT?-1:1;                     // yaw right speeds up the CCW motors; props out swaps which motors those are
export const motorsTurning=d=>[1,2,3,4].filter(n=>EXP[n]===d).map(n=>'M'+n).join(', ');
export const CORNER={1:'rear right',2:'front right',3:'rear left',4:'front left'};
export const armPos=(n,r=ARM)=>{const a=ARM_ANG[n]*DEG;return V(Math.cos(a)*r,0,-Math.sin(a)*r);};
export const opp=d=>d==='CW'?'CCW':'CW';
