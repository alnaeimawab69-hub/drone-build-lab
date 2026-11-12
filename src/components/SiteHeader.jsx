import Logo from './Logo.jsx';
import LangSwitch from './LangSwitch.jsx';
import { tr } from '../lang.js';

/* the teacher guide is deliberately not linked: it holds the assessment answers */
const LINKS = [
  ['index.html', tr('Home', 'Laman utama')],
];

/* top navigation for the home and guide pages; `current` is the href of the page being shown */
export default function SiteHeader({ current }) {
  return (
    <>
      <a className="skip" href="#main">{tr('Skip to content', 'Langkau ke kandungan')}</a>
      <header className="nav">
        <div className="wrap">
          <a className="brand" href="index.html">
            <Logo />
            Drone Build Lab
          </a>
          <nav aria-label={tr('Main', 'Utama')}>
            {LINKS.map(([href, label]) => (
              <a key={href} href={href} aria-current={href === current ? 'page' : undefined}>{label}</a>
            ))}
            <LangSwitch />
            <a className="nav-cta" href="lab.html">{tr('Open the lab', 'Buka makmal')}</a>
          </nav>
        </div>
      </header>
    </>
  );
}
