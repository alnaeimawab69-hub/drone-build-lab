/* Drone Build Lab · Mouse/touch input: dragging parts, wires and screws */
'use strict';
/* ================= Pointer handling ================= */
function onCanvasDown(e){
  if(S.drag||e.button>0) return;
  setNDC(e); const k=stageKey();
  if(k==='wire'){ const id=pickPad(); if(id){ controls.enabled=false; startWireDrag(id,e); return; } }
  if(k==='frame'||k==='mount'){ const hid=pickHole(); if(hid){ controls.enabled=false; S.pendingHole={id:hid,x:e.clientX,y:e.clientY}; return; } }
  if(k==='frame'||k==='mount'||k==='power'||k==='props'){ const id=pickPart(k); if(id){ controls.enabled=false; S.pending={id,x:e.clientX,y:e.clientY}; return; } }
  S.click={x:e.clientX,y:e.clientY};
}
window.addEventListener('pointermove',e=>{
  if(S.pendingHole){ if(Math.hypot(e.clientX-S.pendingHole.x,e.clientY-S.pendingHole.y)>6) S.pendingHole=null; return; }
  if(S.pending){ if(Math.hypot(e.clientX-S.pending.x,e.clientY-S.pending.y)>6){ const id=S.pending.id; S.pending=null; const dep=dependents(id); if(dep.length){ toast(`Take off the ${TYPES[parts[dep[0]].type].name.toLowerCase()} first. It is fitted to this part.`); return; } const g=unplace(id); beginPartDrag(g.userData.typeKey,g,e); } return; }
  if(S.drag&&S.drag.kind==='part') movePartDrag(e);
  else if(S.drag&&S.drag.kind==='wire') moveWireDrag(e);
  else if(S.drag&&S.drag.kind==='screw') moveScrewDrag(e);
  else hover(e);
});
function pointerEnd(e,cancel){
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

const tip=$('#tip');
function showTip(text,x,y){ if(!text){ tip.classList.remove('show'); return; } tip.textContent=text; tip.style.transform=`translate(${Math.min(x+16,innerWidth-tip.offsetWidth-8)}px,${y+16}px)`; tip.classList.add('show'); }
function hover(e){
  if(e.target!==canvas){ showTip(null); return; }
  setNDC(e); const k=stageKey(); let cur='', t=null;
  if(k==='wire'){ const id=pickPad(); if(id){ cur='pointer'; t=padName(PADS[id]); } }
  else if((k==='frame'||k==='mount')&&pickHole()){ const s=SCR[pickHole()]; cur='pointer'; t=S.mode==='learn'?`Hole for an ${SCREWT[s.spec.kind].name}`:'Fastener hole'; }
  else if(k==='frame'||k==='mount'||k==='power'||k==='props'){ const id=pickPart(k); if(id){ cur='grab'; t=TYPES[parts[id].type].name+(parts[id].type==='fc'&&k==='mount'?' · click to rotate':''); } }
  canvas.style.cursor=cur; showTip(t,e.clientX,e.clientY);
}

/* part drag */
function beginPartDrag(t,g,e){
  g=g||createPart(t); g.userData.typeKey=t; if(!g.parent) droneRoot.add(g); g.visible=false;
  S.drag={kind:'part',typeKey:t,group:g,snap:null}; controls.enabled=false; document.body.classList.add('dragging');
  movePartDrag(e);
}
function movePartDrag(e){
  const d=S.drag, g=d.group;
  if(!insideCanvas(e)){ g.visible=false; d.snap=null; updateMarkers(); showTip(TYPES[d.typeKey].name,e.clientX,e.clientY); return; }
  g.visible=true; setNDC(e);
  d.snap=computeSnap(e.clientX,e.clientY);
  if(d.snap){ const h=d.snap; g.position.copy(h.pos); g.rotation.set(h.rotX||0,h.rotY||0,0); }
  else { const wp=planePoint(controls.target.clone()); g.position.copy(droneRoot.worldToLocal(wp)); g.rotation.set(0,d.typeKey==='motor'?-Math.PI/4:0,0); }
  updateMarkers(); showTip(d.snap?d.snap.label:TYPES[d.typeKey].name,e.clientX,e.clientY);
}
function endPartDrag(e,cancel){
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
function clickPart(id){
  const p=parts[id]; if(!p) return;
  if(p.type==='fc'&&stageKey()==='mount'){ setFCRot((S.fcRot+1)%4); if(S.mode==='learn'&&S.fcRot===0) toast('Arrow points to the front. Correct orientation.','ok'); renderPanel(); return; }
  showInfo(p.type);
}
function infoClick(){
  const hit=ray.intersectObject(droneRoot,true).find(h=>h.object.material!==PROXY_MAT&&!h.object.isSprite&&!h.object.isPoints&&!h.object.isLine&&h.object.parent&&!h.object.parent.isArrowHelper);
  if(!hit) return;
  const id=hotOf(hit.object); if(id&&parts[id]) return showInfo(parts[id].type);
  let o=hit.object; while(o&&o!==droneRoot){ if(o.userData.isFrame) return showInfo('frame'); o=o.parent; }
}

/* wire drag */
let rubber=null;
function startWireDrag(id){
  const p=PADS[id];
  if(p.need&&p.wired){ toast('That wire is already soldered.'); controls.enabled=true; return; }
  S.drag={kind:'wire',from:id,hover:null};
  if(S.mode==='learn'&&p.need) Object.values(PADS).forEach(q=>{ if(!q.need&&q.net===p.need) setPadMat(q,M.padGood); });
  document.body.classList.add('dragging');
}
function moveWireDrag(e){
  setNDC(e); const d=S.drag; const id=insideCanvas(e)?pickPad():null;
  if(d.hover&&d.hover!==id){ const q=PADS[d.hover]; if(q) setPadMat(q,S.mode==='learn'&&!q.need&&q.net===PADS[d.from].need?M.padGood:null); }
  d.hover=id&&id!==d.from?id:null;
  if(d.hover) setPadMat(PADS[d.hover],M.padHover);
  droneRoot.updateMatrixWorld(true);
  const a=padLocal(d.from); const b=d.hover?padLocal(d.hover):droneRoot.worldToLocal(planePoint(PADS[d.from].vis.getWorldPosition(V())));
  if(rubber){ rubber.geometry.dispose(); droneRoot.remove(rubber); }
  rubber=new THREE.Mesh(new THREE.TubeGeometry(wireCurve(a,b),24,.045,5,false),M.rubber); rubber.renderOrder=6; droneRoot.add(rubber);
  showTip(d.hover?padName(PADS[d.hover]):padName(PADS[d.from]),e.clientX,e.clientY);
}
function endWireDrag(e,cancel){
  const d=S.drag; S.drag=null; document.body.classList.remove('dragging'); showTip(null);
  if(rubber){ rubber.geometry.dispose(); droneRoot.remove(rubber); rubber=null; }
  Object.values(PADS).forEach(q=>setPadMat(q,null));
  if(!cancel&&d.hover){
    let src=PADS[d.from], tgt=PADS[d.hover];
    if(!src.need&&tgt.need) [src,tgt]=[tgt,src];
    if(src.need&&tgt.need) toast('Both ends are wires. Solder a wire end to a pad on the ESC or flight controller.');
    else if(!src.need&&!tgt.need) toast('Start from a wire end (the coloured dots and plugs), then drop it on a pad.');
    else if(src.wired) toast('That wire is already soldered.');
    else if(tgt.net===src.need){ addWire(src.id,tgt.id); toast(`Soldered: ${TYPES[HOTMAP[src.hotId].type].name} ${src.label} → ${TYPES[HOTMAP[tgt.hotId].type].name} ${tgt.label}`,'ok'); }
    else mistake('wire',2,explainWire(src,tgt),'Incorrect connection. The wire was not soldered.');
  }
  controls.enabled=true; renderPanel();
}
function attemptWire(src,tgt){
  if(!src||!tgt) return 'none';
  if(!src.need&&tgt.need) [src,tgt]=[tgt,src];
  if(src.need&&tgt.need){ toast('Both ends are wires. Drop the wire end on a pad of the ESC or flight controller.'); return 'none'; }
  if(src.wired){ toast('That wire is already soldered.'); return 'none'; }
  if(tgt.net===src.need){ addWire(src.id,tgt.id); toast(`Soldered: ${TYPES[HOTMAP[src.hotId].type].name} ${src.label} → ${TYPES[HOTMAP[tgt.hotId].type].name} ${tgt.label}`,'ok'); return 'ok'; }
  mistake('wire',2,explainWire(src,tgt),'Wrong pad. The wire was not soldered.'); return 'bad';
}
