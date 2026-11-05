/* Drone Build Lab · Part catalogue, mounting points (hotspots), stages and scoring */
import { ARM_ANG, CINE, DEG, EX, MODEL, V, armPos } from './01-config.js';
import { GPS_TOP, PLATE_T, STRAP_Z, buildActionCam, buildAluSt, buildArm, buildBattery, buildCamMount, buildCamPlate, buildCamera, buildCap, buildESC, buildFC, buildGPS, buildGpsMount, buildLED, buildLead, buildMotor, buildNylSt, buildPanel, buildPlateB, buildProp, buildRX, buildStrap, buildTopPlate, buildVTX } from './06-builders.js';
import { EX_PROP_Y, EX_TYPES, exHot } from './29-enterprise.js';

/* ================= Part catalogue ================= */
export const TYPES={
  plateB:{name:'Bottom plate',count:1,build:buildPlateB,where:'flat in the middle of the mat, as the base of everything',lab:V(0,.5,-5.1),
    role:'The base of the frame. The arms, the standoffs and the electronics stack all attach to it.',links:'Four arms (two M3 × 10 screws each), six aluminium standoffs and four stack standoffs.',spec:'3 mm carbon fibre'},
  arm:{name:'Frame arm',count:4,build:buildArm,where:'on the bottom plate, one toward each corner',
    role:'Holds a motor at its tip. Carbon fibre is stiff and light. A stiff arm shakes less, so the flight controller gets clean sensor readings.',links:'Two M3 × 10 screws hold it to the bottom plate. The motor bolts to the tip from below with four M3 × 6 screws.',spec:'4.5 mm carbon fibre · 16 × 16 mm motor hole pattern'},
  nylSt:{name:'Stack standoff',count:4,build:buildNylSt,where:'in the four centre holes (the 30.5 mm square)',ex:V(0,.6,0),
    role:'Nylon posts that hold the ESC and the flight controller. Nylon does not conduct electricity, so it cannot short-circuit the boards.',links:'The ESC and the flight controller slide down over them. Nylon nuts on top clamp the stack.',spec:'M3 nylon · 30.5 × 30.5 mm hole pattern'},
  aluSt:{name:'Aluminium standoff',count:6,build:buildAluSt,where:'in the six holes along the edges of the bottom plate',ex:V(0,2,0),
    role:'Metal posts that hold the top plate 30 mm above the bottom plate. This leaves room for the electronics between the plates.',links:'They screw into the bottom plate. The top plate screws onto them with M3 × 6 screws.',spec:'M3 thread · 30 mm long'},
  camPlate:{name:'Camera side plate',count:2,build:buildCamPlate,where:CINE?'at the front edge of the bottom plate, one on each side':'on the front of the top plate, one on each side',
    role:'Two side plates form the camera cage. They protect the lens in a crash.',links:'The FPV camera sits between them, held by two M2 × 5 screws.',spec:'1.5 mm carbon fibre'},
  tplate:{name:'Top plate',count:1,build:buildTopPlate,where:'on top of the six aluminium standoffs',ex:V(0,4,0),lab:V(0,.5,-4.7),
    role:'Closes the top of the frame. It carries the camera cage at the front and the battery behind it. A rubber pad stops the battery sliding. Two battery straps pass through its slots.',links:'Six M3 × 6 screws into the aluminium standoffs. Two pairs of slots take the battery straps. The camera wires pass down through a slot behind the camera.',spec:'2 mm carbon fibre · battery pad · four strap slots'},
  motor:{name:'Brushless motor',count:4,build:buildMotor,where:'on the motor mounts at the four arm tips',
    role:'Spins the propeller. The outer bell holds magnets and turns around fixed copper coils (the windings). Brushless means no brushes rub inside, so it wears slowly.',links:'Its three phase wires go to one ESC output (M1 to M4).',spec:'2205 size: stator (fixed core) 22 mm wide, 5 mm tall · 2300 KV: KV is rpm per volt, so about 2300 rpm for each volt with no propeller'},
  esc:{name:'4-in-1 ESC',count:1,build:buildESC,where:'at the bottom of the stack standoffs, because it carries the high battery current',ex:V(0,1.2,0),lab:V(2.8,.2,0),
    role:'ESC means electronic speed controller. It switches battery power in fast pulses on three wires to drive a motor. This 4-in-1 board drives all four motors.',links:CINE?'Battery lead and capacitor on + and −. Motors on M1 to M4. A harness (multi-wire cable) up to the flight controller.':'Battery lead and capacitor on + and −. Motors on M1 to M4. An 8-wire harness up to the flight controller: S1 to S4 (a speed signal for each motor), GND (ground), VBAT (battery voltage), CUR (current sensor) and TLM (telemetry, optional).',spec:'30.5 × 30.5 mm hole pattern · about 45 A (amps) per motor'},
  fc:{name:'Flight controller',count:1,build:buildFC,where:'on top of the ESC in the stack',ex:V(0,2.6,0),lab:V(-2.8,.4,0),
    role:'The FC (flight controller) is the brain of the drone. Its gyro senses rotation and its accelerometer senses tilt. It corrects the motor speeds thousands of times per second to keep the drone steady.',links:'ESC harness, radio receiver (UART 1), GPS module (UART 3), FPV camera (CAM pad), video transmitter (VTX pad). A UART is a serial port: one wire sends (TX), one receives (RX).',spec:'The printed arrow must point to the front · 30.5 × 30.5 mm hole pattern'},
  camera:{name:'FPV camera',count:1,build:buildCamera,where:CINE?'in the camera cage at the front':'in the camera cage on the front of the top plate',ex:V(0,.4,-2.6),lab:V(0,1.5,-.4),
    role:'FPV means first-person view: the pilot sees what the drone sees. The camera is tilted up about 20°, so the picture is level when the drone leans forward to fly.',links:'5V, G (ground) and video wires to the CAM pads on the flight controller.',spec:'19 mm wide body · 20° uptilt'},
  vtx:{name:'Video transmitter',count:1,build:buildVTX,where:'standing upright at the rear end of the bottom plate, antenna out the back',ex:V(0,.3,2.6),lab:V(0,1.1,0),
    role:'VTX means video transmitter. It sends the camera picture by radio to the pilot’s goggles or screen.',links:'9V, G and video wires from the VTX pads on the flight controller. Always fit the antenna before power-up: without it the VTX can overheat and burn out.',spec:'5.8 GHz band · 25 to 400 mW output power'},
  rx:{name:'Radio receiver',count:1,build:buildRX,where:CINE?'in the rear bay on the left, antennas out the back':'in the rear bay on the left. One antenna stands upright, the other points out to the back left, so they are at 90° and clear of the carbon and the power wires',ex:CINE?V(-1.6,.3,2):V(-2.4,.3,.6),lab:V(-.6,.9,0),
    role:'Receives the stick commands from the pilot’s handheld radio and passes them to the flight controller.',links:CINE?'5V, G, TX and RX wires to UART 1 on the flight controller.':'5V (red), G (black), RX (white) and TX (green) wires to UART 1 on the flight controller. TX goes to R1, RX goes to T1.',spec:'2.4 GHz · two antennas at 90° to each other, so it keeps signal at any angle'},
  gpsMount:{name:'GPS mount',count:1,build:buildGpsMount,where:'at the rear of the top plate, behind the battery',ex:V(0,2.5,1.5),lab:V(1.9,1.6,.4),
    role:'A tower that lifts the GPS module above the battery and away from the power wires. Carbon fibre and the battery block satellite signals. The current in the power wires upsets the compass.',links:'Stands on the top plate between the rear standoffs. The GPS module sticks to its platform with double-sided foam tape.',spec:'TPU (a soft, 3D-printed plastic): it bends in a crash instead of snapping'},
  gps:{name:'GPS module',count:1,build:buildGPS,where:CINE?'on the platform of the GPS mount, arrow to the front':'on the bottom plate in the front bay, under the camera, arrow to the front',ex:CINE?V(0,1.2,2.2):V(0,1.2,-2.2),lab:V(0,1.2,0),
    role:'Finds the drone’s position and speed from satellites. Its built-in compass gives the heading (the way the nose points). This makes position hold and return-to-home possible.',links:CINE?'5V, G, TX and RX wires to UART 3 on the flight controller.':'5V (red), G (black), RX (white) and TX (green) wires to UART 3 on the flight controller. TX goes to R3, RX goes to T3.',spec:'Ceramic patch antenna faces the sky · the arrow on top must point to the front'},
  camMount:{name:'Camera mount',count:1,build:buildCamMount,where:'over the camera cage, its cheeks outside the side plates',ex:V(0,.2,-4.6),lab:V(0,-1.5,-1.8),
    role:'Soft TPU cheeks reach past the lens. In a crash the mount hits the ground first, not the camera. Tick marks on the side show the camera tilt in 10° steps.',links:'Slides over the camera side plates. The camera screws pass through it. A chin bar under the lens joins the two sides.',spec:'TPU (soft plastic) · tilt marks from 0° to 40°'},
  cap:{name:'Capacitor',count:1,build:buildCap,where:CINE?'in the rear bay on the right, next to the ESC battery pads':'standing upright in the rear bay on the right, legs up, clear of the arm and the motor wires',ex:V(1.5,.3,1.4),lab:V(.6,.8,0),
    role:'Absorbs voltage spikes made when the ESC switches the motors on and off. This protects the electronics and gives a cleaner video picture.',links:'Across the ESC battery pads: + leg to +, striped leg (−) to −.',spec:'Low-ESR electrolytic (low internal resistance) · rated 35 V · 1000 µF'},
  lead:{name:'Battery lead',count:1,build:buildLead,where:CINE?'at the rear exit so the connector hangs out the back':'in the holder under the rear edge of the top plate, right behind the battery. The wires run down behind the plate to the ESC',ex:V(.8,.2,2.6),lab:V(.5,.9,1),
    role:'Thick power cable from the battery plug to the ESC. It is thick because it carries the current for all four motors.',links:'Red wire to ESC +, black wire to ESC −.',spec:'12 AWG silicone wire (AWG is wire gauge: a smaller number means a thicker wire)'},
  battery:{name:'LiPo battery',count:1,build:buildBattery,where:'on the rubber pad on the top plate, between the strap slots',ex:V(0,7,0),lab:V(0,3.2,0),
    role:'Stores the energy. LiPo means lithium-polymer. It has four cells in series, written 4S. A damaged LiPo can catch fire, so never crush it or short-circuit it.',links:'Plugs into the battery lead at the rear. Two battery straps hold it down.',spec:'4S · 14.8 V nominal (normal), 16.8 V full · 1300 mAh capacity'},
  strap:{name:'Battery strap',count:2,build:buildStrap,where:'over the battery, through a pair of slots in the top plate',ex:V(0,8.6,0),lab:V(-2.4,2.2,0),
    role:'Holds the battery down. The battery is the heaviest part. If it is loose, a hard turn or a crash throws it off and rips out the power cable.',links:'Goes down through two slots in the top plate, under the plate, up over the battery, and closes with a buckle. The red rubber side faces the battery so it cannot slide.',spec:'Velcro with an anti-slip rubber face · 20 × 250 mm · two per battery'},
  propCW:{name:'Propeller, CW',count:2,build:()=>buildProp('CW'),where:'on a motor that spins clockwise',lab:V(0,.9,0),
    role:'Pushes air down when it turns clockwise (CW), seen from above.',links:'Fits a motor that spins clockwise (CW).',spec:'5 inch (127 mm) · three blades'},
  propCCW:{name:'Propeller, CCW',count:2,build:()=>buildProp('CCW'),where:'on a motor that spins counter-clockwise',lab:V(0,.9,0),
    role:'Mirror image of the CW propeller. Pushes air down when it turns counter-clockwise (CCW), seen from above.',links:'Fits a motor that spins counter-clockwise (CCW).',spec:'5 inch (127 mm) · three blades'},
  frame:{name:'Carbon X frame',role:'Holds everything in place. The arms carry the motors. The plates and standoffs hold the electronics stack and the battery.',links:'Motors bolt to the arm tips. The stack sits on the stack standoffs (30.5 mm square).',spec:'250 mm wheelbase (motor to motor, across the diagonal) · 4.5 mm arms'}
};
TYPES.motor.lab=V(0,2.6,0);

