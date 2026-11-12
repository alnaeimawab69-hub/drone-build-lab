import SiteHeader from '../components/SiteHeader.jsx';
import Icon from '../components/Icon.jsx';
import { tr } from '../lang.js';

const TOC = [['outcomes', tr('Learning outcomes', 'Hasil pembelajaran')], ['session', tr('Suggested session', 'Cadangan sesi')], ['scoring', tr('Scoring', 'Pemarkahan')], ['fasteners', tr('Fasteners', 'Pengikat')], ['wiring', tr('Wiring', 'Pendawaian')], ['motors', tr('Motor layout', 'Susun atur motor')], ['run', tr('Running and hosting', 'Menjalankan dan mengehos')]];

const OUTCOMES = [
  tr('Name the parts of a quadcopter and explain what each one does.', 'Menamakan bahagian quadcopter dan menerangkan fungsi setiap satu.'),
  tr('Assemble a frame in the correct order and choose the right fastener for each joint.', 'Memasang rangka mengikut susunan yang betul dan memilih pengikat yang betul bagi setiap sambungan.'),
  tr('Fit the flight controller (FC) the right way round and explain why its arrow must point forward.', 'Memasang pengawal penerbangan (FC) pada arah yang betul dan menerangkan mengapa anak panahnya mesti menghala ke depan.'),
  tr('Wire power, ground, serial (TX to RX) and video connections with the right polarity and voltage.', 'Mendawai sambungan kuasa, bumi, bersiri (TX ke RX) dan video dengan kekutuban dan voltan yang betul.'),
  tr('Check motor direction safely with the propellers off, and correct a reversed motor.', 'Menyemak arah motor dengan selamat tanpa kipas, dan membetulkan motor yang terbalik.'),
  tr('Match CW (clockwise) and CCW (counter-clockwise) propellers to their motors.', 'Memadankan kipas CW (ikut arah jam) dan CCW (lawan arah jam) dengan motornya.'),
  tr('Explain how changes in the four motor speeds produce heave, pitch, roll and yaw.', 'Menerangkan bagaimana perubahan kelajuan empat motor menghasilkan heave, pitch, roll dan yaw.'),
];

const SCORING = [
  [tr('1 · Frame assembly', '1 · Pemasangan rangka'), 15, tr('Part in the wrong place (−2), wrong screw (−2)', 'Bahagian di tempat yang salah (−2), skru yang salah (−2)')],
  [tr('2 · Component mounting', '2 · Pemasangan komponen'), 20, tr('Wrong place (−2), wrong screw (−2), flight controller not facing forward when moving on (−4)', 'Tempat yang salah (−2), skru yang salah (−2), pengawal penerbangan tidak menghala ke depan semasa meneruskan (−4)')],
  [tr('3 · Wiring', '3 · Pendawaian'), 30, tr('Each wire dropped on the wrong pad (−2)', 'Setiap wayar yang dilepaskan pada pad yang salah (−2)')],
  [tr('4 · Power-up and motor test', '4 · Hidupkan kuasa dan uji motor'), 10, tr('Swapping wires on a motor that was already correct (−4), confirming while a motor still spins the wrong way (−4)', 'Menukar wayar pada motor yang sudah betul (−4), mengesahkan semasa motor masih berputar ke arah yang salah (−4)')],
  [tr('5 · Propellers', '5 · Kipas'), 10, tr('Wrong propeller on a motor (−3)', 'Kipas yang salah pada motor (−3)')],
  [tr('7 · Knowledge check', '7 · Semakan pengetahuan'), 15, tr('8 questions on the LX-250, 11 on the CX-5, points shared equally', '8 soalan untuk LX-250, 11 untuk CX-5, markah dibahagi sama rata')],
];

