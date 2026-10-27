import SiteHeader from '../components/SiteHeader.jsx';

const TOC = [['outcomes', 'Learning outcomes'], ['session', 'Suggested session'], ['scoring', 'Scoring'], ['fasteners', 'Fasteners'], ['wiring', 'Wiring'], ['motors', 'Motor layout'], ['run', 'Running and hosting']];

const OUTCOMES = [
  'Name the parts of a quadcopter and explain what each one does.',
  'Assemble a frame in the correct order and choose the right fastener for each joint.',
  'Orient the flight controller correctly and explain why the arrow must face forward.',
  'Wire power, ground, serial (TX to RX) and video connections, observing polarity and voltage.',
  'Check motor direction safely with the props off, and correct a reversed motor.',
  'Match CW and CCW propellers to their motors.',
  'Explain how changes in the four motor speeds produce heave, pitch, roll and yaw.',
];

const SCORING = [
  ['1 · Frame assembly', 15, 'Part in the wrong place (−2), wrong screw (−2)'],
  ['2 · Component mounting', 20, 'Wrong place (−2), wrong screw (−2), flight controller not facing forward when moving on (−4)'],
  ['3 · Wiring', 30, 'Each wire dropped on the wrong pad (−2)'],
  ['4 · Power-up and motor test', 10, 'Swapping wires on a motor that was already correct (−4), confirming while a motor is still reversed (−4)'],
  ['5 · Propellers', 10, 'Wrong propeller on a motor (−3)'],
  ['7 · Knowledge check', 15, 'Eight questions, points shared equally'],
];

const FASTENERS = [
  ['Arms to bottom plate', 'M3 × 10', 8, 'Must pass through the arm and the plate and still grip'],
  ['Top plate to standoffs', 'M3 × 6', 6, 'A 10 mm screw bottoms out in the standoff before it clamps'],
  ['Motors to arms (from below)', 'M3 × 6', 16, 'Longer screws touch the copper windings'],
  ['Stack (on top of the flight controller)', 'M3 nylon nut', 4, 'Nylon does not conduct, so it cannot short the boards'],
  ['Camera to side plates', 'M2 × 5', 2, 'Camera mounting holes are M2'],
];

const Dot = ({ c }) => <span className="dot" style={{ background: c }}></span>;
const RED = '#d8453b', BLACK = '#2b2f35', YELLOW = '#e8c33c', BLUE = '#3d9be0', WHITE = '#eee', GREY = '#8a939c';

const MOTORS = [
  ['M1', 'Rear right', 'Clockwise', 'CW'],
  ['M2', 'Front right', 'Counter-clockwise', 'CCW'],
  ['M3', 'Rear left', 'Counter-clockwise', 'CCW'],
  ['M4', 'Front left', 'Clockwise', 'CW'],
];

