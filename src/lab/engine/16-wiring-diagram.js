/* Drone Build Lab · 2D wiring diagram and wire validation
   The diagram is a top view (front at the top) drawn to match the 3D model:
   - every part sits on the same side of the stack as on the drone, and its wires reach the same pads from the
     same direction (camera / LED strip from the front, VTX up the right side, GPS up the left, receiver from the
     rear, battery lead and capacitor at the back of the ESC)
   - the motors sit at the model's real arm angles and their wires run along the arms, as in 3D
   - colours, pad names and the order of the pins on each part come from the same tables as the 3D wires */
import { $, ARM_ANG, CINE, CORNER, DEG, EXP, MODEL, clamp, esc } from './01-config.js';
import { WIRE_COL, hex, netKind, wireColor, wireLegend } from './04-materials.js';
import { HARNESS_COLS, PHASE_COLS } from './05-geometry.js';
import { HOTMAP, TYPES } from './07-catalogue.js';
import { PADS, S, WIRES, parts } from './08-state.js';
import { srcPads } from './12-placement.js';
import { attemptWire } from './15-input.js';
import { stageKey } from './20-stages.js';
import { renderPanel, updateViewbar } from './21-panel.js';

/* ================= Layout ================= */
const VW=1100, VH=1060;
export const DG={fc:{cx:550,cy:300,s:240/3.6},esc:{cx:550,cy:740,s:55}};
const MOT_R=300, LEAD_R=205, ARM_IN=168;                       // motor centre, motor-lead end and arm bend, from the ESC centre
const tipsAlong=(n,a,b,step)=>{ const st=a+(b-a-(n-1)*step)/2; return Array.from({length:n},(_,i)=>st+i*step); };
/* part boxes: [x, y, w, h, title, subtitle] and the side the wires leave from */
export const DG_SRC={
  cam:{box:[480,30,140,58,'FPV CAMERA','front cage'],side:'bottom',xs:[550,587,623]},
  vtx:{box:[810,325,160,96,'VIDEO TRANSMITTER','rear bay · 5.8 GHz'],side:'left'},
  gps:{box:[90,300,170,100,'GPS MODULE','top plate, rear'],side:'right'},
  rx:{box:[385,488,135,56,'RADIO RECEIVER','rear bay, left'],side:'top'},
  lead:{box:[410,968,140,52,'BATTERY LEAD',CINE?'to 6S LiPo · 12 AWG':'to 4S LiPo · 12 AWG'],side:'top',xs:{'−':450,'+':510}},
  cap:{box:[565,968,140,52,'CAPACITOR',CINE?'50 V · 1000 µF':'35 V · 1000 µF'],side:'top',xs:{'−':600,'+':660}},
};
/* model 2: no analog camera. The LED strip uses the front pads, the digital VTX uses UART 2 */
if(CINE){
  delete DG_SRC.cam;
  DG_SRC.led={box:[480,30,140,58,'LED STRIP','right side panel'],side:'bottom',xs:[550,587,623]};
  DG_SRC.vtx={box:[810,315,160,116,'DIGITAL VTX','rear bay · HD video'],side:'left'};
}
S.diagram=true;
const DIR={bottom:[0,1],top:[0,-1],left:[-1,0],right:[1,0]};
export const srcOf=h=>Object.values(PADS).filter(q=>q.hotId===h&&q.need);
const armDir=n=>{ const a=ARM_ANG[n]*DEG; return [Math.cos(a),-Math.sin(a)]; };
const escAt=r=>n=>{ const [dx,dy]=armDir(n); return [DG.esc.cx+dx*r,DG.esc.cy+dy*r]; };
const motorXY=escAt(MOT_R), leadXY=escAt(LEAD_R), bendXY=escAt(ARM_IN);
/* a wire end on a part: where it leaves the part (anchor), where its loose end hangs (knob), which way it points */
function srcTip(p){
  const h=p.hotId;
  if(h.startsWith('mot')){ const n=+h.slice(3), k=leadXY(n); return {anchor:k,knob:k,dir:armDir(n).map(v=>-v)}; }
  if(h==='esc'){ const k=dgPadXY(p); return {anchor:k,knob:k,dir:[0,-1]}; }
  const c=DG_SRC[h]; if(!c) return {anchor:[0,0],knob:[0,0],dir:[0,1]};
  const [x,y,w,hh]=c.box, d=DIR[c.side], list=srcOf(h), i=list.indexOf(p);
  let a;
  if(c.side==='bottom'||c.side==='top'){
    const xs=Array.isArray(c.xs)?c.xs:c.xs?list.map(q=>c.xs[q.label]):tipsAlong(list.length,x,x+w,30);
    a=[xs[i],c.side==='bottom'?y+hh:y];
  } else { const ys=tipsAlong(list.length,y,y+hh,25); a=[c.side==='left'?x:x+w,ys[i]]; }
  return {anchor:a,knob:[a[0]+d[0]*26,a[1]+d[1]*26],dir:d};
}
function dgPadXY(p){
  const d=p.def.pos;
  if(p.hotId==='fc') return [DG.fc.cx+d.x*DG.fc.s,DG.fc.cy+d.z*DG.fc.s];
  if(p.hotId==='esc') return [DG.esc.cx+d.x*DG.esc.s,DG.esc.cy+d.z*DG.esc.s];
  return null;
}
/* the point a wire end is dragged from, or a pad's centre */
export function dgXY(p){ return dgPadXY(p)&&!p.need?dgPadXY(p):srcTip(p).knob; }
const padOut=p=>{ const o=p.def.out; return o&&Math.abs(o.y)<.5?[Math.sign(o.x)||0,Math.sign(o.z)||0]:[0,-1]; };

