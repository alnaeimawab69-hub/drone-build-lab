/* Drone Build Lab · Renderer, camera, orbit controls, environment lighting */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { $, MODEL, V } from './01-config.js';

/* ================= Renderer & scene ================= */
export const canvas=$('#c');
export let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true}); }
catch(e){ $('#viewport').innerHTML='<p style="padding:24px;color:#94a5ac">This lab needs WebGL. Try a recent version of Chrome, Edge, Firefox or Safari.</p>'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

export const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0f171a);
scene.fog=new THREE.Fog(0x0f171a,70,160);
export const camera=new THREE.PerspectiveCamera(38,1,.1,400);
camera.position.set(17,15,21);

/* our pointerdown must run before OrbitControls' own handler, so register it first (15-input.js sets the handler) */
export const canvasHooks={down:null};
canvas.addEventListener('pointerdown',e=>canvasHooks.down&&canvasHooks.down(e));
export const controls=new OrbitControls(camera,canvas);
controls.target.set(0,1.8,.5);
controls.enableDamping=true; controls.dampingFactor=.08;
controls.maxPolarAngle=Math.PI*.49; controls.minDistance=5; controls.maxDistance=75*(MODEL.view||1);

/* environment for metal reflections, built from simple light panels */
export let envTex=null;
(function(){
  const pm=new THREE.PMREMGenerator(renderer);
  const es=new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.BoxGeometry(40,20,40),new THREE.MeshBasicMaterial({color:0x1c262c,side:THREE.BackSide})));
  const pnl=(w,h,pos,col)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide}));m.position.copy(pos);m.lookAt(0,0,0);es.add(m);};
  pnl(18,10,V(0,9.5,0),new THREE.Color(3.2,3.1,3.0));
  pnl(10,6,V(19,4,6),new THREE.Color(2.2,1.6,1.1));
  pnl(10,6,V(-19,3,-6),new THREE.Color(.9,1.3,1.8));
  envTex=pm.fromScene(es,.03).texture;
  scene.environment=envTex;
})();

scene.add(new THREE.HemisphereLight(0xcfe3ff,0x2a221a,.55));
export const key=new THREE.DirectionalLight(0xfff1e0,1.5);
key.position.set(14,28,12); key.castShadow=true;
key.shadow.mapSize.set(2048,2048);
const SH=18*(MODEL.view||1);
Object.assign(key.shadow.camera,{left:-SH,right:SH,top:SH,bottom:-SH,near:1,far:80});
key.shadow.bias=-.0004;
scene.add(key);
export const fill=new THREE.DirectionalLight(0x9fc4ff,.45); fill.position.set(-16,10,-12); scene.add(fill);
export const rim=new THREE.DirectionalLight(0xffe2c4,.55); rim.position.set(-6,9,20); scene.add(rim);
