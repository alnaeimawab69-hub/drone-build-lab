/* Drone Build Lab · Info card and floating part labels */
import { $, V, armPos, esc } from './01-config.js';
import { canvas } from './02-scene.js';
import { TYPES } from './07-catalogue.js';
import { S, parts } from './08-state.js';
import { droneRoot, totalArrow, weightArrow } from './09-scene-content.js';
import { screenOf } from './14-markers-picking.js';
import { FL, G } from './19-flight.js';
import { stageKey } from './20-stages.js';

/* ================= Info card & labels ================= */
export function showInfo(t){
  const T=TYPES[t]; if(!T) return; const el=$('#info');
  el.innerHTML=`<button class="x" aria-label="Close">×</button><div class="eyebrow">Component</div><h4>${esc(T.name)}</h4><p>${esc(T.role)}</p><dl><dt>Connects</dt><dd>${esc(T.links)}</dd><dt>Spec</dt><dd>${esc(T.spec)}</dd></dl>`;
  el.hidden=false; el.querySelector('.x').onclick=()=>{ el.hidden=true; };
}
export const LBL={};
export function removeLabel(id){ if(LBL[id]){ LBL[id].remove(); delete LBL[id]; } }
export function partLabel(p){ const t=p.hot.type; if(t==='motor') return 'Motor M'+p.hot.motor; if(t==='prop') return (p.type==='propCW'?'CW':'CCW')+' prop'; return TYPES[p.type].name; }
export let forceLbl=null;
export function updateLabels(){
  const box=$('#labels');
  const on=S.labels&&stageKey()!=='wire'&&stageKey()!=='moves';
  for(const id in LBL) if(!on||!parts[id]) removeLabel(id);
  if(on){
    for(const id in parts){ const p=parts[id];
      if(p.type==='aluSt'||p.type==='nylSt'||p.type==='camPlate'||p.type==='panel'||(p.type==='arm'&&p.hot.motor!==2)) continue;
      if(!LBL[id]){ const d=document.createElement('div'); d.className='plabel'; d.textContent=partLabel(p); d.onclick=()=>showInfo(p.type); box.appendChild(d); LBL[id]=d; }
      const w=p.type==='arm'?droneRoot.localToWorld(armPos(2,7).setY(.8)):p.group.getWorldPosition(V()).add(TYPES[p.type].lab||V(0,1,0)); const s=screenOf(w); const r=canvas.getBoundingClientRect();
      LBL[id].style.display=s.z>1?'none':''; LBL[id].style.transform=`translate(${s.x-r.left}px,${s.y-r.top}px) translate(-50%,-100%)`;
    }
  }
  const showF=stageKey()==='fly'&&totalArrow.visible;
  if(showF&&!forceLbl){ forceLbl=[['Total thrust',''],['Weight','w']].map(([t,c])=>{ const d=document.createElement('div'); d.className='plabel force '+c; d.textContent=t; box.appendChild(d); return d; }); }
  if(!showF&&forceLbl){ forceLbl.forEach(d=>d.remove()); forceLbl=null; }
  if(forceLbl){ const r=canvas.getBoundingClientRect(); const u=V(0,1,0).applyQuaternion(droneRoot.quaternion);
    const a=totalArrow.position.clone().addScaledVector(u,Math.max(.4,FL.T/G*4)+.6), b=weightArrow.position.clone().add(V(0,-4.8,0));
    [a,b].forEach((w,i)=>{ const s=screenOf(w); forceLbl[i].style.transform=`translate(${s.x-r.left}px,${s.y-r.top}px) translate(-50%,-50%)`; }); }
}
