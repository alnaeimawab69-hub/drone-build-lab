/* Drone Build Lab · Fault finding activity: the finished drone comes back with hidden faults; the student inspects it,
   bench-tests the motors with the props off, reports what is wrong, then sees every fault explained and repaired.
   Works for all three models and both motor directions: every fault is described against EXP (the required spin),
   so props in and props out each get their own correct answers. Models 1 and 2 add fastener and wiring faults;
   model 3 (sealed modules) adds module-latch faults instead.
   A drone code (for example 3-K7QX) seeds the faults, so a teacher can give the whole class the same drone.
   This module sits in an import cycle, so its top level only defines data and functions. */
import { CINE, CORNER, EX, EXP, MODEL, PROPS, esc, opp } from './01-config.js';
import { HOTMAP } from './07-catalogue.js';
import { PADS, S, WIRES, parts } from './08-state.js';
import { droneRoot } from './09-scene-content.js';
import { tween } from './11-tweens-camera.js';
import { buildWireMesh, createPart, layout, place, rebuildWires, removeGroup, unplace } from './12-placement.js';
import { SCR, drive } from './13-screws.js';
import { dirActual, setTestSpin, stopAllSpin } from './18-motor-test.js';
import { setExplode, setView } from './20-stages.js';
import { fmtTime, layoutSVG, propsNote, renderPanel } from './21-panel.js';
import { toast } from './23-toast.js';

/* ================= Fault catalogue =================
   per: one fault per motor (the student must also say which motor) · only: which models have it
   label: the line in the findings list (never says where) · find: how to spot it (used for hints)
   why(n): what is wrong, what it would do in flight, and the fix · inject(n) / fix(n,anim) change the drone */
const FPV=!MODEL.sealed;
const PROP_LIFT=EX?2.4:.5;                               // a loose prop sits this far above its motor (drone units)
/* each new drone bumps GEN; a repair animation still running from the last drone then stops instead of undoing a new fault */
let GEN=0;
/* S.fcRot counts quarter turns about +Y, which turn the arrow (printed toward -Z, the front) to the left */
const FC_WAY=['','a quarter turn: its arrow points to the left','half a turn: its arrow points to the back','a quarter turn: its arrow points to the right'];
const fcRotate=(r,dur)=>{
  const p=parts.fc; if(!p) return; const from=p.group.rotation.y, to=from+(((r-S.fcRot)%4+6)%4-2)*Math.PI/2; S.fcRot=r;
  if(!dur){ p.group.rotation.y=r*Math.PI/2; rebuildWires(); return; }
  const g=GEN; tween(dur,k=>{ if(g===GEN) p.group.rotation.y=from+(to-from)*(1-Math.pow(1-k,3)); },()=>{ if(g!==GEN) return; p.group.rotation.y=r*Math.PI/2; rebuildWires(); });
};
/* wires: move the wire that starts at <hot>'s <need> pad onto the pad with net <net> (on the same board as before).
   The pads it came from are kept per fault, so the repair puts every wire back exactly where it was */
const MOVED={};
function retarget(k,hot,need,net){
  const w=WIRES.find(x=>PADS[x.src]&&PADS[x.src].hotId===hot&&PADS[x.src].need===need); if(!w) return;
  const board=PADS[w.tgt].hotId, t=Object.values(PADS).find(p=>!p.need&&p.hotId===board&&p.net===net); if(!t) return;
  (MOVED[k]=MOVED[k]||[]).push([w,w.tgt]); w.tgt=t.id; droneRoot.updateMatrixWorld(true); buildWireMesh(w);
}
function restoreWires(k){ (MOVED[k]||[]).reverse().forEach(([w,tgt])=>{ w.tgt=tgt; }); delete MOVED[k]; droneRoot.updateMatrixWorld(true); WIRES.forEach(buildWireMesh); }
const swapPair=(k,hot,a,b)=>{ retarget(k,hot,a,b); retarget(k,hot,b,a); };
/* a part shifted out of its seat (loose prop, unlatched battery, hanging gimbal), and back */
function unseat(id,dy,rx,rz){ const p=parts[id]; if(!p) return; p.lift.y=dy; p.group.rotation.x=(p.hot.rotX||0)+rx; p.group.rotation.z=rz; layout(p); }
function reseat(id,anim){ const p=parts[id]; if(!p) return; const y0=p.lift.y, rx0=p.group.rotation.x, rz0=p.group.rotation.z, rx1=p.hot.rotX||0;
  const g=GEN, set=k=>{ if(g!==GEN) return; p.lift.y=y0*(1-k); p.group.rotation.x=rx0+(rx1-rx0)*k; p.group.rotation.z=rz0*(1-k); layout(p); };
  anim?tween(.5,set):set(1); }
