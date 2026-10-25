/* Drone Build Lab · Mistakes and scoring */
'use strict';
/* ================= Scoring ================= */
function secOf(){ return {frame:'frame',mount:'mount',wire:'wire',power:'test',props:'props'}[stageKey()]||'mount'; }
function mistake(sec,pts,detail,short){
  S.ded[sec]=(S.ded[sec]||0)+pts;
  S.mistakes.push({sec,msg:detail});
  toast(S.mode==='assess'&&short?short:detail,'bad'); renderMeta();
}
function scores(){ const o={}; let tot=0; for(const k in SEC){ o[k]=k==='quiz'?(S.quizScore||0):Math.max(0,SEC[k]-(S.ded[k]||0)); tot+=o[k]; } o.total=Math.round(tot); return o; }
