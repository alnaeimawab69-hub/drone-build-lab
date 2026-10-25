/* Drone Build Lab · Motor direction test */
import { EXP, opp } from './01-config.js';
import { S, parts } from './08-state.js';

/* ================= Motor test ================= */
export function dirActual(n){ const flip=(S.test.reversed===n)!==S.test.swapped[n]; return flip?opp(EXP[n]):EXP[n]; }
export function showRing(n,dir,col){ const m=parts['mot'+n]; if(!m) return; const r=m.group.userData.ring; r.visible=!!dir; if(dir){ r.scale.z=dir==='CW'?-1:1; r.userData.mat.color.setHex(col||0xe0894a); } }
export function setTestSpin(n,on){ S.spin[n]=on?(dirActual(n)==='CW'?-1:1)*7:0; const learn=S.mode==='learn'; showRing(n,on?dirActual(n):null,learn?(dirActual(n)===EXP[n]?0x5bc489:0xec6a5e):0xe0894a); }
export function stopAllSpin(){ [1,2,3,4].forEach(n=>{ S.spin[n]=0; showRing(n,null); }); }