function swapProp(n,dir,anim){ const id='prop'+n; if(parts[id]) removeGroup(unplace(id)); place(HOTMAP[id],createPart(dir==='CW'?'propCW':'propCCW'),{animate:anim}); }
const motorScrews=n=>Object.values(SCR).filter(s=>s.hotId==='mot'+n);

export const KINDS=[
  {k:'motorDir',per:true,label:'Motor spins the wrong way',
    find:'Take the props off and bench-test each motor. Compare the way it turns with the motor layout.',
    why:n=>`Motor ${n} (${CORNER[n]}) must spin ${EXP[n]} but spins ${opp(EXP[n])}. Its propeller then pushes air up instead of down, so that corner has no lift and the drone flips on take-off. Fix: swap any two of its three phase wires (or reverse it in the ESC settings), then test it again.`,
    inject:n=>{ S.test.swapped[n]=true; }, fix:n=>{ S.test.swapped[n]=false; }},
  {k:'wrongProp',per:true,label:'Wrong propeller (CW / CCW) on a motor',
    find:'Compare each propeller with the motor layout. The blade shape (and the Labels button) tells you if it is a CW or CCW prop.',
    why:n=>`Motor ${n} (${CORNER[n]}) spins ${EXP[n]} but carries a ${opp(EXP[n])} propeller. A mirror-image prop turning the wrong way for its shape pushes air up, so that corner drops and the drone flips on take-off. Fix: fit a ${EXP[n]} propeller.`,
    inject:n=>swapProp(n,opp(EXP[n]),false), fix:(n,anim)=>swapProp(n,EXP[n],anim)},
  {k:'propLoose',per:true,label:'Propeller not tightened down',
    find:'Look at each propeller from the side, at motor height. It should sit flat and square on top of its motor.',
    why:n=>`The propeller on motor ${n} (${CORNER[n]}) is not clamped down: it sits above the motor and is tilted. At full throttle it wobbles, shakes the whole drone and can fly off. Fix: ${EX?'push it fully onto the motor and twist until the quick-release clamp locks':'seat it on the motor shaft and tighten the prop nut'}.`,
    inject:n=>unseat('prop'+n,PROP_LIFT,0,.09), fix:(n,anim)=>reseat('prop'+n,anim)},
  {k:'motorScrews',per:true,only:FPV,label:'Motor screws missing',
    find:'Orbit under the frame and count the screws under each motor: every motor needs four.',
    why:n=>`Two of the four M3 × 6 screws under motor ${n} (${CORNER[n]}) are missing. Vibration loosens the motor, so it twists on the arm or comes off in flight. Fix: fit all four screws, M3 × 6 (a longer screw would reach the windings).`,
    inject:n=>motorScrews(n).filter((s,i)=>i===0||i===3).forEach(s=>{ if(s.mesh&&s.mesh.parent) s.mesh.parent.remove(s.mesh); s.mesh=null; s.driven=false; s.marker.visible=false; }),
    fix:(n,anim)=>motorScrews(n).filter(s=>!s.driven).forEach(s=>{ drive(s.id,anim); s.marker.visible=false; })},
  {k:'fcRot',label:'Flight controller arrow not pointing to the front',
    find:EX?'Use Exploded view to lift the top shell off, then look at the arrow on the flight controller.':'Use Exploded view and Top view to see the arrow printed on the flight controller.',
    why:()=>`The flight controller is turned ${FC_WAY[S.fcRot||1]}. Its sensors now read every tilt in the wrong direction, so it “corrects” the wrong way and the drone flips on take-off. Fix: turn it until the arrow points to the front.`,
    inject:(n,rng)=>fcRotate(1+Math.floor(rng()*3),0), fix:(n,anim)=>fcRotate(0,anim?.6:0)},
  {k:'strap',only:FPV,label:'Battery strap missing',
    find:'Count the straps over the battery. There must be one through each pair of slots.',
    why:()=>'Only one strap holds the battery. It is the heaviest part, so in a hard turn or a crash it swings loose and can rip out the power cable. Fix: fit the second strap through its pair of slots.',
    inject:()=>{ if(parts.strap2) removeGroup(unplace('strap2')); }, fix:(n,anim)=>{ if(!parts.strap2) place(HOTMAP.strap2,createPart('strap'),{animate:anim}); }},
  {k:'capRev',only:FPV,label:'Capacitor wired backwards',
    find:'Open the wiring diagram and follow the two capacitor legs: + to the ESC + pad, the striped − leg to the − pad.',
    why:()=>'The capacitor’s + leg is soldered to the ESC − pad and its − leg to +. An electrolytic capacitor fitted backwards heats up and can burst as soon as the battery is plugged in. Fix: + to +, − to −.',
    inject:()=>swapPair('capRev','cap','VBAT+','VBAT-'), fix:()=>restoreWires('capRev')},
  {k:'gpsX',only:FPV,label:'GPS TX and RX not crossed over',
    find:'Open the wiring diagram and follow the GPS wires. A TX (transmit) wire must land on an R (receive) pad.',
    why:()=>'The GPS TX wire goes to T3 and its RX wire to R3, so two transmit pins talk to each other and nothing listens. The flight controller gets no position: no position hold and no return-to-home. Fix: TX to R3, RX to T3.',
    inject:()=>swapPair('gpsX','gps','R3','T3'), fix:()=>restoreWires('gpsX')},
  {k:'rxX',only:FPV,label:'Receiver TX and RX not crossed over',
    find:'Open the wiring diagram and follow the receiver wires. A TX (transmit) wire must land on an R (receive) pad.',
    why:()=>'The receiver TX wire goes to T1 and its RX wire to R1, so the flight controller never hears the sticks: the drone will not arm or respond to the pilot. Fix: TX to R1, RX to T1.',
    inject:()=>swapPair('rxX','rx','R1','T1'), fix:()=>restoreWires('rxX')},
  {k:'volt',only:FPV,label:'A 5 V part wired to the 9 V pad',
    find:'Open the wiring diagram and check every red power wire: 5 V parts belong on a 5V pad.',
    why:()=>`The ${CINE?'LED strip':'FPV camera'} 5V wire is soldered to the 9V pad. A 5 V part fed 9 V overheats and can burn out${CINE?'':', and the pilot loses the picture'}. Fix: move the wire to the 5V pad.`,
    inject:()=>retarget('volt',CINE?'led':'cam','5V','9V'), fix:()=>restoreWires('volt')},
  {k:'batLatch',only:EX,label:'Smart battery not locked into its bay',
    find:'Look at the two batteries from the side and from behind. Both should sit flat and level in the bay.',
    why:()=>'The right battery is not pushed home, so its connector is only half mated. The drone would take off on one battery with no backup, and vibration can unplug it. Fix: push it down until it clicks and locks.',
    inject:()=>unseat('bat2',3.2,-.12,0), fix:(n,anim)=>reseat('bat2',anim)},
  {k:'gimbal',only:EX,label:'Gimbal camera not locked on its mount',
    find:'Look under the nose. The gimbal camera should sit square and tight against its quick-release mount.',
    why:()=>'The gimbal camera hangs off its quick-release mount. In flight it can drop off, and the loose connector cuts its power and video. Fix: push it up and turn it until the orange button clicks.',
    inject:()=>unseat('gimbal',-1.8,0,.16), fix:(n,anim)=>reseat('gimbal',anim)},
].filter(f=>f.only!==false);
const KIND=Object.fromEntries(KINDS.map(f=>[f.k,f]));
const keyOf=(k,n)=>n?k+':'+n:k;
const nameOf=f=>f.label+(f.n?` · motor ${f.n} (${CORNER[f.n]})`:'');

