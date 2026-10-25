/* Drone Build Lab · Side panel rendering for every stage, quiz */
'use strict';
/* ================= Panel rendering ================= */
function left(t){ return TYPES[t].count-Object.values(parts).filter(p=>p.type===t).length; }
function tray(keys,desc){ return `<div class="tray">${keys.map(k=>{ const n=left(k); return `<button class="titem" data-type="${k}" data-left="${n}" ${n<=0?'disabled':''} aria-label="Drag ${esc(TYPES[k].name)}">${THUMB[k]?`<img src="${THUMB[k]}" alt="">`:''}<span class="tn">${esc(TYPES[k].name)}</span>${desc&&desc[k]?`<span class="td">${desc[k]}</span>`:''}<span class="tc">×${n}</span></button>`; }).join('')}</div>`; }
function layoutSVG(showDirs){
  const pos={1:[112,112],2:[112,40],3:[40,112],4:[40,40]};
  const arc=(cx,cy,cw)=>{ const r=17; return cw?`M${cx-r},${cy} A${r},${r} 0 1 1 ${cx},${cy+r}`:`M${cx+r},${cy} A${r},${r} 0 1 0 ${cx},${cy+r}`; };
  return `<svg viewBox="0 0 152 160" role="img" aria-label="Motor layout seen from above, front at the top">
  <defs><marker id="ah" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--accent)"/></marker></defs>
  <text x="76" y="10" text-anchor="middle" style="fill:var(--muted);font:600 9px var(--f-mono);letter-spacing:.1em">▲ FRONT</text>
  <path d="M40,40 L112,112 M112,40 L40,112" style="stroke:var(--line-2);stroke-width:6;stroke-linecap:round"/>
  <rect x="64" y="62" width="24" height="28" rx="3" style="fill:var(--panel-3);stroke:var(--dim)"/>
  ${[1,2,3,4].map(n=>{ const [x,y]=pos[n]; return `<circle cx="${x}" cy="${y}" r="11" style="fill:var(--panel-2);stroke:var(--dim)"/><text x="${x}" y="${y+3.5}" text-anchor="middle" style="fill:var(--fg);font:600 9.5px var(--f-mono)">M${n}</text>${showDirs?`<path d="${arc(x,y,EXP[n]==='CW')}" marker-end="url(#ah)" style="fill:none;stroke:var(--accent);stroke-width:2"/><text x="${x}" y="${y+(y<76?-22:31)}" text-anchor="middle" style="fill:var(--muted);font:500 8.5px var(--f-mono)">${EXP[n]}</text>`:''}`; }).join('')}
  </svg>`;
}
function renderAll(){ renderSteps(); renderMeta(); renderPanel(); updateViewbar(); }
function renderSteps(){
  const el=$('#steps'); el.hidden=S.explore;
  el.innerHTML=STAGES.map((s,i)=>`<li class="${i<S.stage?'done':i===S.stage?'cur':''}"${i===S.stage?' aria-current="step"':''}><span class="n">${i<S.stage?'✓':i+1}</span><span class="l">${s.short}</span></li>`).join('');
}
function fmtTime(ms){ const s=Math.floor(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
function renderMeta(){
  const m=S.mode, n=S.mistakes.filter(x=>x.sec!=='quiz').length;
  const chip=S.explore?'<span class="chip explore">Explore</span>':m==='assess'?'<span class="chip assess">Assessment</span>':'<span class="chip learn">Practice</span>';
  const t=m==='assess'&&!S.explore?`<span id="timer">${fmtTime((S.endT||performance.now())-S.startT)}</span>`:'';
  const mm=S.explore?'':`<span class="hide-sm ${n?'bad':''}">${n} mistake${n===1?'':'s'}</span>`;
  $('#meta').innerHTML=chip+t+mm;
}
function updateViewbar(){ const k=stageKey(); $('#btnDiag').hidden=k!=='wire'; $('#btnDiag').textContent=S.diagram?'3D view':'Wiring diagram'; $('#btnCad').hidden=k==='wire'&&S.diagram; $('#explodeWrap').hidden=!(k==='explore'||k==='quiz'); $('#btnLabels').setAttribute('aria-pressed',S.labels); }

function renderPanel(){
  if(S.drag){ S.dirty=true; return; }
  const k=stageKey(), learn=S.mode==='learn', panel=$('#panel');
  const keepScroll=panel.querySelector('.p-body')?.scrollTop||0;
  let head='', body='', foot='';
  if(k==='explore'){
    head=`<div class="eyebrow">Explore</div><h2>The finished quadcopter</h2><p>Every part is fitted and wired. Click a part, or a name in the list, to see what it does and how it connects.</p>`;
    const seen=new Set(); const items=Object.values(parts).filter(p=>!seen.has(p.type)&&seen.add(p.type)).map(p=>[p.hot.id,TYPES[p.type].count>1?`${TYPES[p.type].name} (×${TYPES[p.type].count})`:TYPES[p.type].name]);
    body=`<div><h3 class="sec">Parts</h3><div class="row">${items.map(([id,nm])=>`<button class="btn sm" data-act="focus" data-h="${id}">${esc(nm)}</button>`).join('')}</div></div>
      <div><h3 class="sec">Motor layout</h3><div class="layout">${layoutSVG(true)}<p>Diagonal motors spin the same way. Two spin clockwise and two counter-clockwise, so their twisting forces cancel out in a hover.</p></div></div>
      <p class="note">Use <b>Exploded view</b> under the 3D view to pull the parts apart, and <b>Labels</b> to name every part.</p>`;
    foot=`<button class="btn primary" data-act="exploreFly">Fly it: flight physics</button>`;
  } else {
    const st=STAGES[S.stage];
    head=`<div class="eyebrow">Stage ${S.stage+1} of ${STAGES.length}</div><h2>${st.title}</h2><p>${st.goal}</p>`;
    if(k==='frame') body=renderFrame(learn);
    if(k==='mount') body=renderMount(learn);
    if(k==='wire') body=renderWire(learn);
    if(k==='power') body=renderPower(learn);
    if(k==='props') body=renderProps(learn);
    if(k==='fly') body=renderFly(learn);
    if(k==='quiz') body=renderQuiz();
    const labels={frame:'Next: components',mount:'Next: wiring',wire:'Next: power-up',power:'Next: propellers',props:'Next: flight',fly:'Next: knowledge check',quiz:'See my report'};
    foot=`${learn&&k!=='quiz'?`<button class="btn ghost" data-act="show">${k==='fly'?'Play demo':'Show me'}</button>`:''}<button class="btn primary" data-act="next" ${ready(k)?'':'disabled'}>${labels[k]} →</button>`;
  }
  if(S.explore&&k==='fly'){ head=`<div class="eyebrow">Explore</div><h2>Flight physics</h2><p>Fly the finished drone and watch how motor speeds create every movement.</p>`; body=renderFly(true); foot=`<button class="btn ghost" data-act="exploreBack">← Back to parts</button><button class="btn primary" data-act="tour">Play demo</button>`; }
  panel.innerHTML=`<div class="p-head">${head}</div><div class="p-body">${body}</div><div class="p-foot">${foot}</div>`;
  panel.querySelector('.p-body').scrollTop=keepScroll;
  if(k==='fly') updateHud();
  renderDiagram();
  renderSteps(); renderMeta();
}
function screwBin(k,learn){
  return `<div class="tray">${Object.keys(SCREWT).map(t=>{ const n=stageScrews(k).filter(s=>!s.driven&&s.spec.kind===t).length;
    return `<button class="titem sitem ${S.loaded===t?'on':''}" data-screw="${t}" aria-pressed="${S.loaded===t}">${THUMB[t]?`<img src="${THUMB[t]}" alt="">`:''}<span class="tn">${SCREWT[t].name}</span>${learn?`<span class="tc">${n} needed</span>`:''}</button>`; }).join('')}</div>`;
}
function screwCount(k,owner){ const l=stageScrews(k).filter(s=>HOTMAP[s.hotId].type===owner); return [l.filter(s=>s.driven).length,(SCREW_SPEC[owner]||[]).length*HOT.filter(h=>h.type===owner).length]; }
function renderFrame(learn){
  const keys=['plateB','arm','nylSt','aluSt','camPlate','tplate'];
  const placed=HOT.filter(h=>h.stage==='frame'&&parts[h.id]).length, total=HOT.filter(h=>h.stage==='frame').length;
  const sd=stageScrews('frame').filter(s=>s.driven).length;
  const line=(l,[d,t])=>`<li class="${d===t?'ok':''}">${l}<span class="r">${d}/${t}</span></li>`;
  const checks=learn?`<div><h3 class="sec">Checklist</h3><ul class="checks">${keys.map(t=>{ const c=TYPES[t].count, d=c-left(t); return `<li class="${d===c?'ok':''}">${TYPES[t].name}<span class="r">${d}/${c}</span></li>`; }).join('')}
    ${line('Arm screws, M3 × 10',screwCount('frame','arm'))}${line('Top plate screws, M3 × 6',screwCount('frame','tplate'))}</ul></div>`:'';
  return `<div><h3 class="sec">Frame parts <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${placed}/${total} fitted</span></h3>${tray(keys)}</div>
    <div><h3 class="sec">Fastener bin <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${sd} tight</span></h3>${screwBin('frame',learn)}</div>
    ${checks}
    <p class="note">Start with the <b>bottom plate</b>; everything else attaches to it. To fasten a part, pick a screw from the bin, then click a small ring on the part, or drag the screw onto it. ${learn?'Rings that take the screw you hold turn <b>green</b>.':'Assessment: a wrong screw size costs points.'}</p>`;
}
function renderMount(learn){
  const keys=['motor','esc','fc','camera','vtx','rx','gps','cap','lead'];
  const placed=HOT.filter(h=>h.stage==='mount'&&parts[h.id]).length, total=HOT.filter(h=>h.stage==='mount').length;
  let checks='';
  if(learn){
    checks=`<div><h3 class="sec">Checklist</h3><ul class="checks">${keys.map(t=>{ const c=TYPES[t].count, d=c-left(t); return `<li class="${d===c?'ok':''}">${TYPES[t].name}<span class="r">${d}/${c}</span></li>`; }).join('')}
      <li class="${parts.fc&&S.fcRot===0?'ok':parts.fc?'warn':''}">Flight controller arrow points to the front</li>
      ${[['Motor screws, M3 × 6','motor'],['Stack nuts, M3 nylon','fc'],['Camera screws, M2 × 5','camera']].map(([l,o])=>{ const [d,t]=screwCount('mount',o); return `<li class="${d===t?'ok':''}">${l}<span class="r">${d}/${t}</span></li>`; }).join('')}</ul></div>`;
  }
  return `<div><h3 class="sec">Parts tray <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${placed}/${total} fitted</span></h3>${tray(keys)}</div>
    <div><h3 class="sec">Fastener bin</h3>${screwBin('mount',learn)}</div>
    ${checks}
    <p class="note">Motor screws go in from <b>under the arm</b>: orbit below the frame to watch them. ${learn?'While you hold a part, <b>green rings</b> show where it can go. ':'Assessment: no hints. Each wrong placement or screw costs points. '}Drag a fitted part to take it off again. <b>Click the flight controller</b> to rotate it 90°. The ESC must be in place before the flight controller.</p>`;
}
const WGROUPS=[['lead','Battery lead'],['cap','Capacitor'],['motors','Motors'],['esc','ESC harness'],['rx','Radio receiver'],['gps','GPS module'],['cam','FPV camera'],['vtx','Video transmitter']];
function renderWire(learn){
  const all=srcPads(); const done=all.filter(p=>p.wired).length;
  const groups=WGROUPS.map(([g,nm])=>{
    const list=all.filter(p=>g==='motors'?p.hotId.startsWith('mot'):p.hotId===g).sort((a,b)=>a.id<b.id?-1:1);
    const d=list.filter(p=>p.wired).length;
    const rows=list.map(p=>`<div class="wrow ${p.wired?'ok':''}"><span class="dot" style="background:${hex(wireColor(p.need,p.label))}"></span><span>${esc(p.label)}${g==='motors'?` · ${CORNER[+p.hotId.slice(3)]}`:''} → ${learn?esc(NETSHORT[p.need]):'?'}</span><span class="st">${p.wired?'soldered':''}</span></div>`).join('');
    return `<div class="wgroup"><header class="${d===list.length?'done':''}">${nm}<span class="r">${d}/${list.length}</span></header><div class="wrows">${rows}</div></div>`;
  }).join('');
  return `<p class="note"><b>${done} of ${all.length}</b> wires soldered. Drag each coloured wire end on the <b>wiring diagram</b> onto its pad. A wrong pad shows <b style="color:var(--bad)">✕ WRONG</b> and the wire is not soldered. Switch to <b>3D view</b> (button under the diagram) to wire on the model instead; both stay in sync.</p>
    <div class="legend"><span><i style="background:#d8453b"></i>Power</span><span><i style="background:#2b2f35;outline:1px solid #556"></i>Ground</span><span><i style="background:#e8c33c"></i>Video</span><span><i style="background:#3d9be0"></i>TX</span><span><i style="background:#eee"></i>RX</span><span><i style="background:#8a939c"></i>Motor phases</span></div>
    ${groups}
    <p class="note">${learn?'When you pick up a wire, the matching pads turn <b>green</b>. Serial wires cross over: TX goes to R, RX goes to T.':'Assessment: no hints. A wrong connection costs points and is not soldered.'}</p>`;
}
function renderPower(learn){
  const t=S.test, bat=!!parts.bat, can=t.safety&&!t.confirmed;
  const rows=[1,2,3,4].map(n=>{ const sp=S.spin[n]!==0, a=dirActual(n);
    const seen=sp&&learn?`<small class="${a===EXP[n]?'okc':'badc'}">turning ${a}${a===EXP[n]?'':' · wrong way'}</small>`:learn?`<small>should turn ${EXP[n]}</small>`:'';
    return `<div class="mrow"><span class="mid">M${n}</span><span class="mc">${CORNER[n]}${seen}</span><button class="btn sm" data-act="spin" data-m="${n}" ${can?'':'disabled'}>${sp?'Stop':'Spin'}</button><button class="btn sm ghost" data-act="swap" data-m="${n}" ${can?'':'disabled'}>Swap 2 wires</button></div>`; }).join('');
  return `<ol class="tasks">
    <li class="${bat?'ok':''}"><b>Fit the battery.</b> Drag it onto the top plate. Its cable plugs into the battery lead at the rear.${bat?'':tray(['battery'])}</li>
    <li class="${t.safety?'ok':''} ${bat?'':'locked'}"><label class="check"><input type="checkbox" id="safeChk" ${t.safety?'checked':''} ${bat&&!t.confirmed?'':'disabled'}><span><b>Safety check.</b> The propellers are off. Never power-test motors with props fitted.</span></label></li>
    <li class="${t.confirmed?'ok':''} ${t.safety?'':'locked'}"><b>Test each motor.</b> Spin it and watch the arrow over the motor. If it turns the wrong way, swap two of its three wires.
      <div class="mtable">${rows}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-act="spinAll" ${can?'':'disabled'}>${[1,2,3,4].some(n=>S.spin[n]!==0)?'Stop all':'Spin all'}</button><button class="btn sm primary" data-act="confirm" ${can?'':'disabled'}>Directions are correct</button></div>
    </li></ol>
    <div class="layout">${layoutSVG(true)}<p>Required layout, seen from above. Diagonal pairs turn the same way, so the two pairs’ twisting forces cancel.</p></div>`;
}
function renderProps(learn){
  return `<div><h3 class="sec">Propellers</h3>${tray(['propCW','propCCW'],{propCW:'turns clockwise',propCCW:'turns counter-clockwise'})}</div>
    ${learn?`<div class="layout">${layoutSVG(true)}<p>Match each prop to its motor. A CW prop on a CW motor pushes air down; on the wrong motor it pushes air up.</p></div>`:'<p class="note">Assessment: use the motor directions you confirmed in the test. Each wrong propeller costs points.</p>'}
    <p class="note">The two props are mirror images. Look at the blade shape: the raised leading edge cuts into the air first.</p>`;
}
function renderFly(learn){
  const f=FL, cur=f.cur&&MANS[f.cur]?MANS[f.cur]:{t:'Ready on the mat',d:'Press Take off. Then try each movement and watch the thrust arrows and motor bars.',dof:null};
  const B=(m,l,dis)=>`<button class="btn" data-act="man" data-m="${m}" ${dis?'disabled':''}>${l}</button>`;
  const air=airborne();
  const dofRows=[['heave','Heave','Up and down','All four motors together'],['surge','Surge','Forward and back','Pitch first, then tilted thrust'],['sway','Sway','Left and right','Roll first, then tilted thrust'],['roll','Roll','Bank left/right','Left pair vs right pair'],['pitch','Pitch','Nose up/down','Front pair vs rear pair'],['yaw','Yaw','Turn left/right','CW pair vs CCW pair']];
  const on=cur.dof, onSet=new Set(on==='pitch'?['pitch','surge']:on==='roll'?['roll','sway']:[on]);
  const checks=S.explore?'':`<ul class="checks">${[['hover','Take off and hover'],['pitch','Pitch'],['roll','Roll'],['yaw','Yaw']].map(([k,l])=>`<li class="${S.flown[k]?'ok':''}">${l}</li>`).join('')}</ul>`;
  return `<div class="mgrid">
      ${B('arm',f.armed?'Disarm':'Arm',air)}${B('takeoff','Take off',air)}${B('land','Land',!air)}
      ${B('pitchF','Pitch fwd',!air)}${B('rollL','Roll left',!air)}${B('yawL','Yaw left',!air)}
      ${B('pitchB','Pitch back',!air)}${B('rollR','Roll right',!air)}${B('yawR','Yaw right',!air)}
      ${B('climb','Climb',!air)}${B('descend','Descend',!air)}<button class="btn ghost" data-act="tour">Demo</button>
    </div>
    <div class="explain"><b>${cur.t}</b><p>${cur.d}</p></div>
    <div class="hud"><div><small>Thrust ÷ weight</small><span id="hudTW">0.00</span></div><div><small>Roll</small><span id="hudR">0°</span></div><div><small>Pitch</small><span id="hudP">0°</span></div><div><small>Heading</small><span id="hudY">0°</span></div></div>
    <div class="bars">${[1,2,3,4].map(n=>`<div class="bar"><span>M${n} ${({1:'RR',2:'FR',3:'RL',4:'FL'})[n]} · ${EXP[n]}</span><div class="tr"><div class="fl ${EXP[n]==='CCW'?'ccw':''}" id="mb${n}"></div></div><span class="v" id="mv${n}">0%</span></div>`).join('')}</div>
    <div class="toggles"><label><input type="checkbox" id="chkForces" ${S.forces?'checked':''}> Force arrows</label><label><input type="checkbox" id="chkAir" ${S.air?'checked':''}> Airflow</label></div>
    <div><h3 class="sec">Six degrees of freedom</h3><table class="dof">${dofRows.map(([k,n,w,h])=>`<tr class="${onSet.has(k)?'on':''}"><td>${n}</td><td>${w}</td><td>${h}</td></tr>`).join('')}</table></div>
    ${checks}`;
}
const QUIZ=[
  {q:'The arrow printed on the flight controller must point…',o:['Toward the battery strap','Toward the front of the frame','Toward motor 1','It does not matter'],a:1,why:'The board’s gyro and accelerometer define which way is forward. If the arrow points elsewhere, the controller corrects tilt in the wrong direction and the drone flips on take-off.'},
  {q:'The GPS module’s TX wire is soldered to…',o:['The FC’s T3 pad','The FC’s 5V pad','The FC’s R3 pad','The ESC harness'],a:2,why:'Serial lines cross over: what one side transmits (TX), the other side must receive (RX).'},
  {q:'During the motor test one motor spins the wrong way. The hardware fix is to…',o:['Swap any two of its three wires','Swap all three wires around','Fit the opposite propeller','Reverse the battery plug'],a:0,why:'A brushless motor’s direction depends on the order of its three phases. Exchanging any two of them reverses it.'},
  {q:'The capacitor across the ESC battery pads is there to…',o:['Extend the flight time','Convert 16 V down to 5 V','Absorb voltage spikes and electrical noise','Measure battery current'],a:2,why:'Fast motor switching creates voltage spikes on the battery lines. The capacitor absorbs them, protecting the ESC and cleaning up the video.'},
  {q:'To turn the nose to the right (clockwise seen from above), the controller…',o:['Speeds up the front motors','Speeds up the counter-clockwise motors (M2, M3)','Speeds up the clockwise motors (M1, M4)','Tilts the whole drone right'],a:1,why:'Each prop twists the frame opposite to its spin. Faster counter-clockwise props twist the frame clockwise, so the nose turns right while total lift stays the same.'},
  {q:'To fly forward, which motors speed up?',o:['The rear motors','The front motors','The left motors','All four equally'],a:0,why:'Faster rear motors lift the tail, the nose dips, and the tilted thrust pushes the drone forward.'},
  {q:'Why are the motor screws kept short (M3 × 6)?',o:['Short screws are lighter','A long screw can reach the motor windings and short the motor','Long screws strip the carbon arm','Short screws are easier to buy'],a:1,why:'The mounting holes go straight into the motor base, just below the copper windings. A screw that is too long scrapes the enamel and shorts the motor.'},
  {q:'Why are the propellers fitted last?',o:['They are the lightest part','So the motors can be powered and tested without spinning blades','They balance the battery','The ESC needs them to start'],a:1,why:'A spinning prop can cause serious cuts. Motor direction is always checked with the props off.'},
];
function renderQuiz(){
  const d=S.quizDone;
  return QUIZ.map((q,i)=>`<fieldset class="q ${d?'done':''}"><legend>${i+1}. ${esc(q.q)}</legend>${q.o.map((o,j)=>`<label class="opt ${d&&j===q.a?'correct':''} ${d&&S.quizAns[i]===j&&j!==q.a?'picked-wrong':''}"><input type="radio" name="q${i}" id="q${i}_${j}" value="${j}" ${S.quizAns[i]===j?'checked':''} ${d?'disabled':''}><span>${esc(o)}</span></label>`).join('')}${d?`<p class="why">${esc(q.why)}</p>`:''}</fieldset>`).join('')
    +(d?`<p class="note"><b>${S.quizScore} / ${SEC.quiz}</b> points for this section.</p>`:`<button class="btn primary" data-act="quizSubmit">Submit answers</button>`);
}
