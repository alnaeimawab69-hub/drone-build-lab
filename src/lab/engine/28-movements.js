/* Drone Build Lab · Drone movements activity: throttle, yaw, pitch and roll with two transmitter sticks */
import * as THREE from 'three';
import { $, DEG, EXP, MODEL, V, clamp, esc } from './01-config.js';
import { camera, controls } from './02-scene.js';
import { S } from './08-state.js';
import { droneRoot, thrustArrows } from './09-scene-content.js';
import { screenOf } from './14-markers-picking.js';
import { G } from './19-flight.js';
import { stageKey } from './20-stages.js';
import { renderPanel } from './21-panel.js';
import { toast } from './23-toast.js';

/* ================= Movements =================
   Mode 2 transmitter (the most common): left stick = throttle (up/down) and yaw (left/right),
   right stick = pitch (up/down) and roll (left/right). A positive value means up / right / forward.
   This module sits in an import cycle, so its 3D objects are made on first use, not at load time. */
const AXES=['thr','yaw','pitch','roll'];
const COL={thr:0xe3b54b,yaw:0x5bc489,pitch:0xec6a5e,roll:0x3d9be0};
export const MOVES={
  thr:{name:'Throttle',stick:'Left stick, up and down',short:'Left stick ↕',keys:'W / S',
    what:'Changes the speed of all four motors together, so the drone goes up or down.',
    pos:{t:'Throttle up',d:'All four motors speed up together. Thrust is now bigger than the weight, so the drone climbs.'},
    neg:{t:'Throttle down',d:'All four motors slow down together. Thrust is now smaller than the weight, so the drone sinks.'}},
  yaw:{name:'Yaw',stick:'Left stick, left and right',short:'Left stick ↔',keys:'A / D',
    what:'Turns the nose left or right while the drone stays level, like shaking your head “no”.',
    pos:{t:'Yaw right',d:'The counter-clockwise motors (M2, M3) speed up and the clockwise motors (M1, M4) slow down. Their twisting forces no longer cancel, so the frame turns clockwise and the nose swings right.'},
    neg:{t:'Yaw left',d:'The clockwise motors (M1, M4) speed up and the counter-clockwise motors (M2, M3) slow down, so the frame turns anticlockwise and the nose swings left.'}},
  pitch:{name:'Pitch',stick:'Right stick, up and down',short:'Right stick ↕',keys:'↑ / ↓',
    what:'Tilts the nose down or up, like nodding “yes”. Tilting forward makes the drone fly forward.',
    pos:{t:'Pitch forward',d:'The rear motors (M1, M3) speed up and the front motors (M2, M4) slow down. The nose dips, the thrust tilts forward and pushes the drone ahead.'},
    neg:{t:'Pitch back',d:'The front motors (M2, M4) speed up and the rear motors (M1, M3) slow down. The nose lifts and the tilted thrust pushes the drone backward.'}},
  roll:{name:'Roll',stick:'Right stick, left and right',short:'Right stick ↔',keys:'← / →',
    what:'Tilts the drone to one side, like tilting your head towards your shoulder. The drone slides sideways that way.',
    pos:{t:'Roll right',d:'The left motors (M3, M4) speed up and the right motors (M1, M2) slow down. The drone banks right and the tilted thrust slides it to the right.'},
    neg:{t:'Roll left',d:'The right motors (M1, M2) speed up and the left motors (M3, M4) slow down. The drone banks left and slides to the left.'}},
};
const STICK_OF={thr:['L','y'],yaw:['L','x'],pitch:['R','y'],roll:['R','x']};
const HOVER=6, MAX_TILT=28*DEG, MAX_YAW=110*DEG;
const PLAY_SEQ=[[1,1.7],[0,.9],[-1,1.7],[0,1]];

export const MV={in:{thr:0,yaw:0,pitch:0,roll:0},drag:null,dragV:{L:{x:0,y:0},R:{x:0,y:0}},keys:{},anim:null,queue:[],quiz:null,
  pos:V(),vel:V(),last:V(),alt:0,vy:0,roll:0,pitch:0,yaw:0,yawRate:0,lv:[1,1,1,1],active:null,hudT:0,vis:null};