/* ================= Drone codes and random faults ================= */
function rngOf(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
const MAXF=4, SEEDS=36**4;
export const makeCode=(count,seed)=>`${count}-${seed.toString(36).toUpperCase().padStart(4,'0')}`;
export function parseCode(s){ const m=/^\s*([1-4])\s*-\s*([0-9a-z]{1,4})\s*$/i.exec(s||''); return m?{count:+m[1],seed:parseInt(m[2],36)}:null; }
/* the same code always gives the same faults on the same model; motors are chosen so two faults never share a motor */
export function pickFaults(count,seed){
  const rng=rngOf(seed), kinds=KINDS.slice(), motors=[1,2,3,4];
  const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  shuffle(kinds); shuffle(motors);
  return kinds.slice(0,Math.min(count,kinds.length)).map(f=>({k:f.k,n:f.per?motors.shift():0,label:f.label,rng}));
}

/* ================= Rounds ================= */
export const FT={round:null,rounds:[],count:3,propsOff:false,pending:false};
const now=()=>performance.now();
/* the finished drone with every motor turning the right way, before any fault goes in */
function baseline(){ S.test.reversed=0; [1,2,3,4].forEach(n=>S.test.swapped[n]=false); stopAllSpin(); }
export function newRound(count,seed){
  if(FT.round&&!FT.round.repaired) repairAll(false);
  GEN++; setProps(true); baseline();
  count=Math.max(1,Math.min(MAXF,count||FT.count)); if(seed==null) seed=Math.floor(Math.random()*SEEDS);
  const faults=pickFaults(count,seed);
  faults.forEach(f=>KIND[f.k].inject(f.n,f.rng));
  faults.forEach(f=>{ delete f.rng; f.why=KIND[f.k].why(f.n); });       // fix the text now: it can depend on the injected state
  FT.round={code:makeCode(count,seed),count,faults,picks:new Set(),hints:[],submitted:false,result:null,repaired:false,t0:now(),t1:0};
  renderPanel();
}
export function repairAll(anim){
  const r=FT.round; if(!r) return;
  stopAllSpin(); setProps(true);
  r.faults.forEach(f=>KIND[f.k].fix(f.n,anim));
  r.repaired=true;
}
/* bench test: props come off first, as in the real motor test */
function setProps(on){ FT.propsOff=!on; [1,2,3,4].forEach(n=>{ const p=parts['prop'+n]; if(p) p.group.visible=on; }); if(on) stopAllSpin(); }
export function score(r){
  const real=new Set(r.faults.map(f=>keyOf(f.k,f.n)));
  const found=[...r.picks].filter(k=>real.has(k)), wrong=[...r.picks].filter(k=>!real.has(k));
  const pts=Math.round(Math.max(0,Math.min(100,found.length*100/r.faults.length-wrong.length*15-r.hints.length*10)));
  return {found:found.length,missed:r.faults.length-found.length,wrong,score:pts};
}
function submit(){
  const r=FT.round; if(!r||r.submitted) return;
  if(!r.picks.size){ toast('Mark at least one fault in the list first. If you found nothing, keep looking: there are '+r.count+'.'); return; }
  r.submitted=true; r.t1=now(); r.result=score(r);
  FT.rounds.push({code:r.code,count:r.count,...r.result,hints:r.hints.length,time:r.t1-r.t0,
    faults:r.faults.map(f=>({name:nameOf(f),found:r.picks.has(keyOf(f.k,f.n))})),
    wrongNames:r.result.wrong.map(k=>{ const [kk,n]=k.split(':'); return nameOf({label:KIND[kk].label,n:+n||0}); })});
  stopAllSpin();
  toast(`${r.result.found} of ${r.faults.length} faults found · ${r.result.score} / 100`,r.result.found===r.faults.length&&!r.result.wrong.length?'ok':'info');
  renderPanel();
}
function hint(){
  const r=FT.round; if(!r||r.submitted) return;
  const f=r.faults.find(x=>!r.hints.includes(x.k)&&!r.picks.has(keyOf(x.k,x.n)))||r.faults.find(x=>!r.hints.includes(x.k));
  if(!f){ toast('No more hints for this drone.'); return; }
  r.hints.push(f.k); renderPanel();
}

/* text for the teacher: every round this session, ready to paste into a submission */
export function resultText(){
  const d=new Date();
  return [`Drone Build Lab · ${MODEL.title} · props ${PROPS} · Fault finding result`,
    `Student: ${S.name||'(no name)'}`,`Date: ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`,
    ...FT.rounds.flatMap((r,i)=>[`Drone ${i+1} · code ${r.code} · ${r.score}/100 · found ${r.found} of ${r.count} · false alarms ${r.wrong.length} · hints ${r.hints} · time ${fmtTime(r.time)}`,
      ...r.faults.map(f=>`  ${f.found?'[found] ':'[missed]'} ${f.name}`),...r.wrongNames.map(n=>`  [false alarm] ${n}`)]),
    FT.rounds.length>1?`Average: ${Math.round(FT.rounds.reduce((a,r)=>a+r.score,0)/FT.rounds.length)}/100 over ${FT.rounds.length} drones`:''].filter(Boolean).join('\n');
}
function copyResult(){
  const txt=resultText(), done=()=>toast('Result copied. Paste it into your submission.','ok');
  const fallback=()=>{ const t=document.createElement('textarea'); t.value=txt; t.style.position='fixed'; t.style.left='-9999px'; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); }catch(e){} t.remove(); done(); };
  try{ navigator.clipboard.writeText(txt).then(done,fallback); }catch(e){ fallback(); }
}