/* model 2 (cinematic deadcat): same build stages, different parts. Keys stay the same where the job is the same */
if(CINE){
  const T=(k,o)=>Object.assign(TYPES[k],o);
  T('plateB',{lab:V(0,.5,-5.4),role:'The base of the frame. On this deadcat frame it is wider, so the front arms can sweep out to the sides.',spec:'2.5 mm carbon fibre · deadcat layout'});
  T('arm',{where:'on the bottom plate: the two front arms sweep out to the sides, the two rear arms point back',
    role:'Holds a motor at its tip. On a deadcat frame the front arms sweep out to the sides. This keeps the propellers out of the camera picture.',
    spec:'6 mm carbon fibre · thicker arms survive crashes of a heavier drone'});
  T('aluSt',{role:'Metal posts that hold the top plate 30 mm above the bottom plate. The side panels clip onto them.'});
  T('camPlate',{name:'Camera cage plate',role:'Aluminium side plates form the camera cage. Aluminium survives crashes better than thin carbon. It also draws heat away from the camera.',links:'The HD camera sits between them, held by two M2 × 5 screws.',spec:'CNC aluminium · fits a 19 mm camera'});
  T('tplate',{lab:V(0,.5,-5),role:'Closes the top of the frame. It carries the battery on a rubber pad in the middle, and a TPU mount for the action camera at the front.',links:'Six M3 × 6 screws into the aluminium standoffs. Two pairs of slots take the battery straps. The GPS mount stands at the rear.',spec:'2.5 mm carbon fibre · TPU mounts (soft plastic) absorb vibration'});
  T('motor',{spec:'2306 size: stator (fixed core) 23 mm wide, 6 mm tall · 1880 KV (rpm per volt): lower KV suits the higher voltage of a 6S battery'});
  T('esc',{spec:'30.5 × 30.5 mm hole pattern · about 55 A (amps) per motor · works on 3S to 6S'});
  T('fc',{links:'ESC harness, radio receiver (UART 1), digital VTX (UART 2), GPS module (UART 3), LED strip (LED pad). A UART is a serial port: one wire sends (TX), one receives (RX).'});
  T('camera',{name:'HD camera',ex:V(0,.4,-2.6),
    role:'A digital camera that gives the pilot a sharp, high-definition (HD) picture. Its video goes through a thin coax cable straight to the digital VTX, not through the flight controller.',
    links:'Coax cable to the digital VTX (already fitted at the VTX end). Two M2 × 5 screws into the cage.',spec:'19 mm body · digital HD sensor · 20° uptilt'});
  T('vtx',{name:'Digital VTX',where:'in the centre of the rear bay, antennas out the back',ex:V(0,.3,2.8),lab:V(0,1.4,0),
    role:'VTX means video transmitter. This one turns the HD camera picture into a digital radio signal for the pilot’s goggles, with very little delay. It also records the flight in HD.',
    links:'9V and G for power. TX and RX to UART 2 on the flight controller, so flight data shows in the goggles. Always fit the antennas before power-up: without them the VTX can burn out.',
    spec:'5.8 GHz digital · two antennas · aluminium heatsink'});
  T('gps',{ex:V(0,4,2.5),spec:'Mounted on top, clear of the carbon plate, which blocks satellite signals'});
  T('cap',{role:'Absorbs voltage spikes made when the ESC switches the motors on and off. On 6S the spikes are bigger, so the capacitor matters even more.',spec:'Low-ESR electrolytic (low internal resistance) · rated 50 V · 1000 µF'});
  T('battery',{ex:V(0,6,0),role:'Stores the energy. LiPo means lithium-polymer. It has six cells in series (6S). The higher voltage gives this heavier drone more power for the same current. A damaged LiPo can catch fire, so never crush it or short-circuit it.',spec:'6S · 22.2 V nominal (normal), 25.2 V full · 1100 mAh capacity'});
  T('propCW',{spec:'5.1 inch (130 mm) · three blades'}); T('propCCW',{spec:'5.1 inch (130 mm) · three blades'});
  T('frame',{name:'Carbon deadcat frame',role:'Holds everything in place. The front arms sweep out to the sides (a “deadcat” layout), so no propeller shows in the camera picture.',links:'Motors bolt to the arm tips. The stack sits on the stack standoffs (30.5 mm square). Clear panels close the sides.',spec:'About 228 mm wheelbase (motor to motor, across the diagonal) · 6 mm arms · deadcat layout'});
  TYPES.panel={name:'Side panel',count:2,build:buildPanel,where:'on the left and right sides of the frame, between the plates',lab:V(0,1.8,-3.5),
    role:'Clear panels close the sides of the frame. They keep grass and dirt out of the electronics and let the LED strip shine through.',links:'Clip onto the three aluminium standoffs on that side.',spec:'Clear polycarbonate'};
  TYPES.led={name:'LED strip',count:1,build:buildLED,where:'on the inside of the right side panel',ex:V(2.4,0,0),lab:V(0,.6,-2),
    role:'Bright LEDs behind the clear panel. They show the flight mode and warn of a low battery. They also help you see which way the drone faces.',
    links:'5V, G and a data wire (DIN, data in) to the 5V, G and LED pads at the front of the flight controller.',spec:'Addressable RGB LEDs · 5 V'};
  TYPES.actionCam={name:'Action camera',count:1,build:buildActionCam,where:'in the TPU mount at the front of the top plate',ex:V(0,5,-1.5),lab:V(0,4.6,0),
    role:'Records smooth, high-quality video for the film. The HD camera is for the pilot; the action camera is for the footage.',
    links:'Clamps into the TPU prongs on the top plate. It has its own battery, so no wires go to the drone.',spec:'Tilted up about 15° · the soft TPU mount stops vibration from reaching the picture'};
}
/* model 3 (enterprise) has its own catalogue of sealed modules */
if(EX){ for(const k in TYPES) delete TYPES[k]; Object.assign(TYPES,EX_TYPES); }
export const PROP_Y=EX?EX_PROP_Y:MODEL.armT+1.45*(CINE?1.1:1);  // top of the motor shaft, where the prop sits

