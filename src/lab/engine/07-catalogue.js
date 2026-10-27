/* Drone Build Lab · Part catalogue, mounting points (hotspots), stages and scoring */
import { ARM_ANG, CINE, DEG, EX, MODEL, V, armPos } from './01-config.js';
import { GPS_TOP, PLATE_T, STRAP_Z, buildActionCam, buildAluSt, buildArm, buildBattery, buildCamMount, buildCamPlate, buildCamera, buildCap, buildESC, buildFC, buildGPS, buildGpsMount, buildLED, buildLead, buildMotor, buildNylSt, buildPanel, buildPlateB, buildProp, buildRX, buildStrap, buildTopPlate, buildVTX } from './06-builders.js';
import { EX_PROP_Y, EX_TYPES, exHot } from './29-enterprise.js';

/* ================= Part catalogue ================= */
export const TYPES={
  plateB:{name:'Bottom plate',count:1,build:buildPlateB,where:'flat in the middle of the mat, as the base of everything',lab:V(0,.5,-5.1),
    role:'The base of the frame. The arms clamp to it and the electronics stack stands on it.',links:'Four arms (two M3 × 10 screws each), six aluminium standoffs, four stack standoffs.',spec:'3 mm carbon fibre'},
  arm:{name:'Frame arm',count:4,build:buildArm,where:'on the bottom plate, one toward each corner',
    role:'Carries a motor at its tip. Carbon fibre is stiff and light, so vibration stays low.',links:'Two M3 × 10 screws into the bottom plate. The motor bolts to the tip with four M3 × 6 screws from below.',spec:'4.5 mm carbon · 16 × 16 mm motor hole pattern'},
  nylSt:{name:'Stack standoff',count:4,build:buildNylSt,where:'in the four centre holes (the 30.5 mm square)',ex:V(0,.6,0),
    role:'Nylon posts the ESC and flight controller sit on. Nylon does not conduct, so it cannot short the boards.',links:'ESC and flight controller slide over them; nylon nuts clamp the stack.',spec:'M3 nylon · 30.5 × 30.5 mm pattern'},
  aluSt:{name:'Aluminium standoff',count:6,build:buildAluSt,where:'in the six holes along the edges of the bottom plate',ex:V(0,2,0),
    role:'Spacer posts that hold the top plate 30 mm above the bottom plate.',links:'Threaded into the bottom plate; the top plate screws into them with M3 × 6.',spec:'M3 thread · 30 mm long'},
  camPlate:{name:'Camera side plate',count:2,build:buildCamPlate,where:'at the front edge of the bottom plate, one on each side',
    role:'Forms the camera cage and protects the lens in a crash.',links:'The camera mounts between them with two M2 × 5 screws.',spec:'1.5 mm carbon'},
  tplate:{name:'Top plate',count:1,build:buildTopPlate,where:'on top of the six aluminium standoffs',ex:V(0,4,0),lab:V(0,.5,-4.7),
    role:'Closes the frame and carries the battery on a rubber anti-slip pad. Two battery straps pass through its slots.',links:'Six M3 × 6 screws into the standoffs. Two pairs of slots take the battery straps; the GPS mount sits at the rear.',spec:'2 mm carbon · battery pad · four strap slots'},
  motor:{name:'Brushless motor',count:4,build:buildMotor,where:'on the motor mounts at the four arm tips',
    role:'Spins the propeller. The outer bell carries magnets and turns around fixed copper windings.',links:'Three phase wires to one ESC output (M1 to M4).',spec:'2205 size (22 mm stator, 5 mm tall) · 2300 KV, about 2300 rpm per volt with no load'},
  esc:{name:'4-in-1 ESC',count:1,build:buildESC,where:'on the stack standoffs, bottom level, because it carries the high current',ex:V(0,1.2,0),lab:V(2.8,.2,0),
    role:'Electronic speed controller. Turns battery power into fast three-phase pulses that drive each motor.',links:'Battery lead and capacitor on + and −, four motors on M1 to M4, harness up to the flight controller.',spec:'30.5 × 30.5 mm mounting · about 45 A per motor'},
  fc:{name:'Flight controller',count:1,build:buildFC,where:'on top of the ESC in the stack',ex:V(0,2.6,0),lab:V(-2.8,.4,0),
    role:'The brain. Its gyro and accelerometer sense rotation and tilt; its processor corrects the motors thousands of times per second.',links:'ESC harness, receiver (UART 1), GPS (UART 3), camera (CAM), video transmitter (VTX).',spec:'The printed arrow marks the front · 30.5 × 30.5 mm mounting'},
  camera:{name:'FPV camera',count:1,build:buildCamera,where:'in the camera cage at the front',ex:V(0,.4,-2.6),lab:V(0,1.5,-.4),
    role:'Gives the pilot a live view. Tilted up about 20° so the picture is level when the drone leans forward in flight.',links:'5V, G and video to the CAM pads on the flight controller.',spec:'19 mm body · 20° uptilt'},
  vtx:{name:'Video transmitter',count:1,build:buildVTX,where:'in the centre of the rear bay, antenna out the back',ex:V(0,.3,2.6),lab:V(0,1.1,0),
    role:'Broadcasts the camera image to the pilot’s goggles or screen.',links:'9 V, G and video from the VTX pad of the flight controller. Never power it without its antenna.',spec:'5.8 GHz band · 25 to 400 mW'},
  rx:{name:'Radio receiver',count:1,build:buildRX,where:'in the rear bay on the left, antennas out the back',ex:V(-1.6,.3,2),lab:V(-.6,.9,0),
    role:'Receives stick commands from the pilot’s handheld radio.',links:'5V, G, TX and RX to UART 1 on the flight controller.',spec:'2.4 GHz · two antennas at 90° for better reception'},
  gpsMount:{name:'GPS mount',count:1,build:buildGpsMount,where:'at the rear of the top plate, behind the battery',ex:V(0,2.5,1.5),lab:V(1.9,1.6,.4),
    role:'A printed TPU tower that lifts the GPS above the battery and away from the power wires. Carbon fibre and the battery block satellite signals, and the current in the power wires disturbs the compass.',links:'Stands on the top plate between the rear standoffs. The GPS sticks to its platform with double-sided foam tape.',spec:'TPU (soft printed plastic): it bends in a crash instead of snapping'},
  gps:{name:'GPS module',count:1,build:buildGPS,where:'on the platform of the GPS mount, arrow to the front',ex:V(0,6,2.5),lab:V(0,1.2,0),
    role:'Reports position and speed from satellites; its built-in compass gives the heading. Enables position hold and return-to-home.',links:'5V, G, TX and RX to UART 3 on the flight controller.',spec:'Ceramic patch antenna facing the sky · the arrow on top points to the front'},
  camMount:{name:'Camera mount',count:1,build:buildCamMount,where:'over the camera cage, its cheeks outside the side plates',ex:V(0,.2,-4.6),lab:V(0,-1.5,-1.8),
    role:'TPU cheeks reach past the lens, so in a crash the soft mount hits the ground first, not the camera. The tick marks on its side show the camera uptilt in 10° steps.',links:'Slides over the camera side plates; the camera screws pass through it. A chin bar under the lens joins the two sides.',spec:'TPU · angle marks from 0° to 40°'},
  cap:{name:'Capacitor',count:1,build:buildCap,where:'in the rear bay on the right, next to the ESC battery pads',ex:V(1.5,.3,1.4),lab:V(.6,.8,0),
    role:'Absorbs voltage spikes created when the ESC switches the motors. Protects the electronics and cleans up the video.',links:'Across the ESC battery pads: + to +, striped leg (−) to −.',spec:'Low-ESR electrolytic · 35 V · 1000 µF'},
  lead:{name:'Battery lead',count:1,build:buildLead,where:'at the rear exit so the connector hangs out the back',ex:V(.8,.2,2.6),lab:V(.5,.9,1),
    role:'Thick power cable from the battery connector to the ESC.',links:'Red to ESC +, black to ESC −.',spec:'12 AWG silicone wire'},
  battery:{name:'LiPo battery',count:1,build:buildBattery,where:'on the rubber pad on the top plate, between the strap slots',ex:V(0,7,0),lab:V(0,3.2,0),
    role:'Stores the energy. Four lithium-polymer cells in series.',links:'Plugs into the battery lead connector at the rear. Two straps hold it down.',spec:'4S · 14.8 V nominal, 16.8 V full · 1300 mAh'},
  strap:{name:'Battery strap',count:2,build:buildStrap,where:'over the battery, through a pair of slots in the top plate',ex:V(0,8.6,0),lab:V(-2.4,2.2,0),
    role:'Holds the battery down. It is the heaviest part, so in a hard turn or a crash an unstrapped battery flies off and rips out the power cable.',links:'Threads down through two slots in the top plate, under the plate, up over the battery, and closes with a buckle. The red rubber side faces the battery so it cannot slide.',spec:'Velcro with an anti-slip rubber face · 20 × 250 mm · two per battery'},
  propCW:{name:'Propeller, CW',count:2,build:()=>buildProp('CW'),where:'on a motor that spins clockwise',lab:V(0,.9,0),
    role:'Shaped to push air down while turning clockwise, seen from above.',links:'Fits motors that spin clockwise.',spec:'5 inch (127 mm) · three blades'},
  propCCW:{name:'Propeller, CCW',count:2,build:()=>buildProp('CCW'),where:'on a motor that spins counter-clockwise',lab:V(0,.9,0),
    role:'Mirror image of the CW prop. Pushes air down while turning counter-clockwise.',links:'Fits motors that spin counter-clockwise.',spec:'5 inch (127 mm) · three blades'},
  frame:{name:'Carbon X frame',role:'Holds everything in place. Arms carry the motors; the plates and standoffs hold the electronics stack and battery.',links:'Motors bolt to the arm tips; the stack sits on 30.5 mm standoffs.',spec:'250 mm wheelbase (motor to motor, diagonal) · 4.5 mm arms'}
};
TYPES.motor.lab=V(0,2.6,0);