/* ================= View lifecycle (called from 20-stages.js) ================= */
/* the first drone waits a few frames: building the finished drone leaves a short flight-controller tween running,
   which would turn an injected flight-controller fault straight back */
export function enterFault(){ S.diagram=false; if(FT.round){ setProps(!FT.propsOff); return; } if(!FT.pending){ FT.pending=true; tween(.08,null,()=>{ FT.pending=false; if(!FT.round) newRound(FT.count); }); } }
export function exitFault(){ stopAllSpin(); setProps(true); setExplode(0); S.diagram=true; }

/* ================= Panel actions (looked up by 20-stages.js) ================= */
export const FT_ACT={
  ftPick(b){ const r=FT.round; if(!r||r.submitted) return; const k=b.dataset.k; r.picks.has(k)?r.picks.delete(k):r.picks.add(k); renderPanel(); },
  ftProps(){ setProps(FT.propsOff); toast(FT.propsOff?'Props off. Safe to bench-test the motors.':'Props refitted.','ok'); renderPanel(); },
  ftSpin(b){ if(!FT.propsOff) return; const n=+b.dataset.m; setTestSpin(n,S.spin[n]===0); renderPanel(); },
  ftSpinAll(){ if(!FT.propsOff) return; const any=[1,2,3,4].some(n=>S.spin[n]!==0); [1,2,3,4].forEach(n=>setTestSpin(n,!any)); renderPanel(); },
  ftHint(){ hint(); },
  ftSubmit(){ submit(); },
  ftRepair(){ repairAll(true); toast('Every fault repaired. The drone is ready to fly.','ok'); renderPanel(); },
  ftNext(){ newRound(FT.count); toast(`New drone: ${FT.round.count} hidden fault${FT.round.count===1?'':'s'}.`,'info'); },
  ftCount(b){ FT.count=+b.dataset.n; renderPanel(); },
  ftCode(){ const el=document.getElementById('ftCode'), c=parseCode(el&&el.value);
    if(!c){ toast('A drone code looks like 3-K7QX: the number of faults, a dash, then up to four letters or digits.','bad'); return; }
    FT.count=c.count; newRound(c.count,c.seed); toast(`Drone ${FT.round.code} loaded.`,'ok'); },
  ftCopy(){ copyResult(); },
  ftFly(){ S.backView='fault'; setView('fly'); },
};