/* ---------- 3D helpers: axis lines, rotation arrows, throttle arrow ---------- */
function ringArrow(col,R){
  const mat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95,depthTest:false});
  const arc=Math.PI*1.5, inner=new THREE.Group(), g=new THREE.Group(); g.add(inner);
  const t=new THREE.Mesh(new THREE.TorusGeometry(R,.11,8,56,arc),mat); inner.add(t);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.36,.9,16),mat);
  head.position.set(R*Math.cos(arc),R*Math.sin(arc),0); head.quaternion.setFromUnitVectors(V(0,1,0),V(-Math.sin(arc),Math.cos(arc),0));
  inner.add(head); t.renderOrder=head.renderOrder=12; g.userData.inner=inner; g.visible=false;
  return g;
}
function axisLine(a,b,col){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,a.distanceTo(b),6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.35,depthWrite:false}));
  m.position.copy(a).lerp(b,.5); m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize()); return m;
}
function buildVis(){
  if(MV.vis) return MV.vis;
  const C=V(0,2,0), L=MODEL.arm+4.5, g=new THREE.Group(); g.position.copy(C);
  const lines={roll:axisLine(V(0,0,-L),V(0,0,L),COL.roll),pitch:axisLine(V(-L,0,0),V(L,0,0),COL.pitch),yaw:axisLine(V(0,-3.5,0),V(0,9.5,0),COL.yaw)};
  Object.values(lines).forEach(l=>g.add(l));
  const rings={roll:ringArrow(COL.roll,2.4),pitch:ringArrow(COL.pitch,2.4),yaw:ringArrow(COL.yaw,2.6)};
  rings.roll.position.set(0,0,-L);                              // around the nose-to-tail axis, out in front
  rings.pitch.position.set(L,0,0); rings.pitch.rotation.y=Math.PI/2;  // around the side-to-side axis, out to the right
  rings.yaw.position.set(0,8.2,0); rings.yaw.rotation.x=-Math.PI/2;   // around the vertical axis, above
  Object.values(rings).forEach(r=>g.add(r));
  const thr=new THREE.ArrowHelper(V(0,1,0),V(0,0,0),6,COL.thr,1.4,.9); thr.traverse(o=>{ if(o.material){ o.material.depthTest=false; o.material.transparent=true; } }); thr.renderOrder=12; thr.visible=false; g.add(thr);
  g.traverse(o=>o.userData.noStyle=true);
  const tags={roll:[V(0,0,-L-3.2),'Roll axis'],pitch:[V(L+3.2,0,0),'Pitch axis'],yaw:[V(0,10.6,0),'Yaw axis']};
  MV.vis={g,lines,rings,thr,tags,tagEls:{},cap:null,L};
  return MV.vis;
}

/* ---------- view lifecycle (called from 20-stages.js) ---------- */
export function enterMoves(){
  const v=buildVis(); if(!v.g.parent) droneRoot.add(v.g); v.g.visible=true;
  Object.assign(MV,{anim:null,queue:[],quiz:null,climbed:false,recentre:null,alt:0,vy:0,roll:0,pitch:0,yaw:0,yawRate:0,active:null,drag:null});
  AXES.forEach(a=>MV.in[a]=0); MV.dragV.L={x:0,y:0}; MV.dragV.R={x:0,y:0}; MV.keys={};
  MV.pos.set(0,0,0); MV.vel.set(0,0,0); MV.last.set(0,0,0);
  droneRoot.position.set(0,0,0); droneRoot.rotation.set(0,0,0);
  const box=$('#labels');
  for(const a in v.tags){ const d=document.createElement('div'); d.className='plabel axis'; d.style.color='#'+COL[a].toString(16).padStart(6,'0'); d.textContent=v.tags[a][1]; box.appendChild(d); v.tagEls[a]=d; }
  v.cap=document.createElement('div'); v.cap.className='mvcap'; $('#viewport').appendChild(v.cap);
}
export function exitMoves(){
  const v=MV.vis; if(!v) return;
  v.g.visible=false; Object.values(v.tagEls).forEach(d=>d.remove()); v.tagEls={}; if(v.cap){ v.cap.remove(); v.cap=null; }
  MV.anim=null; MV.queue=[]; MV.quiz=null; MV.drag=null;
  droneRoot.position.set(0,0,0); droneRoot.rotation.set(0,0,0);
  thrustArrows.forEach(a=>a.visible=false); [1,2,3,4].forEach(n=>S.spin[n]=0);
}