const FASTENERS = [
  [tr('Arms to bottom plate', 'Lengan ke plat bawah'), 'M3 × 10', 8, tr('Must pass through the arm and the plate and still grip', 'Mesti menembusi lengan dan plat dan masih mencengkam')],
  [tr('Top plate to standoffs', 'Plat atas ke tiang'), 'M3 × 6', 6, tr('A 10 mm screw hits the bottom of the standoff before it clamps', 'Skru 10 mm mencecah dasar tiang sebelum ia mengapit')],
  [tr('Motors to arms (from below)', 'Motor ke lengan (dari bawah)'), 'M3 × 6', 16, tr('A longer screw reaches the copper windings and shorts the motor', 'Skru yang lebih panjang mencecah belitan kuprum dan membuat litar pintas pada motor')],
  [tr('Stack (on top of the flight controller)', 'Tindanan (di atas pengawal penerbangan)'), tr('M3 nylon nut', 'Nat nilon M3'), 4, tr('Nylon does not conduct, so it cannot short the boards', 'Nilon tidak mengalirkan elektrik, jadi ia tidak boleh membuat litar pintas pada papan')],
  [tr('Camera to side plates', 'Kamera ke plat sisi'), 'M2 × 5', 2, tr('Camera mounting holes are M2', 'Lubang pemasangan kamera bersaiz M2')],
];

const Dot = ({ c }) => <span className="dot" style={{ background: c }}></span>;
const RED = '#d8453b', BLACK = '#2b2f35', YELLOW = '#e8c33c', GREEN = '#34a853', WHITE = '#eee', GREY = '#8a939c';

const MOTORS = [
  ['M1', tr('Rear right', 'Belakang kanan'), tr('Clockwise', 'Ikut arah jam'), 'CW'],
  ['M2', tr('Front right', 'Depan kanan'), tr('Counter-clockwise', 'Lawan arah jam'), 'CCW'],
  ['M3', tr('Rear left', 'Belakang kiri'), tr('Counter-clockwise', 'Lawan arah jam'), 'CCW'],
  ['M4', tr('Front left', 'Depan kiri'), tr('Clockwise', 'Ikut arah jam'), 'CW'],
];

const WIRE_HEAD = <thead><tr><th>{tr('From', 'Dari')}</th><th>{tr('Wire', 'Wayar')}</th><th>{tr('To', 'Ke')}</th><th>{tr('Key idea', 'Idea utama')}</th></tr></thead>;

