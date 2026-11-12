import { useEffect } from 'react';
import Logo from '../components/Logo.jsx';
import { tr } from '../lang.js';

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
          <a className="brand" href="index.html" title={tr('Back to home', 'Kembali ke laman utama')}>
            <Logo />
            <div><b>Drone Build Lab</b><small>{tr('Digital lab · 250 mm quad', 'Makmal digital · quad 250 mm')}</small></div>
          </a>
          <ol className="steps" id="steps" aria-label={tr('Build stages', 'Peringkat binaan')}></ol>
          <div className="meta" id="meta"></div>
          <button className="btn sm ghost padbtn" id="btnPad" aria-haspopup="dialog"><span className="pdot" aria-hidden="true"></span>{tr('Controller', 'Alat kawalan')}</button>
        </header>
        <main>
          <aside id="panel" aria-live="polite"></aside>
          <section id="viewport" aria-label={tr('3D workbench', 'Meja kerja 3D')}>
            <canvas id="c" tabIndex={0}></canvas>
            <div id="diagram" className="diagram" hidden></div>
            <div className="scale">{tr('Mat grid: 1 cm squares', 'Grid alas: petak 1 cm')}</div>
            <div id="labels"></div>
            <div id="toast" className="toast" role="status"></div>
            <div id="info" className="info" hidden></div>
            <div id="tblock" className="tblock" hidden>
              <b>LX-250 QUADCOPTER</b><span>{tr('General assembly', 'Pemasangan am')}</span>
              <dl>
                <dt>{tr('Units', 'Unit')}</dt><dd>mm</dd>
                <dt>{tr('Scale', 'Skala')}</dt><dd>{tr('NTS', 'Tidak ikut skala')}</dd>
                <dt>{tr('Material', 'Bahan')}</dt><dd>{tr('Carbon fibre', 'Gentian karbon')}</dd>
                <dt>{tr('Drawn', 'Dilukis')}</dt><dd>{tr('Student', 'Pelajar')}</dd>
              </dl>
            </div>
            <div className="viewbar" id="viewbar" role="toolbar" aria-label={tr('View', 'Paparan')}>
              <button className="btn sm ghost" id="btnLabels" aria-pressed="false">{tr('Labels', 'Label')}</button>
              <button className="btn sm ghost" id="btnCad" aria-pressed="false">{tr('CAD lines', 'Garisan CAD')}</button>
              <button className="btn sm ghost" id="btnDiag" aria-pressed="true" hidden>{tr('Wiring diagram', 'Rajah pendawaian')}</button>
              <label id="explodeWrap">{tr('Exploded view', 'Paparan leraian')} <input type="range" id="explodeR" min="0" max="100" defaultValue="0" /></label>
              <button className="btn sm ghost" id="btnTop">{tr('Top view', 'Pandangan atas')}</button>
              <button className="btn sm ghost" id="btnReset">{tr('Reset view', 'Set semula paparan')}</button>
            </div>
          </section>
        </main>
      </div>
      <dialog id="padDlg" className="paddlg" aria-labelledby="padDlgT"></dialog>
      <div id="tip"></div>
      <div id="overlay"><div className="loading" role="status">{tr('Loading the lab…', 'Memuatkan makmal…')}</div></div>
    </>
  );
}