/* hotspots: where parts go (positions in drone coordinates) */
const AX=MODEL.alu;
export const ALU_POS=[[-AX,-4],[AX,-4],[-AX,0],[AX,0],[-AX,4.2],[AX,4.2]];
export const NYL_POS=[[-1.525,-1.525],[1.525,-1.525],[-1.525,1.525],[1.525,1.525]];
const PLATE_TOP=3.4+PLATE_T, GPS_MOUNT=CINE?V(0,PLATE_TOP,5):V(0,PLATE_TOP,4.05);
const CAM_Y=CINE?1.95:PLATE_TOP+1.2, CAM_Z=CINE?-4.3:-3.7;   // camera centre: model 1 sits on the top plate
export const HOT=EX?exHot():[
  {id:'bplate',type:'plateB',stage:'frame',pos:V(0,.05,.25),label:'Centre of the mat',mk:V(0,.3,0)},
  ...[1,2,3,4].map(n=>({id:'arm'+n,type:'arm',stage:'frame',pos:V(0,0,0),rotY:ARM_ANG[n]*DEG,motor:n,requires:'bplate',label:'Corner '+n,mk:armPos(n,7).setY(.6)})),
  ...NYL_POS.map(([x,z],i)=>({id:'nyl'+(i+1),type:'nylSt',stage:'frame',pos:V(x,1.375,z),requires:'bplate',label:'Centre hole',mk:V(0,-.8,0)})),
  ...ALU_POS.map(([x,z],i)=>({id:'alu'+(i+1),type:'aluSt',stage:'frame',pos:V(x,1.925,z),requires:'bplate',label:'Edge hole',mk:V(0,-1.2,0)})),
  {id:'tplate',type:'tplate',stage:'frame',pos:V(0,3.4,0),requires:ALU_POS.map((_,i)=>'alu'+(i+1)),label:'On the standoffs',mk:V(0,.3,0)},
  /* model 1: the camera cage stands on the front of the top plate; model 2: between the plates */
  ...[-1.13,1.13].map((x,i)=>CINE?{id:'cpl'+(i+1),type:'camPlate',stage:'frame',pos:V(x,1.925,-4.3),requires:'bplate',label:'Front edge',mk:V(0,0,0)}
    :{id:'cpl'+(i+1),type:'camPlate',stage:'frame',pos:V(x,CAM_Y-.05,CAM_Z),requires:'tplate',label:'Top plate, front',mk:V(0,0,0)}),
  ...(CINE?[-1,1].map((s,i)=>({id:'pnl'+(i+1),type:'panel',stage:'frame',pos:V(s*3.25,1.98,.3),requires:[1,3,5].map(k=>'alu'+(k+(s>0?1:0))),label:(s<0?'Left':'Right')+' side',mk:V(s*.3,0,0)})):[]),
  ...[1,2,3,4].map(n=>({id:'mot'+n,type:'motor',stage:'mount',pos:armPos(n).setY(MODEL.armT),rotY:ARM_ANG[n]*DEG,motor:n,requires:'arm'+n,label:'Arm tip '+n,mk:V(0,.8,0)})),
  {id:'esc',type:'esc',stage:'mount',pos:V(0,1.0,0),requires:['nyl1','nyl2','nyl3','nyl4'],label:'Stack, lower level',mk:V(0,.25,0)},
  {id:'fc',type:'fc',stage:'mount',pos:V(0,2.05,0),label:'Stack, upper level',requires:'esc',mk:V(0,.25,0)},
  {id:'cam',type:'camera',stage:'mount',pos:V(0,CAM_Y,CAM_Z),rotX:.35,requires:['cpl1','cpl2'],label:CINE?'Front cage':'Top plate, front cage',mk:V(0,0,0)},
  /* model 1: the GPS takes the rear-centre spot on the bottom plate, so the VTX stands upright behind it (board facing back, antenna up and out the back)
     and the receiver sits on its left, clear of the arm and the standoffs. The GPS takes the front bay under the camera */
  CINE?{id:'vtx',type:'vtx',stage:'mount',pos:V(0,.5,3.5),label:'Rear bay, centre',mk:V(0,.35,0)}
    :{id:'vtx',type:'vtx',stage:'mount',pos:V(-.6,1.4,4.85),rotX:Math.PI/2,rotY:Math.PI,label:'Rear end, upright',mk:V(0,0,.4)},
  CINE?{id:'rx',type:'rx',stage:'mount',pos:V(-1.9,.45,4.4),label:'Rear bay, left',mk:V(0,.25,0)}
    :{id:'rx',type:'rx',stage:'mount',pos:V(-1.2,.42,3.75),label:'Rear bay, left',mk:V(0,.25,0)},
  {id:'camMount',type:'camMount',stage:'mount',pos:V(0,CAM_Y-.025,CAM_Z),requires:'cam',label:'Over the camera',mk:V(0,-1.1,-1.8)},
  ...(CINE?[{id:'gpsMount',type:'gpsMount',stage:'mount',pos:GPS_MOUNT,requires:'tplate',label:'Top plate, rear',mk:V(0,.4,0)},
    {id:'gps',type:'gps',stage:'mount',pos:GPS_MOUNT.clone().add(GPS_TOP),requires:'gpsMount',label:'GPS mount platform',mk:V(0,.35,0)}]
    :[{id:'gps',type:'gps',stage:'mount',pos:V(0,.4,-3.4),label:'Bottom plate, front bay',mk:V(0,.35,0)}]),
  /* model 1: the capacitor stands upright, legs up, between the rear-right arm and the battery lead wires */
  CINE?{id:'cap',type:'cap',stage:'mount',pos:V(1.9,.95,3.05),label:'Rear bay, right',mk:V(0,0,0)}
    :{id:'cap',type:'cap',stage:'mount',pos:V(1.7,1.37,3.55),rotX:Math.PI/2,label:'Rear bay, right, upright',mk:V(0,0,0)},
  /* model 1: the plug is held at the rear of the top plate, next to the battery, as on most real builds */
  CINE?{id:'lead',type:'lead',stage:'mount',pos:V(1.1,.7,5.0),label:'Rear exit',mk:V(0,0,.5)}
    :{id:'lead',type:'lead',stage:'mount',pos:V(.85,3.5,4.65),requires:'tplate',label:'Top plate, rear edge',mk:V(0,.5,.5)},
  ...(CINE?[{id:'led',type:'led',stage:'mount',pos:V(3.12,1.98,.3),requires:'pnl2',label:'Inside the right panel',mk:V(-.4,.4,-2)},
    {id:'acam',type:'actionCam',stage:'mount',pos:V(0,4.6,-3.7),rotX:.26,requires:'tplate',label:'Top plate, front mount',mk:V(0,2,0)}]:[]),
  {id:'bat',type:'battery',stage:'power',pos:V(0,PLATE_TOP+.06,MODEL.batZ),label:'Top plate',mk:V(0,1.3,0)},
  ...STRAP_Z.map((z,i)=>({id:'strap'+(i+1),type:'strap',stage:'power',pos:V(0,PLATE_TOP,z),requires:'bat',label:(i?'Rear':'Front')+' strap slots',mk:V(0,MODEL.bat[1]+.5,0)})),
  ...[1,2,3,4].map(n=>({id:'prop'+n,type:'prop',stage:'props',pos:armPos(n).setY(PROP_Y),motor:n,label:'Motor '+n+' shaft',mk:V(0,.35,0)})),
];
export const HOTMAP=Object.fromEntries(HOT.map(h=>[h.id,h]));
export const accepts=(h,t)=>h.type==='prop'?t.startsWith('prop'):h.type===t;
export const propDir=t=>t==='propCW'?'CW':'CCW';