/* ---------- actions (wired up in 20-stages.js) ---------- */
export function playMove(a){ MV.quiz=null; MV.queue=[]; startAnim(a); renderPanel(); }
export function playAll(){ MV.quiz=null; MV.queue=AXES.slice(1); startAnim(AXES[0]); renderPanel(); }
function startAnim(a){ MV.anim={a,i:0,t:0}; }
export function stopMoves(){ MV.anim=null; MV.queue=[]; renderPanel(); }
export function startQuiz(){
  const list=AXES.flatMap(a=>[[a,1],[a,-1]]);
  for(let i=list.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [list[i],list[j]]=[list[j],list[i]]; }
  MV.anim=null; MV.queue=[]; MV.quiz={list,i:0,first:0,wrong:false,center:true,msg:null,ok:null};
  renderPanel();
}
export function endQuiz(){ MV.quiz=null; renderPanel(); }
export function recentre(){ MV.vel.set(0,0,0); const p0=MV.pos.clone(); MV.recentre={p0,t:0}; }

/* ---------- input ---------- */
const KEYMAP={w:['thr',1],s:['thr',-1],a:['yaw',-1],d:['yaw',1],arrowup:['pitch',1],i:['pitch',1],arrowdown:['pitch',-1],k:['pitch',-1],arrowleft:['roll',-1],j:['roll',-1],arrowright:['roll',1],l:['roll',1]};
function typing(e){ const t=e.target; return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable); }
window.addEventListener('keydown',e=>{
  if(stageKey()!=='moves'||typing(e)||e.ctrlKey||e.metaKey||e.altKey) return;
  const k=KEYMAP[e.key.toLowerCase()]; if(!k) return;
  e.preventDefault(); if(MV.anim){ MV.anim=null; MV.queue=[]; S.dirty=true; } MV.keys[e.key.toLowerCase()]=true;
});
window.addEventListener('keyup',e=>{ delete MV.keys[e.key.toLowerCase()]; });
window.addEventListener('blur',()=>{ MV.keys={}; MV.drag=null; });
function stickFromEvent(e){
  const d=MV.drag; if(!d) return;
  const r=d.rect, half=r.width/2*.78;
  MV.dragV[d.s]={x:clamp((e.clientX-(r.left+r.width/2))/half,-1,1),y:clamp(-(e.clientY-(r.top+r.height/2))/half,-1,1)};
}
document.addEventListener('pointerdown',e=>{
  const st=e.target.closest&&e.target.closest('.stick'); if(!st||stageKey()!=='moves') return;
  e.preventDefault(); if(MV.anim){ MV.anim=null; MV.queue=[]; S.dirty=true; }
  MV.drag={s:st.dataset.s,id:e.pointerId,rect:st.getBoundingClientRect()}; stickFromEvent(e);
});
window.addEventListener('pointermove',e=>{ if(MV.drag&&e.pointerId===MV.drag.id) stickFromEvent(e); });
const dragEnd=e=>{ if(MV.drag&&e.pointerId===MV.drag.id){ MV.dragV[MV.drag.s]={x:0,y:0}; MV.drag=null; } };
window.addEventListener('pointerup',dragEnd); window.addEventListener('pointercancel',dragEnd);

/* the value each axis is steered towards this frame: a playing animation, a dragged stick, or the keys */
function inputTarget(a){
  if(MV.anim&&MV.anim.a===a) return PLAY_SEQ[MV.anim.i][0];
  if(MV.anim) return 0;
  const [s,c]=STICK_OF[a];
  if(MV.drag&&MV.drag.s===s) return MV.dragV[s][c];
  let v=0; for(const k in MV.keys){ const m=KEYMAP[k]; if(m&&m[0]===a) v+=m[1]; }
  return clamp(v,-1,1);
}

