/* Drone Build Lab · Stage flow, auto-complete and panel actions */
import { $, EXP, V, ease } from './01-config.js';
import { camera, controls } from './02-scene.js';
import { M } from './04-materials.js';
import { HOT, HOTMAP, SEC, STAGES } from './07-catalogue.js';
import { PADS, S, parts } from './08-state.js';
import { CAD_MATS, droneRoot, particles, thrustArrows, totalArrow, weightArrow } from './09-scene-content.js';
import { CAM, camTo, tween } from './11-tweens-camera.js';
import { addWire, createPart, layout, place, rebuildWires, setFCRot, srcPads, updatePadSprites } from './12-placement.js';
import { autoScrews, stageScrews, updateScrewMarkers } from './13-screws.js';
import { updateMarkers } from './14-markers-picking.js';
import { beginPartDrag } from './15-input.js';
import { dgXY } from './16-wiring-diagram.js';
import { mistake } from './17-scoring.js';
import { dirActual, setTestSpin, stopAllSpin } from './18-motor-test.js';
import { FL, airborne, doMan, resetFlight } from './19-flight.js';
import { QUIZ, renderAll, renderPanel } from './21-panel.js';
import { showInfo } from './22-info-labels.js';
import { toast } from './23-toast.js';
import { endQuiz, enterMoves, exitMoves, playAll, playMove, recentre, startQuiz, stopMoves } from './28-movements.js';
import { showReport } from './24-start-report.js';

/* ================= Stage flow ================= */
export function stageKey(){ if(S.explore) return S.view==='fly'?'fly':S.view==='moves'?'moves':'explore'; return STAGES[S.stage].key; }
export function ready(k){
  switch(k){
    case 'frame': return HOT.filter(h=>h.stage==='frame').every(h=>parts[h.id])&&stageScrews('frame').every(s=>s.driven);
    case 'mount': return HOT.filter(h=>h.stage==='mount').every(h=>parts[h.id])&&stageScrews('mount').every(s=>s.driven)&&(S.mode!=='learn'||S.fcRot===0);
    case 'wire': return srcPads().length>0&&srcPads().every(p=>p.wired);
    case 'power': return S.test.confirmed;
    case 'props': return HOT.filter(h=>h.stage==='props').every(h=>parts[h.id]);
    case 'fly': return ['hover','pitch','roll','yaw'].every(m=>S.flown[m]);
    case 'quiz': return S.quizDone;
  }
  return false;
}
export function setFCLift(y,dur=.7){ const p=parts.fc; if(!p) return; const y0=p.lift.y; tween(dur,k=>{ p.lift.y=y0+(y-y0)*ease(k); layout(p); rebuildWires(); }); }
export function setTopFade(on){ [M.carbonTop,CAD_MATS.get(M.carbonTop)].filter(Boolean).forEach(m=>{ m.transparent=on; m.opacity=on?.2:1; m.depthWrite=!on; m.needsUpdate=true; }); }
export function enterStage(k){
  const c=CAM[k]; if(c) camTo(c[0],c[1]);
  controls.maxPolarAngle=(k==='frame'||k==='mount')?Math.PI*.92:Math.PI*.49;
  if(k==='wire'){ setFCLift(.95); setTopFade(true); }
  if(k==='fly'){ resetFlight(); }
  if(k==='moves') enterMoves();
  if(k==='quiz'){ controls.autoRotate=true; controls.autoRotateSpeed=.6; }
  $('#info').hidden=true;
  updatePadSprites(); updateMarkers(); renderAll();
}
export function exitStage(k){
  if(k==='wire'){ setFCLift(0); setTopFade(false); }
  if(k==='power') stopAllSpin();
  if(k==='fly'){ resetFlight(); thrustArrows.forEach(a=>a.visible=false); totalArrow.visible=weightArrow.visible=false; particles.visible=false; }
  if(k==='quiz') controls.autoRotate=false;
  if(k==='explore') setExplode(0);
  if(k==='moves') exitMoves();
}
export function gotoStage(i){ const prev=stageKey(); exitStage(prev); S.stage=i; enterStage(stageKey()); }
export function setView(v){ const prev=stageKey(); exitStage(prev); S.view=v; enterStage(stageKey()); }
export function setExplode(v){ S.explode=v; $('#explodeR').value=Math.round(v*100); Object.values(parts).forEach(layout); rebuildWires(); }

