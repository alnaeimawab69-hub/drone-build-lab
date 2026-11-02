/* A small stroke icon set (24 px grid, 1.75 stroke, round caps) so every page uses the same icon style
   instead of mixed text glyphs. Icons are decorative: put the meaning in the text next to them. */
const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

export default function Icon({ name, className = '' }) {
  return (
    <svg className={`icon icon-${name} ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
