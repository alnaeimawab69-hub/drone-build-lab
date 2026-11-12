/* Drone Build Lab · Start screen and assessment report */
import { $, MODEL, MODELS, PROPS, esc } from './01-config.js';
import { SEC, SECNAME } from './07-catalogue.js';
import { S } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { setFCRot } from './12-placement.js';
import { scores } from './17-scoring.js';
import { autoFrame, autoMount, autoProps, autoWire, enterStage, exitStage, placePower, stageKey } from './20-stages.js';
import { fmtTime, renderMeta } from './21-panel.js';
import { LANG, LANGS, setLang, tr } from '../../lang.js';

/* ================= Start screen & report ================= */
/* small top view of a model, drawn from its arm angles (front at the top) */
function modelIcon(m){
  const R=26, c=34, pts=[1,2,3,4].map(n=>{ const a=m.ang[n]*Math.PI/180; return [c+Math.cos(a)*R,c-Math.sin(a)*R]; });
  return `<svg viewBox="0 0 68 68" aria-hidden="true"><path d="${pts.map(([x,y])=>`M${c},${c} L${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" style="stroke:var(--dim);stroke-width:4;stroke-linecap:round"/>
    <rect x="${c-6}" y="${c-9}" width="12" height="18" rx="3" style="fill:var(--accent)"/>${pts.map(([x,y])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" style="fill:var(--panel-3);stroke:var(--muted);stroke-width:1.5"/>`).join('')}
    <path d="M${c},4 l4,6 h-8 z" style="fill:var(--muted)"/></svg>`;
}
/* ================= Portal: send the result to the page that embeds this lab =================
   A portal opens the lab in an iframe, optionally with ?portal=https://portal.example (its origin). No name or other personal data is sent.
   When the report opens, the lab posts one message to the portal:
   {type:'sim-result', sim:'drone-build-lab', version:1, mode:'assessment'|'practice', model, props,
    score, max:100, passed, grade, timeSec, sections:[{id,name,score,max}], mistakes:[{section,text}], finishedAt (ISO 8601)}
   It is only sent to the portal's origin (from ?portal=, else the page that opened the lab), never to '*'. */
const QS=(()=>{ try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(); } })();
function portalOrigin(){
  for(const u of [QS.get('portal'),document.referrer]){ try{ if(u){ const o=new URL(u).origin; if(/^https?:/.test(o)) return o; } }catch(e){} }
  return null;
}
export function resultData(sc){
  return {type:'sim-result',sim:'drone-build-lab',version:1,mode:S.mode==='assess'?'assessment':'practice',model:MODEL.key,props:PROPS,
    score:sc.total,max:100,passed:sc.total>=50,grade:grade(sc.total),timeSec:Math.round((S.endT-S.startT)/1000),
    sections:Object.keys(SEC).map(k=>({id:k,name:SECNAME[k],score:sc[k],max:SEC[k]})),
    mistakes:S.mistakes.map(m=>({section:m.sec,text:m.msg})),finishedAt:new Date().toISOString()};
}
function sendResult(sc){
  if(S.resultSent||window.parent===window) return;   // only when embedded, once per run
  const o=portalOrigin(); if(!o) return;
  try{ window.parent.postMessage(resultData(sc),o); S.resultSent=true; }catch(e){}
}
export function showStart(){
  const models=Object.values(MODELS).map(m=>`<button class="model ${m.key===MODEL.key?'on':''}" data-model="${m.key}" aria-pressed="${m.key===MODEL.key}">${modelIcon(m)}<span><em>Model ${m.no}${m.key===MODEL.key?tr(' · selected',' · dipilih'):''}</em><b>${esc(m.title)}</b><small>${esc(m.blurb)}</small></span></button>`).join('');
  const sealed=!!MODEL.sealed;
  const props=[['in',tr('Props in','Kipas masuk'),tr('Front propellers sweep in, toward the camera. The usual choice.','Kipas depan menyapu ke dalam, ke arah kamera. Pilihan biasa.')],['out',tr('Props out','Kipas keluar'),tr('Every motor reversed. Front propellers sweep out, away from the camera.','Setiap motor diterbalikkan. Kipas depan menyapu ke luar, menjauhi kamera.')]]
    .map(([k,b,s])=>`<button class="pdir ${PROPS===k?'on':''}" data-props="${k}" aria-pressed="${PROPS===k}"><b>${b}</b><small>${s}</small></button>`).join('');
  $('#overlay').hidden=false;
  $('#overlay').innerHTML=`<div class="ov" role="dialog" aria-labelledby="ovT">
    <div class="eyebrow">${tr('Digital lab · Drone fundamentals','Makmal digital · Asas dron')}</div>
    <h1 id="ovT">Drone Build Lab</h1>
    <p class="lede">${tr('Build a quadcopter from scratch. Screw the carbon frame together, mount each part, solder the wires and test the motors. Then fit the propellers and fly it to see how thrust makes each movement.','Bina sebuah quadcopter dari awal. Skrukan rangka karbon, pasang setiap bahagian, pateri wayar dan uji motor. Kemudian pasang kipas dan terbangkannya untuk melihat bagaimana tujahan menghasilkan setiap pergerakan.')}</p>
    <div class="lang" role="group" aria-label="${tr('Language','Bahasa')}">${LANGS.map(([k,l])=>`<button type="button" lang="${k}" data-lang="${k}" aria-pressed="${LANG===k}">${l}</button>`).join('')}</div>
    <h3 class="sec">1 · ${tr('Choose a drone','Pilih dron')}</h3>
    <div class="models">${models}</div>
    <h3 class="sec">2 · ${tr('Motor direction','Arah motor')}</h3>
    <div class="pdirs">${props}</div>
    <h3 class="sec">3 · ${tr('Choose an activity','Pilih aktiviti')}</h3>
    <div class="modes">
      ${sealed?'':`<button class="mode learn" data-mode="learn"><em>${tr('Guided','Berpandu')}</em><b>${tr('Practice','Latihan')}</b><span>${tr('Hints show where parts and wires go. “Show me” finishes any stage for you.','Petunjuk menunjukkan tempat bahagian dan wayar dipasang. “Tunjukkan” menyiapkan mana-mana peringkat untuk anda.')}</span></button>
      <button class="mode assess" data-mode="assess"><em>${tr('Scored','Bermarkah')}</em><b>${tr('Assessment','Penilaian')}</b><span>${tr('No hints, and a timer. Mistakes cost points. You get a scored report at the end.','Tiada petunjuk, dan ada pemasa. Setiap kesilapan ditolak markah. Anda mendapat laporan bermarkah di akhir aktiviti.')}</span></button>`}
      <button class="mode explore" data-mode="explore"><em>${tr('Free','Bebas')}</em><b>${tr('Explore','Teroka')}</b><span>${tr('Start with the finished drone. Take it apart, read about each part and fly it.','Mula dengan dron yang sudah siap. Leraikannya, baca tentang setiap bahagian dan terbangkannya.')}</span></button>
      <button class="mode moves" data-mode="moves"><em>${tr('Flight trainer','Latihan terbang')}</em><b>${tr('Movements','Pergerakan')}</b><span>${tr('Learn the remote: on-screen sticks, the keyboard, a PS4 / PS5 controller by Bluetooth, or a USB radio.','Belajar menggunakan alat kawalan jauh: kayu kawalan pada skrin, papan kekunci, alat kawalan PS4 / PS5 melalui Bluetooth, atau radio USB.')}</span></button>
    </div>
    ${sealed?`<p class="small">${esc(MODEL.title)} ${tr('is for Explore and Movements only: take the finished drone apart, read about each module, and fly it.','hanya untuk Teroka dan Pergerakan: leraikan dron yang sudah siap, baca tentang setiap modul, dan terbangkannya.')}</p>`:''}
    <p class="small">${tr('Drag parts with a mouse or finger. Drag empty space to orbit. Scroll or pinch to zoom.','Seret bahagian dengan tetikus atau jari. Seret ruang kosong untuk memusingkan paparan. Tatal atau cubit untuk zum.')}</p></div>`;
  $('#overlay').querySelectorAll('.mode').forEach(b=>b.onclick=()=>start(b.dataset.mode));
  $('#overlay').querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{ if(b.dataset.lang!==LANG) setLang(b.dataset.lang); });
  /* every module reads the model and the motor direction while it loads, so changing either reloads the page */
  const reload=(model,props)=>{
    try{ localStorage.setItem('dbl-model',model); localStorage.setItem('dbl-props',props); }catch(e){}
    $('#overlay').innerHTML=`<div class="loading" role="status">${tr('Loading','Memuatkan')} ${esc(MODELS[model].title)} · ${props==='out'?tr('props out','kipas keluar'):tr('props in','kipas masuk')}…</div>`;
    location.href=`${location.pathname}?model=${model}&props=${props}`;
  };
  $('#overlay').querySelectorAll('.model').forEach(b=>b.onclick=()=>{ if(b.dataset.model!==MODEL.key) reload(b.dataset.model,PROPS); });
  $('#overlay').querySelectorAll('.pdir').forEach(b=>b.onclick=()=>{ if(b.dataset.props!==PROPS) reload(MODEL.key,b.dataset.props); });
}
/* the finished drone, for Explore and Movements */
function buildFinished(){ autoFrame(false); autoMount(false); setFCRot(0,.01); droneRoot.updateMatrixWorld(true); autoWire(false); placePower(false); S.test.confirmed=true; autoProps(false); }
export function start(mode){
  try{ localStorage.removeItem('dbl-name'); }catch(e){}   // clears a name saved by an older version of the lab
  $('#overlay').hidden=true; $('#overlay').innerHTML='';
  S.mode=mode==='assess'?'assess':'learn'; S.explore=mode==='explore'||mode==='moves'; S.startT=performance.now();
  if(mode==='explore'){ buildFinished(); S.labels=true; S.view='parts'; enterStage('explore'); }
  else if(mode==='moves'){ buildFinished(); S.labels=false; S.view='moves'; enterStage('moves'); }
  else { S.stage=0; enterStage('frame'); }
  if(S.mode==='assess') setInterval(()=>{ const t=$('#timer'); if(t) t.textContent=fmtTime((S.endT||performance.now())-S.startT); },1000);
}
export function grade(t){ return t>=85?'Distinction':t>=70?'Merit':t>=50?'Pass':'Needs more practice'; }
/* the grade as shown on the page; grade() itself stays English for the portal message */
const gradeLabel=t=>tr(grade(t),{Distinction:'Cemerlang',Merit:'Kepujian',Pass:'Lulus','Needs more practice':'Perlu lebih latihan'}[grade(t)]);
/* called when the report opens at the end of Practice or Assessment. Deliberately empty, and given no name, email or other
   personal data: it will be connected later. It must not fetch or store anything */
export function lessonFinished(){}
export function showReport(){
  S.endT=S.endT||performance.now(); const sc=scores(); renderMeta(); sendResult(sc); lessonFinished();
  const bars=Object.keys(SEC).map(k=>{ const p=sc[k]/SEC[k]; return `<div class="rbar"><span>${SECNAME[k]}</span><div class="tr"><div class="fl ${p<.5?'low':p<.8?'mid':''}" style="width:${p*100}%"></div></div><span class="v">${sc[k]}/${SEC[k]}</span></div>`; }).join('');
  const ml=S.mistakes.length?`<h3 class="sec">${tr('What to review','Perkara untuk diulang kaji')}</h3><ul class="mlist">${S.mistakes.map(m=>`<li><small>${SECNAME[m.sec]}</small>${esc(m.msg)}</li>`).join('')}</ul>`:`<p class="note" style="margin-bottom:20px">${tr('No mistakes recorded. A clean build.','Tiada kesilapan direkodkan. Binaan yang bersih.')}</p>`;
  $('#overlay').hidden=false;
  $('#overlay').innerHTML=`<div class="ov" role="dialog" aria-labelledby="repT">
    <div class="eyebrow">${S.mode==='assess'?tr('Assessment report','Laporan penilaian'):tr('Practice report','Laporan latihan')} · ${esc(MODEL.title)}</div>
    <h1 id="repT">${tr('Build complete','Binaan selesai')}</h1>
    <div class="rep-top"><div class="total">${sc.total}<small> / 100</small></div><div><div class="grade">${gradeLabel(sc.total)}</div><div class="rep-meta">${tr('Time','Masa')} ${fmtTime(S.endT-S.startT)} · ${S.mistakes.length} ${tr(S.mistakes.length===1?'mistake':'mistakes','kesilapan')}</div></div></div>
    <div class="rbars">${bars}</div>${ml}
    <div class="row"><button class="btn primary" id="repExplore">${tr('Explore the finished drone','Teroka dron yang sudah siap')}</button><button class="btn ghost" id="repAgain">${tr('Start again','Mula semula')}</button>
</div></div>`;
  $('#repExplore').onclick=()=>{ $('#overlay').hidden=true; exitStage(stageKey()); S.explore=true; S.labels=true; S.view='parts'; enterStage('explore'); };
  $('#repAgain').onclick=()=>location.reload();
}
