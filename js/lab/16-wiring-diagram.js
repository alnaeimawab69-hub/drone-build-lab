/* Drone Build Lab · 2D wiring diagram and wire validation */
'use strict';
/* ================= 2D wiring diagram (wiring-chart style) ================= */
const DG={fc:{cx:600,cy:260,s:120/1.8},esc:{cx:600,cy:610,s:55}};
const DG_SRC={
  cam:{box:[565,24,130,60,'FPV CAMERA','5V · G · VIDEO OUT'],tips:[[600,112],[637,112],[673,112]]},
  vtx:{box:[870,182,140,62,'VIDEO TRANSMITTER','5.8 GHz · 9 V in'],tips:[[805,213],[805,243],[805,273]]},
  gps:{box:[110,226,140,66,'GPS MODULE','UART 3'],tips:[[400,230],[400,260],[400,290],[400,320]]},
  rx:{box:[110,372,150,66,'RADIO RECEIVER','2.4 GHz · UART 1'],tips:[[400,388],[400,412],[400,436],[400,460]]},
  lead:{box:[420,814,150,46,'BATTERY LEAD','to 4S LiPo · 12 AWG'],tips:[[560,772],[520,772]]},
  cap:{box:[650,814,150,46,'CAPACITOR','35 V · 1000 µF'],tips:[[720,772],[690,772]]},
  mot4:{circ:[300,545,44],tips:[[410,563]]}, mot2:{circ:[900,545,44],tips:[[790,563]]},
  mot3:{circ:[300,770,44],tips:[[410,657]]}, mot1:{circ:[900,770,44],tips:[[790,657]]},
};
S.diagram=true;
const srcOf=h=>Object.values(PADS).filter(q=>q.hotId===h&&q.need);
function dgXY(p){
  const d=p.def.pos;
  if(p.hotId==='fc') return [DG.fc.cx+d.x*DG.fc.s,DG.fc.cy+d.z*DG.fc.s];
  if(p.hotId==='esc') return [DG.esc.cx+d.x*DG.esc.s,DG.esc.cy+d.z*DG.esc.s];
  const c=DG_SRC[p.hotId]; return c?c.tips[srcOf(p.hotId).indexOf(p)]:[0,0];
}
function dgAnchor(h,tip){
  const c=DG_SRC[h]; if(!c) return tip;
  if(c.circ){ const [x,y,r]=c.circ, d=Math.hypot(tip[0]-x,tip[1]-y)||1; return [x+(tip[0]-x)/d*r,y+(tip[1]-y)/d*r]; }
  const [x,y,w,hh]=c.box; return [clamp(tip[0],x,x+w),clamp(tip[1],y,y+hh)];
}
function dgRoute(a,b,tgt){
  if(tgt.net==='ESC') return `M${a[0]},${a[1]} V470 H455 V${b[1]} H${b[0]}`;
  const o=tgt.def.out||V(0,1,0);
  return Math.abs(o.z)>.5?`M${a[0]},${a[1]} H${b[0]} V${b[1]}`:`M${a[0]},${a[1]} V${b[1]} H${b[0]}`;
}
function dgStroke(d,src){
  const need=src.need;
  const strand=(c,dx,w=4)=>`<path d="${d}" transform="translate(${dx},${dx})" fill="none" stroke="#0d0f11" stroke-width="${w+2.5}" stroke-linejoin="round"/><path d="${d}" transform="translate(${dx},${dx})" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
  if(need[0]==='M') return PHASE_COLS.map((c,i)=>strand(hex(c),(i-1)*3.5,3)).join('');
  if(need==='ESC') return HARNESS_COLS.map((c,i)=>strand(hex(c),(i-2.5)*2.6,2.2)).join('');
  const c=wireColor(need,src.label); return strand(c===0x2b2f35?'#3a3f46':hex(c),0,need.startsWith('VBAT')?6:4);
}
function renderDiagram(){
  const el=$('#diagram'), on=stageKey()==='wire'&&S.diagram; el.hidden=!on; $('#viewport').classList.toggle('dg',on); updateViewbar(); if(!on) return;
  const learn=S.mode==='learn', pads=Object.values(PADS);
  const tgtSvg=pads.filter(p=>!p.need).map(p=>{
    const [x,y]=dgXY(p), o=p.def.out||V(0,1,0), lx=x-o.x*24, ly=y-o.z*24+4;
    let shape;
    if(p.def.shape==='triple') shape=[-14,0,14].map(dy=>`<rect class="pad" x="${x-7}" y="${y+dy-5}" width="14" height="10" rx="2" fill="#d4a93c"/>`).join('');
    else if(p.def.shape==='big') shape=`<rect class="pad" x="${x-12}" y="${y-9}" width="24" height="18" rx="3" fill="${p.net==='VBAT+'?'#c8402f':'#d4a93c'}"/>`;
    else if(p.def.shape==='socket') shape=`<rect class="pad" x="${x-24}" y="${y-9}" width="48" height="18" rx="3" fill="#e9e6dc"/>`;
    else shape=`<rect class="pad" x="${x-8}" y="${y-8}" width="16" height="16" rx="3" fill="#d4a93c"/>`;
    const lab=p.def.shape==='socket'?`<text x="${x}" y="${y+4}" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#1b1f23">ESC</text>`:`<text class="t-pad" x="${lx}" y="${ly}" text-anchor="middle">${esc(p.label)}</text>`;
    return `<g class="tgt" data-tgt="${p.id}" data-net="${p.net}">${shape}${lab}<rect x="${x-15}" y="${y-15}" width="30" height="30" fill="transparent"/></g>`;
  }).join('');
  const wired=WIRES.map(w=>{ const src=PADS[w.src], tgt=PADS[w.tgt]; if(!src||!tgt) return ''; const tip=dgXY(src), a=src.hotId==='esc'?tip:dgAnchor(src.hotId,tip); return dgStroke(`M${a[0]},${a[1]} L${tip[0]},${tip[1]} `+dgRoute(tip,dgXY(tgt),tgt).replace(/^M[^ ]+ /,''),src)+`<circle cx="${dgXY(tgt)[0]}" cy="${dgXY(tgt)[1]}" r="5" fill="#dfe3e6" stroke="#6b7378"/>`; }).join('');
  const tips=pads.filter(p=>p.need&&!p.wired).map(p=>{
    const tip=dgXY(p), a=p.hotId==='esc'?[tip[0],tip[1]+14]:dgAnchor(p.hotId,tip), c=wireColor(p.need,p.label), col=c===0x2b2f35?'#3a3f46':hex(c);
    const dx=tip[0]-a[0], dy=tip[1]-a[1], dl=Math.hypot(dx,dy)||1, lx=tip[0]+dx/dl*20, ly=tip[1]+dy/dl*20+4;
    const knob=p.need[0]==='M'?`<circle class="knob" cx="${tip[0]}" cy="${tip[1]}" r="11" fill="#8a939c" stroke="#111" stroke-width="1.5"/>`:p.need==='ESC'?`<rect class="knob" x="${tip[0]-22}" y="${tip[1]-8}" width="44" height="16" rx="3" fill="#e9e6dc" stroke="#111" stroke-width="1.5"/>`:`<circle class="knob" cx="${tip[0]}" cy="${tip[1]}" r="9" fill="${col}" stroke="#111" stroke-width="1.5"/>`;
    const lab=p.need==='ESC'?`<text class="t-tip" x="${tip[0]}" y="${tip[1]+4}" text-anchor="middle" style="font-size:9px">HARNESS</text>`:`<text class="t-tip" x="${lx}" y="${ly}" text-anchor="middle">${esc(p.need[0]==='M'?'3 wires':p.label)}</text>`;
    return `<g class="tip" data-src="${p.id}">${p.hotId==='esc'?'':`<line x1="${a[0]}" y1="${a[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="#0d0f11" stroke-width="6.5"/><line x1="${a[0]}" y1="${a[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="${p.need[0]==='M'?'#8a939c':col}" stroke-width="4"/>`}${knob}${lab}</g>`;
  }).join('');
  const comp=Object.entries(DG_SRC).filter(([h])=>parts[h]).map(([h,c])=>{
    if(c.circ){ const [x,y,r]=c.circ, n=+h.slice(3); return `<circle cx="${x}" cy="${y}" r="${r}" fill="#2a2f35" stroke="#0d0f11" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r*.55}" fill="#3b444d"/><circle cx="${x}" cy="${y}" r="5" fill="#b9c0c7"/><text class="t-h" x="${x}" y="${y-r-10}" text-anchor="middle">MOTOR ${n}</text><text class="t-s" x="${x}" y="${y+r+16}" text-anchor="middle">${CORNER[n]} · ${EXP[n]}</text>`; }
    const [x,y,w,hh,t,sub]=c.box; return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="8" fill="#2a2f35" stroke="#0d0f11" stroke-width="2"/><text x="${x+w/2}" y="${y+hh/2-2}" text-anchor="middle" style="font:700 12px var(--f-mono);fill:#f2f2ee">${t}</text><text x="${x+w/2}" y="${y+hh/2+14}" text-anchor="middle" style="font-size:10px;fill:#aab3b8">${sub}</text>`;
  }).join('');
  const done=srcPads().filter(p=>p.wired).length, total=srcPads().length;
  el.innerHTML=`<svg viewBox="0 0 1100 880" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Wiring diagram. Drag each coloured wire end onto its pad.">
    <text class="t-title" x="40" y="44">WIRING DIAGRAM</text><text class="t-s" x="40" y="64">LX-250 stack · top view, front at the top</text>
    <g transform="translate(40,84)"><text class="t-h" y="0">Stack specifications</text>
      ${[['Mounting','30.5 × 30.5 mm'],['Input','3–6S LiPo'],['BEC','5 V 2 A · 9 V 2 A'],['Receiver','UART 1'],['GPS','UART 3'],['Video','CAM in · VTX out']].map(([k,v],i)=>`<text class="t-s" y="${20+i*17}">${k}</text><text y="${20+i*17}" x="92" style="font-size:11px">${v}</text>`).join('')}</g>
    <g transform="translate(870,40)"><text class="t-h">Wire colours</text>
      ${[['#d8453b','Power (+, 5V, 9V)'],['#3a3f46','Ground (G, −)'],['#e8c33c','Video'],['#3d9be0','TX (transmit)'],['#eeeeee','RX (receive)'],['#8a939c','Motor phases']].map(([c,l],i)=>`<rect x="0" y="${12+i*18}" width="22" height="7" rx="2" fill="${c}" stroke="#0d0f11"/><text class="t-s" x="30" y="${19+i*18}">${l}</text>`).join('')}</g>
    <g transform="translate(40,700)"><text class="t-h" style="fill:#b2382b">Default ports</text>
      ${[['UART 1','Receiver'],['UART 3','GPS'],['CAM','Camera video in'],['VTX','Video out to VTX']].map(([k,v],i)=>`<text y="${20+i*17}" style="font-size:11px;font-weight:600">${k}</text><text class="t-s" x="64" y="${20+i*17}">${v}</text>`).join('')}</g>
    <g transform="translate(40,800)"><text style="font:700 12px var(--f-mono);fill:#b2382b">⚠ Capacitor required</text><text class="t-s" y="16">absorbs voltage spikes</text></g>
    <rect x="480" y="140" width="240" height="240" rx="18" fill="#22262b" stroke="#0d0f11" stroke-width="2"/>
    ${[[495,155],[705,155],[495,365],[705,365]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#d4a93c" stroke-width="3"/>`).join('')}
    <path d="M600,222 l18,26 h-10 v26 h-16 v-26 h-10 z" fill="#f2f2ee"/><text x="600" y="296" text-anchor="middle" style="font:700 12px var(--f-mono);fill:#f2f2ee">FRONT</text>
    <text x="600" y="318" text-anchor="middle" style="font:600 10px var(--f-mono);fill:#aab3b8">FLIGHT CONTROLLER</text>
    <rect x="490" y="500" width="220" height="220" rx="14" fill="#22262b" stroke="#0d0f11" stroke-width="2"/>
    <text x="600" y="616" text-anchor="middle" style="font:700 12px var(--f-mono);fill:#f2f2ee">4-IN-1 ESC</text><text x="600" y="632" text-anchor="middle" style="font:600 10px var(--f-mono);fill:#aab3b8">stack, lower board</text>
    ${comp}${wired}${tgtSvg}${tips}
    <text x="1060" y="870" text-anchor="end" class="t-s">${done} of ${total} wires soldered</text>
    <path id="dgTemp" d="" fill="none" stroke="#e0894a" stroke-width="4" stroke-dasharray="8 6" stroke-linecap="round" pointer-events="none"/>
    <g id="dgFlash"></g>
  </svg>`;
}
function dgPoint(svg,e){ const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
function dgFlash(xy,ok){
  const g=document.getElementById('dgFlash'); if(!g) return;
  const w=ok?60:96, el=document.createElementNS('http://www.w3.org/2000/svg','g'); el.setAttribute('class','flash');
  el.innerHTML=`<rect x="${xy[0]-w/2}" y="${xy[1]-44}" width="${w}" height="26" rx="13" fill="${ok?'#2f9e63':'#d23b2f'}"/><text x="${xy[0]}" y="${xy[1]-26}" text-anchor="middle">${ok?'✓ OK':'✕ WRONG'}</text>`;
  g.appendChild(el); setTimeout(()=>el.remove(),1400);
}
$('#diagram').addEventListener('pointerdown',e=>{
  const t=e.target.closest('.tip'); if(!t) return;
  const svg=$('#diagram svg'), src=PADS[t.dataset.src]; if(!src||src.wired) return;
  e.preventDefault(); svg.setPointerCapture(e.pointerId);
  S.drag={kind:'dg',src:src.id,over:null};
  if(S.mode==='learn') svg.querySelectorAll('.tgt').forEach(g=>g.classList.toggle('hint',g.dataset.net===src.need));
});
$('#diagram').addEventListener('pointermove',e=>{
  if(!S.drag||S.drag.kind!=='dg') return;
  const svg=$('#diagram svg'), src=PADS[S.drag.src], a=dgXY(src), q=dgPoint(svg,e);
  svg.querySelector('#dgTemp').setAttribute('d',`M${a[0]},${a[1]} L${q.x},${q.y}`);
  const over=document.elementFromPoint(e.clientX,e.clientY), g=over&&over.closest('.tgt');
  svg.querySelectorAll('.tgt.over').forEach(x=>x!==g&&x.classList.remove('over')); if(g) g.classList.add('over');
  S.drag.over=g?g.dataset.tgt:null;
});
function dgEnd(e,cancel){
  if(!S.drag||S.drag.kind!=='dg') return;
  const {src,over}=S.drag; S.drag=null;
  const svg=$('#diagram svg'); svg.querySelector('#dgTemp').setAttribute('d','');
  svg.querySelectorAll('.tgt').forEach(g=>g.classList.remove('hint','over'));
  if(cancel||!over) return;
  const tgtXY=dgXY(PADS[over]), r=attemptWire(PADS[src],PADS[over]);
  if(r==='ok'){ renderPanel(); dgFlash(tgtXY,true); }
  else if(r==='bad'){ dgFlash(tgtXY,false); const tip=svg.querySelector(`.tip[data-src="${src}"]`); if(tip){ tip.classList.remove('shake'); void tip.getBBox(); tip.classList.add('shake'); } const pad=svg.querySelector(`.tgt[data-tgt="${over}"] .pad`); if(pad){ const f=pad.getAttribute('fill'); pad.setAttribute('fill','#d23b2f'); setTimeout(()=>pad.setAttribute('fill',f),900); } }
}
$('#diagram').addEventListener('pointerup',e=>dgEnd(e,false));
$('#diagram').addEventListener('pointercancel',e=>dgEnd(e,true));

const NETNAME={'VBAT+':'battery + pad','VBAT-':'battery − pad','5V':'5 V supply','9V':'9 V supply','GND':'ground (G)','T1':'UART 1 transmit (T1)','R1':'UART 1 receive (R1)','T3':'UART 3 transmit (T3)','R3':'UART 3 receive (R3)','CAM':'camera input (CAM)','VTX':'video output (VTX)','ESC':'ESC socket',M1:'motor output M1',M2:'motor output M2',M3:'motor output M3',M4:'motor output M4'};
function explainWire(src,tgt){
  const need=src.need, got=tgt.net, owner=TYPES[HOTMAP[src.hotId].type].name;
  const pol=s=>s==='VBAT+'||s==='VBAT-';
  if(pol(need)&&pol(got)) return `Reversed polarity. The ${owner.toLowerCase()} ${src.label} goes to the ${need==='VBAT+'?'+':'−'} pad. Reversing it can destroy the ESC${HOTMAP[src.hotId].type==='cap'?' and the capacitor (its striped leg is negative)':''} the moment the battery is plugged in.`;
  if(pol(need)) return `The ${owner.toLowerCase()} carries full battery voltage. It belongs on the ESC battery pads, not the ${NETNAME[got]}.`;
  if(need[0]==='M'&&got&&got[0]==='M') return `That is output ${got}. The motor on the ${CORNER[+need[1]]} arm must use ${need}, because the flight controller expects motor ${need[1]} in that corner.`;
  if(/^[TR][13]$/.test(need)&&/^[TR][13]$/.test(got)){
    if(need[1]!==got[1]) return `Wrong serial port. The ${owner.toLowerCase()} uses UART ${need[1]}; that pad belongs to UART ${got[1]}.`;
    return 'TX and RX cross over: a transmit (TX) wire goes to a receive pad (R), and an RX wire goes to a transmit pad (T).';
  }
  if(need==='5V'&&got==='9V') return `Too much voltage. The ${owner.toLowerCase()} runs on 5 V and the 9 V pad can burn it out.`;
  if(need==='9V'&&got==='5V') return 'The video transmitter is fed from the 9 V pad. 5 V is below its input range.';
  if((need==='5V'||need==='9V')&&got==='GND') return 'Short circuit. A power wire on a ground pad shorts the supply.';
  if(need==='GND'&&(got==='5V'||got==='9V')) return 'Short circuit. The ground wire must go to a G pad, not a power pad.';
  if(need==='GND') return 'Ground wires go to a G (ground) pad.';
  if(need==='CAM'&&got==='VTX') return 'Camera video goes into the CAM pad. The VTX pad sends video out to the transmitter.';
  if(need==='VTX'&&got==='CAM') return 'The transmitter takes video out of the flight controller from the VTX pad. CAM is the camera input.';
  if(need==='ESC') return 'The ESC harness plugs into the ESC socket on the flight controller.';
  return `This wire needs the ${NETNAME[need]}, but that is the ${NETNAME[got]||'wrong pad'}.`;
}
const NETSHORT={'VBAT+':'ESC +','VBAT-':'ESC −','5V':'FC 5V','9V':'FC 9V','GND':'a G pad','T1':'FC T1','R1':'FC R1','T3':'FC T3','R3':'FC R3','CAM':'FC CAM','VTX':'FC VTX','ESC':'FC ESC socket',M1:'ESC M1',M2:'ESC M2',M3:'ESC M3',M4:'ESC M4'};
