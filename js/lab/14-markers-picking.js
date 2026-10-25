/* Drone Build Lab · Hotspot markers and 3D picking */
'use strict';
/* ================= Markers ================= */
function updateMarkers(){
  const k=stageKey(), hold=S.drag&&S.drag.kind==='part'?S.drag.typeKey:null;
  HOT.forEach(h=>{
    const show=!S.explore&&h.stage===k&&!parts[h.id]&&reqOk(h); h.marker.visible=show; if(!show) return;
    let c=S.cad?0x2c3a42:0xe3eaed,o=.8;
    if(hold&&S.mode==='learn'){ const ok=accepts(h,hold)&&(h.type!=='prop'||propDir(hold)===EXP[h.motor]); c=ok?0x5bc489:0x65777e; o=ok?1:.35; }
    if(S.drag&&S.drag.snap===h){ c=0xe0894a; o=1; }
    h.marker.material.color.setHex(c); h.marker.material.opacity=o;
  });
  updateScrewMarkers();
}

/* ================= Picking ================= */
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
function setNDC(e){ const r=canvas.getBoundingClientRect(); ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(ndc,camera); }
function insideCanvas(e){ const r=canvas.getBoundingClientRect(); return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; }
function planePoint(through){ const n=camera.getWorldDirection(V()); const pl=new THREE.Plane().setFromNormalAndCoplanarPoint(n,through); const p=V(); return ray.ray.intersectPlane(pl,p)?p:through.clone(); }
function screenOf(world){ const p=world.clone().project(camera); const r=canvas.getBoundingClientRect(); return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height,z:p.z}; }
function pickPad(){ const list=Object.values(PADS).map(p=>p.proxy); const hit=ray.intersectObjects(list,false)[0]; return hit?hit.object.userData.padId:null; }
function hotOf(o){ while(o&&o!==droneRoot){ if(o.userData.hotId) return o.userData.hotId; o=o.parent; } return null; }
function pickPart(stage){ const list=Object.values(parts).filter(p=>p.hot.stage===stage).map(p=>p.group); const hit=ray.intersectObjects(list,true)[0]; return hit?hotOf(hit.object):null; }
function computeSnap(x,y){ let best=null,bd=64; const k=stageKey();
  for(const h of HOT){ if(h.stage!==k||parts[h.id]||!reqOk(h)) continue; const s=screenOf(h.marker.getWorldPosition(V())); const d=Math.hypot(s.x-x,s.y-y); if(d<bd){bd=d;best=h;} }
  return best; }
