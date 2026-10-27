/* Drone Build Lab · Info card and floating part labels */
import { $, ARM, MODEL, V, armPos, esc } from './01-config.js';
import { canvas } from './02-scene.js';
import { TYPES } from './07-catalogue.js';
import { S, parts } from './08-state.js';
import { FORCE_LEN, droneRoot, netArrow, totalArrow } from './09-scene-content.js';
import { screenOf } from './14-markers-picking.js';
import { FORCE, G } from './19-flight.js';
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
      /* one label per kind of part where the copies sit side by side (second strap, second battery) */
      if(p.type==='aluSt'||p.type==='nylSt'||p.type==='camPlate'||p.type==='panel'||(p.type==='arm'&&p.hot.motor!==2)||id==='strap2'||id==='bat2') continue;
      if(!LBL[id]){ const d=document.createElement('div'); d.className='plabel'; d.textContent=partLabel(p); d.onclick=()=>showInfo(p.type); box.appendChild(d); LBL[id]=d; }
      const w=p.type==='arm'?droneRoot.localToWorld(armPos(2,ARM*.56).setY(MODEL.armLblY||.8)):p.group.getWorldPosition(V()).add(TYPES[p.type].lab||V(0,1,0)); const s=screenOf(w); const r=canvas.getBoundingClientRect();
      LBL[id].style.display=s.z>1?'none':''; LBL[id].style.transform=`translate(${s.x-r.left}px,${s.y-r.top}px) translate(-50%,-100%)`;
    }
  }
  /* force names at the arrow tips, in flight and in Movements */
  const showF=(stageKey()==='fly'||stageKey()==='moves')&&totalArrow.visible;
  if(showF&&!forceLbl){ forceLbl=[['Total thrust',''],['Weight','w'],['Net force','n']].map(([t,c])=>{ const d=document.createElement('div'); d.className='plabel force '+c; d.textContent=t; box.appendChild(d); return d; }); }
  if(!showF&&forceLbl){ forceLbl.forEach(d=>d.remove()); forceLbl=null; }
  if(forceLbl){ const r=canvas.getBoundingClientRect(), K=FORCE_LEN/G, c=FORCE.c;
    const tips=[c.clone().addScaledVector(FORCE.up,FORCE.T*K+.7),c.clone().add(V(0,-FORCE_LEN-.7,0)),netArrow.visible?c.clone().addScaledVector(FORCE.net.clone().normalize(),FORCE.net.length()*K+1):null];
    tips.forEach((w,i)=>{ const el=forceLbl[i]; el.style.display=w?'':'none'; if(!w) return; const s=screenOf(w); el.style.transform=`translate(${s.x-r.left}px,${s.y-r.top}px) translate(-50%,-50%)`; }); }
}