/* auto-complete ("Show me" in practice, and the Explore build) */
export function autoMount(anim){
  let i=0;
  HOT.filter(h=>h.stage==='mount').forEach(h=>{ if(parts[h.id]) return; const go=()=>{ if(!parts[h.id]) place(h,createPart(h.type),{animate:anim,fcRot:0}); if(anim) renderPanel(); }; anim?tween(.01,null,go,(i++)*.12):go(); });
  if(parts.fc&&S.fcRot!==0) setFCRot(0,anim?.35:.01);
  anim?tween(.01,null,()=>autoScrews('mount',true),i*.12+.45):autoScrews('mount',false);
}
export function autoFrame(anim){
  let i=0;
  HOT.filter(h=>h.stage==='frame').forEach(h=>{ if(parts[h.id]) return; const go=()=>{ if(!parts[h.id]) place(h,createPart(h.type),{animate:anim}); if(anim) renderPanel(); }; anim?tween(.01,null,go,(i++)*.12):go(); });
  anim?tween(.01,null,()=>autoScrews('frame',true),i*.12+.45):autoScrews('frame',false);
}
export function bestTarget(src){ const a=dgXY(src); let best=null,bd=1e9; for(const p of Object.values(PADS)) if(!p.need&&p.net===src.need){ const b=dgXY(p), d=Math.hypot(b[0]-a[0],b[1]-a[1]); if(d<bd){bd=d;best=p;} } return best; }
export function autoWire(anim){ droneRoot.updateMatrixWorld(true); srcPads().filter(p=>!p.wired).forEach((p,i)=>{ const go=()=>{ if(p.wired||!PADS[p.id]) return; const t=bestTarget(p); if(t) addWire(p.id,t.id); if(anim) renderPanel(); }; anim?tween(.01,null,go,i*.07):go(); }); }
export function autoPower(){ if(!parts.bat) place(HOTMAP.bat,createPart('battery'),{animate:true}); S.test.safety=true; [1,2,3,4].forEach(n=>{ if(dirActual(n)!==EXP[n]) S.test.swapped[n]=!S.test.swapped[n]; }); stopAllSpin(); S.test.confirmed=true; renderPanel(); }
export function autoProps(anim){ [1,2,3,4].forEach((n,i)=>{ const h=HOTMAP['prop'+n]; if(parts[h.id]) return; const go=()=>{ if(!parts[h.id]) place(h,createPart(EXP[n]==='CW'?'propCW':'propCCW'),{animate:anim}); if(anim) renderPanel(); }; anim?tween(.01,null,go,i*.15):go(); }); }

