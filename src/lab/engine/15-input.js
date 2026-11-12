/* Drone Build Lab · Mouse/touch input: dragging parts, wires and screws */
import * as THREE from 'three';
import { $, CORNER, EX, EXP, V, lc } from './01-config.js';
import { canvas, canvasHooks, controls } from './02-scene.js';
import { M } from './04-materials.js';
import { PROXY_MAT } from './05-geometry.js';
import { HOTMAP, TYPES, accepts, propDir } from './07-catalogue.js';
import { PADS, S, parts } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { addWire, createPart, dependents, padLocal, padName, place, removeGroup, setFCRot, setPadMat, unplace, wireCurve } from './12-placement.js';
import { SCR, SCREWT, endScrewDrag, moveScrewDrag, pickHole, tryDrive } from './13-screws.js';
import { computeSnap, hotOf, insideCanvas, pickPad, pickPart, planePoint, ray, setNDC, updateMarkers } from './14-markers-picking.js';
import { explainWire } from './16-wiring-diagram.js';
import { mistake, secOf } from './17-scoring.js';
import { stopAllSpin } from './18-motor-test.js';
import { stageKey } from './20-stages.js';
import { renderPanel } from './21-panel.js';
import { showInfo } from './22-info-labels.js';
import { toast } from './23-toast.js';
import { tr } from '../../lang.js';

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
  if(S.pending){ if(Math.hypot(e.clientX-S.pending.x,e.clientY-S.pending.y)>6){ const id=S.pending.id; S.pending=null; const dep=dependents(id); if(dep.length){ toast(tr(`Remove the ${lc(TYPES[parts[dep[0]].type].name)} first. It is fitted to this part.`,`Tanggalkan ${lc(TYPES[parts[dep[0]].type].name)} dahulu. Ia dipasang pada bahagian ini.`)); return; } if(HOTMAP[id].stage==='power') stopAllSpin(); const g=unplace(id); beginPartDrag(g.userData.typeKey,g,e); } return; }
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
  else if((k==='frame'||k==='mount')&&pickHole()){ const s=SCR[pickHole()]; cur='pointer'; t=S.mode==='learn'?tr(`Hole for an ${SCREWT[s.spec.kind].name}`,`Lubang untuk ${SCREWT[s.spec.kind].name}`):tr('Fastener hole','Lubang pengikat'); }
  else if(k==='frame'||k==='mount'||k==='power'||k==='props'){ const id=pickPart(k); if(id){ cur='grab'; t=TYPES[parts[id].type].name+(parts[id].type==='fc'&&k==='mount'?tr(' · click to rotate',' · klik untuk memusingkan'):''); } }
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
  d.snap=computeSnap(e.clientX,e.clientY,d.typeKey);
  /* only preview the part where it fits; a wrong spot still counts as a mistake on drop */
  if(d.snap&&accepts(d.snap,d.typeKey)){ const h=d.snap; g.position.copy(h.pos); g.rotation.set(h.rotX||0,h.rotY||0,0); }
  else { const wp=planePoint(controls.target.clone()); g.position.copy(droneRoot.worldToLocal(wp)); g.rotation.set(0,d.typeKey==='motor'?-Math.PI/4:0,0); }
  updateMarkers(); showTip(d.snap?d.snap.label:TYPES[d.typeKey].name,e.clientX,e.clientY);
}
export function endPartDrag(e,cancel){
  const {typeKey:t,group:g,snap:h}=S.drag; S.drag=null; document.body.classList.remove('dragging'); showTip(null);
  const learn=S.mode==='learn', nm=TYPES[t].name;
  if(cancel||!h){ removeGroup(g); }
  else if(!accepts(h,t)){
    removeGroup(g);
    const sec=secOf(); const other=h.type==='prop'?tr('a propeller','kipas'):tr('the ','')+lc(TYPES[h.type].name);
    mistake(sec,2,tr(`That spot is for ${other}. The ${lc(nm)} goes ${TYPES[t].where}.`,`Tempat itu untuk ${other}. ${nm} dipasang ${TYPES[t].where}.`),tr(`Wrong place for the ${lc(nm)}.`,`Tempat yang salah untuk ${lc(nm)}.`));
  } else if(h.type==='prop'&&propDir(t)!==EXP[h.motor]){
    removeGroup(g);
    mistake('props',3,tr(`Motor ${h.motor} (${CORNER[h.motor]}) spins ${EXP[h.motor]}, so it needs a ${EXP[h.motor]} propeller. The wrong propeller pushes air up, and the drone flips at take-off.`,`Motor ${h.motor} (${CORNER[h.motor]}) berputar ${EXP[h.motor]}, jadi ia memerlukan kipas ${EXP[h.motor]}. Kipas yang salah menolak udara ke atas, dan dron terbalik semasa berlepas.`),tr(`That propeller does not match this motor.`,`Kipas itu tidak sepadan dengan motor ini.`));
  } else {
    place(h,g,{animate:true}); S.undo.push({k:'part',id:h.id,stage:stageKey()});
    if(h.type==='fc'){ toast(learn?tr('Flight controller fitted. Now click the board to turn it until the arrow points to the front.','Pengawal penerbangan dipasang. Sekarang klik papan untuk memusingkannya sehingga anak panah menghala ke depan.'):tr('Flight controller fitted.','Pengawal penerbangan dipasang.'),'ok'); }
    else toast(tr(`${nm} fitted${h.motor&&h.type==='motor'?' to arm '+h.motor:''}.`,`${nm} dipasang${h.motor&&h.type==='motor'?' pada lengan '+h.motor:''}.`),'ok');
  }
  updateMarkers(); controls.enabled=true; renderPanel();
}
export function clickPart(id){
  const p=parts[id]; if(!p) return;
  if(p.type==='fc'&&stageKey()==='mount'){ setFCRot((S.fcRot+1)%4); if(S.mode==='learn'&&S.fcRot===0) toast(tr('The arrow points to the front. The flight controller is the right way round.','Anak panah menghala ke depan. Pengawal penerbangan berada pada arah yang betul.'),'ok'); renderPanel(); return; }
  showInfo(p.type);
}
export function infoClick(){
  const hit=ray.intersectObject(droneRoot,true).find(h=>h.object.material!==PROXY_MAT&&!h.object.isSprite&&!h.object.isPoints&&!h.object.isLine&&h.object.parent&&!h.object.parent.isArrowHelper);
  if(!hit) return;
  const id=hotOf(hit.object); if(id&&parts[id]) return showInfo(parts[id].type);
  let o=hit.object; while(o&&o!==droneRoot){ if(o.userData.isFrame) return showInfo('frame'); o=o.parent; }
}