/* ---------- quiz ---------- */
function dominant(){ let best=null,bv=0; for(const a of AXES){ const v=Math.abs(MV.in[a]); if(v>bv){ bv=v; best=a; } } return bv>.7?[best,Math.sign(MV.in[best])]:null; }
function stepQuiz(){
  const q=MV.quiz; if(!q||q.i>=q.list.length||MV.anim) return;
  if(q.center){ if(AXES.every(a=>Math.abs(MV.in[a])<.25)) q.center=false; return; }
  const d=dominant(); if(!d) return;
  const [a,s]=q.list[q.i], hit=d[0]===a&&d[1]===s;
  q.center=true;
  if(hit){
    if(!q.wrong) q.first++;
    q.ok=true; q.msg=`Correct: ${MOVES[a][s>0?'pos':'neg'].t}. ${MOVES[a][s>0?'pos':'neg'].d}`;
    q.i++; q.wrong=false;
    toast(q.i>=q.list.length?`Quiz finished: ${q.first} of ${q.list.length} right first time.`:'Correct!','ok');
  } else {
    q.wrong=true; q.ok=false;
    q.msg=`That was ${MOVES[d[0]][d[1]>0?'pos':'neg'].t.toLowerCase()}. ${MOVES[a].name} is the ${MOVES[a].stick.toLowerCase()}.`;
  }
  renderPanel();
}

