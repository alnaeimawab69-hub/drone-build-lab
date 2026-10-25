import Logo from './Logo.jsx';

const LINKS = [
  ['index.html', 'Home'],
  ['lab.html', 'Open the lab'],
  ['guide.html', 'Teacher guide'],
];

/* top navigation for the home and guide pages; `current` is the href of the page being shown */
export default function SiteHeader({ current }) {
  return (
    <header className="nav">
      <div className="wrap">
        <a className="brand" href="index.html">
          <Logo />
          Drone Build Lab
        </a>
        <nav aria-label="Main">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} aria-current={href === current ? 'page' : undefined}>{label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
