/* Drone Build Lab · Canvas-drawn textures: carbon weave, mat grid, circuit boards, labels */
import * as THREE from 'three';
import { CINE, TAU } from './01-config.js';

/* ================= Textures ================= */
export function ctex(w,h,draw,rep){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); draw(g,w,h);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8;
  if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); }
  return t;
}
export const weaveTex=ctex(128,128,(g,w,h)=>{
  g.fillStyle='#1a1d21'; g.fillRect(0,0,w,h);
  const s=16;
  for(let y=0;y<h;y+=s) for(let x=0;x<w;x+=s){
    const odd=((x+y)/s)%2;
    const gr=odd?g.createLinearGradient(x,y,x+s,y):g.createLinearGradient(x,y,x,y+s);
    gr.addColorStop(0,'#202429'); gr.addColorStop(.5,'#3b4148'); gr.addColorStop(1,'#1e2226');
    g.fillStyle=gr; g.fillRect(x+1,y+1,s-2,s-2);
  }
},[.6,.6]);
export const matTex=ctex(256,256,(g,w,h)=>{
  g.fillStyle='#2a3b3e'; g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(190,225,220,.09)'; g.lineWidth=1;
  for(let i=1;i<5;i++){const p=i*w/5; g.beginPath(); g.moveTo(p,0); g.lineTo(p,h); g.moveTo(0,p); g.lineTo(w,p); g.stroke();}
  g.strokeStyle='rgba(190,225,220,.2)'; g.lineWidth=2; g.strokeRect(0,0,w,h);
},[24,24]);
export function pcbTex(size,base,draw){
  return ctex(512,512,(g,w)=>{
    g.fillStyle=base; g.fillRect(0,0,w,w);
    let s=11; const rnd=()=>{s=(s*9301+49297)%233280; return s/233280;};
    g.strokeStyle='rgba(150,220,190,.09)'; g.lineWidth=3;
    for(let i=0;i<46;i++){ let x=rnd()*w,y=rnd()*w; g.beginPath(); g.moveTo(x,y); for(let j=0;j<3;j++){ if(rnd()<.5) x+=(rnd()-.5)*220; else y+=(rnd()-.5)*220; g.lineTo(x,y);} g.stroke(); }
    const P=v=>(v/size+.5)*w;
    g.strokeStyle='rgba(235,240,235,.55)'; g.lineWidth=4;
    if(size>3) for(const a of [-1.525,1.525]) for(const b of [-1.525,1.525]){ g.beginPath(); g.arc(P(a),P(b),w*.2/size,0,TAU); g.stroke(); }
    g.fillStyle='rgba(238,242,240,.88)'; g.textAlign='center'; g.textBaseline='middle';
    draw&&draw(g,w,P);
  });
}
/* each label texture has a maker, so 27-boot.js can redraw it once the web fonts have loaded */
export const TEX_MAKE={
  esc:()=>pcbTex(4,'#0e2b26',(g,w,P)=>{
    g.font='600 34px "IBM Plex Mono", monospace';
    [['M1',1.5,.85],['M2',1.5,-.85],['M3',-1.5,.85],['M4',-1.5,-.85]].forEach(([t,x,z])=>g.fillText(t,P(x),P(z)));
    g.font='700 40px "IBM Plex Mono", monospace'; g.fillText('+',P(1.0),P(1.38)); g.fillText('−',P(.35),P(1.38));
    g.font='600 26px "IBM Plex Mono", monospace'; g.fillText('ESC 4-IN-1',P(0),P(.05)); g.fillText(CINE?'55 A · 3–6S':'30.5 × 30.5',P(0),P(.4));
    g.beginPath(); g.moveTo(P(0),P(-1.9)); g.lineTo(P(.18),P(-1.62)); g.lineTo(P(-.18),P(-1.62)); g.closePath(); g.fill();
  }),
  fc:()=>pcbTex(3.6,'#0f1a2e',(g,w,P)=>{
    g.beginPath();
    g.moveTo(P(0),P(-1.28)); g.lineTo(P(.46),P(-.62)); g.lineTo(P(.15),P(-.62)); g.lineTo(P(.15),P(.06));
    g.lineTo(P(-.15),P(.06)); g.lineTo(P(-.15),P(-.62)); g.lineTo(P(-.46),P(-.62)); g.closePath(); g.fill();
    g.font='600 30px "IBM Plex Mono", monospace'; g.fillText('FRONT',P(0),P(.3));
    g.font='500 20px "IBM Plex Mono", monospace'; g.fillStyle='rgba(238,242,240,.6)';
    g.fillText('UART1',P(-.4),P(1.25)); g.fillText('UART3',P(-1.15),P(.4)); g.fillText(CINE?'UART2':'VIDEO',P(1.15),P(-.25));
    if(CINE) g.fillText('LED',P(.55),P(-1.25));
  }),
  vtx:()=>smallPcb(CINE?'HD':'VTX','#1b1730'),
  rx:()=>smallPcb('RX','#16262a'),
  /* ceramic patch antenna seen from above: silver radiating element, feed pin, and the arrow that must point to the front */
  gps:()=>ctex(256,256,(g,w)=>{ g.fillStyle='#d8cdb0'; g.fillRect(0,0,w,w);
    const e=g.createLinearGradient(0,w*.2,0,w*.8); e.addColorStop(0,'#e3e6e8'); e.addColorStop(1,'#a9afb4'); g.fillStyle=e; g.fillRect(w*.2,w*.2,w*.6,w*.6);
    g.fillStyle='#7d838a'; g.beginPath(); g.arc(w*.62,w*.62,w*.05,0,TAU); g.fill();
    g.fillStyle='#2b2a27'; g.beginPath(); g.moveTo(w/2,w*.03); g.lineTo(w*.6,w*.16); g.lineTo(w*.4,w*.16); g.closePath(); g.fill();
    g.font='600 22px "IBM Plex Mono", monospace'; g.textAlign='center'; g.fillText('GPS · COMPASS',w/2,w*.93); }),
  /* model 3: smart flight battery label */
  exbat:()=>ctex(512,256,(g,w,h)=>{ g.fillStyle='#d9dcdf'; g.fillRect(0,0,w,h);
    g.fillStyle='#2a2e33'; g.font='700 54px "Barlow Semi Condensed", sans-serif'; g.fillText('SMART BATTERY',28,70);
    g.font='500 30px "IBM Plex Mono", monospace'; g.fillStyle='#4b535a'; g.fillText('12S · 52.8 V · 5935 mAh',30,118);
    g.fillStyle='#e0894a'; g.fillRect(0,h*.82,w,h*.06); }),
  bat:()=>ctex(768,288,(g,w,h)=>{
    g.fillStyle='#22262b'; g.fillRect(0,0,w,h);
    g.fillStyle=CINE?'#3d8fb8':'#c4632d'; g.fillRect(0,h*.72,w,h*.08);
    g.fillStyle='#e9edef'; g.font='700 96px "Barlow Semi Condensed", sans-serif'; g.textBaseline='alphabetic'; g.fillText(CINE?'6S LiPo':'4S LiPo',40,h*.42);
    g.font='500 44px "IBM Plex Mono", monospace'; g.fillStyle='#aab6bb'; g.fillText(CINE?'22.2 V · 1100 mAh':'14.8 V · 1300 mAh',42,h*.62);
  }),
  front:()=>ctex(512,192,(g,w,h)=>{ g.fillStyle='rgba(224,137,74,.85)'; g.beginPath(); g.moveTo(w/2,8); g.lineTo(w/2+46,74); g.lineTo(w/2+16,74); g.lineTo(w/2+16,110); g.lineTo(w/2-16,110); g.lineTo(w/2-16,74); g.lineTo(w/2-46,74); g.closePath(); g.fill(); g.font='700 56px "Barlow Semi Condensed", sans-serif'; g.textAlign='center'; g.fillText('FRONT',w/2,170); }),
};
export const smallPcb=(label,col)=>ctex(256,256,(g,w)=>{ g.fillStyle=col; g.fillRect(0,0,w,w); g.strokeStyle='rgba(150,220,190,.1)'; g.lineWidth=3; for(let i=0;i<10;i++){g.beginPath();g.moveTo(Math.random()*w,Math.random()*w);g.lineTo(Math.random()*w,Math.random()*w);g.stroke();} g.fillStyle='rgba(238,242,240,.85)'; g.font='600 30px "IBM Plex Mono", monospace'; g.textAlign='center'; g.fillText(label,w/2,w*.86); });
export const escTex=TEX_MAKE.esc(), fcTex=TEX_MAKE.fc(), vtxTex=TEX_MAKE.vtx(), rxTex=TEX_MAKE.rx(), gpsTex=TEX_MAKE.gps(), batTex=TEX_MAKE.bat(), frontTex=TEX_MAKE.front(), exBatTex=TEX_MAKE.exbat();
export const ringTex=ctex(128,128,(g,w)=>{ g.strokeStyle='#fff'; g.lineWidth=9; g.beginPath(); g.arc(w/2,w/2,w*.38,0,TAU); g.stroke(); g.fillStyle='#fff'; g.beginPath(); g.arc(w/2,w/2,w*.1,0,TAU); g.fill(); });