export const STAGES=[
  {key:'frame',title:'Build the frame',short:'Frame',goal:'Put the carbon frame together and screw it tight. Every other part attaches to it.'},
  {key:'mount',title:'Mount the components',short:'Mount',goal:'Drag each part onto the frame. Then fasten it with the right screws.'},
  {key:'wire',title:'Wire the electronics',short:'Wire',goal:'Solder each wire to its correct pad: drag from a wire end to a pad. A wrong wire can destroy a part at power-up.'},
  {key:'power',title:'Power-up and motor test',short:'Test',goal:EX?'Fit and strap down the battery. Then check that each motor spins the right way, with no propellers fitted.':'Propellers off first. Then fit and strap the battery, plug it in and check that each motor spins the right way. Unplug it again before the propellers go on.'},
  {key:'props',title:'Fit the propellers',short:'Props',goal:'Fit a CW (clockwise) or CCW (counter-clockwise) propeller to match each motor. A wrong propeller flips the drone at take-off.'},
  {key:'fly',title:'Flight physics',short:'Fly',goal:'Fly the finished drone. Watch how the four motor speeds create every movement.'},
  {key:'quiz',title:'Knowledge check',short:'Check',goal:CINE?'Eleven questions on what you just built.':'Eight questions on what you just built.'},
].filter(s=>!(EX&&s.key==='wire'));   // model 3's modules click together: nothing to solder
if(EX){
  Object.assign(STAGES[0],{title:'Assemble the airframe',goal:'Fit the fuselage, then click the four folding arms and the two landing gear legs onto it. Every module locks in with a quick-release connector, so there are no screws.'});
  Object.assign(STAGES[1],{goal:'Drag each module into place: flight controller, top shell, motors, cameras, RTK, sensors and lights.'});
  Object.assign(STAGES[2],{goal:'Slide both smart batteries into the bay, then check each motor spins the right way.'});
}
/* model 3 has no wiring section, so its 30 points are shared across the other sections */
export const SEC=EX?{frame:20,mount:30,test:15,props:15,quiz:20}:{frame:15,mount:20,wire:30,test:10,props:10,quiz:15};
export const SECNAME={frame:'Frame assembly',mount:'Component mounting',wire:'Wiring and soldering',test:'Power-up and motor test',props:'Propellers',quiz:'Knowledge check'};
