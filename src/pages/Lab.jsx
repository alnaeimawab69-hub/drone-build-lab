import { useEffect } from 'react';
import Logo from '../components/Logo.jsx';

/* The lab page shell. React renders the static layout once; the engine in src/lab/engine
   then finds these elements by id and drives them (panel, 3D view, diagram, overlays). */
export default function Lab() {
  useEffect(() => {
    // a module runs once, so this boots the engine a single time even when the effect re-runs
    import('../lab/engine/index.js');
  }, []);

  return (
    <>
      <div id="app">
        <header className="top">
          <a className="brand" href="index.html" title="Back to home">
            <Logo />
            <div><b>Drone Build Lab</b><small>Digital lab · 250 mm quad</small></div>
          </a>
          <ol className="steps" id="steps" aria-label="Build stages"></ol>
          <div className="meta" id="meta"></div>
        </header>
        <main>
          <aside id="panel" aria-live="polite"></aside>
          <section id="viewport" aria-label="3D workbench">
            <canvas id="c" tabIndex={0}></canvas>
            <div id="diagram" className="diagram" hidden></div>
            <div className="scale">Mat grid: 1 cm squares</div>
            <div id="labels"></div>
            <div id="toast" className="toast" role="status"></div>
            <div id="info" className="info" hidden></div>
            <div id="tblock" className="tblock" hidden>
              <b>LX-250 QUADCOPTER</b><span>General assembly</span>
              <dl>
                <dt>Units</dt><dd>mm</dd>
                <dt>Scale</dt><dd>NTS</dd>
                <dt>Material</dt><dd>Carbon fibre</dd>
                <dt>Drawn</dt><dd id="tbName">Student</dd>
              </dl>
            </div>
            <div className="viewbar" id="viewbar">
              <button className="btn sm ghost" id="btnLabels" aria-pressed="false">Labels</button>
              <button className="btn sm ghost" id="btnCad" aria-pressed="false">CAD lines</button>
              <button className="btn sm ghost" id="btnDiag" aria-pressed="true" hidden>Wiring diagram</button>
              <label id="explodeWrap">Exploded view <input type="range" id="explodeR" min="0" max="100" defaultValue="0" /></label>
              <button className="btn sm ghost" id="btnTop">Top view</button>
              <button className="btn sm ghost" id="btnReset">Reset view</button>
            </div>
          </section>
        </main>
      </div>
      <div id="tip"></div>
      <div id="overlay"></div>
    </>
  );
}