/* model 2 (cinematic deadcat): same build stages, different parts. Keys stay the same where the job is the same */
if(CINE){
  const T=(k,o)=>Object.assign(TYPES[k],o);
  T('plateB',{lab:V(0,.5,-5.4),role:'The base of the frame. On this deadcat frame it is wider, so the front arms can sweep out to the sides.',spec:'2.5 mm carbon fibre · deadcat layout'});
  T('arm',{where:'on the bottom plate: the two front arms sweep out to the sides, the two rear arms point back',
    role:'Carries a motor at its tip. On a deadcat frame the front arms are swept out to the sides, so the propellers stay out of the camera’s view and the footage is clean.',
    spec:'6 mm carbon · thicker arms take crash loads from a heavier drone'});
  T('aluSt',{role:'Spacer posts that hold the top plate 30 mm above the bottom plate. The side panels clip to them.'});
  T('camPlate',{name:'Camera cage plate',role:'Aluminium side plates that form the camera cage. Aluminium survives crashes better than thin carbon and pulls heat away from the camera.',links:'The HD camera mounts between them with two M2 × 5 screws.',spec:'CNC aluminium · fits a 19 mm camera'});
  T('tplate',{lab:V(0,.5,-5),role:'Closes the frame. Carries the battery on a rubber pad in the middle and a TPU mount for the action camera at the front.',links:'Six M3 × 6 screws into the standoffs. Two pairs of slots take the battery straps; the GPS mount sits at the rear.',spec:'2.5 mm carbon · TPU mounts (soft plastic) soak up vibration'});
  T('motor',{spec:'2306 size (23 mm stator, 6 mm tall) · 1880 KV, made for 6S batteries'});
  T('esc',{spec:'30.5 × 30.5 mm mounting · about 55 A per motor · 3–6S'});
  T('fc',{links:'ESC harness, receiver (UART 1), digital video unit (UART 2), GPS (UART 3), LED strip (LED pad).'});
  T('camera',{name:'HD camera',ex:V(0,.4,-2.6),
    role:'A digital camera that gives the pilot a sharp, high-definition picture. Its video goes through a thin coaxial cable straight to the digital video unit, not through the flight controller.',
    links:'Coax cable to the digital video unit (it comes fitted to the video unit). Two M2 × 5 screws into the cage.',spec:'19 mm body · digital HD sensor · 20° uptilt'});
  T('vtx',{name:'Digital video unit',where:'in the centre of the rear bay, antennas out the back',ex:V(0,.3,2.8),lab:V(0,1.4,0),
    role:'Turns the HD camera picture into a digital radio signal for the pilot’s goggles, with very little delay. It also records the flight in HD.',
    links:'9 V and G for power, and TX/RX to UART 2 on the flight controller so the flight data shows in the goggles. Never power it without its antennas.',
    spec:'5.8 GHz digital · two antennas · aluminium heatsink'});
  T('gps',{ex:V(0,5,2.5),spec:'Mounted on top, clear of the carbon plate, which blocks satellite signals'});
  T('cap',{role:'Absorbs voltage spikes created when the ESC switches the motors. On 6S the spikes are bigger, so it matters even more.',spec:'Low-ESR electrolytic · 50 V · 1000 µF'});
  T('battery',{ex:V(0,6,0),role:'Stores the energy. Six lithium-polymer cells in series: higher voltage gives the heavier cinematic drone more power for the same current.',spec:'6S · 22.2 V nominal, 25.2 V full · 1100 mAh'});
  T('propCW',{spec:'5.1 inch (130 mm) · three blades'}); T('propCCW',{spec:'5.1 inch (130 mm) · three blades'});
  T('frame',{name:'Carbon deadcat frame',role:'Holds everything in place. The front arms are swept out to the sides (a “deadcat” layout) so no propeller appears in the camera picture.',links:'Motors bolt to the arm tips; the stack sits on 30.5 mm standoffs; clear panels close the sides.',spec:'About 228 mm motor to motor (diagonal) · 6 mm arms · deadcat layout'});
  TYPES.panel={name:'Side panel',count:2,build:buildPanel,where:'on the left and right sides of the frame, between the plates',lab:V(0,1.8,-3.5),
    role:'Clear panels close the sides of the frame. They keep grass and dirt out of the electronics and let the LED strip shine through.',links:'Clip onto the three aluminium standoffs on that side.',spec:'Clear polycarbonate'};
  TYPES.led={name:'LED strip',count:1,build:buildLED,where:'on the inside of the right side panel',ex:V(2.4,0,0),lab:V(0,.6,-2),
    role:'Bright LEDs behind the clear panel. They show the flight mode and low-battery warnings, and help you see which way the drone is facing.',
    links:'5V, G and a data wire (DIN) to the 5V, G and LED pads at the front of the flight controller.',spec:'Addressable RGB LEDs · 5 V'};
  TYPES.actionCam={name:'Action camera',count:1,build:buildActionCam,where:'in the TPU mount at the front of the top plate',ex:V(0,5,-1.5),lab:V(0,4.6,0),
    role:'Records the smooth, high-quality cinematic footage. The HD camera is for the pilot; this camera is for the film.',
    links:'Clamps into the TPU prongs on the top plate. It has its own battery, so it has no wires to the drone.',spec:'Tilted up about 15° · the soft TPU mount stops vibration reaching the picture'};
}
/* model 3 (enterprise) has its own catalogue of sealed modules */
if(EX){ for(const k in TYPES) delete TYPES[k]; Object.assign(TYPES,EX_TYPES); }
export const PROP_Y=EX?EX_PROP_Y:MODEL.armT+1.45*(CINE?1.1:1);  // top of the motor shaft, where the prop sits