export default function Guide() {
  return (
    <>
      <SiteHeader current="guide.html" />
      <main id="main">
        <section>
          <div className="wrap prose">
            <div className="eyebrow">{tr('Teacher guide', 'Panduan guru')}</div>
            <h1 className="page-title">{tr('Running the lab in class', 'Menjalankan makmal di dalam kelas')}</h1>
            <p className="lede">{tr('Everything you need to set a session: what students learn, how the score is built, and the reference answers for screws, wiring and motor direction.', 'Semua yang anda perlukan untuk menetapkan sesi: apa yang pelajar pelajari, bagaimana markah dikira, dan jawapan rujukan untuk skru, pendawaian dan arah motor.')}</p>
            <nav className="toc" aria-label={tr('On this page', 'Dalam halaman ini')}>{TOC.map(([id, label]) => <a key={id} href={'#' + id}>{label}</a>)}</nav>
          </div>
        </section>

        <section className="band" id="outcomes">
          <div className="wrap prose">
            <h2>{tr('Learning outcomes', 'Hasil pembelajaran')}</h2>
            <p>{tr('After the lab a student should be able to:', 'Selepas makmal ini, pelajar sepatutnya dapat:')}</p>
            <ol>{OUTCOMES.map(o => <li key={o}>{o}</li>)}</ol>
          </div>
        </section>

        <section id="session">
          <div className="wrap prose">
            <h2>{tr('Suggested session (60–80 minutes)', 'Cadangan sesi (60–80 minit)')}</h2>
            <ol>
              <li>{tr(<><b>Movements (10 min).</b> Before building, open the Movements activity. Students fly the drone with the remote (on-screen sticks, the keyboard, or a USB radio or gamepad), play each of throttle, yaw, pitch and roll, then take the eight-question stick quiz.</>, <><b>Pergerakan (10 minit).</b> Sebelum membina, buka aktiviti Pergerakan. Pelajar menerbangkan dron dengan alat kawalan jauh (kayu kawalan pada skrin, papan kekunci, atau radio USB atau gamepad), memainkan setiap satu daripada throttle, yaw, pitch dan roll, kemudian menjawab kuiz kayu kawalan lapan soalan.</>)}</li>
              <li>{tr(<><b>Explore (10 min).</b> Open the finished drone. Use exploded view and the part labels. Read three or four info cards.</>, <><b>Teroka (10 minit).</b> Buka dron yang sudah siap. Gunakan paparan leraian dan label bahagian. Baca tiga atau empat kad maklumat.</>)}</li>
              <li>{tr(<><b>Practice (30–40 min).</b> Full build with hints. Ask students to read the explanation for each mistake, not just try again.</>, <><b>Latihan (30–40 minit).</b> Binaan penuh dengan petunjuk. Minta pelajar membaca penerangan bagi setiap kesilapan, bukan sekadar mencuba lagi.</>)}</li>
              <li>{tr(<><b>Assessment (20–30 min).</b> Fresh start, no hints, timed. The report at the end shows the score out of 100, the grade and every mistake.</>, <><b>Penilaian (20–30 minit).</b> Mula semula, tiada petunjuk, bermasa. Laporan di akhir menunjukkan markah daripada 100, gred dan setiap kesilapan.</>)}</li>
            </ol>
            <p>{tr('The flight stage is not scored. Use it to discuss Newton’s laws, torque and the six degrees of freedom.', 'Peringkat penerbangan tidak bermarkah. Gunakannya untuk membincangkan hukum Newton, tork dan enam darjah kebebasan.')}</p>
          </div>
        </section>

        <section className="band" id="scoring">
          <div className="wrap">
            <div className="sec-head"><h2>{tr('Scoring (assessment mode)', 'Pemarkahan (mod penilaian)')}</h2><p>{tr('Each stage has a fixed number of points. Mistakes subtract from that stage only and never go below zero.', 'Setiap peringkat mempunyai bilangan markah yang tetap. Kesilapan hanya ditolak daripada peringkat itu dan tidak akan kurang daripada sifar.')}</p></div>
            <div className="table-wrap" role="region" aria-label={tr('Scoring by stage', 'Pemarkahan mengikut peringkat')} tabIndex={0}><table>
              <thead><tr><th>{tr('Stage', 'Peringkat')}</th><th className="num">{tr('Points', 'Markah')}</th><th>{tr('What costs points', 'Perkara yang ditolak markah')}</th></tr></thead>
              <tbody>
                {SCORING.map(([stage, pts, cost]) => <tr key={stage}><td>{stage}</td><td className="num">{pts}</td><td>{cost}</td></tr>)}
                <tr className="total"><td><b>{tr('Total', 'Jumlah')}</b></td><td className="num"><b>100</b></td><td>{tr('Distinction 85+ · Merit 70+ · Pass 50+', 'Cemerlang 85+ · Kepujian 70+ · Lulus 50+')}</td></tr>
              </tbody>
            </table></div>
          </div>
        </section>

        <section id="fasteners">
          <div className="wrap">
            <div className="sec-head"><h2>{tr('Fastener reference', 'Rujukan pengikat')}</h2><p>{tr('36 fasteners in total. The motor screw length is the classic mistake: a long screw reaches the windings and shorts the motor.', 'Sejumlah 36 pengikat. Panjang skru motor ialah kesilapan biasa: skru yang panjang mencecah belitan dan membuat litar pintas pada motor.')}</p></div>
            <div className="table-wrap" role="region" aria-label={tr('Fastener reference', 'Rujukan pengikat')} tabIndex={0}><table>
              <thead><tr><th>{tr('Joint', 'Sambungan')}</th><th>{tr('Fastener', 'Pengikat')}</th><th className="num">{tr('Qty', 'Kuantiti')}</th><th>{tr('Why this one', 'Mengapa yang ini')}</th></tr></thead>
              <tbody>
                {FASTENERS.map(([joint, f, qty, why]) => <tr key={joint}><td>{joint}</td><td><code>{f}</code></td><td className="num">{qty}</td><td>{why}</td></tr>)}
              </tbody>
            </table></div>
          </div>
        </section>

        <section className="band" id="wiring">
          <div className="wrap">
            <div className="sec-head"><h2>{tr('Wiring reference', 'Rujukan pendawaian')}</h2><p>{tr('23 wires on model 1. Any ground (G) pad is accepted for a ground wire, because all grounds are connected on the board. FC = flight controller, ESC = electronic speed controller, VTX = video transmitter, UART = serial port.', '23 wayar pada model 1. Mana-mana pad bumi (G) diterima untuk wayar bumi, kerana semua bumi bersambung pada papan. FC = pengawal penerbangan, ESC = pengawal kelajuan elektronik, VTX = pemancar video, UART = port bersiri.')}</p></div>
            <div className="table-wrap" role="region" aria-label={tr('Wiring reference, model 1', 'Rujukan pendawaian, model 1')} tabIndex={0}><table>
              {WIRE_HEAD}
              <tbody>
                <tr><td>{tr('Battery lead', 'Kabel bateri')}</td><td><Dot c={RED} />+ · <Dot c={BLACK} />−</td><td>ESC + · ESC −</td><td>{tr('Polarity', 'Kekutuban')}</td></tr>
                <tr><td>{tr('Capacitor', 'Kapasitor')}</td><td><Dot c={RED} />+ · <Dot c={BLACK} />− {tr('(striped leg)', '(kaki berjalur)')}</td><td>ESC + · ESC −</td><td>{tr('Absorbs voltage spikes', 'Menyerap lonjakan voltan')}</td></tr>
                <tr><td>{tr('Motors 1–4', 'Motor 1–4')}</td><td><Dot c={GREY} />{tr('3 phase wires', '3 wayar fasa')}</td><td>ESC M1–M4</td><td>{tr('Each corner has its own output', 'Setiap penjuru mempunyai keluarannya sendiri')}</td></tr>
                <tr><td>ESC</td><td><Dot c="#c9ced3" />{tr('harness', 'abah-abah')}</td><td>{tr('FC ESC socket', 'Soket ESC FC')}</td><td>{tr('Signals and current sensing', 'Isyarat dan penderiaan arus')}</td></tr>
                <tr><td>{tr('Radio receiver', 'Penerima radio')}</td><td>5V · G · <Dot c={GREEN} />TX · <Dot c={WHITE} />RX</td><td>5V · G · <b>R1</b> · <b>T1</b></td><td>{tr('TX crosses to RX (UART 1)', 'TX bersilang ke RX (UART 1)')}</td></tr>
                <tr><td>{tr('GPS module', 'Modul GPS')}</td><td>5V · G · <Dot c={GREEN} />TX · <Dot c={WHITE} />RX</td><td>5V · G · <b>R3</b> · <b>T3</b></td><td>{tr('TX crosses to RX (UART 3)', 'TX bersilang ke RX (UART 3)')}</td></tr>
                <tr><td>{tr('FPV camera', 'Kamera FPV')}</td><td>5V · G · <Dot c={YELLOW} />VID</td><td>5V · G · CAM</td><td>{tr('Video goes in on CAM', 'Video masuk melalui CAM')}</td></tr>
                <tr><td>{tr('Video transmitter', 'Pemancar video')}</td><td>VIN · G · <Dot c={YELLOW} />VID</td><td><b>9V</b> · G · VTX</td><td>{tr('VTX runs on 9 V, not 5 V', 'VTX menggunakan 9 V, bukan 5 V')}</td></tr>
              </tbody>
            </table></div>
            <h3 className="sub-head">{tr('Model 2: CX-5 HD freestyle (21 wires)', 'Model 2: CX-5 gaya bebas HD (21 wayar)')}</h3>
            <p>{tr('Battery lead, capacitor, motors, ESC harness, receiver and GPS are wired as above. The analogue FPV camera and video transmitter are replaced by an HD camera and a digital VTX. The HD camera has no wires to the flight controller: its coax cable goes straight to the digital VTX.', 'Kabel bateri, kapasitor, motor, abah-abah ESC, penerima dan GPS didawaikan seperti di atas. Kamera FPV analog dan pemancar video digantikan dengan kamera HD dan VTX digital. Kamera HD tidak mempunyai wayar ke pengawal penerbangan: kabel sepaksinya terus ke VTX digital.')}</p>
            <div className="table-wrap" role="region" aria-label={tr('Wiring reference, model 2', 'Rujukan pendawaian, model 2')} tabIndex={0}><table>
              {WIRE_HEAD}
              <tbody>
                <tr><td>{tr('Digital VTX', 'VTX digital')}</td><td>VIN · G · <Dot c={GREEN} />TX · <Dot c={WHITE} />RX</td><td><b>9V</b> · G · <b>R2</b> · <b>T2</b></td><td>{tr('On-screen data over UART 2', 'Data pada skrin melalui UART 2')}</td></tr>
              </tbody>
            </table></div>
          </div>
        </section>

        <section id="motors">
          <div className="wrap">
            <div className="sec-head"><h2>{tr('Motor layout', 'Susun atur motor')}</h2><p>{tr('Seen from above, front at the top. Diagonal motors turn the same way, so their twisting forces cancel in a hover. In each lab, one motor chosen at random starts reversed. Students find it in the motor test.', 'Dilihat dari atas, hadapan di atas. Motor yang bertentangan secara pepenjuru berputar ke arah yang sama, jadi daya pulasnya saling membatalkan semasa melayang. Dalam setiap makmal, satu motor yang dipilih secara rawak bermula dalam keadaan terbalik. Pelajar mencarinya dalam ujian motor.')}</p></div>
            <div className="table-wrap" role="region" aria-label={tr('Motor layout', 'Susun atur motor')} tabIndex={0}><table>
              <thead><tr><th>Motor</th><th>{tr('Corner', 'Penjuru')}</th><th>{tr('Spins', 'Berputar')}</th><th>{tr('Propeller', 'Kipas')}</th></tr></thead>
              <tbody>
                {MOTORS.map(([m, corner, spin, prop]) => <tr key={m}><td>{m}</td><td>{corner}</td><td>{spin}</td><td>{prop}</td></tr>)}
              </tbody>
            </table></div>
            <p>{tr(<>This is <b>props in</b>, the default. Students can choose <b>props out</b> on the start screen: every motor is reversed (M1 and M4 counter-clockwise, M2 and M3 clockwise) and the lab’s layouts, motor test, mixer and quiz follow that choice.</>, <>Ini ialah <b>kipas masuk</b>, tetapan lalai. Pelajar boleh memilih <b>kipas keluar</b> pada skrin mula: setiap motor diterbalikkan (M1 dan M4 lawan arah jam, M2 dan M3 ikut arah jam) dan susun atur, ujian motor, pengadun dan kuiz makmal mengikut pilihan itu.</>)}</p>
          </div>
        </section>

        <section id="run">
          <div className="wrap prose">
            <h2>{tr('Running and hosting', 'Menjalankan dan mengehos')}</h2>
            <p>{tr('The lab is a website built with React and Vite. Students only need a modern browser; the 3D library and the fonts are bundled in, so nothing loads from other sites.', 'Makmal ini ialah laman web yang dibina dengan React dan Vite. Pelajar hanya memerlukan pelayar moden; pustaka 3D dan fon sudah disertakan, jadi tiada apa-apa dimuatkan dari laman lain.')}</p>
            <h3>{tr('On one computer', 'Pada satu komputer')}</h3>
            <p>{tr(<>Install <a href="https://nodejs.org">Node.js</a>, then in the project folder run:</>, <>Pasang <a href="https://nodejs.org">Node.js</a>, kemudian dalam folder projek jalankan:</>)}</p>
            <pre>{`npm install
npm run dev`}</pre>
            <p>{tr(<>Open the address it prints (for example <code>http://localhost:5173</code>).</>, <>Buka alamat yang dipaparkan (contohnya <code>http://localhost:5173</code>).</>)}</p>
            <h3>{tr('For a whole class', 'Untuk seluruh kelas')}</h3>
            <ol>
              <li>{tr(<>Run <code>npm run build</code>. The finished site is written to the <code>dist</code> folder.</>, <>Jalankan <code>npm run build</code>. Laman yang siap ditulis ke folder <code>dist</code>.</>)}</li>
              <li>{tr(<>Upload the contents of <code>dist</code> to any static host, for example Vercel, Netlify or GitHub Pages.</>, <>Muat naik kandungan <code>dist</code> ke mana-mana hos statik, contohnya Vercel, Netlify atau GitHub Pages.</>)}</li>
              <li>{tr(<>Share the address the host gives you, for example <code>{'https://<user>.github.io/DroneBuildLab/'}</code>.</>, <>Kongsi alamat yang diberikan oleh hos, contohnya <code>{'https://<user>.github.io/DroneBuildLab/'}</code>.</>)}</li>
            </ol>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap"><span>{tr('Drone Build Lab · Teacher guide', 'Drone Build Lab · Panduan guru')}</span><a href="lab.html">{tr('Open the lab', 'Buka makmal')} <Icon name="arrow" /></a></div>
      </footer>
    </>
  );
}
