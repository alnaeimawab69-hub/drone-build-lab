/* Drone Build Lab · View bar buttons */
import { $, V } from './01-config.js';
import { controls } from './02-scene.js';
import { S } from './08-state.js';
import { droneRoot, setStyle } from './09-scene-content.js';
import { CAM, camTo } from './11-tweens-camera.js';
import { renderDiagram } from './16-wiring-diagram.js';
import { setExplode, stageKey } from './20-stages.js';
import { updateViewbar } from './21-panel.js';

/* ================= View bar ================= */
$('#btnLabels').onclick=()=>{ S.labels=!S.labels; updateViewbar(); };
$('#btnCad').onclick=()=>setStyle(!S.cad);
$('#btnDiag').onclick=()=>{ S.diagram=!S.diagram; renderDiagram(); };
$('#explodeR').oninput=e=>setExplode(e.target.value/100);
$('#btnTop').onclick=()=>{ const t=controls.target.clone(); camTo(t.clone().add(V(0,32,.01)),t,.9); };
$('#btnReset').onclick=()=>{ const c=CAM[stageKey()]||CAM.mount; const off=droneRoot.position; camTo(c[0].clone().add(off),c[1].clone().add(off),.9); };
