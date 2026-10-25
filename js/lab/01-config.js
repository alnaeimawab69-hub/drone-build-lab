/* Drone Build Lab · Shared helpers and drone conventions (front = -Z, motor numbering) */
'use strict';
const $=s=>document.querySelector(s);
const TAU=Math.PI*2, DEG=Math.PI/180;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const ZERO=V();
const clamp=THREE.MathUtils.clamp;
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const easeOut=k=>1-Math.pow(1-k,3);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ================= Drone conventions =================
   Front = -Z, right = +X. Motor numbering:
   M1 rear-right CW · M2 front-right CCW · M3 rear-left CCW · M4 front-left CW  */
const ARM=12.5;                                   // centre-to-motor, 250 mm wheelbase / 2 (1 unit = 1 cm)
const ARM_ANG={1:-45,2:45,3:-135,4:135};
const EXP={1:'CW',2:'CCW',3:'CCW',4:'CW'};
const CORNER={1:'rear right',2:'front right',3:'rear left',4:'front left'};
const armPos=(n,r=ARM)=>{const a=ARM_ANG[n]*DEG;return V(Math.cos(a)*r,0,-Math.sin(a)*r);};
const opp=d=>d==='CW'?'CCW':'CW';