export const ACT={
  next(){
    const k=stageKey(); if(!ready(k)) return;
    if(k==='mount'&&S.fcRot!==0){ mistake('mount',4,'The flight controller arrow was not pointing to the front. The board would read every tilt in the wrong direction and the drone would flip on take-off. It has been turned for you.','Flight controller orientation was wrong.'); setFCRot(0); }
    if(k==='quiz') return showReport();
    gotoStage(S.stage+1);
  },
  show(){ const k=stageKey(); if(k==='frame') autoFrame(true); if(k==='mount') autoMount(true); if(k==='wire') autoWire(true); if(k==='power') autoPower(); if(k==='props') autoProps(true); if(k==='fly'){ if(!airborne()) doMan('takeoff'); FL.tour={i:0,t:0}; } renderPanel(); },
  spin(b){ const n=+b.dataset.m; setTestSpin(n,S.spin[n]===0); renderPanel(); },
  spinAll(){ const any=[1,2,3,4].some(n=>S.spin[n]!==0); [1,2,3,4].forEach(n=>setTestSpin(n,!any)); renderPanel(); },
  swap(b){ const n=+b.dataset.m; const wasRight=dirActual(n)===EXP[n]; S.test.swapped[n]=!S.test.swapped[n];
    if(wasRight) mistake('test',4,`Motor ${n} already spun ${EXP[n]}, the correct way. Swapping two of its wires reversed it. Only swap a motor that turns the wrong way.`,`Motor ${n} was already correct.`);
    else toast(`Two phase wires swapped on motor ${n}. Spin it again to check.`,'ok');
    if(S.spin[n]!==0) setTestSpin(n,true); renderPanel(); },
  confirm(){ const bad=[1,2,3,4].filter(n=>dirActual(n)!==EXP[n]);
    if(bad.length){ mistake('test',4,`Motor ${bad.join(', ')} still spins the wrong way. Compare each motor with the layout: diagonal motors turn the same way.`,'At least one motor still spins the wrong way.'); return; }
    stopAllSpin(); S.test.confirmed=true; toast('All four motors spin the correct way. Ready for propellers.','ok'); renderPanel(); },
  man(b){ FL.tour=null; doMan(b.dataset.m); },
  tour(){ if(!airborne()) doMan('takeoff'); FL.tour={i:0,t:0}; },
  quizSubmit(){ if(Object.keys(S.quizAns).length<QUIZ.length){ toast(`Answer all ${QUIZ.length} questions first.`); return; }
    let ok=0; QUIZ.forEach((q,i)=>{ if(S.quizAns[i]===q.a) ok++; else S.mistakes.push({sec:'quiz',msg:`Q${i+1}: ${q.why}`}); });
    S.quizDone=true; S.quizScore=Math.round(SEC.quiz*ok/QUIZ.length*10)/10; toast(`${ok} of ${QUIZ.length} correct.`,ok===QUIZ.length?'ok':'info'); renderPanel(); },
  exploreFly(){ setView('fly'); },
  exploreMoves(){ setView('moves'); },
  mvPlay(b){ playMove(b.dataset.a); }, mvAll(){ playAll(); }, mvStop(){ stopMoves(); },
  mvQuiz(){ startQuiz(); }, mvQuizEnd(){ endQuiz(); }, mvCentre(){ recentre(); },
  exploreBack(){ setView('parts'); },
  focus(b){ const id=b.dataset.h; const p=parts[id]; if(!p) return showInfo('frame'); showInfo(p.type); const w=p.group.getWorldPosition(V()); const off=camera.position.clone().sub(controls.target).setLength(11); camTo(w.clone().add(off),w,.8); },
  report(){ showReport(); },
};
$('#panel').addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(!b||b.disabled) return; ACT[b.dataset.act]&&ACT[b.dataset.act](b); });
$('#panel').addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='safeChk'){ S.test.safety=t.checked; renderPanel(); }
  if(t.id==='chkForces'){ S.forces=t.checked; }
  if(t.id==='chkAir'){ S.air=t.checked; }
  if(t.name&&t.name.startsWith('q')){ S.quizAns[+t.name.slice(1)]=+t.value; }
});
$('#panel').addEventListener('pointerdown',e=>{
  const si=e.target.closest('.sitem');
  if(si){ e.preventDefault(); S.loaded=si.dataset.screw; document.querySelectorAll('.sitem').forEach(b=>{ const on=b===si; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); }); S.drag={kind:'screw',screw:S.loaded,hole:null}; updateScrewMarkers(); return; }
  const it=e.target.closest('.titem'); if(!it||it.disabled) return;
  e.preventDefault(); const c=it.querySelector('.tc'); const left=+it.dataset.left-1; if(c) c.textContent='×'+left; if(left<=0) it.style.opacity=.32;
  beginPartDrag(it.dataset.type,null,e);
});