/* wire drag */
export let rubber=null;
export function startWireDrag(id){
  const p=PADS[id];
  if(p.need&&p.wired){ toast(tr('That wire is already soldered.','Wayar itu sudah dipateri.')); controls.enabled=true; return; }
  S.drag={kind:'wire',from:id,hover:null};
  if(S.mode==='learn'&&p.need) Object.values(PADS).forEach(q=>{ if(!q.need&&q.net===p.need) setPadMat(q,M.padGood); });
  document.body.classList.add('dragging');
}
export function moveWireDrag(e){
  setNDC(e); const d=S.drag; const id=insideCanvas(e)?pickPad():null;
  if(d.hover&&d.hover!==id){ const q=PADS[d.hover]; if(q) setPadMat(q,S.mode==='learn'&&!q.need&&q.net===PADS[d.from].need?M.padGood:null); }
  d.hover=id&&id!==d.from?id:null;
  if(d.hover) setPadMat(PADS[d.hover],M.padHover);
  droneRoot.updateMatrixWorld(true);
  const a=padLocal(d.from); const b=d.hover?padLocal(d.hover):droneRoot.worldToLocal(planePoint(PADS[d.from].vis.getWorldPosition(V())));
  if(rubber){ rubber.geometry.dispose(); droneRoot.remove(rubber); }
  rubber=new THREE.Mesh(new THREE.TubeGeometry(wireCurve(a,b),24,EX?.3:.045,5,false),M.rubber); rubber.renderOrder=6; droneRoot.add(rubber);
  showTip(d.hover?padName(PADS[d.hover]):padName(PADS[d.from]),e.clientX,e.clientY);
}
export function endWireDrag(e,cancel){
  const d=S.drag; S.drag=null; document.body.classList.remove('dragging'); showTip(null);
  if(rubber){ rubber.geometry.dispose(); droneRoot.remove(rubber); rubber=null; }
  Object.values(PADS).forEach(q=>setPadMat(q,null));
  if(!cancel&&d.hover){
    let src=PADS[d.from], tgt=PADS[d.hover];
    if(!src.need&&tgt.need) [src,tgt]=[tgt,src];
    if(src.need&&tgt.need) toast(tr('Both ends are wires. Drop the wire end on a pad of the ESC or flight controller.','Kedua-dua hujung ialah wayar. Lepaskan hujung wayar pada pad ESC atau pengawal penerbangan.'));
    else if(!src.need&&!tgt.need) toast(tr('Start from a wire end (a coloured dot or plug). Then drop it on a pad.','Mula dari hujung wayar (titik berwarna atau palam). Kemudian lepaskan pada pad.'));
    else if(src.wired) toast(tr('That wire is already soldered.','Wayar itu sudah dipateri.'));
    else if(tgt.net===src.need){ addWire(src.id,tgt.id); S.undo.push({k:'wire',id:src.id,stage:'wire'}); toast(`${tr('Soldered','Dipateri')}: ${TYPES[HOTMAP[src.hotId].type].name} ${src.label} → ${TYPES[HOTMAP[tgt.hotId].type].name} ${tgt.label}`,'ok'); }
    else mistake('wire',2,explainWire(src,tgt),tr('Wrong pad. The wire was not soldered.','Pad yang salah. Wayar tidak dipateri.'));
  }
  controls.enabled=true; renderPanel();
}
export function attemptWire(src,tgt){
  if(!src||!tgt) return 'none';
  if(!src.need&&tgt.need) [src,tgt]=[tgt,src];
  if(src.need&&tgt.need){ toast(tr('Both ends are wires. Drop the wire end on a pad of the ESC or flight controller.','Kedua-dua hujung ialah wayar. Lepaskan hujung wayar pada pad ESC atau pengawal penerbangan.')); return 'none'; }
  if(src.wired){ toast(tr('That wire is already soldered.','Wayar itu sudah dipateri.')); return 'none'; }
  if(tgt.net===src.need){ addWire(src.id,tgt.id); S.undo.push({k:'wire',id:src.id,stage:'wire'}); toast(`${tr('Soldered','Dipateri')}: ${TYPES[HOTMAP[src.hotId].type].name} ${src.label} → ${TYPES[HOTMAP[tgt.hotId].type].name} ${tgt.label}`,'ok'); return 'ok'; }
  mistake('wire',2,explainWire(src,tgt),tr('Wrong pad. The wire was not soldered.','Pad yang salah. Wayar tidak dipateri.')); return 'bad';

}
