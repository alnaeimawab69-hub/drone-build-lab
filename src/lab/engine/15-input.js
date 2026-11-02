/* Drone Build Lab · Mouse/touch input: dragging parts, wires and screws */
import * as THREE from 'three';
import { $, CORNER, EXP, V } from './01-config.js';
import { canvas, canvasHooks, controls } from './02-scene.js';
import { M } from './04-materials.js';
import { PROXY_MAT } from './05-geometry.js';
import { HOTMAP, TYPES, accepts, propDir } from './07-catalogue.js';
import { PADS, S, parts } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { addWire, createPart, dependents, padName, padText, place, removeGroup, setFCRot, setPadLabel, setPadMat, unplace } from './12-placement.js';
import { SCR, SCREWT, endScrewDrag, moveScrewDrag, pickHole, tryDrive } from './13-screws.js';
import { computeSnap, hotOf, insideCanvas, pickPad, pickPart, planePoint, ray, setNDC, updateMarkers } from './14-markers-picking.js';
import { explainWire, wireFault } from './16-wiring-diagram.js';
import { mistake, secOf } from './17-scoring.js';
import { stopAllSpin } from './18-motor-test.js';
import { stageKey } from './20-stages.js';
import { renderPanel } from './21-panel.js';
import { showInfo } from './22-info-labels.js';
import { toast } from './23-toast.js';
import { dropHeld, flashWrong, showHeld } from './31-wire-routing.js';

/* ================= Pointer handling ================= */
export function onCanvasDown(e){
  if(S.drag||e.button>0) return;
  setNDC(e); const k=stageKey();
  if(k==='wire'){ const id=pickPad(); if(id){ controls.enabled=false; startWireDrag(id,e); return; } }
  if(k==='frame'||k==='mount'){ const hid=pickHole(); if(hid){ controls.enabled=false; S.pendingHole={id:hid,x:e.clientX,y:e.clientY}; return; } }
  if(k==='frame'||k==='mount'||k==='power'||k==='props'){ const id=pickPart(k); if(id){ controls.enabled=false; S.pending={id,x:e.clientX,y:e.clientY}; return; } }
  S.click={x:e.clientX,y:e.clientY};
}
canvasHooks.down=onCanvasDown;
window.addEventListener('pointermove',e=>{
  if(S.pendingHole){ if(Math.hypot(e.clientX-S.pendingHole.x,e.clientY-S.pendingHole.y)>6) S.pendingHole=null; return; }
  if(S.pending){ if(Math.hypot(e.clientX-S.pending.x,e.clientY-S.pending.y)>6){ const id=S.pending.id; S.pending=null; const dep=dependents(id); if(dep.length){ toast(`Take off the ${TYPES[parts[dep[0]].type].name.toLowerCase()} first. It is fitted to this part.`); return; } if(HOTMAP[id].stage==='power') stopAllSpin(); const g=unplace(id); beginPartDrag(g.userData.typeKey,g,e); } return; }
  if(S.drag&&S.drag.kind==='part') movePartDrag(e);
  else if(S.drag&&S.drag.kind==='wire') moveWireDrag(e);
  else if(S.drag&&S.drag.kind==='screw') moveScrewDrag(e);
  else hover(e);
});
export function pointerEnd(e,cancel){
  if(S.pendingHole){ const id=S.pendingHole.id; S.pendingHole=null; controls.enabled=true; if(!cancel) tryDrive(id,S.loaded); return; }
  if(S.pending){ const id=S.pending.id; S.pending=null; controls.enabled=true; if(!cancel) clickPart(id); return; }
  if(S.drag&&S.drag.kind==='part') endPartDrag(e,cancel);
  else if(S.drag&&S.drag.kind==='wire') endWireDrag(e,cancel);
  else if(S.drag&&S.drag.kind==='screw') endScrewDrag(e,cancel);
  else if(!cancel&&S.click&&e.target===canvas&&Math.hypot(e.clientX-S.click.x,e.clientY-S.click.y)<5) infoClick(e);
  S.click=null; controls.enabled=true;
}
window.addEventListener('pointerup',e=>pointerEnd(e,false));
window.addEventListener('pointercancel',e=>pointerEnd(e,true));