/* ---------- simulation, every frame ---------- */
export function stepMoves(dt){
  const v=MV.vis; if(!v) return;
  /* animation timeline */
  if(MV.anim){ const an=MV.anim; an.t+=dt; if(an.t>PLAY_SEQ[an.i][1]){ an.t=0; an.i++; if(an.i>=PLAY_SEQ.length){ MV.anim=MV.queue.length?{a:MV.queue.shift(),i:0,t:0}:null; S.dirty=true; } } }
  for(const a of AXES){ const t=inputTarget(a); MV.in[a]+=(t-MV.in[a])*Math.min(1,dt*(MV.drag?14:5)); if(Math.abs(MV.in[a])<.002) MV.in[a]=0; }
  stepQuiz();
  const I=MV.in;
  /* attitude: angle mode, so the stick sets the tilt; yaw stick sets the turn rate */
  const k=Math.min(1,dt*5);
  MV.roll+=(-I.roll*MAX_TILT-MV.roll)*k; MV.pitch+=(-I.pitch*MAX_TILT-MV.pitch)*k;
  MV.yawRate+=(-I.yaw*MAX_YAW-MV.yawRate)*Math.min(1,dt*6); MV.yaw+=MV.yawRate*dt;
  /* height: take off to a hover first, then the throttle stick sets the climb rate */
  if(MV.alt<HOVER-.05&&!I.thr&&!MV.climbed){ MV.alt+=(HOVER-MV.alt)*Math.min(1,dt*1.6); MV.vy=0; }
  else { MV.climbed=true; MV.vy+=(I.thr*5-MV.vy)*Math.min(1,dt*4); MV.alt+=MV.vy*dt; if(MV.alt<2.5||MV.alt>15){ MV.alt=clamp(MV.alt,2.5,15); MV.vy=0; } }
  /* the tilted thrust pushes the drone across the ground; air drag slows it */
  const fwd=V(-Math.sin(MV.yaw),0,-Math.cos(MV.yaw)), right=V(Math.cos(MV.yaw),0,-Math.sin(MV.yaw));
  const acc=fwd.multiplyScalar(G*Math.tan(-MV.pitch)*1.6).addScaledVector(right,G*Math.tan(-MV.roll)*1.6).addScaledVector(MV.vel,-1.1);
  const dist=Math.hypot(MV.pos.x,MV.pos.z); if(dist>14) acc.addScaledVector(V(MV.pos.x,0,MV.pos.z).normalize(),-(dist-14)*3);
  MV.vel.addScaledVector(acc,dt); MV.pos.addScaledVector(MV.vel,dt);
  if(MV.recentre){ const r=MV.recentre; r.t=Math.min(1,r.t+dt/1.2); MV.pos.copy(r.p0).multiplyScalar(1-r.t*r.t*(3-2*r.t)); MV.vel.set(0,0,0); if(r.t>=1) MV.recentre=null; }
  droneRoot.position.set(MV.pos.x,MV.alt,MV.pos.z);
  droneRoot.rotation.set(MV.pitch,MV.yaw,MV.roll,'YXZ');
  const d=droneRoot.position.clone().sub(MV.last); camera.position.add(d); controls.target.add(d); MV.last.copy(droneRoot.position);
  /* motor mixer: what each motor does for each stick (M1 RR CW · M2 FR CCW · M3 RL CCW · M4 FL CW) */
  const T=1+I.thr*.35+(MV.climbed?0:.2), R=I.roll*.3, P=I.pitch*.3, Y=I.yaw*.3;
  MV.lv=[T-R+P-Y, T-R-P+Y, T+R+P+Y, T+R-P-Y].map(x=>Math.max(.15,x));
  for(let n=1;n<=4;n++) S.spin[n]=(EXP[n]==='CW'?-1:1)*(12+26*MV.lv[n-1]);
  thrustArrows.forEach((a,i)=>{ a.visible=S.forces; if(S.forces) a.setLength(.6+MV.lv[i]*2.1,.6,.4); });
  /* what is moving now: highlight that axis */
  let act=MV.anim?MV.anim.a:null;
  if(!act){ let bv=.12; for(const a of AXES){ if(Math.abs(I[a])>bv){ bv=Math.abs(I[a]); act=a; } } }
  MV.active=act;
  for(const a of ['roll','pitch','yaw']){
    const on=act===a&&Math.abs(I[a])>.05, r=v.rings[a];
    r.visible=on; v.lines[a].material.opacity=act===a?.9:.3;
    if(on){ const dir=-Math.sign(I[a]); r.userData.inner.scale.x=dir; r.userData.inner.rotation.z+=dir*dt*2.2; }
  }
  const thrOn=act==='thr'&&Math.abs(I.thr)>.05; v.thr.visible=thrOn;
  if(thrOn){ v.thr.setDirection(V(0,Math.sign(I.thr),0)); v.thr.position.set(0,I.thr>0?3.5:-1,0); }
  /* screen overlays */
  const vr=$('#viewport').getBoundingClientRect();
  for(const a in v.tagEls){ const el=v.tagEls[a], w=droneRoot.localToWorld(v.tags[a][0].clone().add(v.g.position)), s=screenOf(w);
    el.style.display=s.z>1?'none':''; el.style.opacity=act===a||!act?1:.45; el.style.transform=`translate(${s.x-vr.left}px,${s.y-vr.top}px) translate(-50%,-50%)`; }
  if(v.cap){ const sgn=act?Math.sign(I[act])||1:1, m=act?MOVES[act][sgn>0?'pos':'neg']:null;
    const html=m?`<b style="color:#${COL[act].toString(16).padStart(6,'0')}">${m.t}</b><span>${MOVES[act].stick}</span>`:'<b>Hover</b><span>Sticks centred: the drone holds its height and stays level</span>';
    if(v.cap.dataset.h!==html){ v.cap.innerHTML=html; v.cap.dataset.h=html; } }
  updateSticksUI();
}
function updateSticksUI(){
  const I=MV.in, put=(id,x,y)=>{ const el=document.getElementById(id); if(el) el.style.transform=`translate(${x*39}px,${-y*39}px)`; };
  put('mvKL',I.yaw,I.thr); put('mvKR',I.roll,I.pitch);
  document.querySelectorAll('.mvcard').forEach(c=>c.classList.toggle('on',c.dataset.a===MV.active));
  MV.hudT+=1; if(MV.hudT%6) return;
  for(let n=1;n<=4;n++){ const b=document.getElementById('mvb'+n), t=document.getElementById('mvv'+n); if(!b) return; const pct=clamp(MV.lv[n-1]*50,0,100); b.style.width=pct+'%'; t.textContent=Math.round(pct)+'%'; }
  const set=(id,txt)=>{ const el=document.getElementById(id); if(el) el.textContent=txt; };
  set('mvR',Math.round(-MV.roll/DEG)+'°'); set('mvP',Math.round(-MV.pitch/DEG)+'°');
  set('mvY',Math.round(((-MV.yaw/DEG)%360+360)%360)+'°'); set('mvH',(MV.alt*10).toFixed(0)+' mm');
}

