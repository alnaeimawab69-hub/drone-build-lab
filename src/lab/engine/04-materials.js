/* Drone Build Lab · Materials for every surface, plus wire colours */
import * as THREE from 'three';
import { CINE } from './01-config.js';
import { batTex, escTex, fcTex, gpsTex, rxTex, vtxTex, weaveTex } from './03-textures.js';

/* ================= Materials ================= */
export const std=(o)=>new THREE.MeshStandardMaterial(o);
export const M={
  carbon:new THREE.MeshPhysicalMaterial({map:weaveTex,roughness:.45,metalness:.15,clearcoat:.85,clearcoatRoughness:.12}),
  alu:std({color:0xc8743a,roughness:.3,metalness:.85}),
  steel:std({color:0xb9c0c7,roughness:.25,metalness:1}),
  darkMetal:std({color:0x2b3036,roughness:.35,metalness:.8}),
  bell:std({color:0x3b444d,roughness:.32,metalness:.75}),
  black:std({color:0x141618,roughness:.55}),
  white:std({color:0xe9ecee,roughness:.5}),
  nylon:std({color:0xe6e1d3,roughness:.7}),
  copper:std({color:0xd49b5c,roughness:.28,metalness:1}),
  tin:std({color:0xcdd2d6,roughness:.22,metalness:1}),
  gold:std({color:0xd9b45a,roughness:.3,metalness:1}),
  sleeve:std({color:0x2a3a43,roughness:.85}),
  camBody:std({color:0x202427,roughness:.6}),
  glass:new THREE.MeshPhysicalMaterial({color:0x0b1a2e,roughness:.03,metalness:.3,clearcoat:1,clearcoatRoughness:.02}),
  gpsShell:std({color:0x2a2f35,roughness:.5}),
  patch:new THREE.MeshStandardMaterial({map:gpsTex,roughness:.6}),
  capBody:std({color:0x23314c,roughness:.45}),
  capStripe:std({color:0xc4cbd1,roughness:.45}),
  connector:std({color:0xd8a93a,roughness:.5}),
  strap:std({color:0xa5582a,roughness:.75}),
  batSide:new THREE.MeshPhysicalMaterial({map:batTex,roughness:.55,clearcoat:.6,clearcoatRoughness:.25}),
  batEnd:std({color:CINE?0xa9aeb4:0x24282d,roughness:.6}),
  prop:new THREE.MeshPhysicalMaterial({color:0x24495c,roughness:.35,transparent:true,opacity:.92,side:THREE.DoubleSide,clearcoat:.25,clearcoatRoughness:.3,envMapIntensity:.35}),
  propHub:std({color:0x3d6c80,roughness:.4}),
  /* teaching colours, so the two kinds are easy to tell apart: CW red, CCW blue */
  propCW:new THREE.MeshPhysicalMaterial({color:0xa81d16,roughness:.4,side:THREE.DoubleSide,clearcoat:.25,clearcoatRoughness:.3,envMapIntensity:.35}),
  propCCW:new THREE.MeshPhysicalMaterial({color:0x1a4fae,roughness:.4,side:THREE.DoubleSide,clearcoat:.25,clearcoatRoughness:.3,envMapIntensity:.35}),
  antenna:std({color:0x1b1d20,roughness:.5}),
  pcbG:std({color:0x0e2b26,roughness:.6}),
  pcbB:std({color:0x0f1a2e,roughness:.6}),
  escTop:new THREE.MeshPhysicalMaterial({map:escTex,roughness:.5,metalness:.1,clearcoat:.55,clearcoatRoughness:.2}),
  fcTop:new THREE.MeshPhysicalMaterial({map:fcTex,roughness:.5,metalness:.1,clearcoat:.55,clearcoatRoughness:.2}),
  vtxTop:new THREE.MeshPhysicalMaterial({map:vtxTex,roughness:.5,clearcoat:.55,clearcoatRoughness:.2}),
  rxTop:new THREE.MeshPhysicalMaterial({map:rxTex,roughness:.5,clearcoat:.55,clearcoatRoughness:.2}),
  padGood:std({color:0x5bc489,emissive:0x1f7a48,roughness:.4}),
  padHover:std({color:0xe0894a,emissive:0x7a3a12,roughness:.4}),
  rubber:new THREE.MeshBasicMaterial({color:0xe0894a,transparent:true,opacity:.85}),
  solder:std({color:0xdfe3e6,roughness:.12,metalness:1}),
  /* model 2 (cinematic) parts */
  bellC:std({color:0x62676e,roughness:.28,metalness:.85}),   // model 2: gunmetal motor bells (the purple is the band and base)
  sidePanel:new THREE.MeshPhysicalMaterial({color:0x3f1590,roughness:.15,transparent:true,opacity:.72,envMapIntensity:.5,clearcoat:1,clearcoatRoughness:.08}),   // model 2: see-through purple side panels
  panelGlow:std({color:0xe9dcff,emissive:0xa57bff,emissiveIntensity:1.6,roughness:.3}),                                          // model 2: light bar inside each side panel
  cage:std({color:0x101113,roughness:.4,metalness:.7}),                                                                           // model 2: black anodised camera cage
  guard:std({color:0x1c1d20,roughness:.85}),                  // model 2: black TPU motor guards
  accent:std({color:0x6b3fa8,roughness:.32,metalness:.7}),     // model 2: purple anodised aluminium trim
  tpu:std({color:0xf0b81c,roughness:.82}),            // printed TPU mounts, yellow like most modern FPV builds
  heatsink:std({color:0x8f979e,roughness:.35,metalness:.85}),
  camShell:std({color:0x0c0d0f,roughness:.75}),
  /* battery straps and pad */
  strapBand:std({color:0x17191c,roughness:.92}),
  strapGrip:std({color:0xc8402f,roughness:.95}),
  batPad:std({color:0x24272b,roughness:.98}),
  ceramic:std({color:0xd8cdb0,roughness:.55}),
  /* model 3 (enterprise) parts */
  shell:new THREE.MeshPhysicalMaterial({color:0x2b2f34,roughness:.6,metalness:.1,clearcoat:.25,clearcoatRoughness:.35,envMapIntensity:.45}),   // dark graphite, matte
  shellLight:new THREE.MeshPhysicalMaterial({color:0x9aa0a6,roughness:.45,metalness:.1,clearcoat:.4,clearcoatRoughness:.3,envMapIntensity:.5}),
  shellDark:std({color:0x14161a,roughness:.6,envMapIntensity:.4}),
  lensBlack:new THREE.MeshPhysicalMaterial({color:0x05070a,roughness:.05,metalness:.2,clearcoat:1,clearcoatRoughness:.03}),
  beaconRed:std({color:0xff4a3d,emissive:0xd8231a,emissiveIntensity:1.3,roughness:.3}),
  ledGreen:std({color:0x7cffa0,emissive:0x21c45a,emissiveIntensity:1.3,roughness:.3}),
  lampWhite:std({color:0xf7f5ea,emissive:0xbab49a,emissiveIntensity:.9,roughness:.3}),
  orange:std({color:0xe0894a,roughness:.5}),
};
M.carbonTop=M.carbon.clone();
export const WIRE_MATS={};
export function wireColor(need,label){
  if(need==='VBAT+'||need==='5V'||need==='9V') return 0xd8453b;
  if(need==='VBAT-'||need==='GND') return 0x2b2f35;
  if(need==='CAM'||need==='VTX') return 0xe8c33c;
  if(need&&need[0]==='M') return 0x8a939c;
  if(need==='ESC') return 0xc9ced3;
  if(label==='TX') return 0x34a853;   // green TX, like a standard 4-wire UART cable
  return 0xeeeeee;
}
export const hex=c=>'#'+c.toString(16).padStart(6,'0');
export function wireMat(c){ return WIRE_MATS[c]||(WIRE_MATS[c]=std({color:c,roughness:.42,metalness:.05})); }
