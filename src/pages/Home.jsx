import SiteHeader from '../components/SiteHeader.jsx';
import lab3d from '../assets/img/lab-3d.png';
import wiringDiagram from '../assets/img/wiring-diagram.png';
import cadView from '../assets/img/cad-view.png';

const STAGES = [
  ['Build the frame', 'Bottom plate, four arms, stack and aluminium standoffs, camera plates, top plate. Arms take M3 × 10, the top plate M3 × 6.'],
  ['Mount the components', 'Motors, ESC, flight controller (arrow to the front), camera, VTX, receiver, GPS, capacitor and battery lead, each with its own fasteners.'],
  ['Wire the electronics', 'A wiring diagram like a real stack chart. Drag each wire end to its pad: TX crosses to RX, polarity matters, 5 V and 9 V are not the same.'],
  ['Power-up and motor test', 'Fit the battery, confirm the props are off, spin each motor and fix the one that turns the wrong way by swapping two wires.'],
  ['Fit the propellers', 'CW props on CW motors, CCW on CCW. A mismatch is caught before take-off.'],
  ['Flight physics', 'Take off, pitch, roll and yaw. Thrust arrows, motor bars and airflow show how six degrees of freedom come from four motor speeds.'],
  ['Knowledge check', 'Eight questions on what was just built, then a scored report with every mistake explained.'],
];

const MODES = [
  ['learn', 'Guided', 'Practice', 'Green rings and pads show where each part, screw and wire goes. Every mistake comes with an explanation, and “Show me” completes any stage as a demonstration.'],
  ['assess', 'Scored', 'Assessment', 'No hints and a running timer. Wrong parts, screws and wires cost points. The report breaks the score down by stage and lists what to review.'],
  ['explore', 'Free', 'Explore', 'Start with the finished drone. Pull it apart in exploded view, read what each part does and how it connects, then fly it.'],
  ['moves', '3D animation', 'Movements', 'Learn throttle, yaw, pitch and roll. Two on-screen transmitter sticks fly the drone; rotation axes, thrust arrows and motor bars show what each stick does. Ends with a quick quiz.'],
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
      <main>
        <section className="hero">
          <div className="wrap grid">
            <div>
              <div className="eyebrow">Digital lab · Drone fundamentals</div>
              <h1>From bare carbon to first flight.</h1>
              <p className="lede">Students build a quadcopter in the browser, choosing a 250 mm trainer quad or a 5-inch cinematic FPV drone: bolt the frame together, mount and fasten every component with the right screw, solder 23 wires, test motor direction, fit the propellers and fly it to see how thrust creates each movement.</p>
              <div className="ctas"><a className="btn primary" href="lab.html">Open the lab →</a><a className="btn" href="guide.html">Teacher guide</a></div>
              <div className="facts"><span><b>7</b> stages</span><span><b>36</b> fasteners</span><span><b>23–24</b> wires</span><span><b>2</b> drone models</span><span><b>4</b> activities</span><span>runs in any modern browser</span></div>
            </div>
            <div className="shot"><img src={lab3d} alt="The finished quadcopter on the workbench in the 3D lab" width="1400" height="900" /></div>
          </div>
        </section>

        <section className="band" id="stages">
          <div className="wrap">
            <div className="sec-head"><div className="eyebrow">The build</div><h2>Seven stages, in the order a real build happens</h2><p>Each stage unlocks the next. A part cannot go on before the part it attaches to, and the propellers always go on last.</p></div>
            <ol className="stages">
              {STAGES.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}
            </ol>
          </div>
        </section>

        <section id="modes">
          <div className="wrap">
            <div className="sec-head"><div className="eyebrow">Four ways to use it</div><h2>Practise with hints, then prove it without them</h2></div>
            <div className="modes">
              {MODES.map(([cls, tag, title, text]) => (
                <div key={cls} className={'mode ' + cls}><em>{tag}</em><h3>{title}</h3><p>{text}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="band" id="views">
          <div className="wrap">
            <Feature eyebrow="Wiring" title="A wiring chart students can actually solder" img={wiringDiagram} alt="The 2D wiring diagram with flight controller, ESC and components">
              <li>Flight controller in the centre, every pad labelled, components around it</li>
              <li>Wires drawn in their real colours with right-angle routing</li>
              <li>A wrong pad flashes <b style={{ color: '#ec6a5e' }}>✕ WRONG</b> and the wire stays unsoldered</li>
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
          <div className="wrap" style={{ textAlign: 'center' }}>
            <h2>Ready to build?</h2>
            <p className="lede" style={{ margin: '12px auto 24px' }}>Works with a mouse or a touchscreen. No install, no account.</p>
            <a className="btn primary" href="lab.html">Open the lab →</a>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap"><span>Drone Build Lab · Digital lab for drone fundamentals</span><span>Every part is modelled in code. No brand names, no imported 3D models.</span></div>
      </footer>
    </>
  );
}
