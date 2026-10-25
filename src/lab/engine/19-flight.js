/* Drone Build Lab · Flight physics model */
import { DEG, EXP, TAU, V, armPos, clamp } from './01-config.js';
import { camera, controls } from './02-scene.js';
import { S } from './08-state.js';
import { PN, droneRoot, pData, pGeo, pPos, particles, thrustArrows, totalArrow, weightArrow } from './09-scene-content.js';
import { renderPanel } from './21-panel.js';
import { toast } from './23-toast.js';

/* ================= Flight model ================= */
export const G=9.8;
export const FL={armed:false,pos:V(),vel:V(),roll:0,pitch:0,yaw:0,yawRate:0,altT:0,man:null,sign:1,manT:0,thr:[0,0,0,0],T:0,landing:false,tour:null,last:V(),hudT:0,cur:null};
export const MANS={
  takeoff:{t:'Take off and hover',d:'All four motors speed up together. When total thrust is bigger than the weight the drone rises; when thrust equals weight it hovers.',dof:'heave'},
  climb:{t:'Climb',d:'Thrust is raised above the weight, so the net force points up and the drone accelerates upward. The controller then trims back to hover.',dof:'heave'},
  descend:{t:'Descend',d:'Thrust drops a little below the weight, so gravity wins and the drone sinks, until thrust is raised again to stop.',dof:'heave'},
  pitchF:{t:'Pitch forward',d:'Rear motors (M1, M3) speed up and front motors (M2, M4) slow down. The nose dips, the thrust tilts forward, and part of it now pushes the drone ahead. To stop, it pitches back the other way.',dof:'pitch'},
  pitchB:{t:'Pitch back',d:'Front motors (M2, M4) speed up and rear motors (M1, M3) slow down. The nose lifts and the tilted thrust pushes the drone backward.',dof:'pitch'},
  rollR:{t:'Roll right',d:'Left motors (M3, M4) speed up and right motors (M1, M2) slow down. The drone banks right and the tilted thrust slides it sideways.',dof:'roll'},
  rollL:{t:'Roll left',d:'Right motors (M1, M2) speed up and left motors (M3, M4) slow down. The drone banks left and slides left.',dof:'roll'},
  yawR:{t:'Yaw right',d:'Each spinning prop twists the frame the opposite way. Speeding up the counter-clockwise props (M2, M3) and slowing the clockwise ones (M1, M4) leaves a net twist that turns the nose right. Total lift stays the same.',dof:'yaw'},
  yawL:{t:'Yaw left',d:'Speeding up the clockwise props (M1, M4) and slowing the counter-clockwise ones (M2, M3) twists the frame to the left.',dof:'yaw'},
  land:{t:'Land',d:'Thrust is reduced slowly below the weight until the drone touches down, then the motors are disarmed.',dof:'heave'},
  arm:{t:'Armed',d:'Motors idle at low speed. Thrust is far below the weight, so the drone stays on the mat.',dof:null},
};
export const TOUR=[['takeoff',3.2],['pitchF',4.2],['rollR',4.2],['yawR',2.6],['climb',2.6],['descend',2.6],['land',3.6]];
export function airborne(){ return FL.armed&&FL.altT>0; }
export function doMan(name){
  const f=FL;
  if(name==='arm'){ if(f.altT>0||f.pos.y>.05){ toast('Land before disarming.'); return; } f.armed=!f.armed; f.landing=false; f.cur=f.armed?'arm':null; renderPanel(); return; }
  if(name==='takeoff'){ f.armed=true; f.landing=false; f.altT=5; S.flown.hover=1; }
  else if(name==='climb'||name==='descend'||name==='land'){
    if(!airborne()){ toast('Take off first.'); return; }
    if(name==='climb') f.altT=Math.min(11,f.altT+3.5);
    if(name==='descend') f.altT=Math.max(2.5,f.altT-3);
    if(name==='land'){ f.altT=0; f.landing=true; }
  } else {
    if(!airborne()||f.pos.y<1.5){ toast('Take off first.'); return; }
    f.man=name.slice(0,-1); f.sign=/[FR]$/.test(name)?1:-1; f.manT=0; S.flown[f.man]=1;
  }
  f.cur=name; renderPanel();
}
export function resetFlight(){
  Object.assign(FL,{armed:false,roll:0,pitch:0,yaw:0,yawRate:0,altT:0,man:null,manT:0,T:0,landing:false,tour:null,cur:null});
  FL.pos.set(0,0,0); FL.vel.set(0,0,0); FL.thr=[0,0,0,0]; FL.last.set(0,0,0);
  droneRoot.position.set(0,0,0); droneRoot.rotation.set(0,0,0);
  [1,2,3,4].forEach(n=>S.spin[n]=0);
}
export function stepFlight(dt){
  const f=FL;
  if(f.tour){ f.tour.t+=dt; const st=TOUR[f.tour.i]; if(f.tour.t>st[1]){ f.tour.i++; f.tour.t=0; if(f.tour.i>=TOUR.length) f.tour=null; else doMan(TOUR[f.tour.i][0]); } }
  let dR=0,dP=0,dY=0; const air=f.armed&&(f.altT>0||f.pos.y>.02);
  if(f.man){ f.manT+=dt;
    if(f.man==='pitch'){ dP=f.manT<1.3?-.3*f.sign:0; if(f.manT>1.7) f.man=null; }
    else if(f.man==='roll'){ dR=f.manT<1.3?-.3*f.sign:0; if(f.manT>1.7) f.man=null; }
    else if(f.man==='yaw'){ dY=f.manT<.98?-1.6*f.sign:0; if(f.manT>1.2) f.man=null; }
  }
  if(air&&f.man!=='pitch'&&f.man!=='roll'){
    const err=V(-f.pos.x,0,-f.pos.z).multiplyScalar(.5); err.clampLength(0,3.5);
    const acc=err.sub(V(f.vel.x,0,f.vel.z)).multiplyScalar(1.6); acc.clampLength(0,3.2); acc.applyAxisAngle(V(0,1,0),-f.yaw);
    dP=Math.asin(clamp(acc.z/G,-.45,.45)); dR=-Math.asin(clamp(acc.x/G,-.45,.45));
  }
  const k=Math.min(1,dt*6); const eR=dR-f.roll, eP=dP-f.pitch;
  f.roll+=eR*k; f.pitch+=eP*k; f.yawRate+=(dY-f.yawRate)*Math.min(1,dt*5); f.yaw+=f.yawRate*dt;
  const eY=dY*.5+(dY-f.yawRate);
  let T=0;
  if(f.armed){ if(air){ const aZ=(f.altT-f.pos.y)*2.0-f.vel.y*2.6; T=(G+clamp(aZ,-6,8))/(Math.cos(f.roll)*Math.cos(f.pitch)); T=clamp(T,0,2.2*G); } else T=G*.12; }
  const base=T/4, r=eR*G*.9, p=eP*G*.9, y=eY*G*.12;
  f.thr=[base+r-p+y, base+r+p-y, base-r-p-y, base-r+p+y].map(v=>f.armed?Math.max(f.armed?G*.02:0,v):0);
  f.T=T;
  droneRoot.rotation.set(f.pitch,f.yaw,f.roll,'YXZ');
  const up=V(0,1,0).applyQuaternion(droneRoot.quaternion);
  const acc=up.multiplyScalar(T).add(V(0,-G,0)).addScaledVector(f.vel,-.45);
  f.vel.addScaledVector(acc,dt); f.pos.addScaledVector(f.vel,dt);
  if(f.pos.y<0){ f.pos.y=0; if(f.vel.y<0) f.vel.y=0; f.vel.x*=.85; f.vel.z*=.85; }
  if(f.landing&&f.pos.y<.01&&f.altT===0){ f.armed=false; f.landing=false; f.cur=null; renderPanel(); }
  droneRoot.position.copy(f.pos);
  const d=f.pos.clone().sub(f.last); camera.position.add(d); controls.target.add(d); f.last.copy(f.pos);
  for(let n=1;n<=4;n++){ const fr=f.thr[n-1]/(G/4); S.spin[n]=f.armed?(EXP[n]==='CW'?-1:1)*(10+32*Math.sqrt(Math.max(0,fr))):0; }
  // forces
  const show=S.forces&&f.armed;
  thrustArrows.forEach((a,i)=>{ a.visible=show; if(show) a.setLength(.5+f.thr[i]/(G/4)*2.2,.6,.4); });
  const c=droneRoot.localToWorld(V(0,2.2,0));
  totalArrow.visible=weightArrow.visible=show;
  if(show){ const u=V(0,1,0).applyQuaternion(droneRoot.quaternion); totalArrow.position.copy(c); totalArrow.setDirection(u); totalArrow.setLength(Math.max(.4,T/G*4),.9,.6); weightArrow.position.copy(c); weightArrow.setLength(4,.9,.6); }
  // airflow
  particles.visible=S.air&&f.armed;
  if(particles.visible){ for(let i=0;i<PN;i++){ const q=pData[i]; const fr=f.thr[q.m-1]/(G/4); q.y-=(3+26*fr)*dt; if(q.y<-7){ q.y=2.0+Math.random()*.2; q.r=Math.sqrt(Math.random())*5.6; q.a=Math.random()*TAU; } const mp=armPos(q.m); const spread=1+(2-q.y)*.03; pPos[i*3]=mp.x+Math.cos(q.a)*q.r*spread; pPos[i*3+1]=q.y; pPos[i*3+2]=mp.z+Math.sin(q.a)*q.r*spread; } pGeo.attributes.position.needsUpdate=true; }
  f.hudT+=dt; if(f.hudT>.1){ f.hudT=0; updateHud(); }
}
export function updateHud(){
  const f=FL, el=id=>document.getElementById(id); if(!el('hudTW')) return;
  el('hudTW').textContent=(f.T/G).toFixed(2);
  el('hudR').textContent=Math.round(-f.roll/DEG)+'°';
  el('hudP').textContent=Math.round(-f.pitch/DEG)+'°';
  el('hudY').textContent=Math.round(((-f.yaw/DEG)%360+360)%360)+'°';
  for(let n=1;n<=4;n++){ const pct=clamp(f.thr[n-1]/(G/4)*35,0,100); el('mb'+n).style.width=pct+'%'; el('mv'+n).textContent=Math.round(pct)+'%'; }
}