/* ---------- side panel ---------- */
export function renderMoves(){
  const q=MV.quiz, playing=MV.anim||MV.queue.length;
  const stick=(s,v,h)=>`<div class="stickwrap"><div class="stick" data-s="${s}" role="img" aria-label="${s==='L'?'Left':'Right'} stick: up and down is ${v}, left and right is ${h}">
      <span class="st-l t">▲</span><span class="st-l b">▼</span><span class="st-l l">◀</span><span class="st-l r">▶</span><div class="knob" id="mvK${s}"></div></div>
      <small><b>${s==='L'?'Left':'Right'} stick</b><span class="st-h">↕ ${v.toLowerCase()} · ↔ ${h.toLowerCase()}</span>${s==='L'?'<kbd>W</kbd><kbd>S</kbd> <kbd>A</kbd><kbd>D</kbd>':'<kbd>↑</kbd><kbd>↓</kbd> <kbd>←</kbd><kbd>→</kbd>'}</small></div>`;
  let quiz='';
  if(q){
    const done=q.i>=q.list.length, cur=done?null:q.list[q.i];
    quiz=`<div class="mvquiz"><div class="eyebrow">Quiz · ${Math.min(q.i+1,q.list.length)} of ${q.list.length}</div>
      ${done?`<b>${q.first} of ${q.list.length} right first time</b><p>${q.first===q.list.length?'Perfect. You know every stick movement.':'Play the movements you missed, then try again.'}</p><div class="row"><button class="btn sm primary" data-act="mvQuiz">Try again</button><button class="btn sm ghost" data-act="mvQuizEnd">Close</button></div>`
      :`<b>Make the drone: ${MOVES[cur[0]][cur[1]>0?'pos':'neg'].t}</b><p>Move one stick, then let it go back to the centre.</p>`}
      ${q.msg&&!done?`<p class="${q.ok?'okc':'badc'}">${esc(q.msg)}</p>`:''}</div>`;
  }
  const cards=AXES.map(a=>{ const m=MOVES[a];
    return `<div class="mvcard" data-a="${a}" style="--c:#${COL[a].toString(16).padStart(6,'0')}"><header><b>${m.name}</b><span>${m.short} · ${m.keys}</span></header><p>${m.what}</p>
      <details><summary>What the motors do</summary><p><b>${m.pos.t}:</b> ${m.pos.d}</p><p><b>${m.neg.t}:</b> ${m.neg.d}</p></details>
      <button class="btn sm" data-act="mvPlay" data-a="${a}" ${q?'disabled':''}>▶ Play ${m.name.toLowerCase()}</button></div>`; }).join('');
  return {
    head:`<div class="eyebrow">Activity · ${esc(MODEL.name)}</div><h2>Drone movements</h2><p>Learn the four basic movements: throttle, yaw, pitch and roll. See which stick does each one and how the motors make it happen.</p>`,
    body:`<div class="sticks">${stick('L','Throttle','Yaw')}${stick('R','Pitch','Roll')}</div>
      <p class="note">Mode 2 transmitter, the most common layout. <b>Drag a stick</b> or use the keys. Sticks spring back to the centre. In this trainer the centre of the throttle stick holds a hover.</p>
      ${quiz}
      <div class="hud"><div><small>Roll</small><span id="mvR">0°</span></div><div><small>Pitch</small><span id="mvP">0°</span></div><div><small>Heading</small><span id="mvY">0°</span></div><div><small>Height</small><span id="mvH">0 mm</span></div></div>
      <div class="row"><button class="btn sm ghost" data-act="mvCentre">Fly back to the centre</button>${playing?'<button class="btn sm" data-act="mvStop">Stop animation</button>':''}</div>
      <div class="bars">${[1,2,3,4].map(n=>`<div class="bar"><span>M${n} ${({1:'RR',2:'FR',3:'RL',4:'FL'})[n]} · ${EXP[n]}</span><div class="tr"><div class="fl ${EXP[n]==='CCW'?'ccw':''}" id="mvb${n}"></div></div><span class="v" id="mvv${n}">0%</span></div>`).join('')}</div>
      <div class="toggles"><label><input type="checkbox" id="chkForces" ${S.forces?'checked':''}> Thrust arrows</label></div>
      <div><h3 class="sec">The four movements</h3><div class="mvcards">${cards}</div></div>`,
    foot:`<button class="btn ghost" data-act="exploreBack">← Parts</button><button class="btn" data-act="mvQuiz">${q?'Restart quiz':'Quiz me'}</button><button class="btn primary" data-act="mvAll" ${q?'disabled':''}>▶ Play all</button>`,
  };
}
