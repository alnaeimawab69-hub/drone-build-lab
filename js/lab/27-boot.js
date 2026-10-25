/* Drone Build Lab · Start-up */
'use strict';
/* ================= Boot ================= */
(async function init(){
  try{ await Promise.race([Promise.all(['600 30px "IBM Plex Mono"','700 40px "Barlow Semi Condensed"','500 20px "IBM Plex Mono"'].map(f=>document.fonts.load(f))),new Promise(r=>setTimeout(r,2500))]); }catch(e){}
  rebuildTextures();
  resize();
  makeThumbs();
  renderAll();
  showStart();
  requestAnimationFrame(loop);
})();
/* the board textures were drawn before the web fonts loaded; redraw them once fonts are ready */
function rebuildTextures(){
  const redo=(tex,fresh)=>{ tex.image=fresh.image; tex.needsUpdate=true; };
  redo(escTex,pcbTex(4,'#0e2b26',(g,w,P)=>{
    g.font='600 34px "IBM Plex Mono", monospace';
    [['M1',1.5,.85],['M2',1.5,-.85],['M3',-1.5,.85],['M4',-1.5,-.85]].forEach(([t,x,z])=>g.fillText(t,P(x),P(z)));
    g.font='700 40px "IBM Plex Mono", monospace'; g.fillText('+',P(1.0),P(1.38)); g.fillText('−',P(.35),P(1.38));
    g.font='600 26px "IBM Plex Mono", monospace'; g.fillText('ESC 4-IN-1',P(0),P(.05)); g.fillText('30.5 × 30.5',P(0),P(.4));
    g.beginPath(); g.moveTo(P(0),P(-1.9)); g.lineTo(P(.18),P(-1.62)); g.lineTo(P(-.18),P(-1.62)); g.closePath(); g.fill();
  }));
  redo(fcTex,pcbTex(3.6,'#0f1a2e',(g,w,P)=>{
    g.beginPath(); g.moveTo(P(0),P(-1.28)); g.lineTo(P(.46),P(-.62)); g.lineTo(P(.15),P(-.62)); g.lineTo(P(.15),P(.06)); g.lineTo(P(-.15),P(.06)); g.lineTo(P(-.15),P(-.62)); g.lineTo(P(-.46),P(-.62)); g.closePath(); g.fill();
    g.font='600 30px "IBM Plex Mono", monospace'; g.fillText('FRONT',P(0),P(.3));
    g.font='500 20px "IBM Plex Mono", monospace'; g.fillStyle='rgba(238,242,240,.6)';
    g.fillText('UART1',P(-.4),P(1.25)); g.fillText('UART3',P(-1.15),P(.4)); g.fillText('VIDEO',P(1.15),P(-.25));
  }));
  redo(vtxTex,smallPcb('VTX','#1b1730')); redo(rxTex,smallPcb('RX','#16262a'));
  redo(batTex,ctex(768,288,(g,w,h)=>{ g.fillStyle='#22262b'; g.fillRect(0,0,w,h); g.fillStyle='#c4632d'; g.fillRect(0,h*.72,w,h*.08); g.fillStyle='#e9edef'; g.font='700 96px "Barlow Semi Condensed", sans-serif'; g.fillText('4S LiPo',40,h*.42); g.font='500 44px "IBM Plex Mono", monospace'; g.fillStyle='#aab6bb'; g.fillText('14.8 V · 1300 mAh',42,h*.62); }));
  redo(gpsTex,ctex(256,256,(g,w)=>{ g.fillStyle='#d9cfb6'; g.fillRect(0,0,w,w); g.fillStyle='#b9ad92'; g.fillRect(w*.38,w*.38,w*.24,w*.24); g.fillStyle='#3b3a36'; g.beginPath(); g.moveTo(w/2,w*.08); g.lineTo(w*.62,w*.26); g.lineTo(w*.38,w*.26); g.closePath(); g.fill(); g.font='600 26px "IBM Plex Mono", monospace'; g.textAlign='center'; g.fillText('GPS',w/2,w*.86); }));
  redo(frontTex,ctex(512,192,(g,w)=>{ g.fillStyle='rgba(224,137,74,.85)'; g.beginPath(); g.moveTo(w/2,8); g.lineTo(w/2+46,74); g.lineTo(w/2+16,74); g.lineTo(w/2+16,110); g.lineTo(w/2-16,110); g.lineTo(w/2-16,74); g.lineTo(w/2-46,74); g.closePath(); g.fill(); g.font='700 56px "Barlow Semi Condensed", sans-serif'; g.textAlign='center'; g.fillText('FRONT',w/2,170); }));
}