/* ================= Routing =================
   Orthogonal runs with rounded corners. Within one part, wires take separate lanes, ordered so that bundles
   nest instead of crossing (the TX/RX crossover is the one crossing that should be there) */
function lane(p){
  const h=p.hotId, list=srcOf(h), i=Math.max(0,list.indexOf(p)), n=list.length;
  if(h==='vtx') return 704+(n-1-i)*14;           // x of the vertical run, right of the FC
  if(h==='gps') return 396-(n-1-i)*14;           // x of the vertical run, left of the FC
  if(h==='rx') return 444+i*10;                  // y of the horizontal run, under the FC
  if(h==='lead') return {'−':900,'+':924}[p.label];
  if(h==='cap') return {'−':912,'+':936}[p.label];
  return null;
}
export function dgRoutePts(src,tgt){
  const t=srcTip(src), b=dgPadXY(tgt)||dgXY(tgt), o=padOut(tgt), B=[b[0]+o[0]*24,b[1]+o[1]*24];
  if(src.hotId.startsWith('mot')){ const n=+src.hotId.slice(3); return [t.anchor,bendXY(n),B,b]; }
  if(src.hotId==='esc') return [t.anchor,[t.anchor[0],t.anchor[1]-30],[b[0],b[1]+40],b];
  const a=t.anchor, d=t.dir, aV=d[0]===0, bV=o[0]===0, L=lane(src), pts=[a];
  if(aV&&bV){ const m=L??(a[1]+B[1])/2; pts.push([a[0],m],[B[0],m]); }
  else if(!aV&&!bV){ const m=L??(a[0]+B[0])/2; pts.push([m,a[1]],[m,B[1]]); }
  else if(aV) pts.push([a[0],B[1]]);
  else pts.push([B[0],a[1]]);
  pts.push(B,b);
  return pts;
}
/* SVG path through the points with rounded corners */
export function roundPath(pts,r=12){
  const P=[pts[0]]; for(const p of pts){ const q=P[P.length-1]; if(Math.hypot(p[0]-q[0],p[1]-q[1])>.5) P.push(p); }
  let d=`M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for(let i=1;i<P.length-1;i++){
    const a=P[i-1], b=P[i], c=P[i+1], ab=Math.hypot(b[0]-a[0],b[1]-a[1]), bc=Math.hypot(c[0]-b[0],c[1]-b[1]), k=Math.min(r,ab/2,bc/2);
    const p0=[b[0]+(a[0]-b[0])*k/ab,b[1]+(a[1]-b[1])*k/ab], p2=[b[0]+(c[0]-b[0])*k/bc,b[1]+(c[1]-b[1])*k/bc];
    d+=` L${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${b[0].toFixed(1)},${b[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const z=P[P.length-1]; return d+` L${z[0].toFixed(1)},${z[1].toFixed(1)}`;
}
const dgRoute=(src,tgt)=>roundPath(dgRoutePts(src,tgt));
/* a wire: a dark casing, then the colour. Ground is black, so it gets a light casing to show on the dark boards.
   Motor phases are three strands side by side, the ESC harness a six-wire ribbon */
const colHex=net=>hex(wireColor(net));
export function dgStroke(d,src,extra=''){
  const need=src.need;
  const strand=(c,dx,w=4,casing='#0d0f11')=>`<path d="${d}" transform="translate(${dx},${dx})" fill="none" stroke="${casing}" stroke-width="${w+2.5}" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" transform="translate(${dx},${dx})" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  let body;
  if(need[0]==='M') body=PHASE_COLS.map((c,i)=>strand(hex(c),(i-1)*3.4,2.8)).join('');
  else if(need==='ESC') body=HARNESS_COLS.map((c,i)=>strand(hex(c),(i-2.5)*2.6,2.2)).join('');
  else { const k=netKind(need); body=strand(colHex(need),0,need.startsWith('VBAT')?6:4,k==='ground'?'#8d969c':'#0d0f11'); }
  return `<g class="wire" data-src="${src.id}"${extra}>${body}</g>`;
}
/* swatch for a net: one colour, or stripes for phases and the harness */
function swatch(net,x,y,w=22,h=7){
  const k=netKind(net), cols=k==='phase'?PHASE_COLS:k==='harness'?HARNESS_COLS:[wireColor(net)], sw=w/cols.length;
  return cols.map((c,i)=>`<rect x="${(x+i*sw).toFixed(1)}" y="${y}" width="${sw.toFixed(1)}" height="${h}" fill="${hex(c)}"/>`).join('')+`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="none" stroke="#0d0f11" stroke-width="1"/>`;
}

/* ================= Drawing ================= */
export function renderDiagram(){
  const el=$('#diagram'), on=stageKey()==='wire'&&S.diagram; el.hidden=!on; $('#viewport').classList.toggle('dg',on); updateViewbar(); if(!on) return;
  const pads=Object.values(PADS);
  /* frame arms and motors first, under everything */
  const arms=[1,2,3,4].map(n=>{ const m=motorXY(n); return `<line x1="${DG.esc.cx}" y1="${DG.esc.cy}" x2="${m[0].toFixed(1)}" y2="${m[1].toFixed(1)}" stroke="#c9cdc8" stroke-width="30" stroke-linecap="round"/>`; }).join('');
  const motors=[1,2,3,4].filter(n=>parts['mot'+n]).map(n=>{
    const [x,y]=motorXY(n), r=40, [dx,dy]=armDir(n), e=[x-dx*r,y-dy*r], k=leadXY(n);
    const lead=PHASE_COLS.map((c,i)=>{ const o=(i-1)*3.4; return `<line x1="${(e[0]+o).toFixed(1)}" y1="${(e[1]+o).toFixed(1)}" x2="${(k[0]+o).toFixed(1)}" y2="${(k[1]+o).toFixed(1)}" stroke="#0d0f11" stroke-width="5.3" stroke-linecap="round"/><line x1="${(e[0]+o).toFixed(1)}" y1="${(e[1]+o).toFixed(1)}" x2="${(k[0]+o).toFixed(1)}" y2="${(k[1]+o).toFixed(1)}" stroke="${hex(c)}" stroke-width="2.8" stroke-linecap="round"/>`; }).join('');
    const right=x>DG.esc.cx, lx=(right?x+r+12:x-r-12).toFixed(1), an=right?'start':'end';
    return `${lead}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#2a2f35" stroke="#0d0f11" stroke-width="2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r*.55}" fill="#3b444d"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#b9c0c7"/>
      <text class="t-h" x="${lx}" y="${(y-2).toFixed(1)}" text-anchor="${an}">MOTOR ${n}</text><text class="t-s" x="${lx}" y="${(y+14).toFixed(1)}" text-anchor="${an}">${CORNER[n]} · ${EXP[n]}</text>`;
  }).join('');
  /* pads on the two boards, each labelled, with a bar in the colour that belongs on it */
  const tgtSvg=pads.filter(p=>!p.need).map(p=>{
    const [x,y]=dgPadXY(p), o=padOut(p), lx=x-o[0]*26, ly=y-o[1]*24+4;
    let shape;
    if(p.def.shape==='triple') shape=[-14,0,14].map(dy=>`<rect class="pad" x="${x-7}" y="${y+dy-5}" width="14" height="10" rx="2" fill="#d4a93c"/>`).join('');
    else if(p.def.shape==='big') shape=`<rect class="pad" x="${x-12}" y="${y-9}" width="24" height="18" rx="3" fill="#d4a93c"/>`;
    else if(p.def.shape==='socket') shape=`<rect class="pad" x="${x-24}" y="${y-9}" width="48" height="18" rx="3" fill="#e9e6dc"/>`;
    else shape=`<rect class="pad" x="${x-8}" y="${y-8}" width="16" height="16" rx="3" fill="#d4a93c"/>`;
    const lab=p.def.shape==='socket'?`<text x="${x}" y="${y+4}" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#1b1f23">ESC</text>`
      :`<text class="t-pad" x="${lx}" y="${ly}" text-anchor="middle">${esc(p.label)}</text>${swatch(p.net,lx-9,ly+4,18,4)}`;
    return `<g class="tgt" data-tgt="${p.id}" data-net="${p.net}">${shape}${lab}<rect x="${x-16}" y="${y-16}" width="32" height="32" fill="transparent"/></g>`;
  }).join('');
  /* harness under the FC board (it plugs in from below in this view), other wires on top */
  const wired=w=>{ const src=PADS[w.src], tgt=PADS[w.tgt]; if(!src||!tgt) return ''; const b=dgPadXY(tgt)||[0,0];
    return dgStroke(dgRoute(src,tgt),src)+(src.need==='ESC'?'':`<circle cx="${b[0]}" cy="${b[1]}" r="5" fill="#dfe3e6" stroke="#6b7378"/>`); };
  const harness=WIRES.filter(w=>PADS[w.src]&&PADS[w.src].need==='ESC').map(wired).join('');
  const wires=WIRES.filter(w=>PADS[w.src]&&PADS[w.src].need!=='ESC').map(wired).join('');
  const tips=pads.filter(p=>p.need&&!p.wired).map(p=>{
    const t=srcTip(p), [kx,ky]=t.knob, [ax,ay]=t.anchor, col=colHex(p.need), k=netKind(p.need);
    const lx=kx+t.dir[0]*18, ly=ky+t.dir[1]*18+4, anchorTxt=t.dir[0]<0?'end':t.dir[0]>0?'start':'middle';
    let knob;
    if(k==='phase') knob=`<circle class="knob" cx="${kx}" cy="${ky}" r="11" fill="#c2c8cd" stroke="#111" stroke-width="1.5"/>${PHASE_COLS.map((c,i)=>`<circle cx="${(kx+(i-1)*5.5).toFixed(1)}" cy="${ky}" r="2.6" fill="${hex(c)}"/>`).join('')}`;
    else if(k==='harness') knob=`<rect class="knob" x="${kx-24}" y="${ky-9}" width="48" height="18" rx="3" fill="#e9e6dc" stroke="#111" stroke-width="1.5"/>`;
    else knob=`<circle class="knob" cx="${kx}" cy="${ky}" r="9" fill="${col}" stroke="${k==='ground'?'#8d969c':'#111'}" stroke-width="2"/>`;
    const label=k==='harness'?`<text class="t-tip" x="${kx}" y="${ky+4}" text-anchor="middle" style="font-size:9px">HARNESS</text>`
      :k==='phase'?'':`<text class="t-tip" x="${lx}" y="${ly}" text-anchor="${anchorTxt}">${esc(p.label)}</text>`;
    const stub=(k==='phase'||k==='harness')?'':`<line x1="${ax}" y1="${ay}" x2="${kx}" y2="${ky}" stroke="${k==='ground'?'#8d969c':'#0d0f11'}" stroke-width="6.5"/><line x1="${ax}" y1="${ay}" x2="${kx}" y2="${ky}" stroke="${col}" stroke-width="4"/>`;
    return `<g class="tip" data-src="${p.id}">${stub}${knob}${label}<circle cx="${kx}" cy="${ky}" r="18" fill="transparent"/></g>`;
  }).join('');
  const comp=Object.entries(DG_SRC).filter(([h])=>parts[h]).map(([h,c])=>{
    const [x,y,w,hh,t,sub]=c.box;
    return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="8" fill="#2a2f35" stroke="#0d0f11" stroke-width="2"/><text x="${x+w/2}" y="${y+hh/2-2}" text-anchor="middle" style="font:700 12px var(--font-mono);fill:#f2f2ee">${t}</text><text x="${x+w/2}" y="${y+hh/2+14}" text-anchor="middle" style="font-size:9.5px;fill:#aab3b8">${sub}</text>`;
  }).join('');
  const done=srcPads().filter(p=>p.wired).length, total=srcPads().length;
  const legend=wireLegend(CINE).map(([k,l],i)=>`${swatch(k==='power'?'5V':k==='ground'?'GND':k==='video'?'CAM':k==='led'?'LED':k==='tx'?'R1':k==='rx'?'T1':k==='phase'?'M1':'ESC',0,12+i*18,22,7)}<text class="t-s" x="30" y="${19+i*18}">${l}</text>`).join('');
  el.innerHTML=`<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Wiring diagram, top view with the front at the top. Drag each coloured wire end onto its pad.">
    <text class="t-title" x="40" y="44">WIRING DIAGRAM</text><text class="t-s" x="40" y="64">${MODEL.name} stack · top view, front at the top</text>
    <g transform="translate(40,92)"><text class="t-h" y="0">Stack specifications</text>
      ${[['Mounting','30.5 × 30.5 mm'],['Input','3–6S LiPo'],['BEC','5 V 2 A · 9 V 2 A'],['Receiver','UART 1'],['GPS','UART 3'],CINE?['Video','UART 2 · digital']:['Video','CAM in · VTX out']].map(([k,v],i)=>`<text class="t-s" y="${20+i*17}">${k}</text><text y="${20+i*17}" x="92" style="font-size:11px">${v}</text>`).join('')}</g>
    <g transform="translate(860,40)"><text class="t-h">Wire colours</text>${legend}</g>
    <g transform="translate(40,690)"><text class="t-h" style="fill:#b2382b">Default ports</text>
      ${(CINE?[['UART 1','Receiver'],['UART 2','Digital VTX'],['UART 3','GPS'],['LED','LED strip data']]:[['UART 1','Receiver'],['UART 3','GPS'],['CAM','Camera video in'],['VTX','Video out to VTX']]).map(([k,v],i)=>`<text y="${20+i*17}" style="font-size:11px;font-weight:600">${k}</text><text class="t-s" x="64" y="${20+i*17}">${v}</text>`).join('')}
      <text y="104" class="t-s">Serial wires cross over:</text><text y="120" class="t-s">TX → R pad, RX → T pad</text></g>
    <g transform="translate(40,860)"><text style="font:700 12px var(--font-mono);fill:#b2382b">⚠ Capacitor required</text><text class="t-s" y="16">absorbs voltage spikes</text></g>
    ${arms}
    <rect x="${DG.esc.cx-110}" y="${DG.esc.cy-110}" width="220" height="220" rx="14" fill="#22262b" stroke="#0d0f11" stroke-width="2"/>
    <text x="${DG.esc.cx}" y="${DG.esc.cy-4}" text-anchor="middle" style="font:700 12px var(--font-mono);fill:#f2f2ee">4-IN-1 ESC</text><text x="${DG.esc.cx}" y="${DG.esc.cy+12}" text-anchor="middle" style="font:600 10px var(--font-mono);fill:#aab3b8">stack, lower board</text>
    ${harness}
    <rect x="${DG.fc.cx-120}" y="${DG.fc.cy-120}" width="240" height="240" rx="18" fill="#22262b" stroke="#0d0f11" stroke-width="2"/>
    ${[[-105,-105],[105,-105],[-105,105],[105,105]].map(([x,y])=>`<circle cx="${DG.fc.cx+x}" cy="${DG.fc.cy+y}" r="9" fill="none" stroke="#d4a93c" stroke-width="3"/>`).join('')}
    <path d="M${DG.fc.cx},${DG.fc.cy-38} l18,26 h-10 v26 h-16 v-26 h-10 z" fill="#f2f2ee"/><text x="${DG.fc.cx}" y="${DG.fc.cy+36}" text-anchor="middle" style="font:700 12px var(--font-mono);fill:#f2f2ee">FRONT</text>
    <text x="${DG.fc.cx}" y="${DG.fc.cy+58}" text-anchor="middle" style="font:600 10px var(--font-mono);fill:#aab3b8">FLIGHT CONTROLLER</text>
    ${motors}${comp}${wires}${tgtSvg}${tips}
    <text x="${VW-40}" y="${VH-14}" text-anchor="end" class="t-s">${done} of ${total} wires soldered</text>
    <g id="dgTemp" pointer-events="none"></g>
    <g id="dgFlash" pointer-events="none"></g>
  </svg>`;
  drawWrong();
}

/* ================= Dragging on the diagram =================
   The wire in hand is drawn in its own colour with an orange glow, along the route it will take once it is over a
   pad. Practice mode lights the matching pads; over a pad the glow turns green (right) or red (wrong) */
export function dgPoint(svg,e){ const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
function wrapText(s,n){ const out=[]; let line=''; for(const w of s.split(' ')){ if((line+' '+w).trim().length>n){ out.push(line); line=w; } else line=(line+' '+w).trim(); } if(line) out.push(line); return out; }
let wrongNote=null, wrongTimer=0;
export function dgFlash(xy,ok,src,tgt,title,why){
  const g=document.getElementById('dgFlash'); if(!g) return;
  if(ok){ const el=document.createElementNS('http://www.w3.org/2000/svg','g'); el.setAttribute('class','flash'); el.innerHTML=`<rect x="${xy[0]-30}" y="${xy[1]-44}" width="60" height="26" rx="13" fill="#2f9e63"/><text x="${xy[0]}" y="${xy[1]-26}" text-anchor="middle">✓ OK</text>`; g.appendChild(el); setTimeout(()=>el.remove(),1400); return; }
  /* wrong: kept as diagram state, so a redraw of the diagram (the panel refreshes after a mistake) keeps showing it */
  wrongNote={xy,src:src&&src.id,tgt:tgt&&tgt.id,title,why};
  clearTimeout(wrongTimer); wrongTimer=setTimeout(()=>{ wrongNote=null; const f=document.getElementById('dgFlash'); if(f) f.innerHTML=''; },why?6500:2600);
  drawWrong();
}
function drawWrong(){
  const g=document.getElementById('dgFlash'); if(!g||!wrongNote) return;
  const {xy,title,why}=wrongNote, src=PADS[wrongNote.src], tgt=PADS[wrongNote.tgt];
  const el=document.createElementNS('http://www.w3.org/2000/svg','g'); el.setAttribute('class','flash wrong');
  /* a red ghost of the wire, a cross on the pad, and a callout with the reason */
  const ghost=src&&tgt?`<path d="${dgRoute(src,tgt)}" fill="none" stroke="#e2483c" stroke-width="10" stroke-opacity=".3" stroke-linejoin="round"/><path d="${dgRoute(src,tgt)}" fill="none" stroke="#e2483c" stroke-width="4" stroke-dasharray="9 6" stroke-linejoin="round"/>`:'';
  const lines=why?wrapText(why,46).slice(0,6):[], W=340, H=38+lines.length*15;
  const bx=clamp(xy[0]+24,20,VW-W-20), by=clamp(xy[1]-H-28,20,VH-H-20);
  el.innerHTML=`${ghost}<circle cx="${xy[0]}" cy="${xy[1]}" r="17" fill="none" stroke="#e2483c" stroke-width="4"/><path d="M${xy[0]-7},${xy[1]-7} l14,14 m0,-14 l-14,14" stroke="#e2483c" stroke-width="4" stroke-linecap="round"/>
    <g class="callout"><rect x="${bx}" y="${by}" width="${W}" height="${H}" rx="10" fill="#fff4f2" stroke="#e2483c" stroke-width="2"/>
    <text x="${bx+14}" y="${by+24}" style="font:700 13px var(--font-mono);fill:#b2271d">✕ ${esc(title||'Wrong pad')} · not soldered</text>
    ${lines.map((l,i)=>`<text x="${bx+14}" y="${by+44+i*15}" style="font-size:11px;fill:#3b2420">${esc(l)}</text>`).join('')}</g>`;
  g.innerHTML=''; g.appendChild(el);
}
function tempWire(svg,src,tgt,q,state){
  const g=svg.querySelector('#dgTemp'); if(!g) return;
  const d=tgt?dgRoute(src,tgt):(()=>{ const t=srcTip(src); return roundPath([t.anchor,t.knob,[q.x,q.y]],20); })();
  const glow=state==='ok'?'#2f9e63':state==='bad'?'#e2483c':'#e0894a';
  g.innerHTML=`<path d="${d}" fill="none" stroke="${glow}" stroke-width="14" stroke-opacity=".35" stroke-linejoin="round" stroke-linecap="round"/>${dgStroke(d,src)}`;
}
$('#diagram').addEventListener('pointerdown',e=>{
  const t=e.target.closest('.tip'); if(!t) return;
  const svg=$('#diagram svg'), src=PADS[t.dataset.src]; if(!src||src.wired) return;
  e.preventDefault(); svg.setPointerCapture(e.pointerId);
  S.drag={kind:'dg',src:src.id,over:null};
  t.classList.add('held');
  if(S.mode==='learn') svg.querySelectorAll('.tgt').forEach(g=>{ g.classList.toggle('hint',g.dataset.net===src.need); g.classList.toggle('dim',g.dataset.net!==src.need); });
  tempWire(svg,src,null,dgPoint(svg,e),'neutral');
});
$('#diagram').addEventListener('pointermove',e=>{
  if(!S.drag||S.drag.kind!=='dg') return;
  const svg=$('#diagram svg'), src=PADS[S.drag.src], q=dgPoint(svg,e);
  const over=document.elementFromPoint(e.clientX,e.clientY), g=over&&over.closest('.tgt');
  svg.querySelectorAll('.tgt.over').forEach(x=>{ if(x!==g) x.classList.remove('over','ok','bad'); });
  const tgt=g?PADS[g.dataset.tgt]:null, learn=S.mode==='learn', right=tgt&&tgt.net===src.need;
  if(g){ g.classList.add('over'); g.classList.toggle('ok',learn&&right); g.classList.toggle('bad',learn&&!right); }
  S.drag.over=g?g.dataset.tgt:null;
  tempWire(svg,src,tgt,q,tgt&&learn?(right?'ok':'bad'):'neutral');
});
export function dgEnd(e,cancel){
  if(!S.drag||S.drag.kind!=='dg') return;
  const {src,over}=S.drag; S.drag=null;
  const svg=$('#diagram svg'); const tmp=svg.querySelector('#dgTemp'); if(tmp) tmp.innerHTML='';
  svg.querySelectorAll('.tgt').forEach(g=>g.classList.remove('hint','dim','over','ok','bad'));
  svg.querySelectorAll('.tip.held').forEach(g=>g.classList.remove('held'));
  if(cancel||!over) return;
  const S0=PADS[src], T0=PADS[over], tgtXY=dgPadXY(T0)||dgXY(T0), r=attemptWire(S0,T0);
  if(r==='ok'){ renderPanel(); dgFlash(tgtXY,true); }
  else if(r==='bad'){
    const learn=S.mode==='learn';
    dgFlash(tgtXY,false,S0,T0,learn?wireFault(S0,T0):'Wrong pad',learn?explainWire(S0,T0):'Check the wiring diagram and try again. The reason is in your report.');
    const tip=svg.querySelector(`.tip[data-src="${src}"]`); if(tip){ tip.classList.remove('shake'); void tip.getBBox(); tip.classList.add('shake'); }
    const pad=svg.querySelector(`.tgt[data-tgt="${over}"]`); if(pad){ pad.classList.add('wrong'); setTimeout(()=>pad.classList.remove('wrong'),1600); }
  }
}
$('#diagram').addEventListener('pointerup',e=>dgEnd(e,false));
$('#diagram').addEventListener('pointercancel',e=>dgEnd(e,true));

/* ================= Explaining a wrong connection ================= */
/* a short name for what went wrong, shown on the pad in the 3D view and on the diagram */
export function wireFault(src,tgt){
  const need=src.need, got=tgt.net, pol=s=>s==='VBAT+'||s==='VBAT-', ser=s=>/^[TR][123]$/.test(s);
  if(pol(need)&&pol(got)) return 'Reversed polarity';
  if(pol(need)) return 'Battery voltage on a signal pad';
  if((need==='5V'||need==='9V')&&got==='GND'||need==='GND'&&(got==='5V'||got==='9V')) return 'Short circuit';
  if(need==='5V'&&got==='9V'||need==='9V'&&got==='5V') return 'Wrong voltage';
  if(need[0]==='M'&&got&&got[0]==='M') return 'Wrong motor output';
  if(ser(need)&&ser(got)) return need[1]!==got[1]?'Wrong UART':'TX/RX not crossed';
  if(need==='ESC'||got==='ESC') return 'Harness only fits the ESC socket';
  return 'Wrong pad';
}
export const NETNAME={'VBAT+':'battery + pad','VBAT-':'battery − pad','5V':'5 V supply','9V':'9 V supply','GND':'ground (G)','T1':'UART 1 transmit (T1)','R1':'UART 1 receive (R1)','T2':'UART 2 transmit (T2)','R2':'UART 2 receive (R2)','T3':'UART 3 transmit (T3)','R3':'UART 3 receive (R3)','LED':'LED data pad (LED)','CAM':'camera input (CAM)','VTX':'video output (VTX)','ESC':'ESC socket',M1:'motor output M1',M2:'motor output M2',M3:'motor output M3',M4:'motor output M4'};
export function explainWire(src,tgt){
  const need=src.need, got=tgt.net, owner=TYPES[HOTMAP[src.hotId].type].name;
  const pol=s=>s==='VBAT+'||s==='VBAT-';
  if(pol(need)&&pol(got)) return `Reversed polarity. The ${owner.toLowerCase()} ${src.label} goes to the ${need==='VBAT+'?'+':'−'} pad. Reversing it can destroy the ESC${HOTMAP[src.hotId].type==='cap'?' and the capacitor (its striped leg is negative)':''} the moment the battery is plugged in.`;
  if(pol(need)) return `The ${owner.toLowerCase()} carries full battery voltage. It belongs on the ESC battery pads, not the ${NETNAME[got]}.`;
  if(need[0]==='M'&&got&&got[0]==='M') return `That is output ${got}. The motor on the ${CORNER[+need[1]]} arm must use ${need}, because the flight controller expects motor ${need[1]} in that corner.`;
  if(/^[TR][123]$/.test(need)&&/^[TR][123]$/.test(got)){
    if(need[1]!==got[1]) return `Wrong serial port. The ${owner.toLowerCase()} uses UART ${need[1]}; that pad belongs to UART ${got[1]}.`;
    return 'TX and RX cross over: a transmit (TX) wire goes to a receive pad (R), and an RX wire goes to a transmit pad (T).';
  }
  if(need==='5V'&&got==='9V') return `Too much voltage. The ${owner.toLowerCase()} runs on 5 V and the 9 V pad can burn it out.`;
  if(need==='9V'&&got==='5V') return `The ${owner.toLowerCase()} is fed from the 9 V pad. 5 V is below its input range.`;
  if(need==='LED') return 'The LED strip’s data wire (DIN) goes to the LED pad. That pad sends the colour signal; any other pad is power or a different signal.';
  if(got==='LED') return 'The LED pad only sends the LED strip’s data signal. It is not a power, ground or serial pad.';
  if((need==='5V'||need==='9V')&&got==='GND') return 'Short circuit. A power wire on a ground pad shorts the supply.';
  if(need==='GND'&&(got==='5V'||got==='9V')) return 'Short circuit. The ground wire must go to a G pad, not a power pad.';
  if(need==='GND') return 'Ground wires go to a G (ground) pad.';
  if(need==='CAM'&&got==='VTX') return 'Camera video goes into the CAM pad. The VTX pad sends video out to the transmitter.';
  if(need==='VTX'&&got==='CAM') return 'The transmitter takes video out of the flight controller from the VTX pad. CAM is the camera input.';
  if(need==='ESC') return 'The ESC harness plugs into the ESC socket on the flight controller.';
  return `This wire needs the ${NETNAME[need]}, but that is the ${NETNAME[got]||'wrong pad'}.`;
}
export const NETSHORT={'VBAT+':'ESC +','VBAT-':'ESC −','5V':'FC 5V','9V':'FC 9V','GND':'a G pad','T1':'FC T1','R1':'FC R1','T2':'FC T2','R2':'FC R2','T3':'FC T3','R3':'FC R3','LED':'FC LED','CAM':'FC CAM','VTX':'FC VTX','ESC':'FC ESC socket',M1:'ESC M1',M2:'ESC M2',M3:'ESC M3',M4:'ESC M4'};