export const tip=$('#tip');
export function showTip(text,x,y){ if(!text){ tip.classList.remove('show'); return; } tip.textContent=text; tip.style.transform=`translate(${Math.min(x+16,innerWidth-tip.offsetWidth-8)}px,${y+16}px)`; tip.classList.add('show'); }
export function hover(e){
  if(e.target!==canvas){ showTip(null); return; }
  setNDC(e); const k=stageKey(); let cur='', t=null;
  if(k==='wire'){ const id=pickPad(); if(id){ cur='pointer'; t=padName(PADS[id]); } }
  else if((k==='frame'||k==='mount')&&pickHole()){ const s=SCR[pickHole()]; cur='pointer'; t=S.mode==='learn'?`Hole for an ${SCREWT[s.spec.kind].name}`:'Fastener hole'; }
  else if(k==='frame'||k==='mount'||k==='power'||k==='props'){ const id=pickPart(k); if(id){ cur='grab'; t=TYPES[parts[id].type].name+(parts[id].type==='fc'&&k==='mount'?' · click to rotate':''); } }
  canvas.style.cursor=cur; showTip(t,e.clientX,e.clientY);
}

/* part drag */
export function beginPartDrag(t,g,e){
  g=g||createPart(t); g.userData.typeKey=t; if(!g.parent) droneRoot.add(g); g.visible=false;
  S.drag={kind:'part',typeKey:t,group:g,snap:null}; controls.enabled=false; document.body.classList.add('dragging');
  movePartDrag(e);
}
export function movePartDrag(e){
  const d=S.drag, g=d.group;
  if(!insideCanvas(e)){ g.visible=false; d.snap=null; updateMarkers(); showTip(TYPES[d.typeKey].name,e.clientX,e.clientY); return; }
  g.visible=true; setNDC(e);
  d.snap=computeSnap(e.clientX,e.clientY);
  if(d.snap){ const h=d.snap; g.position.copy(h.pos); g.rotation.set(h.rotX||0,h.rotY||0,0); }
  else { const wp=planePoint(controls.target.clone()); g.position.copy(droneRoot.worldToLocal(wp)); g.rotation.set(0,d.typeKey==='motor'?-Math.PI/4:0,0); }
  updateMarkers(); showTip(d.snap?d.snap.label:TYPES[d.typeKey].name,e.clientX,e.clientY);
}
export function endPartDrag(e,cancel){
  const {typeKey:t,group:g,snap:h}=S.drag; S.drag=null; document.body.classList.remove('dragging'); showTip(null);
  const learn=S.mode==='learn', nm=TYPES[t].name;
  if(cancel||!h){ removeGroup(g); }
  else if(!accepts(h,t)){
    removeGroup(g);
    const sec=secOf(); const other=h.type==='prop'?'a propeller':'the '+TYPES[h.type].name.toLowerCase();
    mistake(sec,2,`That spot is for ${other}. The ${nm.toLowerCase()} goes ${TYPES[t].where}.`,`Wrong place for the ${nm.toLowerCase()}.`);
  } else if(h.type==='prop'&&propDir(t)!==EXP[h.motor]){
    removeGroup(g);
    mistake('props',3,`Motor ${h.motor} (${CORNER[h.motor]}) spins ${EXP[h.motor]}, so it needs a ${EXP[h.motor]} propeller. A mismatched prop pushes air upward and the drone flips on take-off.`,`That propeller does not match this motor.`);
  } else {
    place(h,g,{animate:true});
    if(h.type==='fc'){ toast(learn?'Flight controller fitted. Check the arrow: click the board to turn it until the arrow points to the front.':'Flight controller fitted.','ok'); }
    else toast(`${nm} fitted${h.motor&&h.type==='motor'?' to arm '+h.motor:''}.`,'ok');
  }
  updateMarkers(); controls.enabled=true; renderPanel();
}
export function clickPart(id){
  const p=parts[id]; if(!p) return;
  if(p.type==='fc'&&stageKey()==='mount'){ setFCRot((S.fcRot+1)%4); if(S.mode==='learn'&&S.fcRot===0) toast('Arrow points to the front. Correct orientation.','ok'); renderPanel(); return; }
  showInfo(p.type);
}
export function infoClick(){
  const hit=ray.intersectObject(droneRoot,true).find(h=>h.object.material!==PROXY_MAT&&!h.object.isSprite&&!h.object.isPoints&&!h.object.isLine&&h.object.parent&&!h.object.parent.isArrowHelper);
  if(!hit) return;
  const id=hotOf(hit.object); if(id&&parts[id]) return showInfo(parts[id].type);
  let o=hit.object; while(o&&o!==droneRoot){ if(o.userData.isFrame) return showInfo('frame'); o=o.parent; }
}

/* wire drag: the wire in hand is drawn along the route it will take, in its own colour with a glow.
   In practice the pads it may go to light up green and the others dim; over a pad the glow turns green or red */
