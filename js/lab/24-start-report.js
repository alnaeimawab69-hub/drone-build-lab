/* Drone Build Lab · Start screen and assessment report */
'use strict';
/* ================= Start screen & report ================= */
function showStart(){
  let name=''; try{ name=localStorage.getItem('dbl-name')||''; }catch(e){}
  $('#overlay').hidden=false;
  $('#overlay').innerHTML=`<div class="ov" role="dialog" aria-labelledby="ovT">
    <div class="eyebrow">Digital lab · Drone fundamentals</div>
    <h1 id="ovT">Drone Build Lab</h1>
    <p class="lede">Build a 250 mm quadcopter from zero: assemble the carbon frame screw by screw, mount every component, solder the wiring, test motor direction, fit the propellers, then fly it to see how thrust creates each movement.</p>
    <div class="field"><label for="studentName">Your name</label><input id="studentName" autocomplete="name" value="${esc(name)}" placeholder="Shown on your report"></div>
    <div class="modes">
      <button class="mode learn" data-mode="learn"><em>Guided</em><b>Practice</b><span>Hints show where parts and wires go. “Show me” completes any stage for you.</span></button>
      <button class="mode assess" data-mode="assess"><em>Scored</em><b>Assessment</b><span>No hints, timed. Mistakes cost points. Ends with a report you can copy.</span></button>
      <button class="mode explore" data-mode="explore"><em>Free</em><b>Explore</b><span>Start with the finished drone. Pull it apart, read about each part, fly it.</span></button>
    </div>
    <p class="small">Drag parts with a mouse or finger. Drag empty space to orbit, scroll or pinch to zoom.</p></div>`;
  $('#overlay').querySelectorAll('.mode').forEach(b=>b.onclick=()=>start(b.dataset.mode));
}
function start(mode){
  S.name=($('#studentName').value||'').trim(); try{ localStorage.setItem('dbl-name',S.name); }catch(e){}
  $('#overlay').hidden=true; $('#overlay').innerHTML='';
  S.mode=mode==='explore'?'learn':mode; S.explore=mode==='explore'; S.startT=performance.now();
  if(S.explore){ autoFrame(false); autoMount(false); setFCRot(0,.01); droneRoot.updateMatrixWorld(true); autoWire(false); place(HOTMAP.bat,createPart('battery')); S.test.confirmed=true; autoProps(false); S.labels=true; S.view='parts'; enterStage('explore'); }
  else { S.stage=0; enterStage('frame'); }
  if(S.mode==='assess') setInterval(()=>{ const t=$('#timer'); if(t) t.textContent=fmtTime((S.endT||performance.now())-S.startT); },1000);
}
function grade(t){ return t>=85?'Distinction':t>=70?'Merit':t>=50?'Pass':'Needs more practice'; }
function resultText(sc){
  const d=new Date();
  return [`Drone Build Lab · ${S.mode==='assess'?'Assessment':'Practice'} result`,
    `Student: ${S.name||'(no name)'}`,`Date: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`,`Time taken: ${fmtTime(S.endT-S.startT)}`,
    `Total: ${sc.total}/100 (${grade(sc.total)})`,
    ...Object.keys(SEC).map(k=>`  ${SECNAME[k]}: ${sc[k]}/${SEC[k]}`),
    `Mistakes (${S.mistakes.length}):`,...S.mistakes.map(m=>`  - [${SECNAME[m.sec]}] ${m.msg}`)].join('\n');
}
function showReport(){
  S.endT=S.endT||performance.now(); const sc=scores(); renderMeta();
  const bars=Object.keys(SEC).map(k=>{ const p=sc[k]/SEC[k]; return `<div class="rbar"><span>${SECNAME[k]}</span><div class="tr"><div class="fl ${p<.5?'low':p<.8?'mid':''}" style="width:${p*100}%"></div></div><span class="v">${sc[k]}/${SEC[k]}</span></div>`; }).join('');
  const ml=S.mistakes.length?`<h3 class="sec">What to review</h3><ul class="mlist">${S.mistakes.map(m=>`<li><small>${SECNAME[m.sec]}</small>${esc(m.msg)}</li>`).join('')}</ul>`:'<p class="note" style="margin-bottom:20px">No mistakes recorded. Clean build.</p>';
  $('#overlay').hidden=false;
  $('#overlay').innerHTML=`<div class="ov" role="dialog" aria-labelledby="repT">
    <div class="eyebrow">${S.mode==='assess'?'Assessment report':'Practice report'}</div>
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
