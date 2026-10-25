/* Drone Build Lab · Start screen and assessment report */
import { $, MODEL, MODELS, esc } from './01-config.js';
import { HOTMAP, SEC, SECNAME } from './07-catalogue.js';
import { S } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { createPart, place, setFCRot } from './12-placement.js';
import { scores } from './17-scoring.js';
import { autoFrame, autoMount, autoProps, autoWire, enterStage, exitStage, stageKey } from './20-stages.js';
import { fmtTime, renderMeta } from './21-panel.js';
import { toast } from './23-toast.js';

/* ================= Start screen & report ================= */
/* small top view of a model, drawn from its arm angles (front at the top) */
function modelIcon(m){
  const R=26, c=34, pts=[1,2,3,4].map(n=>{ const a=m.ang[n]*Math.PI/180; return [c+Math.cos(a)*R,c-Math.sin(a)*R]; });
  return `<svg viewBox="0 0 68 68" aria-hidden="true"><path d="${pts.map(([x,y])=>`M${c},${c} L${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" style="stroke:var(--dim);stroke-width:4;stroke-linecap:round"/>
    <rect x="${c-6}" y="${c-9}" width="12" height="18" rx="3" style="fill:var(--accent)"/>${pts.map(([x,y])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" style="fill:var(--panel-3);stroke:var(--muted);stroke-width:1.5"/>`).join('')}
    <path d="M${c},4 l4,6 h-8 z" style="fill:var(--muted)"/></svg>`;
}
export function showStart(){
  let name=''; try{ name=localStorage.getItem('dbl-name')||''; }catch(e){}
  const models=Object.values(MODELS).map(m=>`<button class="model ${m.key===MODEL.key?'on':''}" data-model="${m.key}" aria-pressed="${m.key===MODEL.key}">${modelIcon(m)}<span><em>Model ${m.no}${m.key===MODEL.key?' · selected':''}</em><b>${esc(m.title)}</b><small>${esc(m.blurb)}</small></span></button>`).join('');
  $('#overlay').hidden=false;
  $('#overlay').innerHTML=`<div class="ov" role="dialog" aria-labelledby="ovT">
    <div class="eyebrow">Digital lab · Drone fundamentals</div>
    <h1 id="ovT">Drone Build Lab</h1>
    <p class="lede">Build a quadcopter from zero: assemble the carbon frame screw by screw, mount every component, solder the wiring, test motor direction, fit the propellers, then fly it to see how thrust creates each movement.</p>
    <div class="field"><label for="studentName">Your name</label><input id="studentName" autocomplete="name" value="${esc(name)}" placeholder="Shown on your report"></div>
    <h3 class="sec">1 · Choose a drone</h3>
    <div class="models">${models}</div>
    <h3 class="sec">2 · Choose an activity</h3>
    <div class="modes">
      <button class="mode learn" data-mode="learn"><em>Guided</em><b>Practice</b><span>Hints show where parts and wires go. “Show me” completes any stage for you.</span></button>
      <button class="mode assess" data-mode="assess"><em>Scored</em><b>Assessment</b><span>No hints, timed. Mistakes cost points. Ends with a report you can copy.</span></button>
      <button class="mode explore" data-mode="explore"><em>Free</em><b>Explore</b><span>Start with the finished drone. Pull it apart, read about each part, fly it.</span></button>
      <button class="mode moves" data-mode="moves"><em>3D animation</em><b>Movements</b><span>Learn throttle, yaw, pitch and roll with two transmitter sticks.</span></button>
    </div>
    <p class="small">Drag parts with a mouse or finger. Drag empty space to orbit, scroll or pinch to zoom.</p></div>`;
  $('#overlay').querySelectorAll('.mode').forEach(b=>b.onclick=()=>start(b.dataset.mode));
  /* every module reads the model while it loads, so switching model reloads the page */
  $('#overlay').querySelectorAll('.model').forEach(b=>b.onclick=()=>{
    if(b.dataset.model===MODEL.key) return;
    try{ localStorage.setItem('dbl-name',($('#studentName').value||'').trim()); localStorage.setItem('dbl-model',b.dataset.model); }catch(e){}
    location.href=location.pathname+'?model='+b.dataset.model;
  });
}
/* the finished drone, for Explore and Movements */
function buildFinished(){ autoFrame(false); autoMount(false); setFCRot(0,.01); droneRoot.updateMatrixWorld(true); autoWire(false); place(HOTMAP.bat,createPart('battery')); S.test.confirmed=true; autoProps(false); }
export function start(mode){
  S.name=($('#studentName').value||'').trim(); try{ localStorage.setItem('dbl-name',S.name); }catch(e){}
  $('#overlay').hidden=true; $('#overlay').innerHTML='';
  S.mode=mode==='assess'?'assess':'learn'; S.explore=mode==='explore'||mode==='moves'; S.startT=performance.now();
  if(mode==='explore'){ buildFinished(); S.labels=true; S.view='parts'; enterStage('explore'); }
  else if(mode==='moves'){ buildFinished(); S.labels=false; S.view='moves'; enterStage('moves'); }
  else { S.stage=0; enterStage('frame'); }
  if(S.mode==='assess') setInterval(()=>{ const t=$('#timer'); if(t) t.textContent=fmtTime((S.endT||performance.now())-S.startT); },1000);
}
export function grade(t){ return t>=85?'Distinction':t>=70?'Merit':t>=50?'Pass':'Needs more practice'; }
export function resultText(sc){
  const d=new Date();
  return [`Drone Build Lab · ${MODEL.title} · ${S.mode==='assess'?'Assessment':'Practice'} result`,
    `Student: ${S.name||'(no name)'}`,`Date: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`,`Time taken: ${fmtTime(S.endT-S.startT)}`,
    `Total: ${sc.total}/100 (${grade(sc.total)})`,
    ...Object.keys(SEC).map(k=>`  ${SECNAME[k]}: ${sc[k]}/${SEC[k]}`),
    `Mistakes (${S.mistakes.length}):`,...S.mistakes.map(m=>`  - [${SECNAME[m.sec]}] ${m.msg}`)].join('\n');
}
export function showReport(){
  S.endT=S.endT||performance.now(); const sc=scores(); renderMeta();
  const bars=Object.keys(SEC).map(k=>{ const p=sc[k]/SEC[k]; return `<div class="rbar"><span>${SECNAME[k]}</span><div class="tr"><div class="fl ${p<.5?'low':p<.8?'mid':''}" style="width:${p*100}%"></div></div><span class="v">${sc[k]}/${SEC[k]}</span></div>`; }).join('');
  const ml=S.mistakes.length?`<h3 class="sec">What to review</h3><ul class="mlist">${S.mistakes.map(m=>`<li><small>${SECNAME[m.sec]}</small>${esc(m.msg)}</li>`).join('')}</ul>`:'<p class="note" style="margin-bottom:20px">No mistakes recorded. Clean build.</p>';
  $('#overlay').hidden=false;
  $('#overlay').innerHTML=`<div class="ov" role="dialog" aria-labelledby="repT">
    <div class="eyebrow">${S.mode==='assess'?'Assessment report':'Practice report'} · ${esc(MODEL.title)}</div>
    <h1 id="repT">${esc(S.name||'Build complete')}</h1>
    <div class="rep-top"><div class="total">${sc.total}<small> / 100</small></div><div><div class="grade">${grade(sc.total)}</div><div class="rep-meta">Time ${fmtTime(S.endT-S.startT)} · ${S.mistakes.length} mistake${S.mistakes.length===1?'':'s'}</div></div></div>
    <div class="rbars">${bars}</div>${ml}
    <div class="row"><button class="btn primary" id="repCopy">Copy result</button><button class="btn" id="repExplore">Explore the finished drone</button><button class="btn ghost" id="repAgain">Start again</button></div>
    <textarea id="repText" readonly style="position:absolute;left:-9999px" aria-hidden="true">${esc(resultText(sc))}</textarea></div>`;
  $('#repCopy').onclick=()=>{ const txt=$('#repText').value; const done=()=>toast('Result copied. Paste it into your submission.','ok');
    try{ navigator.clipboard.writeText(txt).then(done,()=>{ $('#repText').select(); document.execCommand('copy'); done(); }); }catch(e){ $('#repText').select(); try{document.execCommand('copy');}catch(_){} done(); } };
  $('#repExplore').onclick=()=>{ $('#overlay').hidden=true; exitStage(stageKey()); S.explore=true; S.labels=true; S.view='parts'; enterStage('explore'); };
  $('#repAgain').onclick=()=>location.reload();
}