export function orient(a,b){ return a&&b&&!a.need&&b.need?[b,a]:[a,b]; }
function labelsFor(from){
  const learn=S.mode==='learn';
  Object.values(PADS).forEach(q=>{
    if(q===from){ setPadLabel(q,'active'); return; }
    if(!learn||!from.need){ setPadLabel(q,'idle'); return; }
    setPadLabel(q,!q.need&&q.net===from.need?'hint':'dim');
  });
}
export function startWireDrag(id){
  const p=PADS[id];
  if(p.need&&p.wired){ toast('That wire is already soldered.'); controls.enabled=true; return; }
  S.drag={kind:'wire',from:id,hover:null};
  if(S.mode==='learn'&&p.need) Object.values(PADS).forEach(q=>{ if(!q.need&&q.net===p.need) setPadMat(q,M.padGood); });
  labelsFor(p); showHeld(p.need?id:id,null,null);
  document.body.classList.add('dragging');
}
export function moveWireDrag(e){
  setNDC(e); const d=S.drag; const id=insideCanvas(e)?pickPad():null, from=PADS[d.from];
  const learn=S.mode==='learn';
  if(d.hover&&d.hover!==id){ const q=PADS[d.hover]; if(q){ setPadMat(q,learn&&!q.need&&q.net===from.need?M.padGood:null); setPadLabel(q,learn&&from.need&&!q.need?(q.net===from.need?'hint':'dim'):'idle'); } }
  d.hover=id&&id!==d.from?id:null;
  droneRoot.updateMatrixWorld(true);
  if(d.hover){
    const [src,tgt]=orient(from,PADS[d.hover]), pairOk=src.need&&!tgt.need&&!src.wired, right=pairOk&&tgt.net===src.need;
    setPadMat(PADS[d.hover],learn&&pairOk?(right?M.padGood:M.padHover):M.padHover);
    if(pairOk){ showHeld(src.id,tgt.id,null,learn?(right?'ok':'bad'):'neutral'); setPadLabel(PADS[d.hover],learn?(right?'hint':'bad'):'active'); }
    else showHeld(d.from,null,droneRoot.worldToLocal(planePoint(PADS[d.hover].vis.getWorldPosition(V()))));
    showTip(pairOk?`${padText(src)} → ${padText(tgt)}${learn?(right?'  ✓':'  ✕ wrong pad'):''}`:padName(PADS[d.hover]),e.clientX,e.clientY);
  } else {
    showHeld(d.from,null,droneRoot.worldToLocal(planePoint(from.vis.getWorldPosition(V()))));
    showTip(padName(from),e.clientX,e.clientY);
  }
}
export function endWireDrag(e,cancel){
  const d=S.drag; S.drag=null; document.body.classList.remove('dragging'); showTip(null);
  dropHeld();
  Object.values(PADS).forEach(q=>{ setPadMat(q,null); setPadLabel(q,'idle'); });
  if(!cancel&&d.hover){
    let [src,tgt]=orient(PADS[d.from],PADS[d.hover]);
    if(src.need&&tgt.need) toast('Both ends are wires. Solder a wire end to a pad on the ESC or flight controller.');
    else if(!src.need&&!tgt.need) toast('Start from a wire end (the coloured dots and plugs), then drop it on a pad.');
    else if(src.wired) toast('That wire is already soldered.');
    else if(tgt.net===src.need){ addWire(src.id,tgt.id); toast(`Soldered: ${TYPES[HOTMAP[src.hotId].type].name} ${src.label} → ${TYPES[HOTMAP[tgt.hotId].type].name} ${tgt.label}`,'ok'); }
    else wrongWire(src,tgt,'Incorrect connection. The wire was not soldered.');
  }
  controls.enabled=true; renderPanel();
}
/* a wrong pad costs points, is not soldered, and is shown on the model: a red ghost wire and the reason.
   The assessment shows only that it was wrong; the full explanation goes into the report */
export function wrongWire(src,tgt,short){
  flashWrong(src.id,tgt.id,S.mode==='learn'?wireFault(src,tgt):'Wrong pad');
  mistake('wire',2,explainWire(src,tgt),short);
}
export function attemptWire(src,tgt){
  if(!src||!tgt) return 'none';
  if(!src.need&&tgt.need) [src,tgt]=[tgt,src];
  if(src.need&&tgt.need){ toast('Both ends are wires. Drop the wire end on a pad of the ESC or flight controller.'); return 'none'; }
  if(src.wired){ toast('That wire is already soldered.'); return 'none'; }
  if(tgt.net===src.need){ addWire(src.id,tgt.id); toast(`Soldered: ${TYPES[HOTMAP[src.hotId].type].name} ${src.label} → ${TYPES[HOTMAP[tgt.hotId].type].name} ${tgt.label}`,'ok'); return 'ok'; }
  wrongWire(src,tgt,'Wrong pad. The wire was not soldered.'); return 'bad';
}
