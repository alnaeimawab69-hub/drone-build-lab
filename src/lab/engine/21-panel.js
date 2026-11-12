/* Drone Build Lab · Side panel rendering for every stage, quiz */
import { $, CINE, CORNER, EX, EXP, MODEL, PROPS_OUT, esc, motorsTurning } from './01-config.js';
import { hex, wireColor } from './04-materials.js';
import { HOT, HOTMAP, SEC, STAGES, TYPES } from './07-catalogue.js';
import { S, parts } from './08-state.js';
import { THUMB } from './10-thumbnails.js';
import { srcPads } from './12-placement.js';
import { SCREWT, SCREW_SPEC, stageScrews } from './13-screws.js';
import { NETSHORT, renderDiagram } from './16-wiring-diagram.js';
import { dirActual } from './18-motor-test.js';
import { FL, MANS, airborne, updateHud } from './19-flight.js';
import { canUndo, ready, stageKey, strapped } from './20-stages.js';
import { MV, padName, renderMoves } from './28-movements.js';
import { LANG, tr } from '../../lang.js';

/* ================= Panel rendering ================= */
export function left(t){ return TYPES[t].count-Object.values(parts).filter(p=>p.type===t).length; }
export function tray(keys,desc){ return `<div class="tray">${keys.map(k=>{ const n=left(k); return `<button class="titem" data-type="${k}" data-left="${n}" ${n<=0?'disabled':''} aria-label="${tr('Drag','Seret')} ${esc(TYPES[k].name)}">${THUMB[k]?`<img src="${THUMB[k]}" alt="">`:''}<span class="tn">${esc(TYPES[k].name)}</span>${desc&&desc[k]?`<span class="td">${desc[k]}</span>`:''}<span class="tc">×${n}</span></button>`; }).join('')}</div>`; }
export function layoutSVG(showDirs){
  const pos={1:[112,112],2:[112,40],3:[40,112],4:[40,40]};
  const arc=(cx,cy,cw)=>{ const r=17; return cw?`M${cx-r},${cy} A${r},${r} 0 1 1 ${cx},${cy+r}`:`M${cx+r},${cy} A${r},${r} 0 1 0 ${cx},${cy+r}`; };
  return `<svg viewBox="0 0 152 160" role="img" aria-label="${tr('Motor layout seen from above, front at the top','Susun atur motor dilihat dari atas, hadapan di atas')}">
  <defs><marker id="ah" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--accent)"/></marker></defs>
  <text x="76" y="10" text-anchor="middle" style="fill:var(--muted);font:600 9px var(--f-mono);letter-spacing:.1em">▲ ${tr('FRONT','HADAPAN')}</text>
  <path d="M40,40 L112,112 M112,40 L40,112" style="stroke:var(--line-2);stroke-width:6;stroke-linecap:round"/>
  <rect x="64" y="62" width="24" height="28" rx="3" style="fill:var(--panel-3);stroke:var(--dim)"/>
  ${[1,2,3,4].map(n=>{ const [x,y]=pos[n]; return `<circle cx="${x}" cy="${y}" r="11" style="fill:var(--panel-2);stroke:var(--dim)"/><text x="${x}" y="${y+3.5}" text-anchor="middle" style="fill:var(--fg);font:600 9.5px var(--f-mono)">M${n}</text>${showDirs?`<path d="${arc(x,y,EXP[n]==='CW')}" marker-end="url(#ah)" style="fill:none;stroke:var(--accent);stroke-width:2"/><text x="${x}" y="${y+(y<76?-22:31)}" text-anchor="middle" style="fill:var(--muted);font:500 8.5px var(--f-mono)">${EXP[n]}</text>`:''}`; }).join('')}
  ${showDirs?`<text x="76" y="158" text-anchor="middle" style="fill:var(--accent);font:600 9px var(--f-mono);letter-spacing:.1em">${PROPS_OUT?tr('PROPS OUT','KIPAS KELUAR'):tr('PROPS IN','KIPAS MASUK')}</text>`:''}
  </svg>`;
}
/* one sentence on what props in / props out means, for the layout boxes */
export const propsNote=()=>PROPS_OUT
  ?tr('<b>Props out</b>: the front edge of each front propeller sweeps outward, away from the camera. This throws less grass and dust at the lens.','<b>Kipas keluar</b>: tepi hadapan setiap kipas depan menyapu ke luar, menjauhi kamera. Ini kurang melemparkan rumput dan debu ke kanta.')
  :tr('<b>Props in</b> (the usual choice): the front edge of each front propeller sweeps inward, toward the camera.','<b>Kipas masuk</b> (pilihan biasa): tepi hadapan setiap kipas depan menyapu ke dalam, ke arah kamera.');