export default function Guide() {
  return (
    <>
      <SiteHeader current="guide.html" />
      <main>
        <section>
          <div className="wrap prose">
            <div className="eyebrow">Teacher guide</div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,52px)', marginTop: 10 }}>Running the lab in class</h1>
            <p className="lede" style={{ marginTop: 14 }}>Everything you need to set a session: what students learn, how the score is built, and the reference answers for screws, wiring and motor direction.</p>
            <div className="toc">{TOC.map(([id, label]) => <a key={id} href={'#' + id}>{label}</a>)}</div>
          </div>
        </section>

        <section className="band" id="outcomes">
          <div className="wrap prose">
            <h2>Learning outcomes</h2>
            <p>After the lab a student should be able to:</p>
            <ol>{OUTCOMES.map(o => <li key={o}>{o}</li>)}</ol>
          </div>
        </section>

        <section id="session">
          <div className="wrap prose">
            <h2>Suggested session (60–80 minutes)</h2>
            <ol>
              <li><b>Movements (10 min).</b> Before building, open the Movements activity. Students fly the drone with the remote (on-screen sticks, the keyboard, or a USB radio or gamepad), play each of throttle, yaw, pitch and roll, then take the eight-question stick quiz.</li>
              <li><b>Explore (10 min).</b> Open the finished drone, use exploded view and the part labels, read three or four info cards.</li>
              <li><b>Practice (30–40 min).</b> Full build with hints. Encourage students to read the explanation on each mistake rather than retrying blindly.</li>
              <li><b>Assessment (20–30 min).</b> Fresh start, no hints, timed. Students copy the result from the report and paste it into their submission.</li>
            </ol>
            <p>The flight stage is not scored. Use it to discuss Newton’s laws, torque and the six degrees of freedom.</p>
          </div>
        </section>

        <section className="band" id="scoring">
          <div className="wrap">
            <div className="sec-head"><h2>Scoring (assessment mode)</h2><p>Each stage has a fixed number of points. Mistakes subtract from that stage only and never go below zero.</p></div>
            <div className="table-wrap"><table>
              <thead><tr><th>Stage</th><th className="num">Points</th><th>What costs points</th></tr></thead>
              <tbody>
                {SCORING.map(([stage, pts, cost]) => <tr key={stage}><td>{stage}</td><td className="num">{pts}</td><td>{cost}</td></tr>)}
                <tr><td><b>Total</b></td><td className="num"><b>100</b></td><td>Distinction 85+ · Merit 70+ · Pass 50+</td></tr>
              </tbody>
            </table></div>
          </div>
        </section>

        <section id="fasteners">
          <div className="wrap">
            <div className="sec-head"><h2>Fastener reference</h2><p>36 fasteners in total. The motor screw length is the classic mistake: a long screw reaches the windings and shorts the motor.</p></div>
            <div className="table-wrap"><table>
              <thead><tr><th>Joint</th><th>Fastener</th><th className="num">Qty</th><th>Why this one</th></tr></thead>
              <tbody>
                {FASTENERS.map(([joint, f, qty, why]) => <tr key={joint}><td>{joint}</td><td><code>{f}</code></td><td className="num">{qty}</td><td>{why}</td></tr>)}
              </tbody>
            </table></div>
          </div>
        </section>

        <section className="band" id="wiring">
          <div className="wrap">
            <div className="sec-head"><h2>Wiring reference</h2><p>23 wires. Any ground pad is accepted for a ground wire, because all grounds are connected on the board.</p></div>
            <div className="table-wrap"><table>
              <thead><tr><th>From</th><th>Wire</th><th>To</th><th>Key idea</th></tr></thead>
              <tbody>
                <tr><td>Battery lead</td><td><Dot c={RED} />+ · <Dot c={BLACK} />−</td><td>ESC + · ESC −</td><td>Polarity</td></tr>
                <tr><td>Capacitor</td><td><Dot c={RED} />+ · <Dot c={BLACK} />− (striped leg)</td><td>ESC + · ESC −</td><td>Absorbs voltage spikes</td></tr>
                <tr><td>Motors 1–4</td><td><Dot c={GREY} />3 phase wires</td><td>ESC M1–M4</td><td>Each corner has its own output</td></tr>
                <tr><td>ESC</td><td><Dot c="#c9ced3" />harness</td><td>FC ESC socket</td><td>Signals and current sensing</td></tr>
                <tr><td>Radio receiver</td><td>5V · G · <Dot c={BLUE} />TX · <Dot c={WHITE} />RX</td><td>5V · G · <b>R1</b> · <b>T1</b></td><td>TX crosses to RX (UART 1)</td></tr>
                <tr><td>GPS module</td><td>5V · G · <Dot c={BLUE} />TX · <Dot c={WHITE} />RX</td><td>5V · G · <b>R3</b> · <b>T3</b></td><td>TX crosses to RX (UART 3)</td></tr>
                <tr><td>FPV camera</td><td>5V · G · <Dot c={YELLOW} />VID</td><td>5V · G · CAM</td><td>Video goes in on CAM</td></tr>
                <tr><td>Video transmitter</td><td>VIN · G · <Dot c={YELLOW} />VID</td><td><b>9V</b> · G · VTX</td><td>VTX runs on 9 V, not 5 V</td></tr>
              </tbody>
            </table></div>
            <h3 style={{ marginTop: 28 }}>Model 2: CX-5 cinematic FPV (24 wires)</h3>
            <p>Battery lead, capacitor, motors, ESC harness, receiver and GPS are wired as above. The analog camera and VTX are replaced by an HD digital system, and an LED strip is added. The HD camera has no wires to the flight controller: its coax cable goes straight to the digital video unit.</p>
            <div className="table-wrap"><table>
              <thead><tr><th>From</th><th>Wire</th><th>To</th><th>Key idea</th></tr></thead>
              <tbody>
                <tr><td>Digital video unit</td><td>VIN · G · <Dot c={BLUE} />TX · <Dot c={WHITE} />RX</td><td><b>9V</b> · G · <b>R2</b> · <b>T2</b></td><td>On-screen data over UART 2</td></tr>
                <tr><td>LED strip</td><td>5V · G · <Dot c="#4fb06d" />DIN</td><td>5V · G · <b>LED</b></td><td>Data wire goes to the LED pad</td></tr>
              </tbody>
            </table></div>
          </div>
        </section>

        <section id="motors">
          <div className="wrap">
            <div className="sec-head"><h2>Motor layout</h2><p>Seen from above, front at the top. Diagonal motors turn the same way, so their twisting forces cancel in a hover. In each lab one motor starts reversed at random; students find it during the motor test.</p></div>
            <div className="table-wrap"><table>
              <thead><tr><th>Motor</th><th>Corner</th><th>Spins</th><th>Propeller</th></tr></thead>
              <tbody>
                {MOTORS.map(([m, corner, spin, prop]) => <tr key={m}><td>{m}</td><td>{corner}</td><td>{spin}</td><td>{prop}</td></tr>)}
              </tbody>
            </table></div>
            <p>This is <b>props in</b>, the default. Students can choose <b>props out</b> on the start screen: every motor is reversed (M1 and M4 counter-clockwise, M2 and M3 clockwise) and the lab’s layouts, motor test, mixer and quiz follow that choice.</p>
          </div>
        </section>

        <section className="band" id="run">
          <div className="wrap prose">
            <h2>Running and hosting</h2>
            <p>The lab is a website built with React and Vite. Students only need a modern browser; the 3D library is bundled in, and the fonts load from the internet.</p>
            <h3 style={{ marginTop: 22 }}>On one computer</h3>
            <p>Install <a href="https://nodejs.org">Node.js</a>, then in the project folder run:</p>
            <pre>{`npm install
npm run dev`}</pre>
            <p>Open the address it prints (for example <code>http://localhost:5173</code>).</p>
            <h3 style={{ marginTop: 22 }}>For a whole class</h3>
            <ol>
              <li>Run <code>npm run build</code>. The finished site is written to the <code>dist</code> folder.</li>
              <li>Upload the contents of <code>dist</code> to any static host, for example Vercel, Netlify or GitHub Pages.</li>
              <li>Share the address the host gives you, for example <code>{'https://<user>.github.io/DroneBuildLab/'}</code>.</li>
            </ol>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap"><span>Drone Build Lab · Teacher guide</span><a href="lab.html">Open the lab →</a></div>
      </footer>
    </>
  );
}