/* hotspots: where parts go (positions in drone coordinates) */
const AX=MODEL.alu;
export const ALU_POS=[[-AX,-4],[AX,-4],[-AX,0],[AX,0],[-AX,4.2],[AX,4.2]];
export const NYL_POS=[[-1.525,-1.525],[1.525,-1.525],[-1.525,1.525],[1.525,1.525]];
const PLATE_TOP=3.4+PLATE_T, GPS_MOUNT=CINE?V(0,PLATE_TOP,5):V(0,PLATE_TOP,4.05);
export const HOT=EX?exHot():[
  {id:'bplate',type:'plateB',stage:'frame',pos:V(0,.05,.25),label:'Centre of the mat',mk:V(0,.3,0)},
  ...[1,2,3,4].map(n=>({id:'arm'+n,type:'arm',stage:'frame',pos:V(0,0,0),rotY:ARM_ANG[n]*DEG,motor:n,requires:'bplate',label:'Corner '+n,mk:armPos(n,7).setY(.6)})),
  ...NYL_POS.map(([x,z],i)=>({id:'nyl'+(i+1),type:'nylSt',stage:'frame',pos:V(x,1.375,z),requires:'bplate',label:'Centre hole',mk:V(0,-.8,0)})),
  ...ALU_POS.map(([x,z],i)=>({id:'alu'+(i+1),type:'aluSt',stage:'frame',pos:V(x,1.925,z),requires:'bplate',label:'Edge hole',mk:V(0,-1.2,0)})),
  ...[-1.13,1.13].map((x,i)=>({id:'cpl'+(i+1),type:'camPlate',stage:'frame',pos:V(x,1.925,-4.3),requires:'bplate',label:'Front edge',mk:V(0,0,0)})),
  {id:'tplate',type:'tplate',stage:'frame',pos:V(0,3.4,0),requires:ALU_POS.map((_,i)=>'alu'+(i+1)),label:'On the standoffs',mk:V(0,.3,0)},
  ...(CINE?[-1,1].map((s,i)=>({id:'pnl'+(i+1),type:'panel',stage:'frame',pos:V(s*3.25,1.98,.3),requires:[1,3,5].map(k=>'alu'+(k+(s>0?1:0))),label:(s<0?'Left':'Right')+' side',mk:V(s*.3,0,0)})):[]),
  ...[1,2,3,4].map(n=>({id:'mot'+n,type:'motor',stage:'mount',pos:armPos(n).setY(MODEL.armT),rotY:ARM_ANG[n]*DEG,motor:n,requires:'arm'+n,label:'Arm tip '+n,mk:V(0,.8,0)})),
  {id:'esc',type:'esc',stage:'mount',pos:V(0,1.0,0),requires:['nyl1','nyl2','nyl3','nyl4'],label:'Stack, lower level',mk:V(0,.25,0)},
  {id:'fc',type:'fc',stage:'mount',pos:V(0,2.05,0),label:'Stack, upper level',requires:'esc',mk:V(0,.25,0)},
  {id:'cam',type:'camera',stage:'mount',pos:V(0,1.95,-4.3),rotX:.35,requires:['cpl1','cpl2'],label:'Front cage',mk:V(0,0,0)},
  {id:'vtx',type:'vtx',stage:'mount',pos:V(0,.5,CINE?3.5:3.4),label:'Rear bay, centre',mk:V(0,.35,0)},
  {id:'rx',type:'rx',stage:'mount',pos:V(-1.9,.45,4.4),label:'Rear bay, left',mk:V(0,.25,0)},
  {id:'camMount',type:'camMount',stage:'mount',pos:V(0,1.925,-4.3),requires:'cam',label:'Over the camera',mk:V(0,-1.1,-1.8)},
  {id:'gpsMount',type:'gpsMount',stage:'mount',pos:GPS_MOUNT,requires:'tplate',label:'Top plate, rear',mk:V(0,.4,0)},
  {id:'gps',type:'gps',stage:'mount',pos:GPS_MOUNT.clone().add(GPS_TOP),requires:'gpsMount',label:'GPS mount platform',mk:V(0,.35,0)},
  {id:'cap',type:'cap',stage:'mount',pos:V(1.95,.75,3.1),label:'Rear bay, right',mk:V(0,0,0)},
  {id:'lead',type:'lead',stage:'mount',pos:V(1.1,.7,5.0),label:'Rear exit',mk:V(0,0,.5)},
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
  {key:'frame',title:'Build the frame',short:'Frame',goal:'Assemble the frame from bare carbon parts and screw it together.'},
  {key:'mount',title:'Mount the components',short:'Mount',goal:'Drag each part onto the frame, then fasten it with the right screws.'},
  {key:'wire',title:'Wire the electronics',short:'Wire',goal:'Solder every wire end to the correct pad. Drag from a wire end to a pad.'},
  {key:'power',title:'Power-up and motor test',short:'Test',goal:'Fit and strap down the battery, then check each motor spins the right way.'},
  {key:'props',title:'Fit the propellers',short:'Props',goal:'Fit a CW or CCW propeller to each motor to match its spin.'},
  {key:'fly',title:'Flight physics',short:'Fly',goal:'Fly the finished drone and watch how motor speeds create every movement.'},
  {key:'quiz',title:'Knowledge check',short:'Check',goal:CINE?'Eleven questions on what you just built.':'Eight questions on what you just built.'},
];
export const SEC={frame:15,mount:20,wire:30,test:10,props:10,quiz:15};
export const SECNAME={frame:'Frame assembly',mount:'Component mounting',wire:'Wiring and soldering',test:'Power-up and motor test',props:'Propellers',quiz:'Knowledge check'};
