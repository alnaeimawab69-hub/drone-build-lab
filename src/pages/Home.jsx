import SiteHeader from '../components/SiteHeader.jsx';
import Icon from '../components/Icon.jsx';
import { tr } from '../lang.js';
import lab3d from '../assets/img/lab-3d.png';
import wiringDiagram from '../assets/img/wiring-diagram.png';
import cadView from '../assets/img/cad-view.png';

const STAGES = [
  [tr('Build the frame', 'Bina rangka'), tr('Bottom plate, four arms, stack and aluminium standoffs, camera side plates and top plate. Arms take M3 × 10 screws; the top plate takes M3 × 6.', 'Plat bawah, empat lengan, tiang tindanan dan tiang aluminium, plat sisi kamera dan plat atas. Lengan menggunakan skru M3 × 10; plat atas menggunakan M3 × 6.')],
  [tr('Mount the components', 'Pasang komponen'), tr('Motors, ESC (electronic speed controller), flight controller with its arrow to the front, FPV camera, VTX (video transmitter), radio receiver, GPS module, capacitor and battery lead. Each part has its own fasteners.', 'Motor, ESC (pengawal kelajuan elektronik), pengawal penerbangan dengan anak panahnya ke depan, kamera FPV, VTX (pemancar video), penerima radio, modul GPS, kapasitor dan kabel bateri. Setiap bahagian mempunyai pengikatnya sendiri.')],
  [tr('Wire the electronics', 'Pendawaian elektronik'), tr('A wiring diagram like a real stack chart. Drag each wire end to its pad. TX (transmit) crosses to RX (receive), polarity matters, and 5 V and 9 V pads are not the same.', 'Rajah pendawaian seperti carta tindanan sebenar. Seret setiap hujung wayar ke padnya. TX (hantar) bersilang ke RX (terima), kekutuban penting, dan pad 5 V dan 9 V tidak sama.')],
  [tr('Power-up and motor test', 'Hidupkan kuasa dan uji motor'), tr('Fit and strap the LiPo battery. Confirm the propellers are off. Spin each motor and fix the reversed one by swapping two of its wires.', 'Pasang dan ikat bateri LiPo. Pastikan kipas telah ditanggalkan. Putarkan setiap motor dan betulkan yang terbalik dengan menukar dua wayarnya.')],
  [tr('Fit the propellers', 'Pasang kipas'), tr('CW (clockwise) propellers on CW motors, CCW on CCW. A mismatch would flip the drone, so it is caught before take-off.', 'Kipas CW (ikut arah jam) pada motor CW, CCW pada CCW. Ketidakpadanan akan menterbalikkan dron, jadi ia dikesan sebelum berlepas.')],
  [tr('Flight physics', 'Fizik penerbangan'), tr('Take off, pitch, roll and yaw. Thrust arrows, motor bars and airflow show how four motor speeds create all six degrees of freedom.', 'Berlepas, pitch, roll dan yaw. Anak panah tujahan, bar motor dan aliran udara menunjukkan bagaimana kelajuan empat motor menghasilkan keenam-enam darjah kebebasan.')],
  [tr('Knowledge check', 'Semakan pengetahuan'), tr('Questions on what was just built: 8 on the LX-250, 11 on the CX-5. Then a scored report that explains every mistake.', 'Soalan tentang apa yang baru dibina: 8 untuk LX-250, 11 untuk CX-5. Kemudian laporan bermarkah yang menerangkan setiap kesilapan.')],
];

