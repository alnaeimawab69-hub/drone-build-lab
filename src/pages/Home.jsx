import SiteHeader from '../components/SiteHeader.jsx';
import Icon from '../components/Icon.jsx';
import lab3d from '../assets/img/lab-3d.png';
import wiringDiagram from '../assets/img/wiring-diagram.png';
import cadView from '../assets/img/cad-view.png';

const STAGES = [
  ['Build the frame', 'Bottom plate, four arms, stack and aluminium standoffs, camera side plates and top plate. Arms take M3 × 10 screws; the top plate takes M3 × 6.'],
  ['Mount the components', 'Motors, ESC (electronic speed controller), flight controller with its arrow to the front, FPV camera, VTX (video transmitter), radio receiver, GPS module, capacitor and battery lead. Each part has its own fasteners.'],
  ['Wire the electronics', 'A wiring diagram like a real stack chart. Drag each wire end to its pad. TX (transmit) crosses to RX (receive), polarity matters, and 5 V and 9 V pads are not the same.'],
  ['Power-up and motor test', 'Fit and strap the LiPo battery. Confirm the propellers are off. Spin each motor and fix the reversed one by swapping two of its wires.'],
  ['Fit the propellers', 'CW (clockwise) propellers on CW motors, CCW on CCW. A mismatch would flip the drone, so it is caught before take-off.'],
  ['Flight physics', 'Take off, pitch, roll and yaw. Thrust arrows, motor bars and airflow show how four motor speeds create all six degrees of freedom.'],
  ['Knowledge check', 'Eight questions (eleven for the cinematic drone) on what was just built. Then a scored report that explains every mistake.'],
];

const MODES = [
  ['learn', 'Guided', 'Practice', 'Green rings and pads show where each part, screw and wire goes. Every mistake comes with an explanation. “Show me” completes any stage as a demonstration.'],
  ['assess', 'Scored', 'Assessment', 'No hints, and a running timer. Wrong parts, screws and wires cost points. The report shows the score for each stage and lists what to review.'],
  ['explore', 'Free', 'Explore', 'Start with the finished drone. Pull it apart in exploded view, read what each part does and how it connects, then fly it.'],
  ['moves', '3D animation', 'Movements', 'Learn throttle, yaw, pitch and roll with a remote: on-screen sticks, the keyboard (WASD and arrow keys) or a USB radio or gamepad. Rotation axes, spin arrows, force arrows and motor bars show what each stick does. Ends with a short quiz.'],
];

function Feature({ eyebrow, title, img, alt, flip, children }) {
  return (
    <div className={flip ? 'feature flip' : 'feature'}>
      <div className="text">
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <ul>{children}</ul>
      </div>
      <div className="shot"><img src={img} alt={alt} width="1400" height="900" loading="lazy" /></div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader current="index.html" />
      <main id="main">
        <section className="hero">
          <div className="wrap grid">
            <div>
              <div className="eyebrow">Digital lab · Drone fundamentals</div>
              <h1>From bare carbon to first flight.</h1>
              <p className="lede">Students build a quadcopter in the browser: a 250 mm trainer quad or a 5-inch cinematic FPV (first-person view) drone. They screw the frame together, fasten every part with the right screw and solder 23–24 wires. They test motor direction, fit the propellers, then fly it to see how thrust creates each movement.</p>
              <div className="ctas"><a className="btn primary" href="lab.html">Open the lab <Icon name="arrow" /></a><a className="btn" href="guide.html">Teacher guide</a></div>
              <ul className="facts" aria-label="At a glance"><li><b>7</b> stages</li><li><b>36</b> fasteners</li><li><b>23–24</b> wires</li><li><b>3</b> drone models</li><li><b>5</b> activities</li><li>runs in any modern browser</li></ul>
            </div>
            <div className="shot"><img src={lab3d} alt="The finished quadcopter on the workbench in the 3D lab" width="1400" height="900" /></div>
          </div>
        </section>

        <section className="band" id="stages">
          <div className="wrap">
            <div className="sec-head"><div className="eyebrow">The build</div><h2>Seven stages, in the order a real build happens</h2><p>Each stage unlocks the next. A part cannot go on before the part it attaches to. The propellers always go on last, for safety.</p></div>
            <ol className="stages">
              {STAGES.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}
            </ol>
          </div>
        </section>

        <section id="modes">
          <div className="wrap">
            <div className="sec-head"><div className="eyebrow">Five ways to use it</div><h2>Practise with hints, prove it without them, then find what is wrong</h2></div>
            <div className="modes">
              {MODES.map(([cls, tag, title, text]) => (
                <article key={cls} className={'mode ' + cls}><em>{tag}</em><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="band" id="views">
          <div className="wrap">
            <Feature eyebrow="Wiring" title="A wiring chart students can actually solder" img={wiringDiagram} alt="The 2D wiring diagram with flight controller, ESC and components">
              <li>Flight controller in the centre, every pad labelled, the other parts around it</li>
              <li>Wires drawn in their real colours with right-angle routing</li>
              <li>A wrong pad flashes <span className="mark-bad">✕ WRONG</span> and the wire stays unsoldered</li>
              <li>Switch to the 3D model at any time; both views stay in sync</li>
            </Feature>
            <Feature eyebrow="CAD view" title="Switch the model to a technical drawing" img={cadView} alt="The drone in CAD view with dimension lines and a title block" flip>
              <li>Flat shading with black edge lines</li>
              <li>Dimension lines in millimetres: 250 mm wheelbase, 127 mm props, 30.5 mm stack</li>
              <li>Title block with units, material and the student’s name</li>
            </Feature>
          </div>
        </section>

        <section>
          <div className="wrap center">
            <h2>Ready to build?</h2>
            <p className="lede">Works with a mouse or a touchscreen. Nothing to install, no account needed.</p>
            <a className="btn primary" href="lab.html">Open the lab <Icon name="arrow" /></a>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap"><span>Drone Build Lab · Digital lab for drone fundamentals</span><span>Every part is modelled in code. No brand names, no imported 3D models.</span></div>
      </footer>
    </>
  );
}