/* ================= Panel ================= */
export function renderFaults(){
  const r=FT.round; if(!r) return {head:'<div class="eyebrow">Fault finding</div><h2>Preparing the drone…</h2>',body:'',foot:''};
  const head=`<div class="eyebrow">Fault finding · ${esc(MODEL.name)} · props ${PROPS}</div><h2>Find the faults</h2>
    <p>This ${esc(MODEL.title)} failed its pre-flight check. <b>${r.count} fault${r.count===1?' is':'s are'}</b> hidden in it. Inspect it like a technician, bench-test the motors, then report every fault you find.</p>`;
  const settings=`<details class="ftset"><summary>Drone code and difficulty</summary>
      <p class="note">This drone: <b class="ftcode">${r.code}</b>. The same code on the same model always gives the same faults, so a class can share one drone.</p>
      <div class="row"><span class="note">Faults on the next drone</span>${[1,2,3,4].map(n=>`<button class="btn sm" data-act="ftCount" data-n="${n}" aria-pressed="${FT.count===n}">${n}</button>`).join('')}</div>
      <div class="row"><input id="ftCode" class="ftin" placeholder="e.g. 3-K7QX" aria-label="Drone code" autocomplete="off" spellcheck="false"><button class="btn sm" data-act="ftCode">Load drone</button></div>
    </details>`;
  if(r.submitted) return renderResult(r,head,settings);
  const off=FT.propsOff;
  const rows=[1,2,3,4].map(n=>{ const sp=S.spin[n]!==0;
    return `<div class="mrow"><span class="mid">M${n}</span><span class="mc">${CORNER[n]}<small>${sp?`turning ${dirActual(n)}`:off?'stopped':'props on: test locked'}</small></span><button class="btn sm" data-act="ftSpin" data-m="${n}" ${off?'':'disabled'}>${sp?'Stop':'Spin'}</button></div>`; }).join('');
  const steps=[
    `<li><b>Look it over.</b> Orbit all the way round${FPV?' and underneath':''}. Use <b>Labels</b>, <b>Exploded view</b> and <b>Top view</b> under the 3D view, and click any part to read what it does.</li>`,
    `<li><b>Check the propellers.</b> Each one must match its motor’s spin and sit flat on the motor.<div class="layout" style="margin-top:10px">${layoutSVG(true)}<p>Required layout, seen from above. ${propsNote()}</p></div></li>`,
    FPV?`<li><b>Check the wiring.</b> Press <b>Wiring diagram</b> under the 3D view and follow every wire to its pad: power, ground, TX to RX.</li>`:'',
    `<li><b>Bench-test the motors.</b> Take the props off first, then spin each motor and watch the arrow over it.
      <div class="row" style="margin-top:10px"><button class="btn sm ${off?'':'primary'}" data-act="ftProps">${off?'Refit the props':'Take the props off'}</button><button class="btn sm" data-act="ftSpinAll" ${off?'':'disabled'}>${[1,2,3,4].some(n=>S.spin[n]!==0)?'Stop all':'Spin all'}</button></div>
      <div class="mtable">${rows}</div></li>`,
  ].join('');
  const list=KINDS.map(f=>{
    const ctl=f.per?`<span class="ftm">${[1,2,3,4].map(n=>{ const k=keyOf(f.k,n), on=r.picks.has(k); return `<button class="btn sm" data-act="ftPick" data-k="${k}" aria-pressed="${on}" title="Motor ${n}, ${CORNER[n]}">M${n}</button>`; }).join('')}</span>`
      :`<span class="ftm"><button class="btn sm" data-act="ftPick" data-k="${f.k}" aria-pressed="${r.picks.has(f.k)}">${r.picks.has(f.k)?'Found':'Mark'}</button></span>`;
    return `<div class="ftrow ${[...r.picks].some(k=>k.split(':')[0]===f.k)?'on':''}"><span>${esc(f.label)}</span>${ctl}</div>`; }).join('');
  const hints=r.hints.map(k=>`<div class="explain"><b>Hint</b><p>${esc(KIND[k].find)}</p></div>`).join('');
  return {head,
    body:`<ol class="tasks">${steps}</ol>
      <div><h3 class="sec">Your findings <span style="float:right;font-family:var(--f-mono);font-weight:400;letter-spacing:0">${r.picks.size} marked</span></h3>
        <p class="note" style="margin-bottom:8px">Mark every fault you find; for a motor fault, press the motor it is on. Each false alarm costs 15 points and each hint 10, so only mark what you have seen.</p>
        <div class="ftlist">${list}</div></div>
      ${hints}${settings}`,
    foot:`<button class="btn ghost" data-act="ftHint" ${r.hints.length>=r.faults.length?'disabled':''}>Hint (−10)</button><button class="btn primary" data-act="ftSubmit" ${r.picks.size?'':'disabled'}>Submit findings →</button>`};
}
function renderResult(r,head,settings){
  const s=r.result, clean=s.found===r.faults.length&&!s.wrong.length;
  const items=r.faults.map(f=>{ const ok=r.picks.has(keyOf(f.k,f.n));
    return `<li class="${ok?'ok':''}"><small>${ok?'✓ Found':'✕ Missed'}</small><b>${esc(nameOf(f))}</b><br>${esc(f.why)}${ok?'':`<br><i>How to spot it: ${esc(KIND[f.k].find)}</i>`}</li>`; }).join('');
  const wrong=s.wrong.map(k=>{ const [kk,n]=k.split(':'); return `<li class="warn"><small>False alarm</small>${esc(nameOf({label:KIND[kk].label,n:+n||0}))}: this was fine on this drone.</li>`; }).join('');
  const hist=FT.rounds.length>1?`<div><h3 class="sec">This session</h3><ul class="checks">${FT.rounds.map((x,i)=>`<li class="${x.score>=70?'ok':''}">Drone ${i+1} · ${x.code}<span class="r">${x.score}/100</span></li>`).join('')}</ul></div>`:'';
  return {head,
    body:`<div class="rep-top" style="margin:0"><div class="total">${s.score}<small> / 100</small></div><div><div class="grade">${clean?'Every fault found':s.found?`${s.found} of ${r.faults.length} found`:'No faults found'}</div>
        <div class="rep-meta">${s.wrong.length} false alarm${s.wrong.length===1?'':'s'} · ${r.hints.length} hint${r.hints.length===1?'':'s'} · ${fmtTime(r.t1-r.t0)}</div></div></div>
      <div><h3 class="sec">The faults on drone ${r.code}</h3><ul class="mlist ftres">${items}${wrong}</ul></div>
      ${r.repaired?'<p class="note">Every fault is repaired. Fly the drone to check it, or take the next one.</p>':'<p class="note">Press <b>Repair the faults</b> to watch each one fixed on the model.</p>'}
      ${hist}
      <div class="row"><button class="btn sm" data-act="ftCopy">Copy result for my teacher</button></div>
      ${settings}`,
    foot:`${r.repaired?'<button class="btn" data-act="ftFly">Fly the repaired drone</button>':'<button class="btn" data-act="ftRepair">Repair the faults</button>'}<button class="btn primary" data-act="ftNext">Next drone →</button>`};
}