const MODES = [
  ['learn', tr('Guided', 'Berpandu'), tr('Practice', 'Latihan'), tr('Green rings and pads show where each part, screw and wire goes. Every mistake comes with an explanation. “Show me” completes any stage as a demonstration.', 'Gelang dan pad hijau menunjukkan tempat setiap bahagian, skru dan wayar dipasang. Setiap kesilapan disertakan penerangan. “Tunjukkan” menyiapkan mana-mana peringkat sebagai demonstrasi.')],
  ['assess', tr('Scored', 'Bermarkah'), tr('Assessment', 'Penilaian'), tr('No hints, and a running timer. Wrong parts, screws and wires cost points. The report shows the score for each stage and lists what to review.', 'Tiada petunjuk, dan pemasa berjalan. Bahagian, skru dan wayar yang salah ditolak markah. Laporan menunjukkan markah bagi setiap peringkat dan menyenaraikan perkara untuk diulang kaji.')],
  ['explore', tr('Free', 'Bebas'), tr('Explore', 'Teroka'), tr('Start with the finished drone. Pull it apart in exploded view, read what each part does and how it connects, then fly it.', 'Mula dengan dron yang sudah siap. Leraikannya dalam paparan leraian, baca fungsi setiap bahagian dan bagaimana ia disambung, kemudian terbangkannya.')],
  ['moves', tr('3D animation', 'Animasi 3D'), tr('Movements', 'Pergerakan'), tr('Learn throttle, yaw, pitch and roll with a remote: on-screen sticks, the keyboard (WASD and arrow keys), a PS4 / PS5 controller by Bluetooth, or a USB radio or gamepad. Rotation axes, spin arrows, force arrows and motor bars show what each stick does. Ends with a short quiz.', 'Belajar throttle, yaw, pitch dan roll dengan alat kawalan jauh: kayu kawalan pada skrin, papan kekunci (WASD dan kekunci anak panah), alat kawalan PS4 / PS5 melalui Bluetooth, atau radio USB atau gamepad. Paksi putaran, anak panah putaran, anak panah daya dan bar motor menunjukkan fungsi setiap kayu. Diakhiri dengan kuiz ringkas.')],
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
  const openLab = <a className="btn primary" href="lab.html">{tr('Open the lab', 'Buka makmal')} <Icon name="arrow" /></a>;
  return (
    <>
      <SiteHeader current="index.html" />
      <main id="main">
        <section className="hero">
          <div className="wrap grid">
            <div>
              <div className="eyebrow">{tr('Digital lab · Drone fundamentals', 'Makmal digital · Asas dron')}</div>
              <h1>{tr('From bare carbon to first flight.', 'Daripada karbon kosong ke penerbangan pertama.')}</h1>
              <p className="lede">{tr('Students build a quadcopter in the browser: the LX-250, a 250 mm trainer quad, or the CX-5, a 5-inch HD freestyle FPV (first-person view) drone. The EX-9 enterprise drone is there to explore and fly. They screw the frame together, fasten every part with the right screw and solder 23–24 wires. They test motor direction, fit the propellers, then fly it to see how thrust creates each movement.', 'Pelajar membina sebuah quadcopter dalam pelayar web: LX-250, quad latihan 250 mm, atau CX-5, dron FPV (first-person view, pandangan orang pertama) gaya bebas HD 5 inci. Dron perusahaan EX-9 disediakan untuk diterokai dan diterbangkan. Mereka memasang rangka dengan skru, mengikat setiap bahagian dengan skru yang betul dan memateri 23–24 wayar. Mereka menguji arah putaran motor, memasang kipas, kemudian menerbangkannya untuk melihat bagaimana tujahan menghasilkan setiap pergerakan.')}</p>
              <div className="ctas">{openLab}</div>
              <ul className="facts" aria-label={tr('At a glance', 'Sepintas lalu')}><li><b>7</b> {tr('stages', 'peringkat')}</li><li><b>36</b> {tr('fasteners', 'pengikat')}</li><li><b>23–24</b> {tr('wires', 'wayar')}</li><li><b>3</b> {tr('drone models', 'model dron')}</li><li><b>4</b> {tr('activities', 'aktiviti')}</li><li>{tr('runs in any modern browser', 'berjalan dalam mana-mana pelayar moden')}</li></ul>
            </div>
            <div className="shot"><img src={lab3d} alt={tr('The finished quadcopter on the workbench in the 3D lab', 'Quadcopter yang sudah siap di atas meja kerja dalam makmal 3D')} width="1400" height="900" /></div>
          </div>
        </section>

        <section className="band" id="stages">
          <div className="wrap">
            <div className="sec-head"><div className="eyebrow">{tr('The build', 'Binaan')}</div><h2>{tr('Seven stages, in the order a real build happens', 'Tujuh peringkat, mengikut susunan binaan sebenar')}</h2><p>{tr('Each stage unlocks the next. A part cannot go on before the part it attaches to. The propellers always go on last, for safety.', 'Setiap peringkat membuka peringkat seterusnya. Sesuatu bahagian tidak boleh dipasang sebelum bahagian tempat ia dilekatkan. Kipas sentiasa dipasang paling akhir, demi keselamatan.')}</p></div>
            <ol className="stages">
              {STAGES.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}
            </ol>
          </div>
        </section>

        <section id="modes">
          <div className="wrap">
            <div className="sec-head"><div className="eyebrow">{tr('Four ways to use it', 'Empat cara menggunakannya')}</div><h2>{tr('Practise with hints, prove it without them, then explore and fly', 'Berlatih dengan petunjuk, buktikan tanpa petunjuk, kemudian teroka dan terbangkan')}</h2></div>
            <div className="modes">
              {MODES.map(([cls, tag, title, text]) => (
                <article key={cls} className={'mode ' + cls}><em>{tag}</em><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="band" id="views">
          <div className="wrap">
            <Feature eyebrow={tr('Wiring', 'Pendawaian')} title={tr('A wiring chart students can actually solder', 'Carta pendawaian yang benar-benar boleh dipateri oleh pelajar')} img={wiringDiagram} alt={tr('The 2D wiring diagram with flight controller, ESC and components', 'Rajah pendawaian 2D dengan pengawal penerbangan, ESC dan komponen')}>
              <li>{tr('Flight controller in the centre, every pad labelled, the other parts around it', 'Pengawal penerbangan di tengah, setiap pad berlabel, bahagian lain di sekelilingnya')}</li>
              <li>{tr('Wires drawn in their real colours with right-angle routing', 'Wayar dilukis dalam warna sebenar dengan laluan bersudut tegak')}</li>
              <li>{tr('A wrong pad flashes', 'Pad yang salah berkelip')} <span className="mark-bad">{tr('✕ WRONG', '✕ SALAH')}</span> {tr('and the wire stays unsoldered', 'dan wayar kekal tidak dipateri')}</li>
              <li>{tr('Switch to the 3D model at any time; both views stay in sync', 'Tukar ke model 3D pada bila-bila masa; kedua-dua paparan kekal selari')}</li>
            </Feature>
            <Feature eyebrow={tr('CAD view', 'Paparan CAD')} title={tr('Switch the model to a technical drawing', 'Tukar model kepada lukisan teknikal')} img={cadView} alt={tr('The drone in CAD view with dimension lines and a title block', 'Dron dalam paparan CAD dengan garisan dimensi dan blok tajuk')} flip>
              <li>{tr('Flat shading with black edge lines', 'Lorekan rata dengan garisan tepi hitam')}</li>
              <li>{tr('Dimension lines in millimetres: 250 mm wheelbase, 127 mm props, 30.5 mm stack', 'Garisan dimensi dalam milimeter: jarak roda 250 mm, kipas 127 mm, tindanan 30.5 mm')}</li>
              <li>{tr('Title block with units and material', 'Blok tajuk dengan unit dan bahan')}</li>
            </Feature>
          </div>
        </section>

        <section>
          <div className="wrap center">
            <h2>{tr('Ready to build?', 'Sedia untuk membina?')}</h2>
            <p className="lede">{tr('Works with a mouse or a touchscreen. Nothing to install, no account needed.', 'Boleh digunakan dengan tetikus atau skrin sentuh. Tiada apa-apa untuk dipasang, tiada akaun diperlukan.')}</p>
            {openLab}
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap"><span>{tr('Drone Build Lab · Digital lab for drone fundamentals', 'Drone Build Lab · Makmal digital untuk asas dron')}</span><span>{tr('Every part is modelled in code. No brand names, no imported 3D models.', 'Setiap bahagian dimodelkan dalam kod. Tiada nama jenama, tiada model 3D yang diimport.')}</span></div>
      </footer>
    </>
  );
}