export function renderAll(){ renderSteps(); renderMeta(); renderPanel(); updateViewbar(); }
export function renderSteps(){
  const el=$('#steps'); el.hidden=S.explore;
  /* finished steps are buttons that jump back to that stage */
  el.innerHTML=STAGES.map((s,i)=>{ const inner=`<span class="n">${i<S.stage?'✓':i+1}</span><span class="l">${s.short}</span>`;
    return `<li class="${i<S.stage?'done':i===S.stage?'cur':''}"${i===S.stage?' aria-current="step"':''}>${i<S.stage?`<button type="button" data-stage="${i}" title="${tr('Back to','Kembali ke')} ${s.short}" aria-label="${tr('Back to stage','Kembali ke peringkat')} ${i+1}: ${s.short}">${inner}</button>`:inner}</li>`; }).join('');
}
export function fmtTime(ms){ const s=Math.floor(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
export function renderMeta(){
  const m=S.mode, n=S.mistakes.filter(x=>x.sec!=='quiz').length;
  const chip=S.explore?`<span class="chip explore">${S.view==='moves'?tr('Movements','Pergerakan'):tr('Explore','Teroka')}</span>`:m==='assess'?`<span class="chip assess">${tr('Assessment','Penilaian')}</span>`:`<span class="chip learn">${tr('Practice','Latihan')}</span>`;
  const t=m==='assess'&&!S.explore?`<span id="timer">${fmtTime((S.endT||performance.now())-S.startT)}</span>`:'';
  const mm=S.explore?'':`<span class="hide-sm ${n?'bad':''}">${n} ${tr(n===1?'mistake':'mistakes','kesilapan')}</span>`;
  $('#meta').innerHTML=chip+t+mm;
}
export function updateViewbar(){ const k=stageKey(), dg=k==='wire'; $('#btnDiag').hidden=!dg; $('#btnDiag').textContent=S.diagram?tr('3D view','Paparan 3D'):tr('Wiring diagram','Rajah pendawaian'); if(k==='fault') $('#btnDiag').setAttribute('aria-pressed',!!S.diagram); $('#btnCad').hidden=dg&&S.diagram; $('#explodeWrap').hidden=!(k==='explore'||k==='quiz'||k==='fault'); $('#btnLabels').setAttribute('aria-pressed',S.labels); }

export function renderPanel(){
  if(S.drag){ S.dirty=true; return; }
  const k=stageKey(), learn=S.mode==='learn', panel=$('#panel');
  const keepScroll=panel.querySelector('.p-body')?.scrollTop||0;
  let head='', body='', foot='';
  if(k==='explore'){
    head=tr(`<div class="eyebrow">Explore</div><h2>The finished ${esc(MODEL.title)}</h2><p>Every part is fitted and wired. Click a part, or a name in the list, to see what it does and how it connects.</p>`,`<div class="eyebrow">Teroka</div><h2>${esc(MODEL.title)} yang sudah siap</h2><p>Setiap bahagian sudah dipasang dan didawaikan. Klik satu bahagian, atau nama dalam senarai, untuk melihat fungsinya dan bagaimana ia disambung.</p>`);
    const seen=new Set(); const items=Object.values(parts).filter(p=>!seen.has(p.type)&&seen.add(p.type)).map(p=>[p.hot.id,TYPES[p.type].count>1?`${TYPES[p.type].name} (×${TYPES[p.type].count})`:TYPES[p.type].name]);
    body=`<div><h3 class="sec">${tr('Parts','Bahagian')}</h3><div class="row">${items.map(([id,nm])=>`<button class="btn sm" data-act="focus" data-h="${id}">${esc(nm)}</button>`).join('')}</div></div>
      <div><h3 class="sec">${tr('Motor layout','Susun atur motor')}</h3><div class="layout">${layoutSVG(true)}<p>${tr('Diagonal motors spin the same way. Two spin clockwise (CW) and two counter-clockwise (CCW). Their twisting forces cancel, so the drone does not spin in a hover.','Motor yang bertentangan secara pepenjuru berputar ke arah yang sama. Dua berputar ikut arah jam (CW) dan dua lawan arah jam (CCW). Daya pulasnya saling membatalkan, jadi dron tidak berpusing ketika melayang.')} ${propsNote()}</p></div></div>
      <p class="note">${tr('Use <b>Exploded view</b> under the 3D view to pull the parts apart, and <b>Labels</b> to name every part.','Gunakan <b>Paparan leraian</b> di bawah paparan 3D untuk memisahkan bahagian, dan <b>Label</b> untuk menamakan setiap bahagian.')}</p>`;
    foot=`<button class="btn" data-act="exploreMoves">${tr('Drone movements','Pergerakan dron')}</button><button class="btn primary" data-act="exploreFly">${tr('Fly it: flight physics','Terbangkan: fizik penerbangan')}</button>`;
  } else {
    const st=STAGES[S.stage];
    head=`<div class="eyebrow">${tr('Stage','Peringkat')} ${S.stage+1} ${tr('of','daripada')} ${STAGES.length}</div><h2>${st.title}</h2><p>${st.goal}</p>`;
    if(k==='frame') body=renderFrame(learn);
    if(k==='mount') body=renderMount(learn);
    if(k==='wire') body=renderWire(learn);
    if(k==='power') body=renderPower(learn);
    if(k==='props') body=renderProps(learn);
    if(k==='fly') body=renderFly(learn);
    if(k==='quiz') body=renderQuiz();
    const labels={frame:tr('Next: components','Seterusnya: komponen'),mount:EX?'Next: connections':tr('Next: wiring','Seterusnya: pendawaian'),wire:tr('Next: power-up','Seterusnya: hidupkan kuasa'),power:tr('Next: propellers','Seterusnya: kipas'),props:tr('Next: flight','Seterusnya: penerbangan'),fly:tr('Next: knowledge check','Seterusnya: semakan pengetahuan'),quiz:tr('See my report','Lihat laporan saya')};
    foot=`${S.stage>0?`<button class="btn ghost" data-act="back">← ${tr('Back','Kembali')}</button>`:''}${canUndo()?`<button class="btn ghost" data-act="undo" title="${tr('Take back your last step in this stage','Batalkan langkah terakhir anda dalam peringkat ini')}">↶ ${tr('Undo','Buat asal')}</button>`:''}${learn&&k!=='quiz'?`<button class="btn ghost" data-act="show">${k==='fly'?tr('Play demo','Main demo'):tr('Show me','Tunjukkan')}</button>`:''}<button class="btn primary" data-act="next" ${ready(k)?'':'disabled'}>${labels[k]} →</button>`;
  }
  if(S.explore&&k==='fly'){ head=`<div class="eyebrow">${tr('Explore','Teroka')}</div><h2>${tr('Flight physics','Fizik penerbangan')}</h2><p>${tr('Fly the finished drone. Watch how the four motor speeds create every movement.','Terbangkan dron yang sudah siap. Perhatikan bagaimana kelajuan empat motor menghasilkan setiap pergerakan.')}</p>`; body=renderFly(true); foot=`<button class="btn ghost" data-act="exploreBack">← ${tr('Back to parts','Kembali ke bahagian')}</button><button class="btn primary" data-act="tour">${tr('Play demo','Main demo')}</button>`; }
  if(S.explore&&k==='moves') ({head,body,foot}=renderMoves());
  panel.innerHTML=`<div class="p-head">${head}</div><div class="p-body">${body}</div><div class="p-foot">${foot}</div>`;
  panel.querySelector('.p-body').scrollTop=keepScroll;
  if(k==='fly') updateHud();
  renderDiagram();
  renderSteps(); renderMeta();
}
export function screwBin(k,learn){
  return `<div class="tray">${Object.keys(SCREWT).map(t=>{ const n=stageScrews(k).filter(s=>!s.driven&&s.spec.kind===t).length;
    return `<button class="titem sitem ${S.loaded===t?'on':''}" data-screw="${t}" aria-pressed="${S.loaded===t}">${THUMB[t]?`<img src="${THUMB[t]}" alt="">`:''}<span class="tn">${SCREWT[t].name}</span>${learn?`<span class="tc">${n} ${tr('needed','diperlukan')}</span>`:''}</button>`; }).join('')}</div>`;
}
export function screwCount(k,owner){ const l=stageScrews(k).filter(s=>HOTMAP[s.hotId].type===owner); return [l.filter(s=>s.driven).length,(SCREW_SPEC[owner]||[]).length*HOT.filter(h=>h.type===owner).length]; }
export function renderFrame(learn){
  const keys=EX?['body','arm','gear']:CINE?['plateB','arm','nylSt','aluSt','camPlate','tplate']:['plateB','arm','nylSt','aluSt','camPlate','tplate'];
  const placed=HOT.filter(h=>h.stage==='frame'&&parts[h.id]).length, total=HOT.filter(h=>h.stage==='frame').length;
  if(EX) return `<div><h3 class="sec">Airframe modules <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${placed}/${total} fitted</span></h3>${tray(keys)}</div>
    ${learn?checklist(keys,''):''}
    <p class="note">Start with the <b>fuselage</b>; the arms and legs clip into it. ${learn?'While you hold a module, <b>green rings</b> show where it can go.':'Assessment: no hints. Each wrong placement costs points.'} There are no screws: each module locks with a quick-release connector.</p>`;
  const sd=stageScrews('frame').filter(s=>s.driven).length;
  const line=(l,[d,t])=>`<li class="${d===t?'ok':''}">${l}<span class="r">${d}/${t}</span></li>`;
  const checks=learn?`<div><h3 class="sec">${tr('Checklist','Senarai semak')}</h3><ul class="checks">${keys.map(t=>{ const c=TYPES[t].count, d=c-left(t); return `<li class="${d===c?'ok':''}">${TYPES[t].name}<span class="r">${d}/${c}</span></li>`; }).join('')}
    ${line(tr('Arm screws, M3 × 10','Skru lengan, M3 × 10'),screwCount('frame','arm'))}${line(tr('Top plate screws, M3 × 6','Skru plat atas, M3 × 6'),screwCount('frame','tplate'))}</ul></div>`:'';
  return `<div><h3 class="sec">${tr('Frame parts','Bahagian rangka')} <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${placed}/${total} ${tr('fitted','dipasang')}</span></h3>${tray(keys)}</div>
    <div><h3 class="sec">${tr('Fastener bin','Bekas pengikat')} <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${sd} ${tr('tight','ketat')}</span></h3>${screwBin('frame',learn)}</div>
    ${checks}
    <p class="note">${tr(`Start with the <b>bottom plate</b>. Everything else attaches to it. To fasten a part, pick a screw from the fastener bin. Then click a small ring on the part, or drag the screw onto it. ${learn?'Rings that take the screw you hold turn <b>green</b>.':'Assessment: a wrong screw costs points.'} <b>M3 × 10</b> means a screw 3 mm thick and 10 mm long.`,`Mula dengan <b>plat bawah</b>. Semua bahagian lain dipasang padanya. Untuk mengikat bahagian, pilih skru dari bekas pengikat. Kemudian klik gelang kecil pada bahagian itu, atau seret skru ke atasnya. ${learn?'Gelang yang menerima skru yang anda pegang bertukar <b>hijau</b>.':'Penilaian: skru yang salah ditolak markah.'} <b>M3 × 10</b> bermaksud skru setebal 3 mm dan sepanjang 10 mm.`)}</p>`;
}
/* model 3 checklist: one line per module type, plus any extra lines */
const checklist=(keys,extra)=>`<div><h3 class="sec">Checklist</h3><ul class="checks">${keys.map(t=>{ const c=TYPES[t].count, d=c-left(t); return `<li class="${d===c?'ok':''}">${TYPES[t].name}<span class="r">${d}/${c}</span></li>`; }).join('')}${extra}</ul></div>`;
export function renderMount(learn){
  const keys=EX?['fc','cover','motor','camera','gimbal','rtk','vision','lights']:CINE?['motor','esc','fc','camera','camMount','vtx','rx','gps','cap','lead']:['motor','esc','fc','camera','camMount','vtx','rx','gps','cap','lead'];
  const placed=HOT.filter(h=>h.stage==='mount'&&parts[h.id]).length, total=HOT.filter(h=>h.stage==='mount').length;
  let checks='';
  if(EX) return `<div><h3 class="sec">Modules <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${placed}/${total} fitted</span></h3>${tray(keys)}</div>
    ${learn?checklist(keys,`<li class="${parts.fc&&S.fcRot===0?'ok':parts.fc?'warn':''}">Flight controller arrow points to the front</li>`):''}
    <p class="note">${learn?'While you hold a module, <b>green rings</b> show where it can go. ':'Assessment: no hints. Each wrong placement costs points. '}<b>Click the flight controller</b> to rotate it 90°, and turn its arrow to the front <b>before</b> the top shell closes over it. The RTK module and the lights sit on the top shell. Drag a fitted module to take it off again.</p>`;
  if(learn){
    checks=`<div><h3 class="sec">${tr('Checklist','Senarai semak')}</h3><ul class="checks">${keys.map(t=>{ const c=TYPES[t].count, d=c-left(t); return `<li class="${d===c?'ok':''}">${TYPES[t].name}<span class="r">${d}/${c}</span></li>`; }).join('')}
      <li class="${parts.fc&&S.fcRot===0?'ok':parts.fc?'warn':''}">${tr('Flight controller arrow points to the front','Anak panah pengawal penerbangan menghala ke depan')}</li>
      ${[[tr('Motor screws, M3 × 6','Skru motor, M3 × 6'),'motor'],[tr('Stack nuts, M3 nylon','Nat tindanan, nilon M3'),'fc'],[tr('Camera screws, M2 × 5','Skru kamera, M2 × 5'),'camera']].map(([l,o])=>{ const [d,t]=screwCount('mount',o); return `<li class="${d===t?'ok':''}">${l}<span class="r">${d}/${t}</span></li>`; }).join('')}</ul></div>`;
  }
  return `<div><h3 class="sec">${tr('Parts tray','Dulang bahagian')} <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${placed}/${total} ${tr('fitted','dipasang')}</span></h3>${tray(keys)}</div>
    <div><h3 class="sec">${tr('Fastener bin','Bekas pengikat')}</h3>${screwBin('mount',learn)}</div>
    ${checks}
    <p class="note">${tr(`Motor screws go in from <b>under the arm</b>. Orbit below the frame to watch them. ${learn?'While you hold a part, <b>green rings</b> show where it can go. ':'Assessment: no hints. Each wrong place or screw costs points. '}To remove a fitted part, drag it off. Fit the ESC first: the flight controller sits on top of it. <b>Click the flight controller</b> to turn it 90°. Its arrow must point to the front, or the drone flips at take-off.`,`Skru motor dimasukkan dari <b>bawah lengan</b>. Pusingkan paparan ke bawah rangka untuk melihatnya. ${learn?'Semasa anda memegang bahagian, <b>gelang hijau</b> menunjukkan tempat ia boleh dipasang. ':'Penilaian: tiada petunjuk. Setiap tempat atau skru yang salah ditolak markah. '}Untuk menanggalkan bahagian yang telah dipasang, seret keluar. Pasang ESC dahulu: pengawal penerbangan duduk di atasnya. <b>Klik pengawal penerbangan</b> untuk memusingkannya 90°. Anak panahnya mesti menghala ke depan, atau dron akan terbalik semasa berlepas.`)}</p>`;
}
export const WGROUPS=EX?[['motors','Arm ESCs'],['gear','Landing gear antennas'],['cam','FPV camera'],['gimbal','Gimbal camera'],['rtk','RTK module'],['vision','Obstacle sensors'],['lights','Beacons and lights']]
  :CINE?[['lead',tr('Battery lead','Kabel bateri')],['cap',tr('Capacitor','Kapasitor')],['motors',tr('Motors','Motor')],['esc',tr('ESC harness','Abah-abah ESC')],['rx',tr('Radio receiver','Penerima radio')],['gps',tr('GPS module','Modul GPS')],['vtx',tr('Digital VTX','VTX digital')]]
  :[['lead',tr('Battery lead','Kabel bateri')],['cap',tr('Capacitor','Kapasitor')],['motors',tr('Motors','Motor')],['esc',tr('ESC harness','Abah-abah ESC')],['rx',tr('Radio receiver','Penerima radio')],['gps',tr('GPS module','Modul GPS')],['cam',tr('FPV camera','Kamera FPV')],['vtx',tr('Video transmitter','Pemancar video')]];
export function renderWire(learn){
  const all=srcPads(); const done=all.filter(p=>p.wired).length;
  const groups=WGROUPS.map(([g,nm])=>{
    const list=all.filter(p=>g==='motors'?/^(mot|arm)\d/.test(p.hotId):g==='gear'?p.hotId.startsWith('gear'):p.hotId===g).sort((a,b)=>a.id<b.id?-1:1);
    const d=list.filter(p=>p.wired).length;
    const rows=list.map(p=>`<div class="wrow ${p.wired?'ok':''}"><span class="dot" style="background:${hex(wireColor(p.need,p.label))}"></span><span>${esc(p.label)}${g==='motors'?` · ${CORNER[+p.hotId.slice(3)]}`:''} → ${learn?esc(NETSHORT[p.need]):'?'}</span><span class="st">${p.wired?(EX?'plugged in':tr('soldered','dipateri')):''}</span></div>`).join('');
    return `<div class="wgroup"><header class="${d===list.length?'done':''}">${nm}<span class="r">${d}/${list.length}</span></header><div class="wrows">${rows}</div></div>`;
  }).join('');
  if(EX) return `<p class="note"><b>${done} of ${all.length}</b> cables plugged in. On the <b>connection diagram</b>, drag each module’s plug onto its port on the flight controller. A wrong port shows <b style="color:var(--bad)">✕ WRONG</b> and the plug is not fitted. Press <b>3D view</b> to plug in on the model: the top shell is off and the flight controller is lifted out of the body so you can reach it.</p>
    ${groups}
    <p class="note">${learn?'Each motor port number matches the arm number, and each landing-gear leg has its own antenna port on its own side. When you pick up a plug, the matching ports turn <b>green</b>.':'Assessment: no hints. A wrong port costs points and the plug is not fitted.'}</p>`;
  return `<p class="note">${tr(`<b>${done} of ${all.length}</b> wires soldered. On the <b>wiring diagram</b>, drag each coloured wire end onto its pad. A wrong pad shows <b style="color:var(--bad)">✕ WRONG</b> and the wire is not soldered. To wire on the 3D model instead, press <b>3D view</b> under the diagram. Both views stay in sync.`,`<b>${done} daripada ${all.length}</b> wayar dipateri. Pada <b>rajah pendawaian</b>, seret setiap hujung wayar berwarna ke padnya. Pad yang salah menunjukkan <b style="color:var(--bad)">✕ SALAH</b> dan wayar tidak dipateri. Untuk mendawai pada model 3D, tekan <b>Paparan 3D</b> di bawah rajah. Kedua-dua paparan kekal selari.`)}</p>
    <div class="legend"><span><i style="background:#d8453b"></i>${tr('Power','Kuasa')}</span><span><i style="background:#2b2f35;outline:1px solid #556"></i>${tr('Ground','Bumi')}</span>${CINE?'':`<span><i style="background:#e8c33c"></i>Video</span>`}<span><i style="background:${hex(wireColor('R1','TX'))}"></i>TX</span><span><i style="background:#eee"></i>RX</span><span><i style="background:#8a939c"></i>${tr('Motor phases','Fasa motor')}</span></div>
    ${groups}
    <p class="note">${learn?tr('When you pick up a wire, the matching pads turn <b>green</b>. Serial wires cross over: the TX (transmit) wire goes to an R (receive) pad, and the RX wire goes to a T pad.','Apabila anda mengambil wayar, pad yang sepadan bertukar <b>hijau</b>. Wayar bersiri bersilang: wayar TX (hantar) pergi ke pad R (terima), dan wayar RX pergi ke pad T.'):tr('Assessment: no hints. A wrong connection costs points and is not soldered.','Penilaian: tiada petunjuk. Sambungan yang salah ditolak markah dan tidak dipateri.')}</p>`;
}
export function renderPower(learn){
  /* safe order: props off first, then battery in and strapped, plug in, test, unplug before the propellers go on */
  const st=strapped(), t=S.test, bat=!!parts.bat, live=EX||!S.unplugged, can=st&&t.safety&&!t.confirmed&&live;   // no plugged-in battery, no power to the motors
  const fix=EX?'Reverse':tr('Swap 2 wires','Tukar 2 wayar');
  const rows=[1,2,3,4].map(n=>{ const sp=S.spin[n]!==0, a=dirActual(n);
    const seen=sp&&learn?`<small class="${a===EXP[n]?'okc':'badc'}">${tr('turning','berputar')} ${a}${a===EXP[n]?'':tr(' · wrong way',' · arah salah')}</small>`:learn?`<small>${tr('should turn','sepatutnya berputar')} ${EXP[n]}</small>`:'';
    return `<div class="mrow"><span class="mid">M${n}</span><span class="mc">${CORNER[n]}${seen}</span><button class="btn sm" data-act="spin" data-m="${n}" ${can?'':'disabled'}>${sp?tr('Stop','Henti'):tr('Spin','Putar')}</button><button class="btn sm ghost" data-act="swap" data-m="${n}" ${can?'':'disabled'}>${fix}</button></div>`; }).join('');
  const plugLi=EX?'':`<li class="${!S.unplugged||t.confirmed?'ok':''} ${st?'':'locked'}">${tr('<b>Plug in the battery.</b> Push the battery plug into the battery lead. From now on the motors have power.','<b>Palamkan bateri.</b> Tolak palam bateri ke dalam kabel bateri. Mulai sekarang motor mendapat kuasa.')}
      <div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="plug" ${st&&t.safety&&S.unplugged&&!t.confirmed?'':'disabled'}>${tr('Plug in','Palamkan')}</button></div></li>`;
  const unplugLi=EX?'':`<li class="${t.confirmed&&S.unplugged?'ok':''} ${t.confirmed?'':'locked'}">${tr('<b>Unplug the battery.</b> Always unplug it before you fit the propellers. A motor can start by accident while your hand is on a blade.','<b>Cabut palam bateri.</b> Sentiasa cabut palamnya sebelum memasang kipas. Motor boleh berputar secara tidak sengaja semasa tangan anda pada bilah.')}
      <div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="unplug" ${t.confirmed&&!S.unplugged?'':'disabled'}>${tr('Unplug','Cabut palam')}</button></div></li>`;
  return `<ol class="tasks">
    <li class="${t.safety?'ok':''}"><label class="check"><input type="checkbox" id="safeChk" ${t.safety?'checked':''} ${t.confirmed||(!EX&&!S.unplugged)?'disabled':''}><span>${tr('<b>Safety check.</b> The propellers are off. Check this before any battery goes in. Never test motors with propellers fitted: a spinning blade can cut you badly.','<b>Semakan keselamatan.</b> Kipas telah ditanggalkan. Tandakan ini sebelum sebarang bateri dimasukkan. Jangan sekali-kali menguji motor dengan kipas terpasang: bilah yang berputar boleh melukakan anda dengan teruk.')}</span></label></li>
    ${EX?`<li class="${st?'ok':''} ${t.safety?'':'locked'}"><b>Fit both smart batteries.</b> Slide each one into the bay at the rear until it locks. Either battery can power the drone alone, so one can be swapped while the other keeps it running.${st||!t.safety?'':tray(['battery'])}</li>`
    :`<li class="${bat?'ok':''} ${t.safety?'':'locked'}">${tr('<b>Fit the battery.</b> Drag it onto the rubber pad on the top plate. Leave it unplugged for now.','<b>Pasang bateri.</b> Seret ke atas pad getah pada plat atas. Biarkan palamnya tercabut buat masa ini.')}${bat||!t.safety?'':tray(['battery'])}</li>
    <li class="${st?'ok':''} ${bat?'':'locked'}">${tr('<b>Strap it down.</b> Drag both battery straps over the battery. Each strap passes through a pair of slots in the top plate. A loose battery can fly off and rip out the power cable.','<b>Ikat bateri.</b> Seret kedua-dua tali bateri ke atas bateri. Setiap tali melalui sepasang alur pada plat atas. Bateri yang longgar boleh tercampak dan merentap kabel kuasa.')}${bat&&!st?tray(['strap']):''}</li>`}
    ${plugLi}
    <li class="${t.confirmed?'ok':''} ${can||t.confirmed?'':'locked'}">${tr('<b>Test each motor.</b> Spin it and watch the arrow over the motor.','<b>Uji setiap motor.</b> Putarkan dan perhatikan anak panah di atas motor.')} ${EX?'If it turns the wrong way, reverse it in the ESC settings. Each ESC is sealed inside its motor pod, so there are no wires to swap.':tr('If it turns the wrong way, swap any two of its three wires.','Jika ia berputar ke arah yang salah, tukar mana-mana dua daripada tiga wayarnya.')}
      <div class="mtable">${rows}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-act="spinAll" ${can?'':'disabled'}>${[1,2,3,4].some(n=>S.spin[n]!==0)?tr('Stop all','Henti semua'):tr('Spin all','Putar semua')}</button><button class="btn sm primary" data-act="confirm" ${can?'':'disabled'}>${tr('Directions are correct','Arah putaran betul')}</button></div>
    </li>${unplugLi}</ol>
    <div class="layout">${layoutSVG(true)}<p>${tr('Required layout, seen from above. Diagonal motors turn the same way, so the twisting forces of the two pairs cancel.','Susun atur yang diperlukan, dilihat dari atas. Motor yang bertentangan secara pepenjuru berputar ke arah yang sama, jadi daya pulas kedua-dua pasangan saling membatalkan.')} ${propsNote()}</p></div>`;
}
export function renderProps(learn){
  return `<div><h3 class="sec">${tr('Propellers','Kipas')}</h3>${tray(['propCW','propCCW'],{propCW:tr('red · turns clockwise','merah · berputar ikut arah jam'),propCCW:tr('blue · turns counter-clockwise','biru · berputar lawan arah jam')})}</div>
    ${learn?`<div class="layout">${layoutSVG(true)}<p>${tr('Match each propeller to its motor. A CW propeller on a CW motor pushes air down. On the wrong motor it pushes air up, and the drone flips.','Padankan setiap kipas dengan motornya. Kipas CW pada motor CW menolak udara ke bawah. Pada motor yang salah ia menolak udara ke atas, dan dron terbalik.')}</p></div>`:`<p class="note">${tr('Assessment: use the motor directions you checked in the motor test. Each wrong propeller costs points.','Penilaian: gunakan arah motor yang anda semak dalam ujian motor. Setiap kipas yang salah ditolak markah.')}</p>`}
    <p class="note">${tr('The CW and CCW propellers are mirror images. Look at the blade shape: the raised leading edge cuts into the air first. In this lab the <b style="color:#d8453b">CW propellers are red</b> and the <b style="color:#3d7fd8">CCW propellers are blue</b>.','Kipas CW dan CCW ialah bayangan cermin. Lihat bentuk bilahnya: tepi hadapan yang terangkat memotong udara dahulu. Dalam makmal ini <b style="color:#d8453b">kipas CW berwarna merah</b> dan <b style="color:#3d7fd8">kipas CCW berwarna biru</b>.')}</p>`;

}
export function renderFly(learn){
  const f=FL, cur=f.cur&&MANS[f.cur]?MANS[f.cur]:{t:tr('Ready on the mat','Sedia di atas alas'),d:tr('Press Take off. Then try each movement. Watch the thrust arrows and the motor bars.','Tekan Berlepas. Kemudian cuba setiap pergerakan. Perhatikan anak panah tujahan dan bar motor.'),dof:null};
  const B=(m,l,dis)=>`<button class="btn" data-act="man" data-m="${m}" ${dis?'disabled':''}>${l}</button>`;
  const air=airborne();
  const dofRows=LANG==='ms'
    ?[['heave','Heave (naik turun)','Ke atas dan ke bawah','Keempat-empat motor bersama'],['surge','Surge (maju undur)','Ke depan dan ke belakang','Pitch dahulu, kemudian tujahan condong'],['sway','Sway (ke sisi)','Ke kiri dan ke kanan','Roll dahulu, kemudian tujahan condong'],['roll','Roll (guling)','Condong kiri/kanan','Pasangan kiri lawan pasangan kanan'],['pitch','Pitch (angguk)','Muncung naik/turun','Pasangan depan lawan pasangan belakang'],['yaw','Yaw (pusing)','Pusing kiri/kanan','Pasangan CW lawan pasangan CCW']]
    :[['heave','Heave','Up and down','All four motors together'],['surge','Surge','Forward and back','Pitch first, then tilted thrust'],['sway','Sway','Left and right','Roll first, then tilted thrust'],['roll','Roll','Bank left/right','Left pair vs right pair'],['pitch','Pitch','Nose up/down','Front pair vs rear pair'],['yaw','Yaw','Turn left/right','CW pair vs CCW pair']];
  const on=cur.dof, onSet=new Set(on==='pitch'?['pitch','surge']:on==='roll'?['roll','sway']:[on]);
  const checks=S.explore?'':`<ul class="checks">${[['hover',tr('Take off and hover','Berlepas dan melayang')],['pitch','Pitch'],['roll','Roll'],['yaw','Yaw']].map(([k,l])=>`<li class="${S.flown[k]?'ok':''}">${l}</li>`).join('')}</ul>`;
  return `<div class="mgrid">
      ${B('arm',f.armed?tr('Disarm','Nyahaktif'):tr('Arm','Aktifkan'),air)}${B('takeoff',tr('Take off','Berlepas'),air)}${B('land',tr('Land','Mendarat'),!air)}
      ${B('pitchF',tr('Pitch fwd','Pitch depan'),!air)}${B('rollL',tr('Roll left','Roll kiri'),!air)}${B('yawL',tr('Yaw left','Yaw kiri'),!air)}
      ${B('pitchB',tr('Pitch back','Pitch belakang'),!air)}${B('rollR',tr('Roll right','Roll kanan'),!air)}${B('yawR',tr('Yaw right','Yaw kanan'),!air)}
      ${B('climb',tr('Climb','Naik'),!air)}${B('descend',tr('Descend','Turun'),!air)}<button class="btn ghost" data-act="tour">Demo</button>
    </div>
    <p class="note">${MV.pad?`<b>${esc(padName(MV.pad.id))}:</b> `:tr('<b>PS4 / PS5 controller (Bluetooth):</b> pair it, then press a button. ','<b>Alat kawalan PS4 / PS5 (Bluetooth):</b> pasangkan, kemudian tekan satu butang. ')}${tr('✕ take off · ○ land · △ climb · □ descend · Options demo. Right stick pitch and roll, left stick yaw.','✕ berlepas · ○ mendarat · △ naik · □ turun · Options demo. Kayu kanan untuk pitch dan roll, kayu kiri untuk yaw.')}</p>
    <div class="explain"><b>${cur.t}</b><p>${cur.d}</p></div>
    <div class="hud"><div><small>${tr('Thrust ÷ weight','Tujahan ÷ berat')}</small><span id="hudTW">0.00</span></div><div><small>Roll</small><span id="hudR">0°</span></div><div><small>Pitch</small><span id="hudP">0°</span></div><div><small>${tr('Heading','Arah haluan')}</small><span id="hudY">0°</span></div></div>
    <div class="bars">${[1,2,3,4].map(n=>`<div class="bar"><span>M${n} ${(LANG==='ms'?{1:'BKn',2:'DKn',3:'BKr',4:'DKr'}:{1:'RR',2:'FR',3:'RL',4:'FL'})[n]} · ${EXP[n]}</span><div class="tr"><div class="fl ${EXP[n]==='CCW'?'ccw':''}" id="mb${n}"></div></div><span class="v" id="mv${n}">0%</span></div>`).join('')}</div>
    <div class="toggles"><label><input type="checkbox" id="chkForces" ${S.forces?'checked':''}> ${tr('Force arrows','Anak panah daya')}</label><label><input type="checkbox" id="chkSpin" ${S.spinArrows?'checked':''}> ${tr('Spin arrows','Anak panah putaran')}</label><label><input type="checkbox" id="chkAir" ${S.air?'checked':''}> ${tr('Airflow','Aliran udara')}</label></div>
    ${forceKey()}
    <div><h3 class="sec">${tr('Six degrees of freedom','Enam darjah kebebasan')}</h3><table class="dof">${dofRows.map(([k,n,w,h])=>`<tr class="${onSet.has(k)?'on':''}"><td>${n}</td><td>${w}</td><td>${h}</td></tr>`).join('')}</table></div>
    ${checks}`;
}
/* what the arrows mean; shared with the Movements activity */
export function forceKey(){
  return `<div class="fkey"><span><i style="background:var(--accent)"></i>${tr('Thrust: one arrow per motor, and the total','Tujahan: satu anak panah bagi setiap motor, dan jumlahnya')}</span><span><i style="background:var(--cool)"></i>${tr('Weight','Berat')}</span><span><i style="background:var(--ok)"></i>${tr('Net force: what speeds the drone up or slows it down','Daya bersih: yang mempercepat atau memperlahankan dron')}</span>
    <p>${tr('All arrows use one scale. In a hover each motor arrow is a quarter of the weight, and the four add up to the total thrust. When the drone tilts, the total thrust tilts too, so the net force points sideways.','Semua anak panah menggunakan satu skala. Semasa melayang, setiap anak panah motor ialah suku daripada berat, dan keempat-empatnya menjadi jumlah tujahan. Apabila dron condong, jumlah tujahan turut condong, jadi daya bersih menghala ke sisi.')}</p></div>`;
}
export const QUIZ=[
  {q:'The arrow printed on the flight controller must point…',o:['Toward the battery strap','Toward the front of the frame','Toward motor 1','It does not matter'],a:1,why:'The FC’s gyro and accelerometer decide which way is forward. If the arrow points elsewhere, the FC corrects tilt in the wrong direction and the drone flips at take-off.'},
  {q:'The GPS module’s TX wire is soldered to…',o:['The FC’s T3 pad','The FC’s 5V pad','The FC’s R3 pad','The ESC harness'],a:2,why:'Serial wires cross over. What one side transmits (TX), the other side must receive (RX). So the GPS TX goes to the FC receive pad, R3.'},
  {q:'During the motor test one motor spins the wrong way. The hardware fix is to…',o:['Swap any two of its three wires','Swap all three wires around','Fit the opposite propeller','Reverse the battery plug'],a:0,why:'A brushless motor’s direction depends on the order of its three phase wires. Swapping any two of them reverses the motor.'},
  {q:'The capacitor across the ESC battery pads is there to…',o:['Extend the flight time','Convert 16 V down to 5 V','Absorb voltage spikes and electrical noise','Measure battery current'],a:2,why:'Fast motor switching makes voltage spikes on the battery wires. The capacitor absorbs them. This protects the ESC and cleans up the video.'},
  {q:'To turn the nose to the right (clockwise seen from above), the controller…',o:['Speeds up the front motors',`Speeds up the counter-clockwise motors (${motorsTurning('CCW')})`,`Speeds up the clockwise motors (${motorsTurning('CW')})`,'Tilts the whole drone right'],a:1,why:'Each propeller twists the frame the opposite way to its spin. Faster counter-clockwise propellers twist the frame clockwise. The nose turns right, and total lift stays the same.'},
  {q:'To fly forward, which motors speed up?',o:['The rear motors','The front motors','The left motors','All four equally'],a:0,why:'Faster rear motors lift the tail, so the nose dips. The tilted thrust then pushes the drone forward.'},
  {q:'Why are the motor screws kept short (M3 × 6)?',o:['Short screws are lighter','A long screw can reach the motor windings and short the motor','Long screws strip the carbon arm','Short screws are easier to buy'],a:1,why:'The mounting holes go into the motor base, just below the copper windings. A screw that is too long scrapes the insulation off the windings and short-circuits the motor.'},
  {q:'Why are the propellers fitted last?',o:['They are the lightest part','So the motors can be powered and tested without spinning blades','They balance the battery','The ESC needs them to start'],a:1,why:'A spinning propeller can cause serious cuts. So motor direction is always checked with the propellers off.'},
];
/* model 3 has no soldering, capacitor or screws: those four questions become questions on its modules */
if(EX){
  QUIZ.splice(6,1,{q:'Why does the RTK module have two antennas about 16 cm apart?',o:['For a stronger radio signal','So the drone knows which way it faces without a compass','So one is a spare','To balance the drone'],a:1,why:'Two satellite antennas a known distance apart give the direction the drone faces. That works next to steel structures, where a compass is pulled off course.'});
  QUIZ.splice(1,3,
    {q:'Why does the flight controller have three motion sensors (IMUs)?',o:['To fly three times faster','So it can ignore one that fails and keep flying','One for each camera','To measure the batteries'],a:1,why:'The controller compares the three sensors. If one disagrees with the other two, it is ignored and the drone keeps flying safely.'},
    {q:'During the motor test one motor spins the wrong way. Its ESC is sealed inside the motor pod, so the fix is to…',o:['Reverse that motor in the ESC settings','Fit the opposite propeller','Swap the two batteries','Fold the arm the other way'],a:0,why:'A brushless motor’s direction is the order in which the ESC drives its three phases. On a sealed pod that order is changed in the ESC settings, not by swapping two wires.'},
    {q:'Why does this drone carry two smart batteries?',o:['Each motor pair needs its own battery','Either can power it alone, so one can be swapped without switching off','Two batteries charge faster','To keep the drone level'],a:1,why:'Hot swap: with one battery out, the other keeps the drone and its sensors running, so an inspection can carry on without a restart.'});
}
/* model 2 adds questions on what makes it an HD freestyle drone */
if(CINE) QUIZ.push(
  {q:'What is the black TPU guard under each arm tip for?',o:['It makes the motor spin faster','It takes the hit on landings and crashes, so the arm and motor are not damaged','It cools the ESC','It holds the propeller on'],a:1,why:'TPU is a soft, tough plastic. Under the arm tip it touches the ground first and absorbs the shock, so the carbon arm and the motor bell are protected.'},
  {q:'Where does the HD camera’s video signal go?',o:['To the CAM pad on the flight controller','Through the coax cable to the digital VTX','To the ESC','Straight to the radio receiver'],a:1,why:'In a digital system the camera picture goes over a thin coax cable straight to the VTX. The flight controller only talks to the VTX over UART 2, to show flight data on screen.'},
  {q:'Why do yellow TPU bumpers sit on the corners of the HD camera cage?',o:['They make the camera lighter','They take the hit in a crash so the lens is not broken','They send the video to the goggles','They hold the battery'],a:1,why:'The bumpers stick out past the lens. In a crash the soft TPU hits first and absorbs the shock, so the camera survives.'},
);
/* Bahasa Malaysia quiz: same order and answers as above (8 questions, then the 3 model 2 questions) */
if(LANG==='ms'){
  const MSQ=[
    {q:'Anak panah yang dicetak pada pengawal penerbangan mesti menghala…',o:['Ke arah tali bateri','Ke arah hadapan rangka','Ke arah motor 1','Tidak penting'],why:'Giroskop dan meter pecutan FC menentukan arah hadapan. Jika anak panah menghala ke arah lain, FC membetulkan kecondongan ke arah yang salah dan dron terbalik semasa berlepas.'},
    {q:'Wayar TX modul GPS dipateri ke…',o:['Pad T3 pada FC','Pad 5V pada FC','Pad R3 pada FC','Abah-abah ESC'],why:'Wayar bersiri bersilang. Apa yang dihantar (TX) oleh satu pihak mesti diterima (RX) oleh pihak lain. Jadi TX GPS pergi ke pad terima FC, iaitu R3.'},
    {q:'Semasa ujian motor, satu motor berputar ke arah yang salah. Cara membaikinya ialah…',o:['Tukar mana-mana dua daripada tiga wayarnya','Tukar ketiga-tiga wayar','Pasang kipas yang bertentangan','Terbalikkan palam bateri'],why:'Arah motor tanpa berus bergantung pada susunan tiga wayar fasanya. Menukar mana-mana dua daripadanya akan menterbalikkan arah motor.'},
    {q:'Kapasitor merentasi pad bateri ESC berfungsi untuk…',o:['Memanjangkan masa penerbangan','Menukar 16 V kepada 5 V','Menyerap lonjakan voltan dan hingar elektrik','Mengukur arus bateri'],why:'Pensuisan motor yang pantas menghasilkan lonjakan voltan pada wayar bateri. Kapasitor menyerapnya. Ini melindungi ESC dan membersihkan gambar video.'},
    {q:'Untuk memusingkan muncung ke kanan (ikut arah jam dilihat dari atas), pengawal…',o:['Mempercepat motor depan',`Mempercepat motor lawan arah jam (${motorsTurning('CCW')})`,`Mempercepat motor ikut arah jam (${motorsTurning('CW')})`,'Mencondongkan seluruh dron ke kanan'],why:'Setiap kipas memulas rangka ke arah bertentangan dengan putarannya. Kipas lawan arah jam yang lebih laju memulas rangka ikut arah jam. Muncung berpusing ke kanan, dan jumlah daya angkat kekal sama.'},
    {q:'Untuk terbang ke hadapan, motor mana yang dipercepatkan?',o:['Motor belakang','Motor depan','Motor kiri','Keempat-empat sama rata'],why:'Motor belakang yang lebih laju mengangkat ekor, jadi muncung menunduk. Tujahan yang condong kemudian menolak dron ke hadapan.'},
    {q:'Mengapa skru motor dipendekkan (M3 × 6)?',o:['Skru pendek lebih ringan','Skru panjang boleh mencecah belitan motor dan membuat litar pintas','Skru panjang merosakkan lengan karbon','Skru pendek lebih mudah dibeli'],why:'Lubang pemasangan masuk ke tapak motor, betul-betul di bawah belitan kuprum. Skru yang terlalu panjang mengikis penebat belitan dan membuat litar pintas pada motor.'},
    {q:'Mengapa kipas dipasang paling akhir?',o:['Kipas ialah bahagian paling ringan','Supaya motor boleh dihidupkan dan diuji tanpa bilah yang berputar','Kipas mengimbangi bateri','ESC memerlukannya untuk bermula'],why:'Kipas yang berputar boleh menyebabkan luka yang serius. Jadi arah motor sentiasa disemak dengan kipas ditanggalkan.'},
    {q:'Apakah fungsi pelindung TPU hitam di bawah setiap hujung lengan?',o:['Ia menjadikan motor berputar lebih laju','Ia menerima hentakan semasa mendarat dan terhempas, supaya lengan dan motor tidak rosak','Ia menyejukkan ESC','Ia memegang kipas'],why:'TPU ialah plastik yang lembut dan tahan lasak. Di bawah hujung lengan ia menyentuh tanah dahulu dan menyerap hentakan, jadi lengan karbon dan loceng motor terlindung.'},
    {q:'Ke manakah isyarat video kamera HD pergi?',o:['Ke pad CAM pada pengawal penerbangan','Melalui kabel sepaksi ke VTX digital','Ke ESC','Terus ke penerima radio'],why:'Dalam sistem digital, gambar kamera pergi melalui kabel sepaksi nipis terus ke VTX. Pengawal penerbangan hanya berhubung dengan VTX melalui UART 2, untuk memaparkan data penerbangan pada skrin.'},
    {q:'Mengapa bampar TPU kuning diletakkan pada penjuru sangkar kamera HD?',o:['Ia menjadikan kamera lebih ringan','Ia menerima hentakan semasa terhempas supaya kanta tidak pecah','Ia menghantar video ke gogal','Ia memegang bateri'],why:'Bampar menonjol melepasi kanta. Semasa terhempas, TPU yang lembut terkena dahulu dan menyerap hentakan, jadi kamera selamat.'},
  ];
  if(!EX) QUIZ.forEach((q,i)=>{ const m=MSQ[i]; if(m) Object.assign(q,{q:m.q,o:m.o,why:m.why}); });
}
export function renderQuiz(){
  const d=S.quizDone;
  return QUIZ.map((q,i)=>`<fieldset class="q ${d?'done':''}"><legend>${i+1}. ${esc(q.q)}</legend>${q.o.map((o,j)=>`<label class="opt ${d&&j===q.a?'correct':''} ${d&&S.quizAns[i]===j&&j!==q.a?'picked-wrong':''}"><input type="radio" name="q${i}" id="q${i}_${j}" value="${j}" ${S.quizAns[i]===j?'checked':''} ${d?'disabled':''}><span>${esc(o)}</span></label>`).join('')}${d?`<p class="why">${esc(q.why)}</p>`:''}</fieldset>`).join('')
    +(d?`<p class="note"><b>${S.quizScore} / ${SEC.quiz}</b> ${tr('points for this section.','markah untuk bahagian ini.')}</p>`:`<button class="btn primary" data-act="quizSubmit">${tr('Submit answers','Hantar jawapan')}</button>`);

}
