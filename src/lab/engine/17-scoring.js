/* Drone Build Lab · Mistakes and scoring */
import { SEC } from './07-catalogue.js';
import { S } from './08-state.js';
import { stageKey } from './20-stages.js';
import { renderMeta } from './21-panel.js';
import { toast } from './23-toast.js';

/* ================= Scoring ================= */
export function secOf(){ return {frame:'frame',mount:'mount',wire:'wire',power:'test',props:'props'}[stageKey()]||'mount'; }
export function mistake(sec,pts,detail,short){
  S.ded[sec]=(S.ded[sec]||0)+pts;
  S.mistakes.push({sec,msg:detail});
  toast(S.mode==='assess'&&short?short:detail,'bad'); renderMeta();
}
export function scores(){ const o={}; let tot=0; for(const k in SEC){ o[k]=k==='quiz'?(S.quizScore||0):Math.max(0,SEC[k]-(S.ded[k]||0)); tot+=o[k]; } o.total=Math.round(tot); return o; }
